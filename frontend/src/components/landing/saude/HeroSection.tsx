import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const scenarios = [
    // Variação 1: Dentista - Foco em "Emergência"
    [
        { id: 1, text: "Estou com muita dor de dente, conseguem me atender?", sender: "user", delay: 1 },
        { id: 2, text: "Sinto muito por isso! 🦷 O Dr. André está em cirurgia, mas prioriza emergências. Pode vir hoje às 14:30?", sender: "agent", delay: 3 },
        { id: 3, text: "Consigo sim, obrigado!", sender: "user", delay: 5 },
        { id: 4, text: "Confirmado. Vou deixar tudo pronto para sua chegada. Melhoras! 🚑", sender: "agent", delay: 6.5 }
    ],
    // Variação 2: Psicologia - Foco em "Acolhimento"
    [
        { id: 1, text: "Gostaria de saber como funciona a terapia.", sender: "user", delay: 1 },
        { id: 2, text: "Olá! O espaço da Dra. Ana é seguro e acolhedor. 🌿 Busca atendimento presencial ou online?", sender: "agent", delay: 3 },
        { id: 3, text: "Seria online, minha rotina é corrida.", sender: "user", delay: 5 },
        { id: 4, text: "Perfeito. Temos horários flexíveis. Vou enviar o link da agenda com privacidade. 🗓️", sender: "agent", delay: 7 }
    ],
    // Variação 3: Nutricionista/Físio - Foco em "Triagem"
    [
        { id: 1, text: "A consulta aceita plano de saúde?", sender: "user", delay: 1 },
        { id: 2, text: "Oi! Trabalhamos com particular e emitimos recibo para reembolso. 🥗 O valor é R$ 200 c/ retorno. Faz sentido?", sender: "agent", delay: 3 },
        { id: 3, text: "Entendi. Vou querer marcar sim.", sender: "user", delay: 5.5 },
        { id: 4, text: "Ótima escolha! 🍎 Prefere manhã ou tarde para a primeira avaliação?", sender: "agent", delay: 7.5 }
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
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-lp-background pt-20 pb-10">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-lp-gradient-hero opacity-80" />
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-float" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-500/10 rounded-full blur-[120px] animate-float transition-all delay-1000" />

            <div className="container relative z-10 px-4 md:px-6">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left Content */}
                    <div className="space-y-8 animate-fade-in-up">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lp-accent/10 border border-lp-accent/20 text-lp-accent text-sm font-bold uppercase tracking-wider">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lp-accent opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-lp-accent"></span>
                            </span>
                            Para Profissionais da Saúde
                        </div>

                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold leading-tight text-white">
                            Sua agenda cheia,<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lp-accent to-lp-accent/80">
                                sem interrupções
                            </span>
                        </h1>

                        <p className="text-lg md:text-xl text-lp-muted-foreground font-sans max-w-xl">
                            Atenda seus pacientes com atenção total enquanto nossa IA cuida dos agendamentos, tira dúvidas e confirma consultas 24h por dia.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button
                                onClick={scrollToPricing}
                                className="h-14 px-10 text-lg font-bold bg-lp-accent hover:bg-lp-accent/90 text-white rounded-xl shadow-[0_0_20px_rgba(25,177,89,0.3)] hover:shadow-[0_0_30px_rgba(25,177,89,0.5)] transition-all duration-300 hover:scale-105"
                            >
                                Começar Agora
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </div>

                        <div className="flex flex-wrap gap-6 pt-4 text-sm text-lp-muted-foreground font-sans">
                            {['LGPD Compliant', 'Triagem Inteligente', 'Redução de No-Show'].map((feat, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-lp-accent" />
                                    {feat}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Content - Chat Simulation */}
                    <div className="relative animate-slide-in-right delay-200">
                        <div className="relative w-full max-w-[400px] mx-auto">
                            <div className="absolute inset-0 bg-lp-accent/20 rounded-[2.5rem] blur-[60px]" />
                            <div className="relative bg-lp-card/80 backdrop-blur-xl border border-white/10 rounded-[2.5rem] shadow-2xl p-6 h-[500px] flex flex-col">
                                <div className="flex items-center gap-4 mb-8 border-b border-white/5 pb-4">
                                    <div className="w-12 h-12 rounded-full bg-lp-accent flex items-center justify-center shadow-lg shadow-lp-accent/20">
                                        <img src="/favicon.png" alt="Caji" className="w-8 h-8 object-contain brightness-0 invert" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold font-display">Secretária Virtual</h3>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-lp-accent animate-pulse" />
                                            <span className="text-xs text-lp-accent font-medium uppercase tracking-wider">Online agora</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-4 overflow-hidden mask-gradient-b">
                                    {scenarios[scenarioIndex].map((msg) => (
                                        visibleMessages.includes(msg.id) && (
                                            <div
                                                key={`${scenarioIndex}-${msg.id}`}
                                                className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'} animate-message-appear`}
                                            >
                                                <div
                                                    className={`max-w-[85%] p-4 rounded-2xl text-sm font-medium shadow-sm backdrop-blur-sm ${msg.sender === 'user'
                                                        ? 'bg-white/10 border border-white/10 text-white rounded-tl-none'
                                                        : 'bg-lp-accent text-white rounded-tr-none'
                                                        }`}
                                                >
                                                    {msg.text}
                                                </div>
                                            </div>
                                        )
                                    ))}
                                    {isTyping && (
                                        <div className="flex justify-end animate-fade-in">
                                            <div className="bg-lp-accent/40 p-4 rounded-2xl rounded-tr-none flex gap-1.5 items-center w-fit h-12 justify-center backdrop-blur-sm">
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
