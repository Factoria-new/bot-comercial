import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, CreditCard, Wallet } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

const Payment = () => {
    const location = useLocation();
    const { plan, period, price } = location.state || {};
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("stripe");

    if (!plan) {
        return (
            <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold mb-4">Plano não selecionado</h1>
                <p className="mb-8 text-slate-600">Por favor, selecione um plano na página inicial.</p>
                <Link to="/">
                    <Button className="bg-[#00A947] hover:bg-[#00A947]/90 text-white">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Home
                    </Button>
                </Link>
            </div>
        );
    }

    const planName = plan === 'basic' ? 'Básico' : 'Pro';
    const periodName = period === 'monthly' ? 'Mensal' : period === 'semiannual' ? 'Semestral' : 'Anual';

    const handlePayment = async () => {
        if (!email) {
            toast.error("Por favor, preencha seu e-mail.");
            return;
        }
        setIsLoading(true);

        try {
            const endpoint = paymentMethod === 'mercadopago'
                ? '/api/mercadopago/create-preference'
                : '/api/stripe/create-checkout-session';

            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3003'}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    plan,
                    period,
                    price, // Required for Mercado Pago dynamically, ignored by Stripe controller
                    title: `Plano ${planName} - ${periodName}` // Optional specifically for MP display
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao criar sessão de pagamento');
            }

            // Mercado Pago returns init_point, Stripe returns url
            const redirectUrl = data.url || data.init_point || data.sandbox_init_point;

            if (redirectUrl) {
                window.location.href = redirectUrl;
            } else {
                throw new Error('URL de pagamento não retornada');
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro ao iniciar pagamento. Tente novamente.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-[#00A947] selection:text-white flex flex-col justify-center relative">
            <Link to="/" className="absolute top-8 left-8 inline-flex items-center text-slate-600 hover:text-[#00A947] transition-colors">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Link>

            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
                    {/* Resumo do Pedido */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white rounded-2xl p-8 border border-slate-200 shadow-lg"
                    >
                        <h2 className="text-2xl font-bold mb-6 text-slate-900">Resumo do Pedido</h2>

                        <div className="flex justify-between items-center py-4 border-b border-slate-100">
                            <div>
                                <h3 className="font-semibold text-lg text-slate-800">Plano {planName}</h3>
                                <p className="text-slate-500 text-sm">Ciclo {periodName}</p>
                            </div>
                            <div className="text-xl font-bold text-[#00A947]">
                                {price}
                            </div>
                        </div>

                        <div className="mt-6 space-y-3">
                            <h4 className="font-medium text-slate-700">O que está incluído:</h4>
                            <ul className="space-y-2 text-sm text-slate-600">
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#00A947]" />
                                    Bot de WhatsApp
                                </li>
                                {plan === 'pro' && (
                                    <>
                                        <li className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#00A947]" />
                                            Google Calendar
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#00A947]" />
                                            TTS (Áudio)
                                        </li>
                                    </>
                                )}
                            </ul>
                        </div>
                    </motion.div>

                    {/* Área de Pagamento / Checkout */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-2xl p-8 border border-slate-200 shadow-lg flex flex-col justify-start text-left min-h-[400px]"
                    >
                        <h3 className="text-xl font-semibold mb-6 text-slate-900">Dados da Conta</h3>

                        <div className="space-y-4 mb-8">
                            <div className="space-y-2">
                                <Label className="text-slate-700">Forma de Pagamento</Label>
                                <RadioGroup defaultValue="stripe" value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-2 gap-4">
                                    <div>
                                        <RadioGroupItem value="stripe" id="stripe" className="peer sr-only" />
                                        <Label
                                            htmlFor="stripe"
                                            className="flex flex-col items-center justify-between rounded-xl border-2 border-slate-200 bg-white p-4 hover:bg-slate-50 hover:border-[#00A947]/50 peer-data-[state=checked]:border-[#00A947] peer-data-[state=checked]:bg-[#00A947]/5 cursor-pointer transition-all"
                                        >
                                            <CreditCard className="mb-3 h-6 w-6 text-slate-700 peer-data-[state=checked]:text-[#00A947]" />
                                            <span className="font-semibold text-slate-700">Stripe</span>
                                        </Label>
                                    </div>
                                    <div>
                                        <RadioGroupItem value="mercadopago" id="mercadopago" className="peer sr-only" />
                                        <Label
                                            htmlFor="mercadopago"
                                            className="flex flex-col items-center justify-between rounded-xl border-2 border-slate-200 bg-white p-4 hover:bg-slate-50 hover:border-[#00BCFF]/50 peer-data-[state=checked]:border-[#00BCFF] peer-data-[state=checked]:bg-[#00BCFF]/5 cursor-pointer transition-all"
                                        >
                                            <Wallet className="mb-3 h-6 w-6 text-slate-700 peer-data-[state=checked]:text-[#00BCFF]" />
                                            <span className="font-semibold text-slate-700">Mercado Pago</span>
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-700">Seu melhor e-mail</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="exemplo@empresa.com"
                                    className="bg-slate-50 border-slate-200 focus:border-[#00A947] focus:ring-[#00A947]"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <p className="text-xs text-slate-500">
                                    Usaremos este e-mail para criar sua conta e enviar acesso.
                                </p>
                            </div>
                        </div>

                        <div className="mt-auto pt-6 border-t border-slate-100 flex flex-col items-center">
                            <Button
                                className={`w-full text-white font-semibold py-6 text-lg rounded-xl shadow-md hover:shadow-lg transition-all ${paymentMethod === 'mercadopago'
                                        ? 'bg-[#00BCFF] hover:bg-[#00BCFF]/90'
                                        : 'bg-[#00A947] hover:bg-[#00A947]/90'
                                    }`}
                                onClick={handlePayment}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <div className="flex items-center">
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processando...
                                    </div>
                                ) : (
                                    `Ir para Pagamento com ${paymentMethod === 'mercadopago' ? 'Mercado Pago' : 'Stripe'}`
                                )}
                            </Button>

                            <div className="flex items-center gap-2 mt-4 text-slate-400 text-sm">
                                <span>🔒 Ambiente Seguro</span>
                                <span>•</span>
                                <span>Powered by {paymentMethod === 'mercadopago' ? 'Mercado Pago' : 'Stripe'}</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Payment;
