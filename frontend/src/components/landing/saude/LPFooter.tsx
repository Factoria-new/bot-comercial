import { Mail, Linkedin, Instagram, Stethoscope } from 'lucide-react';
import { motion } from "framer-motion";

/**
 * LPFooter - Saude Landing Page
 * Clean minimalist footer
 * Uses --saude-* CSS variables
 */
export const LPFooter = () => {
    const footerLinks = {
        product: [
            { label: 'Funcionalidades', href: '#features' },
            { label: 'Produtos', href: '#produto' },
            { label: 'Precos', href: '#pricing' }
        ],
        company: [
            { label: 'Sobre Nos', href: '#sobre' }
        ],
        legal: [
            { label: 'Politica de Privacidade', href: '/politica-de-privacidade' },
            { label: 'Termos de Servico', href: '/termos-de-servico' },
            { label: 'LGPD', href: '/lgpd' }
        ]
    };

    return (
        <motion.footer
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="py-12 md:py-16"
            style={{
                backgroundColor: 'hsl(var(--saude-background-alt))',
                borderTop: '1px solid hsl(var(--saude-border))'
            }}
        >
            <div className="container mx-auto px-4 md:px-8">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-12">
                    <div className="md:col-span-2 space-y-6">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: 'hsl(var(--saude-primary) / 0.1)' }}
                            >
                                <Stethoscope
                                    className="w-5 h-5"
                                    style={{ color: 'hsl(var(--saude-primary))' }}
                                />
                            </div>
                            <span
                                className="text-xl font-semibold"
                                style={{ color: 'hsl(var(--saude-foreground))' }}
                            >
                                Saude Assist
                            </span>
                        </div>
                        <p
                            className="max-w-sm leading-relaxed"
                            style={{ color: 'hsl(var(--saude-muted-foreground))' }}
                        >
                            Automatize seu consultorio com IA. Agendamento, confirmacoes e triagem 24h pelo WhatsApp.
                        </p>
                        <div className="flex gap-3">
                            <a
                                href="https://www.instagram.com/cajisolutionsofc/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300"
                                style={{
                                    backgroundColor: 'hsl(var(--saude-background))',
                                    border: '1px solid hsl(var(--saude-border))'
                                }}
                                aria-label="Instagram"
                            >
                                <Instagram
                                    className="w-5 h-5"
                                    style={{ color: 'hsl(var(--saude-muted-foreground))' }}
                                />
                            </a>
                            <a
                                href="https://www.linkedin.com/company/caji-solutions"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300"
                                style={{
                                    backgroundColor: 'hsl(var(--saude-background))',
                                    border: '1px solid hsl(var(--saude-border))'
                                }}
                                aria-label="LinkedIn"
                            >
                                <Linkedin
                                    className="w-5 h-5"
                                    style={{ color: 'hsl(var(--saude-muted-foreground))' }}
                                />
                            </a>
                        </div>
                    </div>

                    <div>
                        <h3
                            className="font-semibold mb-6 text-xs uppercase tracking-wider"
                            style={{ color: 'hsl(var(--saude-muted-foreground))' }}
                        >
                            Produto
                        </h3>
                        <ul className="space-y-4">
                            {footerLinks.product.map((link) => (
                                <li key={link.label}>
                                    <a
                                        href={link.href}
                                        className="text-sm transition-colors hover:opacity-70"
                                        style={{ color: 'hsl(var(--saude-foreground))' }}
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3
                            className="font-semibold mb-6 text-xs uppercase tracking-wider"
                            style={{ color: 'hsl(var(--saude-muted-foreground))' }}
                        >
                            Empresa
                        </h3>
                        <ul className="space-y-4">
                            {footerLinks.company.map((link) => (
                                <li key={link.label}>
                                    <a
                                        href={link.href}
                                        className="text-sm transition-colors hover:opacity-70"
                                        style={{ color: 'hsl(var(--saude-foreground))' }}
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3
                            className="font-semibold mb-6 text-xs uppercase tracking-wider"
                            style={{ color: 'hsl(var(--saude-muted-foreground))' }}
                        >
                            Legal
                        </h3>
                        <ul className="space-y-4">
                            {footerLinks.legal.map((link) => (
                                <li key={link.label}>
                                    <a
                                        href={link.href}
                                        className="text-sm transition-colors hover:opacity-70"
                                        style={{ color: 'hsl(var(--saude-foreground))' }}
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div
                    className="pt-8"
                    style={{ borderTop: '1px solid hsl(var(--saude-border))' }}
                >
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <p
                            className="text-xs"
                            style={{ color: 'hsl(var(--saude-muted-foreground))' }}
                        >
                            2026 Caji Assist. Todos os direitos reservados.
                        </p>
                        <div className="flex items-center gap-3">
                            <Mail
                                className="w-4 h-4"
                                style={{ color: 'hsl(var(--saude-muted-foreground))' }}
                            />
                            <a
                                href="mailto:contact@cajiassist.com"
                                className="text-xs transition-colors hover:opacity-70"
                                style={{ color: 'hsl(var(--saude-foreground))' }}
                            >
                                contact@cajiassist.com
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </motion.footer>
    );
};

export default LPFooter;
