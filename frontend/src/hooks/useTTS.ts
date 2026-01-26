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
        audioUrl?: string; // New option for static files
    }

    const speak = useCallback(async (text: string, voice: string = 'Kore', options?: SpeakOptions): Promise<{ duration: number; alignment?: AlignmentData }> => {
        console.log("🗣️ useTTS.speak called with:", { text: text.substring(0, 50) + "...", voice, audioUrl: options?.audioUrl });

        if (!text && !options?.audioUrl) {
            console.warn("🗣️ Empty text provided to speak");
            return Promise.resolve({ duration: 0 });
        }

        // If text is empty but we have audioUrl, use a placeholder for split logic later if needed
        const safeText = text || "Audio Message";

        // Update ref for the loop to access
        onProgressRef.current = options?.onProgress;

        // Stop current audio if playing
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        // Also cancel browser synthesis if active
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }

        setIsSpeaking(true);

        return new Promise<{ duration: number; alignment?: AlignmentData }>(async (resolve, reject) => {
            try {
                // Check if static audio URL is provided
                if (options?.audioUrl) {
                    console.log("[useTTS] 💿 Playing static audio from URL:", options.audioUrl);

                    // Create audio element directly from URL
                    const audio = new Audio(options.audioUrl);
                    audio.crossOrigin = "anonymous";
                    audioRef.current = audio;

                    // Mock simple alignment since we don't have it for static files yet
                    // Or just split text by space
                    const words = text.split(' ');

                    if (options?.onData) {
                        options.onData({
                            alignment: {
                                words: words,
                                sentences: [text],
                                timepoints: []
                            },
                            duration: 0
                        });
                    }

                    // Common setup (Analysers etc) - reusing logic below
                    // We can structure this better, but for now I'll duplicate the setup block or jump to it
                    // Let's copy the setup block here to be safe and simple

                    initAudioContext();

                    if (audioContextRef.current?.state === 'suspended') {
                        await audioContextRef.current.resume();
                    }

                    if (audioContextRef.current && !analyserRef.current) {
                        analyserRef.current = audioContextRef.current.createAnalyser();
                        analyserRef.current.fftSize = 256;
                    }

                    try {
                        if (audioContextRef.current && analyserRef.current) {
                            if (sourceRef.current) sourceRef.current.disconnect();
                            const source = audioContextRef.current.createMediaElementSource(audio);
                            source.connect(analyserRef.current);
                            analyserRef.current.connect(audioContextRef.current.destination);
                            sourceRef.current = source;
                        }
                    } catch (e) {
                        console.warn("[useTTS] Audio Graph Error:", e);
                    }

                    let audioDuration = 0;
                    audio.onloadedmetadata = () => {
                        audioDuration = audio.duration;
                        console.log(`[useTTS] Audio duration loaded: ${audioDuration}s`);
                    };

                    audio.onended = () => {
                        console.log("[useTTS] Static Audio playback ended.");
                        setIsSpeaking(false);
                        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
                        setVoiceLevel(0);
                        onProgressRef.current = undefined;
                        resolve({ duration: audioDuration });
                    };

                    audio.onerror = (e) => {
                        console.error("[useTTS] Static Audio playback ERROR:", e, audio.error);
                        reject(audio.error || new Error("Unknown Audio Error"));
                    };

                    audio.onplay = () => {
                        console.log("[useTTS] Static Audio started playing event.");
                        if (audioContextRef.current?.state === 'suspended') audioContextRef.current.resume();
                        analyze();
                        if (options?.onStart) options.onStart();
                    };

                    console.log("[useTTS] Calling static audio.play()...");
                    await audio.play().then(() => {
                        console.log("[useTTS] static audio.play() promise resolved.");
                    }).catch(e => {
                        console.error("[useTTS] static audio.play() REJECTED:", e);
                        reject(e);
                    });

                    return; // Exit here, job done
                }


                // Backend Gemini TTS with Kore voice
                const USE_BACKEND_TTS = true;

                if (USE_BACKEND_TTS) {
                    console.log("📡 Fetching TTS from backend...");
                    // Call backend to generate audio
                    const backendUrl = import.meta.env.VITE_API_URL || 'https://api.cajiassist.com';
                    const response = await fetch(`${backendUrl}/api/agent/speak`, {
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
                    // Convert base64 audio to Blob
                    const binaryString = window.atob(data.audioContent);
                    const len = binaryString.length;
                    const bytes = new Uint8Array(len);
                    for (let i = 0; i < len; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    // Use mimeType from response, fallback to audio/wav
                    const mimeType = data.mimeType || 'audio/wav';
                    const blob = new Blob([bytes], { type: mimeType });
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

                if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
                    console.error("Browser TTS not supported");
                    setIsSpeaking(false);
                    reject(new Error("TTS not supported"));
                    return;
                }

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
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
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
