import { UserX, UserCog, Moon } from "lucide-react";
import { motion } from "framer-motion";

/**
 * ProblemSection - Saude Landing Page
 * Problem vs Solution cards with outline icons
 * Uses --saude-* CSS variables
 */
export const ProblemSection = () => {
    const problems = [
        {
            icon: <UserX className="w-7 h-7" strokeWidth={1.5} />,
            title: "Reduza Faltas de Pacientes",
            description: "Confirmacao automatica e lembretes inteligentes reduzem drasticamente os no-shows."
        },
        {
            icon: <UserCog className="w-7 h-7" strokeWidth={1.5} />,
            title: "Nunca Pare uma Consulta",
            description: "Nao interrompa o atendimento para responder WhatsApp. O Caji cuida disso."
        },
        {
            icon: <Moon className="w-7 h-7" strokeWidth={1.5} />,
            title: "Triagem na Madrugada",
            description: "Pacientes com urgencia sao identificados e priorizados automaticamente."
        }
    ];

    return (
        <section
            className="py-24 relative"
            style={{ backgroundColor: 'hsl(var(--saude-background))' }}
        >
            <div className="container px-4 md:px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-center max-w-2xl mx-auto mb-16"
                >
                    <h2
                        className="text-3xl md:text-4xl font-bold mb-6 tracking-tight"
                        style={{ color: 'hsl(var(--saude-foreground))' }}
                    >
                        Os Problemas que{' '}
                        <span style={{ color: 'hsl(var(--saude-primary))' }}>
                            Resolvemos
                        </span>
                    </h2>
                    <p
                        className="text-lg leading-relaxed"
                        style={{ color: 'hsl(var(--saude-muted-foreground))' }}
                    >
                        Seu tempo e precioso. Deixe a IA cuidar das tarefas repetitivas.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
                >
                    {problems.map((problem, index) => (
                        <motion.div
                            key={index}
                            className="group p-8 rounded-2xl transition-all duration-500"
                            animate={{ y: [0, -20, 0] }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            whileHover={{ scale: 1.08, y: -20, boxShadow: "0 20px 40px -10px hsl(var(--saude-primary) / 0.2)" }}
                            style={{
                                backgroundColor: 'hsl(var(--saude-card))',
                                border: '1px solid hsl(var(--saude-border))',
                                boxShadow: 'var(--saude-shadow-card)'
                            }}
                        >
                            <div
                                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110"
                                style={{
                                    backgroundColor: 'hsl(var(--saude-secondary) / 0.08)',
                                    color: 'hsl(var(--saude-secondary))'
                                }}
                            >
                                {problem.icon}
                            </div>
                            <h3
                                className="text-xl font-semibold mb-3"
                                style={{ color: 'hsl(var(--saude-foreground))' }}
                            >
                                {problem.title}
                            </h3>
                            <p
                                className="leading-relaxed"
                                style={{ color: 'hsl(var(--saude-muted-foreground))' }}
                            >
                                {problem.description}
                            </p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default ProblemSection;
