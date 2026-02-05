import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShoppingBag, Package, Zap, QrCode, Menu, Truck, ShoppingCart } from "lucide-react";

/**
 * HeroSection - Varejo Landing Page
 * Marketplace-style CRO design with urgency, velocity, and sales focus
 * Uses --varejo-* CSS variables
 */

const chatScenario = [
    { id: 1, text: "Tem esse vestido M?", sender: "user", delay: 1 },
    { id: 2, text: "Temos sim! Custa R$ 89,90. O frete e R$ 10. Segue o link de pagamento ou Pix", sender: "agent", delay: 3 },
    { id: 3, text: "Quero! Manda o Pix", sender: "user", delay: 6 },
    { id: 4, text: "pix.caji.com/loja123", sender: "payment", delay: 8 },
];

export const HeroSection = () => {
    const [visibleMessages, setVisibleMessages] = useState<number[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [showNotification, setShowNotification] = useState(false);

    useEffect(() => {
        let timeouts: NodeJS.Timeout[] = [];

        setVisibleMessages([]);
        setIsTyping(false);
        setShowNotification(false);

        chatScenario.forEach((msg) => {
            const msgTimeout = setTimeout(() => {
                setIsTyping(false);
                setVisibleMessages((prev) => [...prev, msg.id]);
            }, msg.delay * 1000);
            timeouts.push(msgTimeout);

            if (msg.sender === 'agent' || msg.sender === 'payment') {
                const typingStartDelay = Math.max(0, msg.delay - 1.5);
                const typingTimeout = setTimeout(() => {
                    setIsTyping(true);
                }, typingStartDelay * 1000);
                timeouts.push(typingTimeout);
            }
        });

        // Show "Pix Recebido" notification after payment link
        const notificationTimeout = setTimeout(() => {
            setShowNotification(true);
        }, 10000);
        timeouts.push(notificationTimeout);

        // Restart cycle
        const restartTimeout = setTimeout(() => {
            setVisibleMessages([]);
            setShowNotification(false);
        }, 14000);
        timeouts.push(restartTimeout);

        return () => timeouts.forEach(clearTimeout);
    }, [visibleMessages.length === 0]);

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
                            Para Lojistas e Comercio
                        </div>

                        <h1
                            className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight"
                            style={{
                                color: 'hsl(var(--varejo-foreground))',
                                fontFamily: 'Roboto, system-ui, sans-serif'
                            }}
                        >
                            Sua loja aberta{' '}
                            <span style={{ color: 'hsl(var(--varejo-primary))' }}>
                                24h
                            </span>
                            <br />
                            enquanto voce dorme.
                        </h1>

                        <p
                            className="text-lg md:text-xl max-w-xl"
                            style={{ color: 'hsl(var(--varejo-muted-foreground))' }}
                        >
                            O Caji atende, envia preco, calcula frete e fecha a venda por Pix — tudo automatico, em segundos.
                        </p>

                        {/* Badge de Urgencia */}
                        <div
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold"
                            style={{
                                backgroundColor: 'hsl(0 84% 60% / 0.1)',
                                color: 'hsl(0 84% 60%)',
                                border: '1px solid hsl(0 84% 60% / 0.3)'
                            }}
                        >
                            <Zap className="w-4 h-4" />
                            Recupere 30% das vendas da madrugada
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Button
                                onClick={scrollToPricing}
                                className="h-16 px-12 text-xl font-bold text-white rounded-2xl transition-all duration-300 hover:scale-105"
                                style={{
                                    background: 'var(--varejo-gradient-primary)',
                                    boxShadow: '0 8px 32px hsl(24 95% 53% / 0.4)',
                                    animation: 'pulse-cta 2s ease-in-out infinite'
                                }}
                            >
                                VENDER 24H AGORA
                                <ArrowRight className="ml-2 w-6 h-6" />
                            </Button>
                        </div>

                        <div
                            className="flex flex-wrap gap-6 pt-2 text-sm font-medium"
                            style={{ color: 'hsl(var(--varejo-muted-foreground))' }}
                        >
                            {[
                                { icon: Menu, text: 'Catalogo Imediato' },
                                { icon: Truck, text: 'Frete Automatico' },
                                { icon: QrCode, text: 'Pix na Hora' }
                            ].map((feat, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <feat.icon
                                        className="w-5 h-5"
                                        style={{ color: 'hsl(var(--varejo-primary))' }}
                                    />
                                    {feat.text}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Content - Chat Simulation with Floating Elements */}
                    <div className="relative animate-slide-in-right delay-200">
                        {/* Floating 3D Elements */}
                        <div
                            className="absolute -top-8 -left-8 w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl"
                            style={{
                                background: 'var(--varejo-gradient-primary)',
                                animation: 'float 3s ease-in-out infinite'
                            }}
                        >
                            <ShoppingBag className="w-8 h-8 text-white" />
                        </div>

                        <div
                            className="absolute -bottom-4 -left-4 w-14 h-14 rounded-xl flex items-center justify-center shadow-2xl"
                            style={{
                                background: 'linear-gradient(135deg, hsl(142 76% 36%), hsl(142 76% 46%))',
                                animation: 'float 3s ease-in-out infinite 0.5s'
                            }}
                        >
                            <Package className="w-7 h-7 text-white" />
                        </div>

                        <div
                            className="absolute -top-4 -right-4 w-12 h-12 rounded-full flex items-center justify-center shadow-2xl"
                            style={{
                                backgroundColor: 'hsl(var(--varejo-accent))',
                                animation: 'float 3s ease-in-out infinite 1s'
                            }}
                        >
                            <Zap className="w-6 h-6 text-white" />
                        </div>

                        {/* Pix Recebido Notification */}
                        <div
                            className={`absolute -right-8 top-1/3 px-4 py-3 rounded-xl shadow-2xl transition-all duration-500 ${showNotification ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
                                }`}
                            style={{
                                background: 'linear-gradient(135deg, hsl(142 76% 36%), hsl(142 76% 46%))',
                                color: 'white'
                            }}
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                    <QrCode className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium opacity-80">Pix Recebido</p>
                                    <p className="text-lg font-bold">R$ 89,90</p>
                                </div>
                            </div>
                        </div>

                        <div className="relative w-full max-w-[400px] mx-auto">
                            {/* Chat Container */}
                            <div
                                className="relative rounded-3xl p-6 h-[480px] flex flex-col"
                                style={{
                                    backgroundColor: 'hsl(var(--varejo-card))',
                                    border: '1px solid hsl(var(--varejo-border))',
                                    boxShadow: '0 24px 64px -12px rgba(0,0,0,0.15)'
                                }}
                            >
                                {/* Badge - 24h */}
                                <div
                                    className="absolute -top-3 -right-3 px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg flex items-center gap-1"
                                    style={{ backgroundColor: 'hsl(var(--varejo-secondary))' }}
                                >
                                    <Zap className="w-3 h-3" />
                                    24h Online
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
                                            Loja Fashion
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
                                                Vendendo agora
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 space-y-4 overflow-hidden">
                                    {chatScenario.map((msg) => (
                                        visibleMessages.includes(msg.id) && (
                                            <div
                                                key={msg.id}
                                                className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'} animate-message-appear`}
                                            >
                                                <div
                                                    className={`max-w-[85%] p-4 rounded-2xl text-sm font-medium shadow-sm ${msg.sender === 'user'
                                                        ? 'rounded-tl-none'
                                                        : 'rounded-tr-none text-white'
                                                        }`}
                                                    style={
                                                        msg.sender === 'user'
                                                            ? {
                                                                backgroundColor: 'hsl(var(--varejo-background-alt))',
                                                                color: 'hsl(var(--varejo-foreground))'
                                                            }
                                                            : msg.sender === 'payment'
                                                                ? {
                                                                    background: 'linear-gradient(135deg, hsl(142 76% 36%), hsl(142 76% 46%))',
                                                                    fontFamily: 'monospace',
                                                                    fontSize: '0.9rem'
                                                                }
                                                                : {
                                                                    background: 'var(--varejo-gradient-primary)'
                                                                }
                                                    }
                                                >
                                                    {msg.sender === 'payment' && (
                                                        <div className="flex items-center gap-2 mb-1 text-xs opacity-80">
                                                            <QrCode className="w-3 h-3" />
                                                            Link de Pagamento
                                                        </div>
                                                    )}
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

            {/* CSS for floating animation */}
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
            `}</style>
        </section>
    );
};

export default HeroSection;
