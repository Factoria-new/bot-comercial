import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

interface HeaderProps {
    phase: 'initial' | 'expanded' | 'playing' | 'ended' | 'reversing';
    onResetHome: (e: React.MouseEvent) => void;
    onNavigate: (e: React.MouseEvent, sectionId: string) => void;
}

export const Header = ({ phase, onResetHome, onNavigate }: HeaderProps) => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Logic for transparency:
    // When phase is 'initial': transparent? No, "bg-white/80" in original code.
    // Original Code:
    // ${phase === 'initial' || (phase === 'ended' && isScrolled)
    // ? 'bg-white/80 backdrop-blur-md shadow-lg border border-gray-100'
    // : 'bg-transparent shadow-none border-transparent'}

    const isOpaque = phase === 'initial' || (phase === 'ended' && isScrolled);

    return (
        <header className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] w-[95%] max-w-6xl py-3 px-4 md:px-6 flex justify-between items-center rounded-2xl transition-all duration-500 ${isOpaque
            ? 'bg-white/80 backdrop-blur-md shadow-lg border border-gray-100'
            : 'bg-transparent shadow-none border-transparent'
            }`}>
            <div className="flex items-center">
                <img src="/logo-header.webp" alt="Caji" width="143" height="56" className="h-8 md:h-10 w-auto object-contain" />
            </div>

            {/* Navegação Central - Desktop */}
            <nav className="hidden md:flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full p-1 shadow-sm">
                <a href="#home" onClick={onResetHome} className="text-gray-700 hover:text-[#00A947] hover:bg-gray-100 transition-all font-medium py-2 px-5 rounded-full cursor-pointer">
                    Home
                </a>
                <a href="#sobre" onClick={(e) => onNavigate(e, 'sobre')} className="text-gray-700 hover:text-[#00A947] hover:bg-gray-100 transition-all font-medium py-2 px-5 rounded-full cursor-pointer">
                    Sobre Nós
                </a>
                <a href="#produto" onClick={(e) => onNavigate(e, 'produto')} className="text-gray-700 hover:text-[#00A947] hover:bg-gray-100 transition-all font-medium py-2 px-5 rounded-full cursor-pointer">
                    Produto
                </a>
                <a href="#pricing" onClick={(e) => onNavigate(e, 'pricing')} className="text-gray-700 hover:text-[#00A947] hover:bg-gray-100 transition-all font-medium py-2 px-5 rounded-full cursor-pointer">
                    Preços
                </a>
            </nav>

            <div className="flex items-center gap-4">
                {/* Botão Entrar - Desktop */}
                <Link to="/login" className="hidden md:block">
                    <Button className="bg-[#00A947] text-white hover:bg-[#00A947]/90 font-semibold px-6 py-2.5 rounded-full shadow-md hover:shadow-lg transition-all">
                        Entrar
                    </Button>
                </Link>

                {/* Hamburger Menu - Mobile */}
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="md:hidden p-2 text-gray-700 hover:text-[#00A947] transition-colors"
                >
                    {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 flex flex-col gap-2 md:hidden animate-in fade-in slide-in-from-top-4 duration-300">
                    <a
                        href="#home"
                        onClick={(e) => { onResetHome(e); setIsMenuOpen(false); }}
                        className="text-gray-700 hover:text-[#00A947] hover:bg-gray-50 p-4 rounded-xl font-medium transition-all"
                    >
                        Home
                    </a>
                    <a
                        href="#sobre"
                        onClick={(e) => { onNavigate(e, 'sobre'); setIsMenuOpen(false); }}
                        className="text-gray-700 hover:text-[#00A947] hover:bg-gray-50 p-4 rounded-xl font-medium transition-all"
                    >
                        Sobre Nós
                    </a>
                    <a
                        href="#produto"
                        onClick={(e) => { onNavigate(e, 'produto'); setIsMenuOpen(false); }}
                        className="text-gray-700 hover:text-[#00A947] hover:bg-gray-50 p-4 rounded-xl font-medium transition-all"
                    >
                        Produto
                    </a>
                    <a
                        href="#pricing"
                        onClick={(e) => { onNavigate(e, 'pricing'); setIsMenuOpen(false); }}
                        className="text-gray-700 hover:text-[#00A947] hover:bg-gray-50 p-4 rounded-xl font-medium transition-all"
                    >
                        Preços
                    </a>
                    <hr className="my-2 border-gray-100" />
                    <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                        <Button className="w-full bg-[#00A947] text-white font-semibold py-4 rounded-xl">
                            Entrar
                        </Button>
                    </Link>
                </div>
            )}
        </header>
    );
};
