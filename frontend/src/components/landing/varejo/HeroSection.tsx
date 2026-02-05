import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, ShoppingCart, Zap } from "lucide-react";

/**
 * HeroSection - Varejo Landing Page
 * E-commerce impulse theme for retail
 * Uses --varejo-* CSS variables
 */

const scenarios = [
    // Variacao 1: Loja de Roupas - Foco em "Preco e Disponibilidade"
    [
        { id: 1, text: "Oi, esse vestido preto tem no tamanho G?", sender: "user", delay: 1 },
        { id: 2, text: "Ola! Tudo bem? O pretinho basico e lindo ne? Temos G sim! A forma dele e normal.", sender: "agent", delay: 3 },
        { id: 3, text: "Ah que otimo. Qual o valor e o frete para o centro?", sender: "user", delay: 5 },
        { id: 4, text: "Ele esta R$ 89,90. O frete pro centro e fixo: R$ 10,00 via motoboy (chega hoje!).", sender: "agent", delay: 7 }
    ],
    // Variacao 2: Delivery de Comida - Foco em "Rapidez"
    [
        { id: 1, text: "Quanto ta o combo familia?", sender: "user", delay: 1 },
        { id: 2, text: "Fala! O combo familia ta R$ 79,90 e serve 4 pessoas. Quer que eu mande o cardapio completo?", sender: "agent", delay: 3 },
        { id: 3, text: "Manda sim. Aceita Pix?", sender: "user", delay: 5 },
        { id: 4, text: "Aceita Pix sim! Ja vou mandar o cardapio e a chave. Entrega em 40min na sua regiao!", sender: "agent", delay: 7 }
    ],
    // Variacao 3: Loja de Eletronicos - Foco em "Link de Pagamento"
    [
        { id: 1, text: "Tem fone bluetooth em promocao?", sender: "user", delay: 1 },
        { id: 2, text: "Temos! O mais vendido esta de R$ 149 por R$ 99,90. So hoje! Quer o link pra garantir?", sender: "agent", delay: 3 },
        { id: 3, text: "Quero sim, parece bom!", sender: "user", delay: 5 },
        { id: 4, text: "Enviando o link de pagamento agora! Aproveita que o estoque ta acabando.", sender: "agent", delay: 7 }
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
            <div className="container relative z-10 px-4 md:px-6">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left Content */}
                    <div className="space-y-8 animate-fade-in-up">
                        <div
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider shadow-md"
                            style={{
                                backgroundColor: 'hsl(var(--varejo-primary))',
                                color: 'white'
                            }}
                        >
                            <ShoppingCart className="w-4 h-4" />
                            Para Comercio e Varejo
                        </div>

                        <h1
                            className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight"
                            style={{
                                color: 'hsl(var(--varejo-foreground))',
                                fontFamily: 'Roboto, system-ui, sans-serif'
                            }}
                        >
                            Seu cliente nao<br />
                            <span style={{ color: 'hsl(var(--varejo-primary))' }}>
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
                                className="h-14 px-10 text-lg font-bold text-white rounded-xl transition-all duration-300 hover:scale-105 animate-pulse-cta"
                                style={{
                                    background: 'var(--varejo-gradient-primary)',
                                    boxShadow: 'var(--varejo-shadow-button)'
                                }}
                            >
                                COMECAR AGORA
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </div>

                        <div
                            className="flex flex-wrap gap-6 pt-4 text-sm font-medium"
                            style={{ color: 'hsl(var(--varejo-muted-foreground))' }}
                        >
                            {['Catalogo Imediato', 'Recuperacao de Carrinho', 'Postura de Vendedor'].map((feat, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <CheckCircle2
                                        className="w-5 h-5"
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
                            {/* Chat Container */}
                            <div
                                className="relative rounded-3xl p-6 h-[500px] flex flex-col"
                                style={{
                                    backgroundColor: 'hsl(var(--varejo-card))',
                                    border: '1px solid hsl(var(--varejo-border))',
                                    boxShadow: 'var(--varejo-shadow-card)'
                                }}
                            >
                                {/* Badge - 24h */}
                                <div
                                    className="absolute -top-3 -right-3 px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg flex items-center gap-1"
                                    style={{ backgroundColor: 'hsl(var(--varejo-secondary))' }}
                                >
                                    <Zap className="w-3 h-3" />
                                    Resposta Imediata
                                </div>

                                {/* Chat Header */}
                                <div
                                    className="flex items-center gap-4 mb-6 pb-4"
                                    style={{ borderBottom: '1px solid hsl(var(--varejo-border))' }}
                                >
                                    <div
                                        className="w-12 h-12 rounded-full flex items-center justify-center"
                                        style={{
                                            background: 'var(--varejo-gradient-primary)',
                                            boxShadow: 'var(--varejo-shadow-button)'
                                        }}
                                    >
                                        <ShoppingCart className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3
                                            className="font-bold text-lg"
                                            style={{
                                                color: 'hsl(var(--varejo-foreground))',
                                                fontFamily: 'Roboto, system-ui, sans-serif'
                                            }}
                                        >
                                            Vendas 24h
                                        </h3>
                                        <div className="flex items-center gap-1.5">
                                            <span
                                                className="w-2 h-2 rounded-full animate-pulse"
                                                style={{ backgroundColor: 'hsl(142 76% 36%)' }}
                                            />
                                            <span
                                                className="text-xs font-medium"
                                                style={{ color: 'hsl(142 76% 36%)' }}
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
                                                    className={`max-w-[85%] p-4 rounded-2xl text-sm font-medium shadow-sm ${msg.sender === 'user'
                                                            ? 'rounded-tl-none'
                                                            : 'rounded-tr-none text-white'
                                                        }`}
                                                    style={msg.sender === 'user'
                                                        ? {
                                                            backgroundColor: 'hsl(var(--varejo-background-alt))',
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
                                                className="p-4 rounded-2xl rounded-tr-none flex gap-1.5 items-center w-fit h-12 justify-center"
                                                style={{ backgroundColor: 'hsl(var(--varejo-primary) / 0.2)' }}
                                            >
                                                <div
                                                    className="w-2 h-2 rounded-full animate-bounce"
                                                    style={{ backgroundColor: 'hsl(var(--varejo-primary))' }}
                                                />
                                                <div
                                                    className="w-2 h-2 rounded-full animate-bounce delay-100"
                                                    style={{ backgroundColor: 'hsl(var(--varejo-primary))' }}
                                                />
                                                <div
                                                    className="w-2 h-2 rounded-full animate-bounce delay-200"
                                                    style={{ backgroundColor: 'hsl(var(--varejo-primary))' }}
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
