// frontend/src/hooks/useGeminiLive.ts
import { useState, useRef, useCallback, useEffect } from 'react';

interface AudioChunk {
    type: 'audio_chunk' | 'text' | 'complete' | 'error';
    data?: string;
    content?: string;
    mimeType?: string;
}

interface VoiceRecordingContext {
    audioContext: AudioContext;
    stream: MediaStream;
    processor: ScriptProcessorNode;
    source: MediaStreamAudioSourceNode;
    pcmChunks: Float32Array[];
    analyser: AnalyserNode;
}

export function useGeminiLive() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [voiceLevel, setVoiceLevel] = useState(0);
    const [isSpeaking, setIsSpeaking] = useState(false); // User is actively speaking

    const audioContextRef = useRef<AudioContext | null>(null);
    const nextTimeRef = useRef<number>(0);
    const sourceNodesRef = useRef<AudioBufferSourceNode[]>([]);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    // VAD (Voice Activity Detection) refs
    const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastSpeakingTimeRef = useRef<number>(0);
    const onSilenceCallbackRef = useRef<((audioBlob: Blob) => void) | null>(null);
    const recordingContextRef = useRef<VoiceRecordingContext | null>(null);

    // Silence threshold and duration
    const SILENCE_THRESHOLD = 0.05; // Nível mínimo para considerar que está falando
    const SILENCE_DURATION_MS = 3000; // 3 segundos de silêncio


    // Inicializa contexto de áudio
    const initAudio = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
                sampleRate: 24000,
            });
            // Criar analyser para medir nível de áudio
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
        }
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
        return audioContextRef.current;
    }, []);



    // Parar análise de voz
    const stopVoiceLevelAnalysis = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        setVoiceLevel(0);
    }, []);

    // Efeito para gerenciar análise de áudio da IA - anima durante playback
    // Quando a IA está respondendo, sobrescrevemos o voiceLevel com valores simulados
    useEffect(() => {
        if (isPlaying || isProcessing) {
            // Simular voiceLevel da IA durante playback
            const interval = setInterval(() => {
                // Variação natural para simular fala
                const base = isPlaying ? 0.4 : 0.2;
                const variation = isPlaying ? 0.5 : 0.3;
                const newLevel = base + Math.random() * variation;
                setVoiceLevel(newLevel);
            }, 80);
            return () => {
                clearInterval(interval);
                // Só reseta se não estiver gravando
                if (!isRecording) {
                    setVoiceLevel(0);
                }
            };
        }
    }, [isPlaying, isProcessing, isRecording]);

    // Converte PCM raw para AudioBuffer
    const pcmToAudioBuffer = useCallback((pcmData: ArrayBuffer, sampleRate: number = 24000): AudioBuffer | null => {
        const ctx = audioContextRef.current;
        if (!ctx) return null;

        // PCM 16-bit signed little-endian
        const int16Array = new Int16Array(pcmData);
        const float32Array = new Float32Array(int16Array.length);

        for (let i = 0; i < int16Array.length; i++) {
            float32Array[i] = int16Array[i] / 32768.0;
        }

        const audioBuffer = ctx.createBuffer(1, float32Array.length, sampleRate);
        audioBuffer.getChannelData(0).set(float32Array);

        return audioBuffer;
    }, []);

    // Toca um chunk de áudio
    const playChunk = useCallback((base64Data: string, mimeType: string = 'audio/pcm') => {
        const ctx = audioContextRef.current;
        if (!ctx) return;

        try {
            // Decodifica base64
            const binaryString = window.atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            // Determina o formato e converte
            if (mimeType.includes('pcm') || mimeType.includes('L16') || mimeType.includes('raw')) {
                // PCM raw - converter manualmente
                const audioBuffer = pcmToAudioBuffer(bytes.buffer);
                if (audioBuffer) {
                    const source = ctx.createBufferSource();
                    source.buffer = audioBuffer;

                    // Conectar ao analyser se existir
                    if (analyserRef.current) {
                        source.connect(analyserRef.current);
                        analyserRef.current.connect(ctx.destination);
                    } else {
                        source.connect(ctx.destination);
                    }

                    const currentTime = ctx.currentTime;
                    const playTime = Math.max(currentTime, nextTimeRef.current);

                    source.start(playTime);
                    nextTimeRef.current = playTime + audioBuffer.duration;
                    sourceNodesRef.current.push(source);
                }
            } else {
                // Outros formatos (wav, mp3) - usar decodeAudioData
                ctx.decodeAudioData(bytes.buffer.slice(0), (buffer) => {
                    const source = ctx.createBufferSource();
                    source.buffer = buffer;

                    if (analyserRef.current) {
                        source.connect(analyserRef.current);
                        analyserRef.current.connect(ctx.destination);
                    } else {
                        source.connect(ctx.destination);
                    }

                    const currentTime = ctx.currentTime;
                    const playTime = Math.max(currentTime, nextTimeRef.current);

                    source.start(playTime);
                    nextTimeRef.current = playTime + buffer.duration;
                    sourceNodesRef.current.push(source);
                }, (error) => {
                    console.error('Error decoding audio:', error);
                });
            }
        } catch (error) {
            console.error('Error playing chunk:', error);
        }
    }, [pcmToAudioBuffer]);

    // Para todos os sons
    const stopAudio = useCallback(() => {
        sourceNodesRef.current.forEach(source => {
            try {
                source.stop();
            } catch (e) {
                // ignore
            }
        });
        sourceNodesRef.current = [];
        if (audioContextRef.current) {
            nextTimeRef.current = audioContextRef.current.currentTime;
        }
        setIsPlaying(false);
        stopVoiceLevelAnalysis();
    }, [stopVoiceLevelAnalysis]);

    // Cria blob de áudio a partir dos chunks gravados
    const createAudioBlob = useCallback((pcmChunks: Float32Array[]): Blob => {
        const totalLength = pcmChunks.reduce((acc: number, chunk: Float32Array) => acc + chunk.length, 0);
        const pcmData = new Int16Array(totalLength);
        let offset = 0;

        for (const chunk of pcmChunks) {
            for (let i = 0; i < chunk.length; i++) {
                const s = Math.max(-1, Math.min(1, chunk[i]));
                pcmData[offset++] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }
        }

        console.log(`[Recording] Created audio blob with ${pcmData.length} samples`);
        return new Blob([pcmData.buffer], { type: 'audio/pcm' });
    }, []);

    // Iniciar gravação contínua com VAD (Voice Activity Detection)
    const startContinuousRecording = useCallback(async (
        onSilenceDetected: (audioBlob: Blob) => void
    ): Promise<void> => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                }
            });

            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
                sampleRate: 16000,
            });

            const source = audioContext.createMediaStreamSource(stream);
            const processor = audioContext.createScriptProcessor(4096, 1, 1);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;

            const pcmChunks: Float32Array[] = [];

            // Store callback reference
            onSilenceCallbackRef.current = onSilenceDetected;

            processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                pcmChunks.push(new Float32Array(inputData));

                // Analyze voice level directly from PCM data (RMS)
                let sum = 0;
                for (let i = 0; i < inputData.length; i++) {
                    sum += inputData[i] * inputData[i];
                }
                const rms = Math.sqrt(sum / inputData.length);
                const normalizedLevel = Math.min(1, rms * 10); // Amplify for better visualization

                // Update voice level for UI
                setVoiceLevel(normalizedLevel);

                const now = Date.now();

                if (normalizedLevel > SILENCE_THRESHOLD) {
                    // User is speaking
                    setIsSpeaking(true);
                    lastSpeakingTimeRef.current = now;

                    // Clear any pending silence timeout
                    if (silenceTimeoutRef.current) {
                        clearTimeout(silenceTimeoutRef.current);
                        silenceTimeoutRef.current = null;
                    }
                } else if (lastSpeakingTimeRef.current > 0) {
                    // User stopped speaking, check if we should trigger silence callback
                    setIsSpeaking(false);

                    if (!silenceTimeoutRef.current && pcmChunks.length > 0) {
                        silenceTimeoutRef.current = setTimeout(() => {
                            // 3 seconds of silence detected
                            if (pcmChunks.length > 0 && onSilenceCallbackRef.current) {
                                console.log('[VAD] Silence detected, sending audio...');

                                // Create blob from recorded chunks
                                const audioBlob = createAudioBlob([...pcmChunks]);

                                // Clear chunks for next recording
                                pcmChunks.length = 0;
                                lastSpeakingTimeRef.current = 0;

                                // Call the callback
                                onSilenceCallbackRef.current(audioBlob);
                            }
                            silenceTimeoutRef.current = null;
                        }, SILENCE_DURATION_MS);
                    }
                }
            };

            source.connect(analyser);
            analyser.connect(processor);
            processor.connect(audioContext.destination);

            // Store context for cleanup
            recordingContextRef.current = {
                audioContext,
                stream,
                processor,
                source,
                pcmChunks,
                analyser,
            };

            setIsRecording(true);
            console.log('[VAD] Continuous recording started');
        } catch (error) {
            console.error('Error starting continuous recording:', error);
            throw error;
        }
    }, [createAudioBlob, SILENCE_THRESHOLD, SILENCE_DURATION_MS]);

    // Parar gravação contínua
    const stopContinuousRecording = useCallback(() => {
        const ctx = recordingContextRef.current;
        if (ctx) {
            // Clear silence timeout
            if (silenceTimeoutRef.current) {
                clearTimeout(silenceTimeoutRef.current);
                silenceTimeoutRef.current = null;
            }

            // Disconnect and cleanup
            ctx.processor.disconnect();
            ctx.source.disconnect();
            ctx.analyser.disconnect();
            ctx.stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
            ctx.audioContext.close();

            recordingContextRef.current = null;
            onSilenceCallbackRef.current = null;
        }

        setIsRecording(false);
        setIsSpeaking(false);
        setVoiceLevel(0);
        lastSpeakingTimeRef.current = 0;
        console.log('[VAD] Continuous recording stopped');
    }, []);

    // Iniciar gravação de voz - captura PCM raw para o Live API (legacy)
    const startRecording = useCallback(async (): Promise<void> => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                }
            });

            // Criar contexto de áudio para capturar PCM raw
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
                sampleRate: 16000,
            });

            const source = audioContext.createMediaStreamSource(stream);
            const processor = audioContext.createScriptProcessor(4096, 1, 1);

            const pcmChunks: Float32Array[] = [];

            processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                pcmChunks.push(new Float32Array(inputData));
            };

            source.connect(processor);
            processor.connect(audioContext.destination);

            // Guardar referências para parar depois
            (window as any).__audioRecordingContext = {
                audioContext,
                stream,
                processor,
                source,
                pcmChunks,
            };

            setIsRecording(true);
        } catch (error) {
            console.error('Error starting recording:', error);
            throw error;
        }
    }, []);

    // Parar gravação e retornar blob com PCM (legacy)
    const stopRecording = useCallback((): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const ctx = (window as any).__audioRecordingContext;
            if (!ctx) {
                reject(new Error('No recording in progress'));
                return;
            }

            const { audioContext, stream, processor, source, pcmChunks } = ctx;

            // Desconectar
            processor.disconnect();
            source.disconnect();
            stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
            audioContext.close();

            // Converter Float32 para Int16 (PCM 16-bit)
            const totalLength = pcmChunks.reduce((acc: number, chunk: Float32Array) => acc + chunk.length, 0);
            const pcmData = new Int16Array(totalLength);
            let offset = 0;

            for (const chunk of pcmChunks) {
                for (let i = 0; i < chunk.length; i++) {
                    // Clamp e converter para 16-bit
                    const s = Math.max(-1, Math.min(1, chunk[i]));
                    pcmData[offset++] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                }
            }

            // Criar blob com PCM raw
            const blob = new Blob([pcmData.buffer], { type: 'audio/pcm' });

            delete (window as any).__audioRecordingContext;
            setIsRecording(false);

            console.log(`[Recording] Captured ${pcmData.length} samples of PCM audio at 16kHz`);
            resolve(blob);
        });
    }, []);

    // Função principal: envia texto ou áudio e recebe áudio streaming
    const sendLiveMessage = useCallback(async (
        text: string,
        audioBlob?: Blob,
        history: Array<{ role: string; content: string }> = [],
        onTextReceived?: (text: string) => void
    ) => {
        initAudio();
        setIsProcessing(true);
        setIsPlaying(true);

        if (audioContextRef.current) {
            nextTimeRef.current = audioContextRef.current.currentTime;
        }

        try {
            let audioBase64: string | undefined;

            // Se tiver áudio, converte para base64
            if (audioBlob) {
                const reader = new FileReader();
                audioBase64 = await new Promise((resolve) => {
                    reader.onloadend = () => {
                        const result = reader.result as string;
                        resolve(result.split(',')[1]);
                    };
                    reader.readAsDataURL(audioBlob);
                });
            }

            const response = await fetch('http://localhost:3003/api/agent/live-audio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    audio: audioBase64,
                    history
                }),
            });

            if (!response.body) {
                throw new Error('No response body');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;
                const lines = buffer.split('\n\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data: AudioChunk = JSON.parse(line.slice(6));

                            if (data.type === 'audio_chunk' && data.data) {
                                playChunk(data.data, data.mimeType);
                            } else if (data.type === 'text' && data.content && onTextReceived) {
                                onTextReceived(data.content);
                            } else if (data.type === 'error') {
                                console.error('Stream error:', data.content);
                            }
                        } catch (e) {
                            console.error('Parse error:', e);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Live audio error:', error);
        } finally {
            setIsProcessing(false);
            // Keep isPlaying true until audio finishes
            setTimeout(() => {
                setIsPlaying(false);
            }, 2000);
        }
    }, [initAudio, playChunk]);

    return {
        sendLiveMessage,
        stopAudio,
        startRecording,
        stopRecording,
        startContinuousRecording,
        stopContinuousRecording,
        isPlaying,
        isProcessing,
        isRecording,
        isSpeaking,
        voiceLevel,
        initAudio
    };
}
