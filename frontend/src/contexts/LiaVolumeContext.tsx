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

// Import Cookie Consent
import { useCookieConsent } from "./CookieConsentContext";

const getCookie = (name: string): string | null => {
    // Only read if document is available
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop()?.split(";").shift() || null;
    }
    return null;
};

const setCookie = (name: string, value: string, maxAge: number): void => {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
};

const deleteCookie = (name: string): void => {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
};

interface LiaVolumeProviderProps {
    children: ReactNode;
}

export const LiaVolumeProvider = ({ children }: LiaVolumeProviderProps) => {
    const [volume, setVolumeState] = useState<number>(1);
    const [previousVolume, setPreviousVolume] = useState<number>(1);

    // Use useCookieConsent hook to get consent state
    const { consent } = useCookieConsent();

    // Load from cookie on mount
    useEffect(() => {
        // ALWAYS try to load from cookie initially if it exists, 
        // because maybe user JUST consented or had it from before.
        // IF consent is unknown or granted, we can read. 
        // If denied, strictly speaking we should ignore it, but reading is usually harmless compared to writing.
        // However, let's respect the spirit: if denied, don't read.
        if (consent === 'denied') return;

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
    }, [consent]);

    // Effect to CLEAR cookie if consent is explicitly denied
    useEffect(() => {
        if (consent === 'denied') {
            deleteCookie(COOKIE_NAME);
        }
        // If granted, we could potentially save current state, but let's wait for next user action
        // or we can save immediately if we want to persist current state.
        if (consent === 'granted') {
            setCookie(COOKIE_NAME, volume.toString(), COOKIE_MAX_AGE);
        }
    }, [consent, volume]);

    const setVolume = (newVolume: number) => {
        const clampedVolume = Math.max(0, Math.min(1, newVolume));
        setVolumeState(clampedVolume);

        // Only write to cookie if consent is granted
        if (consent === 'granted') {
            setCookie(COOKIE_NAME, clampedVolume.toString(), COOKIE_MAX_AGE);
        }

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
