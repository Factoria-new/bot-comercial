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
    Upload
} from "lucide-react";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useTTS } from "@/hooks/useTTS";
import { useGeminiLive } from "@/hooks/useGeminiLive";
import { WizardModal } from "./WizardModal";
import ChatMessages from "./chat/ChatMessages"; // NEW: For Lia's chat in split mode // NEW COMPONENT
import { getSchemaForNiche, NicheSchema } from "@/lib/nicheSchemas";

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

    const [displayText, setDisplayText] = useState("");
    const [isVisible, setIsVisible] = useState(false);
    const pendingDisplayTextRef = useRef<string>("");

    const playbackQueue = useRef<string[]>([]);
    const processingQueue = useRef(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Chat state is still needed for backend logic but UI is hidden
    const {
        state: chatState,
        startOnboarding,
        handleUserInput,
        setAgentPrompt,
        startTesting
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

    const voiceLevel = Math.max(liveVoiceLevel, ttsVoiceLevel);

    // Sync test mode from onboarding state
    useEffect(() => {
        if (chatState.step === 'testing') {
            setTestMode(true);
        }
    }, [chatState.step]);

    // --- WIZARD HANDLERS ---

    const handleNicheSelect = (nicheId: string) => {
        const schema = getSchemaForNiche(nicheId);
        setCurrentSchema(schema);
        setWizardStep(1); // Move to first form step

        // Optional: Trigger AI to say something specific to the niche
        handleManualInput(`[SYSTEM] Usuário selecionou o nicho: ${schema.title}. Inicie o cadastro.`);
    };

    const handleWizardComplete = () => {
        setIsWizardOpen(false);
        // Compile final data
        const finalPayload = {
            _niche_id: currentSchema?.id,
            _niche_title: currentSchema?.title,
            ...wizardData
        };
        console.log("🎉 Wizard Complete! Payload:", finalPayload);

        // Notify AI
        const summary = Object.entries(finalPayload)
            .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
            .join('\n');

        handleManualInput(`[SYSTEM] Cadastro finalizado com sucesso! Dados:\n${summary}\n\nAsk if user wants to test.`);
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

    const handleChunk = useCallback((chunk: { type: 'text' | 'display_text' | 'prompt' | 'error' | 'complete', content: string }) => {
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
            if (chunk.type === 'text') {
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

                speak(fullText, 'Kore', {
                    onStart: () => setIsVisible(true)
                }).catch(console.error);
            }
        };

        if (chatState.messages.length > 0) {
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
                const systemMsg = `[SYSTEM] O usuário fez upload de um arquivo contendo o prompt do agente. Use este conteúdo como a base o agente:\n\n${promptText}\n\nAnalise o prompt e pergunte ao usuário se ele gostaria de testar o agente ou se precisa de algum ajuste específico.`;

                // Set prompt and auto-enable test mode check (or wait for user to say yes)
                setAgentPrompt(promptText);

                handleManualInput(systemMsg);
                setDisplayText("Arquivo lido com sucesso! Analisando...");

                // Optional: Auto-start testing if preferred, or waiting for Lia to suggest it. 
                // For now, let's auto-switch to test mode to show the new UI as requested: "should be sent to test area"
                setTimeout(() => {
                    startTesting();
                    setTestMode(true);
                }, 1500);

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
        setTestMessages(prev => [...prev, userMsg]);
        setIsTestTyping(true);
        try {
            // Mock API call or real one - ensure agentConfig is available, if not use partial
            const res = await fetch('http://localhost:3003/api/agent/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message, systemPrompt: chatState.agentConfig?.prompt || '' })
            });
            const data = await res.json();
            if (data.success) {
                const botMsg = { id: Math.random().toString(36).substring(2, 9), type: 'bot' as const, content: data.message };
                setTestMessages(prev => [...prev, botMsg]);
            }
        } catch (error) {
            console.error('Test chat error:', error);
            const botMsg = { id: Math.random().toString(36).substring(2, 9), type: 'bot' as const, content: "Erro ao conectar com o agente de teste." };
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

                    {/* 1. LIA'S PRESENCE (When Wizard is CLOSED or secondary) */}
                    <AnimatePresence>
                        {(!isWizardOpen && !testMode) && (
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
                                    {displayText || "Olá! Vamos criar seu agente."}
                                </h1>

                                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                    <Button
                                        onClick={() => setIsWizardOpen(true)}
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
                        onSchemaSelect={handleNicheSelect}
                        onComplete={handleWizardComplete}
                        voiceActive={voiceMode} // Still pass it even if voice controls hidden, in case used inside
                    />

                    {/* 3. SPLIT SCREEN TEST MODE */}
                    {testMode && (
                        <div className="w-full h-[85vh] flex flex-col md:flex-row gap-4 animate-in fade-in zoom-in-95 duration-500 pb-4">

                            {/* LEFT: Agent Test Chat */}
                            <div className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col shadow-2xl overflow-hidden relative group">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500 opacity-50" />
                                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/5">
                                    <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">A</div>
                                    <div>
                                        <h3 className="font-semibold text-white">Seu Agente</h3>
                                        <p className="text-xs text-white/40">Ambiente de Teste</p>
                                    </div>
                                    <div className="ml-auto px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded border border-green-500/20">Online</div>
                                </div>

                                <AgentTestChat messages={testMessages} onSend={handleTestSend} isTyping={isTestTyping} />
                            </div>

                            {/* RIGHT: Lia Chat (Creator) */}
                            <div className="flex-1 bg-black/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 flex flex-col shadow-xl overflow-hidden">
                                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/5">
                                    <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold">L</div>
                                    <div>
                                        <h3 className="font-semibold text-white">Lia</h3>
                                        <p className="text-xs text-white/40">Assistente de Criação</p>
                                    </div>
                                </div>

                                <ChatMessages
                                    messages={chatState.messages.filter(m => !m.content.startsWith('[SYSTEM]'))}
                                    isTyping={chatState.isTyping}
                                    className="flex-1 custom-scrollbar"
                                    alignLeft={true}
                                />

                                {/* Mini Input for Lia */}
                                <div className="mt-4 flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Fale com a Lia..."
                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:bg-white/10 transition-all"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                handleManualInput(e.currentTarget.value);
                                                e.currentTarget.value = '';
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                        </div>
                    )}
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
