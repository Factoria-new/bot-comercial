import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

interface LoadingOverlayProps {
    isSwitchingToTest: boolean;
    loadingMessageIndex: number;
    loadingMessages: string[];
}

export const LoadingOverlay = ({ isSwitchingToTest, loadingMessageIndex, loadingMessages }: LoadingOverlayProps) => {
    return (
        <AnimatePresence>
            {isSwitchingToTest && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-[60] flex flex-col items-center justify-center p-0 m-0"
                    style={{ background: 'transparent', backgroundColor: 'transparent', boxShadow: 'none' }}
                >
                    <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 mb-6 relative">
                            <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-purple-500 animate-spin" />
                            <div className="absolute inset-2 rounded-full border-t-2 border-l-2 border-blue-500 animate-spin reverse duration-2000" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.p
                                key={loadingMessageIndex}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="text-lg font-medium text-white text-center min-h-[30px]"
                                style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
                            >
                                {loadingMessages[loadingMessageIndex]}
                            </motion.p>
                        </AnimatePresence>

                        <p className="text-xs text-white/40 mt-2">Isso pode levar alguns segundos</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
