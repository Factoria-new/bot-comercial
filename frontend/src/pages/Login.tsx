import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/config/firebase";
import { toast } from "sonner";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await signInWithEmailAndPassword(auth, email, password);
            toast.success("Login realizado com sucesso!");
            navigate("/dashboard");
        } catch (error: any) {
            console.error("Login error:", error);
            let errorMessage = "Erro ao realizar login. Verifique suas credenciais.";

            if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                errorMessage = "Email ou senha incorretos.";
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = "Muitas tentativas falhas. Tente novamente mais tarde.";
            }

            toast.error(errorMessage);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50 px-4">
            <div className="w-full max-w-md animate-fade-in">
                <div className="mb-4">
                    <a href="/" className="text-sm text-muted-foreground hover:text-bora-blue flex items-center gap-2 transition-colors">
                        ← Voltar para Home
                    </a>
                </div>
                <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
                    <CardHeader className="space-y-1 text-center flex flex-col items-center">
                        <div className="w-64 mb-6 relative">
                            <img
                                src="/texto-logo.png"
                                alt="Bora Logo"
                                className="w-full h-auto object-contain"
                            />
                        </div>
                        <CardTitle className="text-2xl font-bold tracking-tight text-bora-blue-900">
                            Bem-vindo de volta
                        </CardTitle>
                        <CardDescription>
                            Entre com suas credenciais para acessar a plataforma
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="seu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="bg-white"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Senha</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-white"
                                    required
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full bg-bora-blue hover:bg-bora-blue-600 text-white transition-all duration-200 shadow-lg shadow-bora-blue/20"
                            >
                                Entrar
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-2 text-center text-sm text-muted-foreground">
                        <a href="#" className="hover:text-bora-blue transition-colors">
                            Esqueceu sua senha?
                        </a>
                    </CardFooter>
                </Card>

                <div className="mt-8 text-center text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} Bora Expandir. Todos os direitos reservados.</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
