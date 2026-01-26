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
    const [squares, setSquares] = useState<Array<{ x: number; y: number; id: number }>>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    // Track mouse position globally to handle scroll updates
    const mousePosRef = useRef<{ x: number; y: number } | null>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const updateSquare = (x: number, y: number) => {
            const rect = container.getBoundingClientRect();
            // Calculate relative coordinates
            const relX = x - rect.left;
            const relY = y - rect.top;

            // Check if mouse is actually inside the container
            if (relX < 0 || relY < 0 || relX > rect.width || relY > rect.height) {
                return;
            }

            const col = Math.floor(relX / width);
            const row = Math.floor(relY / height);

            const newX = col * width;
            const newY = row * height;

            setSquares((prev) => {
                // Check if this specific square is already active (to avoid duplicates/flicker)
                const exists = prev.find(s => s.x === newX && s.y === newY && Date.now() - s.id < 100);
                if (exists) return prev;

                return [...prev, { x: newX, y: newY, id: Date.now() }];
            });
        };

        const handleMouseMove = (e: MouseEvent) => {
            mousePosRef.current = { x: e.clientX, y: e.clientY };
            updateSquare(e.clientX, e.clientY);
        };

        window.addEventListener("mousemove", handleMouseMove);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
        };
    }, [width, height]);

    // Timer to clean up old squares
    useEffect(() => {
        const interval = setInterval(() => {
            setSquares((prev) => {
                const now = Date.now();
                // Remove squares older than 2 seconds (adjust duration as needed)
                return prev.filter(s => now - s.id < 1000);
            });
        }, 100);

        return () => clearInterval(interval);
    }, []);

    return (
        <div
            ref={containerRef}
            className={cn("inset-0 pointer-events-none select-none", className)}
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
                    <style>
                        {`
                            @keyframes grid-fade-out {
                                0% { opacity: 1; }
                                100% { opacity: 0; }
                            }
                            @keyframes grid-color-shift {
                                0% { fill: rgba(34, 197, 94, 0.4); }
                                100% { fill: rgba(255, 255, 255, 1); }
                            }
                            .grid-square-fade {
                                animation: grid-fade-out 1s ease-out forwards, grid-color-shift 1s linear forwards;
                            }
                        `}
                    </style>
                </defs>

                {/* Trail Rects */}
                {/* Trail Rects */}
                {squares.map(({ x, y, id }) => (
                    <rect
                        key={id}
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        className="grid-square-fade"
                        style={{ pointerEvents: 'none' }}
                    />
                ))}

                <rect width="100%" height="100%" strokeWidth={0} fill="url(#grid-pattern)" />
            </svg>
        </div>
    );
}
