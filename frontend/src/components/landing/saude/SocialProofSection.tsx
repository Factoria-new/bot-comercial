/**
 * SocialProofSection - Saude Landing Page
 * ISOLATED from main site design system.
 * Uses --saude-* CSS variables.
 */
export const SocialProofSection = () => {
    const stats = [
        { value: "Zero", label: "No-Show" },
        { value: "24/7", label: "Disponibilidade" },
        { value: "15min", label: "Setup Inicial" },
        { value: "+30%", label: "Reativacao" },
    ];

    return (
        <section
            className="py-10"
            style={{
                backgroundColor: 'hsl(var(--saude-background-alt))',
                borderTop: '1px solid hsl(var(--saude-border))',
                borderBottom: '1px solid hsl(var(--saude-border))'
            }}
        >
            <div className="container px-4 md:px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    {stats.map((stat, i) => (
                        <div key={i} className="space-y-2">
                            <h3
                                className="text-4xl md:text-5xl font-bold font-display"
                                style={{ color: 'hsl(var(--saude-primary))' }}
                            >
                                {stat.value}
                            </h3>
                            <p
                                className="font-medium uppercase tracking-wider text-sm"
                                style={{ color: 'hsl(var(--saude-muted-foreground))' }}
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
