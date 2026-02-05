import { Mail, Linkedin, Instagram } from 'lucide-react';

export const LPFooter = () => {
    const footerLinks = {
        product: [
            { label: 'Funcionalidades', href: '#features' },
            { label: 'Produtos', href: '#produto' },
            { label: 'Preços', href: '#pricing' }
        ],
        company: [
            { label: 'Sobre Nós', href: '#sobre' }
        ],
        legal: [
            { label: 'Política de Privacidade', href: '/politica-de-privacidade' },
            { label: 'Termos de Serviço', href: '/termos-de-servico' },
            { label: 'LGPD', href: '/lgpd' }
        ]
    };

    return (
        <footer className="bg-lp-background border-t border-white/5 py-12 md:py-16">
            <div className="container mx-auto px-4 md:px-8">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-12">
                    <div className="md:col-span-2 space-y-6">
                        <div className="flex flex-col gap-4">
                            <img src="/logo-header-light.png" alt="Caji" className="h-8 md:h-10 w-auto object-contain self-start" />
                        </div>
                        <p className="text-lp-muted-foreground max-w-sm leading-relaxed">
                            Transforme seu WhatsApp em uma máquina de vendas com IA. Atendimento automático, agendamentos e métricas em tempo real.
                        </p>
                        <div className="flex gap-4">
                            <a
                                href="https://www.instagram.com/cajisolutionsofc/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-lg bg-lp-card/50 border border-white/10 hover:bg-lp-accent group flex items-center justify-center transition-all duration-300 shadow-sm"
                                aria-label="Instagram"
                            >
                                <Instagram className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
                            </a>
                            <a
                                href="https://www.linkedin.com/company/caji-solutions"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-lg bg-lp-card/50 border border-white/10 hover:bg-lp-accent group flex items-center justify-center transition-all duration-300 shadow-sm"
                                aria-label="LinkedIn"
                            >
                                <Linkedin className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
                            </a>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-bold text-white mb-6 uppercase tracking-wider text-xs">Produto</h3>
                        <ul className="space-y-4">
                            {footerLinks.product.map((link) => (
                                <li key={link.label}>
                                    <a
                                        href={link.href}
                                        className="text-lp-muted-foreground hover:text-lp-accent transition-colors text-sm font-medium"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-bold text-white mb-6 uppercase tracking-wider text-xs">Empresa</h3>
                        <ul className="space-y-4">
                            {footerLinks.company.map((link) => (
                                <li key={link.label}>
                                    <a
                                        href={link.href}
                                        className="text-lp-muted-foreground hover:text-lp-accent transition-colors text-sm font-medium"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-bold text-white mb-6 uppercase tracking-wider text-xs">Legal</h3>
                        <ul className="space-y-4">
                            {footerLinks.legal.map((link) => (
                                <li key={link.label}>
                                    <a
                                        href={link.href}
                                        className="text-lp-muted-foreground hover:text-lp-accent transition-colors text-sm font-medium"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/5 pt-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <p className="text-xs text-lp-muted-foreground font-medium">
                            © 2026 Caji Assist. Todos os direitos reservados.
                        </p>
                        <div className="flex items-center gap-3">
                            <Mail className="w-4 h-4 text-lp-accent" />
                            <a
                                href="mailto:contact@cajiassist.com"
                                className="text-xs text-lp-muted-foreground hover:text-lp-accent transition-colors font-medium"
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
