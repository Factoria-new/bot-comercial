import { BarChart3, Clock, Lock, CheckCircle2, Moon, MessageCircle } from "lucide-react";

export const BenefitsSection = () => {
    const benefits = [
        {
            icon: <CheckCircle2 className="w-6 h-6 text-lp-accent" />,
            title: "Fim do 'No-Show'",
            description: "O sistema cobra confirmação e envia lembretes. Se o cliente não confirmar, você libera o horário para outro."
        },
        {
            icon: <Moon className="w-6 h-6 text-lp-accent" />,
            title: "Agende Enquanto Dorme",
            description: "Acorde com a agenda do dia seguinte cheia. Seus clientes marcam horário às 23h, quando lembram."
        },
        {
            icon: <MessageCircle className="w-6 h-6 text-lp-accent" />,
            title: "Imagem Profissional",
            description: "Pareça uma clínica grande. Um atendimento rápido, educado e eficiente valoriza seu serviço."
        },
        {
            icon: <Lock className="w-6 h-6 text-lp-accent" />,
            title: "Privacidade Garantida",
            description: "Seus dados e de seus clientes seguros. Nada de caderninho de papel perdido no balcão."
        },
        {
            icon: <Clock className="w-6 h-6 text-lp-accent" />,
            title: "Mais Tempo Livre",
            description: "Foque na sua arte ou descanse entre um cliente e outro. Deixe o celular de lado sem culpa."
        },
        {
            icon: <BarChart3 className="w-6 h-6 text-lp-accent" />,
            title: "Gestão Descomplicada",
            description: "Painel simples para ver quantos agendamentos teve, quanto faturou e quem são os melhores clientes."
        }
    ];

    return (
        <section className="py-20 bg-lp-background relative">
            <div className="container px-4 md:px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">
                        Sua recepção <span className="text-lp-accent">no piloto automático</span>
                    </h2>
                    <p className="text-lp-muted-foreground text-lg">
                        Ferramentas essenciais para quem quer escalar o negócio sem perder a qualidade do atendimento.
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
