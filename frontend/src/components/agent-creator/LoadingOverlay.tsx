import { motion, AnimatePresence } from "framer-motion";
import VideoLoader from "../VideoLoader";

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
                        <VideoLoader fullScreen={false} size={200} className="mb-6 mix-blend-screen" />

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
