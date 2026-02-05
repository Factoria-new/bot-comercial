/**
 * SocialProofSection - Varejo Landing Page
 * ISOLATED dark luxury theme
 * Uses --varejo-* CSS variables
 */
export const SocialProofSection = () => {
    const stats = [
        { value: "Retencao", label: "de Venda" },
        { value: "24/7", label: "Disponibilidade" },
        { value: "15min", label: "Setup Inicial" },
        { value: "0s", label: "Fila de Espera" },
    ];

    return (
        <section
            className="py-10 backdrop-blur-sm"
            style={{
                backgroundColor: 'hsl(var(--varejo-card))',
                borderTop: '1px solid hsl(var(--varejo-border))',
                borderBottom: '1px solid hsl(var(--varejo-border))'
            }}
        >
            <div className="container px-4 md:px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    {stats.map((stat, i) => (
                        <div key={i} className="space-y-2">
                            <h3
                                className="text-4xl md:text-5xl font-bold font-display text-transparent bg-clip-text uppercase"
                                style={{ backgroundImage: 'var(--varejo-gradient-primary)' }}
                            >
                                {stat.value}
                            </h3>
                            <p
                                className="font-medium uppercase tracking-wider text-sm"
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
