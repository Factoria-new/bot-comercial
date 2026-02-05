import { CalendarX, PhoneOff, AlertTriangle } from "lucide-react";

/**
 * ProblemSection - Saude Landing Page
 * ISOLATED from main site design system.
 * Uses --saude-* CSS variables.
 */
export const ProblemSection = () => {
    const problems = [
        {
            icon: <CalendarX className="w-6 h-6" style={{ color: 'hsl(var(--saude-danger))' }} />,
            title: 'O "No-Show" Invisivel',
            description: "Pacientes marcam e nao aparecem. Voce perde dinheiro e tempo precioso que poderia ser usado com outros.",
        },
        {
            icon: <PhoneOff className="w-6 h-6" style={{ color: 'hsl(var(--saude-danger))' }} />,
            title: "Interrupcoes Constantes",
            description: "Atender o telefone durante um procedimento ou sessao quebra o foco e desvaloriza a experiencia do paciente atual.",
        },
        {
            icon: <AlertTriangle className="w-6 h-6" style={{ color: 'hsl(var(--saude-danger))' }} />,
            title: "Emergencias Perdidas",
            description: "Dor de dente ou crise de ansiedade nao tem hora. Se voce nao atende na hora, eles procuram outro profissional.",
        },
    ];

    return (
        <section
            className="py-20 relative overflow-hidden"
            style={{ backgroundColor: 'hsl(var(--saude-background))' }}
        >
            <div className="container px-4 md:px-6">
                <div className="text-center max-w-2xl mx-auto mb-16 animate-fade-in">
                    <h2
                        className="text-3xl md:text-5xl font-display font-bold mb-6"
                        style={{ color: 'hsl(var(--saude-foreground))' }}
                    >
                        Por que sua agenda{' '}
                        <span style={{ color: 'hsl(var(--saude-danger))' }}>tem buracos?</span>
                    </h2>
                    <p
                        className="text-lg"
                        style={{ color: 'hsl(var(--saude-muted-foreground))' }}
                    >
                        Os desafios de manter um consultorio lotado vao alem da qualidade do seu servico.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {problems.map((problem, index) => (
                        <div
                            key={index}
                            className="group relative p-8 rounded-2xl transition-all duration-300 hover:-translate-y-2"
                            style={{
                                backgroundColor: 'hsl(var(--saude-card))',
                                border: '1px solid hsl(var(--saude-border))',
                                boxShadow: 'var(--saude-shadow-card)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow = '0 8px 30px hsl(var(--saude-danger) / 0.15)';
                                e.currentTarget.style.borderColor = 'hsl(var(--saude-danger) / 0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = 'var(--saude-shadow-card)';
                                e.currentTarget.style.borderColor = 'hsl(var(--saude-border))';
                            }}
                        >
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"
                                style={{
                                    backgroundColor: 'hsl(var(--saude-danger) / 0.1)',
                                    border: '1px solid hsl(var(--saude-danger) / 0.2)'
                                }}
                            >
                                {problem.icon}
                            </div>
                            <h3
                                className="text-xl font-display font-bold mb-3"
                                style={{ color: 'hsl(var(--saude-foreground))' }}
                            >
                                {problem.title}
                            </h3>
                            <p
                                className="leading-relaxed"
                                style={{ color: 'hsl(var(--saude-muted-foreground))' }}
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
