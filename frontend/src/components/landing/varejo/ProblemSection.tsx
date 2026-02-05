import { Clock, UserX, ShoppingCart } from "lucide-react";

/**
 * ProblemSection - Varejo Landing Page
 * E-commerce impulse theme
 * Uses --varejo-* CSS variables
 */
export const ProblemSection = () => {
    const problems = [
        {
            icon: <Clock className="w-6 h-6" style={{ color: 'hsl(var(--varejo-secondary))' }} />,
            title: "O Cliente Tem Pressa",
            description: "Demora pra responder? Ele ja fechou com o concorrente. A cada minuto de espera, uma venda perdida.",
        },
        {
            icon: <ShoppingCart className="w-6 h-6" style={{ color: 'hsl(var(--varejo-secondary))' }} />,
            title: "Carrinho Abandonado",
            description: "O cliente perguntou preco e sumiu. Sem follow-up automatico, essa venda nunca volta.",
        },
        {
            icon: <UserX className="w-6 h-6" style={{ color: 'hsl(var(--varejo-secondary))' }} />,
            title: "Vendas na Madrugada",
            description: "O comprador da insonia mandou mensagem as 2h. Quando voce acordou, ele ja tinha desistido.",
        },
    ];

    return (
        <section
            className="py-20 relative overflow-hidden"
            style={{ backgroundColor: 'hsl(var(--varejo-background))' }}
        >
            <div className="container px-4 md:px-6">
                <div className="text-center max-w-2xl mx-auto mb-16 animate-fade-in">
                    <h2
                        className="text-3xl md:text-5xl font-bold mb-6"
                        style={{
                            color: 'hsl(var(--varejo-foreground))',
                            fontFamily: 'Roboto, system-ui, sans-serif'
                        }}
                    >
                        O cliente{' '}
                        <span style={{ color: 'hsl(var(--varejo-secondary))' }}>
                            tem pressa
                        </span>
                    </h2>
                    <p
                        className="text-lg"
                        style={{ color: 'hsl(var(--varejo-muted-foreground))' }}
                    >
                        No varejo online, quem demora perde. Veja os problemas que drenam seu faturamento.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {problems.map((problem, index) => (
                        <div
                            key={index}
                            className="group relative p-8 rounded-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer"
                            style={{
                                backgroundColor: 'hsl(var(--varejo-card))',
                                border: '1px solid hsl(var(--varejo-border))',
                                boxShadow: 'var(--varejo-shadow-card)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow = '0 8px 30px hsl(0 84% 60% / 0.15)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = 'var(--varejo-shadow-card)';
                            }}
                        >
                            <div
                                className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"
                                style={{
                                    backgroundColor: 'hsl(var(--varejo-secondary) / 0.1)'
                                }}
                            >
                                {problem.icon}
                            </div>
                            <h3
                                className="text-xl font-bold mb-3"
                                style={{
                                    color: 'hsl(var(--varejo-foreground))',
                                    fontFamily: 'Roboto, system-ui, sans-serif'
                                }}
                            >
                                {problem.title}
                            </h3>
                            <p
                                className="leading-relaxed"
                                style={{ color: 'hsl(var(--varejo-muted-foreground))' }}
                            >
                                {problem.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ProblemSection;
