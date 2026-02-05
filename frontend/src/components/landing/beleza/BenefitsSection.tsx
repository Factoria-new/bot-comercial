import { BarChart3, Clock, Lock, CheckCircle2, Mic, Calendar } from "lucide-react";

/**
 * BenefitsSection - Beleza Landing Page
 * ISOLATED dark luxury theme
 * Uses --beleza-* CSS variables
 */
export const BenefitsSection = () => {
    const benefits = [
        {
            icon: <Calendar className="w-6 h-6" style={{ color: 'hsl(var(--beleza-primary))' }} />,
            title: "Zero No-Show",
            description: "Lembretes automaticos 24h e 1h antes. Reducao drastica de faltas e buracos na agenda."
        },
        {
            icon: <Mic className="w-6 h-6" style={{ color: 'hsl(var(--beleza-primary-end))' }} />,
            title: "Audios Humanizados",
            description: "A IA responde com audios que parecem voce. O cliente sente que esta falando com uma pessoa real."
        },
        {
            icon: <CheckCircle2 className="w-6 h-6" style={{ color: 'hsl(var(--beleza-primary))' }} />,
            title: "Profissionalismo",
            description: "Seu negocio passa a ter atendimento de alto padrao. Rapido, cordial e disponivel 24h."
        },
        {
            icon: <Lock className="w-6 h-6" style={{ color: 'hsl(var(--beleza-primary-end))' }} />,
            title: "Seguranca de Dados",
            description: "Seus dados e de seus clientes seguros. Historico de conversas salvo para consultas futuras."
        },
        {
            icon: <Clock className="w-6 h-6" style={{ color: 'hsl(var(--beleza-primary))' }} />,
            title: "Atendimento Noturno",
            description: "Cliente quer agendar as 23h? A IA resolve. Voce descansa, a agenda enche."
        },
        {
            icon: <BarChart3 className="w-6 h-6" style={{ color: 'hsl(var(--beleza-primary-end))' }} />,
            title: "Metricas de Agendamento",
            description: "Saiba quais horarios sao mais procurados e qual servico tem mais demanda."
        }
    ];

    return (
        <section
            className="py-20 relative"
            style={{ backgroundColor: 'hsl(var(--beleza-background))' }}
        >
            <div className="container px-4 md:px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2
                        className="text-3xl md:text-5xl font-display font-bold mb-6 uppercase"
                        style={{ color: 'hsl(var(--beleza-foreground))' }}
                    >
                        Sua agenda{' '}
                        <span
                            className="text-transparent bg-clip-text"
                            style={{ backgroundImage: 'var(--beleza-gradient-primary)' }}
                        >
                            sempre cheia
                        </span>
                    </h2>
                    <p style={{ color: 'hsl(var(--beleza-muted-foreground))' }} className="text-lg">
                        Ferramentas essenciais para quem quer lotar a agenda sem parar de trabalhar.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {benefits.map((benefit, index) => (
                        <div
                            key={index}
                            className="p-6 rounded-2xl transition-all duration-300 group"
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
                                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                                style={{
                                    background: 'hsl(var(--beleza-primary) / 0.15)',
                                    border: '1px solid hsl(var(--beleza-primary) / 0.3)'
                                }}
                            >
                                {benefit.icon}
                            </div>
                            <h3
                                className="text-xl font-bold mb-3 font-display uppercase"
                                style={{ color: 'hsl(var(--beleza-foreground))' }}
                            >
                                {benefit.title}
                            </h3>
                            <p
                                className="leading-relaxed"
                                style={{ color: 'hsl(var(--beleza-muted-foreground))' }}
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
