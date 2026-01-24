import { useRef, useLayoutEffect, ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import { ScalableSupportAnimation } from "./features/ScalableSupportAnimation";
import { AgentCustomizationAnimation } from "./features/AgentCustomizationAnimation";
import { DashboardAnimation } from "./features/DashboardAnimation";
import { IntegrationsAnimation } from "./features/IntegrationsAnimation";
import { CheckCircle2 } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

interface Feature {
    title: string;
    description: string;
    bullets: string[];
    component: ReactNode;
}

const features: Feature[] = [
    {
        title: "Atendimento Escalável",
        description: "Multiplique sua capacidade de atendimento sem contratar mais pessoas. Um bot para cada conversa, todas rodando ao mesmo tempo.",
        bullets: ["Múltiplas conversas simultâneas", "Respostas instantâneas 24/7", "Escale sem aumentar custos"],
        component: <ScalableSupportAnimation />,
    },
    {
        title: "Agente IA Personalizado",
        description: "Configure o prompt do seu bot com a personalidade da sua marca. Ele entende contexto, histórico e responde como seu melhor vendedor.",
        bullets: ["Prompt 100% personalizável", "Conexão com Google Calendar", "Responde via áudio (TTS)"],
        component: <AgentCustomizationAnimation />,
    },
    {
        title: "Dashboard de Métricas",
        description: "Acompanhe cada conversa, cada lead, cada agendamento. Tudo em tempo real com atualizações automáticas via WebSocket.",
        bullets: ["Atualizações instantâneas", "Métricas de mensagens e leads", "Pergunte à Lia sobre seus dados"],
        component: <DashboardAnimation />,
    },
    {
        title: "Integrações Poderosas",
        description: "Conecte WhatsApp, Instagram e Google Calendar em poucos cliques. Suas conversas e agendamentos sincronizados automaticamente.",
        bullets: ["WhatsApp Business", "Instagram Direct", "Google Calendar integrado"],
        component: <IntegrationsAnimation />,
    },
];

export const ProductSection = () => {
    const sectionRef = useRef<HTMLElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            gsap.to(triggerRef.current, {
                xPercent: -100 * (features.length - 1) / features.length,
                ease: "none",
                scrollTrigger: {
                    trigger: sectionRef.current,
                    pin: true,
                    scrub: 1,
                    snap: 1 / (features.length - 1),
                    end: "+=3000",
                },
            });
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} id="produto" className="relative h-screen bg-white flex flex-col justify-center overflow-hidden">

            {/* Header - Fixed at Top */}
            <div className="absolute top-32 left-0 w-full z-20 pointer-events-none text-center">
                <div className="bg-white/90 backdrop-blur-md p-4 px-8 rounded-full inline-block shadow-sm border border-slate-100">
                    <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight text-slate-900">
                        Seu Assistente de Vendas <br className="hidden md:block" />
                        <span>no </span>
                        <span className="text-[#00A947]">WhatsApp</span>
                    </h2>
                </div>
            </div>

            {/* The Band / Strip Area */}
            <div className="w-full h-[480px] mt-32 bg-slate-50/50 backdrop-blur-sm overflow-hidden relative">
                <div ref={triggerRef} className="flex h-full w-[400vw]">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="relative w-[100vw] h-full flex-shrink-0 flex items-center justify-center px-6 md:px-0"
                        >
                            <div className="container mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center px-6">

                                {/* Left Column: Text */}
                                <div className="order-2 md:order-1 space-y-4">
                                    <motion.div
                                        initial={{ opacity: 0, x: -50 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true, amount: 0.5 }}
                                        transition={{ duration: 0.8 }}
                                    >
                                        <div className="w-12 h-1 bg-[#00A947] mb-4"></div>
                                        <h3 className="text-3xl md:text-4xl font-black font-clash text-slate-900 leading-[1.1] mb-4 tracking-tight">
                                            {feature.title}
                                        </h3>
                                        <p className="text-base text-slate-600 leading-relaxed mb-6 max-w-lg">
                                            {feature.description}
                                        </p>

                                        <ul className="space-y-2">
                                            {feature.bullets.map((item, i) => (
                                                <li key={i} className="flex items-center gap-3 text-slate-700 font-medium text-sm md:text-base">
                                                    <div className="p-1 rounded-full bg-green-100 text-[#00A947]">
                                                        <CheckCircle2 size={14} strokeWidth={3} />
                                                    </div>
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </motion.div>
                                </div>

                                {/* Right Column: Animation Component */}
                                <div className="order-1 md:order-2 w-full flex items-center justify-center">
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9, x: 30 }}
                                        whileInView={{ opacity: 1, scale: 1, x: 0 }}
                                        viewport={{ once: true, amount: 0.1 }}
                                        transition={{ duration: 0.6, ease: "backOut" }}
                                        className="w-full h-[320px] max-w-xl rounded-3xl overflow-hidden shadow-sm bg-white"
                                    >
                                        {feature.component}
                                    </motion.div>
                                </div>

                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
