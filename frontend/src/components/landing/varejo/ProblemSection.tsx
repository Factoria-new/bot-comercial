import { Hourglass, MessageCircleOff, ShoppingCart } from "lucide-react";

export const ProblemSection = () => {
    const problems = [
        {
            icon: <Hourglass className="w-6 h-6 text-red-500" />,
            title: "Compra por Impulso",
            description: "Sua cliente viu o story às 23h. Se você responder só amanhã às 09h, a vontade já passou e você perdeu a venda.",
        },
        {
            icon: <MessageCircleOff className="w-6 h-6 text-red-500" />,
            title: "Perguntas Repetidas",
            description: "Passar o dia respondendo 'tem G?', 'qual o frete?', 'manda tabela' impede você de focar em crescer a loja.",
        },
        {
            icon: <ShoppingCart className="w-6 h-6 text-red-500" />,
            title: "Abandono de Carrinho",
            description: "O cliente pergunta o preço e some. Sem um follow-up imediato, esse dinheiro fica na mesa.",
        },
    ];

    return (
        <section className="py-20 bg-lp-background relative overflow-hidden">
            <div className="container px-4 md:px-6">
                <div className="text-center max-w-2xl mx-auto mb-16 animate-fade-in">
                    <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">
                        O cliente tem pressa. <span className="text-lp-cta-orange">Você tem tempo?</span>
                    </h2>
                    <p className="text-lp-muted-foreground text-lg">
                        No varejo online, quem responde primeiro leva. Não deixe seu cliente esperando para comprar no concorrente.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {problems.map((problem, index) => (
                        <div
                            key={index}
                            className="group relative p-8 rounded-2xl bg-lp-card/50 border border-lp-border/30 hover:bg-lp-card/80 transition-all duration-300 hover:-translate-y-2 backdrop-blur-sm"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                                <ShoppingCart className="w-8 h-8 text-red-500/50" />
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20 group-hover:scale-110 transition-transform duration-300">
                                {problem.icon}
                            </div>
                            <h3 className="text-xl font-display font-bold text-white mb-3">
                                {problem.title}
                            </h3>
                            <p className="text-lp-muted-foreground leading-relaxed">
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
