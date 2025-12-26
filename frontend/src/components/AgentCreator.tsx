"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
    ArrowRight,
    ArrowLeft,
    Loader2,
    Sparkles,
    Menu,
    Mic,
} from "lucide-react";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useTTS } from "@/hooks/useTTS";
import { useGeminiLive } from "@/hooks/useGeminiLive";
import { DynamicNicheModal } from "./DynamicNicheModal";
import { getSchemaForNiche, NicheSchema } from "@/lib/nicheSchemas";

interface AgentCreatorProps {
    onOpenSidebar?: () => void;
}

export default function AgentCreator({ onOpenSidebar }: AgentCreatorProps) {
    const liveMode = false; // Toggle for Gemini Live API vs Legacy TTS
    const [prompt, setPrompt] = useState("");
    const [step, setStep] = useState<'input' | 'chat'>('input');
    const [testMode, setTestMode] = useState(false);
    const [testMessages, setTestMessages] = useState<Array<{ id: string, type: 'bot' | 'user', content: string }>>([]);
    const [isTestTyping, setIsTestTyping] = useState(false);
    const [flyingMessages, setFlyingMessages] = useState<Array<{ id: number, text: string }>>([]);
    const [voiceMode, setVoiceMode] = useState(false); // Voice recording mode

    // Dynamic Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [currentSchema, setCurrentSchema] = useState<NicheSchema | null>(null);

    const [displayText, setDisplayText] = useState("");
    const [isVisible, setIsVisible] = useState(false);
    const pendingDisplayTextRef = useRef<string>("");

    const playbackQueue = useRef<string[]>([]);
    const processingQueue = useRef(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const hasAutoStarted = useRef(false);

    // Chat state
    const {
        state: chatState,
        startOnboarding,
        handleUserInput,
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

    // Combined voice level - use the MAXIMUM of both systems (whichever is active)
    const voiceLevel = Math.max(liveVoiceLevel, ttsVoiceLevel);

    // Process complete stream
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

    const handleChunk = useCallback((chunk: { type: 'text' | 'display_text' | 'prompt' | 'error' | 'complete', content: string }) => {
        if (chunk.type === 'display_text') {
            // Check for Modal Trigger in any text chunk
            if (chunk.content.includes('<OPEN_MODAL')) {
                const match = chunk.content.match(/<OPEN_MODAL\s+type="([^"]+)"/);
                if (match && match[1]) {
                    console.log("🚀 Modal Trigger Detected:", match[1]);
                    const schema = getSchemaForNiche(match[1]);
                    setCurrentSchema(schema);
                    setModalOpen(true);

                    // Remove the tag from display
                    chunk.content = chunk.content.replace(/<OPEN_MODAL[^>]*\/>/g, '').trim();
                }
            }

            pendingDisplayTextRef.current = chunk.content;
            setDisplayText(chunk.content);
            setIsVisible(false);
        } else if (chunk.type === 'text') {
            // Check for Modal Trigger in spoken text too (just in case)
            // Ideally we shouldn't speak the tag, but we need to detect it
            if (chunk.content.includes('<OPEN_MODAL')) {
                const match = chunk.content.match(/<OPEN_MODAL\s+type="([^"]+)"/);
                if (match && match[1]) {
                    const schema = getSchemaForNiche(match[1]);
                    setCurrentSchema(schema);
                    setModalOpen(true);
                }
                // Strip tag from audio text
                chunk.content = chunk.content.replace(/<OPEN_MODAL[^>]*\/>/g, '').trim();
            }
            playbackQueue.current.push(chunk.content);
        } else if (chunk.type === 'prompt') {
            processCompleteStream();
        } else if (chunk.type === 'complete') {
            processCompleteStream();
        }
    }, [processCompleteStream]);

    // Auto-start
    useEffect(() => {
        if (hasAutoStarted.current) return;
        if (chatState.messages.length > 0) {
            hasAutoStarted.current = true;
            setStep('chat');
            return;
        }
        hasAutoStarted.current = true;

        let hasSwitched = false; // Local flag for this closure

        // Start after 1.2 seconds
        const timer = setTimeout(async () => {
            setStep('chat');
            const result = await startOnboarding(undefined, handleChunk);

            // If we got a static greeting result immediately, play it!
            if (result && result.audioUrl) {
                console.log("🚀 Fast start with static greeting:", result);

                // Show INTRO first, hidden initially for fade
                setDisplayText(result.intro || result.text);
                setIsVisible(false); // Start hidden for transition

                // Trigger Fade In slightly before audio or synced
                requestAnimationFrame(() => setIsVisible(true));

                // Play audio instantly from URL
                speak(result.text, 'Kore', {
                    audioUrl: result.audioUrl,
                    onStart: () => {
                        // Ensure visible when audio starts
                        setIsVisible(true);
                    },
                    onProgress: (progress) => {
                        // Switch text at 70% progress with Fade Out -> Switch -> Fade In
                        if (result.question && progress > 0.7 && !hasSwitched) {
                            hasSwitched = true;

                            // 1. Fade Out
                            setIsVisible(false);

                            // 2. Wait for transition (700ms matches CSS)
                            setTimeout(() => {
                                // 3. Switch Text
                                setDisplayText(result.question);

                                // 4. Fade In
                                requestAnimationFrame(() => setIsVisible(true));
                            }, 700);
                        }
                    }
                }).catch(err => console.error("❌ Instant speak failed:", err));
            }

        }, 1200); // 1.2 seconds delay
        return () => clearTimeout(timer);
    }, [startOnboarding, chatState.messages.length, handleChunk, speak]);


    // Clear logic
    useEffect(() => {
        if (chatState.isTyping) {
            playbackQueue.current = [];
            setDisplayText("");
            setIsVisible(false);
            pendingDisplayTextRef.current = "";
        }
    }, [chatState.isTyping]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
        }
    }, [prompt]);

    // Helper to extract questions for display
    const extractQuestionsForDisplay = (text: string) => {
        // Split into sentences (split by punctuation or newline)
        // We include ':' to handle "me diga:" intros, and '\n' for paragraphs.
        const sentences = text.match(/[^.!?:\n]+[.!?:\n]+/g) || [text];

        // Filter sentences that look like questions (end with ?)
        const questions = sentences.filter(s => s.trim().endsWith('?'));

        // If we found questions, join them
        if (questions.length > 0) {
            return questions.join(' ').trim();
        }

        // Fallback: If no questions, take the last sentence
        return sentences[sentences.length - 1].trim();
    };

    const capitalizeFirstLetter = (string: string) => {
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    const handleSend = async () => {
        if (!prompt.trim() || chatState.isTyping || isProcessing) return;

        const currentPrompt = prompt;
        const flightId = Date.now();
        setFlyingMessages(prev => [...prev, { id: flightId, text: currentPrompt }]);
        setTimeout(() => {
            setFlyingMessages(prev => prev.filter(msg => msg.id !== flightId));
        }, 1000);

        setDisplayText("");
        setIsVisible(false);
        setPrompt('');

        if (liveMode) {
            // LIVE MODE: Enviar texto -> Receber áudio streaming direto do Gemini
            console.log('[AgentCreator] Using Live Mode - sending to Gemini Live Audio');

            // Callback para texto recebido (se o modelo mandar texto junto)
            const handleTextResponse = (text: string) => {
                let cleanText = text;
                if (text.includes('<OPEN_MODAL')) {
                    const match = text.match(/<OPEN_MODAL\s+type="([^"]+)"/);
                    if (match && match[1]) {
                        console.log("🚀 Live Modal Trigger:", match[1]);
                        const schema = getSchemaForNiche(match[1]);
                        setCurrentSchema(schema);
                        setModalOpen(true);
                    }
                    cleanText = text.replace(/<OPEN_MODAL[^>]*\/>/g, '').trim();
                }

                // Apply question filter for display too
                // const displayText = extractQuestionsForDisplay(cleanText); // Unused for now in streaming
                setDisplayText(prev => {
                    // Since live mode streams chunks, this might be tricky if we filter partial text.
                    // For now, let's assume we get decent chunks or accumulate.
                    // Actually, filtering stream text is hard. 
                    // If liveMode sends final text at end, fine. But it sends chunks.
                    // The user is likely using 'Legacy Mode' (TTS) given the code flow analysis.
                    // I will apply filter to appended text or just show what comes for LiveMode for now to avoid breaking stream.
                    // But the user request specifically mentioned the TTS flow behavior ("Agente falando").
                    return prev + cleanText;
                });
                setIsVisible(true);
            };

            // Enviar para o Gemini Live Audio endpoint
            await sendLiveMessage(
                currentPrompt,
                undefined, // No audio blob (text input)
                chatState.messages.map(m => ({ role: m.type === 'user' ? 'user' : 'assistant', content: m.content })),
                handleTextResponse
            );

            // Atualizar display text se não veio texto (mostrar o prompt do usuário como contexto)
            if (!displayText) {
                setDisplayText("Processando...");
                setIsVisible(true);
            }
        } else {
            // LEGACY MODE: Usar o sistema atual com TTS separado
            resumeContext();
            playbackQueue.current = [];
            stopTTS();

            // Callback to handle the response when it comes back from the hook
            const handleResponse = (chunk: { type: 'text' | 'display_text' | 'prompt' | 'error' | 'complete', content: string }) => {
                console.log("📥 handleResponse received chunk:", chunk);
                if (chunk.type === 'text') {
                    // It's the full text
                    let fullText = chunk.content;

                    // Check for nested modal
                    let detectedSchema: any = null;
                    if (fullText.includes('<OPEN_MODAL')) {
                        const match = fullText.match(/<OPEN_MODAL\s+type="([^"]+)"/);
                        if (match && match[1]) {
                            console.log("🚀 Modal Trigger Detected (Legacy):", match[1]);
                            const schema = getSchemaForNiche(match[1]);
                            detectedSchema = schema;
                            setCurrentSchema(schema);
                            // setModalOpen(true); // Moved to sync with audio start
                        }
                        fullText = fullText.replace(/<OPEN_MODAL[^>]*\/>/g, '').trim();
                    }

                    // Extract only questions (or last sentence) for display
                    const displayContent = capitalizeFirstLetter(extractQuestionsForDisplay(fullText));

                    console.log("🗣️ Triggering speak. Audio: Full, Display: Filtered", { fullText, displayContent });

                    // Set text but keep hidden until audio starts
                    setDisplayText(displayContent);
                    setIsVisible(false);
                    // Visibility will be triggered by onStart in speak function

                    speak(fullText, 'Kore', {
                        onStart: () => {
                            console.log("▶️ TTS Started");
                            setIsVisible(true);
                            if (detectedSchema) {
                                setModalOpen(true);
                            }
                        },
                        // No switching logic needed anymore
                    }).catch(err => console.error("❌ Speak failed:", err));
                }
            };

            if (step === 'chat') {
                await handleUserInput(currentPrompt, handleResponse);
                return;
            }

            setStep('chat');
            await startOnboarding(currentPrompt, handleResponse);
        }
    };

    const handleTestSend = async () => {
        if (!prompt.trim() || isTestTyping) return;

        resumeContext();

        const userMsg = { id: Math.random().toString(36).substring(2, 9), type: 'user' as const, content: prompt };
        setTestMessages(prev => [...prev, userMsg]);
        setPrompt('');
        setIsTestTyping(true);
        try {
            const res = await fetch('http://localhost:3003/api/agent/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: prompt, systemPrompt: chatState.agentConfig?.prompt || '' })
            });
            const data = await res.json();
            if (data.success) {
                const botMsg = { id: Math.random().toString(36).substring(2, 9), type: 'bot' as const, content: data.message };
                setTestMessages(prev => [...prev, botMsg]);
            }
        } catch (error) {
            console.error('Test chat error:', error);
        } finally {
            setIsTestTyping(false);
        }
    };

    const handleModalSubmit = async (data: Record<string, any>) => {
        // Send the collected data as a system-injected user message
        console.log("Submitting Modal Data:", data);

        // Format readable string for the chat context
        const formattedData = Object.entries(data)
            .filter(([key]) => !key.startsWith('_'))
            .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
            .join('\n');

        const hiddenDataInjection = `[SYSTEM_DATA_INJECTION]\nDados coletados do formulário (${data._niche_title}):\n${formattedData}`;

        // Direct Send Logic for Modal
        const currentPrompt = hiddenDataInjection;

        setDisplayText("Processando suas informações...");
        setIsVisible(true);

        if (liveMode) {
            // Live Mode Logic (Simplified)
            // In a real scenario we would call sendLiveMessage directly
            console.log("Would send to Live Mode:", currentPrompt);
            // TODO: Call sendLiveMessage here
        } else {
            resumeContext();
            playbackQueue.current = [];
            stopTTS();

            // Reuse handleResponse logic for the modal response
            const handleResponse = (chunk: { type: 'text' | 'display_text' | 'prompt' | 'error' | 'complete', content: string }) => {
                if (chunk.type === 'text') {
                    // It's the full text
                    const fullText = chunk.content;
                    // Check for nested modal (unlikely but safe)
                    if (fullText.includes('<OPEN_MODAL')) {
                        const match = fullText.match(/<OPEN_MODAL\s+type="([^"]+)"/);
                        if (match && match[1]) {
                            const schema = getSchemaForNiche(match[1]);
                            setCurrentSchema(schema);
                            setModalOpen(true);
                        }
                    }
                    const cleanText = fullText.replace(/<OPEN_MODAL[^>]*\/>/g, '').trim();

                    // Extract only questions (or last sentence) for display
                    const displayContent = capitalizeFirstLetter(extractQuestionsForDisplay(cleanText));

                    // Initial display: Filtered content
                    setDisplayText(displayContent);
                    setIsVisible(false);
                    // Visibility will be triggered by onStart in speak function

                    speak(cleanText, 'Kore', {
                        onStart: () => setIsVisible(true),
                    }).catch(err => console.error("❌ Speak failed:", err));
                }
            };

            if (step === 'chat') {
                await handleUserInput(currentPrompt, handleResponse);
            } else {
                await startOnboarding(currentPrompt, handleResponse);
            }
        }
    };

    // -- ENHANCED AURORA REACTIVITY (SMOOTH VERSION) --
    // Separar estados: usuário falando vs IA respondendo
    const isUserSpeaking = voiceMode && isSpeaking; // Usuário está falando no modo de voz
    const isAIResponding = isProcessing || isLivePlaying; // IA está processendo/respondendo
    const isListening = voiceMode && isRecording && !isSpeaking && !isAIResponding; // Esperando usuário falar

    // isTalking é true quando qualquer interação de voz está acontecendo


    return (
        <div className="min-h-screen relative flex flex-col p-4 overflow-hidden text-white font-outfit bg-[#020617]">
            {/* CSS Animations - Organic cloud-like morphing (Gemini style) */}
            <style>{`
                @keyframes floatOrganic1 {
                    0%, 100% {
                        transform: translate(-50%, -50%) translate(0, 0) scale(1);
                        border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
                    }
                    33% {
                        transform: translate(-50%, -50%) translate(3%, -5%) scale(1.1);
                        border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%;
                    }
                    66% {
                        transform: translate(-50%, -50%) translate(-3%, 4%) scale(0.95);
                        border-radius: 70% 30% 50% 50% / 30% 60% 40% 70%;
                    }
                }
                @keyframes floatOrganic2 {
                    0%, 100% {
                        transform: translate(-50%, -50%) translate(0, 0) scale(1);
                        border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
                    }
                    33% {
                        transform: translate(-50%, -50%) translate(-4%, -2%) scale(1.05);
                        border-radius: 50% 50% 20% 80% / 25% 80% 20% 75%;
                    }
                    66% {
                        transform: translate(-50%, -50%) translate(2%, 5%) scale(0.9);
                        border-radius: 70% 30% 50% 50% / 50% 40% 60% 50%;
                    }
                }
                @keyframes pulseGlow {
                    0% { opacity: 0.3; transform: translate(-50%, -50%) scale(1) rotate(0deg); }
                    100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1.1) rotate(5deg); }
                }
            `}</style>

            {/* Debug indicator - remove in production */}
            {process.env.NODE_ENV === 'development' && (
                <div className="fixed top-4 right-4 z-50 bg-black/80 text-white text-xs p-2 rounded font-mono space-y-1">
                    <div>voiceLevel: {voiceLevel.toFixed(2)} | liveVL: {liveVoiceLevel.toFixed(2)}</div>
                    <div>voiceMode: {voiceMode ? 'Y' : 'N'} | rec: {isRecording ? 'Y' : 'N'} | speaking: {isSpeaking ? 'Y' : 'N'}</div>
                    <div>proc: {isProcessing ? 'Y' : 'N'} | play: {isLivePlaying ? 'Y' : 'N'}</div>
                    <div>userSpeak: {isUserSpeaking ? 'Y' : 'N'} | aiResp: {isAIResponding ? 'Y' : 'N'} | listen: {isListening ? 'Y' : 'N'}</div>
                </div>
            )}

            {/* Background Layer - Organic Cloud/Nebula Animation (Gemini Style) */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">

                {/* Base ambient layer - darker for more contrast */}
                <div
                    className="absolute top-[50%] left-[50%] w-[100vw] h-[100vh]"
                    style={{
                        background: 'radial-gradient(ellipse at center, rgba(10, 10, 25, 0.9) 0%, rgba(2, 6, 23, 1) 60%)',
                        transform: 'translate(-50%, -50%)',
                    }}
                />

                {/* Dynamic Gradient Background Layer - Organic Motion */}
                {/* Center - Purple */}
                <div
                    className="absolute top-[50%] left-[50%] w-[60vw] h-[60vh] mix-blend-screen opacity-80"
                    style={{
                        background: 'radial-gradient(circle at center, rgba(168,85,247,0.8) 0%, rgba(139,92,246,0.4) 40%, transparent 70%)',
                        filter: `blur(${40 + voiceLevel * 20}px)`,
                        transform: `translate(-50%, -50%) scale(${1 + voiceLevel * 0.5})`,
                        transition: 'transform 0.1s ease-out, filter 0.2s ease-out',
                    }}
                />

                {/* Top Right - Green */}
                <div
                    className="absolute top-[48%] left-[52%] w-[50vw] h-[50vh] mix-blend-screen opacity-70"
                    style={{
                        background: 'radial-gradient(circle at center, rgba(34,197,94,0.9) 0%, rgba(74,222,128,0.4) 40%, transparent 70%)',
                        filter: `blur(${50 + voiceLevel * 15}px)`,
                        transform: `translate(-50%, -50%) scale(${1 + voiceLevel * 0.4}) rotate(${Date.now() / 100}deg)`,
                        animation: 'floatOrganic1 14s infinite ease-in-out',
                        transition: 'transform 0.1s ease-out',
                    }}
                />

                {/* Bottom Left - Cyan */}
                <div
                    className="absolute top-[52%] left-[48%] w-[50vw] h-[50vh] mix-blend-screen opacity-70"
                    style={{
                        background: 'radial-gradient(circle at center, rgba(6,182,212,0.9) 0%, rgba(34,211,238,0.4) 40%, transparent 70%)',
                        filter: `blur(${45 + voiceLevel * 15}px)`,
                        transform: `translate(-50%, -50%) scale(${1 + voiceLevel * 0.6})`,
                        animation: 'floatOrganic2 18s infinite ease-in-out',
                        transition: 'transform 0.1s ease-out',
                    }}
                />

                {/* Orbiting Subtle Accents to add life */}
                <div
                    className="absolute top-[50%] left-[50%] w-[40vw] h-[40vh] mix-blend-screen opacity-40"
                    style={{
                        background: 'radial-gradient(circle at center, rgba(192,132,252,0.8) 0%, transparent 60%)',
                        filter: `blur(60px)`,
                        transform: `translate(-50%, -50%) rotate(${voiceLevel * 20}deg)`,
                        animation: 'pulseGlow 8s infinite alternate',
                    }}
                />


            </div>

            {/* Content Layer */}
            <div className="relative z-10 w-full max-w-4xl mx-auto flex-1 flex flex-col justify-end pb-10">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onOpenSidebar}
                    className="fixed top-4 left-4 z-50 text-white/70 hover:text-white hover:bg-white/10"
                >
                    <Menu className="w-6 h-6" />
                </Button>

                {/* Main Display Area */}
                <div className="flex-1 flex flex-col items-center justify-center min-h-[40vh] mb-8">
                    {step === 'chat' && (
                        <div className="max-w-3xl text-center px-4">
                            {chatState.isTyping && !displayText ? (
                                <p className="text-white/40 text-lg animate-pulse font-light tracking-wide">Pensando...</p>
                            ) : (
                                <h1 className={cn(
                                    "text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-tight drop-shadow-2xl transition-all duration-700 font-outfit",
                                    !isVisible ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
                                )}>
                                    {displayText}
                                </h1>
                            )}
                        </div>
                    )}
                </div>


                {/* Input / Test Area */}
                {(() => {
                    const latestBotMessage = [...chatState.messages].reverse().find(m => m.type === 'bot');
                    const agentReady = latestBotMessage?.content.includes('testar seu agente');

                    if (agentReady && !testMode) {
                        return (
                            <div className="flex justify-center animate-in fade-in zoom-in-95 duration-500">
                                <Button
                                    onClick={() => setTestMode(true)}
                                    className="bg-white text-black hover:bg-gray-100 px-8 py-6 text-lg rounded-2xl shadow-xl shadow-white/10 gap-2 font-medium font-outfit"
                                >
                                    <Sparkles className="w-5 h-5 text-purple-600" />
                                    Testar meu agente
                                </Button>
                            </div>
                        );
                    }

                    if (testMode) {
                        return (
                            <>
                                <div className="mb-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                                    <div className="space-y-4">
                                        {testMessages.length === 0 && !isTestTyping && (
                                            <div className="text-center text-white/50 py-8">
                                                <p>Converse com seu agente criado!</p>
                                            </div>
                                        )}
                                        {testMessages.map((msg) => (
                                            <div key={msg.id} className={cn("flex", msg.type === 'user' ? "justify-end" : "justify-start")}>
                                                <div className={cn(
                                                    "max-w-[80%] px-4 py-2 rounded-2xl font-outfit",
                                                    msg.type === 'user' ? "bg-purple-600 text-white" : "bg-white/10 text-white backdrop-blur-sm"
                                                )}>
                                                    {msg.content}
                                                </div>
                                            </div>
                                        ))}
                                        {isTestTyping && (
                                            <div className="flex justify-start">
                                                <div className="bg-white/10 px-4 py-2 rounded-2xl">
                                                    <Loader2 className="w-5 h-5 animate-spin text-white/70" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-lg">
                                    <div className="flex gap-3">
                                        <Textarea
                                            ref={textareaRef}
                                            value={prompt}
                                            onChange={(e) => setPrompt(e.target.value)}
                                            placeholder="Converse com seu agente..."
                                            className="flex-1 bg-transparent border-none resize-none text-white text-lg placeholder:text-white/30 focus-visible:ring-0 min-h-[50px] max-h-[150px] font-outfit"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleTestSend();
                                                }
                                            }}
                                        />
                                        <Button
                                            onClick={handleTestSend}
                                            disabled={!prompt.trim() || isTestTyping}
                                            className="rounded-full w-12 h-12 p-0 self-end bg-purple-600 hover:bg-purple-500 text-white"
                                        >
                                            {isTestTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                                        </Button>
                                    </div>
                                </div>
                            </>
                        );
                    }

                    // Voice Recording Mode - Continuous VAD interface
                    if (voiceMode) {
                        return (
                            <div className="flex flex-col items-center justify-center gap-6 animate-in fade-in zoom-in-95 duration-300">
                                {/* Back button - exits voice mode */}
                                <Button
                                    onClick={() => {
                                        stopContinuousRecording();
                                        setVoiceMode(false);
                                    }}
                                    variant="ghost"
                                    className="absolute left-4 bottom-4 rounded-full w-12 h-12 p-0 bg-white/10 text-white/70 hover:bg-white/20 hover:text-white border border-white/20"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </Button>

                                {/* Voice indicator - pulsing circle that reacts to voice */}
                                <div
                                    className={cn(
                                        "rounded-full w-24 h-24 flex items-center justify-center transition-all duration-150",
                                        isProcessing || isLivePlaying
                                            ? "bg-purple-500/30 border-2 border-purple-400"
                                            : isSpeaking
                                                ? "bg-green-500 scale-110 shadow-lg shadow-green-500/50"
                                                : isRecording
                                                    ? "bg-green-500/20 border-2 border-green-400"
                                                    : "bg-white/10 border-2 border-white/20"
                                    )}
                                    style={{
                                        transform: isSpeaking ? `scale(${1 + liveVoiceLevel * 0.3})` : undefined,
                                    }}
                                >
                                    {isProcessing || isLivePlaying ? (
                                        <Loader2 className="w-10 h-10 animate-spin text-purple-400" />
                                    ) : (
                                        <Mic className={cn(
                                            "w-10 h-10 transition-all",
                                            isSpeaking ? "text-white" : "text-green-400"
                                        )} />
                                    )}
                                </div>

                                {/* Status text */}
                                <div className="text-white/70 text-sm font-outfit text-center">
                                    {isProcessing || isLivePlaying ? (
                                        <span className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
                                            Respondendo...
                                        </span>
                                    ) : isSpeaking ? (
                                        <span className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                            Ouvindo você...
                                        </span>
                                    ) : isRecording ? (
                                        <span className="flex flex-col items-center gap-1">
                                            <span className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                                Microfone ativo
                                            </span>
                                            <span className="text-white/40 text-xs">Fale algo... enviarei após 3s de silêncio</span>
                                        </span>
                                    ) : (
                                        "Iniciando microfone..."
                                    )}
                                </div>
                            </div>
                        );
                    }

                    // Normal Text Input Mode
                    return (
                        <div className={cn(
                            "bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-2xl transition-all duration-500",
                            "animate-in slide-in-from-bottom-4 fade-in"
                        )}>
                            <div className="flex gap-3">
                                {/* Voice Mode Button */}
                                <Button
                                    onClick={async () => {
                                        setVoiceMode(true);
                                        // Inicia gravação contínua com VAD
                                        await startContinuousRecording(async (audioBlob) => {
                                            // Callback chamado quando silêncio é detectado
                                            await sendLiveMessage(
                                                "",
                                                audioBlob,
                                                chatState.messages.map(m => ({ role: m.type === 'user' ? 'user' : 'assistant', content: m.content }))
                                            );
                                        });
                                    }}
                                    variant="ghost"
                                    className={cn(
                                        "rounded-full w-12 h-12 p-0 self-end transition-all",
                                        "bg-white/5 text-white/40 hover:bg-white/10"
                                    )}
                                    title="Clique para modo de voz contínuo"
                                >
                                    <Mic className="w-5 h-5" />
                                </Button>

                                <Textarea
                                    ref={textareaRef}
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder={step === 'chat' ? "Digite sua resposta..." : "Como você gostaria de construir seu agente?"}
                                    className="flex-1 bg-transparent border-none resize-none text-white text-lg placeholder:text-white/30 focus-visible:ring-0 min-h-[60px] max-h-[200px] font-outfit"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                />
                                <Button
                                    onClick={handleSend}
                                    disabled={!prompt.trim() || chatState.isTyping || isProcessing}
                                    className="rounded-full w-12 h-12 p-0 self-end bg-white text-black hover:bg-gray-200"
                                >
                                    {(chatState.isTyping || isProcessing) ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                                </Button>
                            </div>

                        </div>
                    );
                })()}
            </div>

            {/* Flying Messages */}
            {
                flyingMessages.map((msg) => (
                    <div
                        key={msg.id}
                        className="fixed bottom-[120px] left-0 right-0 flex justify-center pointer-events-none z-50 animate-out fade-out slide-out-to-top-[40vh] duration-1000 fill-mode-forwards"
                    >
                        <div className="w-full max-w-4xl px-8 flex justify-start">
                            <div className="text-white text-lg leading-relaxed max-w-[80%] pl-1 drop-shadow-lg font-outfit">
                                {msg.text}
                            </div>
                        </div>
                    </div>
                ))
            }

            {/* Dynamic Modal */}
            {currentSchema && (
                <DynamicNicheModal
                    open={modalOpen}
                    onOpenChange={setModalOpen}
                    schema={currentSchema}
                    onSubmit={handleModalSubmit}
                />
            )}
        </div>
    );
}

