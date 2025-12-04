"use client"

import { motion } from "motion/react"
import { Check } from "lucide-react"

export default function PricingCreative() {
    return (
        <section className="relative flex flex-col items-center py-24">
            <div className="flex flex-col items-center justify-center gap-8 md:flex-row">
                {/* Starter Card */}
                <motion.div
                    initial={{ opacity: 0, y: 40, rotate: -6 }}
                    animate={{ opacity: 1, y: 0, rotate: -6 }}
                    transition={{ type: "spring", duration: 0.5 }}
                    className="relative z-10 w-72 rounded-2xl border border-primary/10 bg-white/80 px-8 py-10 text-foreground shadow-lg backdrop-blur-md transition-transform hover:scale-105"
                >
                    <div className="mb-2 text-lg font-bold text-primary">Starter</div>
                    <div className="mb-4 text-3xl font-extrabold text-foreground">R$ 497<span className="text-sm font-normal text-muted-foreground">/mês</span></div>
                    <ul className="mb-6 space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-emerald-500" />1 Atendente Digital</li>
                        <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-emerald-500" />1.000 Conversas/mês</li>
                    </ul>
                    <button className="w-full rounded-md bg-primary py-2 font-semibold text-white hover:bg-primary/90 transition shadow-md">
                        Começar Agora
                    </button>
                </motion.div>

                {/* Creative Pro Card (Floating) */}
                <motion.div
                    initial={{ opacity: 0, y: 60, rotate: 0 }}
                    animate={{ opacity: 1, y: -20, rotate: 0 }}
                    transition={{ type: "spring", duration: 0.7 }}
                    className="relative z-20 w-80 scale-110 rounded-3xl border-4 border-white/20 bg-gradient-to-b from-primary to-[#005585] px-10 py-14 text-white shadow-2xl transition-transform hover:scale-[1.12]"
                >
                    <motion.div
                        animate={{ y: [10, 6, 10] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        className="absolute -top-6 left-1/2 -translate-x-1/2 rounded-full border border-white/20 bg-bora-blue-400 px-5 py-1 text-xs font-extrabold text-white shadow"
                    >
                        MAIS POPULAR
                    </motion.div>
                    <div className="mb-2 text-lg font-bold text-white/90">Pro</div>
                    <div className="mb-4 text-5xl font-black">R$ 997<span className="text-lg font-normal text-white/70">/mês</span></div>
                    <ul className="mb-6 space-y-2 text-base text-white/90">
                        <li className="flex items-center"><Check className="mr-2 h-5 w-5 text-emerald-300" />3 Atendentes Digitais</li>
                        <li className="flex items-center"><Check className="mr-2 h-5 w-5 text-emerald-300" />5.000 Conversas/mês</li>
                        <li className="flex items-center"><Check className="mr-2 h-5 w-5 text-emerald-300" />Integração CRM</li>
                        <li className="flex items-center"><Check className="mr-2 h-5 w-5 text-emerald-300" />Suporte Prioritário</li>
                    </ul>
                    <button className="w-full rounded-md bg-white py-2 font-bold text-primary hover:bg-gray-100 transition shadow-lg">
                        Escolher Pro
                    </button>
                </motion.div>

                {/* Enterprise Card */}
                <motion.div
                    initial={{ opacity: 0, y: 40, rotate: 6 }}
                    animate={{ opacity: 1, y: 0, rotate: 6 }}
                    transition={{ type: "spring", duration: 0.6 }}
                    className="relative z-10 w-72 rounded-2xl border border-primary/10 bg-white/80 px-8 py-10 text-foreground shadow-lg backdrop-blur-md transition-transform hover:scale-105"
                >
                    <div className="mb-2 text-lg font-bold text-primary">Enterprise</div>
                    <div className="mb-4 text-3xl font-extrabold text-foreground">Sob Consulta</div>
                    <ul className="mb-6 space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-emerald-500" />Atendentes Ilimitados</li>
                        <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-emerald-500" />API Dedicada</li>
                        <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-emerald-500" />SLA & Suporte</li>
                    </ul>
                    <button className="w-full rounded-md bg-primary py-2 font-semibold text-white hover:bg-primary/90 transition shadow-md">
                        Falar com Vendas
                    </button>
                </motion.div>
            </div>
        </section>
    )
}
