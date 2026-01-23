import { motion } from "framer-motion";

const bgFeature1 = "/images/Cachorro.jpg";

export const ProductSection = () => {
    return (
        <section
            id="produto"
            className="relative py-24 px-6 md:px-12 text-slate-900 overflow-hidden"
        >
            <div className="container mx-auto mb-32" style={{ maxWidth: "100%" }}>
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto">
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

            <div className="container mx-auto space-y-96 relative" style={{ maxWidth: "100%" }}>


                {/* Feature 1: Atendimento Escalável */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-20%" }}
                    transition={{ duration: 0.9 }}
                    className="flex flex-col items-center text-center"
                >
                    <div className="max-w-[100rem]">
                        <h3 className="text-5xl md:text-7xl font-extrabold mb-8 leading-tight" style={{ color: "#00A947" }}>
                            Atendimento Escalável
                        </h3>
                        <p className="text-xl md:text-2xl text-slate-600 mb-10 leading-relaxed">
                            Multiplique sua capacidade de atendimento sem contratar mais pessoas. Um bot para cada conversa, todas rodando ao mesmo tempo.
                        </p>
                        <ul className="space-y-3 flex flex-col items-center text-lg md:text-xl">
                            {["Múltiplas conversas simultâneas", "Respostas instantâneas 24/7", "Escale sem aumentar custos"].map((item, i) => (
                                <li key={i} className="text-slate-600 font-medium">
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="w-full max-w-6xl aspect-[4/3] bg-feature-green flex items-center justify-center shadow-2xl overflow-hidden rounded-3xl mt-16">
                        <img
                            src={bgFeature1}
                            alt="Atendimento Escalável"
                            className="w-full h-full object-cover opacity-90 hover:scale-110 transition-transform duration-700"
                        />
                    </div>
                </motion.div>

                {/* Feature 2: Agente IA Personalizado */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-20%" }}
                    transition={{ duration: 0.9 }}
                    className="flex flex-col items-center text-center"
                >
                    <div className="max-w-[100rem]">
                        <h3 className="text-5xl md:text-7xl font-extrabold mb-8 leading-tight" style={{ color: "#00A947" }}>
                            Agente IA Personalizado
                        </h3>
                        <p className="text-xl md:text-2xl text-slate-600 mb-10 leading-relaxed">
                            Configure o prompt do seu bot com a personalidade da sua marca. Ele entende contexto, histórico e responde como seu melhor vendedor.
                        </p>
                        <ul className="space-y-3 flex flex-col items-center text-lg md:text-xl">
                            {["Prompt 100% personalizável", "Conexão com Google Calendar", "Responde via áudio (TTS)"].map((item, i) => (
                                <li key={i} className="text-slate-600 font-medium">
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="w-full max-w-6xl aspect-[4/3] bg-[#030411] flex items-center justify-center shadow-2xl overflow-hidden rounded-3xl p-8 mt-16">
                        <img
                            src="/images/AgentePersonalizado.png"
                            alt="Agente IA Personalizado"
                            className="w-full h-full object-contain shadow-lg rounded-xl hover:scale-105 transition-transform duration-700"
                        />
                    </div>
                </motion.div>

                {/* Feature 3: Dashboard de Métricas */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-20%" }}
                    transition={{ duration: 0.9 }}
                    className="flex flex-col items-center text-center"
                >
                    <div className="max-w-[100rem]">
                        <h3 className="text-5xl md:text-7xl font-extrabold mb-8 leading-tight" style={{ color: "#00A947" }}>
                            Dashboard de Métricas
                        </h3>
                        <p className="text-xl md:text-2xl text-slate-600 mb-10 leading-relaxed">
                            Acompanhe cada conversa, cada lead, cada agendamento. Tudo em tempo real com atualizações automáticas via WebSocket.
                        </p>
                        <ul className="space-y-3 flex flex-col items-center text-lg md:text-xl">
                            {["Atualizações instantâneas", "Métricas de mensagens e leads", "Pergunte à Lia sobre seus dados"].map((item, i) => (
                                <li key={i} className="text-slate-600 font-medium">
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="w-full max-w-6xl aspect-[4/3] bg-[#0F0A28] flex items-center justify-center shadow-2xl overflow-hidden rounded-3xl p-8 mt-16">
                        <img
                            src="/images/DashBoardDeMetricas.png"
                            alt="Dashboard de Métricas"
                            className="w-full h-full object-contain shadow-lg rounded-xl hover:scale-105 transition-transform duration-700"
                        />
                    </div>
                </motion.div>

                {/* Feature 4: Integrações Poderosas */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-20%" }}
                    transition={{ duration: 0.9 }}
                    className="flex flex-col items-center text-center"
                >
                    <div className="max-w-[100rem]">
                        <h3 className="text-5xl md:text-7xl font-extrabold mb-8 leading-tight" style={{ color: "#00A947" }}>
                            Integrações Poderosas
                        </h3>
                        <p className="text-xl md:text-2xl text-slate-600 mb-10 leading-relaxed">
                            Conecte WhatsApp, Instagram e Google Calendar em poucos cliques. Suas conversas e agendamentos sincronizados automaticamente.
                        </p>
                        <ul className="space-y-3 flex flex-col items-center text-lg md:text-xl">
                            {["WhatsApp Business", "Instagram Direct", "Google Calendar integrado"].map((item, i) => (
                                <li key={i} className="text-slate-600 font-medium">
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="w-full max-w-6xl aspect-[4/3] bg-[#0F172A] flex items-center justify-center shadow-2xl overflow-hidden rounded-3xl p-8 mt-16">
                        <img
                            src="/images/Integracoes.png"
                            alt="Integrações Poderosas"
                            className="w-full h-full object-contain shadow-lg rounded-xl hover:scale-105 transition-transform duration-700"
                        />
                    </div>
                </motion.div>
            </div>
        </section>
    );
};
