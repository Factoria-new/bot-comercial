"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
    ArrowRight,
    Loader2,
    Sparkles,
    Menu,
} from "lucide-react";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useTTS } from "@/hooks/useTTS";

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

    const [displayText, setDisplayText] = useState("");
    const [isVisible, setIsVisible] = useState(false);
    const pendingDisplayTextRef = useRef<string>("");

    const [isPlaying, setIsPlaying] = useState(false);
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

    const { speak, stop: stopTTS, resumeContext, voiceLevel } = useTTS();

    // Process complete stream
    const processCompleteStream = useCallback(async () => {
        if (processingQueue.current || playbackQueue.current.length === 0) return;

        processingQueue.current = true;
        setIsPlaying(true);

        const chunks = [...playbackQueue.current];
        const fullAudioText = chunks.join(' ');

        try {
            await speak(fullAudioText, 'Kora', {
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
            setIsPlaying(false);
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
        if (!prompt.trim() || chatState.isTyping) return;

        resumeContext();

        const currentPrompt = prompt;
        const flightId = Date.now();
        setFlyingMessages(prev => [...prev, { id: flightId, text: currentPrompt }]);
        setTimeout(() => {
            setFlyingMessages(prev => prev.filter(msg => msg.id !== flightId));
        }, 1000);

        setDisplayText("");
        setIsVisible(false);
        playbackQueue.current = [];
        stopTTS();

        if (step === 'chat') {
            handleUserInput(currentPrompt, handleChunk);
            setPrompt('');
            return;
        }

        setStep('chat');
        startOnboarding(currentPrompt, handleChunk);
        setPrompt('');
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

    // -- ENHANCED AURORA REACTIVITY --
    const isTalking = voiceLevel > 0.05;

    // Smooth dampening is hard without a frame loop here, assuming voiceLevel comes from one
    // We will apply stronger logical transforms based on voiceLevel

    // Scale for pulses
    const pulseScale = 1 + voiceLevel * 0.4;

    // Rotation for the "Curtain"
    // We start at -45deg and rotate slightly based on volume to simulate "waving"
    const curtainRotate = -45 + (voiceLevel * 15);

    // Jitter for the whole container (still keep this for high frequency feel)
    const vibrationIntensity = voiceLevel * 8;
    const jitterX = isTalking ? (Math.random() - 0.5) * vibrationIntensity : 0;
    const jitterY = isTalking ? (Math.random() - 0.5) * vibrationIntensity : 0;

    return (
        <div className="min-h-screen relative flex flex-col p-4 overflow-hidden text-white font-outfit bg-[#020617]">
            {/* Background Layer - Deep Aura */}
            <div
                className="absolute inset-0 z-0 overflow-hidden pointer-events-none transition-transform duration-75 ease-out"
                style={{
                    // Base container jitter
                    transform: `translate(${jitterX}px, ${jitterY}px)`
                }}
            >
                {/* 1. Deep Blue Base (Right Side) - Expands with audio */}
                <div
                    className="absolute -top-[10%] -right-[10%] w-[80vw] h-[80vh] bg-[radial-gradient(circle,rgba(59,130,246,0.3)_0%,rgba(0,0,0,0)_70%)] blur-[80px] mix-blend-screen transition-transform duration-100 ease-linear"
                    style={{ transform: `scale(${pulseScale})` }}
                />

                {/* 2. Deep Violet Base (Left Side) - Expands with audio */}
                <div
                    className="absolute top-[20%] -left-[10%] w-[70vw] h-[70vh] bg-[radial-gradient(circle,rgba(124,58,237,0.3)_0%,rgba(0,0,0,0)_70%)] blur-[80px] mix-blend-screen transition-transform duration-100 ease-linear"
                    style={{ transform: `scale(${pulseScale})` }}
                />

                {/* 3. The "Curtain" / Aurora Beam (Center Diagonal) - Rotates/Waves with audio */}
                <div
                    className="absolute top-0 left-[-20%] w-[140%] h-[140%] opacity-50 mix-blend-screen transition-transform duration-100 ease-linear"
                    style={{
                        background: 'conic-gradient(from 180deg at 50% 50%, #000000 0deg, #1e1b4b 60deg, #4c1d95 120deg, #2563eb 180deg, #4c1d95 240deg, #1e1b4b 300deg, #000000 360deg)',
                        filter: 'blur(90px)',
                        transform: `rotate(${curtainRotate}deg) scale(${1 + voiceLevel * 0.1})`,
                    }}
                />

                {/* 4. Bright Highlight (Interactive) - Flashes with audio */}
                <div
                    className="absolute top-[30%] left-[30%] w-[40vw] h-[40vw] bg-violet-400/30 blur-[100px] rounded-full transition-all duration-75"
                    style={{
                        opacity: 0.1 + voiceLevel * 0.6,
                        transform: `scale(${1 + voiceLevel * 0.5})`
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

                    return (
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-2xl">
                            <div className="flex gap-3">
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
                                    disabled={!prompt.trim() || chatState.isTyping}
                                    className="rounded-full w-12 h-12 p-0 self-end bg-white text-black hover:bg-gray-200"
                                >
                                    {chatState.isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                                </Button>
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* Flying Messages */}
            {flyingMessages.map((msg) => (
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
            ))}
        </div>
    );
}
