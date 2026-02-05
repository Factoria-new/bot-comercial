import { Zap, Images, RefreshCw, ShoppingBag } from "lucide-react";

export const SolutionSection = () => {
    const features = [
        {
            icon: <Zap className="w-6 h-6 text-lp-accent" />,
            title: "Checkout Imediato",
            description: "O cliente disse 'eu quero'? O Caji envia a chave Pix ou Link de Pagamento no mesmo segundo. Sem enrolação.",
            delay: "0",
        },
        {
            icon: <Images className="w-6 h-6 text-lp-accent" />,
            title: "Catálogo na Mão",
            description: "Envia fotos, tabelas de medidas e detalhes do produto automaticamente quando o cliente pergunta.",
            delay: "100",
        },
        {
            icon: <ShoppingBag className="w-6 h-6 text-lp-accent" />,
            title: "Filtro de Curiosos",
            description: "Responde preço e frete para todo mundo. Quem chegar até você já está pronto para comprar.",
            delay: "200",
        },
        {
            icon: <RefreshCw className="w-6 h-6 text-lp-accent" />,
            title: "Pós-Venda Recorrente",
            description: "Vendeu suplemento? O Caji chama o cliente 20 dias depois perguntando se quer repor o estoque.",
            delay: "300",
        }
    ];

    return (
        <section className="py-20 relative overflow-hidden bg-lp-background">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-lp-primary/20 rounded-full blur-[120px] -z-10" />

            <div className="container px-4 md:px-6">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div className="order-2 lg:order-1 relative">
                        <div className="relative z-10 grid grid-cols-2 gap-4">
                            {features.map((feature, index) => (
                                <div
                                    key={index}
                                    className={`p-6 rounded-2xl bg-lp-card/60 border border-lp-border/40 backdrop-blur-md hover:border-lp-accent/50 transition-all duration-300 hover:-translate-y-1 animate-fade-in-up`}
                                    style={{ animationDelay: `${feature.delay}ms` }}
                                >
                                    <div className="w-12 h-12 rounded-lg bg-lp-accent/10 border border-lp-accent/20 flex items-center justify-center mb-4">
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-2 font-display">{feature.title}</h3>
                                    <p className="text-sm text-lp-muted-foreground">{feature.description}</p>
                                </div>
                            ))}
                        </div>
                        {/* Decorative Elements */}
                        <div className="absolute inset-0 bg-gradient-to-r from-lp-accent/10 to-transparent blur-2xl -z-10" />
                    </div>

                    <div className="order-1 lg:order-2 space-y-8 animate-slide-in-right">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lp-primary/20 border border-lp-primary/30">
                            <span className="text-sm font-medium text-lp-primary-foreground font-sans">
                                Venda enquanto dorme
                            </span>
                        </div>

                        <h2 className="text-3xl md:text-5xl font-display font-bold text-white leading-tight">
                            Transforme perguntas <br />
                            <span className="text-lp-accent text-transparent bg-clip-text bg-gradient-to-r from-lp-accent to-lp-accent/80">em Pix na conta</span>
                        </h2>

                        <p className="text-lg text-lp-muted-foreground font-sans leading-relaxed">
                            Funciona como um vendedor de balcão experiente que atende centenas de clientes ao mesmo tempo, 24 horas por dia.
                        </p>

                        <ul className="space-y-4 pt-4">
                            <li className="flex items-center gap-3 text-lp-foreground">
                                <span className="w-1.5 h-1.5 rounded-full bg-lp-accent shadow-[0_0_10px_#19B159]" />
                                Envio Automático de Chave Pix / Link
                            </li>
                            <li className="flex items-center gap-3 text-lp-foreground">
                                <span className="w-1.5 h-1.5 rounded-full bg-lp-accent shadow-[0_0_10px_#19B159]" />
                                Tabela de Medidas e Frete Automático
                            </li>
                            <li className="flex items-center gap-3 text-lp-foreground">
                                <span className="w-1.5 h-1.5 rounded-full bg-lp-accent shadow-[0_0_10px_#19B159]" />
                                Recuperação de Venda esquecida
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SolutionSection;
