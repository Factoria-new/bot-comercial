import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Scissors } from "lucide-react";

/**
 * HeroSection - Beleza Landing Page
 * ISOLATED dark luxury theme for beauty businesses
 * Uses --beleza-* CSS variables
 */

const scenarios = [
    // Variacao 1: Barbearia - Foco em "Maos Ocupadas" e Google Calendar
    [
        { id: 1, text: "Eai, tem horario pra cortar o cabelo hoje?", sender: "user", delay: 1 },
        { id: 2, text: "Fala chefe! O Marcao ta na regua. Quer as 18h?", sender: "agent", delay: 3 },
        { id: 3, text: "Opa, 18h fica show pra mim.", sender: "user", delay: 5 },
        { id: 4, text: "Fechado! Reservado no Google Agenda. Te vejo as 18h!", sender: "agent", delay: 7 }
    ],
    // Variacao 2: Manicure/Nail Design - Foco em "Voz Humanizada" e Detalhes
    [
        { id: 1, text: "Oi! Quanto ta o alongamento de fibra?", sender: "user", delay: 1 },
        { id: 2, text: "Oii linda! Ta R$ 120. Posso mandar um audio explicando?", sender: "agent", delay: 3 },
        { id: 3, text: "Pode sim, por favor.", sender: "user", delay: 5 },
        { id: 4, text: "[Audio] ...Quer marcar? Tenho horario amanha cedo!", sender: "agent", delay: 7.5 }
    ],
    // Variacao 3: Clinica de Estetica - Foco em "Atendimento Noturno"
    [
        { id: 1, text: "Voces fazem limpeza de pele?", sender: "user", delay: 1 },
        { id: 2, text: "Fazemos sim! A clinica ta fechada, mas to aqui 24h. Quer ver os horarios?", sender: "agent", delay: 3 },
        { id: 3, text: "Quero sim, trabalho o dia todo.", sender: "user", delay: 5 },
        { id: 4, text: "Temos quinta ate as 20h. Posso reservar pra voce?", sender: "agent", delay: 7 }
    ]
];

export const HeroSection = () => {
    const [scenarioIndex, setScenarioIndex] = useState(0);
    const [visibleMessages, setVisibleMessages] = useState<number[]>([]);
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        let timeouts: NodeJS.Timeout[] = [];
        const currentScenario = scenarios[scenarioIndex];

        setVisibleMessages([]);
        setIsTyping(false);

        currentScenario.forEach((msg) => {
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

        const totalDuration = Math.max(...currentScenario.map(m => m.delay)) + 4;
        const switchTimeout = setTimeout(() => {
            setScenarioIndex((prev) => (prev + 1) % scenarios.length);
        }, totalDuration * 1000);

        timeouts.push(switchTimeout);
        return () => timeouts.forEach(clearTimeout);
    }, [scenarioIndex]);

    const scrollToPricing = () => {
        const element = document.getElementById("pricing");
        element?.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <section
            className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-10"
            style={{ background: 'var(--beleza-gradient-hero)' }}
        >
            {/* Background Effects - Purple/Pink Glow */}
            <div
                className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] animate-float"
                style={{ backgroundColor: 'hsl(292 91% 73% / 0.15)' }}
            />
            <div
                className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] animate-float"
                style={{ backgroundColor: 'hsl(262 83% 66% / 0.15)' }}
            />

            <div className="container relative z-10 px-4 md:px-6">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left Content */}
                    <div className="space-y-8 animate-fade-in-up">
                        <div
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider"
                            style={{
                                background: 'var(--beleza-gradient-primary)',
                                color: 'white'
                            }}
                        >
                            <Scissors className="w-4 h-4" />
                            Para Negocios de Beleza
                        </div>

                        <h1
                            className="text-3xl md:text-5xl lg:text-6xl font-display font-bold leading-tight uppercase tracking-tight"
                            style={{ color: 'hsl(var(--beleza-foreground))' }}
                        >
                            Sua recepcionista de IA.<br />
                            <span
                                className="text-transparent bg-clip-text"
                                style={{ backgroundImage: 'var(--beleza-gradient-primary)' }}
                            >
                                Por menos de um corte.
                            </span>
                        </h1>

                        <p
                            className="text-lg md:text-xl max-w-xl"
                            style={{ color: 'hsl(var(--beleza-muted-foreground))' }}
                        >
                            Parar para responder WhatsApp e parar de faturar. Deixe nossa IA agendar seus clientes 24h por dia, integrado ao seu Google Agenda.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button
                                onClick={scrollToPricing}
                                className="h-14 px-10 text-lg font-bold text-white rounded-xl transition-all duration-300 hover:scale-105"
                                style={{
                                    background: 'var(--beleza-gradient-primary)',
                                    boxShadow: 'var(--beleza-shadow-accent)'
                                }}
                            >
                                COMECAR AGORA
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </div>

                        <div
                            className="flex flex-wrap gap-6 pt-4 text-sm"
                            style={{ color: 'hsl(var(--beleza-muted-foreground))' }}
                        >
                            {['Zero No-Show', 'Audios Humanizados', 'Agenda Sincronizada'].map((feat, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <CheckCircle2
                                        className="w-4 h-4"
                                        style={{ color: 'hsl(var(--beleza-primary))' }}
                                    />
                                    {feat}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Content - Chat Simulation */}
                    <div className="relative animate-slide-in-right delay-200">
                        <div className="relative w-full max-w-[400px] mx-auto">
                            {/* Gradient glow behind chat */}
                            <div
                                className="absolute inset-0 rounded-[2.5rem] blur-[60px] opacity-60"
                                style={{ background: 'var(--beleza-gradient-primary)' }}
                            />

                            {/* Chat Container */}
                            <div
                                className="relative rounded-[2.5rem] backdrop-blur-xl p-6 h-[500px] flex flex-col"
                                style={{
                                    backgroundColor: 'hsl(var(--beleza-card))',
                                    border: '1px solid hsl(var(--beleza-border))',
                                    boxShadow: 'var(--beleza-shadow-card)'
                                }}
                            >
                                {/* Chat Header */}
                                <div
                                    className="flex items-center gap-4 mb-8 pb-4"
                                    style={{ borderBottom: '1px solid hsl(var(--beleza-border))' }}
                                >
                                    <div
                                        className="w-12 h-12 rounded-full flex items-center justify-center"
                                        style={{
                                            background: 'var(--beleza-gradient-primary)',
                                            boxShadow: 'var(--beleza-shadow-accent)'
                                        }}
                                    >
                                        <Scissors className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3
                                            className="font-bold font-display uppercase tracking-wide"
                                            style={{ color: 'hsl(var(--beleza-foreground))' }}
                                        >
                                            Agendamento IA
                                        </h3>
                                        <div className="flex items-center gap-1.5">
                                            <span
                                                className="w-2 h-2 rounded-full animate-pulse"
                                                style={{ backgroundColor: 'hsl(var(--beleza-primary))' }}
                                            />
                                            <span
                                                className="text-xs font-medium uppercase tracking-wider"
                                                style={{ color: 'hsl(var(--beleza-primary))' }}
                                            >
                                                Online agora
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 space-y-4 overflow-hidden mask-gradient-b">
                                    {scenarios[scenarioIndex].map((msg) => (
                                        visibleMessages.includes(msg.id) && (
                                            <div
                                                key={`${scenarioIndex}-${msg.id}`}
                                                className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'} animate-message-appear`}
                                            >
                                                <div
                                                    className={`max-w-[85%] p-4 rounded-2xl text-sm font-medium shadow-sm backdrop-blur-sm ${msg.sender === 'user'
                                                        ? 'rounded-tl-none'
                                                        : 'rounded-tr-none text-white'
                                                        }`}
                                                    style={msg.sender === 'user'
                                                        ? {
                                                            backgroundColor: 'hsl(var(--beleza-background))',
                                                            border: '1px solid hsl(var(--beleza-border))',
                                                            color: 'hsl(var(--beleza-foreground))'
                                                        }
                                                        : {
                                                            background: 'var(--beleza-gradient-primary)'
                                                        }
                                                    }
                                                >
                                                    {msg.text}
                                                </div>
                                            </div>
                                        )
                                    ))}
                                    {isTyping && (
                                        <div className="flex justify-end animate-fade-in">
                                            <div
                                                className="p-4 rounded-2xl rounded-tr-none flex gap-1.5 items-center w-fit h-12 justify-center backdrop-blur-sm"
                                                style={{ background: 'var(--beleza-gradient-primary)', opacity: 0.6 }}
                                            >
                                                <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
                                                <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-100" />
                                                <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-200" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
