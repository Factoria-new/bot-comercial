import { BarChart3, Clock, Users, Shield, Zap, Globe } from "lucide-react";

export const BenefitsSection = () => {
    const benefits = [
        {
            icon: <Clock className="w-6 h-6 text-lp-accent" />,
            title: "Recuperação Automática",
            description: "Identifique e reengaje leads frios automaticamente, aumentando sua taxa de conversão sem esforço extra."
        },
        {
            icon: <BarChart3 className="w-6 h-6 text-lp-accent" />,
            title: "Dados em Tempo Real",
            description: "Acompanhe métricas vitais de atendimento e vendas em um dashboard intuitivo e completo."
        },
        {
            icon: <Users className="w-6 h-6 text-lp-accent" />,
            title: "Personalização Total",
            description: "Treine a IA com seus próprios manuais, FAQs e histórico para falar exatamente como sua marca."
        },
        {
            icon: <Shield className="w-6 h-6 text-lp-accent" />,
            title: "Segurança Garantida",
            description: "Seus dados e os de seus clientes são protegidos com criptografia de ponta a ponta."
        },
        {
            icon: <Zap className="w-6 h-6 text-lp-accent" />,
            title: "Setup Relâmpago",
            description: "Comece a usar em minutos. Conecte seu WhatsApp e suba seus materiais em poucos cliques."
        },
        {
            icon: <Globe className="w-6 h-6 text-lp-accent" />,
            title: "Multilíngue",
            description: "Atenda clientes em qualquer idioma automaticamente, expandindo seu alcance global."
        }
    ];

    return (
        <section className="py-20 bg-lp-background relative">
            <div className="container px-4 md:px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">
                        Tudo o que você precisa para <span className="text-lp-accent">escalar</span>
                    </h2>
                    <p className="text-lp-muted-foreground text-lg">
                        Ferramentas poderosas desenhadas especificamente para times de alta performance.
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
