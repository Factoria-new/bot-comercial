import { motion } from "framer-motion";
import { Calendar, Instagram, MessageCircle } from "lucide-react";

export const IntegrationsAnimation = () => {
    return (
        <div className="w-full h-full relative flex items-center justify-center bg-slate-50/50 backdrop-blur-sm rounded-3xl overflow-hidden p-8">
            {/* Central Hub - WhatsApp Logo style */}
            <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="z-20 w-24 h-24 bg-[#00A947] rounded-3xl flex items-center justify-center shadow-2xl relative"
            >
                <MessageCircle size={40} className="text-white fill-current" />
                {/* Pulse effect */}
                <div className="absolute inset-0 bg-[#00A947] rounded-3xl animate-ping opacity-20"></div>
            </motion.div>

            {/* Connecting Lines */}
            <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none">
                {/* Top Left Line */}
                <motion.line
                    x1="50%" y1="50%" x2="25%" y2="25%"
                    stroke="#CBD5E1" strokeWidth="2" strokeDasharray="6 6"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: 0.5 }}
                />
                {/* Top Right Line */}
                <motion.line
                    x1="50%" y1="50%" x2="75%" y2="25%"
                    stroke="#CBD5E1" strokeWidth="2" strokeDasharray="6 6"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: 0.5 }}
                />
                {/* Bottom Line */}
                <motion.line
                    x1="50%" y1="50%" x2="50%" y2="75%"
                    stroke="#CBD5E1" strokeWidth="2" strokeDasharray="6 6"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: 0.5 }}
                />
            </svg>


            {/* Satellites */}

            {/* Calendar - Top Left */}
            <motion.div
                initial={{ opacity: 0, x: 20, y: 20 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="absolute top-[20%] left-[20%] z-10 bg-white p-4 rounded-2xl shadow-lg border border-slate-100 flex flex-col items-center gap-2 w-28"
            >
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                    <Calendar size={20} />
                </div>
                <span className="text-xs font-semibold text-slate-600">Calendar</span>
            </motion.div>

            {/* Instagram - Top Right */}
            <motion.div
                initial={{ opacity: 0, x: -20, y: 20 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="absolute top-[20%] right-[20%] z-10 bg-white p-4 rounded-2xl shadow-lg border border-slate-100 flex flex-col items-center gap-2 w-28"
            >
                <div className="w-10 h-10 bg-pink-50 rounded-full flex items-center justify-center text-pink-500">
                    <Instagram size={20} />
                </div>
                <span className="text-xs font-semibold text-slate-600">Instagram</span>
            </motion.div>

            {/* WhatsApp Business - Bottom */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="absolute bottom-[20%] z-10 bg-white p-4 rounded-2xl shadow-lg border border-slate-100 flex flex-col items-center gap-2 w-28"
            >
                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-500">
                    <MessageCircle size={20} />
                </div>
                <span className="text-xs font-semibold text-slate-600">WhatsApp</span>
            </motion.div>

        </div>
    );
};
