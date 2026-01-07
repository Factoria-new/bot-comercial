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
    onInstagramConnect?: () => void;
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
    onInstagramConnect
}: IntegrationsStepProps) => {

    const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);

    const handleIntegrationClick = (id: string) => {
        // Logic for specialized modals if needed
        setSelectedIntegration(id);
    };

    const handleSave = async () => {
        console.log('Saving integrations... Configuring agent prompts');

        if (!agentPrompt) {
            console.warn('No agent prompt configured');
            onSaveAndFinish();
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
                    responda automaticamente seus clientes no WhatsApp, Instagram, Facebook e outras redes.
                </p>
                <p className="text-white/50 text-base mt-4">
                    Escolha uma plataforma abaixo para começar:
                </p>
            </motion.div>

            {/* Integration Cards Grid */}
            <div className="flex flex-col md:flex-row justify-between gap-6 w-full">
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

            {/* Instagram Connection Modal */}
            <AnimatePresence>
                {selectedIntegration === 'instagram' && (
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
                                <h2 className="text-2xl font-bold text-white">Conectar Instagram</h2>
                                <Button variant="ghost" size="icon" onClick={() => setSelectedIntegration(null)} className="text-white/60 hover:text-white">
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                            <p className="text-white/60 mb-8">
                                Conecte sua conta do Instagram Business ou Creator para que seu agente possa atender seus clientes via DM.
                            </p>
                            <Button
                                onClick={async () => {
                                    try {
                                        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3003';

                                        // First check if already connected
                                        const checkRes = await fetch(`${backendUrl}/api/instagram/status`);
                                        const checkData = await checkRes.json();

                                        if (checkData.isConnected) {
                                            alert('✅ Instagram já está conectado! Conta: ' + (checkData.username || 'Instagram'));
                                            if (onInstagramConnect) onInstagramConnect();
                                            setSelectedIntegration(null);
                                            return;
                                        }

                                        const response = await fetch(`${backendUrl}/api/instagram/auth-url?userId=default-user`);
                                        const data = await response.json();
                                        if (data.success && data.authUrl) {
                                            // Open OAuth popup
                                            const popup = window.open(data.authUrl, 'instagram-oauth', 'width=600,height=700');

                                            // Start polling after 5 second delay
                                            setTimeout(() => {
                                                const pollInterval = setInterval(async () => {
                                                    try {
                                                        const statusRes = await fetch(`${backendUrl}/api/instagram/status`);
                                                        const statusData = await statusRes.json();

                                                        if (statusData.isConnected) {
                                                            clearInterval(pollInterval);
                                                            if (popup && !popup.closed) popup.close();
                                                            alert('✅ Instagram conectado com sucesso!');
                                                            if (onInstagramConnect) onInstagramConnect();
                                                            setSelectedIntegration(null);
                                                        }
                                                    } catch (e) {
                                                        // Ignore polling errors
                                                    }
                                                }, 3000);

                                                // Stop polling after 3 minutes
                                                setTimeout(() => clearInterval(pollInterval), 180000);
                                            }, 5000);
                                        } else {
                                            alert('Erro ao conectar: ' + (data.error || 'Tente novamente'));
                                        }
                                    } catch (error) {
                                        alert('Erro de conexão. Verifique se o servidor está rodando.');
                                    }
                                }}
                                className="w-full py-4 text-lg rounded-xl bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:opacity-90 text-white"
                            >
                                Conectar Instagram
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Integration Connection Modal - Generic for non-WhatsApp */}
            <AnimatePresence>
                {selectedIntegration && selectedIntegration !== 'whatsapp' && selectedIntegration !== 'instagram' && (
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

            {/* WhatsApp Modal handled separately to keep logic clean */}
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
