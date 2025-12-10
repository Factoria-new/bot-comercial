"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Sparkles, Loader2, Check } from "lucide-react";


interface PupilProps {
    size?: number;
    maxDistance?: number;
    pupilColor?: string;
    forceLookX?: number;
    forceLookY?: number;
}

const Pupil = ({
    size = 12,
    maxDistance = 5,
    pupilColor = "black",
    forceLookX,
    forceLookY
}: PupilProps) => {
    const [mouseX, setMouseX] = useState<number>(0);
    const [mouseY, setMouseY] = useState<number>(0);
    const pupilRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMouseX(e.clientX);
            setMouseY(e.clientY);
        };

        window.addEventListener("mousemove", handleMouseMove);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
        };
    }, []);

    const calculatePupilPosition = () => {
        if (!pupilRef.current) return { x: 0, y: 0 };

        // If forced look direction is provided, use that instead of mouse tracking
        if (forceLookX !== undefined && forceLookY !== undefined) {
            return { x: forceLookX, y: forceLookY };
        }

        const pupil = pupilRef.current.getBoundingClientRect();
        const pupilCenterX = pupil.left + pupil.width / 2;
        const pupilCenterY = pupil.top + pupil.height / 2;

        const deltaX = mouseX - pupilCenterX;
        const deltaY = mouseY - pupilCenterY;
        const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);

        const angle = Math.atan2(deltaY, deltaX);
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;

        return { x, y };
    };

    const pupilPosition = calculatePupilPosition();

    return (
        <div
            ref={pupilRef}
            className="rounded-full"
            style={{
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: pupilColor,
                transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
                transition: 'transform 0.1s ease-out',
            }}
        />
    );
};




interface EyeBallProps {
    size?: number;
    pupilSize?: number;
    maxDistance?: number;
    eyeColor?: string;
    pupilColor?: string;
    isBlinking?: boolean;
    forceLookX?: number;
    forceLookY?: number;
}

const EyeBall = ({
    size = 48,
    pupilSize = 16,
    maxDistance = 10,
    eyeColor = "white",
    pupilColor = "black",
    isBlinking = false,
    forceLookX,
    forceLookY
}: EyeBallProps) => {
    const [mouseX, setMouseX] = useState<number>(0);
    const [mouseY, setMouseY] = useState<number>(0);
    const eyeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMouseX(e.clientX);
            setMouseY(e.clientY);
        };

        window.addEventListener("mousemove", handleMouseMove);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
        };
    }, []);

    const calculatePupilPosition = () => {
        if (!eyeRef.current) return { x: 0, y: 0 };

        // If forced look direction is provided, use that instead of mouse tracking
        if (forceLookX !== undefined && forceLookY !== undefined) {
            return { x: forceLookX, y: forceLookY };
        }

        const eye = eyeRef.current.getBoundingClientRect();
        const eyeCenterX = eye.left + eye.width / 2;
        const eyeCenterY = eye.top + eye.height / 2;

        const deltaX = mouseX - eyeCenterX;
        const deltaY = mouseY - eyeCenterY;
        const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);

        const angle = Math.atan2(deltaY, deltaX);
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;

        return { x, y };
    };

    const pupilPosition = calculatePupilPosition();

    return (
        <div
            ref={eyeRef}
            className="rounded-full flex items-center justify-center transition-all duration-150"
            style={{
                width: `${size}px`,
                height: isBlinking ? '2px' : `${size}px`,
                backgroundColor: eyeColor,
                overflow: 'hidden',
            }}
        >
            {!isBlinking && (
                <div
                    className="rounded-full"
                    style={{
                        width: `${pupilSize}px`,
                        height: `${pupilSize}px`,
                        backgroundColor: pupilColor,
                        transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
                        transition: 'transform 0.1s ease-out',
                    }}
                />
            )}
        </div>
    );
};


interface AnimatedCharactersLoginProps {
    onSubmit: (email: string, password: string) => Promise<void>;
    isLoading?: boolean;
    error?: string;
    isSuccess?: boolean;
    brandName?: string;
    brandLogo?: string;
}

export function AnimatedCharactersLogin({
    onSubmit,
    isLoading = false,
    error = "",
    isSuccess = false,
    brandName = "Factoria",
    brandLogo
}: AnimatedCharactersLoginProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [mouseX, setMouseX] = useState<number>(0);
    const [mouseY, setMouseY] = useState<number>(0);
    const [isPurpleBlinking, setIsPurpleBlinking] = useState(false);
    const [isBlackBlinking, setIsBlackBlinking] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false);
    const [isPurplePeeking, setIsPurplePeeking] = useState(false);
    const [isHoveringButton, setIsHoveringButton] = useState(false);
    const [isSad, setIsSad] = useState(false);
    const [isSurprised, setIsSurprised] = useState(false);
    const [savedEmails, setSavedEmails] = useState<string[]>([]);
    const purpleRef = useRef<HTMLDivElement>(null);
    const blackRef = useRef<HTMLDivElement>(null);
    const yellowRef = useRef<HTMLDivElement>(null);
    const orangeRef = useRef<HTMLDivElement>(null);

    // Carregar emails salvos do localStorage
    useEffect(() => {
        const stored = localStorage.getItem('savedEmails');
        if (stored) {
            try {
                setSavedEmails(JSON.parse(stored));
            } catch (e) {
                console.error('Erro ao carregar emails:', e);
            }
        }
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMouseX(e.clientX);
            setMouseY(e.clientY);
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    // Blinking effect for purple character
    useEffect(() => {
        const getRandomBlinkInterval = () => Math.random() * 4000 + 3000;

        const scheduleBlink = () => {
            const blinkTimeout = setTimeout(() => {
                setIsPurpleBlinking(true);
                setTimeout(() => {
                    setIsPurpleBlinking(false);
                    scheduleBlink();
                }, 150);
            }, getRandomBlinkInterval());

            return blinkTimeout;
        };

        const timeout = scheduleBlink();
        return () => clearTimeout(timeout);
    }, []);

    // Blinking effect for black character
    useEffect(() => {
        const getRandomBlinkInterval = () => Math.random() * 4000 + 3000;

        const scheduleBlink = () => {
            const blinkTimeout = setTimeout(() => {
                setIsBlackBlinking(true);
                setTimeout(() => {
                    setIsBlackBlinking(false);
                    scheduleBlink();
                }, 150);
            }, getRandomBlinkInterval());

            return blinkTimeout;
        };

        const timeout = scheduleBlink();
        return () => clearTimeout(timeout);
    }, []);

    // Looking at each other animation when typing starts
    useEffect(() => {
        if (isTyping) {
            setIsLookingAtEachOther(true);
            const timer = setTimeout(() => {
                setIsLookingAtEachOther(false);
            }, 800);
            return () => clearTimeout(timer);
        } else {
            setIsLookingAtEachOther(false);
        }
    }, [isTyping]);

    // Purple sneaky peeking animation when typing password and it's visible
    useEffect(() => {
        if (password.length > 0 && showPassword) {
            const schedulePeek = () => {
                const peekInterval = setTimeout(() => {
                    setIsPurplePeeking(true);
                    setTimeout(() => {
                        setIsPurplePeeking(false);
                    }, 800);
                }, Math.random() * 3000 + 2000);
                return peekInterval;
            };

            const firstPeek = schedulePeek();
            return () => clearTimeout(firstPeek);
        } else {
            setIsPurplePeeking(false);
        }
    }, [password, showPassword, isPurplePeeking]);

    const calculatePosition = (ref: React.RefObject<HTMLDivElement | null>) => {
        if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 };

        const rect = ref.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 3;

        const deltaX = mouseX - centerX;
        const deltaY = mouseY - centerY;

        const faceX = Math.max(-15, Math.min(15, deltaX / 20));
        const faceY = Math.max(-10, Math.min(10, deltaY / 30));
        const bodySkew = Math.max(-6, Math.min(6, -deltaX / 120));

        return { faceX, faceY, bodySkew };
    };

    const purplePos = calculatePosition(purpleRef);
    const blackPos = calculatePosition(blackRef);
    const yellowPos = calculatePosition(yellowRef);
    const orangePos = calculatePosition(orangeRef);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Salvar email no localStorage (máximo 5 emails)
        if (email && !savedEmails.includes(email)) {
            const updatedEmails = [email, ...savedEmails].slice(0, 5);
            setSavedEmails(updatedEmails);
            localStorage.setItem('savedEmails', JSON.stringify(updatedEmails));
        }

        await onSubmit(email, password);
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Left Content Section */}
            <div className="relative hidden lg:flex flex-col justify-center bg-white p-12 text-gray-800 overflow-hidden">
                {/* Main content with characters */}
                <div className="relative z-20 flex items-end justify-end h-[500px] pr-[-50px]">
                    {/* Cartoon Characters */}
                    <div className="relative" style={{ width: '550px', height: '400px', marginRight: '-100px' }}>
                        {/* Ground Shadow */}
                        <div
                            className="absolute z-0"
                            style={{
                                bottom: '-65px',
                                left: '10px',
                                width: '430px',
                                height: '20px',
                                background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.05) 50%, transparent 70%)',
                                borderRadius: '50%',
                            }}
                        />

                        {/* Wooden Platform/Crate - Under characters */}
                        <div
                            className="absolute z-0"
                            style={{
                                bottom: '-55px',
                                left: '0px',
                                width: '450px',
                                height: '55px',
                            }}
                        >
                            {/* Wooden crate SVG with legs */}
                            <svg width="100%" height="100%" viewBox="0 0 450 55" preserveAspectRatio="none">
                                {/* Wooden legs/feet */}
                                <rect x="20" y="40" width="25" height="15" fill="#6B4423" rx="2" />
                                <rect x="125" y="40" width="25" height="15" fill="#6B4423" rx="2" />
                                <rect x="300" y="40" width="25" height="15" fill="#6B4423" rx="2" />
                                <rect x="405" y="40" width="25" height="15" fill="#6B4423" rx="2" />
                                {/* Leg highlights */}
                                <rect x="20" y="40" width="25" height="4" fill="#7A4F26" rx="2" />
                                <rect x="125" y="40" width="25" height="4" fill="#7A4F26" rx="2" />
                                <rect x="300" y="40" width="25" height="4" fill="#7A4F26" rx="2" />
                                <rect x="405" y="40" width="25" height="4" fill="#7A4F26" rx="2" />

                                {/* Main wood surface */}
                                <rect x="0" y="0" width="450" height="40" fill="#8B5A2B" rx="4" />
                                {/* Wood planks */}
                                <rect x="0" y="0" width="90" height="40" fill="#7A4F26" rx="4" />
                                <rect x="90" y="0" width="90" height="40" fill="#8B5A2B" />
                                <rect x="180" y="0" width="90" height="40" fill="#7A4F26" />
                                <rect x="270" y="0" width="90" height="40" fill="#8B5A2B" />
                                <rect x="360" y="0" width="90" height="40" fill="#7A4F26" rx="4" />
                                {/* Top highlight */}
                                <rect x="0" y="0" width="450" height="6" fill="#9D6B3A" rx="4" />
                                {/* Bottom shadow */}
                                <rect x="0" y="34" width="450" height="6" fill="#6B4423" rx="4" />
                                {/* Vertical wood lines */}
                                <line x1="90" y1="0" x2="90" y2="40" stroke="#5D3A1A" strokeWidth="2" />
                                <line x1="180" y1="0" x2="180" y2="40" stroke="#5D3A1A" strokeWidth="2" />
                                <line x1="270" y1="0" x2="270" y2="40" stroke="#5D3A1A" strokeWidth="2" />
                                <line x1="360" y1="0" x2="360" y2="40" stroke="#5D3A1A" strokeWidth="2" />
                            </svg>
                        </div>

                        {/* Purple tall rectangle character - Back layer */}
                        <div
                            ref={purpleRef}
                            className="absolute bottom-0 transition-all duration-700 ease-in-out"
                            style={{
                                left: '70px',
                                width: '180px',
                                height: (isTyping || (password.length > 0 && !showPassword)) ? '440px' : '400px',
                                backgroundColor: '#6C3FF5',
                                borderRadius: '10px 10px 0 0',
                                zIndex: 1,
                                overflow: 'hidden',
                                boxShadow: '0 10px 40px rgba(108, 63, 245, 0.3)',
                                transform: (password.length > 0 && showPassword)
                                    ? `skewX(0deg)`
                                    : (isTyping || (password.length > 0 && !showPassword))
                                        ? `skewX(${(purplePos.bodySkew || 0) - 12}deg) translateX(40px)`
                                        : `skewX(${purplePos.bodySkew || 0}deg)`,
                                transformOrigin: 'bottom center',
                            }}
                        >
                            {/* Eyes */}
                            <div
                                className="absolute flex gap-8 transition-all duration-700 ease-in-out"
                                style={{
                                    left: (password.length > 0 && showPassword) ? `${20}px` : isLookingAtEachOther ? `${55}px` : `${45 + purplePos.faceX}px`,
                                    top: (password.length > 0 && showPassword) ? `${35}px` : isLookingAtEachOther ? `${65}px` : `${40 + purplePos.faceY}px`,
                                }}
                            >
                                <EyeBall
                                    size={18}
                                    pupilSize={7}
                                    maxDistance={5}
                                    eyeColor="white"
                                    pupilColor="#2D2D2D"
                                    isBlinking={isPurpleBlinking}
                                    forceLookX={(password.length > 0 && showPassword) ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
                                    forceLookY={(password.length > 0 && showPassword) ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined}
                                />
                                <EyeBall
                                    size={18}
                                    pupilSize={7}
                                    maxDistance={5}
                                    eyeColor="white"
                                    pupilColor="#2D2D2D"
                                    isBlinking={isPurpleBlinking}
                                    forceLookX={(password.length > 0 && showPassword) ? (isPurplePeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
                                    forceLookY={(password.length > 0 && showPassword) ? (isPurplePeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined}
                                />
                            </div>
                            {/* Mouth - White, expression changes based on state */}
                            <div
                                className="absolute transition-all duration-300 ease-out"
                                style={{
                                    left: (password.length > 0 && showPassword) ? `${35}px` : isLookingAtEachOther ? `${75}px` : `${60 + purplePos.faceX}px`,
                                    top: (password.length > 0 && showPassword) ? `${70}px` : isLookingAtEachOther ? `${105}px` : `${80 + purplePos.faceY}px`,
                                    width: isHoveringButton ? '60px' : isSad ? '40px' : isSurprised ? '20px' : '60px',
                                    height: isHoveringButton ? '25px' : isSad ? '18px' : isSurprised ? '20px' : '4px',
                                    backgroundColor: 'white',
                                    borderRadius: isHoveringButton ? '0 0 30px 30px' : isSad ? '20px 20px 0 0' : isSurprised ? '50%' : '4px',
                                }}
                            />
                        </div>

                        {/* Black tall rectangle character - Middle layer */}
                        <div
                            ref={blackRef}
                            className="absolute bottom-0 transition-all duration-700 ease-in-out"
                            style={{
                                left: '240px',
                                width: '120px',
                                height: '310px',
                                backgroundColor: '#2D2D2D',
                                borderRadius: '8px 8px 0 0',
                                zIndex: 2,
                                overflow: 'hidden',
                                boxShadow: '0 10px 40px rgba(45, 45, 45, 0.4)',
                                transform: (password.length > 0 && showPassword)
                                    ? `skewX(0deg)`
                                    : isLookingAtEachOther
                                        ? `skewX(${(blackPos.bodySkew || 0) * 1.5 + 10}deg) translateX(20px)`
                                        : (isTyping || (password.length > 0 && !showPassword))
                                            ? `skewX(${(blackPos.bodySkew || 0) * 1.5}deg)`
                                            : `skewX(${blackPos.bodySkew || 0}deg)`,
                                transformOrigin: 'bottom center',
                            }}
                        >
                            {/* Eyes */}
                            <div
                                className="absolute flex gap-6 transition-all duration-700 ease-in-out"
                                style={{
                                    left: (password.length > 0 && showPassword) ? `${10}px` : isLookingAtEachOther ? `${32}px` : `${26 + blackPos.faceX}px`,
                                    top: (password.length > 0 && showPassword) ? `${28}px` : isLookingAtEachOther ? `${12}px` : `${32 + blackPos.faceY}px`,
                                }}
                            >
                                <EyeBall
                                    size={16}
                                    pupilSize={6}
                                    maxDistance={4}
                                    eyeColor="white"
                                    pupilColor="#2D2D2D"
                                    isBlinking={isBlackBlinking}
                                    forceLookX={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? 0 : undefined}
                                    forceLookY={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? -4 : undefined}
                                />
                                <EyeBall
                                    size={16}
                                    pupilSize={6}
                                    maxDistance={4}
                                    eyeColor="white"
                                    pupilColor="#2D2D2D"
                                    isBlinking={isBlackBlinking}
                                    forceLookX={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? 0 : undefined}
                                    forceLookY={(password.length > 0 && showPassword) ? -4 : isLookingAtEachOther ? -4 : undefined}
                                />
                            </div>
                            {/* Mouth - White, expression changes based on state */}
                            <div
                                className="absolute transition-all duration-300 ease-out"
                                style={{
                                    left: (password.length > 0 && showPassword) ? `${25}px` : isLookingAtEachOther ? `${40}px` : `${38 + blackPos.faceX}px`,
                                    top: (password.length > 0 && showPassword) ? `${65}px` : isLookingAtEachOther ? `${52}px` : `${72 + blackPos.faceY}px`,
                                    width: isHoveringButton ? '44px' : isSad ? '30px' : isSurprised ? '16px' : '44px',
                                    height: isHoveringButton ? '20px' : isSad ? '14px' : isSurprised ? '16px' : '4px',
                                    backgroundColor: 'white',
                                    borderRadius: isHoveringButton ? '0 0 22px 22px' : isSad ? '15px 15px 0 0' : isSurprised ? '50%' : '4px',
                                }}
                            />
                        </div>

                        {/* Orange semi-circle character - Front left */}
                        <div
                            ref={orangeRef}
                            className="absolute bottom-0 transition-all duration-700 ease-in-out"
                            style={{
                                left: '0px',
                                width: '240px',
                                height: '200px',
                                zIndex: 3,
                                backgroundColor: '#FE601E',
                                borderRadius: '120px 120px 0 0',
                                transform: (password.length > 0 && showPassword) ? `skewX(0deg)` : `skewX(${orangePos.bodySkew || 0}deg)`,
                                transformOrigin: 'bottom center',
                            }}
                        >
                            {/* Eyes - just pupils, no white */}
                            <div
                                className="absolute flex gap-8 transition-all duration-200 ease-out"
                                style={{
                                    left: (password.length > 0 && showPassword) ? `${50}px` : `${82 + (orangePos.faceX || 0)}px`,
                                    top: (password.length > 0 && showPassword) ? `${85}px` : `${90 + (orangePos.faceY || 0)}px`,
                                }}
                            >
                                <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
                                <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
                            </div>
                            {/* Mouth - Dark, expression changes based on state */}
                            <div
                                className="absolute transition-all duration-300 ease-out"
                                style={{
                                    left: (password.length > 0 && showPassword) ? `${70}px` : `${95 + (orangePos.faceX || 0)}px`,
                                    top: (password.length > 0 && showPassword) ? `${120}px` : `${125 + (orangePos.faceY || 0)}px`,
                                    width: isHoveringButton ? '50px' : isSad ? '35px' : isSurprised ? '18px' : '50px',
                                    height: isHoveringButton ? '22px' : isSad ? '16px' : isSurprised ? '18px' : '4px',
                                    backgroundColor: '#2D2D2D',
                                    borderRadius: isHoveringButton ? '0 0 25px 25px' : isSad ? '18px 18px 0 0' : isSurprised ? '50%' : '4px',
                                }}
                            />
                        </div>

                        {/* Yellow tall rectangle character - Front right */}
                        <div
                            ref={yellowRef}
                            className="absolute bottom-0 transition-all duration-700 ease-in-out"
                            style={{
                                left: '310px',
                                width: '140px',
                                height: '230px',
                                backgroundColor: '#19B159',
                                borderRadius: '70px 70px 0 0',
                                zIndex: 4,
                                transform: (password.length > 0 && showPassword) ? `skewX(0deg)` : `skewX(${yellowPos.bodySkew || 0}deg)`,
                                transformOrigin: 'bottom center',
                            }}
                        >
                            {/* Eyes - just pupils, no white */}
                            <div
                                className="absolute flex gap-6 transition-all duration-200 ease-out"
                                style={{
                                    left: (password.length > 0 && showPassword) ? `${20}px` : `${52 + (yellowPos.faceX || 0)}px`,
                                    top: (password.length > 0 && showPassword) ? `${35}px` : `${40 + (yellowPos.faceY || 0)}px`,
                                }}
                            >
                                <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
                                <Pupil size={12} maxDistance={5} pupilColor="#2D2D2D" forceLookX={(password.length > 0 && showPassword) ? -5 : undefined} forceLookY={(password.length > 0 && showPassword) ? -4 : undefined} />
                            </div>
                            {/* Mouth - Dark, expression changes based on state */}
                            <div
                                className="absolute transition-all duration-300 ease-out"
                                style={{
                                    left: (password.length > 0 && showPassword) ? `${30}px` : `${50 + (yellowPos.faceX || 0)}px`,
                                    top: (password.length > 0 && showPassword) ? `${88}px` : `${88 + (yellowPos.faceY || 0)}px`,
                                    width: isHoveringButton ? '60px' : isSad ? '40px' : isSurprised ? '18px' : '60px',
                                    height: isHoveringButton ? '22px' : isSad ? '18px' : isSurprised ? '18px' : '4px',
                                    backgroundColor: '#2D2D2D',
                                    borderRadius: isHoveringButton ? '0 0 30px 30px' : isSad ? '20px 20px 0 0' : isSurprised ? '50%' : '4px',
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Login Section */}
            <div className="flex items-center justify-center p-8 bg-white">
                <div className="w-full max-w-[420px]">
                    {/* Logo acima do título */}
                    <div className="flex items-center justify-center mb-8">
                        {brandLogo ? (
                            <img src={brandLogo} alt={brandName} className="h-12 w-auto" />
                        ) : (
                            <div className="flex items-center gap-2 text-lg font-semibold">
                                <div className="size-8 rounded-lg bg-[#00A947]/10 flex items-center justify-center">
                                    <Sparkles className="size-4 text-[#00A947]" />
                                </div>
                                <span>{brandName}</span>
                            </div>
                        )}
                    </div>

                    {/* Header */}
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-bold tracking-tight mb-2">Bem-vindo de volta!</h1>
                        <p className="text-muted-foreground text-sm">Entre com suas credenciais para acessar</p>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                autoComplete="off"
                                list="saved-emails"
                                onChange={(e) => setEmail(e.target.value)}
                                onFocus={() => setIsTyping(true)}
                                onBlur={() => setIsTyping(false)}
                                required
                                className="h-12 bg-background border-border/60 focus:border-[#00A947]"
                                style={{
                                    WebkitAppearance: 'none',
                                    MozAppearance: 'none',
                                    appearance: 'none'
                                }}
                            />
                            {savedEmails.length > 0 && (
                                <datalist id="saved-emails">
                                    {savedEmails.map((savedEmail, index) => (
                                        <option key={index} value={savedEmail} />
                                    ))}
                                </datalist>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onFocus={() => setIsSurprised(!showPassword)}
                                    onBlur={() => setIsSurprised(false)}
                                    required
                                    className="h-12 pr-10 bg-background border-border/60 focus:border-[#00A947]"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newShowPassword = !showPassword;
                                        setShowPassword(newShowPassword);
                                        // Se está focado no campo de senha, ajusta a expressão
                                        if (document.activeElement?.id === 'password') {
                                            setIsSurprised(!newShowPassword);
                                        }
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="size-5" />
                                    ) : (
                                        <Eye className="size-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <a
                                href="/"
                                className="text-sm text-gray-500 hover:text-[#00A947] transition-colors"
                            >
                                ← Voltar para Home
                            </a>
                            <a
                                href="#"
                                className="text-sm text-[#00A947] hover:underline font-medium"
                                onMouseEnter={() => setIsSad(true)}
                                onMouseLeave={() => setIsSad(false)}
                            >
                                Esqueceu a senha?
                            </a>
                        </div>

                        {error && (
                            <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-12 text-base font-medium bg-[#00A947] hover:bg-[#00A947]/90 relative overflow-hidden"
                            size="lg"
                            disabled={isLoading || isSuccess}
                            onMouseEnter={() => setIsHoveringButton(true)}
                            onMouseLeave={() => setIsHoveringButton(false)}
                        >
                            {isSuccess ? (
                                <span className="flex items-center justify-center gap-2 animate-in fade-in zoom-in duration-300">
                                    <Check className="size-5" />
                                    Sucesso!
                                </span>
                            ) : isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="size-5 animate-spin" />
                                    Entrando...
                                </span>
                            ) : (
                                "Entrar"
                            )}
                        </Button>
                    </form>

                    {/* Footer */}
                    <div className="text-center text-sm text-muted-foreground mt-8 flex items-center justify-center gap-2">
                        <span>© {new Date().getFullYear()} {brandName}. Todos os direitos reservados.</span>
                        <span>•</span>
                        <a href="#" className="hover:text-[#00A947] transition-colors">Política de Privacidade</a>
                    </div>
                </div>
            </div>
        </div>
    );
}
