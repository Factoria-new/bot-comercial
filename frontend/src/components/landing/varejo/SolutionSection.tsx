import { Zap, Images, RefreshCw, ShoppingBag } from "lucide-react";

/**
 * SolutionSection - Varejo Landing Page
 * ISOLATED dark luxury theme
 * Uses --varejo-* CSS variables
 */
export const SolutionSection = () => {
    const features = [
        {
            icon: <Zap className="w-6 h-6" style={{ color: 'hsl(var(--varejo-primary))' }} />,
            title: "Checkout Imediato",
            description: "O cliente disse 'eu quero'? O Caji envia a chave Pix ou Link de Pagamento no mesmo segundo. Sem enrolacao.",
            delay: "0",
        },
        {
            icon: <Images className="w-6 h-6" style={{ color: 'hsl(var(--varejo-primary-end))' }} />,
            title: "Catalogo na Mao",
            description: "Envia fotos, tabelas de medidas e detalhes do produto automaticamente quando o cliente pergunta.",
            delay: "100",
        },
        {
            icon: <ShoppingBag className="w-6 h-6" style={{ color: 'hsl(var(--varejo-primary))' }} />,
            title: "Filtro de Curiosos",
            description: "Responde preco e frete para todo mundo. Quem chegar ate voce ja esta pronto para comprar.",
            delay: "200",
        },
        {
            icon: <RefreshCw className="w-6 h-6" style={{ color: 'hsl(var(--varejo-primary-end))' }} />,
            title: "Pos-Venda Recorrente",
            description: "Vendeu suplemento? O Caji chama o cliente 20 dias depois perguntando se quer repor o estoque.",
            delay: "300",
        }
    ];

    return (
        <section
            className="py-20 relative overflow-hidden"
            style={{ backgroundColor: 'hsl(var(--varejo-background))' }}
        >
            {/* Background Glow */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[120px] -z-10"
                style={{ background: 'var(--varejo-gradient-primary)', opacity: 0.1 }}
            />

            <div className="container px-4 md:px-6">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div className="order-2 lg:order-1 relative">
                        <div className="relative z-10 grid grid-cols-2 gap-4">
                            {features.map((feature, index) => (
                                <div
                                    key={index}
                                    className="p-6 rounded-2xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1 animate-fade-in-up"
                                    style={{
                                        animationDelay: `${feature.delay}ms`,
                                        backgroundColor: 'hsl(var(--varejo-card))',
                                        border: '1px solid hsl(var(--varejo-border))'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = 'hsl(var(--varejo-primary) / 0.5)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = 'hsl(var(--varejo-border))';
                                    }}
                                >
                                    <div
                                        className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                                        style={{
                                            background: 'hsl(var(--varejo-primary) / 0.15)',
                                            border: '1px solid hsl(var(--varejo-primary) / 0.3)'
                                        }}
                                    >
                                        {feature.icon}
                                    </div>
                                    <h3
                                        className="text-lg font-bold mb-2 font-display uppercase"
                                        style={{ color: 'hsl(var(--varejo-foreground))' }}
                                    >
                                        {feature.title}
                                    </h3>
                                    <p
                                        className="text-sm"
                                        style={{ color: 'hsl(var(--varejo-muted-foreground))' }}
                                    >
                                        {feature.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="order-1 lg:order-2 space-y-8 animate-slide-in-right">
                        <div
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                            style={{
                                background: 'var(--varejo-gradient-primary)',
                                color: 'white'
                            }}
                        >
                            <span className="text-sm font-medium font-sans uppercase tracking-wider">
                                Venda enquanto dorme
                            </span>
                        </div>

                        <h2
                            className="text-3xl md:text-5xl font-display font-bold leading-tight uppercase"
                            style={{ color: 'hsl(var(--varejo-foreground))' }}
                        >
                            Transforme perguntas<br />
                            <span
                                className="text-transparent bg-clip-text"
                                style={{ backgroundImage: 'var(--varejo-gradient-primary)' }}
                            >
                                em Pix na conta
                            </span>
                        </h2>

                        <p
                            className="text-lg font-sans leading-relaxed"
                            style={{ color: 'hsl(var(--varejo-muted-foreground))' }}
                        >
                            Funciona como um vendedor de balcao experiente que atende centenas de clientes ao mesmo tempo, 24 horas por dia.
                        </p>

                        <ul className="space-y-4 pt-4">
                            {[
                                'Envio Automatico de Chave Pix / Link',
                                'Tabela de Medidas e Frete Automatico',
                                'Recuperacao de Venda esquecida'
                            ].map((item, i) => (
                                <li
                                    key={i}
                                    className="flex items-center gap-3"
                                    style={{ color: 'hsl(var(--varejo-foreground))' }}
                                >
                                    <span
                                        className="w-2 h-2 rounded-full"
                                        style={{
                                            background: 'var(--varejo-gradient-primary)',
                                            boxShadow: 'var(--varejo-shadow-accent)'
                                        }}
                                    />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SolutionSection;
