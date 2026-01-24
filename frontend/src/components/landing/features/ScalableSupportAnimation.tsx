import { motion } from "framer-motion";
import { User, Bot } from "lucide-react";

export const ScalableSupportAnimation = () => {
    // Animation variants
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    const cardVariant = {
        hidden: { opacity: 0, scale: 0.8 },
        show: { opacity: 1, scale: 1 }
    };

    return (
        <div className="w-full h-full relative flex items-center justify-center bg-slate-50/50 backdrop-blur-sm rounded-3xl overflow-hidden p-8">
            <motion.div
                variants={container}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="relative w-full h-[400px] flex items-center justify-center"
            >
                {/* Connecting Lines Layer */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                    <motion.line x1="50%" y1="50%" x2="20%" y2="20%" stroke="#e2e8f0" strokeWidth="2" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.5 }} />
                    <motion.line x1="50%" y1="50%" x2="80%" y2="20%" stroke="#e2e8f0" strokeWidth="2" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.6 }} />
                    <motion.line x1="50%" y1="50%" x2="20%" y2="80%" stroke="#e2e8f0" strokeWidth="2" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.7 }} />
                    <motion.line x1="50%" y1="50%" x2="80%" y2="80%" stroke="#e2e8f0" strokeWidth="2" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.8 }} />

                    {/* Active Signal Lines (AI Answering) */}
                    <motion.circle cx="50%" cy="50%" r="4" fill="#00A947">
                        <animateMotion path="M 0 0 L -150 -150" begin="2s" dur="1s" fill="freeze" repeatCount="indefinite" />
                    </motion.circle>
                    <motion.circle cx="50%" cy="50%" r="4" fill="#00A947">
                        <animateMotion path="M 0 0 L 150 -150" begin="2.2s" dur="1s" fill="freeze" repeatCount="indefinite" />
                    </motion.circle>
                    <motion.circle cx="50%" cy="50%" r="4" fill="#00A947">
                        <animateMotion path="M 0 0 L -150 150" begin="2.4s" dur="1s" fill="freeze" repeatCount="indefinite" />
                    </motion.circle>
                    <motion.circle cx="50%" cy="50%" r="4" fill="#00A947">
                        <animateMotion path="M 0 0 L 150 150" begin="2.6s" dur="1s" fill="freeze" repeatCount="indefinite" />
                    </motion.circle>
                </svg>

                {/* Central Bot Hub */}
                <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="absolute z-20 w-24 h-24 bg-[#00A947] rounded-full flex items-center justify-center shadow-bot-glow shadow-[#00A947]/30"
                >
                    <Bot size={48} className="text-white" />
                    <div className="absolute inset-0 border-4 border-[#00A947]/20 rounded-full animate-ping"></div>
                </motion.div>

                {/* Client Cards */}
                {/* Client #1 - Top Left */}
                <motion.div variants={cardVariant} className="absolute top-[10%] left-[5%] md:left-[10%] bg-white p-4 rounded-xl shadow-lg border border-slate-100 w-48 z-10">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                            <User size={16} />
                        </div>
                        <span className="text-xs font-bold text-slate-700">Cliente #1</span>
                    </div>
                    <div className="space-y-2">
                        <motion.div initial={{ width: 0 }} whileInView={{ width: "80%" }} transition={{ delay: 1 }} className="h-2 bg-slate-100 rounded"></motion.div>
                        <motion.div initial={{ width: 0 }} whileInView={{ width: "100%" }} transition={{ delay: 2.8 }} className="h-2 bg-[#00A947]/20 rounded"></motion.div>
                    </div>
                </motion.div>

                {/* Client #2 - Top Right */}
                <motion.div variants={cardVariant} className="absolute top-[15%] right-[5%] md:right-[10%] bg-white p-4 rounded-xl shadow-lg border border-slate-100 w-48 z-10">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-purple-50 rounded-full flex items-center justify-center text-purple-500">
                            <User size={16} />
                        </div>
                        <span className="text-xs font-bold text-slate-700">Cliente #2</span>
                    </div>
                    <div className="space-y-2">
                        <motion.div initial={{ width: 0 }} whileInView={{ width: "60%" }} transition={{ delay: 1.2 }} className="h-2 bg-slate-100 rounded"></motion.div>
                        <motion.div initial={{ width: 0 }} whileInView={{ width: "90%" }} transition={{ delay: 3 }} className="h-2 bg-[#00A947]/20 rounded"></motion.div>
                    </div>
                </motion.div>

                {/* Client #3 - Bottom Left */}
                <motion.div variants={cardVariant} className="absolute bottom-[15%] left-[8%] md:left-[15%] bg-white p-4 rounded-xl shadow-lg border border-slate-100 w-48 z-10">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-orange-50 rounded-full flex items-center justify-center text-orange-500">
                            <User size={16} />
                        </div>
                        <span className="text-xs font-bold text-slate-700">Cliente #3</span>
                    </div>
                    <div className="space-y-2">
                        <motion.div initial={{ width: 0 }} whileInView={{ width: "70%" }} transition={{ delay: 1.4 }} className="h-2 bg-slate-100 rounded"></motion.div>
                        <motion.div initial={{ width: 0 }} whileInView={{ width: "85%" }} transition={{ delay: 3.2 }} className="h-2 bg-[#00A947]/20 rounded"></motion.div>
                    </div>
                </motion.div>

                {/* Client #4 - Bottom Right */}
                <motion.div variants={cardVariant} className="absolute bottom-[10%] right-[8%] md:right-[15%] bg-white p-4 rounded-xl shadow-lg border border-slate-100 w-48 z-10">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-pink-50 rounded-full flex items-center justify-center text-pink-500">
                            <User size={16} />
                        </div>
                        <span className="text-xs font-bold text-slate-700">Cliente #4</span>
                    </div>
                    <div className="space-y-2">
                        <motion.div initial={{ width: 0 }} whileInView={{ width: "90%" }} transition={{ delay: 1.6 }} className="h-2 bg-slate-100 rounded"></motion.div>
                        <motion.div initial={{ width: 0 }} whileInView={{ width: "100%" }} transition={{ delay: 3.4 }} className="h-2 bg-[#00A947]/20 rounded"></motion.div>
                    </div>
                </motion.div>

            </motion.div>
        </div>
    );
};
