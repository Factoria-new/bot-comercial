import { motion } from "framer-motion";
import { BackgroundBlobs } from "./BackgroundBlobs";

/**
 * IntegrationSection - Saude Landing Page
 * Shows WhatsApp + Google Calendar connection
 * Uses --saude-* CSS variables
 */
export const IntegrationSection = () => {
    return (
        <section
            className="py-24 relative"
            style={{ backgroundColor: 'hsl(var(--saude-background))' }}
        >
            <BackgroundBlobs />
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
                            <svg viewBox="0 0 48 48" className="w-12 h-12">
                                <path fill="#25D366" d="M24 4C12.95 4 4 12.95 4 24c0 3.53.92 6.86 2.52 9.77L4 44l10.51-2.76A19.95 19.95 0 0 0 24 44c11.05 0 20-8.95 20-20S35.05 4 24 4z" />
                                <path fill="#fff" d="M34.73 29.56c-.53-.27-3.13-1.54-3.61-1.72-.48-.18-.84-.27-1.19.27-.35.53-1.37 1.72-1.67 2.07-.31.35-.61.4-.97.27a14.2 14.2 0 0 1-4.73-2.92 15.63 15.63 0 0 1-3.27-4.07c-.18-.31-.02-.48.12-.74.13-.24.28-.62.42-.93.14-.31.21-.52.32-.87.11-.35.05-.66-.02-.93-.09-.27-.85-2.04-1.16-2.79-.31-.73-.61-.63-.84-.64h-.72c-.25 0-.66.09-1 .46-.35.37-1.33 1.3-1.33 3.17 0 1.88 1.37 3.69 1.56 3.95.19.27 2.69 4.11 6.52 5.76 2.56 1.11 3.08.89 4.2.83 1.22-.06 3.13-1.28 3.57-2.52.44-1.24.44-2.3.31-2.52-.13-.22-.48-.35-1.01-.62z" />
                            </svg>
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

                    {/* Dotted Line */}
                    <div className="flex items-center">
                        <svg
                            width="120"
                            height="40"
                            viewBox="0 0 120 40"
                            className="hidden md:block"
                        >
                            <path
                                d="M0 20 L120 20"
                                stroke="hsl(var(--saude-border))"
                                strokeWidth="3"
                                strokeDasharray="8 8"
                                fill="none"
                            >
                                <animate
                                    attributeName="stroke-dashoffset"
                                    values="0;16"
                                    dur="3s"
                                    repeatCount="indefinite"
                                />
                            </path>
                            <circle
                                cx="60"
                                cy="20"
                                r="6"
                                fill="hsl(var(--saude-primary))"
                            >
                                <animate
                                    attributeName="r"
                                    values="4;6;4"
                                    dur="3s"
                                    repeatCount="indefinite"
                                />
                            </circle>
                        </svg>
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
                            <svg viewBox="0 0 48 48" className="w-12 h-12">
                                <rect x="8" y="11" width="32" height="31" rx="4" fill="#fff" strokeWidth="0" />
                                <path fill="#4285F4" d="M37 9h-4v4h4v26H11V13h4V9h-4c-2.21 0-4 1.79-4 4v26c0 2.21 1.79 4 4 4h26c2.21 0 4-1.79 4-4V13c0-2.21-1.79-4-4-4z" />
                                <text x="24" y="34" fontSize="20" fontWeight="bold" fill="#4285F4" textAnchor="middle" fontFamily="Arial">31</text>
                                <path fill="#FBBC05" d="M37 9H11c-2.21 0-4 1.79-4 4h34c0-2.21-1.79-4-4-4z" />
                                <path fill="#EA4335" d="M37 9h-4V5H15v4h-4c-2.21 0-4 1.79-4 4v.5h34V13c0-2.21-1.79-4-4-4z" />
                                <path fill="#34A853" d="M7 39v-5h34v5c0 2.21-1.79 4-4 4H11c-2.21 0-4-1.79-4-4z" />
                            </svg>
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
                                Sincroniza automático
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default IntegrationSection;
