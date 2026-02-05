import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * HandsGallerySection - Beleza Landing Page
 * Carousel showing beauty professionals at work - "Maos Livres"
 * Uses --beleza-* CSS variables
 */

const galleryItems = [
    {
        id: 1,
        title: "Barbearia",
        description: "Maos que fazem o degradê perfeito nao devem parar pra digitar.",
        gradient: "linear-gradient(135deg, hsl(292 91% 73% / 0.3) 0%, hsl(262 83% 66% / 0.3) 100%)"
    },
    {
        id: 2,
        title: "Nail Design",
        description: "Cada unha e uma obra de arte. Seu talento vale mais que responder mensagens.",
        gradient: "linear-gradient(135deg, hsl(330 80% 60% / 0.3) 0%, hsl(292 91% 73% / 0.3) 100%)"
    },
    {
        id: 3,
        title: "Coloracao",
        description: "Com as maos na tintura, voce nao pode atender o WhatsApp. A IA pode.",
        gradient: "linear-gradient(135deg, hsl(262 83% 66% / 0.3) 0%, hsl(280 70% 50% / 0.3) 100%)"
    }
];

export const HandsGallerySection = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    useEffect(() => {
        if (!isAutoPlaying) return;

        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % galleryItems.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [isAutoPlaying]);

    const goToSlide = (index: number) => {
        setCurrentSlide(index);
        setIsAutoPlaying(false);
        setTimeout(() => setIsAutoPlaying(true), 10000);
    };

    const nextSlide = () => goToSlide((currentSlide + 1) % galleryItems.length);
    const prevSlide = () => goToSlide((currentSlide - 1 + galleryItems.length) % galleryItems.length);

    return (
        <section
            className="py-20 relative overflow-hidden"
            style={{ backgroundColor: 'hsl(var(--beleza-background-alt))' }}
        >
            <div className="container px-4 md:px-6">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2
                        className="text-3xl md:text-5xl font-display font-bold mb-6 uppercase"
                        style={{ color: 'hsl(var(--beleza-foreground))' }}
                    >
                        Suas maos{' '}
                        <span
                            className="text-transparent bg-clip-text"
                            style={{ backgroundImage: 'var(--beleza-gradient-primary)' }}
                        >
                            fazem dinheiro
                        </span>
                    </h2>
                    <p
                        className="text-xl"
                        style={{ color: 'hsl(var(--beleza-muted-foreground))' }}
                    >
                        Nao as desperdice digitando no WhatsApp.
                    </p>
                </div>

                {/* Carousel Container */}
                <div className="relative max-w-4xl mx-auto">
                    {/* Glassmorphism Card */}
                    <div
                        className="relative rounded-3xl backdrop-blur-xl overflow-hidden"
                        style={{
                            backgroundColor: 'hsl(var(--beleza-card) / 0.6)',
                            border: '1px solid hsl(var(--beleza-border))',
                            boxShadow: 'var(--beleza-shadow-card)'
                        }}
                    >
                        {/* Slides */}
                        <div className="relative h-[400px] md:h-[500px]">
                            {galleryItems.map((item, index) => (
                                <div
                                    key={item.id}
                                    className={`absolute inset-0 transition-all duration-700 ease-out ${index === currentSlide
                                            ? 'opacity-100 translate-x-0'
                                            : index < currentSlide
                                                ? 'opacity-0 -translate-x-full'
                                                : 'opacity-0 translate-x-full'
                                        }`}
                                >
                                    {/* Background Gradient */}
                                    <div
                                        className="absolute inset-0"
                                        style={{ background: item.gradient }}
                                    />

                                    {/* Abstract Hands Representation */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div
                                            className="w-64 h-64 rounded-full blur-[80px] opacity-50"
                                            style={{ background: 'var(--beleza-gradient-primary)' }}
                                        />
                                    </div>

                                    {/* Content Overlay */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-end p-8 md:p-12 text-center">
                                        <div
                                            className="inline-flex px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider mb-4"
                                            style={{
                                                background: 'var(--beleza-gradient-primary)',
                                                color: 'white'
                                            }}
                                        >
                                            {item.title}
                                        </div>
                                        <p
                                            className="text-xl md:text-2xl font-medium max-w-lg"
                                            style={{ color: 'hsl(var(--beleza-foreground))' }}
                                        >
                                            {item.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Navigation Arrows */}
                        <button
                            onClick={prevSlide}
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 z-10"
                            style={{
                                backgroundColor: 'hsl(var(--beleza-card))',
                                border: '1px solid hsl(var(--beleza-border))'
                            }}
                        >
                            <ChevronLeft
                                className="w-6 h-6"
                                style={{ color: 'hsl(var(--beleza-foreground))' }}
                            />
                        </button>
                        <button
                            onClick={nextSlide}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 z-10"
                            style={{
                                backgroundColor: 'hsl(var(--beleza-card))',
                                border: '1px solid hsl(var(--beleza-border))'
                            }}
                        >
                            <ChevronRight
                                className="w-6 h-6"
                                style={{ color: 'hsl(var(--beleza-foreground))' }}
                            />
                        </button>
                    </div>

                    {/* Dots Indicator */}
                    <div className="flex justify-center gap-3 mt-8">
                        {galleryItems.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goToSlide(index)}
                                className="w-3 h-3 rounded-full transition-all duration-300"
                                style={{
                                    background: index === currentSlide
                                        ? 'var(--beleza-gradient-primary)'
                                        : 'hsl(var(--beleza-border))',
                                    boxShadow: index === currentSlide
                                        ? 'var(--beleza-shadow-accent)'
                                        : 'none',
                                    transform: index === currentSlide ? 'scale(1.3)' : 'scale(1)'
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HandsGallerySection;
