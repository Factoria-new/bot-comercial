import { useEffect, useRef } from "react";
import { motion, useInView, useSpring } from "framer-motion";
import { TrendingUp, Users, MessageSquare } from "lucide-react";

// Helper for Animated Counter
const Counter = ({ to, prefix = "", suffix = "" }: { to: number; prefix?: string; suffix?: string }) => {
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true });

    // Spring physics for smooth counting
    const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });

    useEffect(() => {
        if (inView) {
            spring.set(to);
        }
    }, [inView, to, spring]);

    useEffect(() => {
        return spring.on("change", (latest) => {
            if (ref.current) {
                // Format with commas for thousands
                const value = Math.floor(latest).toLocaleString('en-US');
                ref.current.textContent = `${prefix}${value}${suffix}`;
            }
        });
    }, [spring, prefix, suffix]);

    return <span ref={ref} />;
};

export const DashboardAnimation = () => {
    return (
        <div className="w-full h-full flex items-center justify-center p-4">
            <div className="relative w-full max-w-[420px]">
                {/* Background decorative elements */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-green-200/20 rounded-full blur-2xl" />
                <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-blue-200/20 rounded-full blur-2xl" />

                <div className="grid grid-cols-2 gap-4">
                    {/* Main Stat Card - Spans 2 cols */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="col-span-2 bg-white rounded-3xl p-6 shadow-xl border border-slate-100 z-10"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <p className="text-sm text-slate-500 font-medium mb-1">Total de Leads</p>
                                <h3 className="text-4xl font-bold text-slate-900 tracking-tight">
                                    <Counter to={1284} />
                                </h3>
                            </div>
                            <div className="p-2.5 bg-[#00A947]/10 rounded-xl text-[#00A947]">
                                <TrendingUp size={24} />
                            </div>
                        </div>
                        {/* Graph */}
                        <div className="h-32 flex items-end justify-between gap-2">
                            {[35, 55, 45, 70, 50, 85, 65, 95].map((h, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ height: 4, opacity: 0 }}
                                    whileInView={{ height: `${h}%`, opacity: 1 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 20,
                                        delay: i * 0.05 + 0.2
                                    }}
                                    className={`w-full rounded-t-lg transition-colors duration-300 ${i === 7 ? 'bg-[#00A947]' : 'bg-slate-100 hover:bg-[#00A947]/40'
                                        }`}
                                />
                            ))}
                        </div>
                    </motion.div>

                    {/* Sub Stat 1 */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        whileHover={{ y: -4 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-3xl p-5 shadow-lg border border-slate-100 z-10"
                    >
                        <div className="p-2 bg-blue-50 rounded-xl text-blue-600 w-fit mb-3">
                            <Users size={20} />
                        </div>
                        <p className="text-xs text-slate-500 font-medium mb-1">Novos Clientes</p>
                        <div className="flex items-baseline gap-2 flex-wrap">
                            <h3 className="text-2xl font-bold text-slate-900">
                                <Counter to={124} prefix="+" />
                            </h3>
                            <span className="text-xs text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded-full">+12%</span>
                        </div>
                    </motion.div>

                    {/* Sub Stat 2 */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        whileHover={{ y: -4 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-3xl p-5 shadow-lg border border-slate-100 z-10"
                    >
                        <div className="p-2 bg-purple-50 rounded-xl text-purple-600 w-fit mb-3">
                            <MessageSquare size={20} />
                        </div>
                        <p className="text-xs text-slate-500 font-medium mb-1">Conversas</p>
                        <h3 className="text-2xl font-bold text-slate-900">
                            <Counter to={8940} />
                        </h3>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};
