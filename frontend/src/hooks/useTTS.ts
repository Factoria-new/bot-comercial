import { useState, useCallback, useRef } from 'react';

export function useTTS() {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voiceLevel, setVoiceLevel] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const animationFrameRef = useRef<number>();

    const analyze = useCallback(() => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            const value = dataArray[i] / 255;
            sum += value * value;
        }
        const rms = Math.sqrt(sum / dataArray.length);
        const level = Math.min(rms * 2.5, 1);

        // Debug Log every ~1 sec
        if (Math.random() < 0.05) {
            console.log("TTS Audio Level:", level, "RMS:", rms);
        }

        setVoiceLevel(level);
        animationFrameRef.current = requestAnimationFrame(analyze);
    }, []);

    const speak = useCallback(async (text: string, voice: string = 'Zephyr', options?: { onStart?: () => void }): Promise<{ duration: number }> => {
        if (!text) return Promise.resolve({ duration: 0 });

        // Stop current audio if playing
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        // Also cancel browser synthesis if active
        window.speechSynthesis.cancel();

        setIsSpeaking(true);

        return new Promise<{ duration: number }>(async (resolve, reject) => {
            try {
                // Call backend to generate audio
                const response = await fetch('http://localhost:3003/api/agent/speak', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        text,
                        voice
                    }),
                });

                if (!response.ok) {
                    throw new Error('TTS Backend Failed');
                }

                const blob = await response.blob();
                const url = URL.createObjectURL(blob);

                const audio = new Audio(url);
                audio.crossOrigin = "anonymous"; // Important for Web Audio API
                audioRef.current = audio;

                // Initialize Audio Context and Analyser if needed
                if (!audioContextRef.current) {
                    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                    audioContextRef.current = new AudioContextClass();
                }

                // Always try to resume context (browser policy)
                if (audioContextRef.current.state === 'suspended') {
                    await audioContextRef.current.resume();
                }

                if (!analyserRef.current) {
                    analyserRef.current = audioContextRef.current.createAnalyser();
                    analyserRef.current.fftSize = 256; // Smaller FFT for more responsive visual
                }

                // Connect Source
                try {
                    // Disconnect old source to prevent graph errors
                    if (sourceRef.current) {
                        sourceRef.current.disconnect();
                    }

                    const source = audioContextRef.current.createMediaElementSource(audio);
                    source.connect(analyserRef.current);
                    analyserRef.current.connect(audioContextRef.current.destination);
                    sourceRef.current = source;
                } catch (e) {
                    console.warn("Audio Graph Error:", e);
                }

                let audioDuration = 0;

                audio.onloadedmetadata = () => {
                    audioDuration = audio.duration;
                    console.log(`Audio duration: ${audioDuration}s`);
                };

                audio.onended = () => {
                    setIsSpeaking(false);
                    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
                    setVoiceLevel(0);
                    URL.revokeObjectURL(url);
                    resolve({ duration: audioDuration });
                };

                audio.onerror = (e) => {
                    console.error("Audio playback error:", e);
                    setIsSpeaking(false);
                    setVoiceLevel(0);
                    if (options?.onStart) options.onStart();
                    reject(e);
                };

                audio.onplay = () => {
                    // Ensure context is running
                    if (audioContextRef.current?.state === 'suspended') {
                        audioContextRef.current.resume();
                    }

                    // Start analysis loop
                    analyze();
                    if (options?.onStart) options.onStart();
                };

                await audio.play();

            } catch (error) {
                console.warn("Backend TTS failed, falling back to browser:", error);

                // Fallback to browser synthesis
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'pt-BR';

                // Try to find a female voice for fallback
                const voices = window.speechSynthesis.getVoices();
                const femaleVoice = voices.find(v =>
                    v.lang.includes('pt') && (v.name.includes('Google') || v.name.includes('Luciana') || v.name.includes('Joana'))
                );
                if (femaleVoice) utterance.voice = femaleVoice;

                utterance.onstart = () => {
                    setIsSpeaking(true);
                    setVoiceLevel(0.5); // Static level for feedback
                    if (options?.onStart) options.onStart();
                };
                utterance.onend = () => {
                    setIsSpeaking(false);
                    setVoiceLevel(0);
                    resolve({ duration: 0 });
                };
                utterance.onerror = (e) => {
                    setIsSpeaking(false);
                    if (options?.onStart) options.onStart();
                    reject(e);
                };

                window.speechSynthesis.speak(utterance);
            }
        });
    }, [analyze]);

    const stop = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        setVoiceLevel(0);
    }, []);

    return {
        speak,
        stop,
        isSpeaking,
        voiceLevel
    };
}
