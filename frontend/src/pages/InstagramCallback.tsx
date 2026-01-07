import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, X, Loader2 } from 'lucide-react';

const InstagramCallback = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Processando conexão...');

    useEffect(() => {
        const processCallback = async () => {
            try {
                // Get the connection ID from URL params
                const connectionId = searchParams.get('connectedAccountId') || searchParams.get('id');

                if (!connectionId) {
                    // If no connection ID, the auth was likely successful
                    // The Composio backend handles the connection automatically
                    setStatus('success');
                    setMessage('Instagram conectado com sucesso!');

                    // Close window and notify parent after delay
                    setTimeout(() => {
                        if (window.opener) {
                            window.opener.postMessage({ type: 'instagram-connected', success: true }, '*');
                        }
                        window.close();
                    }, 2000);
                    return;
                }

                // If we have a connection ID, confirm it with the backend
                const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3003';
                const response = await fetch(`${backendUrl}/api/instagram/callback`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ connectionId })
                });

                const data = await response.json();

                if (data.success) {
                    setStatus('success');
                    setMessage(`Instagram conectado: @${data.username || 'conta verificada'}`);

                    // Notify parent window and close
                    setTimeout(() => {
                        if (window.opener) {
                            window.opener.postMessage({ type: 'instagram-connected', success: true, username: data.username }, '*');
                        }
                        window.close();
                    }, 2000);
                } else {
                    throw new Error(data.error || 'Falha na conexão');
                }
            } catch (error) {
                console.error('Instagram callback error:', error);
                setStatus('error');
                setMessage(error instanceof Error ? error.message : 'Erro ao processar conexão');
            }
        };

        processCallback();
    }, [searchParams]);

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-md w-full text-center"
            >
                {status === 'loading' && (
                    <>
                        <Loader2 className="w-16 h-16 text-pink-500 animate-spin mx-auto mb-6" />
                        <h1 className="text-2xl font-bold text-white mb-2">Conectando...</h1>
                        <p className="text-white/60">{message}</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Check className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Sucesso!</h1>
                        <p className="text-white/60">{message}</p>
                        <p className="text-white/40 text-sm mt-4">Esta janela fechará automaticamente...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <X className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Erro</h1>
                        <p className="text-white/60 mb-6">{message}</p>
                        <button
                            onClick={() => window.close()}
                            className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                        >
                            Fechar
                        </button>
                    </>
                )}
            </motion.div>
        </div>
    );
};

export default InstagramCallback;
