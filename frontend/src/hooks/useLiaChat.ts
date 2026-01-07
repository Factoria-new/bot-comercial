import { useState, useRef, useCallback } from "react";
import { useTTS } from "@/hooks/useTTS";
import { useOnboarding } from "@/hooks/useOnboarding";
import { getRandomAudio } from "@/lib/audioMappings";

interface LiaChatProps {
    chatState: any; // Ideally this should be typed from useOnboarding
    startOnboarding: any;
    handleUserInput: any;
    addUserMessage: any;
    sendMessageToLia: any;
    setAgentPrompt: any;
    startTesting: any;
    isProcessing: boolean;
    stopTTS: () => void;
    resumeContext: () => void;
    stopIntegrationAudio: () => void;
    playIntegrationAudio: (path: string, delay?: number) => void;
    setIsWizardOpen: (isOpen: boolean) => void;
    setChatMode: (mode: 'lia' | 'agent') => void;
    chatMode: 'lia' | 'agent';
}

export const useLiaChat = ({
    chatState,
    startOnboarding,
    handleUserInput,
    addUserMessage,
    sendMessageToLia,
    setAgentPrompt,
    startTesting,
    isProcessing,
    stopTTS,
    resumeContext,
    stopIntegrationAudio,
    playIntegrationAudio,
    setIsWizardOpen,
    setChatMode,
    chatMode
}: LiaChatProps) => {

    const [displayText, setDisplayText] = useState("");
    const [isVisible, setIsVisible] = useState(false);

    // Internal refs
    const pendingDisplayTextRef = useRef<string>("");
    const playbackQueue = useRef<string[]>([]);
    const processingQueue = useRef(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { speak } = useTTS();

    // Stream Processor
    const processCompleteStream = useCallback(async () => {
        if (processingQueue.current || playbackQueue.current.length === 0) return;

        processingQueue.current = true;
        const chunks = [...playbackQueue.current];
        const fullAudioText = chunks.join(' ');

        try {
            stopIntegrationAudio(); // Stop any background effects before speaking
            await speak(fullAudioText, 'Kore', {
                onStart: () => {
                    if (pendingDisplayTextRef.current) {
                        setIsVisible(false);
                        setDisplayText(pendingDisplayTextRef.current);
                    }
                },
                onProgress: (progress) => {
                    if (progress > 0.7 && !isVisible && pendingDisplayTextRef.current) {
                        setIsVisible(true);
                    }
                },
                onData: () => { }
            });
        } catch (error) {
            console.error("Error processing stream audio:", error);
        } finally {
            processingQueue.current = false;
            playbackQueue.current = [];
            setIsVisible(true);
            pendingDisplayTextRef.current = "";
        }
    }, [speak, isVisible, stopIntegrationAudio]);


    // Manual Input Handler
    const handleManualInput = async (text: string) => {
        if (!text.trim() || chatState.isTyping || isProcessing) return;

        resumeContext();
        playbackQueue.current = [];
        stopTTS();
        stopIntegrationAudio(); // Ensure silence before new interaction

        const handleResponse = (chunk: any) => {
            if (chunk.type === 'audio') {
                // SERVER-SIDE AUDIO FOUND! Play directly.
                console.log("🔊 Received Server-Side Audio!");

                const audioData = chunk.content;
                // Create blob from base64
                const binaryString = window.atob(audioData.content);
                const len = binaryString.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const blob = new Blob([bytes], { type: audioData.mimeType || 'audio/wav' });
                const audioUrl = URL.createObjectURL(blob);

                stopIntegrationAudio(); // Stop background effects before server audio
                speak("", 'Kore', {
                    audioUrl: audioUrl,
                    onStart: () => setIsVisible(true)
                }).catch(console.error);

            } else if (chunk.type === 'text') {
                const fullText = chunk.content;

                if (fullText.includes('<OPEN_MODAL') || fullText.includes('<OPEN_WIZARD')) {
                    const cleanText = fullText.replace(/<OPEN_(MODAL|WIZARD)[^>]*\/>/g, '').replace(/<[^>]*>/g, '').trim();
                    setDisplayText(cleanText);
                    setIsWizardOpen(true);
                    return;
                }

                const cleanText = fullText.replace(/<[^>]*>/g, '').trim();
                setDisplayText(cleanText);
                setIsVisible(false);
            }
        };

        if (chatMode === 'lia' && chatState.step === 'testing') {
            addUserMessage(text);
            await sendMessageToLia(text, handleResponse);
        } else if (chatState.messages.length > 0) {
            await handleUserInput(text, handleResponse);
        } else {
            await startOnboarding(text, handleResponse);
        }
    };

    // File Upload Handler
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        event.target.value = ''; // Reset input

        const formData = new FormData();
        formData.append('file', file);

        try {
            setDisplayText("Lendo arquivo...");
            setIsVisible(true);

            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3003';

            const response = await fetch(`${backendUrl}/api/agent/upload-prompt`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success && data.text) {
                console.log("📄 Prompt uploaded:", data.text.substring(0, 100) + "...");

                const promptText = data.text;
                const audioVariation = getRandomAudio('upload_success');

                setAgentPrompt(promptText);

                setTimeout(async () => {
                    if (audioVariation.path) {
                        playIntegrationAudio(audioVariation.path);
                    }

                    setDisplayText(audioVariation.text);
                    setIsVisible(true);

                    setTimeout(() => {
                        if (chatState.agentConfig?.prompt) {
                            console.log("✅ Automatic prompt detection from hook!");
                            setChatMode('agent');

                            if (chatState.testMessages.length === 0) {
                                startTesting();
                            }
                        }
                    }, 1500);
                }, 1200);

            } else {
                setDisplayText("Erro ao ler arquivo. Tente novamente.");
                console.error("Upload error:", data.error);
            }
        } catch (error) {
            console.error("Upload failed:", error);
            setDisplayText("Falha no upload.");
        }
    };

    return {
        displayText,
        setDisplayText,
        isVisible,
        setIsVisible,
        fileInputRef,
        handleManualInput,
        handleFileUpload,
        pendingDisplayTextRef,
        playbackQueue
    };
};
