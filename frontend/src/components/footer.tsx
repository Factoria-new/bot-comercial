import { MessageCircle, Mail, MapPin, Twitter, Linkedin, Github } from 'lucide-react';

export default function Footer() {
    const footerLinks = {
        product: [
            { label: 'Features', href: '#features' },
            { label: 'Products', href: '#products' },
            { label: 'Pricing', href: '#pricing' },
            { label: 'API', href: '#' }
        ],
        company: [
            { label: 'About Us', href: '#about' },
            { label: 'Careers', href: '#' },
            { label: 'Blog', href: '#' },
            { label: 'Press Kit', href: '#' }
        ],
        resources: [
            { label: 'Documentation', href: '#' },
            { label: 'Help Center', href: '#' },
            { label: 'Community', href: '#' },
            { label: 'Contact', href: '#' }
        ],
        legal: [
            { label: 'Privacy Policy', href: '#' },
            { label: 'Terms of Service', href: '#' },
            { label: 'Cookie Policy', href: '#' },
            { label: 'GDPR', href: '#' }
        ]
    };

    return (
        <footer className="bg-slate-50 border-t border-border">
            <div className="container mx-auto px-4 xl:px-8 py-12 xl:py-16">
                <div className="grid grid-cols-1 xl:grid-cols-6 gap-8 xl:gap-12 mb-12">
                    <div className="xl:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                                <span className="text-white font-bold text-xl">F</span>
                            </div>
                            <span className="text-xl font-bold text-foreground">Factoria</span>
                        </div>
                        <p className="text-slate-600 mb-6 max-w-sm">
                            Transform your WhatsApp into an intelligent AI assistant. Automate conversations and scale your business effortlessly.
                        </p>
                        <div className="flex gap-4">
                            <a
                                href="#"
                                className="w-10 h-10 rounded-lg bg-secondary hover:bg-slate-200 flex items-center justify-center transition-colors"
                                aria-label="Twitter"
                            >
                                <Twitter className="w-5 h-5 text-slate-600" />
                            </a>
                            <a
                                href="#"
                                className="w-10 h-10 rounded-lg bg-secondary hover:bg-slate-200 flex items-center justify-center transition-colors"
                                aria-label="LinkedIn"
                            >
                                <Linkedin className="w-5 h-5 text-slate-600" />
                            </a>
                            <a
                                href="#"
                                className="w-10 h-10 rounded-lg bg-secondary hover:bg-slate-200 flex items-center justify-center transition-colors"
                                aria-label="GitHub"
                            >
                                <Github className="w-5 h-5 text-slate-600" />
                            </a>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold text-foreground mb-4">Product</h3>
                        <ul className="space-y-3">
                            {footerLinks.product.map((link) => (
                                <li key={link.label}>
                                    <a
                                        href={link.href}
                                        className="text-slate-600 hover:text-orange transition-colors text-sm"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-foreground mb-4">Company</h3>
                        <ul className="space-y-3">
                            {footerLinks.company.map((link) => (
                                <li key={link.label}>
                                    <a
                                        href={link.href}
                                        className="text-slate-600 hover:text-orange transition-colors text-sm"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-foreground mb-4">Resources</h3>
                        <ul className="space-y-3">
                            {footerLinks.resources.map((link) => (
                                <li key={link.label}>
                                    <a
                                        href={link.href}
                                        className="text-slate-600 hover:text-orange transition-colors text-sm"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-foreground mb-4">Legal</h3>
                        <ul className="space-y-3">
                            {footerLinks.legal.map((link) => (
                                <li key={link.label}>
                                    <a
                                        href={link.href}
                                        className="text-slate-600 hover:text-orange transition-colors text-sm"
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
                            2025 Factoria
                        </p>
                        <div className="flex flex-col xl:flex-row gap-4 xl:gap-6 text-sm text-slate-600">
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                <span>contact@factoria.ai</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MessageCircle className="w-4 h-4" />
                                <span>+1 (555) 123-4567</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                <span>San Francisco, CA</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
