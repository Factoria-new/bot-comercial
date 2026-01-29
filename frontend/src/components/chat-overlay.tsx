import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MoreHorizontal } from "lucide-react";

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
        <div className="bg-[#027831] p-4 rounded-2xl rounded-tr-none shadow-lg backdrop-blur-sm flex gap-1.5 items-center w-fit h-12 min-w-[60px] justify-center">
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
            className="absolute inset-0 flex flex-col items-center justify-start pt-[9vh] md:items-start md:justify-center md:pt-0 md:pl-20 pointer-events-none z-30"
        >
            <div className="w-[85%] md:w-full max-w-sm scale-75 md:scale-100 origin-top bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="hidden md:flex items-center justify-between px-4 py-3 bg-white/10 border-b border-white/10 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Avatar className="h-9 w-9 border border-white/20">
                                <AvatarImage src="/favicon.png" alt="Caji Agent" />
                                <AvatarFallback className="bg-[#025e27] text-white text-xs">CJ</AvatarFallback>
                            </Avatar>
                            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white/10 ring-1 ring-black/5"></span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-white leading-none">Caji Assistant</span>
                            <span className="text-[10px] text-white/70 font-medium mt-0.5">Online agora</span>
                        </div>
                    </div>
                    <button className="text-white/70 hover:text-white transition-colors">
                        <MoreHorizontal className="h-5 w-5" />
                    </button>
                </div>

                {/* Messages */}
                <motion.div
                    className="space-y-4 min-h-[300px] flex flex-col justify-end p-4"
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
                                            : 'bg-[#027831] text-white rounded-tr-none'
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
