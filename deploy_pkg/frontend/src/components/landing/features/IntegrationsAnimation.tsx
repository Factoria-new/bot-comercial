import { useState, useEffect } from "react";
import Lottie from "lottie-react";
import {
    SiFacebook,
    SiInstagram,
    SiGmail,
    SiGooglesheets,
    SiShopify,
    SiStripe,
    SiTiktok
} from "react-icons/si";
import { FaXTwitter } from "react-icons/fa6";

const iconConfigs = [
    // Orbit 1 (Inner)
    [
        { Icon: SiInstagram, color: "#E4405F" },
        { Icon: SiGmail, color: "#EA4335" },
        { Icon: SiFacebook, color: "#1877F2" },
        { Icon: SiGooglesheets, color: "#34A853" },
    ],
    // Orbit 2 (Outer)
    [
        { Icon: SiShopify, color: "#95BF47" },
        { Icon: FaXTwitter, color: "#000000" },
        { Icon: SiStripe, color: "#635BFF" },
        { Icon: SiTiktok, color: "#000000" },
    ]
];

export const IntegrationsAnimation = () => {
    const [lottieData, setLottieData] = useState<any>(null);

    useEffect(() => {
        fetch("/lotties/meta-ai-logo.json")
            .then(res => res.json())
            .then(data => setLottieData(data))
            .catch(err => console.error("Error loading lottie:", err));
    }, []);

    return (
        <div className="w-full h-full flex items-center justify-center p-4 min-h-[350px] overflow-hidden">
            <div className="relative flex items-center justify-center">

                {/* Central Hub - Lottie */}
                <div className="z-20 w-28 h-28 flex items-center justify-center relative">
                    {lottieData ? (
                        <Lottie animationData={lottieData} loop={true} className="w-full h-full transform scale-125" />
                    ) : (
                        <div className="w-full h-full bg-slate-100 animate-pulse rounded-full" />
                    )}
                </div>

                {/* Orbits */}
                {iconConfigs.map((orbitIcons, orbitIndex) => {
                    const orbitSize = 200 + (orbitIndex * 120); // 200px (inner), 320px (outer)
                    const duration = 25 + (orbitIndex * 10); // Different speeds
                    const reverse = orbitIndex % 2 === 1; // Alternate direction

                    return (
                        <div
                            key={orbitIndex}
                            className="absolute rounded-full border border-dashed border-slate-200"
                            style={{
                                width: orbitSize,
                                height: orbitSize,
                                animation: `spin ${duration}s linear infinite ${reverse ? 'reverse' : ''}`
                            }}
                        >
                            {orbitIcons.map((config, iconIndex) => {
                                const angleStep = 360 / orbitIcons.length;
                                const angle = iconIndex * angleStep;

                                return (
                                    <div
                                        key={iconIndex}
                                        className="absolute top-1/2 left-1/2"
                                        style={{
                                            transform: `rotate(${angle}deg) translate(${orbitSize / 2}px) rotate(-${angle}deg)`,
                                        }}
                                    >
                                        <div className="transform -translate-x-1/2 -translate-y-1/2">
                                            <div
                                                className="bg-white p-2.5 rounded-full shadow-md border border-slate-100 flex items-center justify-center"
                                                style={{
                                                    width: 40,
                                                    height: 40,
                                                    animation: `spin ${duration}s linear infinite ${reverse ? 'normal' : 'reverse'}`
                                                }}
                                            >
                                                <config.Icon size={20} style={{ color: config.color }} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};
