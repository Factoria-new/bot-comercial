import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * PricingSection - Saude Landing Page
 * ISOLATED from main site design system.
 * Uses --saude-* CSS variables.
 */
export const PricingSection = () => {
    return (
        <section
            className="py-24 relative"
            id="pricing"
            style={{ backgroundColor: 'hsl(var(--saude-background-alt))' }}
        >
            <div className="container px-4 md:px-6">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2
                        className="text-3xl md:text-5xl font-display font-bold mb-6"
                        style={{ color: 'hsl(var(--saude-foreground))' }}
                    >
                        Investimento que se paga{' '}
                        <span style={{ color: 'hsl(var(--saude-primary))' }}>sozinho</span>
                    </h2>
                    <p
                        className="text-lg"
                        style={{ color: 'hsl(var(--saude-muted-foreground))' }}
                    >
                        Escolha o periodo ideal para o seu negocio.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {/* Mensal */}
                    <div
                        className="p-8 rounded-3xl flex flex-col transition-all duration-300 hover:-translate-y-1"
                        style={{
                            backgroundColor: 'hsl(var(--saude-card))',
                            border: '1px solid hsl(var(--saude-border))',
                            boxShadow: 'var(--saude-shadow-card)'
                        }}
                    >
                        <div className="mb-6">
                            <h3
                                className="text-xl font-bold mb-2"
                                style={{ color: 'hsl(var(--saude-foreground))' }}
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
                                    className="text-4xl font-display font-bold"
                                    style={{ color: 'hsl(var(--saude-foreground))' }}
                                >
                                    19,90
                                </span>
                                <span style={{ color: 'hsl(var(--saude-muted-foreground))' }}>/mes</span>
                            </div>
                            <p
                                className="text-sm mt-4"
                                style={{ color: 'hsl(var(--saude-muted-foreground))' }}
                            >
                                Mais barato que um cafezinho.
                            </p>
                        </div>

                        <ul className="space-y-4 mb-8 flex-1">
                            {[
                                'Acesso Completo',
                                'Integracao WhatsApp',
                                'Suporte Prioritario',
                                'Cancele quando quiser'
                            ].map((item, i) => (
                                <li
                                    key={i}
                                    className="flex items-center gap-3 text-sm"
                                    style={{ color: 'hsl(var(--saude-foreground))' }}
                                >
                                    <Check
                                        className="w-4 h-4"
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
                                price: 'R$ 19,90/mes',
                                source: '/saude'
                            }}
                            className="w-full mt-auto"
                        >
                            <Button
                                className="w-full h-12 rounded-xl text-lg font-bold transition-all"
                                style={{
                                    backgroundColor: 'transparent',
                                    border: '2px solid hsl(var(--saude-primary))',
                                    color: 'hsl(var(--saude-primary))'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'hsl(var(--saude-primary))';
                                    e.currentTarget.style.color = 'white';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = 'hsl(var(--saude-primary))';
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
                            boxShadow: 'var(--saude-shadow-accent)'
                        }}
                    >
                        <div
                            className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-bold tracking-wide shadow-lg whitespace-nowrap"
                            style={{
                                backgroundColor: 'hsl(var(--saude-primary))',
                                color: 'white'
                            }}
                        >
                            MAIS POPULAR - ECONOMIZE 17%
                        </div>
                        <div className="mb-6 mt-2">
                            <h3
                                className="text-2xl font-bold mb-2"
                                style={{ color: 'hsl(var(--saude-primary))' }}
                            >
                                Anual
                            </h3>
                            <div className="flex items-baseline gap-1">
                                <span
                                    className="text-3xl font-bold"
                                    style={{ color: 'hsl(var(--saude-foreground))' }}
                                >
                                    R$
                                </span>
                                <span
                                    className="text-5xl font-display font-bold"
                                    style={{ color: 'hsl(var(--saude-foreground))' }}
                                >
                                    199,00
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
                                    style={{ color: 'hsl(var(--saude-foreground))' }}
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
                                    style={{ color: 'hsl(var(--saude-foreground))' }}
                                >
                                    <div
                                        className="p-1 rounded-full flex-shrink-0"
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
                                price: 'R$ 199,00/ano',
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
                                Assinar Anual
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </Link>
                    </div>

                    {/* Semestral */}
                    <div
                        className="p-8 rounded-3xl flex flex-col transition-all duration-300 hover:-translate-y-1"
                        style={{
                            backgroundColor: 'hsl(var(--saude-card))',
                            border: '1px solid hsl(var(--saude-border))',
                            boxShadow: 'var(--saude-shadow-card)'
                        }}
                    >
                        <div className="mb-6">
                            <h3
                                className="text-xl font-bold mb-2"
                                style={{ color: 'hsl(var(--saude-foreground))' }}
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
                                    className="text-4xl font-display font-bold"
                                    style={{ color: 'hsl(var(--saude-foreground))' }}
                                >
                                    119,40
                                </span>
                                <span style={{ color: 'hsl(var(--saude-muted-foreground))' }}>/semestre</span>
                            </div>
                            <p
                                className="text-sm mt-4"
                                style={{ color: 'hsl(var(--saude-muted-foreground))' }}
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
                                    style={{ color: 'hsl(var(--saude-foreground))' }}
                                >
                                    <Check
                                        className="w-4 h-4"
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
                                price: 'R$ 119,40/semestre',
                                source: '/saude'
                            }}
                            className="w-full mt-auto"
                        >
                            <Button
                                className="w-full h-12 rounded-xl text-lg font-bold transition-all"
                                style={{
                                    backgroundColor: 'transparent',
                                    border: '2px solid hsl(var(--saude-primary))',
                                    color: 'hsl(var(--saude-primary))'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'hsl(var(--saude-primary))';
                                    e.currentTarget.style.color = 'white';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = 'hsl(var(--saude-primary))';
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
