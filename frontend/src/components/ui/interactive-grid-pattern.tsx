import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface InteractiveGridPatternProps {
    width?: number;
    height?: number;
    className?: string;
    squaresClassName?: string;
}

export function InteractiveGridPattern({
    width = 80,
    height = 80,
    className,
    squaresClassName,
}: InteractiveGridPatternProps) {
    const [trail, setTrail] = useState<Array<{ x: number; y: number; id: number }>>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const lastPosRef = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const parent = container.parentElement;
        if (!parent) return;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = parent.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const col = Math.floor(x / width);
            const row = Math.floor(y / height);

            const newX = col * width;
            const newY = row * height;

            // Only add if position changed
            if (lastPosRef.current?.x !== newX || lastPosRef.current?.y !== newY) {
                lastPosRef.current = { x: newX, y: newY };

                setTrail(prev => {
                    const newTrail = [...prev, { x: newX, y: newY, id: Date.now() }];
                    // Keep last 10 items for the trail
                    return newTrail.slice(-10);
                });
            }
        };

        const handleMouseLeave = () => {
            setTrail([]);
            lastPosRef.current = null;
        };

        parent.addEventListener("mousemove", handleMouseMove);
        parent.addEventListener("mouseleave", handleMouseLeave);

        return () => {
            parent.removeEventListener("mousemove", handleMouseMove);
            parent.removeEventListener("mouseleave", handleMouseLeave);
        };
    }, [width, height]);

    return (
        <div
            ref={containerRef}
            className={cn("absolute inset-0 pointer-events-none select-none z-0", className)}
        >
            <svg
                className="absolute inset-0 w-full h-full stroke-black/5"
                style={{ stroke: 'rgba(0, 0, 0, 0.04)' }}
            >
                <defs>
                    <pattern
                        id="grid-pattern"
                        width={width}
                        height={height}
                        patternUnits="userSpaceOnUse"
                        x={-1}
                        y={-1}
                    >
                        <path
                            d={`M.5 ${height}V.5H${width}`}
                            fill="none"
                            strokeWidth={1}
                        />
                    </pattern>
                </defs>

                {/* Trail Rects */}
                {trail.map((pos, index) => {
                    // Calculate "freshness" (0 to 1)
                    // Index 0 is oldest (tail), Index length-1 is newest (head)
                    const ratio = index / Math.max(1, trail.length - 1);

                    // Gradient: Orange (#FF621E) -> Green (#00A947)
                    // RGB Interpolation
                    const r = Math.round(255 + (0 - 255) * ratio);
                    const g = Math.round(98 + (169 - 98) * ratio);
                    const b = Math.round(30 + (71 - 30) * ratio);

                    // Opacity: Fade out tail (0.1 to 0.4)
                    const opacity = 0.05 + (0.2 * ratio);

                    return (
                        <rect
                            key={pos.id}
                            x={pos.x}
                            y={pos.y}
                            width={width}
                            height={height}
                            fill={`rgba(${r}, ${g}, ${b}, ${opacity})`}
                            className="transition-all duration-300 ease-out"
                        />
                    );
                })}

                <rect width="100%" height="100%" strokeWidth={0} fill="url(#grid-pattern)" />
            </svg>
        </div>
    );
}
