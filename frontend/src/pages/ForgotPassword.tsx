import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import API_CONFIG from '@/config/api';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/api/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send reset email');
            }

            setIsSubmitted(true);
            toast({
                title: "Email enviado",
                description: "Se o email estiver cadastrado, você receberá um link em breve.",
            });

        } catch (error) {
            console.error('Forgot password error:', error);
            toast({
                title: "Erro",
                description: "Ocorreu um erro ao processar sua solicitação.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#f1f4f9] to-[#ffffff] flex items-center justify-center p-4">
                <Card className="w-full max-w-md bg-white/80 backdrop-blur-md shadow-xl border-t-4 border-[#00A947]">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto w-16 h-16 bg-[#00A947]/10 rounded-full flex items-center justify-center mb-4">
                            <Mail className="w-8 h-8 text-[#00A947]" />
                        </div>
                        <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#19B159] to-[#00A947]">
                            Verifique seu Email
                        </CardTitle>
                        <CardDescription className="text-gray-600 mt-2">
                            Enviamos as instruções de recuperação para: <br />
                            <span className="font-semibold text-gray-800">{email}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-gray-500 text-center">
                            Verifique sua caixa de entrada e também a pasta de spam. O link é válido por 1 hora.
                        </p>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3">
                        <Link to="/login" className="w-full">
                            <Button variant="outline" className="w-full border-gray-200 hover:bg-gray-50 text-gray-700">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o Login
                            </Button>
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f1f4f9] to-[#ffffff] flex items-center justify-center p-4">
            <div className="absolute top-0 right-0 p-8 opacity-5">
                <img src="/texto-logo.png" alt="Logo" className="w-64" />
            </div>

            <Card className="w-full max-w-md bg-white/80 backdrop-blur-md shadow-xl border-t-4 border-[#00A947]">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-[#19B159] to-[#00A947]">
                        Recuperar Senha
                    </CardTitle>
                    <CardDescription className="text-center text-gray-500">
                        Digite seu email para receber o link de redefinição
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-700">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-white/50 border-gray-200 focus:border-[#00A947] focus:ring-[#00A947]"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-[#19B159] to-[#00A947] hover:opacity-90 transition-all shadow-md"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                "Enviar Link de Recuperação"
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Link to="/login" className="text-sm font-medium text-gray-500 hover:text-[#00A947] transition-colors flex items-center">
                        <ArrowLeft className="mr-1 h-3 w-3" /> Voltar para o Login
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
};

export default ForgotPassword;
