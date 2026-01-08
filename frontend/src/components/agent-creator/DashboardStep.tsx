import { motion } from "framer-motion";
import { Link2, Sparkles, MessageCircle, FlaskConical, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Integration } from "@/lib/agent-creator.types";
import { useSocket } from "@/contexts/SocketContext";
import { useEffect, useState } from "react";

interface DashboardStepProps {
    integrations: Integration[];
    onOpenIntegrations?: () => void;
}

interface Metrics {
    totalMessages: number;
    newContacts: number;
    activeChats: number;
}

export const DashboardStep = ({ integrations, onOpenIntegrations }: DashboardStepProps) => {
    const { socket } = useSocket();
    const [metrics, setMetrics] = useState<Metrics>({
        totalMessages: 0,
        newContacts: 0,
        activeChats: 0
    });

    useEffect(() => {
        if (!socket) return;

        // Listen for metrics updates
        socket.on('metrics-update', (newMetrics: Metrics) => {
            console.log('📊 DashboardStep received metrics:', newMetrics);
            setMetrics(newMetrics);
        });

        // Request initial metrics
        socket.emit('request-metrics');

        return () => {
            socket.off('metrics-update');
        };
    }, [socket]);

    return (
        <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-7xl mx-auto p-4 md:p-8 h-full"
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                {/* Left Side - Metrics Panel */}
                <div className="lg:col-span-2 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                            Dashboard
                        </h1>
                        <p className="text-white/60">
                            Acompanhe as métricas do seu agente em tempo real
                        </p>
                    </motion.div>

                    {/* CTA for Integrations */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-purple-500/30 rounded-2xl p-6 md:p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-sm"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                                <Link2 className="w-6 h-6 text-purple-400" />
                            </div>
                            <div>
                                <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Conecte seus Canais</h2>
                                <p className="text-white/70 max-w-xl text-sm md:text-base">
                                    Seu assistente está pronto, mas precisa de acesso às redes.
                                    Use o menu de integrações para conectar WhatsApp, Instagram e outras plataformas.
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={() => onOpenIntegrations?.()}
                            className="w-full md:w-auto bg-white text-purple-950 hover:bg-gray-100 font-bold px-6 py-4 text-base rounded-xl shadow-lg transition-all hover:scale-105"
                        >
                            Gerenciar Integrações
                        </Button>
                    </motion.div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Mensagens Recebidas */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                    <MessageCircle className="w-5 h-5 text-blue-400" />
                                </div>
                            </div>
                            <p className="text-2xl md:text-3xl font-bold text-white">{metrics.totalMessages}</p>
                            <p className="text-white/50 text-sm">Mensagens Recebidas</p>
                        </motion.div>

                        {/* Novos Clientes */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.25 }}
                            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-emerald-400" />
                                </div>
                            </div>
                            <p className="text-2xl md:text-3xl font-bold text-white">{metrics.newContacts}</p>
                            <p className="text-white/50 text-sm">Novos Clientes</p>
                        </motion.div>

                        {/* Atendimentos (Using Active Chats as proxy for now) */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                    <FlaskConical className="w-5 h-5 text-purple-400" />
                                </div>
                            </div>
                            <p className="text-2xl md:text-3xl font-bold text-white">{metrics.activeChats}</p>
                            <p className="text-white/50 text-sm">Atendimentos</p>
                        </motion.div>

                        {/* Taxa de Resposta (Using Placeholder Logic or calculate later) */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.35 }}
                            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                                    <ArrowRight className="w-5 h-5 text-orange-400" />
                                </div>
                            </div>
                            <p className="text-2xl md:text-3xl font-bold text-white">100%</p>
                            <p className="text-white/50 text-sm">Taxa de Resposta</p>
                        </motion.div>
                    </div>

                    {/* Integrations Status */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                    >
                        <h3 className="text-lg font-semibold text-white mb-4">Integrações Ativas</h3>
                        <div className="flex flex-wrap gap-3">
                            {integrations.filter(i => i.connected).map((integration) => (
                                <div
                                    key={integration.id}
                                    className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2"
                                >
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: integration.color }}
                                    />
                                    <span className="text-white text-sm">{integration.name}</span>
                                    <Check className="w-4 h-4 text-emerald-400" />
                                </div>
                            ))}
                            {integrations.filter(i => i.connected).length === 0 && (
                                <p className="text-white/40 text-sm">Nenhuma integração ativa</p>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Right Side - Chat with Lia */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col h-[600px]"
                >
                    {/* Chat Header */}
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
                        <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold">
                            L
                        </div>
                        <div>
                            <h3 className="text-white font-semibold">Lia</h3>
                            <p className="text-white/50 text-xs">Sua assistente de métricas</p>
                        </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs shrink-0">
                                L
                            </div>
                            <div className="bg-white/10 rounded-2xl rounded-tl-none p-4 max-w-[85%]">
                                <p className="text-white text-sm">
                                    Olá! Estou aqui para te ajudar a entender suas métricas.
                                    Você pode me perguntar sobre:
                                </p>
                                <ul className="text-white/70 text-sm mt-2 space-y-1">
                                    <li>• Quantas mensagens recebemos hoje?</li>
                                    <li>• Quantos novos clientes temos?</li>
                                    <li>• Qual a taxa de resposta?</li>
                                    <li>• Como está o desempenho do agente?</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Chat Input */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Pergunte sobre suas métricas..."
                            className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-emerald-500/50"
                        />
                        <Button className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 rounded-xl">
                            <ArrowRight className="w-5 h-5" />
                        </Button>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};
