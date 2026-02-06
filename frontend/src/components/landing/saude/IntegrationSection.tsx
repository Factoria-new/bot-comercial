import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Lottie from "lottie-react";

/**
 * IntegrationSection - Saude Landing Page
 * Shows WhatsApp + Google Calendar connection
 * Uses --saude-* CSS variables
 */
export const IntegrationSection = () => {
    const [connectAnimationData, setConnectAnimationData] = useState<object | null>(null);

    useEffect(() => {
        fetch('/lotties/connect.json')
            .then(res => res.json())
            .then(data => setConnectAnimationData(data))
            .catch(err => console.error("Failed to load connect Lottie:", err));
    }, []);

    return (
        <section
            className="py-24 relative z-20"
            style={{ backgroundColor: 'hsl(var(--saude-background))' }}
        >
            {/* Small Left Blob (Static) */}
            <div
                className="absolute top-1/2 -translate-y-1/2 -left-[5%] w-[15vw] h-[15vw] rounded-full opacity-60 mix-blend-multiply pointer-events-none z-0"
                style={{ backgroundColor: 'hsl(var(--saude-secondary))' }}
            />

            <div className="container px-4 md:px-6 relative z-10">
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
                        Sincronia{' '}
                        <span style={{ color: 'hsl(var(--saude-primary))' }}>
                            Perfeita
                        </span>
                    </h2>
                    <p
                        className="text-lg leading-relaxed"
                        style={{ color: 'hsl(var(--saude-muted-foreground))' }}
                    >
                        O paciente agenda no WhatsApp, aparece instantaneamente na sua Agenda.
                    </p>
                </motion.div>

                {/* Integration Visual */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    className="flex flex-col md:flex-row items-center justify-center gap-8 max-w-3xl mx-auto"
                >
                    {/* WhatsApp Card */}
                    <div
                        className="flex items-center gap-4 px-8 py-6 rounded-2xl"
                        style={{
                            backgroundColor: 'hsl(var(--saude-card))',
                            border: '1px solid hsl(var(--saude-border))',
                            boxShadow: 'var(--saude-shadow-card)'
                        }}
                    >
                        <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform hover:scale-110"
                            style={{ backgroundColor: 'transparent' }}
                        >
                            <img
                                src="/whatsapp.png"
                                alt="WhatsApp"
                                className="w-12 h-12 object-contain"
                            />
                        </div>
                        <div>
                            <p
                                className="font-semibold"
                                style={{ color: 'hsl(var(--saude-foreground))' }}
                            >
                                WhatsApp
                            </p>
                            <p
                                className="text-sm"
                                style={{ color: 'hsl(var(--saude-muted-foreground))' }}
                            >
                                Agendamento via chat
                            </p>
                        </div>
                    </div>

                    {/* Lottie Connect Animation */}
                    <div className="flex items-center">
                        {connectAnimationData && (
                            <div className="hidden md:block w-[120px] h-[120px]">
                                <Lottie
                                    animationData={connectAnimationData}
                                    loop={true}
                                    style={{ width: '100%', height: '100%' }}
                                />
                            </div>
                        )}
                        <div
                            className="md:hidden w-1 h-16"
                            style={{
                                background: 'repeating-linear-gradient(180deg, hsl(var(--saude-border)) 0, hsl(var(--saude-border)) 8px, transparent 8px, transparent 16px)'
                            }}
                        />
                    </div>

                    {/* Google Calendar Card */}
                    <div
                        className="flex items-center gap-4 px-8 py-6 rounded-2xl"
                        style={{
                            backgroundColor: 'hsl(var(--saude-card))',
                            border: '1px solid hsl(var(--saude-border))',
                            boxShadow: 'var(--saude-shadow-card)'
                        }}
                    >
                        <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform hover:scale-110"
                            style={{ backgroundColor: 'transparent' }}
                        >
                            <img
                                src="/Google_Calendar_icon_(2020).png"
                                alt="Google Calendar"
                                className="w-12 h-12 object-contain"
                            />
                        </div>
                        <div>
                            <p
                                className="font-semibold"
                                style={{ color: 'hsl(var(--saude-foreground))' }}
                            >
                                Google Calendar
                            </p>
                            <p
                                className="text-sm"
                                style={{ color: 'hsl(var(--saude-muted-foreground))' }}
                            >
                                Sincroniza automatico
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default IntegrationSection;

