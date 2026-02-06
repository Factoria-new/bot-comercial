import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Stethoscope } from "lucide-react";

/**
 * HeroSection - Saude Landing Page
 * HealthTech theme - "Apple Health meets Modern Clinic"
 * Uses --saude-* CSS variables
 */

const scenarios = [
    // Dentista
    [
        { id: 1, text: "Ola, gostaria de agendar uma consulta", sender: "user", delay: 1 },
        { id: 2, text: "Ola! Seja bem-vindo ao consultorio do Dr. Andre. Posso ajudar com agendamento. Qual sua preferencia de horario?", sender: "agent", delay: 3 },
        { id: 3, text: "Tenho disponibilidade quinta de manha", sender: "user", delay: 5 },
        { id: 4, text: "Perfeito! Quinta-feira, 10h esta disponivel. Confirmo seu agendamento?", sender: "agent", delay: 7 }
    ],
    // Psicologa
    [
        { id: 1, text: "Boa noite, preciso de atendimento", sender: "user", delay: 1 },
        { id: 2, text: "Ola! O espaco da Dra. Ana e seguro. Busca atendimento online ou presencial?", sender: "agent", delay: 3 },
        { id: 3, text: "Prefiro online por enquanto", sender: "user", delay: 5 },
        { id: 4, text: "Entendo. Temos horarios disponiveis na proxima semana. Posso enviar as opcoes?", sender: "agent", delay: 7 }
    ],
    // Fisioterapeuta
    [
        { id: 1, text: "Oi, e urgente, travei a coluna", sender: "user", delay: 1 },
        { id: 2, text: "Entendo a urgencia! A Dra. Carla tem um encaixe amanha as 8h. Reservo para voce?", sender: "agent", delay: 3 },
        { id: 3, text: "Sim, por favor!", sender: "user", delay: 5 },
        { id: 4, text: "Confirmado! Amanha 8h, endereco: Rua das Flores, 123. Melhoras!", sender: "agent", delay: 7 }
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
            className="relative min-h-screen z-50 flex items-center justify-center pt-16 pb-10"
            style={{ background: 'var(--saude-gradient-hero)' }}
        >
            {/* Large Top-Left Blob (Static) */}
            <div
                className="absolute -top-[110%] -left-[45%] w-[80vw] h-[80vw] rounded-full opacity-60 mix-blend-multiply pointer-events-none z-0"
                style={{ backgroundColor: 'hsl(var(--saude-secondary))' }}
            />

            <div className="container relative z-10 px-4 md:px-6">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Left Content */}
                    <div className="space-y-8 animate-fade-in-slow">
                        <div
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
                            style={{
                                backgroundColor: 'hsl(var(--saude-primary) / 0.1)',
                                color: 'hsl(var(--saude-primary))'
                            }}
                        >
                            <Stethoscope className="w-4 h-4" />
                            Para Profissionais de Saude
                        </div>

                        <h1
                            className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight"
                            style={{ color: 'hsl(var(--saude-foreground))' }}
                        >
                            Consultorio 24h:<br />
                            <span style={{ color: 'hsl(var(--saude-primary))' }}>
                                Sua agenda cheia,<br />sua mente tranquila.
                            </span>
                        </h1>

                        <p
                            className="text-lg md:text-xl max-w-xl leading-relaxed"
                            style={{ color: 'hsl(var(--saude-muted-foreground))' }}
                        >
                            O Caji tria pacientes e agenda consultas automaticamente no seu Google Calendar. Atenda sem interrupcoes.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Button
                                onClick={scrollToPricing}
                                className="h-14 px-8 text-lg font-semibold text-white rounded-2xl transition-all duration-300 hover:scale-[1.02]"
                                style={{
                                    backgroundColor: 'hsl(var(--saude-primary))',
                                    boxShadow: 'var(--saude-shadow-accent)'
                                }}
                            >
                                Testar no meu Consultorio
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Right Content - Glassmorphism Phone Mockup */}
                    <div className="relative animate-fade-in-slow delay-200">
                        <div
                            className="relative w-full max-w-[480px] mx-auto">
                            {/* Glassmorphism Container */}
                            <div
                                className="relative rounded-[2.5rem] p-6 h-[680px] flex flex-col backdrop-blur-xl"
                                style={{
                                    backgroundColor: 'hsl(var(--saude-card) / 0.85)',
                                    border: '1px solid hsl(var(--saude-border))',
                                    boxShadow: 'var(--saude-shadow-soft), 0 0 0 1px hsl(var(--saude-border) / 0.5)'
                                }}
                            >
                                {/* Phone Notch */}
                                <div
                                    className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-6 rounded-full"
                                    style={{ backgroundColor: 'hsl(var(--saude-border))' }}
                                />

                                {/* Chat Header */}
                                <div
                                    className="flex items-center gap-4 mt-8 mb-6 pb-4"
                                    style={{ borderBottom: '1px solid hsl(var(--saude-border))' }}
                                >
                                    <div
                                        className="w-12 h-12 rounded-2xl flex items-center justify-center relative overflow-hidden"
                                        style={{ backgroundColor: 'hsl(var(--saude-primary) / 0.1)' }}
                                    >
                                        <img
                                            src="/favicon-dark.png"
                                            alt="Caji Logo"
                                            className="w-full h-full object-contain p-2"
                                        />
                                    </div>
                                    <div>
                                        <h3
                                            className="font-semibold text-base"
                                            style={{ color: 'hsl(var(--saude-foreground))' }}
                                        >
                                            Assistente Virtual
                                        </h3>
                                        <div className="flex items-center gap-1.5">
                                            <span
                                                className="w-2 h-2 rounded-full animate-pulse"
                                                style={{ backgroundColor: 'hsl(var(--saude-primary))' }}
                                            />
                                            <span
                                                className="text-xs"
                                                style={{ color: 'hsl(var(--saude-muted-foreground))' }}
                                            >
                                                Online agora
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 space-y-4 overflow-hidden">
                                    {scenarios[scenarioIndex].map((msg) => (
                                        visibleMessages.includes(msg.id) && (
                                            <div
                                                key={`${scenarioIndex}-${msg.id}`}
                                                className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'} animate-fade-in-slow`}
                                            >
                                                <div
                                                    className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${msg.sender === 'user'
                                                        ? 'rounded-tl-md'
                                                        : 'rounded-tr-md'
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

                                {/* iPhone-style Input Bar (Decorative) */}
                                <div
                                    className="mt-4 flex items-center gap-2 p-2 rounded-full pointer-events-none select-none"
                                    style={{
                                        backgroundColor: 'hsl(var(--saude-background-alt))',
                                        border: '1px solid hsl(var(--saude-border))'
                                    }}
                                >
                                    {/* Camera Icon */}
                                    <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center"
                                        style={{ backgroundColor: 'hsl(var(--saude-primary))' }}
                                    >
                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    {/* Text Input Placeholder */}
                                    <div
                                        className="flex-1 px-4 py-2 text-sm rounded-full"
                                        style={{
                                            backgroundColor: 'hsl(var(--saude-card))',
                                            color: 'hsl(var(--saude-muted-foreground))'
                                        }}
                                    >
                                        Mensagem
                                    </div>
                                    {/* Send Icon */}
                                    <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center"
                                        style={{ backgroundColor: 'hsl(var(--saude-primary))' }}
                                    >
                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>

                                {/* iPhone Home Indicator */}
                                <div className="flex justify-center mt-4">
                                    <div
                                        className="w-32 h-1 rounded-full"
                                        style={{ backgroundColor: 'hsl(var(--saude-border))' }}
                                    />
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
