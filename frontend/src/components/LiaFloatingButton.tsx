import { motion } from 'framer-motion';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface LiaFloatingButtonProps {
    onClick: () => void;
    message?: string; // Optional message bubble content
    className?: string; // To allow external positioning if needed, though fixed positioning is built-in
}

export const LiaFloatingButton = ({ onClick, message, className = "" }: LiaFloatingButtonProps) => {
    return (
        <div className={`fixed bottom-8 right-8 z-50 flex flex-col-reverse items-end gap-4 pointer-events-none ${className}`}>
            {/* Button */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClick}
                className="pointer-events-auto relative w-16 h-16 group outline-none peer"
            >
                {/* Outer Glow Ring */}
                <div className="absolute inset-0 rounded-full bg-emerald-500/30 blur-md group-hover:bg-emerald-400/50 transition-colors duration-500" />

                {/* Rotating Border */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-400 via-teal-500 to-transparent p-[2px] animate-[spin_4s_linear_infinite] opacity-70 group-hover:opacity-100" />

                {/* Main Circle */}
                <div className="absolute inset-[2px] rounded-full bg-slate-950 flex items-center justify-center overflow-hidden border border-emerald-500/20 group-hover:border-emerald-500/50 transition-colors">
                    {/* Inner Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-50" />

                    {/* Lottie Animation */}
                    <div className="relative z-10 w-12 h-12 flex items-center justify-center">
                        <DotLottieReact
                            src="https://lottie.host/81c943cc-b77a-4576-b5b5-05c6c68edb7d/vtCWds8DoU.lottie"
                            loop
                            autoplay
                            style={{ width: '100%', height: '100%' }}
                        />
                    </div>
                </div>

                {/* Online Dot */}
                <div className="absolute top-0 right-0 w-4 h-4 bg-emerald-400 rounded-full border-2 border-slate-900 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
            </motion.button>

            {/* Message Popup - Only renders if message is provided */}
            {message && (
                <div
                    className="pointer-events-none bg-slate-900/40 backdrop-blur-xl border border-emerald-500/20 p-4 rounded-2xl rounded-br-sm shadow-2xl max-w-[280px] relative transition-opacity duration-300 opacity-0 peer-hover:opacity-100 mb-2"
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
                </div>
            )}
        </div>
    );
};
