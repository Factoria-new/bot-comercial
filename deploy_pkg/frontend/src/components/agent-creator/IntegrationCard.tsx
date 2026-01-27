import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Integration } from "@/lib/agent-creator.types";
import { getBrandIcon } from "@/components/ui/brand-icons";

interface IntegrationCardProps {
    integration: Integration;
    onClick: () => void;
}

export const IntegrationCard = ({ integration, onClick }: IntegrationCardProps) => {
    const isComingSoon = integration.isComingSoon;

    return (
        <motion.div
            whileHover={!isComingSoon ? { scale: 1.05 } : {}}
            whileTap={!isComingSoon ? { scale: 0.98 } : {}}
            onClick={!isComingSoon ? onClick : undefined}
            className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 transition-all flex flex-col items-center gap-3 group w-full md:w-[25%] relative overflow-hidden ${isComingSoon ? 'opacity-60 cursor-default' : 'cursor-pointer hover:bg-white/10'}`}
        >
            {/* Platform Icon */}
            <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-transform ${!isComingSoon ? 'group-hover:scale-110' : ''}`}
                style={{ backgroundColor: integration.color + '20' }}
            >
                {(() => {
                    const Icon = getBrandIcon(integration.id);
                    return Icon ? (
                        <Icon className="w-8 h-8" style={{ color: integration.color }} />
                    ) : null;
                })()}
            </div>
            <span className="text-white font-medium text-sm">{integration.name}</span>
            {integration.connected && (
                <span className="text-emerald-400 text-xs flex items-center gap-1">
                    <Check className="w-3 h-3" /> Conectado
                </span>
            )}
            {isComingSoon && (
                <span className="text-white/50 text-xs font-medium bg-white/10 px-2 py-0.5 rounded-full border border-white/5">
                    Em breve
                </span>
            )}
        </motion.div>
    );
};
