
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from 'lucide-react';

interface WelcomeScreenProps {
    onStart: () => void;
}

const WelcomeScreen = ({ onStart }: WelcomeScreenProps) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{
                opacity: 1, // Keep background visible for smooth transition
                backgroundColor: "#020617", // Match AgentCreator
                transition: { duration: 0.8, ease: "easeInOut" }
            }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white text-slate-900 overflow-hidden"
        >
            <motion.div
                exit={{ opacity: 0, transition: { duration: 0.5 } }}
                className="relative z-10 flex flex-col items-center max-w-4xl px-6 text-center"
            >
                {/* Logo Area */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mb-12"
                >
                    <h1 className="text-2xl font-bold tracking-tighter flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white">
                            C
                        </div>
                        Caji
                    </h1>
                </motion.div>

                {/* Headlines */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="space-y-6 mb-16"
                >
                    <h2 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900">
                        Venha conosco criar <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                            seu agente de vendas
                        </span>
                    </h2>
                    <p className="text-xl md:text-2xl text-slate-600 font-light max-w-2xl mx-auto">
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
                        className="h-16 px-10 text-xl rounded-full bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-200 gap-3 group"
                    >
                        <Sparkles className="w-5 h-5 text-yellow-400 group-hover:rotate-12 transition-transform" />
                        Criar Agente
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </motion.div>
            </motion.div>

            {/* Decorative Background Elements */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(120,119,198,0.1),transparent_50%)]" />
                <motion.div
                    animate={{
                        y: [0, -20, 0],
                        rotate: [0, 5, 0],
                        scale: [1, 1.05, 1]
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[20%] right-[10%] w-64 h-64 bg-purple-100 rounded-full blur-3xl opacity-60"
                />
                <motion.div
                    animate={{
                        y: [0, 30, 0],
                        rotate: [0, -10, 0],
                        scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-[10%] left-[10%] w-72 h-72 bg-blue-100 rounded-full blur-3xl opacity-60"
                />
            </div>
        </motion.div>
    );
};

export default WelcomeScreen;
