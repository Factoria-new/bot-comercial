import { MessageCircle, Mail, MapPin, Twitter, Linkedin, Github } from 'lucide-react';

export default function Footer() {
    const footerLinks = {
        product: [
            { label: 'Funcionalidades', href: '#features' },
            { label: 'Produtos', href: '#produto' },
            { label: 'Preços', href: '#pricing' }
        ],
        company: [
            { label: 'Sobre Nós', href: '#sobre' }
        ],
        resources: [
            { label: 'Documentação', href: '#' },
            { label: 'Central de Ajuda', href: '#' },
            { label: 'Contato', href: '#' }
        ],
        legal: [
            { label: 'Política de Privacidade', href: '#' },
            { label: 'Termos de Serviço', href: '#' },
            { label: 'LGPD', href: '#' }
        ]
    };

    return (
        <footer className="bg-slate-50 border-t border-border">
            <div className="container mx-auto px-4 xl:px-8 py-12 xl:py-16">
                <div className="grid grid-cols-1 xl:grid-cols-6 gap-8 xl:gap-12 mb-12">
                    <div className="xl:col-span-2">
                        <div className="mb-6">
                            <img src="/logo-header.png" alt="Factoria" className="h-8 md:h-10 w-auto object-contain" />
                        </div>
                        <p className="text-slate-600 mb-6 max-w-sm">
                            Transforme seu WhatsApp em uma máquina de vendas com IA. Atendimento automático, agendamentos e métricas em tempo real.
                        </p>
                        <div className="flex gap-4">
                            <a
                                href="#"
                                className="w-10 h-10 rounded-lg bg-white border border-slate-200 hover:bg-[#00A947] group flex items-center justify-center transition-all duration-300 shadow-sm"
                                aria-label="Twitter"
                            >
                                <Twitter className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" />
                            </a>
                            <a
                                href="#"
                                className="w-10 h-10 rounded-lg bg-white border border-slate-200 hover:bg-[#00A947] group flex items-center justify-center transition-all duration-300 shadow-sm"
                                aria-label="LinkedIn"
                            >
                                <Linkedin className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" />
                            </a>
                            <a
                                href="#"
                                className="w-10 h-10 rounded-lg bg-white border border-slate-200 hover:bg-[#00A947] group flex items-center justify-center transition-all duration-300 shadow-sm"
                                aria-label="GitHub"
                            >
                                <Github className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors" />
                            </a>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold text-black mb-4">Produto</h3>
                        <ul className="space-y-3">
                            {footerLinks.product.map((link) => (
                                <li key={link.label}>
                                    <a
                                        href={link.href}
                                        className="text-slate-600 hover:text-[#00A947] transition-colors text-sm"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-black mb-4">Empresa</h3>
                        <ul className="space-y-3">
                            {footerLinks.company.map((link) => (
                                <li key={link.label}>
                                    <a
                                        href={link.href}
                                        className="text-slate-600 hover:text-[#00A947] transition-colors text-sm"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-black mb-4">Recursos</h3>
                        <ul className="space-y-3">
                            {footerLinks.resources.map((link) => (
                                <li key={link.label}>
                                    <a
                                        href={link.href}
                                        className="text-slate-600 hover:text-[#00A947] transition-colors text-sm"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-black mb-4">Legal</h3>
                        <ul className="space-y-3">
                            {footerLinks.legal.map((link) => (
                                <li key={link.label}>
                                    <a
                                        href={link.href}
                                        className="text-slate-600 hover:text-[#00A947] transition-colors text-sm"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="border-t border-border pt-8">
                    <div className="flex flex-col xl:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-slate-600">
                            © 2025 Factoria
                        </p>
                        <div className="flex flex-col xl:flex-row gap-4 xl:gap-6 text-sm text-slate-600">
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                <span>contato@factoria.ai</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MessageCircle className="w-4 h-4" />
                                <span>+55 (11) 99999-9999</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                <span>São Paulo, SP</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
