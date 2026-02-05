import { MessageCircle, Instagram, Facebook, Quote } from "lucide-react";

/**
 * IntegrationSection - Varejo Landing Page
 * Social media logos and testimonial
 * Uses --varejo-* CSS variables
 */
export const IntegrationSection = () => {
    const platforms = [
        {
            name: "WhatsApp Business",
            icon: <MessageCircle className="w-10 h-10" />,
            color: "hsl(142 76% 36%)"
        },
        {
            name: "Instagram",
            icon: <Instagram className="w-10 h-10" />,
            color: "hsl(330 80% 60%)"
        },
        {
            name: "Facebook",
            icon: <Facebook className="w-10 h-10" />,
            color: "hsl(221 44% 41%)"
        }
    ];

    return (
        <section
            className="py-20 relative overflow-hidden"
            style={{ backgroundColor: 'hsl(var(--varejo-background-alt))' }}
        >
            <div className="container px-4 md:px-6">
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <h2
                        className="text-3xl md:text-4xl font-bold mb-4"
                        style={{
                            color: 'hsl(var(--varejo-foreground))',
                            fontFamily: 'Roboto, system-ui, sans-serif'
                        }}
                    >
                        Conecte onde seus clientes estao
                    </h2>
                    <p
                        className="text-lg"
                        style={{ color: 'hsl(var(--varejo-muted-foreground))' }}
                    >
                        Integracao nativa com as maiores plataformas de vendas.
                    </p>
                </div>

                {/* Platform Logos */}
                <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 mb-16">
                    {platforms.map((platform, index) => (
                        <div
                            key={index}
                            className="flex flex-col items-center gap-3 p-6 rounded-2xl transition-all duration-300 hover:scale-110 cursor-pointer"
                            style={{
                                backgroundColor: 'hsl(var(--varejo-card))',
                                boxShadow: '0 4px 24px rgba(0,0,0,0.06)'
                            }}
                        >
                            <div style={{ color: platform.color }}>
                                {platform.icon}
                            </div>
                            <span
                                className="text-sm font-medium"
                                style={{ color: 'hsl(var(--varejo-muted-foreground))' }}
                            >
                                {platform.name}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Testimonial */}
                <div className="max-w-2xl mx-auto">
                    <div
                        className="relative p-8 rounded-3xl text-center"
                        style={{
                            backgroundColor: 'hsl(var(--varejo-card))',
                            border: '1px solid hsl(var(--varejo-border))',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
                        }}
                    >
                        <div
                            className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ background: 'var(--varejo-gradient-primary)' }}
                        >
                            <Quote className="w-5 h-5 text-white" />
                        </div>

                        <p
                            className="text-xl md:text-2xl font-medium italic mb-6 pt-4"
                            style={{
                                color: 'hsl(var(--varejo-foreground))',
                                lineHeight: 1.6
                            }}
                        >
                            "Acordei com 3 vendas feitas pelo bot. O Caji atendeu clientes as 2 da manha enquanto eu dormia."
                        </p>

                        <div className="flex items-center justify-center gap-3">
                            <div
                                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                                style={{ background: 'var(--varejo-gradient-primary)' }}
                            >
                                M
                            </div>
                            <div className="text-left">
                                <p
                                    className="font-bold"
                                    style={{ color: 'hsl(var(--varejo-foreground))' }}
                                >
                                    Marina Silva
                                </p>
                                <p
                                    className="text-sm"
                                    style={{ color: 'hsl(var(--varejo-muted-foreground))' }}
                                >
                                    Loja de Roupas Femininas
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default IntegrationSection;
