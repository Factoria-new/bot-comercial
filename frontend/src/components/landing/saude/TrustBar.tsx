import { Lock, Shield, Cloud } from "lucide-react";
import { motion } from "framer-motion";

/**
 * TrustBar - Saude Landing Page
 * Security/compliance badges below hero
 * Uses --saude-* CSS variables
 */
export const TrustBar = () => {
    const trustItems = [
        {
            icon: <Lock className="w-5 h-5" style={{ color: 'hsl(var(--saude-muted-foreground))' }} />,
            text: "Criptografia de Ponta a Ponta"
        },
        {
            icon: <Shield className="w-5 h-5" style={{ color: 'hsl(var(--saude-muted-foreground))' }} />,
            text: "Adequado a LGPD"
        },
        {
            icon: <Cloud className="w-5 h-5" style={{ color: 'hsl(var(--saude-muted-foreground))' }} />,
            text: "Backup Automatico"
        }
    ];

    return (
        <section
            className="py-6"
            style={{
                backgroundColor: 'hsl(var(--saude-background-alt))',
                borderTop: '1px solid hsl(var(--saude-border))',
                borderBottom: '1px solid hsl(var(--saude-border))'
            }}
        >
            <div className="container px-4 md:px-6">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="flex flex-wrap justify-center items-center gap-8 md:gap-16"
                >
                    {trustItems.map((item, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-3 text-sm font-medium"
                            style={{ color: 'hsl(var(--saude-muted-foreground))' }}
                        >
                            {item.icon}
                            {item.text}
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default TrustBar;
