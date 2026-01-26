import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const SimpleHeader = () => {
    return (
        <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-6xl py-3 px-6 flex justify-between items-center rounded-2xl bg-white/80 backdrop-blur-md shadow-lg border border-gray-100">
            <Link to="/">
                <img src="/logo-header.png" alt="Caji" className="h-8 md:h-10 w-auto object-contain" />
            </Link>

            <nav className="hidden md:flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full p-1 shadow-sm">
                <Link to="/" className="text-gray-700 hover:text-[#00A947] hover:bg-gray-100 transition-all font-medium py-2 px-5 rounded-full">
                    Home
                </Link>
                <Link to="/#sobre" className="text-gray-700 hover:text-[#00A947] hover:bg-gray-100 transition-all font-medium py-2 px-5 rounded-full">
                    Sobre Nós
                </Link>
                <Link to="/#produto" className="text-gray-700 hover:text-[#00A947] hover:bg-gray-100 transition-all font-medium py-2 px-5 rounded-full">
                    Produto
                </Link>
                <Link to="/#pricing" className="text-gray-700 hover:text-[#00A947] hover:bg-gray-100 transition-all font-medium py-2 px-5 rounded-full">
                    Preços
                </Link>
            </nav>

            <Link to="/login">
                <Button className="bg-[#00A947] text-white hover:bg-[#00A947]/90 font-semibold px-6 py-2.5 rounded-full shadow-md hover:shadow-lg transition-all">
                    Entrar
                </Button>
            </Link>
        </header>
    );
};
