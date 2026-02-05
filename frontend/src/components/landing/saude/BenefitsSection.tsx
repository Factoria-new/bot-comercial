import { BarChart3, Clock, Lock, UserCheck, CalendarDays, MessageCircle } from "lucide-react";

export const BenefitsSection = () => {
    const benefits = [
        {
            icon: <CalendarDays className="w-6 h-6 text-lp-accent" />,
            title: "Reativação de Pacientes",
            description: "Nosso sistema lembra automaticamente pacientes de agendar retornos e check-ups periódicos."
        },
        {
            icon: <BarChart3 className="w-6 h-6 text-lp-accent" />,
            title: "Gestão da Agenda",
            description: "Evite buracos na agenda. Se alguém cancela, o sistema pode oferecer o horário para a lista de espera."
        },
        {
            icon: <MessageCircle className="w-6 h-6 text-lp-accent" />,
            title: "Sem 'Robô Chato'",
            description: "Nada de 'digite 1'. A conversa flui naturalmente, aumentando a confiança do paciente no profissional."
        },
        {
            icon: <Lock className="w-6 h-6 text-lp-accent" />,
            title: "Privacidade e LGPD",
            description: "Dados criptografados e seguros. Muito mais privacidade do que uma secretária anotando em papel."
        },
        {
            icon: <Clock className="w-6 h-6 text-lp-accent" />,
            title: "Instalação Express",
            description: "Funciona em cima do seu WhatsApp e Google Agenda atuais. Sem instalar programas complexos."
        },
        {
            icon: <UserCheck className="w-6 h-6 text-lp-accent" />,
            title: "Qualidade de Vida",
            description: "Volte a ter seus finais de semana e noites livres, sabendo que sua clínica continua atendendo."
        }
    ];

    return (
        <section className="py-20 bg-lp-background relative">
            <div className="container px-4 md:px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">
                        Menos administrativo, <span className="text-lp-accent">mais saúde</span>
                    </h2>
                    <p className="text-lp-muted-foreground text-lg">
                        Ferramentas pensadas para a rotina de quem cuida de pessoas.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {benefits.map((benefit, index) => (
                        <div
                            key={index}
                            className="p-6 rounded-2xl bg-lp-card/40 border border-lp-border/30 hover:bg-lp-card/60 hover:border-lp-accent/30 transition-all duration-300 group"
                        >
                            <div className="w-12 h-12 rounded-xl bg-lp-accent/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                {benefit.icon}
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3 font-display">
                                {benefit.title}
                            </h3>
                            <p className="text-lp-muted-foreground leading-relaxed">
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
