import { Menu, Truck, QrCode } from "lucide-react";

/**
 * BenefitsSection - Varejo Landing Page
 * 3 focused e-commerce feature cards
 * Uses --varejo-* CSS variables
 */
export const BenefitsSection = () => {
    const features = [
        {
            icon: <Menu className="w-8 h-8 text-white" />,
            title: "Catalogo na Mao",
            description: "O cliente pede, o Caji envia foto e preco. Sem voce precisar fazer nada."
        },
        {
            icon: <Truck className="w-8 h-8 text-white" />,
            title: "Frete Automatico",
            description: "Calcula taxa de entrega na hora. Motoboy, Correios ou retirada."
        },
        {
            icon: <QrCode className="w-8 h-8 text-white" />,
            title: "Pix no Gatilho",
            description: "Envia chave Pix automaticamente e baixa no estoque apos pagamento."
        }
    ];

    return (
        <section
            className="py-20 relative"
            style={{ backgroundColor: 'hsl(var(--varejo-background))' }}
        >
            <div className="container px-4 md:px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2
                        className="text-3xl md:text-5xl font-bold mb-6"
                        style={{
                            color: 'hsl(var(--varejo-foreground))',
                            fontFamily: 'Roboto, system-ui, sans-serif'
                        }}
                    >
                        Funcionalidades para{' '}
                        <span style={{ color: 'hsl(var(--varejo-primary))' }}>
                            VENDER mais
                        </span>
                    </h2>
                    <p
                        className="text-lg"
                        style={{ color: 'hsl(var(--varejo-muted-foreground))' }}
                    >
                        Tudo que o comerciante precisa para automatizar vendas no WhatsApp.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="p-8 rounded-3xl transition-all duration-300 group cursor-pointer text-center"
                            style={{
                                backgroundColor: 'hsl(var(--varejo-card))',
                                border: '1px solid hsl(var(--varejo-border))',
                                boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-8px)';
                                e.currentTarget.style.boxShadow = '0 16px 48px hsl(24 95% 53% / 0.2)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.08)';
                            }}
                        >
                            <div
                                className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300"
                                style={{
                                    background: 'var(--varejo-gradient-primary)',
                                    boxShadow: '0 8px 24px hsl(24 95% 53% / 0.3)'
                                }}
                            >
                                {feature.icon}
                            </div>
                            <h3
                                className="text-2xl font-bold mb-4"
                                style={{
                                    color: 'hsl(var(--varejo-foreground))',
                                    fontFamily: 'Roboto, system-ui, sans-serif'
                                }}
                            >
                                {feature.title}
                            </h3>
                            <p
                                className="text-base leading-relaxed"
                                style={{ color: 'hsl(var(--varejo-muted-foreground))' }}
                            >
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default BenefitsSection;
