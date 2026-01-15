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
    ArrowLeft,
    ArrowRight,
    Check,
    Sparkles,
    MapPin,
    Globe,
    Trash2,
    Plus,
    Zap,
    Clock
} from "lucide-react";
import {
    DaySchedule,
    WeekDay,
    PresetType,
    WEEKDAYS_MAP,
    WEEKDAYS_SHORT,
    DEFAULT_SCHEDULE,
    SCHEDULE_PRESETS
} from "@/lib/scheduleTypes";
import { getRandomAudio } from "@/lib/audioMappings";

interface BusinessInfoModalProps {
    open: boolean;
    onComplete: (data: BusinessInfoData) => void;
    onClose?: () => void;
    onPlayAudio: (path: string, delay?: number) => void;
}

export interface BusinessInfoData {
    serviceType: 'online' | 'presencial';
    address?: string;
    openingHours: Record<WeekDay, DaySchedule>;
}

// --- SCHEDULE PICKER SUB-COMPONENT (copied from WizardModal) ---
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
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Presets & Selection (1/4) */}
                <div className="space-y-6">
                    <div className="space-y-3">
                        <Label className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center gap-2">
                            <Zap className="h-3 w-3 text-purple-400" />
                            Presets Rápidos
                        </Label>
                        <div className="space-y-2">
                            {(Object.entries(SCHEDULE_PRESETS) as [PresetType, typeof SCHEDULE_PRESETS[PresetType]][]).map(([key, preset]) => {
                                const Icon = preset.icon;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => applyPreset(key)}
                                        className={cn(
                                            "w-full p-3 rounded-xl border transition-all text-left flex items-center gap-3 group",
                                            selectedPreset === key
                                                ? "bg-purple-600/20 border-purple-500 ring-1 ring-purple-500/50"
                                                : "border-white/10 bg-black/20 hover:bg-white/5"
                                        )}
                                    >
                                        <div className={cn(
                                            "p-2 rounded-lg transition-colors",
                                            selectedPreset === key
                                                ? "bg-purple-500/30"
                                                : "bg-white/5 group-hover:bg-purple-500/20"
                                        )}>
                                            <Icon className={cn(
                                                "h-4 w-4",
                                                selectedPreset === key ? "text-purple-300" : "text-purple-400"
                                            )} />
                                        </div>
                                        <span className={cn(
                                            "text-sm font-medium",
                                            selectedPreset === key ? "text-white" : "text-white/80 group-hover:text-white"
                                        )}>
                                            {preset.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-3 p-4 bg-black/20 rounded-xl border border-white/10">
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
                                            "aspect-square rounded-full font-bold text-[10px] transition-all",
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
                <div className="lg:col-span-3 space-y-4">
                    <ScrollArea className="h-[450px] pr-4">
                        <div className="space-y-3">
                            {(Object.entries(WEEKDAYS_MAP) as [WeekDay, string][]).map(([key, label]) => {
                                const daySchedule = schedule[key] || { enabled: false, slots: [] };

                                return (
                                    <div
                                        key={key}
                                        className={cn(
                                            "flex flex-col gap-3 p-4 rounded-xl border transition-all",
                                            daySchedule.enabled
                                                ? "bg-white/5 border-purple-500/30"
                                                : "bg-black/10 border-white/5 opacity-40"
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Switch
                                                    checked={daySchedule.enabled}
                                                    onCheckedChange={() => handleDayToggle(key)}
                                                    className="data-[state=checked]:bg-purple-600"
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
                                            <div className="space-y-2 pl-12">
                                                {daySchedule.slots.map((slot, index) => (
                                                    <div key={index} className="flex items-center gap-2">
                                                        <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-lg border border-white/10 flex-1">
                                                            <Input
                                                                type="time"
                                                                value={slot.start}
                                                                onChange={(e) => updateSlot(key, index, 'start', e.target.value)}
                                                                className="h-8 w-[90px] border-none bg-transparent focus-visible:ring-0 text-center font-mono text-xs text-white p-0"
                                                            />
                                                            <span className="text-white/30">→</span>
                                                            <Input
                                                                type="time"
                                                                value={slot.end}
                                                                onChange={(e) => updateSlot(key, index, 'end', e.target.value)}
                                                                className="h-8 w-[90px] border-none bg-transparent focus-visible:ring-0 text-center font-mono text-xs text-white p-0"
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() => removeSlot(key, index)}
                                                            className="p-2 text-white/30 hover:text-red-400 transition-colors"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                ))}
                                                <button
                                                    onClick={() => addSlot(key)}
                                                    className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1.5 mt-1"
                                                >
                                                    <Plus className="h-3 w-3" /> Adicionar Período
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

export function BusinessInfoModal({
    open,
    onComplete,
    onClose,
    onPlayAudio
}: BusinessInfoModalProps) {
    const [step, setStep] = useState(1);
    const [serviceType, setServiceType] = useState<'online' | 'presencial'>('presencial');
    const [address, setAddress] = useState('');
    const [openingHours, setOpeningHours] = useState<Record<WeekDay, DaySchedule>>(
        JSON.parse(JSON.stringify(DEFAULT_SCHEDULE))
    );

    // Reset state when modal opens
    useEffect(() => {
        if (open) {
            setStep(1);
        }
    }, [open]);

    // Audio Triggers
    useEffect(() => {
        if (!open) return;

        let trigger: any | null = null;
        if (step === 1) trigger = 'step_location';
        else if (step === 2) trigger = 'step_operations_modal';

        if (trigger) {
            const audioVariation = getRandomAudio(trigger);
            if (audioVariation.path) {
                onPlayAudio(audioVariation.path, 500);
            }
        }
    }, [step, open, onPlayAudio]);

    const handleComplete = () => {
        const data: BusinessInfoData = {
            serviceType,
            openingHours,
            ...(serviceType === 'presencial' && address ? { address } : {})
        };
        onComplete(data);
    };

    const isStepValid = () => {
        if (step === 1) {
            // Step 1: service type always has a default value
            if (serviceType === 'presencial') {
                return address.trim().length > 0;
            }
            return true;
        }
        if (step === 2) {
            // Step 2: at least one day must be enabled
            return Object.values(openingHours).some(day => day.enabled);
        }
        return true;
    };

    if (!open) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5, type: 'spring', damping: 25 }}
                className={cn(
                    "w-full max-w-4xl mx-auto z-20 relative",
                    "bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 rounded-3xl overflow-hidden",
                    "min-h-[400px] flex flex-col"
                )}
            >
                {/* --- HEADER --- */}
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                            <Sparkles className="w-6 h-6 text-purple-400" />
                            Configuração do Negócio
                        </h2>
                        <p className="text-white/50 text-sm mt-1">
                            Passo {step} de 2: {step === 1 ? 'Tipo de Atendimento' : 'Horários de Funcionamento'}
                        </p>
                    </div>
                    {/* Step Indicator */}
                    <div className="flex gap-1.5 bg-black/20 p-1.5 rounded-full">
                        {[1, 2].map((s) => (
                            <div
                                key={s}
                                className={cn(
                                    "w-2.5 h-2.5 rounded-full transition-all duration-500",
                                    s <= step ? "bg-purple-500 shadow-[0_0_10px_purple]" : "bg-white/10"
                                )}
                            />
                        ))}
                    </div>
                </div>

                {/* --- BODY --- */}
                <div className="flex-1 p-8 overflow-y-auto">
                    <AnimatePresence mode="wait">
                        {/* STEP 1: Service Type */}
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >
                                <h3 className="text-lg font-medium text-white mb-6 border-l-4 border-purple-500 pl-4">
                                    Como funciona o atendimento do seu negócio?
                                </h3>

                                <RadioGroup
                                    value={serviceType}
                                    onValueChange={(val) => setServiceType(val as 'online' | 'presencial')}
                                    className="grid sm:grid-cols-2 gap-4"
                                >
                                    {/* Presencial Option */}
                                    <div>
                                        <RadioGroupItem value="presencial" id="presencial" className="peer sr-only" />
                                        <Label
                                            htmlFor="presencial"
                                            className={cn(
                                                "flex flex-col p-5 rounded-2xl border bg-black/20 hover:bg-white/5 cursor-pointer transition-all h-full relative overflow-hidden",
                                                serviceType === 'presencial' ? "border-purple-500 bg-purple-500/10" : "border-white/10"
                                            )}
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div className={cn("p-2 rounded-lg", serviceType === 'presencial' ? "bg-purple-500 text-white" : "bg-white/10 text-white/70")}>
                                                    <MapPin className="w-5 h-5" />
                                                </div>
                                                {serviceType === 'presencial' && <Check className="w-5 h-5 text-purple-400" />}
                                            </div>
                                            <h4 className={cn("text-base font-semibold mb-1", serviceType === 'presencial' ? "text-purple-100" : "text-white/90")}>
                                                Atendimento Presencial
                                            </h4>
                                            <p className="text-sm text-white/50 leading-relaxed">
                                                Seu negócio possui um endereço físico onde os clientes são atendidos.
                                            </p>
                                        </Label>
                                    </div>

                                    {/* Online Option */}
                                    <div>
                                        <RadioGroupItem value="online" id="online" className="peer sr-only" />
                                        <Label
                                            htmlFor="online"
                                            className={cn(
                                                "flex flex-col p-5 rounded-2xl border bg-black/20 hover:bg-white/5 cursor-pointer transition-all h-full relative overflow-hidden",
                                                serviceType === 'online' ? "border-purple-500 bg-purple-500/10" : "border-white/10"
                                            )}
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div className={cn("p-2 rounded-lg", serviceType === 'online' ? "bg-purple-500 text-white" : "bg-white/10 text-white/70")}>
                                                    <Globe className="w-5 h-5" />
                                                </div>
                                                {serviceType === 'online' && <Check className="w-5 h-5 text-purple-400" />}
                                            </div>
                                            <h4 className={cn("text-base font-semibold mb-1", serviceType === 'online' ? "text-purple-100" : "text-white/90")}>
                                                100% Online
                                            </h4>
                                            <p className="text-sm text-white/50 leading-relaxed">
                                                Seu negócio opera exclusivamente de forma remota/digital.
                                            </p>
                                        </Label>
                                    </div>
                                </RadioGroup>

                                {/* Address Field (conditional) */}
                                <AnimatePresence>
                                    {serviceType === 'presencial' && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="space-y-2 overflow-hidden"
                                        >
                                            <Label htmlFor="address" className="text-white/80 font-medium ml-1">
                                                Endereço do Local <span className="text-purple-500">*</span>
                                            </Label>
                                            <Input
                                                id="address"
                                                type="text"
                                                placeholder="Rua, Número, Bairro, Cidade..."
                                                value={address}
                                                onChange={(e) => setAddress(e.target.value)}
                                                className="bg-black/20 border-white/10 text-white focus:bg-black/40 h-12 rounded-xl transition-all"
                                            />
                                            <p className="text-xs text-white/40 ml-1">
                                                Este endereço será usado para informar clientes e agendar eventos.
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}

                        {/* STEP 2: Opening Hours */}
                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-6"
                            >
                                <h3 className="text-lg font-medium text-white mb-6 border-l-4 border-purple-500 pl-4 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-purple-400" />
                                    Quais são os horários de funcionamento?
                                </h3>

                                <SchedulePicker
                                    value={openingHours}
                                    onChange={setOpeningHours}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* --- FOOTER --- */}
                <div className="p-6 border-t border-white/5 bg-black/20 flex justify-between items-center">
                    {step > 1 ? (
                        <Button
                            variant="ghost"
                            onClick={() => setStep(step - 1)}
                            className="text-white/50 hover:text-white hover:bg-white/5 rounded-xl h-12 px-6"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Voltar
                        </Button>
                    ) : (
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="text-white/30 hover:text-white hover:bg-white/5 rounded-xl h-12 px-6 text-sm"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Cancelar
                        </Button>
                    )}

                    <Button
                        onClick={() => {
                            if (step >= 2) {
                                handleComplete();
                            } else {
                                setStep(step + 1);
                            }
                        }}
                        disabled={!isStepValid()}
                        className={cn(
                            "bg-purple-600 hover:bg-purple-500 text-white rounded-xl h-12 px-8 shadow-lg transition-all",
                            isStepValid() ? "shadow-purple-900/40 hover:scale-105" : "opacity-50 grayscale cursor-not-allowed"
                        )}
                    >
                        {step >= 2 ? (
                            <span className="flex items-center gap-2">Finalizar <Check className="w-5 h-5" /></span>
                        ) : (
                            <span className="flex items-center gap-2">Próximo <ArrowRight className="w-5 h-5" /></span>
                        )}
                    </Button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

export default BusinessInfoModal;
