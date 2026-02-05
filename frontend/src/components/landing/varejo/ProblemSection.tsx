import { Hourglass, MessageCircleOff, ShoppingCart } from "lucide-react";

/**
 * ProblemSection - Varejo Landing Page
 * ISOLATED dark luxury theme
 * Uses --varejo-* CSS variables
 */
export const ProblemSection = () => {
    const problems = [
        {
            icon: <Hourglass className="w-6 h-6" style={{ color: 'hsl(var(--varejo-primary))' }} />,
            title: "Compra por Impulso",
            description: "Sua cliente viu o story as 23h. Se voce responder so amanha as 09h, a vontade ja passou e voce perdeu a venda.",
        },
        {
            icon: <MessageCircleOff className="w-6 h-6" style={{ color: 'hsl(var(--varejo-primary))' }} />,
            title: "Perguntas Repetidas",
            description: "Passar o dia respondendo 'tem G?', 'qual o frete?', 'manda tabela' impede voce de focar em crescer a loja.",
        },
        {
            icon: <ShoppingCart className="w-6 h-6" style={{ color: 'hsl(var(--varejo-primary))' }} />,
            title: "Abandono de Carrinho",
            description: "O cliente pergunta o preco e some. Sem um follow-up imediato, esse dinheiro fica na mesa.",
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
                        className="text-3xl md:text-5xl font-display font-bold mb-6 uppercase"
                        style={{ color: 'hsl(var(--varejo-foreground))' }}
                    >
                        O cliente tem pressa.{' '}
                        <span
                            className="text-transparent bg-clip-text"
                            style={{ backgroundImage: 'var(--varejo-gradient-primary)' }}
                        >
                            Voce tem tempo?
                        </span>
                    </h2>
                    <p style={{ color: 'hsl(var(--varejo-muted-foreground))' }} className="text-lg">
                        No varejo online, quem responde primeiro leva. Nao deixe seu cliente esperando para comprar no concorrente.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {problems.map((problem, index) => (
                        <div
                            key={index}
                            className="group relative p-8 rounded-2xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-2"
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
                                className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"
                                style={{
                                    background: 'hsl(var(--varejo-primary) / 0.15)',
                                    border: '1px solid hsl(var(--varejo-primary) / 0.3)'
                                }}
                            >
                                {problem.icon}
                            </div>
                            <h3
                                className="text-xl font-display font-bold mb-3 uppercase"
                                style={{ color: 'hsl(var(--varejo-foreground))' }}
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
