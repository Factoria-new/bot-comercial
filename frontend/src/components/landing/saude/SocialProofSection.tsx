export const SocialProofSection = () => {
    const stats = [
        { value: "Zero", label: "No-Show" },
        { value: "24/7", label: "Disponibilidade" },
        { value: "15min", label: "Setup Inicial" },
        { value: "+30%", label: "Reativação" },
    ];

    return (
        <section className="py-10 border-y border-lp-border/30 bg-lp-card/20 backdrop-blur-sm">
            <div className="container px-4 md:px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    {stats.map((stat, i) => (
                        <div key={i} className="space-y-2">
                            <h3 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent font-display">
                                {stat.value}
                            </h3>
                            <p className="text-lp-muted-foreground font-medium uppercase tracking-wider text-sm">
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
