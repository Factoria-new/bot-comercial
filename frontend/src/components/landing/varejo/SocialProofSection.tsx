import { Star } from "lucide-react";

/**
 * SocialProofSection - Varejo Landing Page
 * E-commerce impulse theme
 * Uses --varejo-* CSS variables
 */
export const SocialProofSection = () => {
    const stats = [
        { value: "+95%", label: "Retencao de Clientes" },
        { value: "24/7", label: "Vendas Automaticas" },
        { value: "3x", label: "Mais Conversao" },
        { value: "<1min", label: "Tempo de Resposta" },
    ];

    return (
        <section
            className="py-8"
            style={{
                backgroundColor: 'hsl(var(--varejo-background-alt))',
                borderTop: '1px solid hsl(var(--varejo-border))',
                borderBottom: '1px solid hsl(var(--varejo-border))'
            }}
        >
            <div className="container px-4 md:px-6">
                <div className="flex items-center justify-center gap-2 mb-6">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                            key={i}
                            className="w-5 h-5 fill-current"
                            style={{ color: 'hsl(var(--varejo-accent))' }}
                        />
                    ))}
                    <span
                        className="ml-2 text-sm font-medium"
                        style={{ color: 'hsl(var(--varejo-muted-foreground))' }}
                    >
                        Avaliacao 4.9/5 pelos clientes
                    </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    {stats.map((stat, i) => (
                        <div key={i} className="space-y-1">
                            <h3
                                className="text-3xl md:text-4xl font-bold"
                                style={{
                                    color: 'hsl(var(--varejo-primary))',
                                    fontFamily: 'Roboto, system-ui, sans-serif'
                                }}
                            >
                                {stat.value}
                            </h3>
                            <p
                                className="font-medium text-sm"
                                style={{ color: 'hsl(var(--varejo-muted-foreground))' }}
                            >
                                {stat.label}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default SocialProofSection;
