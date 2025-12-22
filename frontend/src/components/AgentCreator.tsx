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
import { VoicePoweredOrb } from "@/components/ui/voice-powered-orb";
import { useTTS } from "@/hooks/useTTS";

interface AgentCreatorProps {
    onOpenSidebar?: () => void;
}



export default function AgentCreator({ onOpenSidebar }: AgentCreatorProps) {
    const [prompt, setPrompt] = useState("");
    const [step, setStep] = useState<'input' | 'chat'>('input');
    const [testMode, setTestMode] = useState(false); // When true, show full chat with created agent
    const [testMessages, setTestMessages] = useState<Array<{ id: string, type: 'bot' | 'user', content: string }>>([]);
    const [isTestTyping, setIsTestTyping] = useState(false);
    // introStarted and showHeader removed as we now use CSS transitions
    const [activeChunks, setActiveChunks] = useState<string[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const playbackQueue = useRef<string[]>([]);
    const processingQueue = useRef(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const hasAutoStarted = useRef(false);
    const [thinkingLevel, setThinkingLevel] = useState(0);

    // Chat state using onboarding hook
    const {
        state: chatState,
        startOnboarding,
        handleUserInput,
    } = useOnboarding();

    const { speak, voiceLevel, stop: stopTTS } = useTTS();

    // Process complete stream: generate single audio, display chunks progressively
    const processCompleteStream = useCallback(async () => {
        if (processingQueue.current || playbackQueue.current.length === 0) return;

        processingQueue.current = true;
        setIsPlaying(true);

        const chunks = [...playbackQueue.current];
        const fullText = chunks.join(' ');

        // Generate single audio from complete text and get its duration
        const audioResult = await speak(fullText, 'Zephyr');
        const audioDuration = audioResult.duration * 1000; // Convert to ms

        console.log(`Audio duration: ${audioDuration}ms for ${chunks.length} chunks`);

        // Display chunks progressively based on ACTUAL audio duration
        const delayPerChunk = audioDuration / chunks.length;

        for (let i = 0; i < chunks.length; i++) {
            setActiveChunks(prev => [...prev, chunks[i]]);

            // Don't wait after the last chunk
            if (i < chunks.length - 1) {
                await new Promise(resolve => setTimeout(resolve, delayPerChunk));
            }
        }


        setIsPlaying(false);
        processingQueue.current = false;
        playbackQueue.current = [];
    }, [speak]);

    const handleChunk = useCallback((chunk: { type: 'text' | 'prompt' | 'error' | 'complete', content: string }) => {
        if (chunk.type === 'text') {
            playbackQueue.current.push(chunk.content);
            // Don't trigger processing yet - wait for stream to complete
        } else if (chunk.type === 'prompt') {
            // Prompt received, agent is ready - stream is complete
            processCompleteStream();
        } else if (chunk.type === 'complete') {
            // Stream completed without prompt - trigger audio processing
            processCompleteStream();
        }
    }, [processCompleteStream]);

    // Auto-start: Agent initiates conversation after page load
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
            startOnboarding(undefined, handleChunk); // Agent starts with stream
        }, 800);

        return () => clearTimeout(timer);
    }, [startOnboarding, chatState.messages.length, handleChunk]);

    // Orb thinking animation loop
    useEffect(() => {
        let rafId: number;
        let startTime = Date.now();

        const animate = () => {
            if (chatState.isTyping || isPlaying) {
                const elapsed = Date.now() - startTime;
                const pulse = 0.1 + Math.sin(elapsed * 0.005) * 0.05;
                setThinkingLevel(pulse);
            } else {
                setThinkingLevel(0);
            }
            rafId = requestAnimationFrame(animate);
        };

        rafId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(rafId);
    }, [chatState.isTyping, isPlaying]);

    // Clear active chunks when user starts typing or a new message cycle starts
    useEffect(() => {
        if (chatState.isTyping) {
            setActiveChunks([]);
            playbackQueue.current = [];
        }
    }, [chatState.isTyping]);

    // TTS Effect: Removed old version in favor of handleChunk/processQueue

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
        }
    }, [prompt]);

    const handleSend = async () => {
        if (!prompt.trim() || chatState.isTyping) return;

        setActiveChunks([]); // Clear previous bot response
        playbackQueue.current = []; // Clear pending chunks
        stopTTS();

        if (step === 'chat') {
            handleUserInput(prompt, handleChunk);
            setPrompt('');
            return;
        }

        setStep('chat');
        startOnboarding(prompt, handleChunk);
        setPrompt('');
    };

    // Handle sending messages in test mode (separate from interview)
    const handleTestSend = async () => {
        if (!prompt.trim() || isTestTyping) return;

        const userMsg = {
            id: Math.random().toString(36).substring(2, 9),
            type: 'user' as const,
            content: prompt
        };

        setTestMessages(prev => [...prev, userMsg]);
        setPrompt('');
        setIsTestTyping(true);

        try {
            // Call the agent chat API with the created agent's prompt
            const res = await fetch('http://localhost:3003/api/agent/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: prompt,
                    systemPrompt: chatState.agentConfig?.prompt || ''
                })
            });

            const data = await res.json();

            if (data.success) {
                const botMsg = {
                    id: Math.random().toString(36).substring(2, 9),
                    type: 'bot' as const,
                    content: data.message
                };
                setTestMessages(prev => [...prev, botMsg]);
            }
        } catch (error) {
            console.error('Test chat error:', error);
            const errorMsg = {
                id: Math.random().toString(36).substring(2, 9),
                type: 'bot' as const,
                content: 'Desculpe, tive um problema. Tente novamente.'
            };
            setTestMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTestTyping(false);
        }
    };

    // Main input UI - LIGHT MODE
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex flex-col p-4">
            {/* Menu button */}
            <Button
                variant="ghost"
                size="icon"
                onClick={onOpenSidebar}
                className="fixed top-4 left-4 z-50 text-gray-600 hover:text-gray-900 hover:bg-gray-100 bg-white/80 backdrop-blur-sm shadow-sm"
            >
                <Menu className="w-5 h-5" />
            </Button>

            <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col justify-end pb-10 relative">
                {/* Unified Layout - Absolutes */}

                {/* 1. Background Orb Layer - Center of Screen, Fixed, Large */}
                <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
                    <div className="w-[500px] h-[500px] sm:w-[600px] sm:h-[150vh] relative">
                        <VoicePoweredOrb
                            hue={0}
                            maxHoverIntensity={0.2}
                            voiceSensitivity={0}
                            enableVoiceControl={false}
                            audioMode="output"
                            externalAudioLevel={voiceLevel || thinkingLevel}
                        />
                    </div>
                </div>

                {/* 2. Text Layer - Floating at Bottom, Independent */}
                <div className={cn(
                    "fixed bottom-[20%] left-0 w-full flex flex-col items-center justify-center pointer-events-none z-10 px-4 transition-opacity duration-700 ease-out",
                    step === 'chat' ? "opacity-100" : "opacity-0"
                )}>
                    {chatState.isTyping && activeChunks.length === 0 ? (
                        /* Thinking Animation */
                        <div className="flex flex-col items-center gap-4">
                            <p className="text-gray-400 text-sm animate-pulse">Pensando...</p>
                        </div>
                    ) : (
                        /* Chunks Display */
                        <div className="flex items-center justify-center w-full max-w-4xl animate-in fade-in duration-300">
                            <p className="text-[18pt] sm:text-[22pt] lg:text-[26pt] font-medium text-gray-900 text-center leading-relaxed drop-shadow-sm">
                                {activeChunks.join(' ')}
                            </p>
                        </div>
                    )}
                </div>

                {/* Conditional: Test Button OR Input Area */}
                {(() => {
                    const latestBotMessage = [...chatState.messages].reverse().find(m => m.type === 'bot');
                    const agentReady = latestBotMessage?.content.includes('testar seu agente');

                    if (agentReady && !testMode) {
                        // Agent Ready - Show Test Button
                        return (
                            <div className="flex justify-center animate-in fade-in zoom-in-95 duration-500">
                                <Button
                                    onClick={() => setTestMode(true)}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-6 text-lg rounded-2xl shadow-lg shadow-emerald-500/30 gap-2"
                                >
                                    <Sparkles className="w-5 h-5" />
                                    Testar meu agente
                                </Button>
                            </div>
                        );
                    }

                    if (testMode) {
                        // Test Mode - Full Chat Interface (clean, separate from interview)
                        return (
                            <>
                                {/* Chat Messages */}
                                <div className="mb-4 max-h-[40vh] overflow-y-auto">
                                    <div className="space-y-4">
                                        {testMessages.length === 0 && !isTestTyping && (
                                            <div className="text-center text-gray-500 py-8">
                                                <p>Converse com seu agente criado!</p>
                                                <p className="text-sm mt-2">Faça perguntas como se fosse um cliente.</p>
                                            </div>
                                        )}
                                        {testMessages.map((msg) => (
                                            <div
                                                key={msg.id}
                                                className={cn(
                                                    "flex",
                                                    msg.type === 'user' ? "justify-end" : "justify-start"
                                                )}
                                            >
                                                <div
                                                    className={cn(
                                                        "max-w-[80%] px-4 py-2 rounded-2xl",
                                                        msg.type === 'user'
                                                            ? "bg-emerald-600 text-white"
                                                            : "bg-gray-100 text-gray-900"
                                                    )}
                                                >
                                                    {msg.content}
                                                </div>
                                            </div>
                                        ))}
                                        {isTestTyping && (
                                            <div className="flex justify-start">
                                                <div className="bg-gray-100 px-4 py-2 rounded-2xl">
                                                    <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Chat Input */}
                                <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-lg">
                                    <div className="flex gap-3">
                                        <Textarea
                                            ref={textareaRef}
                                            value={prompt}
                                            onChange={(e) => setPrompt(e.target.value)}
                                            placeholder="Converse com seu agente..."
                                            className={cn(
                                                "flex-1 bg-transparent border-none resize-none text-gray-900 text-lg",
                                                "placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0",
                                                "min-h-[50px] max-h-[150px]"
                                            )}
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
                                            className={cn(
                                                "rounded-full w-12 h-12 p-0 self-end",
                                                prompt.trim()
                                                    ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                                                    : "bg-gray-200 text-gray-400"
                                            )}
                                        >
                                            {isTestTyping ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <ArrowRight className="w-5 h-5" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </>
                        );
                    }

                    // Normal Input + Categories
                    return (
                        <>
                            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-lg">
                                <div className="flex gap-3">
                                    <Textarea
                                        ref={textareaRef}
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder={step === 'chat' ? "Digite sua resposta..." : "Como você gostaria de construir seu agente?"}
                                        className={cn(
                                            "flex-1 bg-transparent border-none resize-none text-gray-900 text-lg",
                                            "placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0",
                                            "min-h-[60px] max-h-[200px]"
                                        )}
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
                                        className={cn(
                                            "rounded-full w-12 h-12 p-0 self-end",
                                            prompt.trim()
                                                ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                                                : "bg-gray-200 text-gray-400"
                                        )}
                                    >
                                        {chatState.isTyping ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <ArrowRight className="w-5 h-5" />
                                        )}
                                    </Button>
                                </div>
                            </div>


                        </>
                    );
                })()}
            </div>
        </div>
    );
}
