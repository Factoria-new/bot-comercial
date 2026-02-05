import { BarChart3, Clock, Lock, UserCheck, CalendarDays, MessageCircle } from "lucide-react";

/**
 * BenefitsSection - Saude Landing Page
 * ISOLATED from main site design system.
 * Uses --saude-* CSS variables.
 */
export const BenefitsSection = () => {
    const benefits = [
        {
            icon: <CalendarDays className="w-6 h-6" style={{ color: 'hsl(var(--saude-secondary))' }} />,
            title: "Reativacao de Pacientes",
            description: "Nosso sistema lembra automaticamente pacientes de agendar retornos e check-ups periodicos."
        },
        {
            icon: <BarChart3 className="w-6 h-6" style={{ color: 'hsl(var(--saude-primary))' }} />,
            title: "Gestao da Agenda",
            description: "Evite buracos na agenda. Se alguem cancela, o sistema pode oferecer o horario para a lista de espera."
        },
        {
            icon: <MessageCircle className="w-6 h-6" style={{ color: 'hsl(var(--saude-secondary))' }} />,
            title: "Sem 'Robo Chato'",
            description: "Nada de 'digite 1'. A conversa flui naturalmente, aumentando a confianca do paciente no profissional."
        },
        {
            icon: <Lock className="w-6 h-6" style={{ color: 'hsl(var(--saude-primary))' }} />,
            title: "Privacidade e LGPD",
            description: "Dados criptografados e seguros. Muito mais privacidade do que uma secretaria anotando em papel."
        },
        {
            icon: <Clock className="w-6 h-6" style={{ color: 'hsl(var(--saude-secondary))' }} />,
            title: "Instalacao Express",
            description: "Funciona em cima do seu WhatsApp e Google Agenda atuais. Sem instalar programas complexos."
        },
        {
            icon: <UserCheck className="w-6 h-6" style={{ color: 'hsl(var(--saude-primary))' }} />,
            title: "Qualidade de Vida",
            description: "Volte a ter seus finais de semana e noites livres, sabendo que sua clinica continua atendendo."
        }
    ];

    return (
        <section
            className="py-20 relative"
            style={{ backgroundColor: 'hsl(var(--saude-background))' }}
        >
            <div className="container px-4 md:px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2
                        className="text-3xl md:text-5xl font-display font-bold mb-6"
                        style={{ color: 'hsl(var(--saude-foreground))' }}
                    >
                        Menos administrativo,{' '}
                        <span style={{ color: 'hsl(var(--saude-primary))' }}>mais saude</span>
                    </h2>
                    <p
                        className="text-lg"
                        style={{ color: 'hsl(var(--saude-muted-foreground))' }}
                    >
                        Ferramentas pensadas para a rotina de quem cuida de pessoas.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {benefits.map((benefit, index) => (
                        <div
                            key={index}
                            className="p-6 rounded-2xl transition-all duration-300 group"
                            style={{
                                backgroundColor: 'hsl(var(--saude-card))',
                                border: '1px solid hsl(var(--saude-border))',
                                boxShadow: 'var(--saude-shadow-card)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow = 'var(--saude-shadow-soft)';
                                e.currentTarget.style.borderColor = 'hsl(var(--saude-primary) / 0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = 'var(--saude-shadow-card)';
                                e.currentTarget.style.borderColor = 'hsl(var(--saude-border))';
                            }}
                        >
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                                style={{
                                    backgroundColor: 'hsl(var(--saude-secondary) / 0.1)',
                                    border: '1px solid hsl(var(--saude-secondary) / 0.2)'
                                }}
                            >
                                {benefit.icon}
                            </div>
                            <h3
                                className="text-xl font-bold mb-3 font-display"
                                style={{ color: 'hsl(var(--saude-foreground))' }}
                            >
                                {benefit.title}
                            </h3>
                            <p
                                className="leading-relaxed"
                                style={{ color: 'hsl(var(--saude-muted-foreground))' }}
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
