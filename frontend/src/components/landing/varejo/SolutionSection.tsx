import { Zap, Tag, Package, CreditCard } from "lucide-react";

/**
 * SolutionSection - Varejo Landing Page
 * E-commerce impulse theme
 * Uses --varejo-* CSS variables
 */
export const SolutionSection = () => {
    const features = [
        {
            icon: <Zap className="w-6 h-6 text-white" />,
            title: "Resposta Flash",
            description: "Atende o cliente em segundos, antes que ele mude de ideia.",
            delay: "0",
        },
        {
            icon: <Tag className="w-6 h-6 text-white" />,
            title: "Preco e Frete",
            description: "Envia automaticamente o valor do produto e calcula entrega.",
            delay: "100",
        },
        {
            icon: <CreditCard className="w-6 h-6 text-white" />,
            title: "Link de Pagamento",
            description: "Detecta intencao de compra e manda Pix ou link na hora.",
            delay: "200",
        },
        {
            icon: <Package className="w-6 h-6 text-white" />,
            title: "Recuperacao de Carrinho",
            description: "Cliente sumiu? O Caji manda um lembrete automatico.",
            delay: "300",
        }
    ];

    return (
        <section
            className="py-20 relative overflow-hidden"
            style={{ backgroundColor: 'hsl(var(--varejo-background-alt))' }}
        >
            <div className="container px-4 md:px-6">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div className="order-2 lg:order-1 relative">
                        <div className="relative z-10 grid grid-cols-2 gap-4">
                            {features.map((feature, index) => (
                                <div
                                    key={index}
                                    className="p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 animate-fade-in-up"
                                    style={{
                                        animationDelay: `${feature.delay}ms`,
                                        backgroundColor: 'hsl(var(--varejo-card))',
                                        border: '1px solid hsl(var(--varejo-border))',
                                        boxShadow: 'var(--varejo-shadow-card)'
                                    }}
                                >
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                                        style={{ background: 'var(--varejo-gradient-primary)' }}
                                    >
                                        {feature.icon}
                                    </div>
                                    <h3
                                        className="text-lg font-bold mb-2"
                                        style={{
                                            color: 'hsl(var(--varejo-foreground))',
                                            fontFamily: 'Roboto, system-ui, sans-serif'
                                        }}
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
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full shadow-md"
                            style={{
                                backgroundColor: 'hsl(var(--varejo-primary))',
                                color: 'white'
                            }}
                        >
                            <Zap className="w-4 h-4" />
                            <span className="text-sm font-bold">
                                Venda enquanto dorme
                            </span>
                        </div>

                        <h2
                            className="text-3xl md:text-5xl font-bold leading-tight"
                            style={{
                                color: 'hsl(var(--varejo-foreground))',
                                fontFamily: 'Roboto, system-ui, sans-serif'
                            }}
                        >
                            Sua loja aberta<br />
                            <span style={{ color: 'hsl(var(--varejo-primary))' }}>
                                24 horas
                            </span>
                        </h2>

                        <p
                            className="text-lg leading-relaxed"
                            style={{ color: 'hsl(var(--varejo-muted-foreground))' }}
                        >
                            Um vendedor incansavel que atende milhares ao mesmo tempo, nunca erra preco, e fecha vendas na madrugada.
                        </p>

                        <ul className="space-y-4 pt-4">
                            {[
                                'Resposta em segundos, nao minutos',
                                'Envia link de pagamento automatico',
                                'Recupera clientes que abandonaram'
                            ].map((item, i) => (
                                <li
                                    key={i}
                                    className="flex items-center gap-3 font-medium"
                                    style={{ color: 'hsl(var(--varejo-foreground))' }}
                                >
                                    <span
                                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold"
                                        style={{ backgroundColor: 'hsl(var(--varejo-primary))' }}
                                    >
                                        {i + 1}
                                    </span>
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
