import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface HeaderProps {
    phase: 'initial' | 'expanded' | 'playing' | 'ended' | 'reversing';
    onResetHome: (e: React.MouseEvent) => void;
    onNavigate: (e: React.MouseEvent, sectionId: string) => void;
}

export const Header = ({ phase, onResetHome, onNavigate }: HeaderProps) => {
    const [isScrolled, setIsScrolled] = useState(false);

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
        <header className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-6xl py-3 px-6 flex justify-between items-center rounded-2xl transition-all duration-500 ${isOpaque
            ? 'bg-white/80 backdrop-blur-md shadow-lg border border-gray-100'
            : 'bg-transparent shadow-none border-transparent'
            }`}>
            <img src="/logo-header.png" alt="Caji" className="h-8 md:h-10 w-auto object-contain" />

            {/* Navegação Central - mantém o fundo pill sempre */}
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

            <Link to="/login">
                <Button className="bg-[#00A947] text-white hover:bg-[#00A947]/90 font-semibold px-6 py-2.5 rounded-full shadow-md hover:shadow-lg transition-all">
                    Entrar
                </Button>
            </Link>
        </header>
    );
};
