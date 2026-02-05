import { Mail, Linkedin, Instagram, Sparkles } from 'lucide-react';

/**
 * LPFooter - Varejo Landing Page
 * ISOLATED dark luxury theme
 * Uses --varejo-* CSS variables
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
        <footer
            className="py-12 md:py-16"
            style={{
                backgroundColor: 'hsl(var(--varejo-card))',
                borderTop: '1px solid hsl(var(--varejo-border))'
            }}
        >
            <div className="container mx-auto px-4 md:px-8">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-12">
                    <div className="md:col-span-2 space-y-6">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ background: 'var(--varejo-gradient-primary)' }}
                            >
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <span
                                className="text-xl font-bold font-display uppercase tracking-wide"
                                style={{ color: 'hsl(var(--varejo-foreground))' }}
                            >
                                Varejo Assist
                            </span>
                        </div>
                        <p
                            className="max-w-sm leading-relaxed"
                            style={{ color: 'hsl(var(--varejo-muted-foreground))' }}
                        >
                            Transforme seu WhatsApp em uma maquina de vendas com IA. Atendimento automatico, catalogo e metricas em tempo real.
                        </p>
                        <div className="flex gap-4">
                            <a
                                href="https://www.instagram.com/cajisolutionsofc/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 shadow-sm group"
                                style={{
                                    backgroundColor: 'hsl(var(--varejo-background))',
                                    border: '1px solid hsl(var(--varejo-border))'
                                }}
                                aria-label="Instagram"
                            >
                                <Instagram
                                    className="w-5 h-5 transition-colors"
                                    style={{ color: 'hsl(var(--varejo-muted-foreground))' }}
                                />
                            </a>
                            <a
                                href="https://www.linkedin.com/company/caji-solutions"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 shadow-sm group"
                                style={{
                                    backgroundColor: 'hsl(var(--varejo-background))',
                                    border: '1px solid hsl(var(--varejo-border))'
                                }}
                                aria-label="LinkedIn"
                            >
                                <Linkedin
                                    className="w-5 h-5 transition-colors"
                                    style={{ color: 'hsl(var(--varejo-muted-foreground))' }}
                                />
                            </a>
                        </div>
                    </div>

                    <div>
                        <h3
                            className="font-bold mb-6 uppercase tracking-wider text-xs"
                            style={{ color: 'hsl(var(--varejo-foreground))' }}
                        >
                            Produto
                        </h3>
                        <ul className="space-y-4">
                            {footerLinks.product.map((link) => (
                                <li key={link.label}>
                                    <a
                                        href={link.href}
                                        className="text-sm font-medium transition-colors"
                                        style={{ color: 'hsl(var(--varejo-muted-foreground))' }}
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3
                            className="font-bold mb-6 uppercase tracking-wider text-xs"
                            style={{ color: 'hsl(var(--varejo-foreground))' }}
                        >
                            Empresa
                        </h3>
                        <ul className="space-y-4">
                            {footerLinks.company.map((link) => (
                                <li key={link.label}>
                                    <a
                                        href={link.href}
                                        className="text-sm font-medium transition-colors"
                                        style={{ color: 'hsl(var(--varejo-muted-foreground))' }}
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3
                            className="font-bold mb-6 uppercase tracking-wider text-xs"
                            style={{ color: 'hsl(var(--varejo-foreground))' }}
                        >
                            Legal
                        </h3>
                        <ul className="space-y-4">
                            {footerLinks.legal.map((link) => (
                                <li key={link.label}>
                                    <a
                                        href={link.href}
                                        className="text-sm font-medium transition-colors"
                                        style={{ color: 'hsl(var(--varejo-muted-foreground))' }}
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
                    style={{ borderTop: '1px solid hsl(var(--varejo-border))' }}
                >
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <p
                            className="text-xs font-medium"
                            style={{ color: 'hsl(var(--varejo-muted-foreground))' }}
                        >
                            2026 Caji Assist. Todos os direitos reservados.
                        </p>
                        <div className="flex items-center gap-3">
                            <Mail
                                className="w-4 h-4"
                                style={{ color: 'hsl(var(--varejo-primary))' }}
                            />
                            <a
                                href="mailto:contact@cajiassist.com"
                                className="text-xs font-medium transition-colors"
                                style={{ color: 'hsl(var(--varejo-muted-foreground))' }}
                            >
                                contact@cajiassist.com
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default LPFooter;
