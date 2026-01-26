import Lottie from "lottie-react";
import scalableSupportAnimation from "../../../assets/animations/scalable-support.json";

export const ScalableSupportAnimation = () => {
    return <Lottie animationData={scalableSupportAnimation} loop={true} className="w-full h-full" />;
};
