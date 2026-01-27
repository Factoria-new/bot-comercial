import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import Lottie from "lottie-react"; // Import Lottie
import { Integration } from "@/lib/agent-creator.types";
import { IntegrationCard } from "./IntegrationCard";
import { WhatsAppConnectionModal } from "./WhatsAppConnectionModal";
import { useAuth } from "@/contexts/AuthContext";
import { useCalendarConnection } from "@/hooks/useCalendarConnection";

interface IntegrationsStepProps {
    integrations: Integration[];
    isWhatsAppConnected: boolean;
    agentPrompt?: string;
    onSaveAndFinish: () => void;
    onBack?: () => void;
    // WhatsApp Hooks Props
    whatsappModalState: any;
    handleGenerateQR: (instanceId: number) => void;
    handleDisconnect: (instanceId: number) => void;
    closeWhatsappModal: () => void;
    qrCode?: string;
    userEmail: string;
    wizardData?: Record<string, any>;
    nicheId?: string;
    isManageMode?: boolean; // NEW
    onReturnToDashboard?: () => void; // NEW
}

export const IntegrationsStep = ({
    integrations,
    isWhatsAppConnected,
    agentPrompt,
    onSaveAndFinish,
    onBack,
    whatsappModalState,
    handleGenerateQR,
    handleDisconnect,
    closeWhatsappModal,
    qrCode,
    userEmail,
    wizardData,
    nicheId,
    isManageMode,
    onReturnToDashboard
}: IntegrationsStepProps) => {
    const { updateUserPromptStatus } = useAuth();
    const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);
    const [integrationsState, setIntegrationsState] = useState<Integration[]>(integrations);
    const [metaLogoAnimation, setMetaLogoAnimation] = useState<any>(null);

    useEffect(() => {
        setIntegrationsState(integrations);
    }, [integrations]);

    // Fetch Lottie Animation
    useEffect(() => {
        fetch('/lotties/meta-ai-logo.json')
            .then(res => res.json())
            .then(data => setMetaLogoAnimation(data))
            .catch(err => console.error("Error loading Meta Lottie:", err));
    }, []);

    const updateIntegrationStatus = (id: string, isConnected: boolean) => {
        setIntegrationsState(prev => prev.map(int =>
            int.id === id ? { ...int, connected: isConnected } : int
        ));
    };

    const {
        connect: connectCalendar
    } = useCalendarConnection({
        sessionId: 'default', // Using default session for main calendar
        userEmail: userEmail,
        onConnected: () => {
            updateIntegrationStatus('google_calendar', true);
        }
    });

    const handleIntegrationClick = async (id: string) => {
        if (id === 'google_calendar') {
            setSelectedIntegration(id); // Set selection to show loading if handled by card
            await connectCalendar();
            setSelectedIntegration(null); // Clear selection after initiating
        } else {
            setSelectedIntegration(id);
        }
    };

    const handleSave = async () => {
        // ... existing save logic ...
        if (!agentPrompt) {
            onSaveAndFinish();
            return;
        }

        const backendUrl = import.meta.env.VITE_API_URL || 'https://api.cajiassist.com';
        const token = localStorage.getItem('token');

        // 1. Save prompt to user's database record
        if (token) {
            try {
                const response = await fetch(`${backendUrl}/api/user/prompt`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ prompt: agentPrompt })
                });

                if (response.ok) {
                    console.log('✅ Prompt saved to user database');
                } else {
                    console.error('❌ Failed to save prompt to user database');
                }
            } catch (error) {
                console.error('Error saving prompt to database:', error);
            }
        }

        // 2. Configure WhatsApp agent (if connected)
        if (isWhatsAppConnected) {
            try {
                await fetch(`${backendUrl}/api/whatsapp/configure-agent`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionId: 'instance_1',
                        prompt: agentPrompt,
                        data: wizardData,
                        niche: nicheId
                    })
                });
            } catch (error) {
                console.error('Error configuring WhatsApp agent:', error);
            }
        }

        // Update Auth Context to reflect that user now has a prompt
        // This is called here (end of onboarding) rather than in wizard completion
        // to ensure all test and integration steps are completed first
        if (updateUserPromptStatus) {
            updateUserPromptStatus(true);
        }

        onSaveAndFinish();
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="w-full max-w-4xl mx-auto pb-4"
        >
            {/* Lia's Explanation - Conditional */}
            {!isManageMode && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-center mb-12 max-w-2xl mx-auto"
                >
                    {/* Replaced Green L with Meta Lottie */}
                    <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                        {metaLogoAnimation ? (
                            <Lottie animationData={metaLogoAnimation} loop={true} />
                        ) : (
                            // Fallback while loading (or keep empty)
                            <div className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-2xl">
                                L
                            </div>
                        )}
                    </div>

                    <h1 className="text-2xl md:text-3xl font-medium tracking-tight text-white leading-relaxed mb-6">
                        Parabéns! Seu assistente está pronto! 🎉
                    </h1>
                    <p className="text-white/70 text-lg leading-relaxed">
                        Agora é hora de conectar ele às suas plataformas de atendimento.
                        As <span className="text-emerald-400 font-medium">integrações</span> permitem que seu assistente
                        responda automaticamente seus clientes no WhatsApp.
                    </p>
                    <p className="text-white/50 text-base mt-4">
                        Clique no WhatsApp abaixo para começar:
                    </p>
                </motion.div>
            )}

            {isManageMode && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12 max-w-2xl mx-auto"
                >
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">
                        Gerenciar Integrações
                    </h1>
                    <p className="text-white/70 text-lg leading-relaxed">
                        Conecte ou desconecte seus canais de atendimento aqui.
                    </p>
                </motion.div>
            )}

            {/* Integration Cards Grid */}
            <div className="flex flex-col md:flex-row justify-center gap-6 w-full">
                {integrationsState.map((integration) => (
                    <IntegrationCard
                        key={integration.id}
                        integration={integration}
                        onClick={() => handleIntegrationClick(integration.id)}
                    />
                ))}
            </div>

            {/* Action Button */}
            <div className="flex justify-center mt-8 gap-4">
                {/* Only show 'Back' if in manage mode OR if no integrations connected yet */}
                {(isManageMode || !integrationsState.some(i => i.connected)) && (
                    <Button
                        variant="ghost"
                        onClick={isManageMode ? onReturnToDashboard : onBack}
                        className="text-white/60 hover:text-white"
                    >
                        {isManageMode ? "Voltar ao Dashboard" : "Voltar ao Chat"}
                    </Button>
                )}

                {/* Show Save/Finish if connected and NOT in manage mode (or if user wants to explicit save) */}
                {(!isManageMode && integrationsState.some(i => i.connected)) && (
                    <Button
                        onClick={handleSave}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 text-lg rounded-xl"
                    >
                        <Check className="w-5 h-5 mr-2" />
                        Salvar e Finalizar
                    </Button>
                )}
            </div>

            {/* WhatsApp Connection Modal */}
            <WhatsAppConnectionModal
                isOpen={selectedIntegration === 'whatsapp'}
                connectionState={whatsappModalState.connectionState}
                qrCode={qrCode}
                errorMessage={whatsappModalState.errorMessage}
                onClose={() => {
                    try {
                        closeWhatsappModal();
                    } catch (e) {
                        console.error("Error closing modal:", e);
                    } finally {
                        setSelectedIntegration(null);
                    }
                }}
                onGenerateQR={handleGenerateQR}
                onDisconnect={handleDisconnect}
            />

            {/* Google Calendar Settings Modal - REMOVED for direct connection flow */}
            {/* 
            <CalendarSettingsModal
                isOpen={selectedIntegration === 'google_calendar'}
                onClose={() => setSelectedIntegration(null)}
                onConfirm={async (settings) => {
                    setSelectedIntegration(null);
                    await connectCalendar(settings);
                }}
                isLoading={isCalendarConnecting}
                initialSettings={calendarSettings}
            />
            */}
        </motion.div>
    );
};
