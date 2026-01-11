import React, { useEffect, useState } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { MessageSquare, Users, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import VoiceCard from './VoiceCard';

interface Metrics {
    totalMessages: number;
    newContacts: number;
    activeChats: number;
}

const MetricsTable: React.FC = () => {
    const { socket } = useSocket();
    const [metrics, setMetrics] = useState<Metrics>({
        totalMessages: 0,
        newContacts: 0,
        activeChats: 0
    });

    useEffect(() => {
        if (!socket) return;

        // Listen for metrics updates
        socket.on('metrics-update', (newMetrics: Metrics) => {
            setMetrics(newMetrics);
        });

        // Request initial metrics
        socket.emit('request-metrics');

        return () => {
            socket.off('metrics-update');
        };
    }, [socket]);

    const cards = [
        {
            title: "Mensagens Recebidas",
            value: metrics.totalMessages,
            icon: MessageSquare,
            color: "text-blue-600",
            bgColor: "bg-blue-100",
            trend: "+12%", // Placeholder for now
            trendUp: true
        },
        {
            title: "Novos Clientes",
            value: metrics.newContacts,
            icon: Users,
            color: "text-emerald-600",
            bgColor: "bg-emerald-100",
            trend: "+5%", // Placeholder for now
            trendUp: true
        },
        {
            title: "Chats Ativos",
            value: metrics.activeChats,
            icon: Activity,
            color: "text-purple-600",
            bgColor: "bg-purple-100",
            trend: "Online",
            trendUp: true
        }
    ];

    return (
        <div className="w-full max-w-4xl mx-auto p-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AnimatePresence>
                    {cards.map((card, index) => (
                        <motion.div
                            key={card.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between hover:shadow-md transition-shadow duration-300"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={cn("p-3 rounded-lg", card.bgColor)}>
                                    <card.icon className={cn("w-6 h-6", card.color)} />
                                </div>
                                <span className={cn(
                                    "text-xs font-semibold px-2 py-1 rounded-full",
                                    card.trendUp ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                                )}>
                                    {card.trend}
                                </span>
                            </div>
                            <div>
                                <h3 className="text-gray-500 text-sm font-medium mb-1">{card.title}</h3>
                                <motion.p
                                    key={card.value}
                                    initial={{ scale: 1.2, color: "#059669" }}
                                    animate={{ scale: 1, color: "#111827" }}
                                    className="text-3xl font-bold text-gray-900"
                                >
                                    {card.value}
                                </motion.p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Voice/TTS Configuration Card */}
            <VoiceCard sessionId="1" />

            {/* Detailed Table View can be added here if needed */}
        </div>
    );
};

export default MetricsTable;
