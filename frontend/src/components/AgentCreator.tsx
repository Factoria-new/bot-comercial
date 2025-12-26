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

interface AgentCreatorProps {
    onOpenSidebar?: () => void;
}

export default function AgentCreator({ onOpenSidebar }: AgentCreatorProps) {
    const [prompt, setPrompt] = useState("");
    const [step, setStep] = useState<'input' | 'chat'>('input');
    const [testMode, setTestMode] = useState(false);
    const [testMessages, setTestMessages] = useState<Array<{ id: string, type: 'bot' | 'user', content: string }>>([]);
    const [isTestTyping, setIsTestTyping] = useState(false);
    const [flyingMessages, setFlyingMessages] = useState<Array<{ id: number, text: string }>>([]);
    const [liveMode] = useState(true); // Default to Live mode
    const [voiceMode, setVoiceMode] = useState(false); // Voice recording mode

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
            pendingDisplayTextRef.current = chunk.content;
            setDisplayText(chunk.content);
            setIsVisible(false);
        } else if (chunk.type === 'text') {
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
        const timer = setTimeout(() => {
            setStep('chat');
            startOnboarding(undefined, handleChunk);
        }, 800);
        return () => clearTimeout(timer);
    }, [startOnboarding, chatState.messages.length, handleChunk]);


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
                setDisplayText(prev => prev + text);
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

            if (step === 'chat') {
                handleUserInput(currentPrompt, handleChunk);
                return;
            }

            setStep('chat');
            startOnboarding(currentPrompt, handleChunk);
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

    // -- ENHANCED AURORA REACTIVITY (SMOOTH VERSION) --
    // Separar estados: usuário falando vs IA respondendo
    const isUserSpeaking = voiceMode && isSpeaking; // Usuário está falando no modo de voz
    const isAIResponding = isProcessing || isLivePlaying; // IA está processendo/respondendo
    const isListening = voiceMode && isRecording && !isSpeaking && !isAIResponding; // Esperando usuário falar

    // isTalking é true quando qualquer interação de voz está acontecendo
    const isTalking = isUserSpeaking || isAIResponding || (voiceLevel > 0.05);

    return (
        <div className="min-h-screen relative flex flex-col p-4 overflow-hidden text-white font-outfit bg-[#020617]">
            {/* CSS Animations - Organic cloud-like morphing (Gemini style) */}
            <style>{`
                @keyframes morphBlob1 {
                    0%, 100% { 
                        transform: translate(-50%, -50%) scale(1) translate(0, 0);
                        border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
                    }
                    25% { 
                        transform: translate(-50%, -50%) scale(1.05) translate(5%, -8%);
                        border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
                    }
                    50% { 
                        transform: translate(-50%, -50%) scale(0.95) translate(-5%, 5%);
                        border-radius: 50% 60% 30% 60% / 30% 40% 70% 50%;
                    }
                    75% { 
                        transform: translate(-50%, -50%) scale(1.02) translate(3%, -3%);
                        border-radius: 40% 30% 60% 50% / 60% 50% 40% 30%;
                    }
                }
                @keyframes morphBlob2 {
                    0%, 100% { 
                        transform: translate(-50%, -50%) scale(1) translate(0, 0);
                        border-radius: 40% 60% 60% 40% / 70% 30% 50% 50%;
                    }
                    33% { 
                        transform: translate(-50%, -50%) scale(1.08) translate(-6%, 4%);
                        border-radius: 60% 40% 30% 70% / 40% 50% 60% 50%;
                    }
                    66% { 
                        transform: translate(-50%, -50%) scale(0.92) translate(4%, -6%);
                        border-radius: 50% 30% 50% 70% / 60% 70% 30% 40%;
                    }
                }
                @keyframes morphBlob3 {
                    0%, 100% { 
                        transform: translate(-50%, -50%) scale(1) translate(0, 0);
                        border-radius: 70% 30% 50% 50% / 30% 60% 40% 70%;
                    }
                    50% { 
                        transform: translate(-50%, -50%) scale(1.1) translate(-4%, -5%);
                        border-radius: 30% 70% 70% 30% / 50% 40% 60% 50%;
                    }
                }
                @keyframes drift {
                    0%, 100% { transform: translate(-50%, -50%) translate(0, 0); }
                    25% { transform: translate(-50%, -50%) translate(3%, -2%); }
                    50% { transform: translate(-50%, -50%) translate(-2%, 3%); }
                    75% { transform: translate(-50%, -50%) translate(-3%, -1%); }
                }
                @keyframes breathe {
                    0%, 100% { transform: translate(-50%, -50%) scale(1); filter: blur(60px); }
                    50% { transform: translate(-50%, -50%) scale(1.15); filter: blur(70px); }
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

                {/* Blob 1 - Green (Visible when AI is responding) */}
                <div
                    className="absolute top-[48%] left-[52%] w-[55vw] h-[55vh] mix-blend-screen transition-all duration-300 ease-out"
                    style={{
                        background: 'radial-gradient(ellipse at center, rgba(34,197,94,1) 0%, rgba(34,197,94,0.7) 30%, rgba(34,197,94,0.3) 50%, transparent 70%)',
                        filter: `blur(${25 + voiceLevel * 15}px)`,
                        animation: 'morphBlob1 8s ease-in-out infinite',
                        transform: `scale(${1 + voiceLevel * 0.6})`,
                        opacity: isAIResponding ? 1 : isUserSpeaking ? 0.2 : isListening ? 0.3 : 0.75,
                    }}
                />

                {/* Blob 2 - Purple/Violet - DOMINANT when user is speaking or listening */}
                <div
                    className="absolute top-[52%] left-[48%] w-[50vw] h-[50vh] mix-blend-screen transition-all duration-300 ease-out"
                    style={{
                        background: 'radial-gradient(ellipse at center, rgba(168,85,247,1) 0%, rgba(139,92,246,0.7) 30%, rgba(168,85,247,0.3) 50%, transparent 70%)',
                        filter: `blur(${30 + voiceLevel * 12}px)`,
                        animation: 'morphBlob2 10s ease-in-out infinite',
                        animationDelay: '-3s',
                        transform: `scale(${1 + voiceLevel * (isUserSpeaking || isListening ? 0.8 : 0.55)})`,
                        opacity: isUserSpeaking ? 1 : isListening ? 0.9 : isAIResponding ? 0.8 : 0.7,
                    }}
                />

                {/* Blob 3 - Cyan - Visible when AI is responding */}
                <div
                    className="absolute top-[50%] left-[50%] w-[45vw] h-[45vh] mix-blend-screen transition-all duration-300 ease-out"
                    style={{
                        background: 'radial-gradient(ellipse at center, rgba(34,211,238,1) 0%, rgba(6,182,212,0.7) 30%, rgba(34,211,238,0.3) 50%, transparent 70%)',
                        filter: `blur(${20 + voiceLevel * 20}px)`,
                        animation: 'morphBlob3 12s ease-in-out infinite',
                        animationDelay: '-6s',
                        transform: `scale(${1 + voiceLevel * 0.5})`,
                        opacity: isAIResponding ? 1 : isUserSpeaking ? 0.15 : isListening ? 0.2 : 0.65,
                    }}
                />

                {/* Blob 4 - Secondary Green (offset) - AI responding */}
                <div
                    className="absolute top-[42%] left-[58%] w-[40vw] h-[40vh] mix-blend-screen transition-all duration-300 ease-out"
                    style={{
                        background: 'radial-gradient(ellipse at center, rgba(74,222,128,1) 0%, rgba(34,197,94,0.6) 40%, transparent 70%)',
                        filter: `blur(${35 + voiceLevel * 10}px)`,
                        animation: 'morphBlob2 14s ease-in-out infinite reverse',
                        transform: `scale(${1 + voiceLevel * 0.4})`,
                        opacity: isAIResponding ? 0.9 : isUserSpeaking ? 0.1 : isListening ? 0.15 : 0.55,
                    }}
                />

                {/* Blob 5 - Secondary Purple (offset) - User speaking/listening DOMINANT */}
                <div
                    className="absolute top-[58%] left-[42%] w-[42vw] h-[42vh] mix-blend-screen transition-all duration-300 ease-out"
                    style={{
                        background: 'radial-gradient(ellipse at center, rgba(192,132,252,1) 0%, rgba(168,85,247,0.6) 40%, transparent 70%)',
                        filter: `blur(${40 + voiceLevel * 10}px)`,
                        animation: 'morphBlob1 16s ease-in-out infinite reverse',
                        animationDelay: '-8s',
                        transform: `scale(${1 + voiceLevel * (isUserSpeaking || isListening ? 0.6 : 0.35)})`,
                        opacity: isUserSpeaking ? 1 : isListening ? 0.85 : isAIResponding ? 0.6 : 0.5,
                    }}
                />

                {/* Blob 6 - Extra Cyan accent - AI responding */}
                <div
                    className="absolute top-[40%] left-[45%] w-[35vw] h-[35vh] mix-blend-screen transition-all duration-300 ease-out"
                    style={{
                        background: 'radial-gradient(ellipse at center, rgba(103,232,249,1) 0%, rgba(34,211,238,0.5) 40%, transparent 70%)',
                        filter: `blur(${30 + voiceLevel * 15}px)`,
                        animation: 'morphBlob3 11s ease-in-out infinite',
                        animationDelay: '-4s',
                        transform: `scale(${1 + voiceLevel * 0.45})`,
                        opacity: isAIResponding ? 0.8 : isUserSpeaking ? 0.1 : isListening ? 0.15 : 0.45,
                    }}
                />

                {/* Blob 7 - Extra Purple for user speaking - NEW */}
                <div
                    className="absolute top-[45%] left-[55%] w-[50vw] h-[50vh] mix-blend-screen transition-all duration-300 ease-out"
                    style={{
                        background: 'radial-gradient(ellipse at center, rgba(147,51,234,1) 0%, rgba(126,34,206,0.7) 30%, rgba(147,51,234,0.3) 50%, transparent 70%)',
                        filter: `blur(${35 + voiceLevel * 20}px)`,
                        animation: 'morphBlob1 9s ease-in-out infinite',
                        animationDelay: '-2s',
                        transform: `scale(${1 + voiceLevel * 0.7})`,
                        opacity: isUserSpeaking ? 1 : isListening ? 0.7 : 0,
                    }}
                />

                {/* Core glow - Changes color based on state */}
                <div
                    className="absolute top-[50%] left-[50%] w-[35vw] h-[35vh] rounded-full mix-blend-screen transition-all duration-200 ease-out"
                    style={{
                        background: isUserSpeaking || isListening
                            ? 'radial-gradient(circle at center, rgba(200,150,255,0.9) 0%, rgba(147,51,234,0.5) 25%, transparent 50%)'
                            : 'radial-gradient(circle at center, rgba(255,255,255,0.9) 0%, rgba(220,200,255,0.5) 25%, transparent 50%)',
                        filter: `blur(${20 + voiceLevel * 15}px)`,
                        transform: `translate(-50%, -50%) scale(${1 + voiceLevel * 0.8})`,
                        opacity: isTalking ? 1 : isListening ? 0.6 : 0.3,
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
                                        liveMode
                                            ? "bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30"
                                            : "bg-white/5 text-white/40 hover:bg-white/10"
                                    )}
                                    title="Clique para modo de voz contínuo"
                                >
                                    <Mic className="w-5 h-5" />
                                </Button>

                                <Textarea
                                    ref={textareaRef}
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder={liveMode ? "Digite e receba áudio ao vivo..." : (step === 'chat' ? "Digite sua resposta..." : "Como você gostaria de construir seu agente?")}
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
                            {/* Live Mode Indicator */}
                            {liveMode && (
                                <div className="mt-2 text-xs text-green-400/70 text-center flex items-center justify-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                    Live Audio Mode - Resposta em áudio streaming
                                </div>
                            )}
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
        </div>
    );
}
