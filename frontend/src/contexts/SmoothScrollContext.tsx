
import React, { createContext, useContext, useState, ReactNode } from "react";
import Lenis from "lenis";

interface SmoothScrollContextType {
    lenis: Lenis | null;
    setLenis: (lenis: Lenis) => void;
}

const SmoothScrollContext = createContext<SmoothScrollContextType | undefined>(undefined);

export const SmoothScrollProvider = ({ children, lenis: initialLenis }: { children: ReactNode, lenis?: Lenis }) => {
    const [lenis, setLenis] = useState<Lenis | null>(initialLenis || null);

    return (
        <SmoothScrollContext.Provider value={{ lenis, setLenis }}>
            {children}
        </SmoothScrollContext.Provider>
    );
};

export const useSmoothScroll = () => {
    const context = useContext(SmoothScrollContext);
    if (context === undefined) {
        throw new Error("useSmoothScroll must be used within a SmoothScrollProvider");
    }
    return context;
};
