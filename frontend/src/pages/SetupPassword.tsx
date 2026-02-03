import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader } from "lucide-react";
import API_CONFIG from "@/config/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const SetupPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(true);
    const [isValidToken, setIsValidToken] = useState(false);
    const [showErrors, setShowErrors] = useState(false);

    // Validation States
    const hasMinLength = password.length >= 6;
    const hasUppercase = /[A-Z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasMatch = password === confirmPassword && confirmPassword.length > 0;
    const isPasswordValid = hasMinLength && hasUppercase && hasSpecialChar && hasMatch;

    useEffect(() => {
        if (!token) {
            setVerifying(false);
            return;
        }

        const verify = async () => {
            try {
                setIsValidToken(true);
            } catch (e) {
                setIsValidToken(false);
            } finally {
                setVerifying(false);
            }
        };
        verify();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isPasswordValid) {
            setShowErrors(true);
            toast.error("Por favor, atenda a todos os requisitos da senha");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/api/auth/set-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao definir senha');
            }

            toast.success("Senha definida com sucesso! Você já pode fazer login.");

            if (data.token) {
                localStorage.setItem('token', data.token);
                window.location.href = '/dashboard';
            } else {
                navigate('/login');
            }

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const getRuleColor = (isValid: boolean) => {
        if (isValid) return "text-[#19B159]";
        if (showErrors && !isValid) return "text-red-500"; // Specific rule missing after submit attempt
        return "text-gray-500";
    };

    if (verifying) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader className="animate-spin text-[#19B159]" />
            </div>
        );
    }

    if (!token || !isValidToken) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-red-600">Link Inválido</CardTitle>
                        <CardDescription>O link de ativação é inválido ou expirou.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => navigate('/login')} className="w-full">Voltar para Login</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md shadow-lg border-t-4 border-[#19B159]">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">Definir Senha</CardTitle>
                    <CardDescription className="text-center">Crie uma nova senha para sua conta</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nova Senha</label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="focus-visible:ring-[#19B159] focus-visible:border-[#19B159]"
                            />
                            {/* Password Requirements List */}
                            <ul className="text-sm space-y-1 mt-2">
                                <li className={`flex items-center gap-2 ${getRuleColor(hasUppercase)}`}>
                                    <span className="text-xs transition-colors duration-300">
                                        ● Pelo menos uma letra maiúscula
                                    </span>
                                </li>
                                <li className={`flex items-center gap-2 ${getRuleColor(hasSpecialChar)}`}>
                                    <span className="text-xs transition-colors duration-300">
                                        ● Pelo menos um caractere especial
                                    </span>
                                </li>
                                <li className={`flex items-center gap-2 ${getRuleColor(hasMinLength)}`}>
                                    <span className="text-xs transition-colors duration-300">
                                        ● Mínimo de 6 caracteres
                                    </span>
                                </li>
                                <li className={`flex items-center gap-2 ${getRuleColor(hasMatch)}`}>
                                    <span className="text-xs transition-colors duration-300">
                                        ● As senhas devem ser iguais
                                    </span>
                                </li>
                            </ul>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Confirmar Senha</label>
                            <Input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="focus-visible:ring-[#19B159] focus-visible:border-[#19B159]"
                            />
                        </div>
                        <Button
                            type="submit"
                            className={`w-full transition-colors ${isPasswordValid
                                ? "bg-[#19B159] hover:bg-[#15964b]"
                                : "bg-gray-400 cursor-not-allowed hover:bg-gray-500"
                                }`}
                            disabled={loading} // Keep disabled logic for loading only to allow clicks for validation feedback?
                        // User asked: "O botão de confirmar deve ficar bloquado... e deve ficar cinza no início... e vermelho na regra específica... se ele clicar"
                        // If I disable it with 'disabled', onClick won't fire.
                        // So I should NOT disable it for validation failure, only style it as such.
                        // But for loading state, actual disable is fine.
                        >
                            {loading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {loading ? "Salvando..." : "Criar Senha e Entrar"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default SetupPassword;
