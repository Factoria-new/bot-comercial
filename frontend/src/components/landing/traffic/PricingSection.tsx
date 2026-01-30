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
                        Escolha o período ideal para o seu negócio.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {/* Mensal */}
                    <div className="p-8 rounded-3xl bg-lp-card border border-lp-border hover:border-lp-accent/50 transition-all duration-300 flex flex-col">
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-white mb-2">Mensal</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold text-white">R$</span>
                                <span className="text-4xl font-display font-bold text-white">19,90</span>
                                <span className="text-lp-muted-foreground">/mês</span>
                            </div>
                            <p className="text-sm text-lp-muted-foreground mt-4">Flexibilidade total.</p>
                        </div>

                        <ul className="space-y-4 mb-8 flex-1">
                            {[
                                'Acesso Completo',
                                'Integração WhatsApp',
                                'Suporte Prioritário',
                                'Cancele quando quiser'
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm text-white/90">
                                    <Check className="w-4 h-4 text-lp-accent" />
                                    {item}
                                </li>
                            ))}
                        </ul>

                        <Link
                            to="/payment"
                            state={{
                                plan: 'premium',
                                period: 'monthly',
                                price: 'R$ 19,90/mês',
                                source: '/trafego'
                            }}
                            className="w-full mt-auto"
                        >
                            <Button className="w-full bg-lp-card border border-lp-border hover:bg-lp-accent/10 text-white h-12 rounded-xl text-lg font-bold">
                                Assinar Mensal
                            </Button>
                        </Link>
                    </div>

                    {/* Anual (Featured) */}
                    <div className="p-8 rounded-3xl bg-lp-card border-2 border-lp-accent relative shadow-[0_0_40px_rgba(25,177,89,0.15)] flex flex-col transform md:-translate-y-4 z-10">
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-lp-accent text-white px-4 py-1 rounded-full text-sm font-bold tracking-wide shadow-lg whitespace-nowrap">
                            MAIS POPULAR - ECONOMIZE 17%
                        </div>
                        <div className="mb-6 mt-2">
                            <h3 className="text-2xl font-bold text-lp-accent mb-2">Anual</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold text-white">R$</span>
                                <span className="text-5xl font-display font-bold text-white">199,00</span>
                                <span className="text-lp-muted-foreground">/ano</span>
                            </div>
                            <p className="text-sm text-lp-muted-foreground mt-4">
                                Equivalente a <span className="text-white font-bold">R$ 16,58/mês</span>.
                            </p>
                        </div>

                        <ul className="space-y-4 mb-10 flex-1">
                            {[
                                'Tudo do plano mensal',
                                '2 Meses Grátis',
                                'Setup Prioritário',
                                'Treinamento Dedicado',
                                'Acesso Antecipado a Features'
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
                                period: 'annual',
                                price: 'R$ 199,00/ano',
                                source: '/trafego'
                            }}
                            className="w-full mt-auto"
                        >
                            <Button className="w-full bg-lp-accent hover:bg-lp-accent/90 text-white h-14 rounded-2xl text-xl font-bold shadow-lg shadow-lp-accent/25 transition-all">
                                Assinar Anual
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </Link>
                    </div>

                    {/* Semestral */}
                    <div className="p-8 rounded-3xl bg-lp-card border border-lp-border hover:border-lp-accent/50 transition-all duration-300 flex flex-col">
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-white mb-2">Semestral</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold text-white">R$</span>
                                <span className="text-4xl font-display font-bold text-white">119,40</span>
                                <span className="text-lp-muted-foreground">/semestre</span>
                            </div>
                            <p className="text-sm text-lp-muted-foreground mt-4">Compromisso médio.</p>
                        </div>

                        <ul className="space-y-4 mb-8 flex-1">
                            {[
                                'Acesso Completo',
                                'Integração WhatsApp',
                                'Renovação a cada 6 meses',
                                'Suporte Dedicado'
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm text-white/90">
                                    <Check className="w-4 h-4 text-lp-accent" />
                                    {item}
                                </li>
                            ))}
                        </ul>

                        <Link
                            to="/payment"
                            state={{
                                plan: 'premium',
                                period: 'semiannual',
                                price: 'R$ 119,40/semestre',
                                source: '/trafego'
                            }}
                            className="w-full mt-auto"
                        >
                            <Button className="w-full bg-lp-card border border-lp-border hover:bg-lp-accent/10 text-white h-12 rounded-xl text-lg font-bold">
                                Assinar Semestral
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default PricingSection;
