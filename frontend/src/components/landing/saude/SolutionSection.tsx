import { useState, useEffect } from "react";
import { Stethoscope, Brain, Apple } from "lucide-react";
import { motion } from "framer-motion";

/**
 * SolutionSection - Saude Landing Page
 * Interactive tabs with profession-specific chat demos
 * Uses --saude-* CSS variables
 */

const professions = [
    {
        id: 'dentista',
        label: 'Dentistas',
        icon: <Stethoscope className="w-4 h-4" />,
        chat: [
            { id: 1, text: "Ola, gostaria de agendar uma limpeza", sender: "user", delay: 0.5 },
            { id: 2, text: "Ola! O Dr. Andre esta em atendimento agora. Temos horarios disponiveis amanha as 14h ou sexta as 10h. Qual prefere?", sender: "agent", delay: 2 },
            { id: 3, text: "Sexta as 10h", sender: "user", delay: 3.5 },
            { id: 4, text: "Perfeito! Agendamento confirmado para sexta, 10h. Enviaremos um lembrete no dia anterior.", sender: "agent", delay: 5 }
        ]
    },
    {
        id: 'psicologo',
        label: 'Psicologos',
        icon: <Brain className="w-4 h-4" />,
        chat: [
            { id: 1, text: "Boa noite, preciso conversar", sender: "user", delay: 0.5 },
            { id: 2, text: "Ola! O espaco da Dra. Ana e seguro e sigiloso. Busca atendimento online ou presencial?", sender: "agent", delay: 2 },
            { id: 3, text: "Online, por favor", sender: "user", delay: 3.5 },
            { id: 4, text: "Entendo. Temos sessoes disponiveis na proxima semana. Posso enviar os horarios?", sender: "agent", delay: 5 }
        ]
    },
    {
        id: 'nutricionista',
        label: 'Nutricionistas',
        icon: <Apple className="w-4 h-4" />,
        chat: [
            { id: 1, text: "Oi, quero marcar uma consulta de reeducacao alimentar", sender: "user", delay: 0.5 },
            { id: 2, text: "Ola! A Dra. Julia atende reeducacao alimentar com foco em resultados sustentaveis. Primeira consulta ou retorno?", sender: "agent", delay: 2 },
            { id: 3, text: "Primeira consulta", sender: "user", delay: 3.5 },
            { id: 4, text: "Otimo! Temos horarios terça ou quinta. Qual dia funciona melhor para voce?", sender: "agent", delay: 5 }
        ]
    }
];

export const SolutionSection = () => {
    const [activeTab, setActiveTab] = useState('dentista');
    const [visibleMessages, setVisibleMessages] = useState<number[]>([]);
    const [isTyping, setIsTyping] = useState(false);

    const activeProfession = professions.find(p => p.id === activeTab) || professions[0];

    useEffect(() => {
        let timeouts: NodeJS.Timeout[] = [];

        setVisibleMessages([]);
        setIsTyping(false);

        // Determine the total duration of the conversation based on the last message's delay
        const lastMessageDelay = Math.max(...activeProfession.chat.map(m => m.delay));
        // Add buffer time after the conversation finishes before switching (e.g., 4 seconds)
        const switchDelay = lastMessageDelay + 4;

        // Schedule auto-switch
        const switchTimeout = setTimeout(() => {
            const currentIndex = professions.findIndex(p => p.id === activeTab);
            const nextIndex = (currentIndex + 1) % professions.length;
            setActiveTab(professions[nextIndex].id);
        }, switchDelay * 1000);
        timeouts.push(switchTimeout);

        activeProfession.chat.forEach((msg) => {
            const msgTimeout = setTimeout(() => {
                setIsTyping(false);
                setVisibleMessages((prev) => [...prev, msg.id]);
            }, msg.delay * 1000);
            timeouts.push(msgTimeout);

            if (msg.sender === 'agent') {
                const typingStartDelay = Math.max(0, msg.delay - 1.5);
                const typingTimeout = setTimeout(() => {
                    setIsTyping(true);
                }, typingStartDelay * 1000);
                timeouts.push(typingTimeout);
            }
        });

        return () => timeouts.forEach(clearTimeout);
    }, [activeTab, activeProfession]);

    return (
        <section
            className="py-24 relative z-30"
            style={{ backgroundColor: 'hsl(var(--saude-background-alt))' }}
        >
            <div className="container px-4 md:px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-center max-w-2xl mx-auto mb-16"
                >
                    <h2
                        className="text-3xl md:text-4xl font-bold mb-6 tracking-tight"
                        style={{ color: 'hsl(var(--saude-foreground))' }}
                    >
                        Veja o Caji em{' '}
                        <span style={{ color: 'hsl(var(--saude-primary))' }}>
                            Ação
                        </span>
                    </h2>
                    <p
                        className="text-lg leading-relaxed"
                        style={{ color: 'hsl(var(--saude-muted-foreground))' }}
                    >
                        Selecione sua especialidade e veja como o Caji atende seus pacientes.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    className="max-w-4xl mx-auto"
                >
                    {/* Tabs */}
                    <div
                        className="flex justify-center gap-1 mb-8 p-1.5 rounded-2xl w-fit mx-auto relative flex-wrap backdrop-blur-sm"
                        style={{
                            backgroundColor: 'hsl(var(--saude-primary) / 0.1)',
                            border: '1px solid hsl(var(--saude-border))',
                        }}
                    >
                        {professions.map((prof) => (
                            <button
                                key={prof.id}
                                onClick={() => setActiveTab(prof.id)}
                                className={`relative z-10 flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300`}
                                style={{
                                    color: activeTab === prof.id
                                        ? 'hsl(var(--saude-primary))'
                                        : 'hsl(var(--saude-muted-foreground))'
                                }}
                            >
                                {activeTab === prof.id && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 rounded-xl shadow-sm"
                                        style={{ backgroundColor: 'white' }}
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <span className="relative z-10 flex items-center gap-2">
                                    {prof.icon}
                                    {prof.label}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Chat Demo */}
                    <div
                        key={activeTab} // Force re-render to restart animations
                        className="rounded-3xl p-8 transition-all duration-500 min-h-[400px]"
                        style={{
                            backgroundColor: 'hsl(var(--saude-card))',
                            border: '1px solid hsl(var(--saude-border))',
                            boxShadow: 'var(--saude-shadow-soft)'
                        }}
                    >
                        <div className="space-y-4">
                            {activeProfession.chat.map((msg) => (
                                visibleMessages.includes(msg.id) && (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'} animate-fade-in-slow`}
                                    >
                                        <div
                                            className={`max-w-[70%] p-4 rounded-2xl text-sm leading-relaxed ${msg.sender === 'user' ? 'rounded-tl-md' : 'rounded-tr-md'
                                                }`}
                                            style={msg.sender === 'user'
                                                ? {
                                                    backgroundColor: 'hsl(var(--saude-background-alt))',
                                                    color: 'hsl(var(--saude-foreground))'
                                                }
                                                : {
                                                    backgroundColor: 'hsl(var(--saude-primary))',
                                                    color: 'white'
                                                }
                                            }
                                        >
                                            {msg.text}
                                        </div>
                                    </div>
                                )
                            ))}
                            {isTyping && (
                                <div className="flex justify-end animate-fade-in-slow">
                                    <div
                                        className="p-4 rounded-2xl rounded-tr-md flex gap-1.5 items-center w-fit h-12 justify-center"
                                        style={{ backgroundColor: 'hsl(var(--saude-primary) / 0.15)' }}
                                    >
                                        <div
                                            className="w-2 h-2 rounded-full animate-bounce"
                                            style={{ backgroundColor: 'hsl(var(--saude-primary))' }}
                                        />
                                        <div
                                            className="w-2 h-2 rounded-full animate-bounce"
                                            style={{ backgroundColor: 'hsl(var(--saude-primary))', animationDelay: '100ms' }}
                                        />
                                        <div
                                            className="w-2 h-2 rounded-full animate-bounce"
                                            style={{ backgroundColor: 'hsl(var(--saude-primary))', animationDelay: '200ms' }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default SolutionSection;
