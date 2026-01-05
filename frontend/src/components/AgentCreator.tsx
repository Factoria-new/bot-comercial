"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    Menu,
    Sparkles,
    Loader2,
    ArrowRight,
    Upload,
    MessageCircle,
    FlaskConical,
    Check,
    X,
    LogOut
} from "lucide-react";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useTTS } from "@/hooks/useTTS";
import { useGeminiLive } from "@/hooks/useGeminiLive";
import { WizardModal } from "./WizardModal";
import ChatMessages from "./chat/ChatMessages"; // NEW: For Lia's chat in split mode // NEW COMPONENT
import { getSchemaForNiche, NicheSchema, NICHE_SCHEMAS } from "@/lib/nicheSchemas";
import { getRandomAudio, AudioTriggerType } from "@/lib/audioMappings";
import { useWhatsAppInstances } from "@/hooks/useWhatsAppInstances";

interface AgentCreatorProps {
    onOpenSidebar?: () => void;
    isExiting?: boolean;
    onStartChat?: (prompt: string) => void;
}

export default function AgentCreator({ onOpenSidebar, isExiting, onStartChat }: AgentCreatorProps) {

    // --- WIZARD STATE ---
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [wizardStep, setWizardStep] = useState(0); // 0 = Niche Selection
    const [currentSchema, setCurrentSchema] = useState<NicheSchema | null>(null);
    const [wizardData, setWizardData] = useState<Record<string, any>>({});

    // Fixed: Restored voiceMode state to prevent ReferenceError
    const [voiceMode, setVoiceMode] = useState(false);

    const [testMode, setTestMode] = useState(false);
    const [testMessages, setTestMessages] = useState<Array<{ id: string, type: 'bot' | 'user', content: string }>>([]);
    const [isTestTyping, setIsTestTyping] = useState(false);

    // NEW: Unified chat mode - 'lia' to talk to Lia, 'agent' to test the agent
    const [chatMode, setChatMode] = useState<'lia' | 'agent'>('lia');
    const [showTestButton, setShowTestButton] = useState(false);

    // NEW: Loading state for transition
    const [isSwitchingToTest, setIsSwitchingToTest] = useState(false);
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

    const loadingMessages = [
        "Criando Assistente...",
        "Analisando perfil do negócio...",
        "Definindo tom de voz ideal...",
        "Gerando estratégias de conversão...",
        "Configurando diretrizes de segurança...",
        "Finalizando configurações..."
    ];


    const [currentStep, setCurrentStep] = useState<'chat' | 'integrations' | 'dashboard'>('chat');
    const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);

    // NEW: Local state for integration audio level
    const [integrationVoiceLevel, setIntegrationVoiceLevel] = useState(0);

    const [displayText, setDisplayText] = useState("");
    const [isVisible, setIsVisible] = useState(false);
    const pendingDisplayTextRef = useRef<string>("");

    const playbackQueue = useRef<string[]>([]);
    const processingQueue = useRef(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const integrationAudioRef = useRef<HTMLAudioElement | null>(null);

    // Chat state is still needed for backend logic but UI is hidden
    const {
        state: chatState,
        startOnboarding,
        handleUserInput,
        setAgentPrompt,
        startTesting,
        addBotMessage,
        sendMessageToLia,
        addUserMessage
    } = useOnboarding();

    const { speak, stop: stopTTS, resumeContext, voiceLevel: ttsVoiceLevel } = useTTS();
    const {
        sendLiveMessage,
        isPlaying: isLivePlaying,
        isProcessing,
        isRecording,
        isSpeaking,
        voiceLevel: liveVoiceLevel,
        startContinuousRecording,
        stopContinuousRecording
    } = useGeminiLive();

    // WhatsApp connection hook for Baileys integration
    const {
        instances: whatsappInstances,
        handleGenerateQR,
        modalState: whatsappModalState,
        closeModal: closeWhatsappModal,
        handleDisconnect
    } = useWhatsAppInstances();

    // Platform integrations data - WhatsApp status is dynamic from Baileys connection
    const isWhatsAppConnected = whatsappInstances[0]?.isConnected || false;
    const integrations = [
        { id: 'whatsapp', name: 'WhatsApp', color: '#25D366', connected: isWhatsAppConnected },
        { id: 'instagram', name: 'Instagram', color: '#E4405F', connected: false },
        { id: 'facebook', name: 'Facebook', color: '#1877F2', connected: false },
        { id: 'twitter', name: 'Twitter / X', color: '#000000', connected: false },
        { id: 'tiktok', name: 'TikTok', color: '#010101', connected: false },
    ];

    const voiceLevel = Math.max(liveVoiceLevel, ttsVoiceLevel, integrationVoiceLevel);

    // Sync test mode from onboarding state
    useEffect(() => {
        if (chatState.step === 'testing') {
            setTestMode(true);
        }
    }, [chatState.step]);

    // NEW: Cycle messages continuously while switching to test (waiting for backend)
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isSwitchingToTest) {
            // Cycle every 3.5 seconds to cover approx 20s with 6 messages
            interval = setInterval(() => {
                setLoadingMessageIndex(prev => {
                    const next = prev + 1;
                    // Stop at the last message until done
                    return next < loadingMessages.length ? next : prev;
                });
            }, 3500);
        } else {
            setLoadingMessageIndex(0);
        }
        return () => clearInterval(interval);
    }, [isSwitchingToTest]);

    // NEW: Auto-switch to Test Chat when agent is created (Hubost check)
    useEffect(() => {
        if (chatState.agentCreated && chatState.agentConfig?.prompt) {
            console.log("🚀 Agent created detected! Switching to Test Mode.");

            if (isSwitchingToTest) {
                // Agent is ready. Give a small buffer to read the current message or show "Ready"?
                // Let's just switch immediately or after a short delay to feel natural
                setTimeout(() => {
                    setChatMode('agent');
                    setIsSwitchingToTest(false);
                }, 1000);
            } else {
                setChatMode('agent');
            }

            // Ensure we initialize the test conversation if empty
            if (chatState.testMessages.length === 0) {
                startTesting();
            }
        }
    }, [chatState.agentCreated, chatState.agentConfig, startTesting, chatState.testMessages.length, isSwitchingToTest]);

    // Play audio when entering integrations screen - with cleanup and Animation
    useEffect(() => {
        let animationFrameId: number;
        let audioContext: AudioContext | null = null;
        let analyser: AnalyserNode | null = null;
        let source: MediaElementAudioSourceNode | null = null;

        if (currentStep === 'integrations') {
            const audioVariation = getRandomAudio('integrations_success');

            // Play directly
            if (audioVariation.path) {
                try {
                    // Stop any previous audio
                    if (integrationAudioRef.current) {
                        integrationAudioRef.current.pause();
                        integrationAudioRef.current.currentTime = 0;
                    }

                    const audio = new Audio(audioVariation.path);
                    integrationAudioRef.current = audio;

                    // Setup Audio Context for Animation
                    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                    analyser = audioContext.createAnalyser();
                    analyser.fftSize = 256;

                    // Connect audio element to context
                    // We need to wait for metadata or user interaction usually, but let's try
                    source = audioContext.createMediaElementSource(audio);
                    source.connect(analyser);
                    analyser.connect(audioContext.destination);

                    const dataArray = new Uint8Array(analyser.frequencyBinCount);

                    const updateVolume = () => {
                        if (analyser) {
                            analyser.getByteFrequencyData(dataArray);
                            const avg = dataArray.reduce((p, c) => p + c, 0) / dataArray.length;
                            // Normalize to 0-1 range roughly
                            const normalizedVolume = Math.min(avg / 128, 1);
                            setIntegrationVoiceLevel(normalizedVolume); // Update the local state
                            animationFrameId = requestAnimationFrame(updateVolume);
                        }
                    };

                    audio.play().then(() => {
                        updateVolume();
                    }).catch(e => {
                        console.error("Audio play/context error:", e);
                        // Fallback just play if context fails (e.g. strict policies)
                        audio.play().catch(console.error);
                    });

                } catch (e) {
                    console.error("Audio error:", e);
                }
            }
        }

        // Cleanup function to stop audio when leaving this step/effect
        return () => {
            if (integrationAudioRef.current) {
                integrationAudioRef.current.pause();
                integrationAudioRef.current.currentTime = 0;
            }
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
            if (audioContext) {
                audioContext.close().catch(console.error);
            }
            setIntegrationVoiceLevel(0); // Reset visual
        };
    }, [currentStep]);

    // --- WIZARD HANDLERS ---

    // const handleNicheSelect = (nicheId: string) => {
    //     const schema = getSchemaForNiche(nicheId);
    //     setCurrentSchema(schema);
    //     setWizardStep(1); // Move to first form step
    //
    //     // Optional: Trigger AI to say something specific to the niche
    //     handleManualInput(`[SYSTEM] Usuário selecionou o nicho: ${schema.title}. Inicie o cadastro.`);
    // };

    const handleWizardComplete = () => {
        setIsWizardOpen(false);
        // Compile final data
        const finalPayload = {
            _niche_id: currentSchema?.id,
            _niche_title: currentSchema?.title,
            ...wizardData
        };
        console.log("🎉 Wizard Complete! Payload:", finalPayload);

        // Notify AI with explicit instruction to finish immediately
        const summary = Object.entries(finalPayload)
            .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
            .join('\n');

        // Trigger loading screen immediately
        setIsSwitchingToTest(true);

        handleManualInput(`[SYSTEM] Cadastro finalizado com sucesso! Dados:\n${summary}\n\n[FORCE_COMPLETION]`);
    };

    // --- AI & PROCESSING LOGIC ---

    const processCompleteStream = useCallback(async () => {
        if (processingQueue.current || playbackQueue.current.length === 0) return;

        processingQueue.current = true;
        const chunks = [...playbackQueue.current];
        const fullAudioText = chunks.join(' ');

        try {
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
    }, [speak, isVisible]);

    const handleChunk = useCallback((chunk: { type: 'text' | 'display_text' | 'prompt' | 'error' | 'complete' | 'audio', content: string }) => {
        if (chunk.type === 'display_text') {
            // Check for Commands (e.g. <OPEN_WIZARD>)
            if (chunk.content.includes('<OPEN_MODAL') || chunk.content.includes('<OPEN_WIZARD')) {
                setIsWizardOpen(true);
                chunk.content = chunk.content.replace(/<OPEN_(MODAL|WIZARD)[^>]*\/>/g, '').trim();
            }

            pendingDisplayTextRef.current = chunk.content;
            setDisplayText(chunk.content);
            setIsVisible(false);
        } else if (chunk.type === 'text') {
            if (chunk.content.includes('<OPEN_MODAL') || chunk.content.includes('<OPEN_WIZARD')) {
                setIsWizardOpen(true);
                chunk.content = chunk.content.replace(/<OPEN_(MODAL|WIZARD)[^>]*\/>/g, '').trim();
                return;
            }
            playbackQueue.current.push(chunk.content);
        } else if (chunk.type === 'prompt' || chunk.type === 'complete') {
            processCompleteStream();
        }
    }, [processCompleteStream]);


    // Helper to send message to AI
    const handleManualInput = async (text: string) => {
        if (!text.trim() || chatState.isTyping || isProcessing) return;

        resumeContext();
        playbackQueue.current = [];
        stopTTS();

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

                // We pause the "text speak" if it was queued, but since we receive text first maybe we should coordinate?
                // Actually if we get audio, we should prioritization it. 
                // But text usually comes first.
                // Let's rely on the fact that if we provide audioUrl, speak() handles it.
                // We might need to make sure the text chunk didn't already trigger a speak call.
                // Since this is all in one callback chain...

                // Ideally useOnboarding sends text then audio.
                // In handleResponse for text, we set display text.
                // In handleResponse for audio, we play audio.

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
                    // Do NOT call speak() here
                    return;
                }

                const cleanText = fullText.replace(/<[^>]*>/g, '').trim();
                setDisplayText(cleanText);
                setIsVisible(false);

                // Wait a bit to see if audio comes? No, that introduces latency.
                // BUT, if we have server-side audio, we DON'T want to call speak(fullText).
                // How do we know? We don't until we check the response.
                // HACK: For now, we only speak text if it's NOT likely to have audio?
                // Or better: The server ALWAYS returns audio now for this endpoint.
                // So... we should probably DISABLE client-side TTS for the 'architect' response if we expect audio.

                // However, handleResponse is generic.
                // Let's assume: If we get text, we display it. We DO NOT speak it yet.
                // We wait for audio? NO that blocks text.

                // Solution: We play the text using client-side TTS ONLY if we don't expect server audio.
                // But we moved to server audio. So we should effectively disable client-side TTS for this flow.
                // We only invoke speak() when we get the `audio` chunk.

                // What if server audio fails? The server logs it but returns success.
                // In that case strictly we lose audio.

                // Refined approach:
                // We can't know in the 'text' chunk if 'audio' is coming next without flags.
                // But we know we just implemented it. 
                // Let's COMMENT OUT the speak(fullText) call and rely on the audio chunk.

                // speak(fullText, 'Kore', {
                //    onStart: () => setIsVisible(true)
                // }).catch(console.error);
            }
        };

        // NEW: Check if we are in 'Lia' mode explicitly to bypass step logic
        // If chatState.step is 'testing', handleUserInput would route to Agent Chat.
        // But if we are in chatMode='lia', we WANT to talk to the Architect.
        if (chatMode === 'lia' && chatState.step === 'testing') {
            // Explicitly use the Architect endpoint
            addUserMessage(text); // Add user message to UI immediately
            await sendMessageToLia(text, handleResponse);
        } else if (chatState.messages.length > 0) {
            await handleUserInput(text, handleResponse);
        } else {
            await startOnboarding(text, handleResponse);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Reset input so validation can trigger again if same file selected
        event.target.value = '';

        const formData = new FormData();
        formData.append('file', file);

        try {
            setDisplayText("Lendo arquivo...");
            setIsVisible(true);

            // Use the configured backend URL if available, or localhost default
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3003';

            const response = await fetch(`${backendUrl}/api/agent/upload-prompt`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success && data.text) {
                console.log("📄 Prompt uploaded:", data.text.substring(0, 100) + "...");

                const promptText = data.text;

                // Get random audio for upload success
                const audioVariation = getRandomAudio('upload_success');

                // Set prompt
                setAgentPrompt(promptText);

                // Add delay before speaking (1.2s)
                setTimeout(async () => {
                    // Add text to chat history directly
                    await addBotMessage(audioVariation.text);

                    // Manually play the audio file
                    if (audioVariation.path) {
                        try {
                            const audio = new Audio(audioVariation.path);
                            audio.play().catch(e => console.error("Audio play error:", e));
                        } catch (e) {
                            console.error("Audio error:", e);
                        }
                    }

                    // Update display text for big letters
                    setDisplayText(audioVariation.text);
                    setIsVisible(true);

                    // Show test button and enable test mode after audio starts
                    setTimeout(() => {
                        if (chatState.agentConfig?.prompt) {
                            console.log("✅ Automatic prompt detection from hook!");
                            // Auto-switch to test mode primarily
                            setChatMode('agent');

                            // If we haven't started testing yet (no welcome message), start it
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

    // --- TEST MODE HANDLERS ---
    // (Used only inside Test Mode UI)
    const handleTestSend = async (message: string) => { // Refactored to accept arg
        if (!message.trim() || isTestTyping) return;
        resumeContext();
        const userMsg = { id: Math.random().toString(36).substring(2, 9), type: 'user' as const, content: message };

        // Append user message to history immediately
        const updatedMessages = [...testMessages, userMsg];
        setTestMessages(updatedMessages);
        setIsTestTyping(true);

        try {
            // Convert testMessages to history format for the API
            const history = updatedMessages.map(msg => ({
                role: msg.type === 'user' ? 'user' : 'model',
                content: msg.content
            }));

            const res = await fetch('http://localhost:3003/api/agent/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: message,
                    systemPrompt: chatState.agentConfig?.prompt || '',
                    history: history // Include conversation history
                })
            });
            const data = await res.json();
            if (data.success) {
                const botMsg = { id: Math.random().toString(36).substring(2, 9), type: 'bot' as const, content: data.message };
                setTestMessages(prev => [...prev, botMsg]);
            }
        } catch (error) {
            console.error('Test chat error:', error);
            const botMsg = { id: Math.random().toString(36).substring(2, 9), type: 'bot' as const, content: "Erro ao conectar com o assistente de teste." };
            setTestMessages(prev => [...prev, botMsg]);
        } finally {
            setIsTestTyping(false);
        }
    };


    return (
        <div className="min-h-screen relative flex flex-col p-4 overflow-hidden text-white font-outfit bg-[#020617]">
            {/* Animations Styles */}
            <style>{`
                @keyframes floatOrganic1 {
                    0%, 100% { transform: translate(-50%, -50%) scale(1); }
                    50% { transform: translate(-50%, -50%) translate(2%, -2%) scale(1.05); }
                }
            `}</style>

            {/* Absolute Menu Button */}
            <div className="absolute top-4 left-4 z-50">
                <Button variant="ghost" size="icon" onClick={onOpenSidebar} className="text-white/70 hover:bg-white/10">
                    <Menu className="w-6 h-6" />
                </Button>
            </div>

            {/* Background Layer */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[50%] left-[50%] w-[100vw] h-[100vh] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#020617] to-black translate-x-[-50%] translate-y-[-50%]" />

                {/* Aurora blobs reacting to voice */}
                <div
                    className="absolute top-[30%] left-[50%] w-[60vw] h-[60vh] mix-blend-screen opacity-40 blur-[80px] rounded-full bg-purple-600 transition-all duration-100 ease-out"
                    style={{ transform: `translate(-50%, -50%) scale(${1 + voiceLevel * 1})` }}
                />
                <div
                    className="absolute top-[60%] left-[60%] w-[50vw] h-[50vh] mix-blend-screen opacity-30 blur-[90px] rounded-full bg-blue-600 transition-all duration-200 ease-out"
                    style={{ transform: `translate(-50%, -50%) scale(${1 + voiceLevel * 0.8})` }}
                />
            </div>

            {/* Content Layer */}
            <div className="relative z-10 w-full max-w-6xl mx-auto flex-1 flex flex-col" >

                {/* Header / Menu - Cleaned up from here */}

                {/* --- MAIN MAIN AREA --- */}
                <div className="flex-1 flex flex-col items-center justify-center relative min-h-[60vh]">

                    {/* LOADING OVERLAY - Minimal Version */}
                    {/* LOADING OVERLAY - Enhanced Version */}
                    <AnimatePresence>
                        {isSwitchingToTest && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-[60] flex flex-col items-center justify-center p-0 m-0"
                                style={{ background: 'transparent', backgroundColor: 'transparent', boxShadow: 'none' }}
                            >
                                <div className="flex flex-col items-center justify-center">
                                    <div className="w-16 h-16 mb-6 relative">
                                        <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-purple-500 animate-spin" />
                                        <div className="absolute inset-2 rounded-full border-t-2 border-l-2 border-blue-500 animate-spin reverse duration-2000" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
                                        </div>
                                    </div>

                                    <AnimatePresence mode="wait">
                                        <motion.p
                                            key={loadingMessageIndex}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="text-lg font-medium text-white text-center min-h-[30px]"
                                            style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
                                        >
                                            {loadingMessages[loadingMessageIndex]}
                                        </motion.p>
                                    </AnimatePresence>

                                    <p className="text-xs text-white/40 mt-2">Isso pode levar alguns segundos</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* 1. LIA'S PRESENCE (When Wizard is CLOSED or secondary or NOT switching) */}
                    <AnimatePresence>
                        {(!isWizardOpen && !testMode && !isSwitchingToTest) && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-center max-w-2xl mb-12"
                            >
                                <h1 className={cn(
                                    "text-4xl md:text-6xl font-bold tracking-tighter mb-6 transition-all duration-500",
                                    !isVisible ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
                                )}>
                                    {displayText || "Olá! Vamos criar seu assistente."}
                                </h1>

                                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                    <Button
                                        onClick={() => {
                                            setCurrentSchema(NICHE_SCHEMAS.general);
                                            setWizardStep(1);
                                            setIsWizardOpen(true);
                                        }}
                                        className="bg-white text-black hover:bg-gray-200 text-lg px-8 py-6 rounded-full font-medium shadow-lg hover:shadow-xl transition-all hover:scale-105"
                                    >
                                        <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
                                        Iniciar Criação
                                    </Button>

                                    <Button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="bg-white/10 text-white hover:bg-white/20 text-lg px-8 py-6 rounded-full font-medium shadow-lg hover:shadow-xl transition-all hover:scale-105 backdrop-blur-sm border border-white/10"
                                    >
                                        <Upload className="w-5 h-5 mr-2" />
                                        Upload do Prompt
                                    </Button>

                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        accept=".txt,.pdf,.docx"
                                        className="hidden"
                                    />
                                </div>

                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* 2. WIZARD MODAL (The Main Actor) */}
                    <WizardModal
                        open={isWizardOpen}
                        step={wizardStep}
                        schema={currentSchema}
                        data={wizardData}
                        onDataUpdate={setWizardData}
                        onStepChange={setWizardStep}
                        onComplete={handleWizardComplete}
                        voiceActive={voiceMode} // Still pass it even if voice controls hidden, in case used inside
                    />

                    {/* 3. UNIFIED CHAT MODE */}
                    {testMode && currentStep === 'chat' && (
                        <div className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500 pb-4">

                            {chatMode === 'lia' ? (
                                /* LIA MODE - Chat Interface for Adjustments */
                                <div className="w-full h-[85vh] flex flex-col">
                                    <div className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col shadow-2xl overflow-hidden relative">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-50" />

                                        {/* Toggles Header */}
                                        <div className="flex justify-center mb-4 bg-black/20 p-1 rounded-xl w-fit mx-auto">
                                            <button
                                                className="px-4 py-1.5 rounded-lg text-sm font-medium bg-emerald-600 text-white shadow-lg"
                                            >
                                                Falar com Lia
                                            </button>
                                            <button
                                                onClick={() => setChatMode('agent')}
                                                className="px-4 py-1.5 rounded-lg text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition-all"
                                            >
                                                Testar Assistente
                                            </button>
                                        </div>

                                        {/* Header */}
                                        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/5">
                                            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xl">
                                                L
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-white">Lia</h3>
                                                <p className="text-xs text-white/40">Arquiteta de Assistentes</p>
                                            </div>
                                        </div>

                                        {/* Chat Messages */}
                                        <ChatMessages
                                            messages={chatState.messages.filter(m => {
                                                if (m.content.startsWith('[SYSTEM]')) return false;
                                                // Filter out "Assistente criado..." if there are user messages (ignoring HIDDEN prompts info)
                                                // Actually, simpler: if the user has sent ANY message, hide the "Assistente criado" welcome.
                                                // Identify user interaction:
                                                const hasUserInteraction = chatState.messages.some(msg => msg.type === 'user');

                                                if (hasUserInteraction && m.content.includes("Assistente criado! Iniciando modo de teste")) {
                                                    return false;
                                                }
                                                return true;
                                            })}
                                            isTyping={chatState.isTyping}
                                            alignLeft={true}
                                            className="px-0"
                                        />

                                        {/* Input Area */}
                                        <div className="mt-4 flex gap-2">
                                            <textarea
                                                placeholder="Peça ajustes ao seu assistente (ex: 'Mude o tom para mais formal', 'Adicione informação sobre preços')..."
                                                className="flex-1 bg-black/20 border border-white/10 resize-none min-h-[50px] rounded-xl p-3 text-white focus:outline-none focus:border-white/30 transition-all"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        const value = e.currentTarget.value.trim();
                                                        if (value) {
                                                            handleManualInput(value);
                                                            e.currentTarget.value = '';
                                                        }
                                                    }
                                                }}
                                            />
                                            <Button
                                                size="icon"
                                                className="h-[50px] w-[50px] rounded-xl bg-emerald-600 hover:bg-emerald-500"
                                                onClick={(e) => {
                                                    // Helper to find textarea sibling and submit
                                                    const textarea = e.currentTarget.previousElementSibling as HTMLTextAreaElement;
                                                    if (textarea && textarea.value.trim()) {
                                                        handleManualInput(textarea.value.trim());
                                                        textarea.value = '';
                                                    }
                                                }}
                                            >
                                                <ArrowRight className="w-5 h-5" />
                                            </Button>
                                        </div>

                                        {/* Finalizar Teste Button (Requirement #2) */}
                                        <Button
                                            onClick={() => setCurrentStep('integrations')}
                                            className="w-full bg-white/5 hover:bg-white/10 text-emerald-400 border border-emerald-500/30 rounded-xl py-3 mt-3 text-sm"
                                        >
                                            <Check className="w-4 h-4 mr-2" />
                                            Finalizar e Integrar
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                /* AGENT TEST MODE - Chat box for testing */
                                <div className="w-full h-[85vh] flex flex-col">
                                    <div className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col shadow-2xl overflow-hidden relative">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500 opacity-50" />

                                        {/* Toggles Header */}
                                        <div className="flex justify-center mb-4 bg-black/20 p-1 rounded-xl w-fit mx-auto">
                                            <button
                                                onClick={() => setChatMode('lia')}
                                                className="px-4 py-1.5 rounded-lg text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition-all"
                                            >
                                                Falar com Lia
                                            </button>
                                            <button
                                                className="px-4 py-1.5 rounded-lg text-sm font-medium bg-purple-600 text-white shadow-lg"
                                            >
                                                Testar Assistente
                                            </button>
                                        </div>

                                        {/* Header */}
                                        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/5">
                                            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                                                A
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-white">Seu Assistente</h3>
                                                <p className="text-xs text-white/40">Ambiente de Teste</p>
                                            </div>
                                            <div className="ml-auto px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded border border-green-500/20">
                                                Teste
                                            </div>
                                        </div>

                                        {/* Messages Area */}
                                        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
                                            {testMessages.length === 0 && (
                                                <div className="text-center text-white/40 py-8">
                                                    <FlaskConical className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                    <p>Envie uma mensagem para testar seu assistente</p>
                                                </div>
                                            )}
                                            {testMessages.map((msg) => (
                                                <div key={msg.id} className={cn("flex", msg.type === 'user' ? "justify-end" : "justify-start")}>
                                                    <div className={cn(
                                                        "max-w-[85%] px-4 py-2.5 rounded-2xl text-sm",
                                                        msg.type === 'user' ? "bg-purple-600 text-white" : "bg-white/10 text-white"
                                                    )}>
                                                        {msg.content}
                                                    </div>
                                                </div>
                                            ))}
                                            {isTestTyping && <Loader2 className="w-4 h-4 animate-spin text-white/50" />}
                                        </div>

                                        {/* Input Area */}
                                        <div className="space-y-2">
                                            <div className="flex gap-2">
                                                <textarea
                                                    placeholder="Teste seu assistente..."
                                                    className="flex-1 bg-black/20 border border-white/10 resize-none min-h-[50px] rounded-xl p-3 text-white focus:outline-none focus:border-white/30 transition-all"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.preventDefault();
                                                            const value = e.currentTarget.value.trim();
                                                            if (value) {
                                                                handleTestSend(value);
                                                                e.currentTarget.value = '';
                                                            }
                                                        }
                                                    }}
                                                />
                                                <Button
                                                    size="icon"
                                                    className="h-[50px] w-[50px] rounded-xl bg-purple-600 hover:bg-purple-500"
                                                >
                                                    <ArrowRight className="w-5 h-5" />
                                                </Button>
                                            </div>

                                            {/* Back to Lia Button - REMOVED since we have toggles now */}
                                            {/* <Button
                                                variant="ghost"
                                                onClick={() => setChatMode('lia')}
                                                className="w-full text-white/50 hover:text-white hover:bg-white/10 rounded-xl py-2"
                                            >
                                                <MessageCircle className="w-4 h-4 mr-2" />
                                                Voltar para Lia
                                            </Button> */}

                                            {/* Finalizar Teste Button - REMOVED from Test Chat, moved to Lia's sidebar as requested */}
                                            {/* But user asked: "No chat da Lia o botão de testar agente deve ficar em baixo do chat, embaixo dele deve ficar o botão de finalizar teste." */}
                                            {/* So I removed it from here to avoid duplication if it's in Lia's chat. */}
                                            {/* However, standard UX might suggest keeping it here too. But let's follow the request strictly for Lia's chat first. */}
                                            {/* Actually, having it in Test chat is also useful. I will Keep it but maybe style it differently or leave it. */}
                                            {/* Re-reading request: "The first chat to be open should be the test chat... In Lia's chat the test button should be at bottom..." */}
                                            {/* So I will leave this one here too as it makes sense for the "Test" flow. */}
                                            <Button
                                                onClick={() => setCurrentStep('integrations')}
                                                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl py-2 mt-2"
                                            >
                                                <Check className="w-4 h-4 mr-2" />
                                                Finalizar Teste
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 4. INTEGRATIONS STEP */}
                    <AnimatePresence mode="wait">
                        {currentStep === 'integrations' && (
                            <motion.div
                                initial={{ opacity: 0, x: 100 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                transition={{ duration: 0.5, ease: "easeInOut" }}
                                className="w-full max-w-4xl mx-auto pb-4"
                            >
                                {/* Lia's Explanation */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-center mb-12 max-w-2xl mx-auto"
                                >
                                    <div className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-6">
                                        L
                                    </div>
                                    <h1 className="text-2xl md:text-3xl font-medium tracking-tight text-white leading-relaxed mb-6">
                                        Parabéns! Seu assistente está pronto! 🎉
                                    </h1>
                                    <p className="text-white/70 text-lg leading-relaxed">
                                        Agora é hora de conectar ele às suas plataformas de atendimento.
                                        As <span className="text-emerald-400 font-medium">integrações</span> permitem que seu assistente
                                        responda automaticamente seus clientes no WhatsApp, Instagram, Facebook e outras redes.
                                    </p>
                                    <p className="text-white/50 text-base mt-4">
                                        Escolha uma plataforma abaixo para começar:
                                    </p>
                                </motion.div>

                                {/* Integration Cards Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                    {integrations.map((integration) => (
                                        <motion.div
                                            key={integration.id}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setSelectedIntegration(integration.id)}
                                            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 cursor-pointer hover:bg-white/10 transition-all flex flex-col items-center gap-3 group"
                                        >
                                            {/* Platform Icon */}
                                            <div
                                                className="w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
                                                style={{ backgroundColor: integration.color + '20' }}
                                            >
                                                {integration.id === 'whatsapp' && (
                                                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill={integration.color}>
                                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                                    </svg>
                                                )}
                                                {integration.id === 'instagram' && (
                                                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill={integration.color}>
                                                        <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.757-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
                                                    </svg>
                                                )}
                                                {integration.id === 'facebook' && (
                                                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill={integration.color}>
                                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                                    </svg>
                                                )}
                                                {integration.id === 'twitter' && (
                                                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="white">
                                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                                    </svg>
                                                )}
                                                {integration.id === 'tiktok' && (
                                                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="white">
                                                        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                                                    </svg>
                                                )}
                                            </div>
                                            <span className="text-white font-medium text-sm">{integration.name}</span>
                                            {integration.connected && (
                                                <span className="text-emerald-400 text-xs flex items-center gap-1">
                                                    <Check className="w-3 h-3" /> Conectado
                                                </span>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Action Button - Save & Finish when connected, Back to Chat otherwise */}
                                <div className="flex justify-center mt-8">
                                    {integrations.some(i => i.connected) ? (
                                        <Button
                                            onClick={async () => {
                                                console.log('Saving integrations... Configuring agent prompts');

                                                // Get the agent prompt
                                                const agentPrompt = chatState.agentConfig?.prompt;

                                                if (!agentPrompt) {
                                                    console.warn('No agent prompt configured');
                                                    setCurrentStep('dashboard');
                                                    return;
                                                }

                                                // Configure agent for WhatsApp (instance_1)
                                                if (isWhatsAppConnected) {
                                                    try {
                                                        const response = await fetch('http://localhost:3003/api/whatsapp/configure-agent', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({
                                                                sessionId: 'instance_1',
                                                                prompt: agentPrompt
                                                            })
                                                        });

                                                        const result = await response.json();
                                                        console.log('WhatsApp agent configured:', result);
                                                    } catch (error) {
                                                        console.error('Error configuring WhatsApp agent:', error);
                                                    }
                                                }

                                                setCurrentStep('dashboard');
                                            }}
                                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 text-lg rounded-xl"
                                        >
                                            <Check className="w-5 h-5 mr-2" />
                                            Salvar e Finalizar
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="ghost"
                                            onClick={() => setCurrentStep('chat')}
                                            className="text-white/60 hover:text-white"
                                        >
                                            Voltar ao Chat
                                        </Button>
                                    )}
                                </div>

                                {/* Integration Connection Modal - Generic for non-WhatsApp */}
                                <AnimatePresence>
                                    {selectedIntegration && selectedIntegration !== 'whatsapp' && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                                            onClick={() => setSelectedIntegration(null)}
                                        >
                                            <motion.div
                                                initial={{ scale: 0.9, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0.9, opacity: 0 }}
                                                onClick={(e) => e.stopPropagation()}
                                                className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-md w-full"
                                            >
                                                <div className="flex justify-between items-start mb-6">
                                                    <h2 className="text-2xl font-bold text-white">
                                                        Conectar {integrations.find(i => i.id === selectedIntegration)?.name}
                                                    </h2>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setSelectedIntegration(null)}
                                                        className="text-white/60 hover:text-white"
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </Button>
                                                </div>

                                                <p className="text-white/60 mb-8">
                                                    Conecte sua conta do {integrations.find(i => i.id === selectedIntegration)?.name} para que seu agente possa atender seus clientes automaticamente.
                                                </p>

                                                <Button
                                                    className="w-full py-4 text-lg rounded-xl"
                                                    style={{
                                                        backgroundColor: integrations.find(i => i.id === selectedIntegration)?.color,
                                                    }}
                                                >
                                                    Conectar {integrations.find(i => i.id === selectedIntegration)?.name}
                                                </Button>
                                            </motion.div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* WhatsApp Connection Modal - Dark Theme */}
                                <AnimatePresence>
                                    {selectedIntegration === 'whatsapp' && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                                            onClick={() => setSelectedIntegration(null)}
                                        >
                                            <motion.div
                                                initial={{ scale: 0.9, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0.9, opacity: 0 }}
                                                onClick={(e) => e.stopPropagation()}
                                                className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-md w-full"
                                            >
                                                {/* Header */}
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#25D36620' }}>
                                                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#25D366">
                                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <h2 className="text-xl font-bold text-white">Conectar WhatsApp</h2>
                                                            <p className="text-white/50 text-sm">
                                                                {whatsappModalState.connectionState === 'connected' ? 'Conectado!' :
                                                                    whatsappModalState.connectionState === 'ready' ? 'Escaneie o QR Code' :
                                                                        whatsappModalState.connectionState === 'generating' ? 'Gerando QR Code...' :
                                                                            'Escolha como conectar'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setSelectedIntegration(null)}
                                                        className="text-white/60 hover:text-white"
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </Button>
                                                </div>

                                                {/* Content based on state */}
                                                {!whatsappModalState.isOpen && (
                                                    /* Selection State */
                                                    <div className="space-y-4">
                                                        <p className="text-white/60 text-sm mb-6">
                                                            Conecte seu WhatsApp para que seu agente possa atender seus clientes automaticamente.
                                                        </p>

                                                        <Button
                                                            onClick={() => handleGenerateQR(1)}
                                                            className="w-full py-6 text-lg rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white flex items-center justify-center gap-3"
                                                        >
                                                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                                                <path d="M3 3h7v7H3V3zm1 1v5h5V4H4zm-1 9h7v7H3v-7zm1 1v5h5v-5H4zm9-10h7v7h-7V3zm1 1v5h5V4h-5zm-1 9h2v2h-2v-2zm2 2h2v2h-2v-2zm2 2h2v2h-2v-2zm-4 0h2v2h-2v-2zm4-4h2v2h-2v-2zm0 4h2v2h-2v-2z" />
                                                            </svg>
                                                            Conectar com QR Code
                                                        </Button>
                                                    </div>
                                                )}

                                                {whatsappModalState.isOpen && whatsappModalState.connectionState === 'generating' && (
                                                    /* Generating State */
                                                    <div className="flex flex-col items-center justify-center py-12">
                                                        <div className="relative">
                                                            <div className="w-20 h-20 rounded-full bg-[#25D366]/20 flex items-center justify-center">
                                                                <Loader2 className="w-10 h-10 text-[#25D366] animate-spin" />
                                                            </div>
                                                        </div>
                                                        <p className="text-white/70 mt-6 text-center">
                                                            Gerando QR Code...<br />
                                                            <span className="text-white/50 text-sm">Aguarde um momento</span>
                                                        </p>
                                                    </div>
                                                )}

                                                {whatsappModalState.isOpen && whatsappModalState.connectionState === 'ready' && whatsappInstances[0]?.qrCode && (
                                                    /* QR Code Ready State */
                                                    <div className="flex flex-col items-center">
                                                        <div className="bg-white p-4 rounded-2xl mb-6">
                                                            <img
                                                                src={whatsappInstances[0].qrCode}
                                                                alt="QR Code WhatsApp"
                                                                className="w-56 h-56 object-contain"
                                                            />
                                                        </div>
                                                        <div className="text-center space-y-2 mb-6">
                                                            <p className="text-white/70 text-sm">
                                                                1. Abra o WhatsApp no seu celular
                                                            </p>
                                                            <p className="text-white/70 text-sm">
                                                                2. Vá em <span className="text-white">Configurações → Aparelhos conectados</span>
                                                            </p>
                                                            <p className="text-white/70 text-sm">
                                                                3. Toque em <span className="text-white">Conectar um aparelho</span>
                                                            </p>
                                                            <p className="text-white/70 text-sm">
                                                                4. Escaneie este QR Code
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                {whatsappModalState.isOpen && whatsappModalState.connectionState === 'connecting' && (
                                                    /* Connecting State */
                                                    <div className="flex flex-col items-center justify-center py-12">
                                                        <div className="w-20 h-20 rounded-full bg-[#25D366]/20 flex items-center justify-center">
                                                            <Loader2 className="w-10 h-10 text-[#25D366] animate-spin" />
                                                        </div>
                                                        <p className="text-white/70 mt-6 text-center">
                                                            Conectando ao WhatsApp...<br />
                                                            <span className="text-white/50 text-sm">Estabelecendo conexão segura</span>
                                                        </p>
                                                    </div>
                                                )}

                                                {whatsappModalState.isOpen && whatsappModalState.connectionState === 'connected' && (
                                                    /* Connected State */
                                                    <div className="flex flex-col items-center justify-center py-8">
                                                        <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
                                                            <Check className="w-10 h-10 text-emerald-400" />
                                                        </div>
                                                        <h3 className="text-xl font-bold text-white mb-2">Conectado com Sucesso!</h3>
                                                        <p className="text-white/60 text-center mb-6">
                                                            Seu WhatsApp está pronto para receber mensagens.
                                                        </p>
                                                        <div className="flex flex-col gap-3 w-full">
                                                            <Button
                                                                onClick={() => setSelectedIntegration(null)}
                                                                className="w-full py-4 text-lg rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white"
                                                            >
                                                                Continuar
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                onClick={() => {
                                                                    handleDisconnect && handleDisconnect(1); // Assuming instance 1
                                                                    setSelectedIntegration(null);
                                                                }}
                                                                className="w-full py-4 text-base rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center justify-center gap-2"
                                                            >
                                                                <LogOut className="w-4 h-4" />
                                                                Desconectar
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}

                                                {whatsappModalState.isOpen && whatsappModalState.connectionState === 'error' && (
                                                    /* Error State */
                                                    <div className="flex flex-col items-center justify-center py-8">
                                                        <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
                                                            <X className="w-10 h-10 text-red-400" />
                                                        </div>
                                                        <h3 className="text-xl font-bold text-white mb-2">Erro na Conexão</h3>
                                                        <p className="text-white/60 text-center mb-6">
                                                            {whatsappModalState.errorMessage || 'Não foi possível conectar. Tente novamente.'}
                                                        </p>
                                                        <Button
                                                            onClick={() => handleGenerateQR(1)}
                                                            className="w-full py-4 text-lg rounded-xl bg-white/10 hover:bg-white/20 text-white"
                                                        >
                                                            Tentar Novamente
                                                        </Button>
                                                    </div>
                                                )}
                                            </motion.div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}

                        {/* Dashboard Step - Metrics + Lia Chat */}
                        {currentStep === 'dashboard' && (
                            <motion.div
                                key="dashboard"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="w-full max-w-7xl mx-auto p-4 md:p-8 h-full"
                            >
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                                    {/* Left Side - Metrics Panel */}
                                    <div className="lg:col-span-2 space-y-6">
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 }}
                                        >
                                            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                                                Dashboard
                                            </h1>
                                            <p className="text-white/60">
                                                Acompanhe as métricas do seu agente em tempo real
                                            </p>
                                        </motion.div>

                                        {/* Metrics Grid */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {/* Mensagens Recebidas */}
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 0.2 }}
                                                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                                            >
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                                        <MessageCircle className="w-5 h-5 text-blue-400" />
                                                    </div>
                                                </div>
                                                <p className="text-2xl md:text-3xl font-bold text-white">0</p>
                                                <p className="text-white/50 text-sm">Mensagens Recebidas</p>
                                            </motion.div>

                                            {/* Novos Clientes */}
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 0.25 }}
                                                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                                            >
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                                        <Sparkles className="w-5 h-5 text-emerald-400" />
                                                    </div>
                                                </div>
                                                <p className="text-2xl md:text-3xl font-bold text-white">0</p>
                                                <p className="text-white/50 text-sm">Novos Clientes</p>
                                            </motion.div>

                                            {/* Atendimentos */}
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 0.3 }}
                                                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                                            >
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                                        <FlaskConical className="w-5 h-5 text-purple-400" />
                                                    </div>
                                                </div>
                                                <p className="text-2xl md:text-3xl font-bold text-white">0</p>
                                                <p className="text-white/50 text-sm">Atendimentos</p>
                                            </motion.div>

                                            {/* Taxa de Resposta */}
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 0.35 }}
                                                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                                            >
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                                                        <ArrowRight className="w-5 h-5 text-orange-400" />
                                                    </div>
                                                </div>
                                                <p className="text-2xl md:text-3xl font-bold text-white">0%</p>
                                                <p className="text-white/50 text-sm">Taxa de Resposta</p>
                                            </motion.div>
                                        </div>

                                        {/* Integrations Status */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.4 }}
                                            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                                        >
                                            <h3 className="text-lg font-semibold text-white mb-4">Integrações Ativas</h3>
                                            <div className="flex flex-wrap gap-3">
                                                {integrations.filter(i => i.connected).map((integration) => (
                                                    <div
                                                        key={integration.id}
                                                        className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2"
                                                    >
                                                        <div
                                                            className="w-3 h-3 rounded-full"
                                                            style={{ backgroundColor: integration.color }}
                                                        />
                                                        <span className="text-white text-sm">{integration.name}</span>
                                                        <Check className="w-4 h-4 text-emerald-400" />
                                                    </div>
                                                ))}
                                                {integrations.filter(i => i.connected).length === 0 && (
                                                    <p className="text-white/40 text-sm">Nenhuma integração ativa</p>
                                                )}
                                            </div>
                                        </motion.div>

                                        {/* Back to Integrations */}
                                        <Button
                                            variant="ghost"
                                            onClick={() => setCurrentStep('integrations')}
                                            className="text-white/60 hover:text-white"
                                        >
                                            ← Gerenciar Integrações
                                        </Button>
                                    </div>

                                    {/* Right Side - Chat with Lia */}
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col h-[600px]"
                                    >
                                        {/* Chat Header */}
                                        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
                                            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold">
                                                L
                                            </div>
                                            <div>
                                                <h3 className="text-white font-semibold">Lia</h3>
                                                <p className="text-white/50 text-xs">Sua assistente de métricas</p>
                                            </div>
                                        </div>

                                        {/* Chat Messages */}
                                        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                                            <div className="flex gap-3">
                                                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs shrink-0">
                                                    L
                                                </div>
                                                <div className="bg-white/10 rounded-2xl rounded-tl-none p-4 max-w-[85%]">
                                                    <p className="text-white text-sm">
                                                        Olá! Estou aqui para te ajudar a entender suas métricas.
                                                        Você pode me perguntar sobre:
                                                    </p>
                                                    <ul className="text-white/70 text-sm mt-2 space-y-1">
                                                        <li>• Quantas mensagens recebemos hoje?</li>
                                                        <li>• Quantos novos clientes temos?</li>
                                                        <li>• Qual a taxa de resposta?</li>
                                                        <li>• Como está o desempenho do agente?</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Chat Input */}
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Pergunte sobre suas métricas..."
                                                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-emerald-500/50"
                                            />
                                            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 rounded-xl">
                                                <ArrowRight className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </motion.div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

// Sub-component for Test Chat to clean up main file
function AgentTestChat({ messages, onSend, isTyping }: any) {
    const [input, setInput] = useState("");
    return (
        <>
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
                {messages.map((msg: any) => (
                    <div key={msg.id} className={cn("flex", msg.type === 'user' ? "justify-end" : "justify-start")}>
                        <div className={cn(
                            "max-w-[85%] px-4 py-2.5 rounded-2xl text-sm",
                            msg.type === 'user' ? "bg-purple-600 text-white" : "bg-white/10"
                        )}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {isTyping && <Loader2 className="w-4 h-4 animate-spin text-white/50" />}
            </div>
            <div className="flex gap-2">
                <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), onSend(input), setInput(''))}
                    placeholder="Teste seu agente..."
                    className="flex-1 bg-black/20 border border-white/10 resize-none min-h-[50px] rounded-xl p-3 text-white focus:outline-none focus:border-white/30"
                />
                <Button size="icon" onClick={() => { onSend(input); setInput(''); }} disabled={!input.trim()} className="h-[50px] w-[50px] rounded-xl bg-purple-600 hover:bg-purple-500">
                    <ArrowRight className="w-5 h-5" />
                </Button>
            </div>
        </>
    )
}
