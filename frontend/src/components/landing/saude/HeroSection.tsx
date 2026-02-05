import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Stethoscope } from "lucide-react";

const scenarios = [
    // Variacao 1: Dentista - Foco em "Emergencia"
    [
        { id: 1, text: "Estou com muita dor de dente, conseguem me atender?", sender: "user", delay: 1 },
        { id: 2, text: "Sinto muito por isso! O Dr. Andre esta em cirurgia, mas prioriza emergencias. Pode vir hoje as 14:30?", sender: "agent", delay: 3 },
        { id: 3, text: "Consigo sim, obrigado!", sender: "user", delay: 5 },
        { id: 4, text: "Confirmado. Vou deixar tudo pronto para sua chegada. Melhoras!", sender: "agent", delay: 6.5 }
    ],
    // Variacao 2: Psicologia - Foco em "Acolhimento"
    [
        { id: 1, text: "Gostaria de saber como funciona a terapia.", sender: "user", delay: 1 },
        { id: 2, text: "Ola! O espaco da Dra. Ana e seguro e acolhedor. Busca atendimento presencial ou online?", sender: "agent", delay: 3 },
        { id: 3, text: "Seria online, minha rotina e corrida.", sender: "user", delay: 5 },
        { id: 4, text: "Perfeito. Temos horarios flexiveis. Vou enviar o link da agenda com privacidade.", sender: "agent", delay: 7 }
    ],
    // Variacao 3: Nutricionista/Fisio - Foco em "Triagem"
    [
        { id: 1, text: "A consulta aceita plano de saude?", sender: "user", delay: 1 },
        { id: 2, text: "Oi! Trabalhamos com particular e emitimos recibo para reembolso. O valor e R$ 200 c/ retorno. Faz sentido?", sender: "agent", delay: 3 },
        { id: 3, text: "Entendi. Vou querer marcar sim.", sender: "user", delay: 5.5 },
        { id: 4, text: "Otima escolha! Prefere manha ou tarde para a primeira avaliacao?", sender: "agent", delay: 7.5 }
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
            style={{ background: 'var(--saude-gradient-hero)' }}
        >
            {/* Subtle Background Decorations */}
            <div className="absolute top-[10%] right-[5%] w-[300px] h-[300px] rounded-full blur-[100px] opacity-40"
                style={{ backgroundColor: 'hsl(var(--saude-primary) / 0.15)' }} />
            <div className="absolute bottom-[10%] left-[5%] w-[250px] h-[250px] rounded-full blur-[80px] opacity-30"
                style={{ backgroundColor: 'hsl(var(--saude-secondary) / 0.15)' }} />

            <div className="container relative z-10 px-4 md:px-6">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left Content */}
                    <div className="space-y-8 animate-fade-in-up">
                        <div
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider"
                            style={{
                                backgroundColor: 'hsl(var(--saude-secondary) / 0.1)',
                                border: '1px solid hsl(var(--saude-secondary) / 0.3)',
                                color: 'hsl(var(--saude-secondary))'
                            }}
                        >
                            <span className="relative flex h-2 w-2">
                                <span
                                    className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                                    style={{ backgroundColor: 'hsl(var(--saude-secondary))' }}
                                />
                                <span
                                    className="relative inline-flex rounded-full h-2 w-2"
                                    style={{ backgroundColor: 'hsl(var(--saude-secondary))' }}
                                />
                            </span>
                            Para Profissionais da Saude
                        </div>

                        <h1
                            className="text-4xl md:text-6xl lg:text-7xl font-display font-bold leading-tight"
                            style={{ color: 'hsl(var(--saude-foreground))' }}
                        >
                            Sua agenda cheia,<br />
                            <span
                                className="text-transparent bg-clip-text"
                                style={{ backgroundImage: 'linear-gradient(135deg, hsl(var(--saude-primary)), hsl(var(--saude-secondary)))' }}
                            >
                                sem interrupcoes
                            </span>
                        </h1>

                        <p
                            className="text-lg md:text-xl font-sans max-w-xl leading-relaxed"
                            style={{ color: 'hsl(var(--saude-muted-foreground))' }}
                        >
                            Atenda seus pacientes com atencao total enquanto nossa IA cuida dos agendamentos, tira duvidas e confirma consultas 24h por dia.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button
                                onClick={scrollToPricing}
                                className="h-14 px-10 text-lg font-bold text-white rounded-xl transition-all duration-300 hover:scale-105"
                                style={{
                                    backgroundColor: 'hsl(var(--saude-primary))',
                                    boxShadow: 'var(--saude-shadow-accent)'
                                }}
                            >
                                Comecar Agora
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </div>

                        <div className="flex flex-wrap gap-6 pt-4 text-sm font-sans">
                            {['LGPD Compliant', 'Triagem Inteligente', 'Reducao de No-Show'].map((feat, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-2"
                                    style={{ color: 'hsl(var(--saude-muted-foreground))' }}
                                >
                                    <CheckCircle2
                                        className="w-4 h-4"
                                        style={{ color: 'hsl(var(--saude-primary))' }}
                                    />
                                    {feat}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Content - Chat Simulation */}
                    <div className="relative animate-slide-in-right delay-200">
                        <div className="relative w-full max-w-[400px] mx-auto">
                            {/* Soft glow behind chat */}
                            <div
                                className="absolute inset-0 rounded-[2.5rem] blur-[40px] opacity-50"
                                style={{ backgroundColor: 'hsl(var(--saude-primary) / 0.15)' }}
                            />

                            {/* Chat Container */}
                            <div
                                className="relative rounded-[2.5rem] p-6 h-[500px] flex flex-col"
                                style={{
                                    backgroundColor: 'hsl(var(--saude-card))',
                                    border: '1px solid hsl(var(--saude-border))',
                                    boxShadow: 'var(--saude-shadow-soft)'
                                }}
                            >
                                {/* Chat Header */}
                                <div
                                    className="flex items-center gap-4 mb-8 pb-4"
                                    style={{ borderBottom: '1px solid hsl(var(--saude-border))' }}
                                >
                                    <div
                                        className="w-12 h-12 rounded-full flex items-center justify-center"
                                        style={{
                                            backgroundColor: 'hsl(var(--saude-primary))',
                                            boxShadow: '0 4px 12px hsl(var(--saude-primary) / 0.3)'
                                        }}
                                    >
                                        <Stethoscope className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3
                                            className="font-bold font-display"
                                            style={{ color: 'hsl(var(--saude-foreground))' }}
                                        >
                                            Secretaria Virtual
                                        </h3>
                                        <div className="flex items-center gap-1.5">
                                            <span
                                                className="w-2 h-2 rounded-full animate-pulse"
                                                style={{ backgroundColor: 'hsl(var(--saude-primary))' }}
                                            />
                                            <span
                                                className="text-xs font-medium uppercase tracking-wider"
                                                style={{ color: 'hsl(var(--saude-primary))' }}
                                            >
                                                Online agora
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Chat Messages */}
                                <div className="flex-1 space-y-4 overflow-hidden mask-gradient-b">
                                    {scenarios[scenarioIndex].map((msg) => (
                                        visibleMessages.includes(msg.id) && (
                                            <div
                                                key={`${scenarioIndex}-${msg.id}`}
                                                className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'} animate-message-appear`}
                                            >
                                                <div
                                                    className="max-w-[85%] p-4 rounded-2xl text-sm font-medium"
                                                    style={msg.sender === 'user'
                                                        ? {
                                                            backgroundColor: 'hsl(var(--saude-background-alt))',
                                                            border: '1px solid hsl(var(--saude-border))',
                                                            color: 'hsl(var(--saude-foreground))',
                                                            borderTopLeftRadius: 0
                                                        }
                                                        : {
                                                            backgroundColor: 'hsl(var(--saude-primary))',
                                                            color: 'white',
                                                            borderTopRightRadius: 0
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
                                                className="p-4 rounded-2xl rounded-tr-none flex gap-1.5 items-center w-fit h-12 justify-center"
                                                style={{ backgroundColor: 'hsl(var(--saude-primary) / 0.2)' }}
                                            >
                                                <div
                                                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                                                    style={{ backgroundColor: 'hsl(var(--saude-primary))' }}
                                                />
                                                <div
                                                    className="w-1.5 h-1.5 rounded-full animate-bounce delay-100"
                                                    style={{ backgroundColor: 'hsl(var(--saude-primary))' }}
                                                />
                                                <div
                                                    className="w-1.5 h-1.5 rounded-full animate-bounce delay-200"
                                                    style={{ backgroundColor: 'hsl(var(--saude-primary))' }}
                                                />
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
