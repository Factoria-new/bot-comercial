import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

const CheckEmail = () => {
    const [searchParams] = useSearchParams();
    // const sessionId = searchParams.get('session_id');

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-center items-center p-4 relative">
            <Link to="/" className="absolute top-8 left-8 inline-flex items-center text-slate-600 hover:text-[#00A947] transition-colors">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Home
            </Link>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl p-8 border border-slate-200 shadow-lg max-w-md w-full text-center"
            >
                <div className="w-20 h-20 bg-[#00A947]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Mail className="h-10 w-10 text-[#00A947]" />
                </div>

                <h1 className="text-3xl font-bold mb-4 text-slate-900">Verifique seu E-mail</h1>

                <p className="text-slate-600 mb-8">
                    Seu pagamento foi processado com sucesso! <br />
                    Enviamos um e-mail com as instruções de acesso e um link para definir sua senha.
                </p>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-8 text-sm text-slate-500">
                    <div className="flex items-center justify-center gap-2 mb-2 font-medium text-slate-700">
                        <CheckCircle className="h-4 w-4 text-[#00A947]" /> Pagamento Confirmado
                    </div>
                </div>

                <Link to="/login">
                    <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-6 text-lg rounded-xl">
                        Ir para Login
                    </Button>
                </Link>
            </motion.div>
        </div>
    );
};

export default CheckEmail;
