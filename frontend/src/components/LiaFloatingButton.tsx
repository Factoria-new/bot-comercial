import { motion } from 'framer-motion';

interface LiaFloatingButtonProps {
    onClick: () => void;
    message?: string; // Optional message bubble content
    className?: string; // To allow external positioning if needed, though fixed positioning is built-in
}

export const LiaFloatingButton = ({ onClick, message, className = "" }: LiaFloatingButtonProps) => {
    return (
        <div className={`fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4 pointer-events-none ${className}`}>
            {/* Message Popup - Only renders if message is provided */}
            {message && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 1.5, type: 'spring', damping: 20 }}
                    className="pointer-events-auto bg-slate-900/40 backdrop-blur-xl border border-emerald-500/20 p-4 rounded-2xl rounded-br-sm shadow-2xl max-w-[280px] relative group cursor-pointer hover:bg-slate-900/60 transition-colors"
                    onClick={onClick}
                >
                    <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/30">
                            <span className="text-lg">👩‍💻</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-white/90 leading-snug font-medium">
                                {message}
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Button */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClick}
                className="pointer-events-auto relative w-16 h-16 group outline-none"
            >
                {/* Outer Glow Ring */}
                <div className="absolute inset-0 rounded-full bg-emerald-500/30 blur-md group-hover:bg-emerald-400/50 transition-colors duration-500" />

                {/* Rotating Border */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-400 via-teal-500 to-transparent p-[2px] animate-[spin_4s_linear_infinite] opacity-70 group-hover:opacity-100" />

                {/* Main Circle */}
                <div className="absolute inset-[2px] rounded-full bg-slate-950 flex items-center justify-center overflow-hidden border border-emerald-500/20 group-hover:border-emerald-500/50 transition-colors">
                    {/* Inner Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-50" />

                    {/* L Icon */}
                    <span className="relative z-10 font-bold text-3xl bg-gradient-to-br from-white to-emerald-300 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">
                        L
                    </span>
                </div>

                {/* Online Dot */}
                <div className="absolute top-0 right-0 w-4 h-4 bg-emerald-400 rounded-full border-2 border-slate-900 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
            </motion.button>
        </div>
    );
};
