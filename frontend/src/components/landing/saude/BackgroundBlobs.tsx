import { motion } from "framer-motion";

/**
 * BackgroundBlobs - Saude Landing Page
 * Subtle animated background decorations to break up white space.
 * Uses --saude-secondary variable.
 */
export const BackgroundBlobs = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {/* Top Right Blob */}
            <motion.div
                animate={{
                    y: [0, -20, 0],
                    x: [0, 10, 0],
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute -top-[10%] -right-[5%] w-[300px] h-[300px] rounded-full opacity-10"
                style={{ backgroundColor: 'hsl(var(--saude-secondary))' }}
            />

            {/* Bottom Left Blob */}
            <motion.div
                animate={{
                    y: [0, 20, 0],
                    x: [0, -10, 0],
                    scale: [1, 1.2, 1],
                }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                }}
                className="absolute -bottom-[10%] -left-[5%] w-[250px] h-[250px] rounded-full opacity-10"
                style={{ backgroundColor: 'hsl(var(--saude-secondary))' }}
            />

            {/* Center Right Blob (Optional, smaller) */}
            <motion.div
                animate={{
                    y: [0, -15, 0],
                    x: [0, 5, 0],
                }}
                transition={{
                    duration: 12,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2
                }}
                className="absolute top-[40%] right-[10%] w-[150px] h-[150px] rounded-full opacity-5"
                style={{ backgroundColor: 'hsl(var(--saude-secondary))' }}
            />
        </div>
    );
};

export default BackgroundBlobs;
