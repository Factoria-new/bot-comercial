import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useAgentAudio } from "@/hooks/useAgentAudio";
import { useTTS } from "@/hooks/useTTS";
import { useLiaVolume } from "@/contexts/LiaVolumeContext";
import { getRandomAudio } from "@/lib/audioMappings";
import { useEffect, useRef } from "react";

export const CTASection = () => {
    const { stop: stopTTS } = useTTS();
    const { volume: liaVolume } = useLiaVolume();
    const { playIntegrationAudio } = useAgentAudio({ stopTTS, liaVolume });
    const hasPlayedRef = useRef(false);

    // Play only once when component mounts (or maybe when in view? User didn't specify, but mounting is easier for now)
    // Considering it's a landing section, `useEffect` on mount is good enough if it's visible. 
    // Ideally we use IntersectionObserver but for simplicity let's stick to simple mount or a check.
    // However, autoplay policies might block it if no interaction.
    // BUT the user specifically asked: "A Lia deve fazer uma chamada para ação convincente."
    // Let's assume the user has interacted with the page earlier.

    // Better UX: Play when the user clicks/hovers or comes into view. 
    // Let's use a simple IntersectionObserver logic if possible, or just play on mount if we assume prior interaction.
    // Given the constraints and existing code, I'll add a simple play on effect.

    useEffect(() => {
        const playAudio = async () => {
            if (hasPlayedRef.current) return;

            // Simple delay to standout
            setTimeout(() => {
                const audioVariation = getRandomAudio('cta_plans');
                if (audioVariation.path) {
                    playIntegrationAudio(audioVariation.path);
                    hasPlayedRef.current = true;
                }
            }, 1000);
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    playAudio();
                }
            });
        }, { threshold: 0.5 });

        const element = document.getElementById('cta-section');
        if (element) observer.observe(element);

        return () => observer.disconnect();
    }, [playIntegrationAudio]);
    return (
        <section id="cta-section" className="py-24 relative overflow-hidden">
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
