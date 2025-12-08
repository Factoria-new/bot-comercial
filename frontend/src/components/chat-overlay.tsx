import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";

const scenarios = [
    [
        { id: 1, text: "Quero pedir uma pizza de Calabresa.", sender: "user", delay: 1 },
        { id: 2, text: "Ótima escolha! 🍕 Vai querer borda recheada?", sender: "agent", delay: 2.5 },
        { id: 3, text: "Sim, de Catupiry, por favor.", sender: "user", delay: 4.5 },
        { id: 4, text: "Anotado! Calabresa com borda de Catupiry saindo! 🛵", sender: "agent", delay: 6.5 }
    ],
    [
        { id: 1, text: "Gostaria de agendar uma visita.", sender: "user", delay: 1 },
        { id: 2, text: "Claro! Tenho horários livres na quinta às 14h ou sexta às 10h.", sender: "agent", delay: 3 },
        { id: 3, text: "Sexta às 10h fica ótimo.", sender: "user", delay: 5 },
        { id: 4, text: "Confirmado! Te aguardamos na sexta. 📅", sender: "agent", delay: 6.5 }
    ],
    [
        { id: 1, text: "Como funciona a automação?", sender: "user", delay: 1 },
        { id: 2, text: "Nossa IA atende seus clientes 24/7 no WhatsApp. Qual o seu segmento?", sender: "agent", delay: 3 },
        { id: 3, text: "Sou corretor de imóveis.", sender: "user", delay: 5 },
        { id: 4, text: "Perfeito! Temos templates prontos para imobiliárias. Quer ver um demo?", sender: "agent", delay: 7 }
    ]
];

const TypingIndicator = () => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="flex justify-end"
    >
        <div className="bg-[#FF8566] p-4 rounded-2xl rounded-tr-none shadow-lg backdrop-blur-sm flex gap-1.5 items-center w-fit h-12 min-w-[60px] justify-center">
            <motion.div
                className="w-1.5 h-1.5 bg-white rounded-full"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
            />
            <motion.div
                className="w-1.5 h-1.5 bg-white rounded-full"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
            />
            <motion.div
                className="w-1.5 h-1.5 bg-white rounded-full"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
            />
        </div>
    </motion.div>
);

export const ChatOverlay = () => {
    const [scenarioIndex, setScenarioIndex] = useState(0);
    const [visibleMessages, setVisibleMessages] = useState<number[]>([]);
    const [isExiting, setIsExiting] = useState(false);
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        let timeouts: NodeJS.Timeout[] = [];
        const currentScenario = scenarios[scenarioIndex];

        // Reset state for new scenario
        setVisibleMessages([]);
        setIsExiting(false);
        setIsTyping(false);

        // Schedule messages and typing indicators
        currentScenario.forEach((msg) => {
            // Show message
            const msgTimeout = setTimeout(() => {
                setIsTyping(false);
                setVisibleMessages((prev) => [...prev, msg.id]);
            }, msg.delay * 1000);
            timeouts.push(msgTimeout);

            // Schedule typing indicator for agent messages
            if (msg.sender === 'agent') {
                const typingStartDelay = Math.max(0, msg.delay - 1.5); // Start typing 1.5s before message
                // Only show typing if it's after the previous message (or start of scenario)
                // For simplicity, we just schedule it. Ideally check overlap.
                const typingTimeout = setTimeout(() => {
                    setIsTyping(true);
                }, typingStartDelay * 1000);
                timeouts.push(typingTimeout);
            }
        });

        // Schedule transition to next scenario
        const totalDuration = Math.max(...currentScenario.map(m => m.delay)) + 4; // 4s pause after last message

        const exitTimeout = setTimeout(() => {
            setIsExiting(true);
        }, (totalDuration - 0.5) * 1000); // Start exit animation slightly before switch

        const switchTimeout = setTimeout(() => {
            setScenarioIndex((prev) => (prev + 1) % scenarios.length);
        }, totalDuration * 1000);

        timeouts.push(exitTimeout, switchTimeout);

        return () => timeouts.forEach(clearTimeout);
    }, [scenarioIndex]);

    return (
        <motion.div

            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0 flex flex-col items-start justify-center p-6 md:pl-20 pointer-events-none z-30"
        >
            <div className="w-full max-w-sm bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-4 shadow-2xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10"
                >
                    <div className="bg-[#FF8566] p-2 rounded-full shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                            <line x1="12" x2="12" y1="19" y2="22" />
                        </svg>
                    </div>
                    <div>
                        <div className="font-bold text-white text-sm drop-shadow-sm">Agente Factoria</div>
                        <div className="text-white/80 text-xs font-medium">Vendas & Suporte</div>
                    </div>
                </motion.div>

                {/* Messages */}
                <motion.div
                    className="space-y-4 min-h-[300px] flex flex-col justify-end"
                    animate={{ opacity: isExiting ? 0 : 1, y: isExiting ? -20 : 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <AnimatePresence mode="popLayout">
                        {scenarios[scenarioIndex].map((msg) => (
                            visibleMessages.includes(msg.id) && (
                                <motion.div
                                    key={`${scenarioIndex}-${msg.id}`}
                                    layout
                                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                    className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}
                                >
                                    <div
                                        className={`max-w-[85%] p-3.5 rounded-2xl text-sm font-medium shadow-sm backdrop-blur-sm ${msg.sender === 'user'
                                            ? 'bg-white text-slate-800 rounded-tl-none'
                                            : 'bg-[#FF8566] text-white rounded-tr-none'
                                            }`}
                                    >
                                        {msg.text}
                                    </div>
                                </motion.div>
                            )
                        ))}
                    </AnimatePresence>

                    {isTyping && <TypingIndicator />}
                </motion.div>
            </div>
        </motion.div>
    );
};
