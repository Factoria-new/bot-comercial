import { BarChart3, Clock, ShoppingCart, Zap, CreditCard, RefreshCw } from "lucide-react";

/**
 * BenefitsSection - Varejo Landing Page
 * E-commerce impulse theme
 * Uses --varejo-* CSS variables
 */
export const BenefitsSection = () => {
    const benefits = [
        {
            icon: <ShoppingCart className="w-6 h-6 text-white" />,
            title: "Recuperacao de Carrinho",
            description: "O cliente perguntou preco e sumiu? O Caji manda um 'oi, conseguiu ver?' automatico para retomar a venda."
        },
        {
            icon: <Zap className="w-6 h-6 text-white" />,
            title: "Link de Pagamento no Gatilho",
            description: "O sistema detecta intencao de compra e ja envia o link ou Pix. Menos cliques, mais conversao."
        },
        {
            icon: <CreditCard className="w-6 h-6 text-white" />,
            title: "Profissionalismo",
            description: "Sua loja do Instagram passa a ter atendimento de grande e-commerce. Rapido, cordial e sem erros de portugues."
        },
        {
            icon: <RefreshCw className="w-6 h-6 text-white" />,
            title: "Postura de Vendedor",
            description: "A IA nao so responde - ela VENDE. Oferece produtos, faz sugestoes e acelera o fechamento."
        },
        {
            icon: <Clock className="w-6 h-6 text-white" />,
            title: "Venda na Madrugada",
            description: "Atenda o comprador da insonia. O Caji fecha vendas as 3 da manha enquanto voce dorme."
        },
        {
            icon: <BarChart3 className="w-6 h-6 text-white" />,
            title: "Metricas de Venda",
            description: "Saiba quais produtos sao mais pedidos e qual horario sua loja tem mais movimento no WhatsApp."
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
                        Sua loja aberta{' '}
                        <span style={{ color: 'hsl(var(--varejo-primary))' }}>
                            24 horas por dia
                        </span>
                    </h2>
                    <p
                        className="text-lg"
                        style={{ color: 'hsl(var(--varejo-muted-foreground))' }}
                    >
                        Ferramentas essenciais para quem quer escalar as vendas sem aumentar a equipe.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {benefits.map((benefit, index) => (
                        <div
                            key={index}
                            className="p-6 rounded-2xl transition-all duration-300 group cursor-pointer"
                            style={{
                                backgroundColor: 'hsl(var(--varejo-card))',
                                border: '1px solid hsl(var(--varejo-border))',
                                boxShadow: 'var(--varejo-shadow-card)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = 'var(--varejo-shadow-hover)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'var(--varejo-shadow-card)';
                            }}
                        >
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                                style={{ background: 'var(--varejo-gradient-primary)' }}
                            >
                                {benefit.icon}
                            </div>
                            <h3
                                className="text-xl font-bold mb-3"
                                style={{
                                    color: 'hsl(var(--varejo-foreground))',
                                    fontFamily: 'Roboto, system-ui, sans-serif'
                                }}
                            >
                                {benefit.title}
                            </h3>
                            <p
                                className="leading-relaxed"
                                style={{ color: 'hsl(var(--varejo-muted-foreground))' }}
                            >
                                {benefit.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default BenefitsSection;
