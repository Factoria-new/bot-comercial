"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, Sparkles, Upload } from "lucide-react";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useTTS } from "@/hooks/useTTS";
import { useGeminiLive } from "@/hooks/useGeminiLive";
import { WizardModal } from "./WizardModal";
import { NicheSchema, NICHE_SCHEMAS } from "@/lib/nicheSchemas";
import { getRandomAudio } from "@/lib/audioMappings";
import { useWhatsAppInstances } from "@/hooks/useWhatsAppInstances";
import { useAuth } from "@/contexts/AuthContext";

// New Imports
import { AgentCreatorProps, ChatMode, CreatorStep, AgentMessage } from "@/lib/agent-creator.types";
import { getIntegrations } from "@/lib/integrations";
import { useAgentAudio } from "@/hooks/useAgentAudio";
import { useLiaChat } from "@/hooks/useLiaChat";

import { LiaChatPanel } from "./agent-creator/LiaChatPanel";
import { AgentTestPanel } from "./agent-creator/AgentTestPanel";
import { IntegrationsStep } from "./agent-creator/IntegrationsStep";
import { DashboardStep } from "./agent-creator/DashboardStep";
import { LoadingOverlay } from "./agent-creator/LoadingOverlay";

export default function AgentCreator({ onOpenSidebar, onOpenIntegrations, isExiting, onStartChat }: AgentCreatorProps) {

    // --- STATE ---
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [wizardStep, setWizardStep] = useState(0); // 0 = Niche Selection
    const [currentSchema, setCurrentSchema] = useState<NicheSchema | null>(null);
    const [wizardData, setWizardData] = useState<Record<string, any>>({});
    const [voiceMode, setVoiceMode] = useState(false); // Kept for compatibility if passed to Wizard

    // Creator Flow State
    const [currentStep, setCurrentStep] = useState<CreatorStep>('chat');

    // Chat Modes
    const [chatMode, setChatMode] = useState<ChatMode>('lia');
    const [testMode, setTestMode] = useState(false);
    const [testMessages, setTestMessages] = useState<AgentMessage[]>([]);
    const [isTestTyping, setIsTestTyping] = useState(false);


    // Transitions
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

    // --- HOOKS ---
    const {
        state: chatState,
        startOnboarding,
        handleUserInput,
        setAgentPrompt,
        startTesting,
        sendMessageToLia,
        addUserMessage
    } = useOnboarding();

    const { speak, stop: stopTTS, resumeContext, voiceLevel: ttsVoiceLevel } = useTTS();

    const {
        isProcessing,
        voiceLevel: liveVoiceLevel,
    } = useGeminiLive();

    const {
        instances: whatsappInstances,
        handleGenerateQR,
        modalState: whatsappModalState,
        closeModal: closeWhatsappModal,
        handleDisconnect
    } = useWhatsAppInstances();

    const { user } = useAuth();
    const userEmail = user?.email || '';

    const {
        integrationVoiceLevel,
        playIntegrationAudio,
        stopIntegrationAudio
    } = useAgentAudio({ stopTTS });

    const {
        displayText,
        isVisible,
        fileInputRef,
        handleManualInput,
        handleFileUpload
    } = useLiaChat({
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
    });

    const isWhatsAppConnected = whatsappInstances[0]?.isConnected || false;
    const integrations = getIntegrations(isWhatsAppConnected);
    const voiceLevel = Math.max(liveVoiceLevel, ttsVoiceLevel, integrationVoiceLevel);


    // --- EFFECTS ---

    // Sync test mode
    useEffect(() => {
        if (chatState.step === 'testing') {
            setTestMode(true);
        }
    }, [chatState.step]);

    // Loading Animation Cycle
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isSwitchingToTest) {
            interval = setInterval(() => {
                setLoadingMessageIndex(prev => {
                    const next = prev + 1;
                    return next < loadingMessages.length ? next : prev;
                });
            }, 3500);
        } else {
            setLoadingMessageIndex(0);
        }
        return () => clearInterval(interval);
    }, [isSwitchingToTest]);

    // Auto-switch to Test Mode
    useEffect(() => {
        if (chatState.agentCreated && chatState.agentConfig?.prompt) {
            console.log("🚀 Agent created detected! Switching to Test Mode.");
            if (isSwitchingToTest) {
                setTimeout(() => {
                    setChatMode('agent');
                    setIsSwitchingToTest(false);
                }, 8000);
            }
            if (chatState.testMessages.length === 0) {
                startTesting();
            }
        }
    }, [chatState.agentCreated, chatState.agentConfig, startTesting, chatState.testMessages.length, isSwitchingToTest]);

    // Audio Triggers for specific steps
    useEffect(() => {
        let trigger: any | null = null;
        if (currentStep === 'integrations') trigger = 'integrations';
        else if (currentStep === 'dashboard') trigger = 'dashboard_suggestion';

        if (trigger) {
            const audioVariation = getRandomAudio(trigger);
            if (audioVariation.path) {
                const delay = trigger === 'integrations' ? 1000 : 0;
                playIntegrationAudio(audioVariation.path, delay);
            }
        }
        return () => {
            stopIntegrationAudio();
        };
    }, [currentStep, playIntegrationAudio, stopIntegrationAudio]);

    // WhatsApp Success Audio
    useEffect(() => {
        if (whatsappModalState.isOpen && whatsappModalState.connectionState === 'connected') {
            const timer = setTimeout(() => {
                console.log("🎉 WhatsApp Connected Screen! Playing success audio...");
                const audioVariation = getRandomAudio('integrations_success');
                if (audioVariation.path) {
                    playIntegrationAudio(audioVariation.path);
                }
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [whatsappModalState.connectionState, whatsappModalState.isOpen, playIntegrationAudio]);




    // --- HANDLERS ---

    const handleWizardComplete = () => {
        resumeContext();
        setIsWizardOpen(false);
        const finalPayload = {
            _niche_id: currentSchema?.id,
            _niche_title: currentSchema?.title,
            ...wizardData
        };
        console.log("🎉 Wizard Complete! Payload:", finalPayload);

        const summary = Object.entries(finalPayload)
            .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
            .join('\n');

        setIsSwitchingToTest(true);
        handleManualInput(`[SYSTEM] Cadastro finalizado com sucesso! Dados:\n${summary}\n\n[FORCE_COMPLETION]`);
    };

    // Agent Test Chat Handler
    const handleTestSend = async (message: string) => {
        if (!message.trim() || isTestTyping) return;
        resumeContext();

        const userMsg: AgentMessage = { id: Math.random().toString(36).substring(2, 9), type: 'user', content: message };
        const updatedMessages = [...testMessages, userMsg];
        setTestMessages(updatedMessages);
        setIsTestTyping(true);

        try {
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
                    history: history
                })
            });
            const data = await res.json();
            if (data.success) {
                const botMsg: AgentMessage = { id: Math.random().toString(36).substring(2, 9), type: 'bot', content: data.message };
                setTestMessages(prev => [...prev, botMsg]);
            }
        } catch (error) {
            console.error('Test chat error:', error);
            const botMsg: AgentMessage = { id: Math.random().toString(36).substring(2, 9), type: 'bot', content: "Erro ao conectar com o assistente de teste." };
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
            <div className="relative z-10 w-full max-w-[2000px] mx-auto flex-1 flex flex-col" >

                {/* --- MAIN MAIN AREA --- */}
                <div className="flex-1 flex flex-col items-center justify-center relative min-h-[60vh]">

                    {/* LOADING OVERLAY */}
                    <LoadingOverlay
                        isSwitchingToTest={isSwitchingToTest}
                        loadingMessageIndex={loadingMessageIndex}
                        loadingMessages={loadingMessages}
                    />

                    {/* 1. LIA'S PRESENCE (Initial Screen) */}
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

                    {/* 2. WIZARD MODAL */}
                    <WizardModal
                        open={isWizardOpen}
                        step={wizardStep}
                        schema={currentSchema}
                        data={wizardData}
                        onDataUpdate={setWizardData}
                        onStepChange={setWizardStep}
                        onComplete={handleWizardComplete}
                        voiceActive={voiceMode}
                        onPlayAudio={playIntegrationAudio}
                    />

                    {/* 3. UNIFIED CHAT MODE (Lia or Agent) */}
                    <AnimatePresence>
                        {testMode && currentStep === 'chat' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center pb-4"
                            >
                                {chatMode === 'lia' ? (
                                    <LiaChatPanel
                                        messages={chatState.messages}
                                        isTyping={chatState.isTyping}
                                        onManualInput={handleManualInput}
                                        onSwitchToAgent={() => setChatMode('agent')}
                                        onFinish={() => setCurrentStep('integrations')}
                                    />
                                ) : (
                                    <AgentTestPanel
                                        testMessages={testMessages}
                                        isTestTyping={isTestTyping}
                                        onTestSend={handleTestSend}
                                        onSwitchToLia={() => setChatMode('lia')}
                                        onFinish={() => setCurrentStep('integrations')}
                                    />
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* 4. INTEGRATIONS STEP */}
                    <AnimatePresence mode="wait">
                        {currentStep === 'integrations' && (
                            <IntegrationsStep
                                integrations={integrations}
                                isWhatsAppConnected={isWhatsAppConnected}
                                agentPrompt={chatState.agentConfig?.prompt}
                                wizardData={wizardData}
                                nicheId={currentSchema?.id}
                                onSaveAndFinish={() => setCurrentStep('dashboard')}
                                onBack={() => setCurrentStep('chat')}
                                whatsappModalState={whatsappModalState}
                                handleGenerateQR={handleGenerateQR}
                                handleDisconnect={handleDisconnect}
                                closeWhatsappModal={closeWhatsappModal}
                                qrCode={whatsappInstances[0]?.qrCode}
                                userEmail={userEmail}
                            />
                        )}
                    </AnimatePresence>

                    {/* 5. DASHBOARD STEP */}
                    <AnimatePresence mode="wait">
                        {currentStep === 'dashboard' && (
                            <DashboardStep
                                integrations={integrations}
                                onOpenIntegrations={onOpenIntegrations}
                            />
                        )}
                    </AnimatePresence>

                </div>
            </div>
        </div>
    );
}
