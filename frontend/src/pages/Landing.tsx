import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Landing = () => {
    return (
        <div className="min-h-screen flex flex-col bg-white">
            {/* Header */}
            <header className="w-full py-6 px-4 md:px-8 border-b border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 relative">
                        <img
                            src="/bora-logo.png"
                            alt="Bora Logo"
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <span className="text-xl font-bold text-bora-blue-900">Bora Expandir</span>
                </div>
                <Link to="/login">
                    <Button variant="outline" className="border-bora-blue text-bora-blue hover:bg-bora-blue-50">
                        Entrar
                    </Button>
                </Link>
            </header>

            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center justify-center px-4 text-center max-w-4xl mx-auto w-full py-12 md:py-24">
                <div className="space-y-6 animate-fade-in">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900">
                        Automatize seu atendimento com <span className="text-bora-blue">Inteligência</span>
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Gerencie múltiplos atendimentos, automatize respostas e escale seu negócio com nossa plataforma de bot para WhatsApp.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                        <Link to="/login">
                            <Button size="lg" className="bg-bora-blue hover:bg-bora-blue-600 text-white px-8 text-lg h-12 shadow-lg shadow-bora-blue/20">
                                Começar Agora
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Features Preview (Optional visual element) */}
                <div className="mt-16 w-full max-w-5xl bg-gray-50 rounded-xl border border-gray-200 p-4 shadow-sm animate-fade-in animation-delay-300">
                    <div className="aspect-video bg-white rounded-lg border border-gray-100 flex items-center justify-center text-gray-400">
                        <p>Preview da Dashboard</p>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-8 text-center text-sm text-gray-500 border-t border-gray-100">
                <p>&copy; {new Date().getFullYear()} Bora Expandir. Todos os direitos reservados.</p>
            </footer>
        </div>
    );
};

export default Landing;
