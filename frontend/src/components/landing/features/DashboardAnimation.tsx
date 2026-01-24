import { motion } from "framer-motion";
import { TrendingUp, Users, MessageSquare } from "lucide-react";

export const DashboardAnimation = () => {
    return (
        <div className="w-full h-full relative flex items-center justify-center bg-slate-50/50 backdrop-blur-sm rounded-3xl overflow-hidden p-8">
            <div className="grid grid-cols-2 gap-4 w-full max-w-lg">

                {/* Main Stat Card - Spans 2 cols */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="col-span-2 bg-white rounded-2xl p-6 shadow-xl border border-slate-100"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-sm text-slate-500 font-medium mb-1">Total de Leads</p>
                            <h3 className="text-3xl font-bold text-slate-900">1,284</h3>
                        </div>
                        <div className="p-2 bg-green-50 rounded-lg text-green-600">
                            <TrendingUp size={20} />
                        </div>
                    </div>
                    {/* Graph Placeholder */}
                    <div className="h-24 flex items-end justify-between gap-1">
                        {[40, 65, 50, 80, 55, 90, 70].map((h, i) => (
                            <motion.div
                                key={i}
                                initial={{ height: 0 }}
                                whileInView={{ height: `${h}%` }}
                                transition={{ duration: 0.8, delay: i * 0.1 }}
                                className="w-full bg-slate-100 rounded-t-sm hover:bg-[#00A947] transition-colors"
                            />
                        ))}
                    </div>
                </motion.div>

                {/* Sub Stat 1 */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-2xl p-4 shadow-lg border border-slate-100"
                >
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600 w-fit mb-3">
                        <Users size={18} />
                    </div>
                    <p className="text-xs text-slate-500 font-medium">Novos Clientes</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-xl font-bold text-slate-900">+124</h3>
                        <span className="text-xs text-green-500 font-medium">+12%</span>
                    </div>
                </motion.div>

                {/* Sub Stat 2 */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-2xl p-4 shadow-lg border border-slate-100"
                >
                    <div className="p-2 bg-purple-50 rounded-lg text-purple-600 w-fit mb-3">
                        <MessageSquare size={18} />
                    </div>
                    <p className="text-xs text-slate-500 font-medium">Conversas</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-xl font-bold text-slate-900">8,940</h3>
                    </div>
                </motion.div>

            </div>
        </div>
    );
};
