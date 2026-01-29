import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { PricingWrapper, Heading, Price } from "@/components/ui/animated-pricing-cards";
import { MessageSquare, Calendar, Mic, ShieldCheck } from "lucide-react";

export const PricingSection = () => {
    const [pricingPeriod, setPricingPeriod] = useState<'monthly' | 'semiannual' | 'annual'>('annual');
    const [displayPeriod, setDisplayPeriod] = useState<'monthly' | 'semiannual' | 'annual'>('annual');
    const [cardRotation, setCardRotation] = useState(0);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleToggle = (period: 'monthly' | 'semiannual' | 'annual') => {
        if (pricingPeriod === period) return;

        // Start rotation animation
        setCardRotation(prev => prev + 180);
        setPricingPeriod(period);

        // After the card is halfway through the rotation, update the display content
        setTimeout(() => {
            setDisplayPeriod(period);
        }, 300); // Half of the 0.6s animation duration
    };

    return (
        <section id="pricing" className="relative min-h-screen flex flex-col justify-center px-4 md:px-12 overflow-hidden py-12 md:py-0">
            {/* Sticker Container - Rounded with margins */}
            <div
                className="relative w-full max-w-full md:max-w-[80%] mx-auto h-full min-h-[40vh] md:min-h-[80vh] overflow-hidden flex flex-col"
                style={{
                    borderRadius: isMobile ? '0px' : '32px',
                    backgroundColor: isMobile ? 'transparent' : '#FF621E'
                }}
            >
                {/* Background Video - Inside the sticker */}
                {!isMobile && (
                    <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: '32px', zIndex: 0 }}>
                        <div
                            className="absolute h-full"
                            style={{
                                width: '100%',
                                height: '100%',
                                position: 'absolute',
                                top: 0,
                                left: 0
                            }}
                        >
                            <motion.div
                                className="w-full h-full"
                                style={{
                                    scale: 1.1,
                                    x: '-28%',
                                    y: '1%',
                                    backgroundColor: '#FF621E',
                                    maskImage: 'linear-gradient(to right, black 95%, transparent 100%)',
                                    WebkitMaskImage: 'linear-gradient(to right, black 95%, transparent 100%)'
                                }}
                            >
                                <video
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover"
                                    style={{ display: "block" }}
                                >
                                    <source src="/videos-scroll/NAVIGATE_4K_S10_loop@md.mp4" type="video/mp4" />
                                </video>
                            </motion.div>
                        </div>
                    </div>
                )}

                {/* Content Grid - 1 Col on Mobile, 2 on Desktop */}
                <div className="relative z-10 w-full h-full grid grid-cols-1 md:grid-cols-2">
                    {/* Left Column: Text */}
                    <div className="flex flex-col justify-center md:justify-start items-center text-center p-6 md:p-12 pt-8 md:pt-[6vh]">
                        <h2 className="text-[clamp(1.5rem,4vw,3.5rem)] font-clash font-bold text-[#1E293B] tracking-[-0.04em] leading-[1.1] mb-4 max-w-lg">
                            ESCOLHA SEU PLANO
                        </h2>
                        <p className="text-sm md:text-lg text-slate-800 max-w-sm mx-auto font-medium mb-0">
                            Tudo o que você precisa em um único plano completo.
                        </p>
                    </div>

                    {/* Right Column: Pricing Cards - Fit to container */}
                    <div className="flex flex-col justify-center items-center p-4 md:p-8 pb-12 md:pt-[8vh] relative w-full">
                        {/* Period selector */}
                        <div className="flex justify-center mb-4 md:mb-8 w-full">
                            <div className="bg-slate-800 p-1 rounded-full flex relative items-center cursor-pointer w-full max-w-[320px] md:max-w-sm h-[50px] translate-x-2 md:translate-x-6">
                                <div
                                    className={`absolute top-1 bottom-1 w-[32%] bg-[#00A947] rounded-full transition-all duration-300 
                                    ${pricingPeriod === 'annual' ? 'left-1' : pricingPeriod === 'semiannual' ? 'left-[34%]' : 'left-[67%]'}`}
                                />
                                <div onClick={() => handleToggle('annual')} className={`relative z-10 flex-1 text-center py-2 rounded-full transition-colors duration-300 ${pricingPeriod === 'annual' ? 'text-white font-bold' : 'text-slate-400'}`}>
                                    Anual
                                </div>
                                <div onClick={() => handleToggle('semiannual')} className={`relative z-10 flex-1 text-center py-2 rounded-full transition-colors duration-300 ${pricingPeriod === 'semiannual' ? 'text-white font-bold' : 'text-slate-400'}`}>
                                    Semestral
                                </div>
                                <div onClick={() => handleToggle('monthly')} className={`relative z-10 flex-1 text-center py-2 rounded-full transition-colors duration-300 ${pricingPeriod === 'monthly' ? 'text-white font-bold' : 'text-slate-400'}`}>
                                    Mensal
                                </div>
                            </div>
                        </div>

                        {/* Pricing Logic Variables */}
                        {(() => {
                            const BASE_PRICE = 19.90;

                            const formatCurrency = (value: number) => {
                                return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                            };

                            const getPrice = (base: number, period: string) => {
                                if (period === 'monthly') return base;
                                if (period === 'semiannual') return base * 6; // Full price for 6 months
                                if (period === 'annual') return (base * 10) / 12; // 10 months for 12
                                return base;
                            };

                            const getPeriodLabel = (period: string) => {
                                if (period === 'semiannual') return '/semestre (6 meses)';
                                if (period === 'annual') return <span className="text-lg">/no plano anual (12 Meses)</span>;
                                return '/mês';
                            };

                            // Use displayPeriod for what's currently visible on the card
                            const price = getPrice(BASE_PRICE, displayPeriod);
                            const formattedPrice = formatCurrency(price);
                            const periodLabel = getPeriodLabel(displayPeriod);

                            // Calculate savings percentage
                            const monthlyCostMonthly = BASE_PRICE;
                            const monthlyCostAnnual = (BASE_PRICE * 10) / 12;
                            // For semiannual, comparing per-month basis effectively: (119.40 / 6) = 19.90. So 0% savings vs monthly.
                            const monthlyCostSemiannual = (BASE_PRICE * 6) / 6;

                            let savingsPercent = 0;
                            if (displayPeriod === 'annual') {
                                savingsPercent = Math.round(((monthlyCostMonthly - monthlyCostAnnual) / monthlyCostMonthly) * 100);
                            } else if (displayPeriod === 'semiannual') {
                                savingsPercent = Math.round(((monthlyCostMonthly - monthlyCostSemiannual) / monthlyCostMonthly) * 100);
                            }

                            // Savings text for Annual plan
                            const savingsText = (displayPeriod === 'annual' && savingsPercent > 0) ? (
                                <div className="absolute -top-4 right-0 bg-yellow-400 text-slate-900 text-xs font-bold px-2 py-1 rounded-full animate-bounce">
                                    ECONOMIZE {savingsPercent}%
                                </div>
                            ) : null;

                            // Generate content for card faces
                            const cardContent = (
                                <>
                                    <Heading>Premium</Heading>
                                    <Price>
                                        {formattedPrice}<br /><span className="text-2xl">{periodLabel}</span>
                                    </Price>
                                    <div className="w-full text-left pl-0 md:pl-4 relative">
                                        {savingsText}
                                        <ul className="text-base md:text-lg space-y-3 mt-4 md:mt-6">
                                            <li className="flex items-center gap-3">
                                                <MessageSquare className="w-5 h-5 flex-shrink-0" />
                                                <span>Bot de WhatsApp</span>
                                            </li>
                                            <li className="flex items-center gap-3">
                                                <Calendar className="w-5 h-5 flex-shrink-0" />
                                                <span>Google Calendar</span>
                                            </li>
                                            <li className="flex items-center gap-3">
                                                <Mic className="w-5 h-5 flex-shrink-0" />
                                                <span>TTS (Áudio Natural)</span>
                                            </li>
                                            <li className="flex items-center gap-3">
                                                <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                                                <span>Suporte Prioritário</span>
                                            </li>
                                        </ul>
                                    </div>
                                </>
                            );

                            return (
                                <div className="flex flex-row items-center justify-center gap-4 xl:gap-8 flex-nowrap w-full">
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5 }}
                                        className="relative z-10 w-full max-w-[320px] md:max-w-sm"
                                    >
                                        <PricingWrapper
                                            contactHref="/payment"
                                            linkState={{ plan: 'premium', period: pricingPeriod, price: `${formattedPrice}${periodLabel}` }}
                                            type="waves"
                                            className="bg-[#00A947]"
                                            featured={true}
                                            rotation={cardRotation}
                                            ignoreAuth={true}
                                            backChildren={cardContent}
                                        >
                                            {cardContent}
                                        </PricingWrapper>
                                    </motion.div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </div >
        </section >
    );
};
