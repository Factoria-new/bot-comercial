import { useState, useRef, useCallback, useEffect } from "react";

interface AgentAudioProps {
    stopTTS: () => void;
    liaVolume?: number; // 0-1, defaults to 1 if not provided
}

export const useAgentAudio = ({ stopTTS, liaVolume = 1 }: AgentAudioProps) => {
    const [integrationVoiceLevel, setIntegrationVoiceLevel] = useState(0);
    const integrationAudioRef = useRef<HTMLAudioElement | null>(null);
    const integrationAudioContextRef = useRef<AudioContext | null>(null);
    const integrationAnimationFrameRef = useRef<number>();
    const volumeRef = useRef(liaVolume);

    // Keep volume ref updated
    useEffect(() => {
        volumeRef.current = liaVolume;
        // Apply to existing audio if playing
        if (integrationAudioRef.current) {
            integrationAudioRef.current.volume = liaVolume;
        }
    }, [liaVolume]);

    // Helper: Stop locally playing integration audio (and clean up context/visualizer)
    const stopIntegrationAudio = useCallback(() => {
        if (integrationAudioRef.current) {
            integrationAudioRef.current.pause();
            integrationAudioRef.current.currentTime = 0;
            integrationAudioRef.current = null;
        }
        if (integrationAnimationFrameRef.current) {
            cancelAnimationFrame(integrationAnimationFrameRef.current);
            integrationAnimationFrameRef.current = undefined;
        }
        if (integrationAudioContextRef.current) {
            integrationAudioContextRef.current.close().catch(console.error);
            integrationAudioContextRef.current = null;
        }
        setIntegrationVoiceLevel(0);
    }, []);

    // Helper: Play integration audio with visualizer (interrupts everything else)
    const playIntegrationAudio = useCallback(async (path: string, delay: number = 0, onEnded?: () => void) => {
        console.log(`[AudioDebug] playIntegrationAudio called with path: ${path}, delay: ${delay}`);
        // 1. Stop everything else first
        stopIntegrationAudio();
        stopTTS(); // Interrupt Lia if she's speaking

        if (!path) {
            console.warn("[AudioDebug] No path provided to playIntegrationAudio");
            return;
        }

        setTimeout(() => {
            console.log("[AudioDebug] Executing delayed audio playback...");
            try {
                // Double check stop to be safe
                stopIntegrationAudio();

                const audio = new Audio(path);
                audio.volume = volumeRef.current; // Apply Lia volume
                integrationAudioRef.current = audio;

                // Setup Audio Context for Animation
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                const audioContext = new AudioContextClass();
                integrationAudioContextRef.current = audioContext;

                const analyser = audioContext.createAnalyser();
                analyser.fftSize = 256;

                // Connect audio element to context
                const source = audioContext.createMediaElementSource(audio);
                source.connect(analyser);
                analyser.connect(audioContext.destination);

                const dataArray = new Uint8Array(analyser.frequencyBinCount);

                const updateVolume = () => {
                    if (analyser) {
                        analyser.getByteFrequencyData(dataArray);
                        const avg = dataArray.reduce((p, c) => p + c, 0) / dataArray.length;
                        // Normalize to 0-1 range roughly
                        const normalizedVolume = Math.min(avg / 128, 1);
                        setIntegrationVoiceLevel(normalizedVolume);
                        integrationAnimationFrameRef.current = requestAnimationFrame(updateVolume);
                    }
                };

                // NEW: Attach onEnded listener
                audio.onended = () => {
                    console.log("[AudioDebug] Audio finished.");
                    if (onEnded) onEnded();
                    // Optional: stop animation loop?
                    // stopIntegrationAudio() handles cleanup, but maybe we want to keep context open?
                    // No, usually good to cleanup. But if we cleanup, voiceLevel 0.
                    stopIntegrationAudio();
                };

                console.log("[AudioDebug] Attempting to play audio...");
                audio.play().then(() => {
                    console.log("[AudioDebug] Audio playing successfully!");
                    updateVolume();
                }).catch(e => {
                    console.error("[AudioDebug] Audio play/context error:", e);
                    // Fallback just play if context fails
                    audio.play().catch(console.error);
                });

            } catch (e) {
                console.error("[AudioDebug] Audio critical error:", e);
            }
        }, delay);

    }, [stopIntegrationAudio, stopTTS]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopIntegrationAudio();
        };
    }, [stopIntegrationAudio]);

    return {
        integrationVoiceLevel,
        playIntegrationAudio,
        stopIntegrationAudio
    };
};
