import { X, Check, Clock, MessageCircle } from "lucide-react";

/**
 * BeforeAfterSection - Varejo Landing Page
 * Visual comparison: Sem Caji vs Com Caji
 * Uses --varejo-* CSS variables
 */
export const BeforeAfterSection = () => {
    return (
        <section
            className="py-20 relative overflow-hidden"
            style={{ backgroundColor: 'hsl(var(--varejo-background))' }}
        >
            <div className="container px-4 md:px-6">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2
                        className="text-3xl md:text-5xl font-bold mb-6"
                        style={{
                            color: 'hsl(var(--varejo-foreground))',
                            fontFamily: 'Roboto, system-ui, sans-serif'
                        }}
                    >
                        A diferenca entre{' '}
                        <span style={{ color: 'hsl(var(--varejo-secondary))' }}>
                            perder
                        </span>
                        {' '}e{' '}
                        <span style={{ color: 'hsl(var(--varejo-primary))' }}>
                            vender
                        </span>
                    </h2>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {/* Sem Caji */}
                    <div
                        className="relative p-8 rounded-3xl transition-all duration-300"
                        style={{
                            backgroundColor: 'hsl(var(--varejo-card))',
                            border: '2px solid hsl(0 84% 60% / 0.3)',
                            boxShadow: '0 8px 32px hsl(0 84% 60% / 0.1)',
                            filter: 'grayscale(30%)'
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-6">
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: 'hsl(0 84% 60% / 0.15)' }}
                            >
                                <X className="w-5 h-5" style={{ color: 'hsl(0 84% 60%)' }} />
                            </div>
                            <h3
                                className="text-xl font-bold uppercase tracking-wider"
                                style={{
                                    color: 'hsl(0 84% 60%)',
                                    fontFamily: 'Roboto, system-ui, sans-serif'
                                }}
                            >
                                Sem Caji
                            </h3>
                        </div>

                        {/* Fake DM */}
                        <div
                            className="rounded-2xl p-4 mb-6"
                            style={{
                                backgroundColor: 'hsl(var(--varejo-background-alt))',
                                border: '1px solid hsl(var(--varejo-border))'
                            }}
                        >
                            <div className="flex items-center gap-2 mb-3 pb-2" style={{ borderBottom: '1px solid hsl(var(--varejo-border))' }}>
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                                <span className="font-medium text-sm" style={{ color: 'hsl(var(--varejo-foreground))' }}>
                                    cliente_interessado
                                </span>
                            </div>
                            <div className="space-y-3">
                                <div
                                    className="p-3 rounded-xl rounded-tl-none max-w-[80%]"
                                    style={{ backgroundColor: 'hsl(var(--varejo-border))' }}
                                >
                                    <p className="text-sm" style={{ color: 'hsl(var(--varejo-foreground))' }}>
                                        Preço?
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 text-xs" style={{ color: 'hsl(var(--varejo-muted-foreground))' }}>
                                    <Clock className="w-3 h-3" />
                                    Enviado ha 5 horas
                                </div>
                            </div>
                        </div>

                        {/* Status */}
                        <div
                            className="flex items-center justify-center gap-2 p-4 rounded-xl"
                            style={{
                                backgroundColor: 'hsl(0 84% 60% / 0.1)',
                                color: 'hsl(0 84% 60%)'
                            }}
                        >
                            <X className="w-5 h-5" />
                            <span className="font-bold">Venda Perdida</span>
                        </div>
                    </div>

                    {/* Com Caji */}
                    <div
                        className="relative p-8 rounded-3xl transition-all duration-300"
                        style={{
                            backgroundColor: 'hsl(var(--varejo-card))',
                            border: '2px solid hsl(142 76% 36% / 0.5)',
                            boxShadow: '0 8px 32px hsl(142 76% 36% / 0.15)'
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-6">
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: 'hsl(142 76% 36% / 0.15)' }}
                            >
                                <Check className="w-5 h-5" style={{ color: 'hsl(142 76% 36%)' }} />
                            </div>
                            <h3
                                className="text-xl font-bold uppercase tracking-wider"
                                style={{
                                    color: 'hsl(142 76% 36%)',
                                    fontFamily: 'Roboto, system-ui, sans-serif'
                                }}
                            >
                                Com Caji
                            </h3>
                        </div>

                        {/* Fake DM with Response */}
                        <div
                            className="rounded-2xl p-4 mb-6"
                            style={{
                                backgroundColor: 'hsl(var(--varejo-background-alt))',
                                border: '1px solid hsl(var(--varejo-border))'
                            }}
                        >
                            <div className="flex items-center gap-2 mb-3 pb-2" style={{ borderBottom: '1px solid hsl(var(--varejo-border))' }}>
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                                <span className="font-medium text-sm" style={{ color: 'hsl(var(--varejo-foreground))' }}>
                                    cliente_interessado
                                </span>
                            </div>
                            <div className="space-y-3">
                                <div
                                    className="p-3 rounded-xl rounded-tl-none max-w-[80%]"
                                    style={{ backgroundColor: 'hsl(var(--varejo-border))' }}
                                >
                                    <p className="text-sm" style={{ color: 'hsl(var(--varejo-foreground))' }}>
                                        Preço?
                                    </p>
                                </div>
                                <div
                                    className="p-3 rounded-xl rounded-tr-none max-w-[85%] ml-auto text-white"
                                    style={{ background: 'var(--varejo-gradient-primary)' }}
                                >
                                    <p className="text-sm">
                                        R$ 89,90! Frete R$ 10 na sua regiao. Quer o link de pagamento?
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 text-xs justify-end" style={{ color: 'hsl(142 76% 36%)' }}>
                                    <MessageCircle className="w-3 h-3" />
                                    Respondido em 3 segundos
                                </div>
                            </div>
                        </div>

                        {/* Status */}
                        <div
                            className="flex items-center justify-center gap-2 p-4 rounded-xl"
                            style={{
                                background: 'linear-gradient(135deg, hsl(142 76% 36%), hsl(142 76% 46%))',
                                color: 'white'
                            }}
                        >
                            <Check className="w-5 h-5" />
                            <span className="font-bold">Venda Fechada</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default BeforeAfterSection;
