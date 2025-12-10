import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/config/firebase";
import { toast } from "sonner";
import { AnimatedCharactersLogin } from "@/components/ui/animated-characters-login";

const Login = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (email: string, password: string) => {
        setError("");
        setIsLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            toast.success("Login realizado com sucesso!");
            navigate("/dashboard");
        } catch (err: any) {
            console.error("Login error:", err);
            let errorMessage = "Erro ao realizar login. Verifique suas credenciais.";

            if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                errorMessage = "Email ou senha incorretos.";
            } else if (err.code === 'auth/too-many-requests') {
                errorMessage = "Muitas tentativas falhas. Tente novamente mais tarde.";
            }

            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatedCharactersLogin
            onSubmit={handleLogin}
            isLoading={isLoading}
            error={error}
            brandName="Factoria"
            brandLogo="/logo-header.png"
        />
    );
};

export default Login;
