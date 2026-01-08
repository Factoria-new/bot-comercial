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
            className="w-full max-w-[80%] mx-auto p-6 md:p-10 h-full"
        >
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 h-full">
                {/* Left Side - Metrics Panel */}
                <div className="lg:col-span-3 space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                            Dashboard
                        </h1>
                        <p className="text-white/60 text-lg">
                            Acompanhe as métricas do seu agente em tempo real
                        </p>
                    </motion.div>

                    {/* CTA for Integrations */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-purple-500/30 rounded-3xl p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur-sm"
                    >
                        <div className="flex items-start gap-6">
                            <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center shrink-0">
                                <Link2 className="w-7 h-7 text-purple-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Conecte seus Canais</h2>
                                <p className="text-white/70 max-w-xl text-base md:text-lg leading-relaxed">
                                    Seu assistente está pronto, mas precisa de acesso às redes.
                                    Use o menu de integrações para conectar WhatsApp, Instagram e outras plataformas.
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={() => onOpenIntegrations?.()}
                            className="w-full md:w-auto bg-white text-purple-950 hover:bg-gray-100 font-bold px-8 py-6 text-lg rounded-xl shadow-lg transition-all hover:scale-105"
                        >
                            Gerenciar Integrações
                        </Button>
                    </motion.div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {/* Mensagens Recebidas */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-colors"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                                    <MessageCircle className="w-6 h-6 text-blue-400" />
                                </div>
                            </div>
                            <p className="text-3xl md:text-4xl font-bold text-white">{metrics.totalMessages}</p>
                            <p className="text-white/50 text-base mt-2">Mensagens Recebidas</p>
                        </motion.div>

                        {/* Novos Clientes */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.25 }}
                            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-colors"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                                    <Sparkles className="w-6 h-6 text-emerald-400" />
                                </div>
                            </div>
                            <p className="text-3xl md:text-4xl font-bold text-white">{metrics.newContacts}</p>
                            <p className="text-white/50 text-base mt-2">Novos Clientes</p>
                        </motion.div>

                        {/* Atendimentos (Using Active Chats as proxy for now) */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-colors"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                                    <FlaskConical className="w-6 h-6 text-purple-400" />
                                </div>
                            </div>
                            <p className="text-3xl md:text-4xl font-bold text-white">{metrics.activeChats}</p>
                            <p className="text-white/50 text-base mt-2">Atendimentos</p>
                        </motion.div>

                        {/* Taxa de Resposta (Using Placeholder Logic or calculate later) */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.35 }}
                            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-colors"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center">
                                    <ArrowRight className="w-6 h-6 text-orange-400" />
                                </div>
                            </div>
                            <p className="text-3xl md:text-4xl font-bold text-white">100%</p>
                            <p className="text-white/50 text-base mt-2">Taxa de Resposta</p>
                        </motion.div>
                    </div>

                    {/* Integrations Status */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8"
                    >
                        <h3 className="text-xl font-semibold text-white mb-6">Integrações Ativas</h3>
                        <div className="flex flex-wrap gap-4">
                            {integrations.filter(i => i.connected).map((integration) => (
                                <div
                                    key={integration.id}
                                    className="flex items-center gap-3 bg-white/10 rounded-full px-6 py-3"
                                >
                                    <div
                                        className="w-4 h-4 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                                        style={{ backgroundColor: integration.color }}
                                    />
                                    <span className="text-white font-medium">{integration.name}</span>
                                    <Check className="w-5 h-5 text-emerald-400" />
                                </div>
                            ))}
                            {integrations.filter(i => i.connected).length === 0 && (
                                <p className="text-white/40 text-base italic">Nenhuma integração ativa no momento.</p>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Right Side - Chat with Lia */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="lg:col-span-2 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-emerald-500/20 rounded-3xl p-8 flex flex-col h-full shadow-[0_0_40px_rgba(16,185,129,0.05)] relative overflow-hidden"
                >
                    {/* Decorative glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

                    {/* Chat Header */}
                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10 relative z-10">
                        <div className="relative">
                            <div className="absolute inset-0 bg-emerald-500 blur-lg opacity-40 animate-pulse" />
                            <div className="w-14 h-14 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xl relative z-10 border-2 border-white/20">
                                L
                            </div>
                            <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-400 border-2 border-black rounded-full z-20" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                Lia
                                <span className="text-xs font-normal text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">Online</span>
                            </h3>
                            <p className="text-white/60 text-sm">Sua assistente de métricas</p>
                        </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto space-y-6 mb-6 pr-2 relative z-10 custom-scrollbar">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm shrink-0 border border-white/10">
                                L
                            </div>
                            <div className="bg-white/10 rounded-2xl rounded-tl-none p-5 max-w-[90%] border border-white/5">
                                <p className="text-white text-base leading-relaxed">
                                    Olá! Estou aqui para te ajudar a entender suas métricas com profundidade.
                                    Você pode me perguntar sobre:
                                </p>
                                <ul className="text-white/70 text-sm mt-3 space-y-2">
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                        Quantas mensagens recebemos hoje?
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                        Quantos novos clientes temos?
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                        Qual a taxa de resposta?
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                        Como está o desempenho do agente?
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Chat Input */}
                    <div className="flex gap-3 relative z-10">
                        <input
                            type="text"
                            placeholder="Pergunte sobre suas métricas..."
                            className="flex-1 bg-black/20 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50 focus:bg-black/30 transition-all min-w-0"
                        />
                        <Button className="bg-emerald-500 hover:bg-emerald-600 text-white w-14 h-14 rounded-2xl shadow-lg shadow-emerald-500/20 shrink-0 flex items-center justify-center">
                            <ArrowRight className="w-6 h-6" />
                        </Button>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};
