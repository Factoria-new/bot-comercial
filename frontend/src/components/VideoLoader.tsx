import { cn } from "@/lib/utils";

interface VideoLoaderProps {
    fullScreen?: boolean;
    size?: number | string;
    className?: string;
}

const VideoLoader = ({ fullScreen = true, size = 300, className }: VideoLoaderProps) => {
    const content = (
        <video
            autoPlay
            loop
            muted
            playsInline
            className={cn("opacity-80 object-cover rounded-full", className)}
            style={{ width: size, height: size }}
        >
            <source src="/videos/Ripple-loading-animation.webm" type="video/webm" />
        </video>
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
