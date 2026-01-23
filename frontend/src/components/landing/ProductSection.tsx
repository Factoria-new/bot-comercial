import { motion } from "framer-motion";
import { CSSProperties } from "react";

interface PositionStyle {
    // Posicionamento do container (use em px, %, ou rem)
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
    // Alinhamento do texto
    textAlign?: "left" | "center" | "right";
    // Largura máxima do container
    maxWidth?: string;
}

interface Feature {
    title: string;
    description: string;
    bullets: string[];
    image: string;
    titleStyle: PositionStyle;   // Posicionamento do título
    textStyle: PositionStyle;    // Posicionamento da descrição e bullets
}

const features: Feature[] = [
    {
        title: "Atendimento Escalável",
        description: "Multiplique sua capacidade de atendimento sem contratar mais pessoas. Um bot para cada conversa, todas rodando ao mesmo tempo.",
        bullets: ["Múltiplas conversas simultâneas", "Respostas instantâneas 24/7", "Escale sem aumentar custos"],
        image: "/images/Cachorro.svg",
        titleStyle: {
            top: "63%",
            left: "45%",
            textAlign: "left",
            maxWidth: "1000px",
        },
        textStyle: {
            top: "78.5%",
            left: "23%",
            textAlign: "left",
            maxWidth: "100rem",
        },
    },
    {
        title: "Agente IA Personalizado",
        description: "Configure o prompt do seu bot com a personalidade da sua marca. Ele entende contexto, histórico e responde como seu melhor vendedor.",
        bullets: ["Prompt 100% personalizável", "Conexão com Google Calendar", "Responde via áudio (TTS)"],
        image: "/images/AgentePersonalizado.svg",
        titleStyle: {
            top: "10%",
            left: "40%",
            textAlign: "left",
            maxWidth: "1000px",
        },
        textStyle: {
            top: "35%",
            left: "75%",
            textAlign: "left",
            maxWidth: "100rem",
        },
    },
    {
        title: "Dashboard de Métricas",
        description: "Acompanhe cada conversa, cada lead, cada agendamento. Tudo em tempo real com atualizações automáticas via WebSocket.",
        bullets: ["Atualizações instantâneas", "Métricas de mensagens e leads", "Pergunte à Lia sobre seus dados"],
        image: "/images/DashBoardDeMetricas.svg",
        titleStyle: {
            top: "8%",
            left: "13%",
            textAlign: "center",
            maxWidth: "40rem",
        },
        textStyle: {
            top: "55%",
            left: "65%",
            textAlign: "left",
            maxWidth: "30rem",
        },
    },
    {
        title: "Integrações Poderosas",
        description: "Conecte WhatsApp, Instagram e Google Calendar em poucos cliques. Suas conversas e agendamentos sincronizados automaticamente.",
        bullets: ["WhatsApp Business", "Instagram Direct", "Google Calendar integrado"],
        image: "/images/Integracoes.svg",
        titleStyle: {
            top: "5%",
            left: "60%",
            textAlign: "center",
            maxWidth: "1000px",
        },
        textStyle: {
            top: "30%",
            left: "67%",
            textAlign: "center",
        },
    },
];

const getContainerStyle = (style: PositionStyle): CSSProperties => {
    const cssStyle: CSSProperties = {
        position: "absolute",
        maxWidth: style.maxWidth || "500px",
    };

    if (style.top) cssStyle.top = style.top;
    if (style.bottom) cssStyle.bottom = style.bottom;
    if (style.left) cssStyle.left = style.left;
    if (style.right) cssStyle.right = style.right;

    if (style.top === "50%") {
        cssStyle.transform = "translateY(-50%)";
    }

    return cssStyle;
};

export const ProductSection = () => {
    return (
        <section id="produto" className="relative scroll-mt-32">
            {/* Section Header */}
            <div className="py-24 px-6 md:px-12 text-slate-900">
                <div className="container mx-auto" style={{ maxWidth: "100%" }}>
                    <div className="text-center max-w-4xl mx-auto">
                        <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight leading-tight">
                            Seu Assistente de Vendas <br className="hidden md:block" />
                            <span>no </span>
                            <span className="text-[#00A947]">WhatsApp</span>
                        </h2>
                        <p className="text-xl text-slate-600 leading-relaxed">
                            Esqueça bots que só respondem FAQ. Nossa IA entende seu negócio, qualifica leads e agenda reuniões automaticamente.
                        </p>
                    </div>
                </div>
            </div>

            {/* Features Full-Screen */}
            {features.map((feature, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, margin: "-10%" }}
                    transition={{ duration: 0.8 }}
                    className="relative w-full overflow-hidden"
                    style={{ minHeight: 'calc(100vh - 80px)', marginBottom: '15rem' }}
                >
                    {/* Background Image */}
                    <img
                        src={feature.image}
                        alt={feature.title}
                        className="absolute inset-0 w-full h-full object-cover"
                    />

                    {/* Title - Posicionamento independente */}
                    <motion.h3
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="z-10 px-6 text-5xl md:text-7xl font-extrabold font-clash tracking-tight leading-tight text-[#00A947]"
                        style={{
                            ...getContainerStyle(feature.titleStyle),
                            textAlign: feature.titleStyle.textAlign,
                            wordSpacing: '0.5em',
                        }}
                    >
                        {feature.title}
                    </motion.h3>

                    {/* Content - Posicionamento independente */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="z-10 px-6"
                        style={getContainerStyle(feature.textStyle)}
                    >
                        <p
                            className="text-lg md:text-xl text-slate-700 leading-relaxed mb-8"
                            style={{ textAlign: feature.textStyle.textAlign }}
                        >
                            {feature.description}
                        </p>
                        <ul
                            className="space-y-2 text-base md:text-lg"
                            style={{ textAlign: feature.textStyle.textAlign }}
                        >
                            {feature.bullets.map((item, i) => (
                                <li key={i} className="text-slate-600 font-medium">
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                </motion.div>
            ))}
        </section>
    );
};
