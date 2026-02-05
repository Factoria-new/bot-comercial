import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

/**
 * HeroSection - Varejo Landing Page
 * ISOLATED dark luxury theme for beauty/retail
 * Uses --varejo-* CSS variables
 */

const scenarios = [
    // Variacao 1: Loja de Roupas - Foco em "Tamanho e Estoque"
    [
        { id: 1, text: "Oii, esse vestido preto tem no tamanho G?", sender: "user", delay: 1 },
        { id: 2, text: "Ola! Tudo bem? O pretinho basico e lindo ne? Temos G sim! A forma dele e normal.", sender: "agent", delay: 2.5 },
        { id: 3, text: "Ah que otimo. Qual o valor e o frete para o centro?", sender: "user", delay: 4.5 },
        { id: 4, text: "Ele esta R$ 89,90. O frete pro centro e fixo: R$ 10,00 via motoboy (chega hoje!). Quer que eu separe um pra voce?", sender: "agent", delay: 6.5 }
    ],
    // Variacao 2: Suplementos/Produtos - Foco em "Catalogo e Agilidade"
    [
        { id: 1, text: "Fala irmao, tem Creatina da Max?", sender: "user", delay: 1 },
        { id: 2, text: "Opa, beleza? Temos sim! A de 300g ta saindo por R$ 90,00 no Pix. Quer ver o catalogo completo?", sender: "agent", delay: 3 },
        { id: 3, text: "So a creatina mesmo. Manda o Pix.", sender: "user", delay: 5 },
        { id: 4, text: "Ta na mao! Chave Pix: 12.345.678/0001-90 (Loja Fit). Assim que enviar o comprovante, ja separo pra envio!", sender: "agent", delay: 7 }
    ],
    // Variacao 3: Doceria/Delivery - Foco em "Cardapio e Venda por Impulso"
    [
        { id: 1, text: "Boa tarde, queria encomendar um cento de salgado.", sender: "user", delay: 1 },
        { id: 2, text: "Boa tarde! Que delicia. O cento sortido sai a R$ 60,00. Precisa para hoje ou quer agendar?", sender: "agent", delay: 3 },
        { id: 3, text: "Seria pra sabado agora.", sender: "user", delay: 5 },
        { id: 4, text: "Perfeito! Ainda tenho vaga na agenda de sabado. Posso te mandar os sabores disponiveis pra voce escolher?", sender: "agent", delay: 7 }
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
            style={{ background: 'var(--varejo-gradient-hero)' }}
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
                                background: 'var(--varejo-gradient-primary)',
                                color: 'white'
                            }}
                        >
                            <Sparkles className="w-4 h-4" />
                            Para Comercio e Varejo
                        </div>

                        <h1
                            className="text-4xl md:text-6xl lg:text-7xl font-display font-bold leading-tight uppercase tracking-tight"
                            style={{ color: 'hsl(var(--varejo-foreground))' }}
                        >
                            Seu cliente nao<br />
                            <span
                                className="text-transparent bg-clip-text"
                                style={{ backgroundImage: 'var(--varejo-gradient-primary)' }}
                            >
                                tem paciencia
                            </span>
                        </h1>

                        <p
                            className="text-lg md:text-xl max-w-xl"
                            style={{ color: 'hsl(var(--varejo-muted-foreground))' }}
                        >
                            Se voce demora 10 minutos para responder, ele compra no concorrente. O Caji envia preco, frete e link de pagamento em segundos.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button
                                onClick={scrollToPricing}
                                className="h-14 px-10 text-lg font-bold text-white rounded-xl transition-all duration-300 hover:scale-105"
                                style={{
                                    background: 'var(--varejo-gradient-primary)',
                                    boxShadow: 'var(--varejo-shadow-accent)'
                                }}
                            >
                                COMECAR AGORA
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </div>

                        <div
                            className="flex flex-wrap gap-6 pt-4 text-sm"
                            style={{ color: 'hsl(var(--varejo-muted-foreground))' }}
                        >
                            {['Catalogo Imediato', 'Recuperacao de Carrinho', 'Postura de Vendedor'].map((feat, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <CheckCircle2
                                        className="w-4 h-4"
                                        style={{ color: 'hsl(var(--varejo-primary))' }}
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
                                style={{ background: 'var(--varejo-gradient-primary)' }}
                            />

                            {/* Chat Container */}
                            <div
                                className="relative rounded-[2.5rem] backdrop-blur-xl p-6 h-[500px] flex flex-col"
                                style={{
                                    backgroundColor: 'hsl(var(--varejo-card))',
                                    border: '1px solid hsl(var(--varejo-border))',
                                    boxShadow: 'var(--varejo-shadow-card)'
                                }}
                            >
                                {/* Chat Header */}
                                <div
                                    className="flex items-center gap-4 mb-8 pb-4"
                                    style={{ borderBottom: '1px solid hsl(var(--varejo-border))' }}
                                >
                                    <div
                                        className="w-12 h-12 rounded-full flex items-center justify-center"
                                        style={{
                                            background: 'var(--varejo-gradient-primary)',
                                            boxShadow: 'var(--varejo-shadow-accent)'
                                        }}
                                    >
                                        <Sparkles className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3
                                            className="font-bold font-display uppercase tracking-wide"
                                            style={{ color: 'hsl(var(--varejo-foreground))' }}
                                        >
                                            Vendas 24h
                                        </h3>
                                        <div className="flex items-center gap-1.5">
                                            <span
                                                className="w-2 h-2 rounded-full animate-pulse"
                                                style={{ backgroundColor: 'hsl(var(--varejo-primary))' }}
                                            />
                                            <span
                                                className="text-xs font-medium uppercase tracking-wider"
                                                style={{ color: 'hsl(var(--varejo-primary))' }}
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
                                                            backgroundColor: 'hsl(var(--varejo-background))',
                                                            border: '1px solid hsl(var(--varejo-border))',
                                                            color: 'hsl(var(--varejo-foreground))'
                                                        }
                                                        : {
                                                            background: 'var(--varejo-gradient-primary)'
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
                                                style={{ background: 'var(--varejo-gradient-primary)', opacity: 0.6 }}
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
