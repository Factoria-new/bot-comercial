import Lottie from "lottie-react";
import scalableSupportAnimation from "../../../assets/animations/scalable-support.json";

export const ScalableSupportAnimation = () => {
    return (
        <div className="w-full h-full flex items-center justify-center p-0 md:p-4">
            <div className="w-full max-w-[400px] md:max-w-full scale-110 md:scale-100 origin-center">
                <Lottie animationData={scalableSupportAnimation} loop={true} className="w-full h-full" />
            </div>
        </div>
    );
};
