import { cn } from "@/lib/utils";
import Lottie from "lottie-react";
import { useEffect, useState } from "react";

interface VideoLoaderProps {
    fullScreen?: boolean;
    size?: number | string;
    className?: string;
}

const VideoLoader = ({ fullScreen = true, size = 300, className }: VideoLoaderProps) => {
    const [animationData, setAnimationData] = useState<any>(null);

    useEffect(() => {
        fetch("/lotties/Ripple-loading-animation.json")
            .then((response) => response.json())
            .then((data) => setAnimationData(data))
            .catch((error) => console.error("Error loading animation:", error));
    }, []);

    if (!animationData) return null;

    const content = (
        <div
            className={cn("flex items-center justify-center opacity-80", className)}
            style={{ width: size, height: size }}
        >
            <Lottie
                animationData={animationData}
                loop={true}
                autoplay={true}
                style={{ width: "100%", height: "100%" }}
            />
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617]">
                {content}
            </div>
        );
    }

    return <div className="flex items-center justify-center w-full">{content}</div>;
};

export default VideoLoader;
