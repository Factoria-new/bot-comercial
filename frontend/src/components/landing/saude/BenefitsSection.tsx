import { Bell, CalendarClock, MessageCircle, Shield, Clock, BarChart3 } from "lucide-react";

/**
 * BenefitsSection - Saude Landing Page
 * Key benefits for healthcare professionals
 * Uses --saude-* CSS variables
 */
export const BenefitsSection = () => {
    const benefits = [
        {
            icon: <Bell className="w-6 h-6" strokeWidth={1.5} />,
            title: "Lembretes Automaticos",
            description: "Reducao de no-shows com confirmacoes e lembretes por WhatsApp."
        },
        {
            icon: <CalendarClock className="w-6 h-6" strokeWidth={1.5} />,
            title: "Agenda Inteligente",
            description: "Sincroniza automaticamente com Google Calendar em tempo real."
        },
        {
            icon: <MessageCircle className="w-6 h-6" strokeWidth={1.5} />,
            title: "Atendimento 24/7",
            description: "Pacientes podem agendar a qualquer hora, mesmo de madrugada."
        },
        {
            icon: <Shield className="w-6 h-6" strokeWidth={1.5} />,
            title: "Sigilo Garantido",
            description: "Criptografia de ponta a ponta. Adequado a LGPD."
        },
        {
            icon: <Clock className="w-6 h-6" strokeWidth={1.5} />,
            title: "Triagem Inteligente",
            description: "Identifica urgencias e prioriza casos criticos."
        },
        {
            icon: <BarChart3 className="w-6 h-6" strokeWidth={1.5} />,
            title: "Relatorios de Atendimento",
            description: "Acompanhe metricas de agendamento e satisfacao."
        }
    ];

    return (
        <section
            className="py-24 relative"
            style={{ backgroundColor: 'hsl(var(--saude-background-alt))' }}
        >
            <div className="container px-4 md:px-6">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2
                        className="text-3xl md:text-4xl font-bold mb-6 tracking-tight"
                        style={{ color: 'hsl(var(--saude-foreground))' }}
                    >
                        Tudo que voce{' '}
                        <span style={{ color: 'hsl(var(--saude-primary))' }}>
                            Precisa
                        </span>
                    </h2>
                    <p
                        className="text-lg leading-relaxed"
                        style={{ color: 'hsl(var(--saude-muted-foreground))' }}
                    >
                        Ferramentas essenciais para consultorios modernos.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {benefits.map((benefit, index) => (
                        <div
                            key={index}
                            className="p-6 rounded-2xl transition-all duration-500 group"
                            style={{
                                backgroundColor: 'hsl(var(--saude-card))',
                                border: '1px solid hsl(var(--saude-border))',
                                boxShadow: 'var(--saude-shadow-card)'
                            }}
                        >
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-500 group-hover:scale-110"
                                style={{
                                    backgroundColor: 'hsl(var(--saude-primary) / 0.08)',
                                    color: 'hsl(var(--saude-primary))'
                                }}
                            >
                                {benefit.icon}
                            </div>
                            <h3
                                className="text-lg font-semibold mb-2"
                                style={{ color: 'hsl(var(--saude-foreground))' }}
                            >
                                {benefit.title}
                            </h3>
                            <p
                                className="text-sm leading-relaxed"
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
