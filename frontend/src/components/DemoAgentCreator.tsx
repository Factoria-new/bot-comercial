"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, CheckCircle } from "lucide-react";
import { useTTS } from "@/hooks/useTTS";
import { WizardModal } from "./WizardModal";
import { NicheSchema, NICHE_SCHEMAS } from "@/lib/nicheSchemas";
import { getRandomAudio } from "@/lib/audioMappings";
import { AgentTestPanel } from "./agent-creator/AgentTestPanel";
import { LoadingOverlay } from "./agent-creator/LoadingOverlay";
import { AgentMessage } from "@/lib/agent-creator.types";
import { useAgentAudio } from "@/hooks/useAgentAudio";
import { useToast } from "@/hooks/use-toast";

interface DemoAgentCreatorProps {
    onOpenSidebar?: () => void;
}

export default function DemoAgentCreator({ onOpenSidebar }: DemoAgentCreatorProps) {
    const { toast } = useToast();

    // --- STATE ---
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [wizardStep, setWizardStep] = useState(0);
    const [currentSchema, setCurrentSchema] = useState<NicheSchema | null>(null);
    const [wizardData, setWizardData] = useState<Record<string, any>>({});

    // Demo State
    const [currentStep, setCurrentStep] = useState<'welcome' | 'chat' | 'cta'>('welcome');
    const [testMessages, setTestMessages] = useState<AgentMessage[]>([]);
    const [isTestTyping, setIsTestTyping] = useState(false);
    const [agentPrompt, setAgentPrompt] = useState<string>("");

    // Transitions
    const [isSwitchingToTest, setIsSwitchingToTest] = useState(false);
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

    const loadingMessages = [
        "Criando Assistente de Demonstração...",
        "Analisando perfil do negócio...",
        "Definindo tom de voz ideal...",
        "Gerando estratégias de conversão...",
        "Configurando diretrizes de teste...",
        "Finalizando configurações..."
    ];

    // --- HOOKS ---
    const { stop: stopTTS } = useTTS();

    const {
        playIntegrationAudio,
        stopIntegrationAudio
    } = useAgentAudio({ stopTTS });

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

    // --- HANDLERS ---

    const handleStartWizard = () => {
        setCurrentSchema(NICHE_SCHEMAS.general);
        setWizardStep(1);
        setIsWizardOpen(true);
    };

    const handleWizardComplete = async () => {
        // Set switching to test FIRST
        setIsSwitchingToTest(true);
        setIsWizardOpen(false);

        const backendUrl = import.meta.env.VITE_API_URL || 'https://api.cajiassist.com';

        try {
            // Generate prompt using DEMO endpoint
            const response = await fetch(`${backendUrl}/api/agent/demo-generate-prompt`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    data: wizardData,
                    niche: currentSchema?.id || 'general'
                })
            });

            const result = await response.json();

            if (result.success && result.prompt) {
                console.log(`✅ Demo prompt generated`);
                setAgentPrompt(result.prompt);
                setCurrentStep('chat');

                // Play completion audio
                const audioVariation = getRandomAudio('complete');
                if (audioVariation.path) {
                    playIntegrationAudio(audioVariation.path, 500);
                }

                // Transition to test mode after loading animation
                setTimeout(() => {
                    setIsSwitchingToTest(false);
                }, 4000);
            } else {
                console.error('❌ Failed to generate prompt:', result.error);
                toast({
                    title: "Erro ao criar agente",
                    description: result.error || "Houve um erro ao gerar o agente. Tente novamente.",
                    variant: "destructive"
                });
                setIsSwitchingToTest(false);
                setIsWizardOpen(true); // Re-open wizard for retry
            }
        } catch (error) {
            console.error('❌ Error calling demo-generate-prompt:', error);
            toast({
                title: "Erro de Conexão",
                description: "Não foi possível conectar ao servidor. Verifique sua conexão.",
                variant: "destructive"
            });
            setIsSwitchingToTest(false);
            setIsWizardOpen(true); // Re-open wizard for retry
        }
    };

    // Demo Chat Handler
    const handleTestSend = async (message: string) => {
        if (!message.trim() || isTestTyping) return;

        const userMsg: AgentMessage = { id: Math.random().toString(36).substring(2, 9), type: 'user', content: message };
        const updatedMessages = [...testMessages, userMsg];
        setTestMessages(updatedMessages);
        setIsTestTyping(true);

        try {
            const history = updatedMessages.map(msg => ({
                role: msg.type === 'user' ? 'user' : 'model',
                content: msg.content
            }));

            const backendUrl = import.meta.env.VITE_API_URL || 'https://api.cajiassist.com';

            // Determine Business Type for better scripted responses
            let businessType = 'general';
            const schemaId = currentSchema?.id || 'general';

            if (schemaId === 'restaurant') businessType = 'product';
            else if (['beauty', 'services', 'real_estate'].includes(schemaId)) businessType = 'service';
            else if (schemaId === 'general') {
                // Infer from data
                if (wizardData.products?.length > 0) businessType = 'product';
                else businessType = 'service';
            }

            // Use DEMO chat endpoint
            const res = await fetch(`${backendUrl}/api/agent/demo-chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    data: { ...wizardData, type: businessType } // Inject calculated type
                })
            });

            const data = await res.json();

            if (data.success) {
                const botMsg: AgentMessage = { id: Math.random().toString(36).substring(2, 9), type: 'bot', content: data.message };
                setTestMessages(prev => [...prev, botMsg]);
            } else {
                console.error('Test chat error:', data.error);
                const botMsg: AgentMessage = { id: Math.random().toString(36).substring(2, 9), type: 'bot', content: data.error || "Erro no chat de demonstração." };
                setTestMessages(prev => [...prev, botMsg]);
            }
        } catch (error) {
            console.error('Test chat error:', error);
            const botMsg: AgentMessage = { id: Math.random().toString(36).substring(2, 9), type: 'bot', content: "Erro de conexão." };
            setTestMessages(prev => [...prev, botMsg]);
        } finally {
            setIsTestTyping(false);
        }
    };

    const handleFinishDemo = () => {
        setCurrentStep('cta');
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

            {/* Background Layer */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[50%] left-[50%] w-[100vw] h-[100vh] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#020617] to-black translate-x-[-50%] translate-y-[-50%]" />
                <div className="absolute top-[30%] left-[50%] w-[60vw] h-[60vh] mix-blend-screen opacity-40 blur-[80px] rounded-full bg-purple-600 animate-[floatOrganic1_20s_ease-in-out_infinite]" />
                <div className="absolute top-[60%] left-[60%] w-[50vw] h-[50vh] mix-blend-screen opacity-30 blur-[90px] rounded-full bg-blue-600 animate-[floatOrganic1_25s_ease-in-out_infinite_reverse]" />
            </div>

            {/* Content Layer */}
            <div className="relative z-10 w-full max-w-[2000px] mx-auto flex-1 flex flex-col items-center justify-center">

                {/* LOADING OVERLAY */}
                <LoadingOverlay
                    isSwitchingToTest={isSwitchingToTest}
                    loadingMessageIndex={loadingMessageIndex}
                    loadingMessages={loadingMessages}
                // Force visible if strictly switching
                />

                {/* 1. WELCOME SCREEN */}
                <AnimatePresence>
                    {currentStep === 'welcome' && !isWizardOpen && !isSwitchingToTest && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="text-center max-w-3xl"
                        >
                            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6 text-white">
                                Experimente a Magia da <span className="text-[#00A947]">Caji</span>
                            </h1>
                            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                                Crie um agente de vendas personalizado em segundos e veja como ele conversa com seus clientes. Nenhuma configuração complexa necessária.
                            </p>

                            <Button
                                onClick={handleStartWizard}
                                className="bg-[#00A947] hover:bg-[#008f3c] text-white text-xl px-10 py-8 rounded-full font-bold shadow-lg hover:shadow-[#00A947]/20 transition-all hover:scale-105"
                            >
                                <Sparkles className="w-6 h-6 mr-3 text-yellow-300" />
                                Criar Agente Agora
                            </Button>
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
                    voiceActive={false} // Disable voice for demo simplicity
                    onPlayAudio={playIntegrationAudio}
                    onClose={() => setIsWizardOpen(false)}
                    isDemo={true}
                />

                {/* 3. CHAT INTERFACE */}
                <AnimatePresence>
                    {currentStep === 'chat' && !isSwitchingToTest && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full max-w-3xl"
                        >
                            <AgentTestPanel
                                testMessages={testMessages}
                                isTestTyping={isTestTyping}
                                onTestSend={handleTestSend}
                                onSwitchToLia={() => { }} // No Lia
                                onFinish={handleFinishDemo}
                                finishLabel="Ver Planos e Preços"
                                isDemo={true}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 4. CTA SCREEN */}
                <AnimatePresence>
                    {currentStep === 'cta' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center max-w-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-12 rounded-3xl"
                        >
                            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-10 h-10 text-green-400" />
                            </div>

                            <h2 className="text-3xl md:text-5xl font-bold mb-6">
                                Gostou do Resultado?
                            </h2>
                            <p className="text-lg text-gray-300 mb-10 leading-relaxed">
                                Este foi apenas um gostinho. Com a versão completa, seu agente pode conectar-se ao WhatsApp, Instagram e agendar reuniões no Calendar.
                            </p>

                            <div className="flex flex-col gap-4 max-w-md mx-auto">
                                <Button
                                    onClick={() => window.location.href = '/#pricing'} // Redirect to pricing section
                                    className="bg-[#00A947] hover:bg-[#008f3c] text-white h-14 text-lg rounded-xl font-bold w-full"
                                >
                                    Ver Planos e Preços
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
}
