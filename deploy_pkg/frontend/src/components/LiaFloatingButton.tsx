import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import { useEffect, useState } from 'react';

interface LiaFloatingButtonProps {
    onClick: () => void;
    message?: string; // Optional message bubble content
    className?: string; // To allow external positioning if needed, though fixed positioning is built-in
}

export const LiaFloatingButton = ({ onClick, message, className = "" }: LiaFloatingButtonProps) => {
    const [animationData, setAnimationData] = useState<object | null>(null);

    useEffect(() => {
        fetch('/lotties/meta-ai-logo.json')
            .then(res => res.json())
            .then(data => setAnimationData(data))
            .catch(err => console.error("Failed to load Meta AI Lottie:", err));
    }, []);

    return (
        <div className={`fixed bottom-8 right-8 z-50 flex flex-col-reverse items-end gap-4 pointer-events-none ${className}`}>
            {/* Button */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClick}
                className="pointer-events-auto relative w-20 h-20 group outline-none peer"
            >
                {/* Lottie Animation - Direct as button */}
                <div className="w-full h-full">
                    {animationData && (
                        <Lottie
                            animationData={animationData}
                            loop
                            autoplay
                            style={{ width: '100%', height: '100%' }}
                        />
                    )}
                </div>
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
