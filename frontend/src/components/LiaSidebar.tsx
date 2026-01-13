import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";

interface LiaSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    metrics: {
        totalMessages: number;
        newContacts: number;
        activeChats: number;
    };
}

const LiaSidebar = ({ isOpen, onClose, metrics }: LiaSidebarProps) => {
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

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                    />

                    {/* Sidebar */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed right-0 top-0 h-full w-full max-w-md bg-gradient-to-bl from-slate-900 via-slate-900 to-emerald-950/50 border-l border-emerald-500/20 shadow-2xl z-50 flex flex-col"
                    >
                        {/* Decorative glow */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/10 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-emerald-500 blur-lg opacity-40 animate-pulse" />
                                    <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-lg relative z-10 border-2 border-white/20">
                                        L
                                    </div>
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full z-20" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        Lia
                                        <span className="text-xs font-normal text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">Online</span>
                                    </h3>
                                    <p className="text-white/60 text-sm">Sua assistente de métricas</p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="text-white/60 hover:text-white hover:bg-white/10 rounded-xl"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 relative z-10 custom-scrollbar">
                            {/* Welcome Message */}
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm shrink-0 border border-white/10">
                                    L
                                </div>
                                <div className="bg-white/10 rounded-2xl rounded-tl-none p-4 max-w-[85%] border border-white/5">
                                    <p className="text-white text-sm leading-relaxed">
                                        Olá! 👋 Estou aqui para te ajudar a entender suas métricas.
                                    </p>
                                    <ul className="text-white/70 text-xs mt-3 space-y-1.5">
                                        <li className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                            Quantas mensagens recebemos?
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                            Quantos novos clientes?
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                            Taxa de resposta?
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            {/* Dynamic Messages */}
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

                            {/* Typing Indicator */}
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

                        {/* Chat Input */}
                        <div className="p-6 border-t border-white/10 relative z-10">
                            <div className="flex gap-3">
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
                                    className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50 focus:bg-black/30 transition-all text-sm"
                                />
                                <Button
                                    onClick={handleSendMessage}
                                    disabled={isTyping || !inputValue.trim()}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white w-12 h-12 rounded-xl shadow-lg shadow-emerald-500/20 shrink-0 flex items-center justify-center disabled:opacity-50"
                                >
                                    <ArrowRight className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default LiaSidebar;
