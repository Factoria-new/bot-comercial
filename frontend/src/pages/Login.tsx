import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { AnimatedCharactersLogin } from "@/components/ui/animated-characters-login";

const Login = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const { login } = useAuth();

    const handleLogin = async (email: string, password: string) => {
        setError("");
        setIsLoading(true);

        try {
            await login(email, password);
            setIsLoading(false);
            setIsSuccess(true);
            toast.success("Login realizado com sucesso!");

            // Delay para mostrar animação de sucesso antes de navegar
            setTimeout(() => {
                navigate("/dashboard");
            }, 1000);
        } catch (err: any) {
            console.error("Login error:", err);
            let errorMessage = err.message || "Erro ao realizar login. Verifique suas credenciais.";

            setError(errorMessage);
            toast.error(errorMessage);
            setIsLoading(false);
        }
    };

    return (
        <AnimatedCharactersLogin
            onSubmit={handleLogin}
            isLoading={isLoading}
            isSuccess={isSuccess}
            error={error}
            brandName="Caji"
            brandLogo="/logo-header.png"
        />
    );
};

export default Login;
