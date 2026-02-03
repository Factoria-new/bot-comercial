"use client";

import { motion } from "framer-motion";
import { Volume2, Volume1, VolumeX } from "lucide-react";
import { useLiaVolume } from "@/contexts/LiaVolumeContext";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";

interface LiaVolumeControlProps {
    className?: string;
    compact?: boolean;
}

export const LiaVolumeControl = ({ className, compact = false }: LiaVolumeControlProps) => {
    const { volume, setVolume, isMuted, toggleMute } = useLiaVolume();
    const [isDragging, setIsDragging] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const sliderRef = useRef<HTMLDivElement>(null);

    // Detect mobile screens
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.matchMedia("(max-width: 640px)").matches);
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const getVolumeIcon = () => {
        if (isMuted) return VolumeX;
        if (volume < 0.4) return Volume1;
        return Volume2;
    };

    const VolumeIcon = getVolumeIcon();

    const handleSliderClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!sliderRef.current) return;
        const rect = sliderRef.current.getBoundingClientRect();
        const newVolume = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        setVolume(newVolume);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging || !sliderRef.current) return;
        const rect = sliderRef.current.getBoundingClientRect();
        const newVolume = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        setVolume(newVolume);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
            return () => {
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
            };
        }
    }, [isDragging]);

    // Mobile: only show mute button, no slider
    // Desktop: show slider on hover (compact) or always (non-compact)
    const showSlider = !isMobile && (isHovered || isDragging || !compact);

    // Calculate container width based on state
    const containerWidth = isMobile ? 36 : (showSlider ? (compact ? 120 : 140) : 36);

    return (
        <motion.div
            className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-full",
                "bg-black/30 backdrop-blur-sm border border-white/10",
                "hover:bg-black/40 transition-colors",
                className
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            initial={false}
            animate={{ width: containerWidth }}
            transition={{ duration: 0.2, ease: "easeOut" }}
        >
            {/* Mute Button */}
            <button
                onClick={toggleMute}
                className={cn(
                    "p-1 rounded-full transition-all",
                    "hover:bg-white/10 active:scale-95",
                    isMuted ? "text-red-400" : "text-purple-400"
                )}
                title={isMuted ? "Ativar som" : "Silenciar"}
            >
                <VolumeIcon className="w-4 h-4" />
            </button>

            {/* Slider - Desktop only */}
            {!isMobile && (
                <motion.div
                    initial={false}
                    animate={{
                        opacity: showSlider ? 1 : 0,
                        width: showSlider ? "100%" : 0
                    }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden"
                >
                    <div
                        ref={sliderRef}
                        className="relative h-2 bg-white/10 rounded-full cursor-pointer flex-1"
                        onClick={handleSliderClick}
                        onMouseDown={() => setIsDragging(true)}
                    >
                        {/* Track Fill */}
                        <motion.div
                            className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-purple-600 to-purple-400"
                            initial={false}
                            animate={{ width: `${volume * 100}%` }}
                            transition={{ duration: 0.1 }}
                        />

                        {/* Thumb */}
                        <motion.div
                            className={cn(
                                "absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full",
                                "bg-white shadow-lg shadow-purple-500/30",
                                "border border-purple-400/50",
                                isDragging && "scale-110"
                            )}
                            initial={false}
                            animate={{ left: `calc(${volume * 100}% - 6px)` }}
                            transition={{ duration: 0.1 }}
                        />
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
};

