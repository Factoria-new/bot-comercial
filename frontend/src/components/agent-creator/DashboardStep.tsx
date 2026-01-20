import { motion } from "framer-motion";
import { Link2, Sparkles, MessageCircle, MessagesSquare, Zap, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Integration } from "@/lib/agent-creator.types";
import { useSocket } from "@/contexts/SocketContext";
import { useEffect, useState } from "react";
import LiaSidebar from "@/components/LiaSidebar";
import { BrandIcons } from "@/components/ui/brand-icons";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

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

    // State for Lia sidebar
    const [isLiaSidebarOpen, setIsLiaSidebarOpen] = useState(false);

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
            className="w-full max-w-6xl mx-auto p-6 md:p-10 h-full"
        >
            <div className="space-y-8 h-full">
                {/* Metrics Panel - Now full width */}
                <div className="space-y-8">
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

                    {/* Metrics Grid - Compact Design */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Mensagens Recebidas */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all hover:border-blue-500/30 group"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                                    <MessageCircle className="w-5 h-5 text-blue-400" />
                                </div>
                                <span className="text-xs text-blue-400/70 bg-blue-500/10 px-2 py-1 rounded-full">Hoje</span>
                            </div>
                            <p className="text-2xl md:text-3xl font-bold text-white">{metrics.totalMessages}</p>
                            <p className="text-white/50 text-sm mt-1">Mensagens</p>
                            <p className="text-white/30 text-xs mt-0.5">Recebidas pelo bot</p>
                        </motion.div>

                        {/* Novos Contatos */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.25 }}
                            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all hover:border-emerald-500/30 group"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors">
                                    <Sparkles className="w-5 h-5 text-emerald-400" />
                                </div>
                                <span className="text-xs text-emerald-400/70 bg-emerald-500/10 px-2 py-1 rounded-full">Novos</span>
                            </div>
                            <p className="text-2xl md:text-3xl font-bold text-white">{metrics.newContacts}</p>
                            <p className="text-white/50 text-sm mt-1">Contatos</p>
                            <p className="text-white/30 text-xs mt-0.5">Leads captados</p>
                        </motion.div>

                        {/* Conversas Ativas */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all hover:border-purple-500/30 group"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                                    <MessagesSquare className="w-5 h-5 text-purple-400" />
                                </div>
                                <span className="text-xs text-purple-400/70 bg-purple-500/10 px-2 py-1 rounded-full">Ativo</span>
                            </div>
                            <p className="text-2xl md:text-3xl font-bold text-white">{metrics.activeChats}</p>
                            <p className="text-white/50 text-sm mt-1">Conversas</p>
                            <p className="text-white/30 text-xs mt-0.5">Em andamento</p>
                        </motion.div>

                        {/* Taxa de Resposta */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.35 }}
                            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all hover:border-amber-500/30 group"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center group-hover:bg-amber-500/30 transition-colors">
                                    <Zap className="w-5 h-5 text-amber-400" />
                                </div>
                                <span className="text-xs text-amber-400/70 bg-amber-500/10 px-2 py-1 rounded-full">100%</span>
                            </div>
                            <p className="text-2xl md:text-3xl font-bold text-white">100%</p>
                            <p className="text-white/50 text-sm mt-1">Resposta</p>
                            <p className="text-white/30 text-xs mt-0.5">Taxa automática</p>
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
                            {integrations.filter(i => i.connected).map((integration) => {
                                const Icon = BrandIcons[integration.icon];
                                return (
                                    <div
                                        key={integration.id}
                                        className="flex items-center gap-3 bg-white/10 rounded-full px-5 py-2.5"
                                    >
                                        <div
                                            className="w-8 h-8 rounded-full flex items-center justify-center"
                                            style={{ backgroundColor: integration.color }}
                                        >
                                            {Icon && <Icon className="w-4 h-4 text-white" />}
                                        </div>
                                        <span className="text-white font-medium">{integration.name}</span>
                                        <Check className="w-5 h-5 text-emerald-400" />
                                    </div>
                                );
                            })}
                            {integrations.filter(i => i.connected).length === 0 && (
                                <p className="text-white/40 text-base italic">Nenhuma integração ativa no momento.</p>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Floating Action Button to open Lia */}
            <div className="fixed bottom-8 right-8 z-30 flex items-center justify-center">
                <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
                    onClick={() => setIsLiaSidebarOpen(true)}
                    className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full shadow-2xl shadow-emerald-500/30 flex items-center justify-center text-white hover:scale-110 transition-transform relative peer"
                >
                    {/* Pulse ring */}
                    <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-25" />

                    {/* Avatar */}
                    {/* Avatar */}
                    <div className="relative z-20 w-12 h-12 flex items-center justify-center pointer-events-none">
                        <DotLottieReact
                            src="https://lottie.host/81c943cc-b77a-4576-b5b5-05c6c68edb7d/vtCWds8DoU.lottie"
                            loop
                            autoplay
                            style={{ width: '100%', height: '100%' }}
                        />
                    </div>
                </motion.button>

                {/* Tooltip */}
                <div className="absolute right-20 pointer-events-none bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-medium opacity-0 peer-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg border border-white/10">
                    Pergunte à Lia sobre métricas
                </div>
            </div>

            {/* Lia Sidebar */}
            <LiaSidebar
                isOpen={isLiaSidebarOpen}
                onClose={() => setIsLiaSidebarOpen(false)}
                metrics={metrics}
            />
        </motion.div>
    );
};
