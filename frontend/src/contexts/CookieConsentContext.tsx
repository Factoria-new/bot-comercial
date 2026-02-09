"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type ConsentStatus = 'granted' | 'denied' | 'unknown';

interface CookieConsentContextType {
    consent: ConsentStatus;
    grantConsent: () => void;
    denyConsent: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

const CONSENT_KEY = "caji_cookie_consent";

export const CookieConsentProvider = ({ children }: { children: ReactNode }) => {
    const [consent, setConsent] = useState<ConsentStatus>('unknown');

    useEffect(() => {
        const stored = localStorage.getItem(CONSENT_KEY);
        if (stored === 'granted' || stored === 'denied') {
            setConsent(stored);
        }
    }, []);

    const grantConsent = () => {
        setConsent('granted');
        localStorage.setItem(CONSENT_KEY, 'granted');
    };

    const denyConsent = () => {
        setConsent('denied');
        localStorage.setItem(CONSENT_KEY, 'denied');

        // Optional: Clear existing non-essential cookies here if needed immediately
        // For example:
        // document.cookie = "lia-volume=; path=/; max-age=0";
    };

    return (
        <CookieConsentContext.Provider value={{ consent, grantConsent, denyConsent }}>
            {children}
        </CookieConsentContext.Provider>
    );
};

export const useCookieConsent = () => {
    const context = useContext(CookieConsentContext);
    if (!context) {
        throw new Error("useCookieConsent must be used within a CookieConsentProvider");
    }
    return context;
};
