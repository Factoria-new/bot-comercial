import { Button } from "@/components/ui/button";
import { ArrowRight, Check, Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";
import { PRICING_DISPLAY, getPriceState } from "@/constants/pricing";

/**
 * PricingSection - Saude Landing Page
 * Clean single-card pricing with coffee comparison
 * Uses --saude-* CSS variables
 */
export const PricingSection = () => {
    return (
        <section
            className="py-24 relative z-10"
            id="pricing"
            style={{ backgroundColor: 'hsl(var(--saude-background-alt))' }}
        >
            <div className="container px-4 md:px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2
                        className="text-3xl md:text-5xl font-bold mb-6"
                        style={{
                            color: 'hsl(var(--saude-foreground))',
                            fontFamily: 'Roboto, system-ui, sans-serif'
                        }}
                    >
                        Investimento que se paga{' '}
                        <span style={{ color: 'hsl(var(--saude-primary))' }}>
                            na primeira consulta
                        </span>
                    </h2>

                    {/* Coffee Comparison */}
                    <div
                        className="inline-flex items-center gap-3 px-6 py-3 rounded-full mb-6"
                        style={{
                            backgroundColor: 'hsl(var(--saude-primary) / 0.1)',
                            border: '1px solid hsl(var(--saude-primary) / 0.2)'
                        }}
                    >
                        <Stethoscope className="w-5 h-5" style={{ color: 'hsl(var(--saude-primary))' }} />
                        <span
                            className="font-semibold"
                            style={{ color: 'hsl(var(--saude-foreground))' }}
                        >
                            Uma consulta paga o ano todo
                        </span>
                    </div>

                    <p
                        className="text-lg"
                        style={{ color: 'hsl(var(--saude-muted-foreground))' }}
                    >
                        Escolha o plano ideal para a sua clinica ou consultorio.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {/* Mensal */}
                    <div
                        className="p-8 rounded-3xl flex flex-col transition-all duration-300"
                        style={{
                            backgroundColor: 'hsl(var(--saude-card))',
                            border: '1px solid hsl(var(--saude-border))',
                            boxShadow: 'var(--saude-shadow-card)'
                        }}
                    >
                        <div className="mb-6">
                            <h3
                                className="text-xl font-bold mb-2"
                                style={{
                                    color: 'hsl(var(--saude-foreground))',
                                    fontFamily: 'Roboto, system-ui, sans-serif'
                                }}
                            >
                                Mensal
                            </h3>
                            <div className="flex items-baseline gap-1">
                                <span
                                    className="text-2xl font-bold"
                                    style={{ color: 'hsl(var(--saude-foreground))' }}
                                >
                                    R$
                                </span>
                                <span
                                    className="text-5xl font-extrabold"
                                    style={{
                                        color: 'hsl(var(--saude-foreground))',
                                        fontFamily: 'Roboto, system-ui, sans-serif'
                                    }}
                                >
                                    {PRICING_DISPLAY.monthly.replace("R$", "").trim()}
                                </span>
                                <span style={{ color: 'hsl(var(--saude-muted-foreground))' }}>/mês</span>
                            </div>
                            <p
                                className="text-sm mt-4"
                                style={{ color: 'hsl(var(--saude-muted-foreground))' }}
                            >
                                Perfeito para comeccar.
                            </p>
                        </div>

                        <ul className="space-y-4 mb-8 flex-1">
                            {[
                                'Agendamento Automatico',
                                'Integracao Google Calendar',
                                'Lembretes via WhatsApp',
                                'Sem fidelidade'
                            ].map((item, i) => (
                                <li
                                    key={i}
                                    className="flex items-center gap-3 text-sm"
                                    style={{ color: 'hsl(var(--saude-foreground))' }}
                                >
                                    <Check
                                        className="w-5 h-5"
                                        style={{ color: 'hsl(var(--saude-primary))' }}
                                    />
                                    {item}
                                </li>
                            ))}
                        </ul>

                        <Link
                            to="/payment"
                            state={{
                                plan: 'premium',
                                period: 'monthly',
                                price: getPriceState('monthly'),
                                source: '/saude'
                            }}
                            className="w-full mt-auto"
                        >
                            <Button
                                className="w-full h-12 rounded-xl text-base font-bold transition-all"
                                style={{
                                    backgroundColor: 'transparent',
                                    border: '2px solid hsl(var(--saude-primary))',
                                    color: 'hsl(var(--saude-primary))'
                                }}
                            >
                                Assinar Mensal
                            </Button>
                        </Link>
                    </div>

                    {/* Anual (Featured) */}
                    <div
                        className="p-8 rounded-3xl relative flex flex-col transform md:-translate-y-4 z-10"
                        style={{
                            backgroundColor: 'hsl(var(--saude-card))',
                            border: '2px solid hsl(var(--saude-primary))',
                            boxShadow: 'var(--saude-shadow-soft)'
                        }}
                    >
                        <div
                            className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-bold tracking-wide shadow-lg whitespace-nowrap text-white flex items-center gap-2"
                            style={{ backgroundColor: 'hsl(var(--saude-primary))' }}
                        >
                            <span className="text-yellow-300">★</span>
                            Mais Popular - Economize {PRICING_DISPLAY.discountPercentage}
                        </div>
                        <div className="mb-6 mt-2">
                            <div className="flex items-center gap-2 mb-2">
                                <h3
                                    className="text-2xl font-bold"
                                    style={{
                                        color: 'hsl(var(--saude-primary))',
                                        fontFamily: 'Roboto, system-ui, sans-serif'
                                    }}
                                >
                                    Anual
                                </h3>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span
                                    className="text-3xl font-bold"
                                    style={{ color: 'hsl(var(--saude-foreground))' }}
                                >
                                    R$
                                </span>
                                <span
                                    className="text-6xl font-extrabold"
                                    style={{
                                        color: 'hsl(var(--saude-foreground))',
                                        fontFamily: 'Roboto, system-ui, sans-serif'
                                    }}
                                >
                                    {PRICING_DISPLAY.annualTotal.replace("R$", "").replace(",00", "").trim()}
                                </span>
                                <span style={{ color: 'hsl(var(--saude-muted-foreground))' }}>/ano</span>
                            </div>
                            <p
                                className="text-sm mt-4"
                                style={{ color: 'hsl(var(--saude-muted-foreground))' }}
                            >
                                Equivalente a{' '}
                                <span
                                    className="font-bold"
                                    style={{ color: 'hsl(var(--saude-primary))' }}
                                >
                                    {PRICING_DISPLAY.annualMonthly}/mês
                                </span>.
                            </p>
                        </div>

                        <ul className="space-y-4 mb-10 flex-1">
                            {[
                                'Todas funcionalidades',
                                '2 Meses Gratis',
                                'Suporte Prioritario',
                                'Setup Assistido',
                                'Badge de Profissional Verificado'
                            ].map((item, i) => (
                                <li
                                    key={i}
                                    className="flex items-center gap-3 text-base font-medium"
                                    style={{ color: 'hsl(var(--saude-foreground))' }}
                                >
                                    <div
                                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                                        style={{ backgroundColor: 'hsl(var(--saude-primary) / 0.15)' }}
                                    >
                                        <Check
                                            className="w-4 h-4"
                                            style={{ color: 'hsl(var(--saude-primary))' }}
                                        />
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
                                price: getPriceState('annual'),
                                source: '/saude'
                            }}
                            className="w-full mt-auto"
                        >
                            <Button
                                className="w-full h-14 rounded-2xl text-xl font-bold text-white transition-all hover:scale-[1.02]"
                                style={{
                                    backgroundColor: 'hsl(var(--saude-primary))',
                                    boxShadow: 'var(--saude-shadow-accent)'
                                }}
                            >
                                ASSINAR AGORA
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </Link>
                    </div>

                    {/* Semestral */}
                    <div
                        className="p-8 rounded-3xl flex flex-col transition-all duration-300"
                        style={{
                            backgroundColor: 'hsl(var(--saude-card))',
                            border: '1px solid hsl(var(--saude-border))',
                            boxShadow: 'var(--saude-shadow-card)'
                        }}
                    >
                        <div className="mb-6">
                            <h3
                                className="text-xl font-bold mb-2"
                                style={{
                                    color: 'hsl(var(--saude-foreground))',
                                    fontFamily: 'Roboto, system-ui, sans-serif'
                                }}
                            >
                                Semestral
                            </h3>
                            <div className="flex items-baseline gap-1">
                                <span
                                    className="text-2xl font-bold"
                                    style={{ color: 'hsl(var(--saude-foreground))' }}
                                >
                                    R$
                                </span>
                                <span
                                    className="text-5xl font-extrabold"
                                    style={{
                                        color: 'hsl(var(--saude-foreground))',
                                        fontFamily: 'Roboto, system-ui, sans-serif'
                                    }}
                                >
                                    {PRICING_DISPLAY.semiAnnual.replace("R$", "").trim()}
                                </span>
                                <span style={{ color: 'hsl(var(--saude-muted-foreground))' }}>/sem.</span>
                            </div>
                            <p
                                className="text-sm mt-4"
                                style={{ color: 'hsl(var(--saude-muted-foreground))' }}
                            >
                                Meio termo ideal.
                            </p>
                        </div>

                        <ul className="space-y-4 mb-8 flex-1">
                            {[
                                'Acesso Completo',
                                'Integracao WhatsApp',
                                'Renovacao a cada 6 meses',
                                'Suporte Padrao'
                            ].map((item, i) => (
                                <li
                                    key={i}
                                    className="flex items-center gap-3 text-sm"
                                    style={{ color: 'hsl(var(--saude-foreground))' }}
                                >
                                    <Check
                                        className="w-5 h-5"
                                        style={{ color: 'hsl(var(--saude-primary))' }}
                                    />
                                    {item}
                                </li>
                            ))}
                        </ul>

                        <Link
                            to="/payment"
                            state={{
                                plan: 'premium',
                                period: 'semiannual',
                                price: getPriceState('semiannual'),
                                source: '/saude'
                            }}
                            className="w-full mt-auto"
                        >
                            <Button
                                className="w-full h-12 rounded-xl text-base font-bold transition-all"
                                style={{
                                    backgroundColor: 'transparent',
                                    border: '2px solid hsl(var(--saude-primary))',
                                    color: 'hsl(var(--saude-primary))'
                                }}
                            >
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
