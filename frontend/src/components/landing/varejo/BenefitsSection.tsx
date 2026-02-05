import { BarChart3, Clock, Lock, CheckCircle2, ShoppingCart, Zap } from "lucide-react";

/**
 * BenefitsSection - Varejo Landing Page
 * ISOLATED dark luxury theme
 * Uses --varejo-* CSS variables
 */
export const BenefitsSection = () => {
    const benefits = [
        {
            icon: <ShoppingCart className="w-6 h-6" style={{ color: 'hsl(var(--varejo-primary))' }} />,
            title: "Recuperacao de Carrinho",
            description: "O cliente perguntou preco e sumiu? O Caji manda um 'oi, conseguiu ver?' automatico para retomar a venda."
        },
        {
            icon: <Zap className="w-6 h-6" style={{ color: 'hsl(var(--varejo-primary-end))' }} />,
            title: "Link de Pagamento no Gatilho",
            description: "O sistema detecta intencao de compra e ja envia o link ou Pix. Menos cliques, mais conversao."
        },
        {
            icon: <CheckCircle2 className="w-6 h-6" style={{ color: 'hsl(var(--varejo-primary))' }} />,
            title: "Profissionalismo",
            description: "Sua loja do Instagram passa a ter atendimento de grande e-commerce. Rapido, cordial e sem erros de portugues."
        },
        {
            icon: <Lock className="w-6 h-6" style={{ color: 'hsl(var(--varejo-primary-end))' }} />,
            title: "Seguranca de Dados",
            description: "Seus dados e de seus clientes seguros. Historico de conversas salvo para consultas futuras."
        },
        {
            icon: <Clock className="w-6 h-6" style={{ color: 'hsl(var(--varejo-primary))' }} />,
            title: "Venda na Madrugada",
            description: "Atenda o comprador da insonia. O Caji fecha vendas as 3 da manha enquanto voce dorme."
        },
        {
            icon: <BarChart3 className="w-6 h-6" style={{ color: 'hsl(var(--varejo-primary-end))' }} />,
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
                        className="text-3xl md:text-5xl font-display font-bold mb-6 uppercase"
                        style={{ color: 'hsl(var(--varejo-foreground))' }}
                    >
                        Sua loja aberta{' '}
                        <span
                            className="text-transparent bg-clip-text"
                            style={{ backgroundImage: 'var(--varejo-gradient-primary)' }}
                        >
                            24 horas por dia
                        </span>
                    </h2>
                    <p style={{ color: 'hsl(var(--varejo-muted-foreground))' }} className="text-lg">
                        Ferramentas essenciais para quem quer escalar as vendas sem aumentar a equipe.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {benefits.map((benefit, index) => (
                        <div
                            key={index}
                            className="p-6 rounded-2xl transition-all duration-300 group"
                            style={{
                                backgroundColor: 'hsl(var(--varejo-card))',
                                border: '1px solid hsl(var(--varejo-border))'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'hsl(var(--varejo-primary) / 0.5)';
                                e.currentTarget.style.boxShadow = 'var(--varejo-shadow-accent)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'hsl(var(--varejo-border))';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                                style={{
                                    background: 'hsl(var(--varejo-primary) / 0.15)',
                                    border: '1px solid hsl(var(--varejo-primary) / 0.3)'
                                }}
                            >
                                {benefit.icon}
                            </div>
                            <h3
                                className="text-xl font-bold mb-3 font-display uppercase"
                                style={{ color: 'hsl(var(--varejo-foreground))' }}
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
