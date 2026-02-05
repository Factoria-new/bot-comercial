import { CalendarX, PhoneOff, Clock } from "lucide-react";

/**
 * ProblemSection - Beleza Landing Page
 * ISOLATED dark luxury theme
 * Uses --beleza-* CSS variables
 */
export const ProblemSection = () => {
    const problems = [
        {
            icon: <CalendarX className="w-6 h-6" style={{ color: 'hsl(var(--beleza-primary))' }} />,
            title: "O No-Show Invisivel",
            description: "Clientes marcam e nao aparecem. Voce perde dinheiro e tempo precioso que poderia ser usado com outros.",
        },
        {
            icon: <PhoneOff className="w-6 h-6" style={{ color: 'hsl(var(--beleza-primary))' }} />,
            title: "Interrupcoes Constantes",
            description: "Atender o telefone durante um procedimento quebra o foco e desvaloriza a experiencia do cliente atual.",
        },
        {
            icon: <Clock className="w-6 h-6" style={{ color: 'hsl(var(--beleza-primary))' }} />,
            title: "Atendimento Noturno",
            description: "Cliente quer marcar as 23h? Se voce nao responde na hora, ele agenda com o concorrente.",
        },
    ];

    return (
        <section
            className="py-20 relative overflow-hidden"
            style={{ backgroundColor: 'hsl(var(--beleza-background))' }}
        >
            <div className="container px-4 md:px-6">
                <div className="text-center max-w-2xl mx-auto mb-16 animate-fade-in">
                    <h2
                        className="text-3xl md:text-5xl font-display font-bold mb-6 uppercase"
                        style={{ color: 'hsl(var(--beleza-foreground))' }}
                    >
                        Por que sua agenda{' '}
                        <span
                            className="text-transparent bg-clip-text"
                            style={{ backgroundImage: 'var(--beleza-gradient-primary)' }}
                        >
                            tem buracos?
                        </span>
                    </h2>
                    <p style={{ color: 'hsl(var(--beleza-muted-foreground))' }} className="text-lg">
                        Os desafios de manter a agenda cheia vao alem da qualidade do seu servico.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {problems.map((problem, index) => (
                        <div
                            key={index}
                            className="group relative p-8 rounded-2xl backdrop-blur-sm transition-all duration-300 hover:-translate-y-2"
                            style={{
                                backgroundColor: 'hsl(var(--beleza-card))',
                                border: '1px solid hsl(var(--beleza-border))'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'hsl(var(--beleza-primary) / 0.5)';
                                e.currentTarget.style.boxShadow = 'var(--beleza-shadow-accent)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'hsl(var(--beleza-border))';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"
                                style={{
                                    background: 'hsl(var(--beleza-primary) / 0.15)',
                                    border: '1px solid hsl(var(--beleza-primary) / 0.3)'
                                }}
                            >
                                {problem.icon}
                            </div>
                            <h3
                                className="text-xl font-display font-bold mb-3 uppercase"
                                style={{ color: 'hsl(var(--beleza-foreground))' }}
                            >
                                {problem.title}
                            </h3>
                            <p
                                className="leading-relaxed"
                                style={{ color: 'hsl(var(--beleza-muted-foreground))' }}
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
