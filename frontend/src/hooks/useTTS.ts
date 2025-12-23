import { useState, useCallback, useRef } from 'react';

export function useTTS() {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voiceLevel, setVoiceLevel] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const animationFrameRef = useRef<number>();

    // We store the onProgress callback in a ref to call it inside the animation loop
    const onProgressRef = useRef<((progress: number) => void) | undefined>(undefined);

    const initAudioContext = useCallback(() => {
        if (!audioContextRef.current) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioContextClass();
        }
    }, []);

    const resumeContext = useCallback(async () => {
        initAudioContext();
        if (audioContextRef.current?.state === 'suspended') {
            try {
                await audioContextRef.current.resume();
                console.log("🔊 AudioContext resumed manually");
            } catch (e) {
                console.warn("🔊 Failed to resume AudioContext:", e);
            }
        }
    }, [initAudioContext]);

    const analyze = useCallback(() => {
        // 1. Voice Level Analysis
        if (analyserRef.current) {
            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(dataArray);

            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                const value = dataArray[i] / 255;
                sum += value * value;
            }
            const rms = Math.sqrt(sum / dataArray.length);
            const level = Math.min(rms * 2.5, 1);
            setVoiceLevel(level);
        }

        // 2. Progress Analysis
        if (audioRef.current && onProgressRef.current) {
            const duration = audioRef.current.duration;
            const current = audioRef.current.currentTime;
            if (duration > 0 && !isNaN(duration)) {
                const progress = current / duration;
                onProgressRef.current(progress);
            }
        }

        animationFrameRef.current = requestAnimationFrame(analyze);
    }, []);

    interface AlignmentData {
        sentences: string[];
        timepoints: Array<{ markName: string; timeSeconds: number }>;
    }

    interface SpeakOptions {
        onStart?: () => void;
        onEnd?: () => void;
        onProgress?: (progress: number) => void;
        onData?: (data: any) => void;
    }

    const speak = useCallback(async (text: string, voice: string = 'Kore', options?: SpeakOptions): Promise<{ duration: number; alignment?: AlignmentData }> => {
        console.log("🗣️ useTTS.speak called with:", { text: text.substring(0, 50) + "...", voice });

        if (!text) {
            console.warn("🗣️ Empty text provided to speak");
            return Promise.resolve({ duration: 0 });
        }

        // Update ref for the loop to access
        onProgressRef.current = options?.onProgress;

        // Stop current audio if playing
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        // Also cancel browser synthesis if active
        window.speechSynthesis.cancel();

        setIsSpeaking(true);

        return new Promise<{ duration: number; alignment?: AlignmentData }>(async (resolve, reject) => {
            try {
                // Backend Gemini TTS with Kore voice
                const USE_BACKEND_TTS = true;

                if (USE_BACKEND_TTS) {
                    console.log("📡 Fetching TTS from backend...");
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
                        const err = await response.text();
                        console.error("❌ TTS Backend Error Response:", err);
                        throw new Error(`TTS Backend Failed: ${response.statusText}`);
                    }

                    console.log("✅ TTS Backend Success. Parsing response...");

                    const data = await response.json();

                    // Immediately provide alignment data if callback exists
                    if (options?.onData) {
                        options.onData({
                            alignment: {
                                words: data.words || [], // Use words if available
                                sentences: data.sentences || [],
                                timepoints: data.timepoints || []
                            },
                            duration: 0 // Will be known later or estimated
                        });
                    }

                    console.log("Decoding audio content...");
                    // Convert base64 WAV to Blob
                    const binaryString = window.atob(data.audioContent);
                    const len = binaryString.length;
                    const bytes = new Uint8Array(len);
                    for (let i = 0; i < len; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    const blob = new Blob([bytes], { type: 'audio/wav' });
                    const url = URL.createObjectURL(blob);
                    console.log("Audio Blob created:", url);

                    const audio = new Audio(url);
                    audio.crossOrigin = "anonymous"; // Important for Web Audio API
                    audioRef.current = audio;

                    // Initialize Audio Context and Analyser if needed
                    initAudioContext();

                    // Always try to resume context (browser policy)
                    if (audioContextRef.current?.state === 'suspended') {
                        console.log("Attempting to resume AudioContext...");
                        await audioContextRef.current.resume();
                    }

                    if (audioContextRef.current && !analyserRef.current) {
                        analyserRef.current = audioContextRef.current.createAnalyser();
                        analyserRef.current.fftSize = 256; // Smaller FFT for more responsive visual
                    }

                    // Connect Source
                    try {
                        if (audioContextRef.current && analyserRef.current) {
                            // Disconnect old source to prevent graph errors
                            if (sourceRef.current) {
                                sourceRef.current.disconnect();
                            }

                            const source = audioContextRef.current.createMediaElementSource(audio);
                            source.connect(analyserRef.current);
                            analyserRef.current.connect(audioContextRef.current.destination);
                            sourceRef.current = source;
                        }
                    } catch (e) {
                        console.warn("Audio Graph Error:", e);
                    }

                    let audioDuration = 0;

                    audio.onloadedmetadata = () => {
                        audioDuration = audio.duration;
                        console.log(`Audio duration loaded: ${audioDuration}s`);
                    };

                    audio.onended = () => {
                        console.log("Audio playback ended.");
                        setIsSpeaking(false);
                        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
                        setVoiceLevel(0);
                        onProgressRef.current = undefined; // Clear callback
                        URL.revokeObjectURL(url);
                        resolve({
                            duration: audioDuration,
                            alignment: {
                                sentences: data.sentences || [],
                                timepoints: data.timepoints || []
                            }
                        });
                    };

                    audio.onerror = (e) => {
                        console.error("Audio playback fatal error:", e);
                        // Force fail to trigger fallback
                        setIsSpeaking(false);
                        setVoiceLevel(0);
                        onProgressRef.current = undefined;
                        // We do NOT reject here immediately if we want fallback, but throwing helps the catch block
                        // Actually audio.onerror happens asynchronously.
                        // But we want to fail the promise so the caller knows?
                        // Or try fallback? Since we are already in the promise, we can't easily jump to the outer catch block.
                        // We will log and reject.
                        reject(new Error("Audio element error"));
                    };

                    audio.onplay = () => {
                        console.log("Audio started playing.");
                        // Ensure context is running
                        if (audioContextRef.current?.state === 'suspended') {
                            audioContextRef.current.resume();
                        }

                        // Start analysis loop
                        analyze();
                        if (options?.onStart) options.onStart();
                    };

                    console.log("Calling audio.play()...");
                    await audio.play();
                    console.log("audio.play() promise resolved.");

                } else {
                    // USE_BACKEND_TTS is false - go directly to browser fallback
                    throw new Error('Backend TTS disabled');
                }
            } catch (error) {
                // Only warn on unexpected errors (not intentional disable)
                if (error instanceof Error && error.message !== 'Backend TTS disabled') {
                    console.warn("Backend TTS failed, falling back to browser:", error);
                }

                console.warn("⚠️ Using Browser Fallback TTS");
                // Fallback to browser synthesis
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'pt-BR';

                // Try to find a female voice
                const voices = window.speechSynthesis.getVoices();
                const femaleVoice = voices.find(v =>
                    v.lang.includes('pt') && (v.name.includes('Google') || v.name.includes('Luciana') || v.name.includes('Joana'))
                );
                if (femaleVoice) utterance.voice = femaleVoice;

                utterance.onstart = () => {
                    setIsSpeaking(true);
                    setVoiceLevel(0.5); // Static level for feedback
                    if (options?.onStart) options.onStart();

                    // Mock progress for browser tts (approximate)
                    let start = Date.now();
                    const estimatedDuration = text.length * 80; // Rough estimate
                    const interval = setInterval(() => {
                        const elapsed = Date.now() - start;
                        const p = Math.min(elapsed / estimatedDuration, 1);
                        if (options?.onProgress) options.onProgress(p);
                        if (p >= 1) clearInterval(interval);
                    }, 100);
                };
                utterance.onend = () => {
                    setIsSpeaking(false);
                    setVoiceLevel(0);
                    onProgressRef.current = undefined;
                    resolve({ duration: 0 });
                };
                utterance.onerror = (e) => {
                    console.error("Browser TTS error:", e);
                    setIsSpeaking(false);
                    onProgressRef.current = undefined;
                    if (options?.onStart) options.onStart();
                    reject(e);
                };

                window.speechSynthesis.speak(utterance);
            }
        });
    }, [analyze, initAudioContext]);

    const stop = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        setVoiceLevel(0);
        onProgressRef.current = undefined;
    }, []);

    return {
        speak,
        stop,
        resumeContext,
        isSpeaking,
        voiceLevel
    };
}
