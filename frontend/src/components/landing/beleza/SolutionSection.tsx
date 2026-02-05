import { Calendar, Mic, Bell, RefreshCw } from "lucide-react";

/**
 * SolutionSection - Beleza Landing Page
 * ISOLATED dark luxury theme
 * Uses --beleza-* CSS variables
 */
export const SolutionSection = () => {
    const features = [
        {
            icon: <Calendar className="w-6 h-6" style={{ color: 'hsl(var(--beleza-primary))' }} />,
            title: "Google Agenda",
            description: "Sincronizacao automatica com sua agenda. O cliente marca, o compromisso aparece na hora.",
            delay: "0",
        },
        {
            icon: <Mic className="w-6 h-6" style={{ color: 'hsl(var(--beleza-primary-end))' }} />,
            title: "Audios Humanizados",
            description: "A IA responde com audios que parecem voce. O cliente nem percebe que e automatico.",
            delay: "100",
        },
        {
            icon: <Bell className="w-6 h-6" style={{ color: 'hsl(var(--beleza-primary))' }} />,
            title: "Lembretes Automaticos",
            description: "Reducao de no-show com lembretes 24h e 1h antes do horario marcado.",
            delay: "200",
        },
        {
            icon: <RefreshCw className="w-6 h-6" style={{ color: 'hsl(var(--beleza-primary-end))' }} />,
            title: "Reagendamento Facil",
            description: "Cliente quer mudar o horario? A IA resolve sem voce parar o procedimento.",
            delay: "300",
        }
    ];

    return (
        <section
            className="py-20 relative overflow-hidden"
            style={{ backgroundColor: 'hsl(var(--beleza-background))' }}
        >
            {/* Background Glow */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[120px] -z-10"
                style={{ background: 'var(--beleza-gradient-primary)', opacity: 0.1 }}
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
                                        backgroundColor: 'hsl(var(--beleza-card))',
                                        border: '1px solid hsl(var(--beleza-border))'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = 'hsl(var(--beleza-primary) / 0.5)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = 'hsl(var(--beleza-border))';
                                    }}
                                >
                                    <div
                                        className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                                        style={{
                                            background: 'hsl(var(--beleza-primary) / 0.15)',
                                            border: '1px solid hsl(var(--beleza-primary) / 0.3)'
                                        }}
                                    >
                                        {feature.icon}
                                    </div>
                                    <h3
                                        className="text-lg font-bold mb-2 font-display uppercase"
                                        style={{ color: 'hsl(var(--beleza-foreground))' }}
                                    >
                                        {feature.title}
                                    </h3>
                                    <p
                                        className="text-sm"
                                        style={{ color: 'hsl(var(--beleza-muted-foreground))' }}
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
                                background: 'var(--beleza-gradient-primary)',
                                color: 'white'
                            }}
                        >
                            <span className="text-sm font-medium font-sans uppercase tracking-wider">
                                Atenda enquanto trabalha
                            </span>
                        </div>

                        <h2
                            className="text-3xl md:text-5xl font-display font-bold leading-tight uppercase"
                            style={{ color: 'hsl(var(--beleza-foreground))' }}
                        >
                            Agenda cheia,<br />
                            <span
                                className="text-transparent bg-clip-text"
                                style={{ backgroundImage: 'var(--beleza-gradient-primary)' }}
                            >
                                maos livres
                            </span>
                        </h2>

                        <p
                            className="text-lg font-sans leading-relaxed"
                            style={{ color: 'hsl(var(--beleza-muted-foreground))' }}
                        >
                            Funciona como uma secretaria virtual que atende centenas de clientes ao mesmo tempo, 24 horas por dia.
                        </p>

                        <ul className="space-y-4 pt-4">
                            {[
                                'Sincronizacao com Google Agenda',
                                'Confirmacao e Lembrete Automatico',
                                'Reagendamento sem parar o atendimento'
                            ].map((item, i) => (
                                <li
                                    key={i}
                                    className="flex items-center gap-3"
                                    style={{ color: 'hsl(var(--beleza-foreground))' }}
                                >
                                    <span
                                        className="w-2 h-2 rounded-full"
                                        style={{
                                            background: 'var(--beleza-gradient-primary)',
                                            boxShadow: 'var(--beleza-shadow-accent)'
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
