import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Zap, Star } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * PricingSection - Varejo Landing Page
 * E-commerce impulse theme
 * Uses --varejo-* CSS variables
 */
export const PricingSection = () => {
    return (
        <section
            className="py-24 relative"
            id="pricing"
            style={{ backgroundColor: 'hsl(var(--varejo-background-alt))' }}
        >
            <div className="container px-4 md:px-6">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2
                        className="text-3xl md:text-5xl font-bold mb-6"
                        style={{
                            color: 'hsl(var(--varejo-foreground))',
                            fontFamily: 'Roboto, system-ui, sans-serif'
                        }}
                    >
                        Investimento que se paga{' '}
                        <span style={{ color: 'hsl(var(--varejo-primary))' }}>
                            na primeira venda
                        </span>
                    </h2>
                    <p
                        className="text-lg"
                        style={{ color: 'hsl(var(--varejo-muted-foreground))' }}
                    >
                        Escolha o periodo ideal para o seu negocio.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {/* Mensal */}
                    <div
                        className="p-8 rounded-3xl flex flex-col transition-all duration-300"
                        style={{
                            backgroundColor: 'hsl(var(--varejo-card))',
                            border: '1px solid hsl(var(--varejo-border))',
                            boxShadow: 'var(--varejo-shadow-card)'
                        }}
                    >
                        <div className="mb-6">
                            <h3
                                className="text-xl font-bold mb-2"
                                style={{
                                    color: 'hsl(var(--varejo-foreground))',
                                    fontFamily: 'Roboto, system-ui, sans-serif'
                                }}
                            >
                                Mensal
                            </h3>
                            <div className="flex items-baseline gap-1">
                                <span
                                    className="text-2xl font-bold"
                                    style={{ color: 'hsl(var(--varejo-foreground))' }}
                                >
                                    R$
                                </span>
                                <span
                                    className="text-5xl font-extrabold"
                                    style={{
                                        color: 'hsl(var(--varejo-foreground))',
                                        fontFamily: 'Roboto, system-ui, sans-serif'
                                    }}
                                >
                                    19,90
                                </span>
                                <span style={{ color: 'hsl(var(--varejo-muted-foreground))' }}>/mes</span>
                            </div>
                            <p
                                className="text-sm mt-4"
                                style={{ color: 'hsl(var(--varejo-muted-foreground))' }}
                            >
                                Mais barato que um funcionario.
                            </p>
                        </div>

                        <ul className="space-y-4 mb-8 flex-1">
                            {[
                                'Acesso Completo',
                                'Vendas Automaticas',
                                'Envio de Link/Pix',
                                'Cancele quando quiser'
                            ].map((item, i) => (
                                <li
                                    key={i}
                                    className="flex items-center gap-3 text-sm"
                                    style={{ color: 'hsl(var(--varejo-foreground))' }}
                                >
                                    <Check
                                        className="w-5 h-5"
                                        style={{ color: 'hsl(var(--varejo-primary))' }}
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
                                price: 'R$ 19,90/mes',
                                source: '/varejo'
                            }}
                            className="w-full mt-auto"
                        >
                            <Button
                                className="w-full h-12 rounded-xl text-base font-bold transition-all"
                                style={{
                                    backgroundColor: 'hsl(var(--varejo-background))',
                                    border: '2px solid hsl(var(--varejo-primary))',
                                    color: 'hsl(var(--varejo-primary))'
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
                            backgroundColor: 'hsl(var(--varejo-card))',
                            border: '2px solid hsl(var(--varejo-primary))',
                            boxShadow: 'var(--varejo-shadow-button)'
                        }}
                    >
                        <div
                            className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-bold tracking-wide shadow-lg whitespace-nowrap text-white flex items-center gap-2"
                            style={{ background: 'var(--varejo-gradient-promo)' }}
                        >
                            <Zap className="w-4 h-4" />
                            Mais Popular - Economize 17%
                        </div>
                        <div className="mb-6 mt-2">
                            <div className="flex items-center gap-2 mb-2">
                                <h3
                                    className="text-2xl font-bold"
                                    style={{
                                        color: 'hsl(var(--varejo-primary))',
                                        fontFamily: 'Roboto, system-ui, sans-serif'
                                    }}
                                >
                                    Anual
                                </h3>
                                <div className="flex">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <Star
                                            key={i}
                                            className="w-4 h-4 fill-current"
                                            style={{ color: 'hsl(var(--varejo-accent))' }}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span
                                    className="text-3xl font-bold"
                                    style={{ color: 'hsl(var(--varejo-foreground))' }}
                                >
                                    R$
                                </span>
                                <span
                                    className="text-6xl font-extrabold"
                                    style={{
                                        color: 'hsl(var(--varejo-foreground))',
                                        fontFamily: 'Roboto, system-ui, sans-serif'
                                    }}
                                >
                                    199
                                </span>
                                <span style={{ color: 'hsl(var(--varejo-muted-foreground))' }}>/ano</span>
                            </div>
                            <p
                                className="text-sm mt-4"
                                style={{ color: 'hsl(var(--varejo-muted-foreground))' }}
                            >
                                Equivalente a{' '}
                                <span
                                    className="font-bold"
                                    style={{ color: 'hsl(var(--varejo-primary))' }}
                                >
                                    R$ 16,58/mes
                                </span>.
                            </p>
                        </div>

                        <ul className="space-y-4 mb-10 flex-1">
                            {[
                                'Tudo do plano mensal',
                                '2 Meses Gratis',
                                'Setup Prioritario',
                                'Treinamento Dedicado',
                                'Acesso Antecipado a Features'
                            ].map((item, i) => (
                                <li
                                    key={i}
                                    className="flex items-center gap-3 text-base font-medium"
                                    style={{ color: 'hsl(var(--varejo-foreground))' }}
                                >
                                    <div
                                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                                        style={{ backgroundColor: 'hsl(var(--varejo-primary) / 0.15)' }}
                                    >
                                        <Check
                                            className="w-4 h-4"
                                            style={{ color: 'hsl(var(--varejo-primary))' }}
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
                                price: 'R$ 199,00/ano',
                                source: '/varejo'
                            }}
                            className="w-full mt-auto"
                        >
                            <Button
                                className="w-full h-14 rounded-2xl text-xl font-bold text-white transition-all hover:scale-[1.02] animate-pulse-cta"
                                style={{
                                    background: 'var(--varejo-gradient-primary)',
                                    boxShadow: 'var(--varejo-shadow-button)'
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
                            backgroundColor: 'hsl(var(--varejo-card))',
                            border: '1px solid hsl(var(--varejo-border))',
                            boxShadow: 'var(--varejo-shadow-card)'
                        }}
                    >
                        <div className="mb-6">
                            <h3
                                className="text-xl font-bold mb-2"
                                style={{
                                    color: 'hsl(var(--varejo-foreground))',
                                    fontFamily: 'Roboto, system-ui, sans-serif'
                                }}
                            >
                                Semestral
                            </h3>
                            <div className="flex items-baseline gap-1">
                                <span
                                    className="text-2xl font-bold"
                                    style={{ color: 'hsl(var(--varejo-foreground))' }}
                                >
                                    R$
                                </span>
                                <span
                                    className="text-5xl font-extrabold"
                                    style={{
                                        color: 'hsl(var(--varejo-foreground))',
                                        fontFamily: 'Roboto, system-ui, sans-serif'
                                    }}
                                >
                                    119,40
                                </span>
                                <span style={{ color: 'hsl(var(--varejo-muted-foreground))' }}>/semestre</span>
                            </div>
                            <p
                                className="text-sm mt-4"
                                style={{ color: 'hsl(var(--varejo-muted-foreground))' }}
                            >
                                Compromisso medio.
                            </p>
                        </div>

                        <ul className="space-y-4 mb-8 flex-1">
                            {[
                                'Acesso Completo',
                                'Integracao WhatsApp',
                                'Renovacao a cada 6 meses',
                                'Suporte Dedicado'
                            ].map((item, i) => (
                                <li
                                    key={i}
                                    className="flex items-center gap-3 text-sm"
                                    style={{ color: 'hsl(var(--varejo-foreground))' }}
                                >
                                    <Check
                                        className="w-5 h-5"
                                        style={{ color: 'hsl(var(--varejo-primary))' }}
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
                                price: 'R$ 119,40/semestre',
                                source: '/varejo'
                            }}
                            className="w-full mt-auto"
                        >
                            <Button
                                className="w-full h-12 rounded-xl text-base font-bold transition-all"
                                style={{
                                    backgroundColor: 'hsl(var(--varejo-background))',
                                    border: '2px solid hsl(var(--varejo-primary))',
                                    color: 'hsl(var(--varejo-primary))'
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
