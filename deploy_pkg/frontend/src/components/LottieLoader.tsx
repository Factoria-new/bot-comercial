import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { cn } from "@/lib/utils";

interface LottieLoaderProps {
    fullScreen?: boolean;
    size?: number;
    className?: string;
}

const LottieLoader = ({ fullScreen = true, size = 300, className }: LottieLoaderProps) => {
    const content = (
        <div
            className={cn("opacity-80", className)}
            style={{ width: size, height: size }}
        >
            <DotLottieReact
                src="https://lottie.host/a0fe87bb-974c-4974-8747-3add78b97a78/q4e4aAdKah.lottie"
                loop
                autoplay
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

export default LottieLoader;
