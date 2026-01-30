import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const CTASection = () => {
    return (
        <section className="py-24 relative overflow-hidden">
            <div className="absolute inset-0 bg-lp-primary" />
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-lp-background to-transparent opacity-80" />

            <div className="container relative z-10 px-4 md:px-6 text-center">
                <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
                    <h2 className="text-4xl md:text-6xl font-display font-bold text-white leading-tight">
                        Pronto para revolucionar seu <br />
                        <span className="text-lp-cta-orange">atendimento?</span>
                    </h2>
                    <p className="text-lg md:text-xl text-lp-muted-foreground font-sans max-w-2xl mx-auto">
                        Integre sua IA hoje mesmo e veja seus resultados serem transformados. Sem cartão de crédito necessário para começar.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                        <Button
                            className="h-14 px-10 text-lg font-bold bg-lp-cta-orange hover:bg-lp-cta-orange/90 text-white rounded-xl shadow-[0_0_30px_hsl(24_100%_50%_/_0.4)] hover:shadow-[0_0_50px_hsl(24_100%_50%_/_0.6)] transition-all duration-300 hover:scale-105"
                        >
                            Criar Conta Grátis
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                    </div>

                    <p className="text-sm text-lp-muted-foreground pt-4">
                        Garanta sua vaga com preço promocional de lançamento.
                    </p>
                </div>
            </div>
        </section>
    );
};

export default CTASection;
