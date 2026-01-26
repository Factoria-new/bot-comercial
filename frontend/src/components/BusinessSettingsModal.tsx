"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
    X,
    Check,
    MapPin,
    Globe,
    Trash2,
    Plus,
    Zap,
    Clock,
    Loader2
} from "lucide-react";
import LottieLoader from "@/components/LottieLoader";
import {
    DaySchedule,
    WeekDay,
    PresetType,
    WEEKDAYS_MAP,
    WEEKDAYS_SHORT,
    DEFAULT_SCHEDULE,
    SCHEDULE_PRESETS
} from "@/lib/scheduleTypes";
import { useToast } from "@/hooks/use-toast";

interface BusinessSettingsModalProps {
    open: boolean;
    onClose: () => void;
    currentPrompt: string;
    onPromptUpdate?: (newPrompt: string) => void;
}

export interface BusinessSettingsData {
    serviceType: 'online' | 'presencial' | null;
    address?: string | null;
    openingHours: Record<WeekDay, DaySchedule> | null;
    appointmentDuration: number; // Duration in minutes
}

// --- SCHEDULE PICKER SUB-COMPONENT ---
const SchedulePicker = ({ value, onChange }: { value: any, onChange: (val: any) => void }) => {
    const schedule = (value as Record<WeekDay, DaySchedule>) || JSON.parse(JSON.stringify(DEFAULT_SCHEDULE));
    const [selectedPreset, setSelectedPreset] = useState<PresetType | null>(null);

    const updateSchedule = (newSchedule: Record<WeekDay, DaySchedule>) => {
        onChange(newSchedule);
    };

    const handleDayToggle = (day: WeekDay) => {
        setSelectedPreset('custom');
        const newSchedule = { ...schedule };
        newSchedule[day] = {
            ...newSchedule[day],
            enabled: !newSchedule[day].enabled,
            slots: !newSchedule[day].enabled && newSchedule[day].slots.length === 0
                ? [{ start: '09:00', end: '18:00' }]
                : newSchedule[day].slots
        };
        updateSchedule(newSchedule);
    };

    const addSlot = (day: WeekDay) => {
        setSelectedPreset('custom');
        const newSchedule = { ...schedule };
        newSchedule[day] = {
            ...newSchedule[day],
            slots: [...newSchedule[day].slots, { start: '08:00', end: '12:00' }]
        };
        updateSchedule(newSchedule);
    };

    const removeSlot = (day: WeekDay, index: number) => {
        setSelectedPreset('custom');
        const newSchedule = { ...schedule };
        newSchedule[day] = {
            ...newSchedule[day],
            slots: newSchedule[day].slots.filter((_, i) => i !== index)
        };
        updateSchedule(newSchedule);
    };

    const updateSlot = (day: WeekDay, index: number, field: 'start' | 'end', val: string) => {
        setSelectedPreset('custom');
        const newSchedule = { ...schedule };
        const newSlots = [...newSchedule[day].slots];
        newSlots[index] = { ...newSlots[index], [field]: val };
        newSchedule[day] = { ...newSchedule[day], slots: newSlots };
        updateSchedule(newSchedule);
    };

    const applyPreset = (presetKey: PresetType) => {
        setSelectedPreset(presetKey);
        updateSchedule(JSON.parse(JSON.stringify(SCHEDULE_PRESETS[presetKey].schedule)));
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Presets & Selection (1/4) */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center gap-2">
                            <Zap className="h-3 w-3 text-purple-400" />
                            Presets Rápidos
                        </Label>
                        <div className="space-y-1.5">
                            {(Object.entries(SCHEDULE_PRESETS) as [PresetType, typeof SCHEDULE_PRESETS[PresetType]][]).map(([key, preset]) => {
                                const Icon = preset.icon;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => applyPreset(key)}
                                        className={cn(
                                            "w-full p-2.5 rounded-xl border transition-all text-left flex items-center gap-2 group",
                                            selectedPreset === key
                                                ? "bg-purple-600/20 border-purple-500 ring-1 ring-purple-500/50"
                                                : "border-white/10 bg-black/20 hover:bg-white/5"
                                        )}
                                    >
                                        <div className={cn(
                                            "p-1.5 rounded-lg transition-colors",
                                            selectedPreset === key
                                                ? "bg-purple-500/30"
                                                : "bg-white/5 group-hover:bg-purple-500/20"
                                        )}>
                                            <Icon className={cn(
                                                "h-3.5 w-3.5",
                                                selectedPreset === key ? "text-purple-300" : "text-purple-400"
                                            )} />
                                        </div>
                                        <span className={cn(
                                            "text-xs font-medium",
                                            selectedPreset === key ? "text-white" : "text-white/80 group-hover:text-white"
                                        )}>
                                            {preset.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-2 p-3 bg-black/20 rounded-xl border border-white/10">
                        <Label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                            Ativar Dias
                        </Label>
                        <div className="grid grid-cols-7 gap-1">
                            {(Object.keys(WEEKDAYS_SHORT) as WeekDay[]).map((day) => {
                                const isEnabled = schedule[day]?.enabled;
                                return (
                                    <button
                                        key={day}
                                        onClick={() => handleDayToggle(day)}
                                        className={cn(
                                            "aspect-square rounded-full font-bold text-[9px] transition-all",
                                            isEnabled
                                                ? "bg-purple-600 text-white shadow-lg shadow-purple-900/50"
                                                : "bg-white/5 text-white/30 border border-white/5 hover:border-white/20"
                                        )}
                                    >
                                        {WEEKDAYS_SHORT[day]}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Detailed Slots (3/4) */}
                <div className="lg:col-span-3 space-y-3">
                    <ScrollArea className="h-[280px] pr-3">
                        <div className="space-y-2">
                            {(Object.entries(WEEKDAYS_MAP) as [WeekDay, string][]).map(([key, label]) => {
                                const daySchedule = schedule[key] || { enabled: false, slots: [] };

                                return (
                                    <div
                                        key={key}
                                        className={cn(
                                            "flex flex-col gap-2 p-3 rounded-xl border transition-all",
                                            daySchedule.enabled
                                                ? "bg-white/5 border-purple-500/30"
                                                : "bg-black/10 border-white/5 opacity-40"
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    checked={daySchedule.enabled}
                                                    onCheckedChange={() => handleDayToggle(key)}
                                                    className="data-[state=checked]:bg-purple-600 scale-90"
                                                />
                                                <span className={cn(
                                                    "text-sm font-semibold",
                                                    daySchedule.enabled ? "text-white" : "text-white/40"
                                                )}>
                                                    {label}
                                                </span>
                                            </div>
                                        </div>

                                        {daySchedule.enabled && (
                                            <div className="space-y-1.5 pl-10">
                                                {daySchedule.slots.map((slot, index) => (
                                                    <div key={index} className="flex items-center gap-2">
                                                        <div className="flex items-center gap-2 bg-black/40 p-1 rounded-lg border border-white/10 flex-1">
                                                            <Input
                                                                type="time"
                                                                value={slot.start}
                                                                onChange={(e) => updateSlot(key, index, 'start', e.target.value)}
                                                                className="h-7 w-[80px] border-none bg-transparent focus-visible:ring-0 text-center font-mono text-xs text-white p-0"
                                                            />
                                                            <span className="text-white/30 text-xs">→</span>
                                                            <Input
                                                                type="time"
                                                                value={slot.end}
                                                                onChange={(e) => updateSlot(key, index, 'end', e.target.value)}
                                                                className="h-7 w-[80px] border-none bg-transparent focus-visible:ring-0 text-center font-mono text-xs text-white p-0"
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() => removeSlot(key, index)}
                                                            className="p-1.5 text-white/30 hover:text-red-400 transition-colors"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                                <button
                                                    onClick={() => addSlot(key)}
                                                    className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1"
                                                >
                                                    <Plus className="h-3 w-3" /> Adicionar
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>
                </div>
            </div>
        </div>
    );
};

export function BusinessSettingsModal({
    open,
    onClose,
    currentPrompt,
    onPromptUpdate
}: BusinessSettingsModalProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [serviceType, setServiceType] = useState<'online' | 'presencial'>('presencial');
    const [address, setAddress] = useState('');
    const [openingHours, setOpeningHours] = useState<Record<WeekDay, DaySchedule>>(
        JSON.parse(JSON.stringify(DEFAULT_SCHEDULE))
    );
    const [appointmentDuration, setAppointmentDuration] = useState<number>(60);

    // Load existing data when modal opens
    useEffect(() => {
        if (open) {
            loadBusinessInfo();
        }
    }, [open]);

    const loadBusinessInfo = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const backendUrl = import.meta.env.VITE_API_URL || 'https://api.cajiassist.com';

            const response = await fetch(`${backendUrl}/api/user/business-info`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                if (data.serviceType) {
                    setServiceType(data.serviceType);
                }
                if (data.businessAddress) {
                    setAddress(data.businessAddress);
                }
                if (data.businessHours) {
                    setOpeningHours(data.businessHours);
                }
                if (data.appointmentDuration) {
                    setAppointmentDuration(data.appointmentDuration);
                }
            }
        } catch (error) {
            console.error('Error loading business info:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatScheduleForPrompt = (schedule: Record<WeekDay, DaySchedule>): string => {
        const lines: string[] = [];
        (Object.entries(WEEKDAYS_MAP) as [WeekDay, string][]).forEach(([key, label]) => {
            const day = schedule[key];
            if (day?.enabled && day.slots.length > 0) {
                const slots = day.slots.map(s => `${s.start}-${s.end}`).join(', ');
                lines.push(`${label}: ${slots}`);
            }
        });
        return lines.join('\n');
    };

    const updatePromptWithBusinessInfo = (prompt: string): string => {
        const scheduleStr = formatScheduleForPrompt(openingHours);
        const serviceTypeStr = serviceType === 'online'
            ? 'Atendimento 100% Online'
            : `Atendimento Presencial - Endereço: ${address || 'Não informado'}`;

        const businessInfoBlock = `# INFORMAÇÕES DE FUNCIONAMENTO
Tipo de Atendimento: ${serviceTypeStr}

Horários de Funcionamento:
${scheduleStr}

**IMPORTANTE para Agendamentos**: Ao utilizar o Google Calendar para criar eventos ou verificar disponibilidade, respeite estritamente os horários de funcionamento acima. NÃO agende nada fora desses horários.`;

        let cleanedPrompt = prompt;

        // Clean up duplicate schedule/address info from CONTEXTO DE DADOS section
        // This handles prompts created before this fix was implemented

        // Pattern 1: HORÁRIO DE ATENDIMENTO followed by weekday lines (with newline prefix)
        cleanedPrompt = cleanedPrompt.replace(/\nHORÁRIO DE ATENDIMENTO:\n(?:[\w-]+:\s*\d{2}:\d{2}-\d{2}:\d{2}(?:,\s*\d{2}:\d{2}-\d{2}:\d{2})*\n?)+/gi, '');

        // Pattern 2: Weekday lines stuck to text (without newline prefix) - handles "sobrancelha: 82Segunda-feira: 09:00-18:00"
        // Match Portuguese weekday names followed by time ranges
        cleanedPrompt = cleanedPrompt.replace(/(Segunda-feira|Terça-feira|Quarta-feira|Quinta-feira|Sexta-feira|Sábado|Domingo):\s*\d{2}:\d{2}-\d{2}:\d{2}(?:,\s*\d{2}:\d{2}-\d{2}:\d{2})*/gi, '');

        // Pattern 3: Clean up any remaining address/online status in old format
        cleanedPrompt = cleanedPrompt.replace(/\nENDEREÇO:\s*[^\n]+\n?/gi, '');
        cleanedPrompt = cleanedPrompt.replace(/\nATENDIMENTO:\s*100%\s*Online\n?/gi, '');

        // Clean up multiple consecutive newlines that may be left behind
        cleanedPrompt = cleanedPrompt.replace(/\n{3,}/g, '\n\n');

        // Check if prompt already has the business info block
        const blockRegex = /# INFORMAÇÕES DE FUNCIONAMENTO[\s\S]*?(?=\n#|$)/;

        if (blockRegex.test(cleanedPrompt)) {
            // Replace existing block
            return cleanedPrompt.replace(blockRegex, businessInfoBlock);
        } else {
            // Append block
            return `${cleanedPrompt}\n\n${businessInfoBlock}`;
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            const backendUrl = import.meta.env.VITE_API_URL || 'https://api.cajiassist.com';

            // 1. Save business info to database
            const businessResponse = await fetch(`${backendUrl}/api/user/business-info`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    businessHours: openingHours,
                    serviceType: serviceType,
                    businessAddress: serviceType === 'presencial' ? address : null,
                    appointmentDuration: appointmentDuration
                })
            });

            const businessResult = await businessResponse.json();

            if (!businessResult.success) {
                throw new Error(businessResult.error || 'Erro ao salvar configurações');
            }

            // 2. Update prompt with business info
            if (currentPrompt && onPromptUpdate) {
                const updatedPrompt = updatePromptWithBusinessInfo(currentPrompt);

                // Save updated prompt
                const promptResponse = await fetch(`${backendUrl}/api/user/prompt`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ prompt: updatedPrompt })
                });

                const promptResult = await promptResponse.json();

                if (promptResult.success) {
                    onPromptUpdate(updatedPrompt);
                }
            }

            toast({
                title: "Configurações salvas!",
                description: "As informações do negócio foram atualizadas.",
                className: "bg-emerald-500 text-white border-0"
            });

            onClose();
        } catch (error) {
            console.error('Error saving business info:', error);
            toast({
                title: "Erro ao salvar",
                description: error instanceof Error ? error.message : "Tente novamente.",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    const isValid = () => {
        if (serviceType === 'presencial' && !address.trim()) {
            return false;
        }
        return Object.values(openingHours).some(day => day.enabled);
    };

    if (!open) return null;

    return (
        <AnimatePresence>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Modal Container */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, type: 'spring', damping: 25 }}
                    className="w-full max-w-3xl max-h-[90vh] flex flex-col bg-gradient-to-b from-slate-900 to-slate-950 border border-white/10 shadow-2xl shadow-black/50 rounded-2xl overflow-hidden pointer-events-auto"
                >
                    {/* Header */}
                    <div className="p-5 border-b border-white/5 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/20">
                                <img src="/icons/business-profile.png" alt="" className="w-5 h-5 brightness-0 invert" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Perfil do Negócio</h2>
                                <p className="text-white/50 text-xs">Tipo de atendimento e horários de funcionamento</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="text-white/50 hover:text-white hover:bg-white/10 rounded-lg"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-6">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="p-4 rounded-full bg-white/5">
                                    <LottieLoader fullScreen={false} size={100} />
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Section 1: Service Type */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium text-white flex items-center gap-2 border-l-2 border-purple-500 pl-3">
                                        <MapPin className="w-4 h-4 text-purple-400" />
                                        Tipo de Atendimento
                                    </h3>

                                    <RadioGroup
                                        value={serviceType}
                                        onValueChange={(val) => setServiceType(val as 'online' | 'presencial')}
                                        className="grid sm:grid-cols-2 gap-3"
                                    >
                                        {/* Presencial */}
                                        <div>
                                            <RadioGroupItem value="presencial" id="presencial-edit" className="peer sr-only" />
                                            <Label
                                                htmlFor="presencial-edit"
                                                className={cn(
                                                    "flex items-center gap-3 p-4 rounded-xl border bg-black/20 hover:bg-white/5 cursor-pointer transition-all",
                                                    serviceType === 'presencial' ? "border-purple-500 bg-purple-500/10" : "border-white/10"
                                                )}
                                            >
                                                <div className={cn("p-2 rounded-lg", serviceType === 'presencial' ? "bg-purple-500 text-white" : "bg-white/10 text-white/70")}>
                                                    <MapPin className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1">
                                                    <span className="text-sm font-medium text-white">Presencial</span>
                                                    <p className="text-xs text-white/50">Com endereço físico</p>
                                                </div>
                                                {serviceType === 'presencial' && <Check className="w-4 h-4 text-purple-400" />}
                                            </Label>
                                        </div>

                                        {/* Online */}
                                        <div>
                                            <RadioGroupItem value="online" id="online-edit" className="peer sr-only" />
                                            <Label
                                                htmlFor="online-edit"
                                                className={cn(
                                                    "flex items-center gap-3 p-4 rounded-xl border bg-black/20 hover:bg-white/5 cursor-pointer transition-all",
                                                    serviceType === 'online' ? "border-purple-500 bg-purple-500/10" : "border-white/10"
                                                )}
                                            >
                                                <div className={cn("p-2 rounded-lg", serviceType === 'online' ? "bg-purple-500 text-white" : "bg-white/10 text-white/70")}>
                                                    <Globe className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1">
                                                    <span className="text-sm font-medium text-white">100% Online</span>
                                                    <p className="text-xs text-white/50">Sem local físico</p>
                                                </div>
                                                {serviceType === 'online' && <Check className="w-4 h-4 text-purple-400" />}
                                            </Label>
                                        </div>
                                    </RadioGroup>

                                    {/* Address (conditional) */}
                                    <AnimatePresence>
                                        {serviceType === 'presencial' && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="space-y-2 pt-2">
                                                    <Label htmlFor="address-edit" className="text-white/80 text-sm">
                                                        Endereço <span className="text-purple-500">*</span>
                                                    </Label>
                                                    <Input
                                                        id="address-edit"
                                                        type="text"
                                                        placeholder="Rua, Número, Bairro, Cidade..."
                                                        value={address}
                                                        onChange={(e) => setAddress(e.target.value)}
                                                        className="bg-black/20 border-white/10 text-white focus:bg-black/40 h-10 rounded-xl"
                                                    />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Divider */}
                                <div className="border-t border-white/5" />

                                {/* Section 2: Opening Hours */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium text-white flex items-center gap-2 border-l-2 border-purple-500 pl-3">
                                        <Clock className="w-4 h-4 text-purple-400" />
                                        Horários de Funcionamento
                                    </h3>

                                    <SchedulePicker
                                        value={openingHours}
                                        onChange={setOpeningHours}
                                    />

                                    {/* Duration Selector */}
                                    <div className="mt-4 p-4 bg-black/20 rounded-xl border border-white/10">
                                        <Label className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center gap-2 mb-3">
                                            <Clock className="h-3 w-3 text-purple-400" />
                                            Duração Padrão dos Agendamentos
                                        </Label>
                                        <div className="flex flex-wrap gap-2">
                                            {[30, 45, 60, 90, 120].map((duration) => (
                                                <button
                                                    key={duration}
                                                    onClick={() => setAppointmentDuration(duration)}
                                                    className={cn(
                                                        "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                                        appointmentDuration === duration
                                                            ? "bg-purple-600 text-white shadow-lg shadow-purple-900/50"
                                                            : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10"
                                                    )}
                                                >
                                                    {duration < 60 ? `${duration} min` : duration === 60 ? '1 hora' : `${duration / 60}h${duration % 60 ? (duration % 60) + 'min' : ''}`}
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-xs text-white/40 mt-2">
                                            Tempo padrão de cada compromisso agendado.
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-white/5 bg-black/20 flex justify-end gap-3 shrink-0">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="text-white/50 hover:text-white hover:bg-white/5 rounded-xl"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving || !isValid()}
                            className={cn(
                                "bg-purple-600 hover:bg-purple-500 text-white rounded-xl px-6",
                                !isValid() && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Check className="w-4 h-4 mr-2" />
                                    Salvar
                                </>
                            )}
                        </Button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

export default BusinessSettingsModal;
