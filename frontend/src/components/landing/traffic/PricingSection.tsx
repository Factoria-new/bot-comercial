import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export const PricingSection = () => {
    return (
        <section className="py-24 bg-lp-background relative" id="pricing">
            <div className="container px-4 md:px-6">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">
                        Investimento que se paga <span className="text-lp-accent">sozinho</span>
                    </h2>
                    <p className="text-lp-muted-foreground text-lg">
                        Tudo o que você precisa em um único plano completo e poderoso.
                    </p>
                </div>

                <div className="max-w-md mx-auto">
                    {/* Premium Plan - Featured and only one */}
                    <div className="p-8 rounded-3xl bg-lp-card border-2 border-lp-accent relative shadow-[0_0_40px_rgba(25,177,89,0.15)] flex flex-col h-full transform transition-all hover:scale-105 duration-300">
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-lp-accent text-white px-4 py-1 rounded-full text-sm font-bold tracking-wide shadow-lg">
                            PLANO PREMIUM
                        </div>
                        <div className="mb-8 mt-2">
                            <h3 className="text-2xl font-bold text-white mb-4 font-display">Acesso Total</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold text-white">R$</span>
                                <span className="text-6xl font-display font-bold text-white">19,90</span>
                                <span className="text-lp-muted-foreground">/mês</span>
                            </div>
                            <p className="text-sm text-lp-muted-foreground mt-4 leading-relaxed">
                                Automação completa de WhatsApp, sincronização com agenda e inteligência artificial de última geração.
                            </p>
                        </div>

                        <ul className="space-y-4 mb-10 flex-1">
                            {[
                                'Atendimento Humano 24/7 p/ IA',
                                'Integração Oficial WhatsApp',
                                'Agendamento Google Calendar',
                                'Transfere para Humano se desejar',
                                'Treinamento via PDF/Link/Manual',
                                'Suporte Prioritário Via WhatsApp'
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-base font-medium text-white/90">
                                    <div className="p-1 rounded-full bg-lp-accent/20 flex-shrink-0">
                                        <Check className="w-4 h-4 text-lp-accent" />
                                    </div>
                                    {item}
                                </li>
                            ))}
                        </ul>

                        <Link
                            to="/payment"
                            state={{
                                plan: 'premium',
                                period: 'monthly',
                                price: 'R$ 19,90/mês'
                            }}
                            className="w-full"
                        >
                            <Button className="w-full bg-lp-accent hover:bg-lp-accent/90 text-white h-14 rounded-2xl text-xl font-bold shadow-lg shadow-lp-accent/25 transition-all">
                                Assinar Agora
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </Link>

                        <p className="text-center text-xs text-lp-muted-foreground mt-4">
                            Sem contrato de fidelidade. Cancele quando quiser.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default PricingSection;
