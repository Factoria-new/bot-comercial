import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { motion } from "framer-motion";

const CheckoutSuccess = () => {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        // Após um pequeno delay, mostrar sucesso
        // O webhook já processou o pagamento no backend
        const timer = setTimeout(() => {
            if (sessionId) {
                setStatus('success');
                setMessage('Seu pagamento foi confirmado e sua conta está sendo ativada!');
            } else {
                setStatus('error');
                setMessage('Sessão de pagamento não encontrada.');
            }
        }, 1500);

        return () => clearTimeout(timer);
    }, [sessionId]);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-8 md:p-12 border border-slate-200 shadow-lg max-w-md w-full text-center"
            >
                {status === 'loading' && (
                    <>
                        <Loader2 className="h-16 w-16 text-[#00A947] mx-auto mb-6 animate-spin" />
                        <h1 className="text-2xl font-bold mb-4">Verificando pagamento...</h1>
                        <p className="text-slate-600">Aguarde enquanto confirmamos seu pagamento.</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        >
                            <CheckCircle className="h-20 w-20 text-[#00A947] mx-auto mb-6" />
                        </motion.div>
                        <h1 className="text-2xl font-bold mb-4 text-[#00A947]">Pagamento Confirmado!</h1>
                        <p className="text-slate-600 mb-8">{message}</p>

                        <div className="bg-slate-50 rounded-xl p-4 mb-6">
                            <p className="text-sm text-slate-500 mb-2">Próximos passos:</p>
                            <ol className="text-left text-sm text-slate-600 space-y-2">
                                <li className="flex items-start gap-2">
                                    <span className="bg-[#00A947] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                                    <span>Verifique seu e-mail para ativar sua conta</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="bg-[#00A947] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                                    <span>Defina sua senha de acesso</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="bg-[#00A947] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0">3</span>
                                    <span>Configure seu bot de WhatsApp</span>
                                </li>
                            </ol>
                        </div>

                        <Link to="/login">
                            <Button className="w-full bg-[#00A947] hover:bg-[#00A947]/90 text-white font-semibold py-6 text-lg rounded-xl">
                                Ir para Login
                            </Button>
                        </Link>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
                        <h1 className="text-2xl font-bold mb-4 text-red-500">Algo deu errado</h1>
                        <p className="text-slate-600 mb-8">{message}</p>

                        <Link to="/#pricing">
                            <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-6 text-lg rounded-xl">
                                Voltar para Planos
                            </Button>
                        </Link>
                    </>
                )}
            </motion.div>
        </div>
    );
};

export default CheckoutSuccess;
