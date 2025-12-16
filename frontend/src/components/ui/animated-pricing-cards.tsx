import { Link } from 'react-router-dom'
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

const Wave = () => (
    <svg
        width="129"
        height="1387"
        viewBox="0 0 129 1387"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M11.2131 11L106.283 106.07M106.283 106.07L117.279 117.066M106.283 106.07L22.2962 190.003M106.283 106.07L116.688 95.6708M11.2962 200.997L22.2962 190.003M22.2962 190.003L11.2529 178.96M22.2962 190.003L106.323 274.03M106.323 274.03L117.319 285.026M106.323 274.03L22.4537 357.846M106.323 274.03L116.728 263.631M11.3361 368.957L22.4537 357.846M22.4537 357.846L11.5493 346.901M22.4537 357.846L106.44 442.149M106.44 442.149L117.416 453.166M106.44 442.149L22.2962 525.925M106.44 442.149L116.865 431.769M11.2756 536.897L22.2962 525.925M22.2962 525.925L11.2737 514.861M22.2962 525.925L106.165 610.109M106.165 610.109L117.14 621.126M106.165 610.109L11 704.857M106.165 610.109L116.59 599.729M11.2131 683L106.283 778.07M106.283 778.07L117.279 789.066M106.283 778.07L22.2962 862.003M106.283 778.07L116.688 767.671M11.2962 872.997L22.2962 862.003M22.2962 862.003L11.2529 850.96M22.2962 862.003L106.323 946.03M106.323 946.03L117.319 957.026M106.323 946.03L22.4537 1029.85M106.323 946.03L116.728 935.631M11.3361 1040.96L22.4537 1029.85M22.4537 1029.85L11.5493 1018.9M22.4537 1029.85L106.44 1114.15M106.44 1114.15L117.416 1125.17M106.44 1114.15L22.2962 1197.92M106.44 1114.15L116.865 1103.77M11.2756 1208.9L22.2962 1197.92M22.2962 1197.92L11.2737 1186.86M22.2962 1197.92L106.165 1282.11M106.165 1282.11L117.14 1293.13M106.165 1282.11L11 1376.86M106.165 1282.11L116.59 1271.73"
            stroke="#282828"
            strokeWidth="31"
        />
    </svg>
)

const Cross = () => (
    <svg
        width="130"
        height="130"
        viewBox="0 0 130 130"
        fill="none"
        className={'scale-125'}
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M11 11L118.899 119M11.101 119L119 11" stroke="#282828" strokeWidth="31" />
    </svg>
)

const BorderBeam = ({ className }: { className?: string }) => (
    <div
        className={cn("absolute inset-0 z-0 pointer-events-none rounded-2xl overflow-hidden", className)}
        style={{
            maskImage: 'linear-gradient(black, black), linear-gradient(black, black)',
            maskClip: 'content-box, border-box',
            maskComposite: 'exclude',
            WebkitMaskComposite: 'xor',
            padding: '4px',
        }}
    >
        <div
            className="absolute -inset-[50%] animate-[spin_4s_linear_infinite]"
            style={{
                backgroundImage: `conic-gradient(from 0deg at 50% 50%, transparent 0%, transparent 50%, #fff 100%)`
            }}
        />
    </div>
)

export const PricingWrapper: React.FC<{
    children: React.ReactNode
    type?: 'waves' | 'crosses'
    contactHref: string
    className?: string
    featured?: boolean
    rotation?: number
    backChildren?: React.ReactNode
}> = ({ children, contactHref, className, type = 'waves', featured = false, rotation = 0, backChildren }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
    const mouseY = useSpring(y, { stiffness: 500, damping: 100 });

    function handleMouseMove(event: React.MouseEvent<HTMLElement>) {
        const rect = event.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    }

    function handleMouseLeave() {
        x.set(0);
        y.set(0);
    }

    const rotateX = useTransform(mouseY, [-0.5, 0.5], ["20deg", "-20deg"]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-20deg", "20deg"]);

    // Dynamic shadow that moves opposite to the tilt
    const shadowX = useTransform(mouseX, [-0.5, 0.5], ["20px", "-20px"]);
    const shadowY = useTransform(mouseY, [-0.5, 0.5], ["20px", "-20px"]);
    const boxShadow = useTransform(
        [shadowX, shadowY],
        ([sx, sy]) => `${sx} ${sy} 40px rgba(0,0,0,0.4)`
    );

    return (
        <div
            className={'min-h-[300px] h-[600px] max-h-[500px] max-w-sm w-full relative sm:mx-6'}
            style={{ perspective: "1000px" }}
        >
            <motion.article
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{
                    rotateX,
                    rotateY,
                    transformStyle: "preserve-3d",
                    willChange: "transform",
                }}
                className={cn(
                    'w-full h-full relative duration-200',
                )}
            >
                {/* FLIPPER CONTAINER - Handles the 180deg rotation */}
                <motion.div
                    initial={false}
                    animate={{ rotateY: rotation }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                    style={{
                        width: "100%",
                        height: "100%",
                        transformStyle: "preserve-3d",
                    }}
                >
                    {/* THICKNESS LAYERS (Stacked behind - Attached to Flipper) */}
                    {/* We need thickness to follow the flip, so they should be inside the flipper or duplicated? 
                         actually, thickness usually stays "behind" the current face. 
                         For simplicity in this specific "card" style, let's keep thickness attached to the "Front" mentally, 
                         but since it rotates, we might need a "Back Thickness" or just let it rotate.
                         Let's try keeping them here, they will rotate with the card.
                     */}
                    <div
                        className={cn('absolute inset-[1px] rounded-2xl brightness-50 z-[-4] border-2 border-transparent', className)}
                        style={{ transform: "translateZ(-16px)", backfaceVisibility: 'hidden' }}
                    />
                    <div
                        className={cn('absolute inset-[1px] rounded-2xl brightness-50 z-[-3] border-2 border-transparent', className)}
                        style={{ transform: "translateZ(-12px)", backfaceVisibility: 'hidden' }}
                    />
                    <div
                        className={cn('absolute inset-[1px] rounded-2xl brightness-75 z-[-2] border-2 border-transparent', className)}
                        style={{ transform: "translateZ(-8px)", backfaceVisibility: 'hidden' }}
                    />
                    <div
                        className={cn('absolute inset-[1px] rounded-2xl brightness-90 z-[-1] border-2 border-transparent', className)}
                        style={{ transform: "translateZ(-4px)", backfaceVisibility: 'hidden' }}
                    />

                    {/* FRONT FACE (Main Content) */}
                    <div
                        style={{
                            backfaceVisibility: 'hidden',
                            transform: "rotateY(0deg)", // Explicitly front
                            position: "absolute",
                            inset: 0,
                            borderRadius: "1rem",
                            overflow: "hidden"
                        }}
                    >
                        <motion.div
                            style={{
                                transform: "translateZ(0px)",
                                transformStyle: "preserve-3d",
                                boxShadow
                            }}
                            className={cn(
                                'w-full h-full relative text-white border-2 border-white/20',
                                className
                            )}
                        >
                            <ContentLayer contactHref={contactHref} type={type} featured={featured}>{children}</ContentLayer>
                        </motion.div>
                    </div>

                    {/* BACK FACE (Annual Content) */}
                    <div
                        style={{
                            backfaceVisibility: 'hidden',
                            transform: "rotateY(180deg)", // Explicitly back
                            position: "absolute",
                            inset: 0,
                            borderRadius: "1rem",
                            overflow: "hidden"
                        }}
                    >
                        <motion.div
                            style={{
                                transform: "translateZ(0px)", // Should match front
                                transformStyle: "preserve-3d",
                                boxShadow // Shadow might look weird if light source text doesn't change, but ok for now
                            }}
                            className={cn(
                                'w-full h-full relative text-white border-2 border-white/20',
                                className
                            )}
                        >
                            <ContentLayer contactHref={contactHref} type={type} featured={featured}>{backChildren}</ContentLayer>
                        </motion.div>
                    </div>
                </motion.div>
            </motion.article>
        </div>
    )
}

// Extracted Content Layer to reuse for Front/Back
const ContentLayer: React.FC<{
    children: React.ReactNode,
    contactHref: string,
    type: 'waves' | 'crosses',
    featured: boolean
}> = ({ children, contactHref, type, featured }) => (
    <>
        <div
            style={{ transform: "translateZ(50px)", transformStyle: "preserve-3d" }}
            className={
                'w-full h-full absolute top-0 left-0 z-[2] p-4 flex flex-col items-center justify-start text-center sm:gap-10 gap-7'
            }
        >
            {children}
            <div style={{ transform: "translateZ(25px)" }} className={'w-full h-full flex items-end justify-end text-base'}>
                {/* Logic to determine button state based on plan */}
                <PricingButton contactHref={contactHref} isProCard={featured} />
            </div>
        </div>
        {type === 'waves' && (
            <>
                <div className={'w-fit h-fit absolute -top-[106px] sm:left-4 -left-0 waves z-0 animate-[waves_10s_linear_infinite]'}>
                    <Wave />
                </div>
                <div className={'w-fit h-fit absolute -top-[106px] sm:right-4 -right-0 waves z-0 animate-[waves_10s_linear_infinite]'}>
                    <Wave />
                </div>
            </>
        )}
        {type === 'crosses' && (
            <>
                <div
                    className={'w-fit h-fit absolute top-0 -left-10 z-0 animate-[spin_5s_linear_infinite]'}
                >
                    <Cross />
                </div>
                <div
                    className={'w-fit h-fit absolute top-1/2 -right-12 z-0 animate-[spin_5s_linear_infinite]'}
                >
                    <Cross />
                </div>
                <div
                    className={'w-fit h-fit absolute top-[85%] -left-5 z-0 animate-[spin_5s_linear_infinite]'}
                >
                    <Cross />
                </div>
            </>
        )}
        {featured && <BorderBeam className="z-10" />}
    </>
)


export const Heading: React.FC<{ children: React.ReactNode; className?: string }> = ({
    children,
    className
}) => (
    <h1
        style={{ transform: "translateZ(30px)" }}
        className={cn('sm:text-5xl leading-[1] text-[clamp(1.7rem,10vw,3rem)] font-bold drop-shadow-lg', className)}
    >
        {children}
    </h1>
)

export const Price: React.FC<{ children: React.ReactNode; className?: string }> = ({
    children,
    className
}) => (
    <div
        style={{ lineHeight: '1', transform: "translateZ(20px)" }}
        className={cn('sm:text-5xl text-[clamp(1.7rem,10vw,3rem)] font-bold drop-shadow-md', className)}
    >
        {children}
    </div>
)

export const Paragraph: React.FC<{ children: React.ReactNode; className?: string }> = ({
    children,
    className
}) => (
    <p
        style={{ transform: "translateZ(10px)" }}
        className={cn('sm:text-2xl text-[clamp(0.1rem,20vw,1.25rem)] font-bold drop-shadow-sm', className)}
    >
        {children}
    </p>
)

const PricingButton: React.FC<{ contactHref: string; isProCard: boolean }> = ({ contactHref, isProCard }) => {
    const { user } = useAuth();

    // Determine if this is the user's current plan
    // If user is not logged in, they don't have a "current plan" visible here usually, or defaults to basic logic
    if (!user) {
        return (
            <Link to={contactHref} className={'w-full h-fit'}>
                <motion.button
                    whileHover={{
                        scale: 1.05,
                        z: 50,
                        boxShadow: "0px 20px 40px rgba(0,0,0,0.4)"
                    }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    style={{ transformStyle: "preserve-3d" }}
                    className={'h-12 w-full bg-white rounded-lg text-neutral-900 font-bold transition-colors shadow-lg'}
                >
                    Começar Agora
                </motion.button>
            </Link>
        );
    }

    const isCurrentPlan = (
        (isProCard && (user.role === 'pro' || user.role === 'admin')) ||
        (!isProCard && user.role === 'basic')
    );

    if (isCurrentPlan) {
        return (
            <div className={'w-full h-fit'}>
                <button
                    disabled
                    className={'h-12 w-full bg-white/20 backdrop-blur-md rounded-lg text-white font-bold border border-white/30 cursor-default flex items-center justify-center gap-2'}
                >
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                    Plano Atual
                </button>
            </div>
        );
    }

    return (
        <Link to={contactHref} className={'w-full h-fit'}>
            <motion.button
                whileHover={{
                    scale: 1.05,
                    z: 50,
                    boxShadow: "0px 20px 40px rgba(0,0,0,0.4)"
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                style={{ transformStyle: "preserve-3d" }}
                className={'h-12 w-full bg-white rounded-lg text-neutral-900 font-bold transition-colors shadow-lg'}
            >
                {isProCard ? 'Fazer Upgrade' : 'Voltar para Básico'}
            </motion.button>
        </Link>
    );
}
