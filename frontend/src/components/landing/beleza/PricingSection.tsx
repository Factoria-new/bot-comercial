import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * PricingSection - Beleza Landing Page
 * ISOLATED dark luxury theme
 * Uses --beleza-* CSS variables
 */
export const PricingSection = () => {
    return (
        <section
            className="py-24 relative"
            id="pricing"
            style={{ backgroundColor: 'hsl(var(--beleza-background-alt))' }}
        >
            <div className="container px-4 md:px-6">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2
                        className="text-3xl md:text-5xl font-display font-bold mb-6 uppercase"
                        style={{ color: 'hsl(var(--beleza-foreground))' }}
                    >
                        Investimento que se paga{' '}
                        <span
                            className="text-transparent bg-clip-text"
                            style={{ backgroundImage: 'var(--beleza-gradient-primary)' }}
                        >
                            sozinho
                        </span>
                    </h2>
                    <p style={{ color: 'hsl(var(--beleza-muted-foreground))' }} className="text-lg">
                        Escolha o periodo ideal para o seu negocio.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {/* Mensal */}
                    <div
                        className="p-8 rounded-3xl flex flex-col transition-all duration-300"
                        style={{
                            backgroundColor: 'hsl(var(--beleza-card))',
                            border: '1px solid hsl(var(--beleza-border))'
                        }}
                    >
                        <div className="mb-6">
                            <h3
                                className="text-xl font-bold mb-2 uppercase"
                                style={{ color: 'hsl(var(--beleza-foreground))' }}
                            >
                                Mensal
                            </h3>
                            <div className="flex items-baseline gap-1">
                                <span
                                    className="text-2xl font-bold"
                                    style={{ color: 'hsl(var(--beleza-foreground))' }}
                                >
                                    R$
                                </span>
                                <span
                                    className="text-4xl font-display font-bold"
                                    style={{ color: 'hsl(var(--beleza-foreground))' }}
                                >
                                    19,90
                                </span>
                                <span style={{ color: 'hsl(var(--beleza-muted-foreground))' }}>/mes</span>
                            </div>
                            <p
                                className="text-sm mt-4"
                                style={{ color: 'hsl(var(--beleza-muted-foreground))' }}
                            >
                                Mais barato que um no-show.
                            </p>
                        </div>

                        <ul className="space-y-4 mb-8 flex-1">
                            {[
                                'Acesso Completo',
                                'Agendamentos Ilimitados',
                                'Sincronizacao Google Agenda',
                                'Cancele quando quiser'
                            ].map((item, i) => (
                                <li
                                    key={i}
                                    className="flex items-center gap-3 text-sm"
                                    style={{ color: 'hsl(var(--beleza-foreground) / 0.9)' }}
                                >
                                    <Check
                                        className="w-4 h-4"
                                        style={{ color: 'hsl(var(--beleza-primary))' }}
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
                                source: '/beleza'
                            }}
                            className="w-full mt-auto"
                        >
                            <Button
                                className="w-full h-12 rounded-xl text-lg font-bold uppercase transition-all"
                                style={{
                                    backgroundColor: 'hsl(var(--beleza-card))',
                                    border: '1px solid hsl(var(--beleza-border))',
                                    color: 'hsl(var(--beleza-foreground))'
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
                            backgroundColor: 'hsl(var(--beleza-card))',
                            border: '2px solid hsl(var(--beleza-primary))',
                            boxShadow: 'var(--beleza-shadow-glow)'
                        }}
                    >
                        <div
                            className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-bold tracking-wide shadow-lg whitespace-nowrap text-white uppercase"
                            style={{ background: 'var(--beleza-gradient-primary)' }}
                        >
                            Mais Popular - Economize 17%
                        </div>
                        <div className="mb-6 mt-2">
                            <h3
                                className="text-2xl font-bold mb-2 uppercase text-transparent bg-clip-text"
                                style={{ backgroundImage: 'var(--beleza-gradient-primary)' }}
                            >
                                Anual
                            </h3>
                            <div className="flex items-baseline gap-1">
                                <span
                                    className="text-3xl font-bold"
                                    style={{ color: 'hsl(var(--beleza-foreground))' }}
                                >
                                    R$
                                </span>
                                <span
                                    className="text-5xl font-display font-bold"
                                    style={{ color: 'hsl(var(--beleza-foreground))' }}
                                >
                                    199,00
                                </span>
                                <span style={{ color: 'hsl(var(--beleza-muted-foreground))' }}>/ano</span>
                            </div>
                            <p
                                className="text-sm mt-4"
                                style={{ color: 'hsl(var(--beleza-muted-foreground))' }}
                            >
                                Equivalente a{' '}
                                <span style={{ color: 'hsl(var(--beleza-foreground))' }} className="font-bold">
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
                                    style={{ color: 'hsl(var(--beleza-foreground) / 0.9)' }}
                                >
                                    <div
                                        className="p-1 rounded-full flex-shrink-0"
                                        style={{ background: 'hsl(var(--beleza-primary) / 0.2)' }}
                                    >
                                        <Check
                                            className="w-4 h-4"
                                            style={{ color: 'hsl(var(--beleza-primary))' }}
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
                                source: '/beleza'
                            }}
                            className="w-full mt-auto"
                        >
                            <Button
                                className="w-full h-14 rounded-2xl text-xl font-bold text-white uppercase transition-all hover:scale-[1.02]"
                                style={{
                                    background: 'var(--beleza-gradient-primary)',
                                    boxShadow: 'var(--beleza-shadow-accent)'
                                }}
                            >
                                Assinar Anual
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </Link>
                    </div>

                    {/* Semestral */}
                    <div
                        className="p-8 rounded-3xl flex flex-col transition-all duration-300"
                        style={{
                            backgroundColor: 'hsl(var(--beleza-card))',
                            border: '1px solid hsl(var(--beleza-border))'
                        }}
                    >
                        <div className="mb-6">
                            <h3
                                className="text-xl font-bold mb-2 uppercase"
                                style={{ color: 'hsl(var(--beleza-foreground))' }}
                            >
                                Semestral
                            </h3>
                            <div className="flex items-baseline gap-1">
                                <span
                                    className="text-2xl font-bold"
                                    style={{ color: 'hsl(var(--beleza-foreground))' }}
                                >
                                    R$
                                </span>
                                <span
                                    className="text-4xl font-display font-bold"
                                    style={{ color: 'hsl(var(--beleza-foreground))' }}
                                >
                                    119,40
                                </span>
                                <span style={{ color: 'hsl(var(--beleza-muted-foreground))' }}>/semestre</span>
                            </div>
                            <p
                                className="text-sm mt-4"
                                style={{ color: 'hsl(var(--beleza-muted-foreground))' }}
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
                                    style={{ color: 'hsl(var(--beleza-foreground) / 0.9)' }}
                                >
                                    <Check
                                        className="w-4 h-4"
                                        style={{ color: 'hsl(var(--beleza-primary))' }}
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
                                source: '/beleza'
                            }}
                            className="w-full mt-auto"
                        >
                            <Button
                                className="w-full h-12 rounded-xl text-lg font-bold uppercase transition-all"
                                style={{
                                    backgroundColor: 'hsl(var(--beleza-card))',
                                    border: '1px solid hsl(var(--beleza-border))',
                                    color: 'hsl(var(--beleza-foreground))'
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
