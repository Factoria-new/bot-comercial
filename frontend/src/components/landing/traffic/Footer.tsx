import { Github, Twitter, Linkedin, Instagram } from "lucide-react";

export const Footer = () => {
    return (
        <footer className="bg-lp-background border-t border-lp-border/20 pt-16 pb-8">
            <div className="container px-4 md:px-6">
                <div className="grid md:grid-cols-4 gap-12 mb-12">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-lp-accent/20 flex items-center justify-center text-lp-accent font-bold">
                                C
                            </div>
                            <span className="text-xl font-bold text-white font-display">Caji Assist</span>
                        </div>
                        <p className="text-sm text-lp-muted-foreground">
                            Automação inteligente para transformar conversas em vendas.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-4">Produto</h4>
                        <ul className="space-y-2 text-sm text-lp-muted-foreground">
                            <li><a href="#" className="hover:text-lp-accent transition-colors">Features</a></li>
                            <li><a href="#" className="hover:text-lp-accent transition-colors">Preços</a></li>
                            <li><a href="#" className="hover:text-lp-accent transition-colors">Integrações</a></li>
                            <li><a href="#" className="hover:text-lp-accent transition-colors">Roadmap</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-4">Empresa</h4>
                        <ul className="space-y-2 text-sm text-lp-muted-foreground">
                            <li><a href="#" className="hover:text-lp-accent transition-colors">Sobre</a></li>
                            <li><a href="#" className="hover:text-lp-accent transition-colors">Blog</a></li>
                            <li><a href="#" className="hover:text-lp-accent transition-colors">Carreiras</a></li>
                            <li><a href="#" className="hover:text-lp-accent transition-colors">Contato</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-4">Legal</h4>
                        <ul className="space-y-2 text-sm text-lp-muted-foreground">
                            <li><a href="#" className="hover:text-lp-accent transition-colors">Privacidade</a></li>
                            <li><a href="#" className="hover:text-lp-accent transition-colors">Termos</a></li>
                            <li><a href="#" className="hover:text-lp-accent transition-colors">Segurança</a></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-lp-border/10 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-lp-muted-foreground">
                        © 2024 Caji Assist. Todos os direitos reservados.
                    </p>
                    <div className="flex items-center gap-4">
                        <a href="#" className="text-lp-muted-foreground hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
                        <a href="#" className="text-lp-muted-foreground hover:text-white transition-colors"><Github className="w-5 h-5" /></a>
                        <a href="#" className="text-lp-muted-foreground hover:text-white transition-colors"><Linkedin className="w-5 h-5" /></a>
                        <a href="#" className="text-lp-muted-foreground hover:text-white transition-colors"><Instagram className="w-5 h-5" /></a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
