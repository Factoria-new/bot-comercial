import { motion } from "motion/react";
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

export const ChatOverlay = () => {
    const [scenarioIndex, setScenarioIndex] = useState(0);
    const [visibleMessages, setVisibleMessages] = useState<number[]>([]);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        let timeouts: NodeJS.Timeout[] = [];
        const currentScenario = scenarios[scenarioIndex];

        // Reset state for new scenario
        setVisibleMessages([]);
        setIsExiting(false);

        // Schedule messages
        currentScenario.forEach((msg) => {
            const timeout = setTimeout(() => {
                setVisibleMessages((prev) => [...prev, msg.id]);
            }, msg.delay * 1000);
            timeouts.push(timeout);
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
        <div className="absolute inset-0 flex flex-col items-start justify-center p-6 md:pl-20 pointer-events-none z-30">
            <div className="w-full max-w-sm">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center gap-2 mb-6"
                >
                    <div className="bg-white/20 backdrop-blur-md p-1.5 rounded-lg">
                        <span className="font-bold text-white text-xs">IA</span>
                    </div>
                    <span className="text-white font-medium text-sm drop-shadow-md">
                        Agente Factoria • Vendas
                    </span>
                </motion.div>

                {/* Messages */}
                <motion.div
                    className="space-y-4"
                    animate={{ opacity: isExiting ? 0 : 1, y: isExiting ? -20 : 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {scenarios[scenarioIndex].map((msg) => (
                        visibleMessages.includes(msg.id) && (
                            <motion.div
                                key={`${scenarioIndex}-${msg.id}`}
                                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}
                            >
                                <div
                                    className={`max-w-[85%] p-4 rounded-2xl text-sm font-medium shadow-lg backdrop-blur-sm ${msg.sender === 'user'
                                        ? 'bg-white text-slate-800 rounded-tl-none'
                                        : 'bg-[#FF6B4A] text-white rounded-tr-none'
                                        }`}
                                >
                                    {msg.text}
                                </div>
                            </motion.div>
                        )
                    ))}
                </motion.div>
            </div>
        </div>
    );
};
