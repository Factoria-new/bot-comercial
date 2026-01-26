"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface TypewriterTextProps {
    text: string;
    speed?: number;
    className?: string;
    paused?: boolean;
    onComplete?: () => void;
}

export function TypewriterText({
    text,
    speed = 30,
    className,
    paused = false,
    onComplete
}: TypewriterTextProps) {
    const [displayedText, setDisplayedText] = useState("");
    const [currentIndex, setCurrentIndex] = useState(0);

    // Provide a way to instantly show full text if it changes abruptly or for accessibility
    useEffect(() => {
        setDisplayedText("");
        setCurrentIndex(0);
    }, [text]);

    useEffect(() => {
        if (paused) return; // Do nothing if paused

        if (currentIndex < text.length) {
            const timeout = setTimeout(() => {
                setDisplayedText((prev) => prev + text[currentIndex]);
                setCurrentIndex((prev) => prev + 1);
            }, speed);

            return () => clearTimeout(timeout);
        } else if (onComplete) {
            onComplete();
        }
    }, [currentIndex, text, speed, onComplete, paused]);

    return (
        <span className={cn("inline-block", className)}>
            {displayedText}
            {currentIndex < text.length && (
                <span className="animate-pulse inline-block ml-0.5 w-1 h-[1em] bg-emerald-500 align-middle" />
            )}
        </span>
    );
}
