import { ShieldCheck, HeartPulse, Stethoscope, Clock } from "lucide-react";

/**
 * SolutionSection - Saude Landing Page
 * ISOLATED from main site design system.
 * Uses --saude-* CSS variables.
 */
export const SolutionSection = () => {
    const features = [
        {
            icon: <ShieldCheck className="w-6 h-6" style={{ color: 'hsl(var(--saude-primary))' }} />,
            title: "Biosseguranca Total",
            description: "Voce nao precisa tirar as luvas para responder. Deixe o celular de lado e mantenha o foco na higiene e no paciente.",
            delay: "0",
        },
        {
            icon: <HeartPulse className="w-6 h-6" style={{ color: 'hsl(var(--saude-secondary))' }} />,
            title: "Acolhimento Imediato",
            description: "Responda pacientes fragilizados em segundos com tom de voz empatico e acolhedor, nao robotico.",
            delay: "100",
        },
        {
            icon: <Clock className="w-6 h-6" style={{ color: 'hsl(var(--saude-primary))' }} />,
            title: "Plantao 24 Horas",
            description: "Seu consultorio fecha, mas as dores e duvidas dos pacientes nao. Esteja disponivel quando eles mais precisam.",
            delay: "200",
        },
        {
            icon: <Stethoscope className="w-6 h-6" style={{ color: 'hsl(var(--saude-secondary))' }} />,
            title: "Triagem Inteligente",
            description: "Filtre automaticamente convenios, particulares e tipos de procedimento antes mesmo de falar com o paciente.",
            delay: "300",
        }
    ];

    return (
        <section
            className="py-20 relative overflow-hidden"
            style={{ backgroundColor: 'hsl(var(--saude-background-alt))' }}
        >
            {/* Subtle Background Glow */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[150px] -z-10 opacity-30"
                style={{ backgroundColor: 'hsl(var(--saude-primary) / 0.1)' }}
            />

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
                                        className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                                        style={{
                                            backgroundColor: 'hsl(var(--saude-primary) / 0.1)',
                                            border: '1px solid hsl(var(--saude-primary) / 0.2)'
                                        }}
                                    >
                                        {feature.icon}
                                    </div>
                                    <h3
                                        className="text-lg font-bold mb-2 font-display"
                                        style={{ color: 'hsl(var(--saude-foreground))' }}
                                    >
                                        {feature.title}
                                    </h3>
                                    <p
                                        className="text-sm"
                                        style={{ color: 'hsl(var(--saude-muted-foreground))' }}
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
                                backgroundColor: 'hsl(var(--saude-secondary) / 0.1)',
                                border: '1px solid hsl(var(--saude-secondary) / 0.3)'
                            }}
                        >
                            <span
                                className="text-sm font-medium font-sans"
                                style={{ color: 'hsl(var(--saude-secondary))' }}
                            >
                                A Etica Encontra a Eficiencia
                            </span>
                        </div>

                        <h2
                            className="text-3xl md:text-5xl font-display font-bold leading-tight"
                            style={{ color: 'hsl(var(--saude-foreground))' }}
                        >
                            Cuide dos pacientes, <br />
                            <span
                                className="text-transparent bg-clip-text"
                                style={{ backgroundImage: 'linear-gradient(135deg, hsl(var(--saude-primary)), hsl(var(--saude-secondary)))' }}
                            >
                                nos cuidamos da agenda
                            </span>
                        </h2>

                        <p
                            className="text-lg font-sans leading-relaxed"
                            style={{ color: 'hsl(var(--saude-muted-foreground))' }}
                        >
                            O Caji Assist respeita a delicadeza da relacao profissional-paciente. E uma ferramenta discreta, segura e eficiente para garantir que sua clinica funcione como um relogio suico.
                        </p>

                        <ul className="space-y-4 pt-4">
                            {[
                                'Integracao com Google Agenda',
                                'Scripts validados para Saude',
                                'Privacidade total dos dados'
                            ].map((item, index) => (
                                <li
                                    key={index}
                                    className="flex items-center gap-3"
                                    style={{ color: 'hsl(var(--saude-foreground))' }}
                                >
                                    <span
                                        className="w-2 h-2 rounded-full"
                                        style={{
                                            backgroundColor: 'hsl(var(--saude-primary))',
                                            boxShadow: '0 0 8px hsl(var(--saude-primary) / 0.5)'
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
