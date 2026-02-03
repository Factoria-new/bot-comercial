"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface LiaVolumeContextType {
    volume: number;
    setVolume: (v: number) => void;
    isMuted: boolean;
    toggleMute: () => void;
}

const LiaVolumeContext = createContext<LiaVolumeContextType | undefined>(undefined);

const COOKIE_NAME = "lia-volume";
const COOKIE_MAX_AGE = 31536000; // 1 year in seconds

const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop()?.split(";").shift() || null;
    }
    return null;
};

const setCookie = (name: string, value: string, maxAge: number): void => {
    document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
};

interface LiaVolumeProviderProps {
    children: ReactNode;
}

export const LiaVolumeProvider = ({ children }: LiaVolumeProviderProps) => {
    const [volume, setVolumeState] = useState<number>(1);
    const [previousVolume, setPreviousVolume] = useState<number>(1);

    // Load from cookie on mount
    useEffect(() => {
        const savedVolume = getCookie(COOKIE_NAME);
        if (savedVolume !== null) {
            const parsed = parseFloat(savedVolume);
            if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
                setVolumeState(parsed);
                if (parsed > 0) {
                    setPreviousVolume(parsed);
                }
            }
        }
    }, []);

    const setVolume = (newVolume: number) => {
        const clampedVolume = Math.max(0, Math.min(1, newVolume));
        setVolumeState(clampedVolume);
        setCookie(COOKIE_NAME, clampedVolume.toString(), COOKIE_MAX_AGE);

        if (clampedVolume > 0) {
            setPreviousVolume(clampedVolume);
        }
    };

    const isMuted = volume === 0;

    const toggleMute = () => {
        if (isMuted) {
            const restoreVolume = previousVolume > 0 ? previousVolume : 0.5;
            setVolume(restoreVolume);
        } else {
            setVolume(0);
        }
    };

    return (
        <LiaVolumeContext.Provider value={{ volume, setVolume, isMuted, toggleMute }}>
            {children}
        </LiaVolumeContext.Provider>
    );
};

export const useLiaVolume = (): LiaVolumeContextType => {
    const context = useContext(LiaVolumeContext);
    if (context === undefined) {
        throw new Error("useLiaVolume must be used within a LiaVolumeProvider");
    }
    return context;
};
