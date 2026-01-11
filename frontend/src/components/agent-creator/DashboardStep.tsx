import { motion } from "framer-motion";
import { Link2, Sparkles, MessageCircle, FlaskConical, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Integration } from "@/lib/agent-creator.types";
import { useSocket } from "@/contexts/SocketContext";
import { useEffect, useState, useRef } from "react";

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

    // Chat state for Lia metrics assistant
    const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'lia', content: string }[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    // Generate Lia's response based on the question and current metrics
    const generateLiaResponse = (question: string): string => {
        const q = question.toLowerCase();

        if (q.includes('mensage') || q.includes('receb')) {
            return `📊 Hoje recebemos ${metrics.totalMessages} mensagens no total. ${metrics.totalMessages > 10 ? 'Ótimo movimento!' : 'Ainda está tranquilo por aqui.'}`;
        }
        if (q.includes('novo') || q.includes('cliente') || q.includes('contato')) {
            return `👥 Temos ${metrics.newContacts} novos contatos hoje. ${metrics.newContacts > 0 ? 'Cada novo contato é uma oportunidade! 🎯' : 'Vamos trabalhar para atrair mais leads!'}`;
        }
        if (q.includes('chat') || q.includes('ativo') || q.includes('conversa')) {
            return `💬 Há ${metrics.activeChats} conversas ativas no momento. ${metrics.activeChats > 0 ? 'Seu agente está trabalhando!' : 'Nenhum chat ativo agora.'}`;
        }
        if (q.includes('taxa') || q.includes('resposta') || q.includes('desempenho')) {
            const responseRate = metrics.totalMessages > 0 ? '100%' : 'N/A';
            return `⚡ Taxa de resposta: ${responseRate}. O agente responde automaticamente todas as mensagens recebidas!`;
        }
        if (q.includes('resum') || q.includes('tudo') || q.includes('geral')) {
            return `📈 Resumo do dia:\n• Mensagens: ${metrics.totalMessages}\n• Novos contatos: ${metrics.newContacts}\n• Chats ativos: ${metrics.activeChats}\n\nPrecisa de mais detalhes sobre algo específico?`;
        }
        if (q.includes('oi') || q.includes('olá') || q.includes('ola')) {
            return `Olá! 👋 Sou a Lia, sua assistente de métricas. Posso te ajudar com informações sobre mensagens, contatos e desempenho. O que você quer saber?`;
        }

        return `Posso te ajudar com:\n• Quantas mensagens recebemos?\n• Quantos novos contatos?\n• Chats ativos\n• Taxa de resposta\n\nÉ só perguntar! 😊`;
    };

    // Handle sending a message
    const handleSendMessage = () => {
        if (!inputValue.trim() || isTyping) return;

        const userMessage = inputValue.trim();
        setInputValue('');

        // Add user message
        setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);

        // Simulate Lia typing
        setIsTyping(true);
        setTimeout(() => {
            const response = generateLiaResponse(userMessage);
            setChatMessages(prev => [...prev, { role: 'lia', content: response }]);
            setIsTyping(false);
        }, 800);
    };

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

                    {/* Dynamic Chat Messages */}
                    {chatMessages.length > 0 && (
                        <div className="space-y-4 mb-4">
                            {chatMessages.map((msg, idx) => (
                                <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                    {msg.role === 'lia' && (
                                        <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs shrink-0">L</div>
                                    )}
                                    <div className={`rounded-2xl px-4 py-3 max-w-[80%] ${msg.role === 'user'
                                        ? 'bg-emerald-600 text-white rounded-tr-none'
                                        : 'bg-white/10 text-white rounded-tl-none border border-white/5'
                                        }`}>
                                        <p className="text-sm whitespace-pre-line">{msg.content}</p>
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs">L</div>
                                    <div className="bg-white/10 rounded-2xl rounded-tl-none px-4 py-3 border border-white/5">
                                        <div className="flex gap-1">
                                            <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>
                    )}

                    {/* Chat Input */}
                    <div className="flex gap-3 relative z-10">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder="Pergunte sobre suas métricas..."
                            className="flex-1 bg-black/20 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50 focus:bg-black/30 transition-all min-w-0"
                        />
                        <Button
                            onClick={handleSendMessage}
                            disabled={isTyping || !inputValue.trim()}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white w-14 h-14 rounded-2xl shadow-lg shadow-emerald-500/20 shrink-0 flex items-center justify-center disabled:opacity-50"
                        >
                            <ArrowRight className="w-6 h-6" />
                        </Button>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};
