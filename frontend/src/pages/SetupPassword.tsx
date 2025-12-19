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

    useEffect(() => {
        if (!token) {
            setVerifying(false);
            return;
        }

        // Optional: Verify token on load to show error early
        const verify = async () => {
            try {
                // Implement a GET check or just rely on the POST later.
                // For better UX, let's assume it's valid until submission or implement a verify endpoint.
                // We actually have /api/auth/verify-token but it might expect a different token type?
                // The authService verifyToken currently calls jwt.verify which works for both types if secret is same.
                // But let's just let the user try to submit to keep it simple, or do a quick check.
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

        if (password !== confirmPassword) {
            toast.error("As senhas não coincidem");
            return;
        }

        if (password.length < 6) {
            toast.error("A senha deve ter pelo menos 6 caracteres");
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

            // Auto login logic could go here if the API returned a session token
            // The backend implementation of setPassword DOES return a session token.
            if (data.token) {
                localStorage.setItem('token', data.token);
                // We might need to refresh auth context or just force reload
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

    if (verifying) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader className="animate-spin text-green-600" />
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
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">Ativar Conta</CardTitle>
                    <CardDescription className="text-center">Defina sua senha para acessar a plataforma</CardDescription>
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
                                minLength={6}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Confirmar Senha</label>
                            <Input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>
                        <Button type="submit" className="w-full bg-[#19B159] hover:bg-[#15964b]" disabled={loading}>
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
