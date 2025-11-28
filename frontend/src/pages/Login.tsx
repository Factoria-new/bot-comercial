import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Placeholder for login logic
        console.log("Login attempt with:", email, password);
        navigate("/dashboard");
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50 px-4">
            <div className="w-full max-w-md animate-fade-in">
                <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
                    <CardHeader className="space-y-1 text-center flex flex-col items-center">
                        <div className="w-16 h-16 mb-4 relative">
                            <img
                                src="/bora-logo.png"
                                alt="Bora Logo"
                                className="w-full h-full object-contain"
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
