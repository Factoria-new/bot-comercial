import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Integration } from "@/lib/agent-creator.types";
import { getBrandIcon } from "@/components/ui/brand-icons";

interface IntegrationCardProps {
    integration: Integration;
    onClick: () => void;
}

export const IntegrationCard = ({ integration, onClick }: IntegrationCardProps) => {
    return (
        <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 cursor-pointer hover:bg-white/10 transition-all flex flex-col items-center gap-3 group w-full md:w-[25%]"
        >
            {/* Platform Icon */}
            <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
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
        </motion.div>
    );
};
