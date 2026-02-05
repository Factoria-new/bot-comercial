import { motion } from "framer-motion";

/**
 * IntegrationSection - Saude Landing Page
 * Shows WhatsApp + Google Calendar connection
 * Uses --saude-* CSS variables
 */
export const IntegrationSection = () => {
    return (
        <section
            className="py-24 relative overflow-hidden"
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
                            className="w-14 h-14 rounded-2xl flex items-center justify-center"
                            style={{ backgroundColor: '#25D3661A' }}
                        >
                            <svg viewBox="0 0 24 24" className="w-8 h-8" fill="#25D366">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118 1.121 0 2.479.248-.005 2.875-1.372 2.875-2.227v0z" />
                                <path d="M11.94 1a9.97 9.97 0 0 0-9.97 9.97c0 1.95.56 3.77 1.54 5.34L2.24 21.76l5.58-1.46a9.96 9.96 0 0 0 4.12.89 9.97 9.97 0 0 0 9.97-9.97A9.97 9.97 0 0 0 11.94 1z" fill="none" />
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
                            className="w-14 h-14 rounded-2xl flex items-center justify-center"
                            style={{ backgroundColor: 'hsl(var(--saude-secondary) / 0.1)' }}
                        >
                            <svg viewBox="0 0 24 24" className="w-8 h-8">
                                <path fill="#4285F4" d="M20.57 3.68h-1.63V1.64c0-.45-.36-.82-.82-.82s-.82.37-.82.82v2.04H6.7V1.64c0-.45-.36-.82-.82-.82s-.82.37-.82.82v2.04H3.43c-.9 0-1.64.74-1.64 1.64v15.54c0 .9.74 1.64 1.64 1.64h17.14c.9 0 1.64-.74 1.64-1.64V5.32c0-.9-.74-1.64-1.64-1.64zM19.1 20.88H4.9c-.45 0-.82-.37-.82-.82V8.59h15.84v11.47c0 .45-.37.82-.82.82z" />
                                <path fill="#34A853" d="M12 12h-4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-4c0-.55-.45-1-1-1zm-.25 4.25h-3.5v-3.5h3.5v3.5z" />
                                <path fill="#FBBC05" d="M16.5 12h-2c-.28 0-.5.22-.5.5v2c0 .28.22.5.5.5h2c.28 0 .5-.22.5-.5v-2c0-.28-.22-.5-.5-.5z" />
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
