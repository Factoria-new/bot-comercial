import { useMemo } from 'react';

export const RainbowBackground = () => {
    // Configuration from user request
    const PURPLE = "rgb(232, 121, 249)";
    const BLUE = "rgb(96, 165, 250)";
    const GREEN = "rgb(94, 234, 212)";
    const LENGTH = 25;
    const ANIMATION_TIME = 45; // seconds

    // Pre-calculate the bars to avoid re-calculation on render
    const bars = useMemo(() => {
        return Array.from({ length: LENGTH }).map((_, i) => {
            const index = i + 1; // 1-based index for math matching SCSS

            // Random color selection logic simulation
            // Since we want consistency, we can pick based on index or just simple math instead of pure random for SSR stability
            const r = Math.floor(Math.random() * 6) + 1;

            let colors = [PURPLE, BLUE, GREEN];
            if (r === 2) colors = [PURPLE, GREEN, BLUE];
            else if (r === 3) colors = [GREEN, PURPLE, BLUE];
            else if (r === 4) colors = [GREEN, BLUE, PURPLE];
            else if (r === 5) colors = [BLUE, GREEN, PURPLE];
            else if (r === 6) colors = [BLUE, PURPLE, GREEN];
            // r=1 is default

            const delay = -(index / LENGTH * ANIMATION_TIME);
            const duration = ANIMATION_TIME - (ANIMATION_TIME / LENGTH / 2 * index);

            // Construct box-shadow string
            // box-shadow: -130px 0 80px 40px white, -50px 0 50px 25px nth($colors, 1), ...
            const boxShadow = `
                -130px 0 80px 40px white, 
                -50px 0 50px 25px ${colors[0]},
                0 0 50px 25px ${colors[1]}, 
                50px 0 50px 25px ${colors[2]},
                130px 0 80px 40px white
            `;

            return {
                id: i,
                style: {
                    boxShadow,
                    animation: `slide ${duration}s linear infinite`,
                    animationDelay: `${delay}s`,
                    // Base styles for .rainbow child
                    height: '100vh',
                    width: '0',
                    top: '0',
                    position: 'absolute' as const,
                    transform: 'rotate(10deg)',
                    transformOrigin: 'top right',
                    right: '-25vw', // Starting position
                }
            };
        });
    }, []);

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-white">
            <style>
                {`
                    @keyframes slide {
                        from { right: -25vw; }
                        to { right: 125vw; }
                    }
                `}
            </style>
            {bars.map(bar => (
                <div key={bar.id} style={bar.style} />
            ))}

            {/* Overlay h and v from SCSS */}
            <div
                style={{
                    boxShadow: '0 0 50vh 40vh white',
                    width: '100vw',
                    height: '0',
                    bottom: '0',
                    left: '0',
                    position: 'absolute',
                    zIndex: 10
                }}
            />
            <div
                style={{
                    boxShadow: '0 0 35vw 25vw white',
                    width: '0',
                    height: '100vh',
                    bottom: '0',
                    left: '0',
                    position: 'absolute',
                    zIndex: 10
                }}
            />
        </div>
    );
};
