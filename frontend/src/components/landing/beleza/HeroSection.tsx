import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const scenarios = [
    // Variação 1: Barbearia - Foco em "Mãos Ocupadas" e Google Calendar
    [
        { id: 1, text: "Eai, tem horário pra cortar o cabelo hoje?", sender: "user", delay: 1 },
        { id: 2, text: "Fala, chefe! 💈 O Marcão tá na régua agora, mas eu cuido da agenda. Tenho vaga às 16h ou 18h. Qual prefere?", sender: "agent", delay: 3 },
        { id: 3, text: "Opa, 18h fica show pra mim.", sender: "user", delay: 5 },
        { id: 4, text: "Fechado! Já tá sincronizado no Google Agenda dele pra ninguém roubar seu lugar. Te vejo às 18h! 👊", sender: "agent", delay: 7 }
    ],
    // Variação 2: Manicure/Nail Design - Foco em "Voz Humanizada" e Detalhes
    [
        { id: 1, text: "Oi! Quanto tá o alongamento de fibra?", sender: "user", delay: 1 },
        { id: 2, text: "Oii! 💅 A aplicação tá R$ 120. Posso te mandar um áudio rapidinho explicando como funciona a manutenção?", sender: "agent", delay: 3 },
        { id: 3, text: "Pode sim, por favor.", sender: "user", delay: 5 },
        { id: 4, text: "▶️ [Áudio] ...Quer deixar marcado? Tenho horário amanhã cedo! ✨", sender: "agent", delay: 7.5 }
    ],
    // Variação 3: Clínica de Estética - Foco em "Atendimento Noturno"
    [
        { id: 1, text: "Vocês fazem limpeza de pele?", sender: "user", delay: 1 },
        { id: 2, text: "Fazemos sim! É nossa especialidade. 🧖‍♀️ A clínica tá fechada agora, mas eu tô aqui 24h. Quer ver os horários pra essa semana?", sender: "agent", delay: 3 },
        { id: 3, text: "Quero sim, trabalho o dia todo.", sender: "user", delay: 5 },
        { id: 4, text: "Sem problemas! Temos horários estendidos na quinta até as 20h. Posso reservar esse slot pra você? 📅", sender: "agent", delay: 7 }
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
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink-500/10 rounded-full blur-[120px] animate-float" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] animate-float transition-all delay-1000" />

            <div className="container relative z-10 px-4 md:px-6">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left Content */}
                    <div className="space-y-8 animate-fade-in-up">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lp-accent/10 border border-lp-accent/20 text-lp-accent text-sm font-bold uppercase tracking-wider">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lp-accent opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-lp-accent"></span>
                            </span>
                            Para Negócios de Beleza
                        </div>

                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold leading-tight text-white">
                            Suas mãos ocupadas,<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lp-accent to-lp-accent/80">
                                sua agenda lotada
                            </span>
                        </h1>

                        <p className="text-lg md:text-xl text-lp-muted-foreground font-sans max-w-xl">
                            Parar para responder WhatsApp é parar de faturar. Deixe nossa IA agendar seus clientes 24h por dia, integrado ao seu Google Agenda.
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
                            {['Zero No-Show', 'Áudios Humanizados', 'Agenda Sincronizada'].map((feat, i) => (
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
                                        <h3 className="text-white font-bold font-display">Agendamento IA</h3>
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
