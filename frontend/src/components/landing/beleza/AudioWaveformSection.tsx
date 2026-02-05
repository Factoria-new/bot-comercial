import { useState } from "react";
import { Play, Pause, Mic } from "lucide-react";

/**
 * AudioWaveformSection - Beleza Landing Page
 * Animated waveform section highlighting humanized audio responses
 * Uses --beleza-* CSS variables
 */
export const AudioWaveformSection = () => {
    const [isPlaying, setIsPlaying] = useState(false);

    const waveformBars = Array.from({ length: 40 }, (_, i) => ({
        id: i,
        height: Math.random() * 60 + 20,
        delay: i * 0.05
    }));

    return (
        <section
            className="py-20 relative overflow-hidden"
            style={{ backgroundColor: 'hsl(var(--beleza-background))' }}
        >
            {/* Background Glow */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[150px] -z-10"
                style={{ background: 'var(--beleza-gradient-primary)', opacity: 0.08 }}
            />

            <div className="container px-4 md:px-6">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Left Content */}
                    <div className="space-y-8">
                        <div
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                            style={{
                                background: 'var(--beleza-gradient-primary)',
                                color: 'white'
                            }}
                        >
                            <Mic className="w-4 h-4" />
                            <span className="text-sm font-medium uppercase tracking-wider">
                                Voz Humanizada
                            </span>
                        </div>

                        <h2
                            className="text-3xl md:text-5xl font-display font-bold leading-tight uppercase"
                            style={{ color: 'hsl(var(--beleza-foreground))' }}
                        >
                            Seu cliente ouve{' '}
                            <span
                                className="text-transparent bg-clip-text"
                                style={{ backgroundImage: 'var(--beleza-gradient-primary)' }}
                            >
                                audio
                            </span>
                            ,<br />
                            mas e a IA falando.
                        </h2>

                        <p
                            className="text-lg leading-relaxed max-w-lg"
                            style={{ color: 'hsl(var(--beleza-muted-foreground))' }}
                        >
                            Agendamento com a resenha e a giria da sua barbearia.
                            O cliente sente que esta falando com uma pessoa real,
                            nao com um robo.
                        </p>

                        <ul className="space-y-3 pt-4">
                            {[
                                'Audios naturais, nao roboticos',
                                'Girias e expressoes do seu nicho',
                                'Personalizacao total do tom de voz'
                            ].map((item, i) => (
                                <li
                                    key={i}
                                    className="flex items-center gap-3"
                                    style={{ color: 'hsl(var(--beleza-foreground))' }}
                                >
                                    <span
                                        className="w-2 h-2 rounded-full"
                                        style={{
                                            background: 'var(--beleza-gradient-primary)',
                                            boxShadow: 'var(--beleza-shadow-accent)'
                                        }}
                                    />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Right Content - Waveform Visualization */}
                    <div className="relative">
                        {/* Glassmorphism Container */}
                        <div
                            className="relative rounded-3xl backdrop-blur-xl p-8 overflow-hidden"
                            style={{
                                backgroundColor: 'hsl(var(--beleza-card) / 0.8)',
                                border: '1px solid hsl(var(--beleza-border))',
                                boxShadow: 'var(--beleza-shadow-card)'
                            }}
                        >
                            {/* Neon Glow Behind Waveform */}
                            <div
                                className="absolute inset-0 rounded-3xl blur-[40px] opacity-30"
                                style={{ background: 'var(--beleza-gradient-primary)' }}
                            />

                            {/* Header */}
                            <div
                                className="relative z-10 flex items-center gap-4 mb-8 pb-4"
                                style={{ borderBottom: '1px solid hsl(var(--beleza-border))' }}
                            >
                                <div
                                    className="w-12 h-12 rounded-full flex items-center justify-center"
                                    style={{
                                        background: 'var(--beleza-gradient-primary)',
                                        boxShadow: 'var(--beleza-shadow-accent)'
                                    }}
                                >
                                    <Mic className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3
                                        className="font-bold font-display uppercase tracking-wide"
                                        style={{ color: 'hsl(var(--beleza-foreground))' }}
                                    >
                                        Audio do Assistente
                                    </h3>
                                    <span
                                        className="text-xs"
                                        style={{ color: 'hsl(var(--beleza-muted-foreground))' }}
                                    >
                                        0:08
                                    </span>
                                </div>
                            </div>

                            {/* Waveform */}
                            <div className="relative z-10 flex items-center justify-center gap-[2px] h-24 mb-8">
                                {waveformBars.map((bar) => (
                                    <div
                                        key={bar.id}
                                        className="w-1 rounded-full transition-all duration-300"
                                        style={{
                                            height: isPlaying ? `${bar.height}%` : '20%',
                                            background: 'var(--beleza-gradient-primary)',
                                            boxShadow: isPlaying ? 'var(--beleza-shadow-accent)' : 'none',
                                            animation: isPlaying
                                                ? `waveform 0.8s ease-in-out infinite ${bar.delay}s alternate`
                                                : 'none'
                                        }}
                                    />
                                ))}
                            </div>

                            {/* Play Button */}
                            <div className="relative z-10 flex justify-center">
                                <button
                                    onClick={() => setIsPlaying(!isPlaying)}
                                    className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                                    style={{
                                        background: 'var(--beleza-gradient-primary)',
                                        boxShadow: 'var(--beleza-shadow-glow)'
                                    }}
                                >
                                    {isPlaying ? (
                                        <Pause className="w-7 h-7 text-white" />
                                    ) : (
                                        <Play className="w-7 h-7 text-white ml-1" />
                                    )}
                                </button>
                            </div>

                            {/* Transcript Preview */}
                            <div
                                className="relative z-10 mt-8 p-4 rounded-xl"
                                style={{
                                    backgroundColor: 'hsl(var(--beleza-background))',
                                    border: '1px solid hsl(var(--beleza-border))'
                                }}
                            >
                                <p
                                    className="text-sm italic"
                                    style={{ color: 'hsl(var(--beleza-muted-foreground))' }}
                                >
                                    "Fala, chefe! O Marcao ta na regua agora. Quer marcar pra 18h? Ta tranquilo, vou reservar seu lugar..."
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CSS for waveform animation */}
            <style>{`
                @keyframes waveform {
                    0% { transform: scaleY(0.5); }
                    100% { transform: scaleY(1.2); }
                }
            `}</style>
        </section>
    );
};

export default AudioWaveformSection;
