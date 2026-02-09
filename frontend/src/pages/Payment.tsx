import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, CreditCard } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { TermsModal } from "@/components/TermsModal";
import { toast } from "sonner";
import { STRIPE_CONFIG } from "@/constants/pricing";

const Payment = () => {
    const location = useLocation();
    const { plan, period, price, source } = location.state || {};
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [showTerms, setShowTerms] = useState(false);

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

    const planName = (plan === 'basic' || plan === 'premium') ? 'Premium' : 'Pro';
    const periodName = period === 'monthly' ? 'Mensal' : period === 'semiannual' ? 'Semestral' : 'Anual';

    // Map plan and period to Stripe price IDs
    const getPriceId = () => {
        // Se o product Key não vier no state (vinda do PricingSection), tentar inferir do plan/period
        // Mas o PricingSection já manda o priceId correto no state.

        if (location.state?.priceId) {
            console.log('DEBUG PAYMENT: Using priceId from state:', location.state.priceId);
            return location.state.priceId;
        }

        // Fallback caso acesse direto (não deveria acontecer muito se o fluxo for forçado)
        // Mapeia logicamente para o nosso config
        // plan 'essential' (ou 'premium' legacy) -> STRIPE_CONFIG.PRODUCTS

        // Se for outro plano (Pro/Basic), não temos no config novo ainda, manter hardcoded ou erro?
        // O user só pediu Essential por enquanto. Vamos focar no Essential.

        let productKey = 'monthly';
        if (period === 'semiannual') productKey = 'semiannual';
        if (period === 'annual') productKey = 'annual';

        // @ts-ignore - ignorando erro de tipagem temporário pois STRIPE_CONFIG é what we have
        const priceId = STRIPE_CONFIG.PRODUCTS[productKey]?.priceId;

        console.log('DEBUG PAYMENT: Inferred priceId:', priceId);
        return priceId || 'price_monthly_placeholder';
    };

    const validateEmail = (email: string) => {
        // Validation requested: must contain @ and .com
        // We also check for basic email structure to be safe
        const hasAt = email.includes('@');
        const hasDotCom = email.includes('.com');
        const basicStructure = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

        return hasAt && hasDotCom && basicStructure;
    };

    const handlePayment = async () => {
        if (!email) {
            toast.error("Por favor, preencha seu e-mail.");
            return;
        }

        if (!validateEmail(email)) {
            toast.error("Por favor, insira um e-mail válido.");
            return;
        }

        if (!acceptedTerms) {
            toast.error("Por favor, aceite os Termos e Condições.");
            return;
        }
        setIsLoading(true);

        try {
            const backendUrl = import.meta.env.VITE_API_URL || 'https://api.cajiassist.com';
            const response = await fetch(`${backendUrl}/api/stripe/create-checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    priceId: getPriceId(),
                    planType: plan, // Send 'premium', 'pro' or 'basic' as is
                    period,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao criar sessão de pagamento');
            }

            if (data.url) {
                window.location.href = data.url;
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
            <Link to={source || "/"} className="absolute top-8 left-8 inline-flex items-center text-slate-600 hover:text-[#00A947] transition-colors">
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
                                {(plan === 'pro' || plan === 'premium') && (
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

                        {/* Métodos de Pagamento Aceitos */}
                        <div className="mt-8 pt-6 border-t border-slate-100">
                            <p className="text-xs text-slate-500 mb-3">Métodos de pagamento aceitos:</p>
                            <div className="flex gap-3 items-center">
                                <div className="bg-slate-100 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600">
                                    💳 Cartão de Crédito
                                </div>
                                <div className="bg-slate-100 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400">
                                    📱 Pix <span className="text-[10px]">(em breve)</span>
                                </div>
                            </div>
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

                        <div className="flex items-center space-x-2 mb-6">
                            <Checkbox
                                id="terms"
                                checked={acceptedTerms}
                                onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                                className="border-slate-300 data-[state=checked]:bg-[#00A947] data-[state=checked]:border-[#00A947]"
                            />
                            <label
                                htmlFor="terms"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-600"
                            >
                                Li e concordo com os{' '}
                                <button
                                    onClick={() => setShowTerms(true)}
                                    className="text-[#00A947] hover:underline focus:outline-none"
                                >
                                    Termos e Condições
                                </button>
                            </label>
                        </div>

                        <div className="bg-gradient-to-r from-[#00A947]/10 to-[#00A947]/5 rounded-xl p-4 mb-6">
                            <div className="flex items-start gap-3">
                                <CreditCard className="h-5 w-5 text-[#00A947] mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-slate-700">Pagamento seguro via Stripe</p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Seus dados são protegidos por criptografia de ponta a ponta.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto pt-6 border-t border-slate-100 flex flex-col items-center">
                            <Button
                                className="w-full bg-[#00A947] hover:bg-[#00A947]/90 text-white font-semibold py-6 text-lg rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={handlePayment}
                                disabled={isLoading || !email || !acceptedTerms}
                            >
                                {isLoading ? (
                                    <div className="flex items-center">
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processando...
                                    </div>
                                ) : (
                                    'Ir para Pagamento'
                                )}
                            </Button>

                            <div className="flex items-center gap-2 mt-4 text-slate-400 text-sm">
                                <span>🔒 Ambiente Seguro</span>
                                <span>•</span>
                                <span>Powered by Stripe</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            <TermsModal
                isOpen={showTerms}
                onClose={() => setShowTerms(false)}
            />
        </div>
    );
};

export default Payment;
