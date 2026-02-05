import { BarChart3, Clock, Lock, CheckCircle2, ShoppingCart, Zap } from "lucide-react";

export const BenefitsSection = () => {
    const benefits = [
        {
            icon: <ShoppingCart className="w-6 h-6 text-lp-accent" />,
            title: "Recuperação de Carrinho",
            description: "O cliente perguntou preço e sumiu? O Caji manda um 'oi, conseguiu ver?' automático para retomar a venda."
        },
        {
            icon: <Zap className="w-6 h-6 text-lp-accent" />,
            title: "Link de Pagamento no Gatilho",
            description: "O sistema detecta intenção de compra e já envia o link ou Pix. Menos cliques, mais conversão."
        },
        {
            icon: <CheckCircle2 className="w-6 h-6 text-lp-accent" />,
            title: "Profissionalismo",
            description: "Sua loja do Instagram passa a ter atendimento de grande e-commerce. Rápido, cordial e sem erros de português."
        },
        {
            icon: <Lock className="w-6 h-6 text-lp-accent" />,
            title: "Segurança de Dados",
            description: "Seus dados e de seus clientes seguros. Histórico de conversas salvo para consultas futuras."
        },
        {
            icon: <Clock className="w-6 h-6 text-lp-accent" />,
            title: "Venda na Madrugada",
            description: "Atenda o comprador da insônia. O Caji fecha vendas às 3 da manhã enquanto você dorme."
        },
        {
            icon: <BarChart3 className="w-6 h-6 text-lp-accent" />,
            title: "Métricas de Venda",
            description: "Saiba quais produtos são mais pedidos e qual horário sua loja tem mais movimento no WhatsApp."
        }
    ];

    return (
        <section className="py-20 bg-lp-background relative">
            <div className="container px-4 md:px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">
                        Sua loja aberta <span className="text-lp-accent">24 horas por dia</span>
                    </h2>
                    <p className="text-lp-muted-foreground text-lg">
                        Ferramentas essenciais para quem quer escalar as vendas sem aumentar a equipe.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {benefits.map((benefit, index) => (
                        <div
                            key={index}
                            className="p-6 rounded-2xl bg-lp-card/40 border border-lp-border/30 hover:bg-lp-card/60 hover:border-lp-accent/30 transition-all duration-300 group"
                        >
                            <div className="w-12 h-12 rounded-xl bg-lp-accent/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                {benefit.icon}
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3 font-display">
                                {benefit.title}
                            </h3>
                            <p className="text-lp-muted-foreground leading-relaxed">
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
