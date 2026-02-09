"use client";

import { useState, useEffect } from "react";
import { useCookieConsent } from "@/contexts/CookieConsentContext";
import { Button } from "@/components/ui/button";

export function CookieConsentBanner() {
    const { consent, grantConsent, denyConsent } = useCookieConsent();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Delay showing to avoid flickering or obstructing immediately on load
        if (consent === 'unknown') {
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
        }
    }, [consent]);

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6 bg-background/95 backdrop-blur-md border-t border-border shadow-2xl animate-in slide-in-from-bottom-full duration-500">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex-1 space-y-2 text-center md:text-left">
                    <h3 className="text-lg font-semibold tracking-tight">🍪 Sua privacidade importa</h3>
                    <p className="text-sm text-muted-foreground max-w-2xl">
                        Utilizamos cookies para melhorar sua experiência e salvar suas preferências, como o volume do áudio.
                        Ao continuar, você concorda com o uso dessas tecnologias.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <Button
                        variant="outline"
                        onClick={denyConsent}
                        className="w-full sm:w-auto hover:bg-destructive/10 hover:text-destructive border-input"
                    >
                        Recusar Opcionais
                    </Button>
                    <Button
                        onClick={grantConsent}
                        className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                        Aceitar Todos
                    </Button>
                </div>
            </div>
        </div>
    );
}
