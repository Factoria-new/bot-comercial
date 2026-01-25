import { motion } from "framer-motion";
import { useState } from "react";
import { PricingWrapper, Heading, Price } from "@/components/ui/animated-pricing-cards";

export const PricingSection = () => {
    const [pricingPeriod, setPricingPeriod] = useState<'monthly' | 'semiannual' | 'annual'>('monthly');
    const [isFanOpen, setIsFanOpen] = useState(true);
    const [rotation, setRotation] = useState(0);

    const handleToggle = (period: 'monthly' | 'semiannual' | 'annual') => {
        if (!isFanOpen || pricingPeriod === period) return;

        setIsFanOpen(false);
        setTimeout(() => {
            setRotation(prev => prev + 360);
        }, 400);
        setTimeout(() => {
            setPricingPeriod(period);
        }, 850);
        setTimeout(() => {
            setIsFanOpen(true);
        }, 1100);
    };

    return (
        <section id="pricing" className="relative min-h-screen flex flex-col justify-center px-12 md:px-4 overflow-hidden">
            {/* Sticker Container - Rounded with margins */}
            <div
                className="relative w-full max-w-[95%] md:max-w-[80%] mx-auto h-full min-h-[80vh] overflow-hidden md:block flex flex-col"
                style={{
                    borderRadius: '32px',
                    backgroundColor: '#FF621E'
                }}
            >
                {/* Background Video - Inside the sticker */}
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

                {/* Content Grid - Always 2 Columns (Text | Cards) */}
                <div className="relative z-10 w-full h-full grid grid-cols-2">
                    {/* Left Column: Text */}
                    <div className="flex flex-col justify-start items-center text-center p-4 pt-[8vh] md:p-12 md:pt-[12vh]">
                        <h2 className="text-[clamp(1.5rem,4vw,3.5rem)] font-clash font-bold text-[#1E293B] tracking-[-0.04em] leading-[1.1] mb-6 max-w-lg">
                            ESCOLHA SEU PLANO
                        </h2>
                        <p className="text-base md:text-lg text-slate-800 max-w-sm mx-auto font-medium mb-8">
                            Comece hoje e cancele quando quiser. Sem fidelidade, sem burocracia.
                        </p>
                        <video
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-16 h-16 md:w-24 md:h-24 mx-auto"
                        >
                            <source src="/videos/arrow.webm" type="video/webm" />
                        </video>
                    </div>

                    {/* Right Column: Pricing Cards - Scaled to fit */}
                    <div className="flex flex-col justify-center items-center p-2 pt-[6vh] md:p-8 md:pt-[8vh] relative origin-center scale-[0.55] sm:scale-[0.65] md:scale-[0.75] lg:scale-90 transition-transform">
                        {/* Period selector */}
                        <div className="flex justify-center mb-8 w-full">
                            <div className="bg-slate-800 p-1 rounded-full flex relative items-center cursor-pointer w-[340px] h-[50px]">
                                <div
                                    className={`absolute top-1 bottom-1 w-[32%] bg-[#00A947] rounded-full transition-all duration-300 ${pricingPeriod === 'annual' ? 'left-1' : pricingPeriod === 'semiannual' ? 'left-[34%]' : 'left-[67%]'}`}
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
                            const BASE_PRICE_BASIC = 19.90;
                            const BASE_PRICE_PRO = 29.90;

                            const formatCurrency = (value: number) => {
                                return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                            };

                            const getPrice = (base: number, period: string) => {
                                if (period === 'monthly') return base;
                                if (period === 'semiannual') return base * 6;
                                if (period === 'annual') return base * 10;
                                return base;
                            };

                            const basicPrice = getPrice(BASE_PRICE_BASIC, pricingPeriod);
                            const proPrice = getPrice(BASE_PRICE_PRO, pricingPeriod);

                            const formattedBasicPrice = formatCurrency(basicPrice);
                            const formattedProPrice = formatCurrency(proPrice);

                            const periodLabel = pricingPeriod === 'monthly' ? '/mês' : pricingPeriod === 'semiannual' ? '/semestre' : '/ano';

                            return (
                                <div className="flex flex-row items-center justify-center gap-4 xl:gap-8 flex-nowrap w-full">
                                    <motion.div
                                        animate={{
                                            x: isFanOpen ? 0 : "50%",
                                            rotate: isFanOpen ? 0 : -5,
                                            zIndex: isFanOpen ? 1 : 10
                                        }}
                                        transition={{ duration: 0.5, ease: "easeInOut" }}
                                        className="relative z-10 w-full max-w-sm"
                                    >
                                        <PricingWrapper
                                            contactHref="/payment"
                                            linkState={{ plan: 'basic', period: pricingPeriod, price: `${formattedBasicPrice}${periodLabel}` }}
                                            type="waves"
                                            className="bg-[#00A947]"
                                            rotation={rotation}
                                            ignoreAuth={true}
                                            backChildren={
                                                <>
                                                    <Heading>Básico</Heading>
                                                    <Price>
                                                        {formattedBasicPrice}<br /><span className="text-2xl">{periodLabel}</span>
                                                    </Price>
                                                    <div className="w-full text-left pl-4">
                                                        <ul className="text-lg">
                                                            <li>Bot de WhatsApp</li>
                                                        </ul>
                                                    </div>
                                                </>
                                            }
                                        >
                                            {< >
                                                <Heading>Básico</Heading>
                                                <Price>
                                                    {formattedBasicPrice}<br /><span className="text-2xl">{periodLabel}</span>
                                                </Price>
                                                <div className="w-full text-left pl-4">
                                                    <ul className="text-lg">
                                                        <li>Bot de WhatsApp</li>
                                                    </ul>
                                                </div>
                                            </>}
                                        </PricingWrapper>
                                    </motion.div>

                                    <motion.div
                                        animate={{
                                            x: isFanOpen ? 0 : "-50%",
                                            rotate: isFanOpen ? 0 : 5,
                                            zIndex: isFanOpen ? 1 : 20
                                        }}
                                        transition={{ duration: 0.5, ease: "easeInOut" }}
                                        className="relative z-10 w-full max-w-sm"
                                    >
                                        <PricingWrapper
                                            contactHref="/payment"
                                            linkState={{ plan: 'pro', period: pricingPeriod, price: `${formattedProPrice}${periodLabel}` }}
                                            type="waves"
                                            className="bg-[#00A947]"
                                            featured={true}
                                            rotation={rotation}
                                            ignoreAuth={true}
                                            backChildren={
                                                <>
                                                    <Heading>Pro</Heading>
                                                    <Price>
                                                        {formattedProPrice}<br /><span className="text-2xl">{periodLabel}</span>
                                                    </Price>
                                                    <div className="w-full text-left pl-4">
                                                        <ul className="text-lg">
                                                            <li>Bot de WhatsApp</li>
                                                            <li>Google Calendar</li>
                                                            <li>TTS (Áudio)</li>
                                                        </ul>
                                                    </div>
                                                </>
                                            }
                                        >
                                            {< >
                                                <Heading>Pro</Heading>
                                                <Price>
                                                    {formattedProPrice}<br /><span className="text-2xl">{periodLabel}</span>
                                                </Price>
                                                <div className="w-full text-left pl-4">
                                                    <ul className="text-lg">
                                                        <li>Bot de WhatsApp</li>
                                                        <li>Google Calendar</li>
                                                        <li>TTS (Áudio)</li>
                                                    </ul>
                                                </div>
                                            </>}
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
