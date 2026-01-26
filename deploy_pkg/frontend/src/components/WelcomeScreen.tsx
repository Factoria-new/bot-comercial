import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from 'lucide-react';
import { RainbowBackground } from './ui/rainbow-background';

interface WelcomeScreenProps {
    onStart: () => void;
}

const WelcomeScreen = ({ onStart }: WelcomeScreenProps) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{
                opacity: 0,
                transition: { duration: 0.5 }
            }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white text-slate-900 overflow-hidden"
        >
            {/* Background Animation */}
            <RainbowBackground />

            {/* Content Container */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.8 }}
                className="relative z-20 flex flex-col items-center max-w-4xl px-6 text-center"
            >
                {/* Logo Area */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mb-10"
                >
                    <img
                        src="/logo-header.png"
                        alt="Caji"
                        className="h-12 w-auto object-contain mx-auto drop-shadow-sm"
                    />
                </motion.div>

                {/* Headlines */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="space-y-6 mb-12"
                >
                    <h2 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 drop-shadow-sm">
                        Venha conosco criar <br />
                        <span className="text-[#00A947]">
                            seu agente de vendas
                        </span>
                    </h2>
                    <p className="text-xl md:text-2xl text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed">
                        Aumente suas vendas agora com inteligência artificial personalizada para o seu negócio.
                    </p>
                </motion.div>

                {/* CTA Button */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Button
                        onClick={onStart}
                        size="lg"
                        className="h-16 px-12 text-xl rounded-full bg-[#00A947] text-white hover:bg-[#00963f] shadow-xl shadow-[#00A947]/20 gap-3 group border-4 border-white/20"
                    >
                        <Sparkles className="w-5 h-5 text-yellow-300 group-hover:rotate-12 transition-transform" />
                        Criar Agente
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </motion.div>
            </motion.div>
        </motion.div>
    );
};

export default WelcomeScreen;
