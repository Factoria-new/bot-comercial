import { Mail, Linkedin, Instagram, Stethoscope } from 'lucide-react';

/**
 * LPFooter - Saude Landing Page
 * ISOLATED from main site design system.
 * Uses --saude-* CSS variables.
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
                                style={{ backgroundColor: 'hsl(var(--saude-primary))' }}
                            >
                                <Stethoscope className="w-5 h-5 text-white" />
                            </div>
                            <span
                                className="text-xl font-bold font-display"
                                style={{ color: 'hsl(var(--saude-foreground))' }}
                            >
                                Saude Assist
                            </span>
                        </div>
                        <p
                            className="max-w-sm leading-relaxed"
                            style={{ color: 'hsl(var(--saude-muted-foreground))' }}
                        >
                            Transforme seu WhatsApp em uma maquina de vendas com IA. Atendimento automatico, agendamentos e metricas em tempo real.
                        </p>
                        <div className="flex gap-4">
                            <a
                                href="https://www.instagram.com/cajisolutionsofc/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 shadow-sm group"
                                style={{
                                    backgroundColor: 'hsl(var(--saude-card))',
                                    border: '1px solid hsl(var(--saude-border))'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'hsl(var(--saude-primary))';
                                    e.currentTarget.style.borderColor = 'hsl(var(--saude-primary))';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'hsl(var(--saude-card))';
                                    e.currentTarget.style.borderColor = 'hsl(var(--saude-border))';
                                }}
                                aria-label="Instagram"
                            >
                                <Instagram
                                    className="w-5 h-5 transition-colors"
                                    style={{ color: 'hsl(var(--saude-muted-foreground))' }}
                                />
                            </a>
                            <a
                                href="https://www.linkedin.com/company/caji-solutions"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 shadow-sm group"
                                style={{
                                    backgroundColor: 'hsl(var(--saude-card))',
                                    border: '1px solid hsl(var(--saude-border))'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'hsl(var(--saude-secondary))';
                                    e.currentTarget.style.borderColor = 'hsl(var(--saude-secondary))';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'hsl(var(--saude-card))';
                                    e.currentTarget.style.borderColor = 'hsl(var(--saude-border))';
                                }}
                                aria-label="LinkedIn"
                            >
                                <Linkedin
                                    className="w-5 h-5 transition-colors"
                                    style={{ color: 'hsl(var(--saude-muted-foreground))' }}
                                />
                            </a>
                        </div>
                    </div>

                    <div>
                        <h3
                            className="font-bold mb-6 uppercase tracking-wider text-xs"
                            style={{ color: 'hsl(var(--saude-foreground))' }}
                        >
                            Produto
                        </h3>
                        <ul className="space-y-4">
                            {footerLinks.product.map((link) => (
                                <li key={link.label}>
                                    <a
                                        href={link.href}
                                        className="text-sm font-medium transition-colors"
                                        style={{ color: 'hsl(var(--saude-muted-foreground))' }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.color = 'hsl(var(--saude-primary))';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.color = 'hsl(var(--saude-muted-foreground))';
                                        }}
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
                            style={{ color: 'hsl(var(--saude-foreground))' }}
                        >
                            Empresa
                        </h3>
                        <ul className="space-y-4">
                            {footerLinks.company.map((link) => (
                                <li key={link.label}>
                                    <a
                                        href={link.href}
                                        className="text-sm font-medium transition-colors"
                                        style={{ color: 'hsl(var(--saude-muted-foreground))' }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.color = 'hsl(var(--saude-primary))';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.color = 'hsl(var(--saude-muted-foreground))';
                                        }}
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
                            style={{ color: 'hsl(var(--saude-foreground))' }}
                        >
                            Legal
                        </h3>
                        <ul className="space-y-4">
                            {footerLinks.legal.map((link) => (
                                <li key={link.label}>
                                    <a
                                        href={link.href}
                                        className="text-sm font-medium transition-colors"
                                        style={{ color: 'hsl(var(--saude-muted-foreground))' }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.color = 'hsl(var(--saude-primary))';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.color = 'hsl(var(--saude-muted-foreground))';
                                        }}
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
                            className="text-xs font-medium"
                            style={{ color: 'hsl(var(--saude-muted-foreground))' }}
                        >
                            2026 Caji Assist. Todos os direitos reservados.
                        </p>
                        <div className="flex items-center gap-3">
                            <Mail
                                className="w-4 h-4"
                                style={{ color: 'hsl(var(--saude-primary))' }}
                            />
                            <a
                                href="mailto:contact@cajiassist.com"
                                className="text-xs font-medium transition-colors"
                                style={{ color: 'hsl(var(--saude-muted-foreground))' }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.color = 'hsl(var(--saude-primary))';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.color = 'hsl(var(--saude-muted-foreground))';
                                }}
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
