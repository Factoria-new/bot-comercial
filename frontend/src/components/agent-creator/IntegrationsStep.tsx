import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { Integration } from "@/lib/agent-creator.types";
import { IntegrationCard } from "./IntegrationCard";
import { WhatsAppConnectionModal } from "./WhatsAppConnectionModal";

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
    wizardData,
    nicheId
}: IntegrationsStepProps) => {
    const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);

    const handleIntegrationClick = (id: string) => {
        setSelectedIntegration(id);
    };

    const handleSave = async () => {
        if (!agentPrompt) {
            onSaveAndFinish();
            return;
        }

        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3003';

        // Configure WhatsApp agent
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
                    responda automaticamente seus clientes no WhatsApp.
                </p>
                <p className="text-white/50 text-base mt-4">
                    Clique no WhatsApp abaixo para começar:
                </p>
            </motion.div>

            {/* Integration Cards Grid */}
            <div className="flex flex-col md:flex-row justify-center gap-6 w-full">
                {integrations.map((integration) => (
                    <IntegrationCard
                        key={integration.id}
                        integration={integration}
                        onClick={() => handleIntegrationClick(integration.id)}
                    />
                ))}
            </div>

            {/* Action Button */}
            <div className="flex justify-center mt-8">
                {integrations.some(i => i.connected) ? (
                    <Button
                        onClick={handleSave}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 text-lg rounded-xl"
                    >
                        <Check className="w-5 h-5 mr-2" />
                        Salvar e Finalizar
                    </Button>
                ) : (
                    <Button
                        variant="ghost"
                        onClick={onBack}
                        className="text-white/60 hover:text-white"
                    >
                        Voltar ao Chat
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
                    closeWhatsappModal();
                    setSelectedIntegration(null);
                }}
                onGenerateQR={handleGenerateQR}
                onDisconnect={handleDisconnect}
            />
        </motion.div>
    );
};
