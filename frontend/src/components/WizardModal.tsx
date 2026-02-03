
"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
// Using safer, standard icons to prevent version mismatch crashes
import {
    ArrowLeft,
    ArrowRight,
    Check,
    Sparkles,
    Volume2,
    TrendingUp,
    ArrowRightCircle,
    Trash2,
    Plus,
    Zap,
    Clock,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NicheSchema, FormField } from "@/lib/nicheSchemas";
import { getRandomAudio, AudioTriggerType } from "@/lib/audioMappings";
import { LiaVolumeControl } from "@/components/ui/LiaVolumeControl";
import {
    TimeSlot,
    DaySchedule,
    WeekDay,
    PresetType,
    WEEKDAYS_MAP,
    WEEKDAYS_SHORT,
    DEFAULT_SCHEDULE,
    SCHEDULE_PRESETS
} from "@/lib/scheduleTypes";

// Re-export types for backwards compatibility
export type { TimeSlot, DaySchedule, WeekDay };

// Alias for local usage
const PRESETS = SCHEDULE_PRESETS;

interface WizardModalProps {
    open: boolean;
    step: number; // 0=Intro/Niche, 1+ = Schema Steps
    schema: NicheSchema | null;
    data: Record<string, any>;
    onDataUpdate: (newData: Record<string, any>) => void;
    onStepChange: (newStep: number) => void;
    onComplete: () => void;
    voiceActive?: boolean;
    onPlayAudio?: (path: string, delay?: number, onEnded?: () => void) => void;
    onClose?: () => void;
    isDemo?: boolean;
}

// --- SCHEDULE PICKER SUB-COMPONENT ---
const SchedulePicker = ({ value, onChange }: { value: any, onChange: (val: any) => void }) => {
    const schedule = (value as Record<WeekDay, DaySchedule>) || JSON.parse(JSON.stringify(DEFAULT_SCHEDULE));
    // ... (rest of SchedulePicker is unchanged)
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
        updateSchedule(JSON.parse(JSON.stringify(PRESETS[presetKey].schedule)));
    };

    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col lg:grid lg:grid-cols-4 gap-4 sm:gap-6">
                {/* Presets & Selection (1/4) */}
                <div className="space-y-4 sm:space-y-6">
                    <div className="space-y-3">
                        <Label className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center gap-2">
                            <Zap className="h-3 w-3 text-purple-400" />
                            Presets Rápidos
                        </Label>
                        <div className="space-y-2">
                            {(Object.entries(PRESETS) as [PresetType, typeof PRESETS[PresetType]][]).map(([key, preset]) => {
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
                        <Label className="text-xs font-semibold text-white/50 uppercase tracking-wider hidden sm:block">
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
                <div className="lg:col-span-3 space-y-3 sm:space-y-4">
                    {/* Mobile: No scroll wrapper, just a div. Desktop: ScrollArea */}
                    <div className="sm:hidden space-y-3">
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
                                        <div className="space-y-2 pl-4 sm:pl-12">
                                            {daySchedule.slots.map((slot, index) => (
                                                <div key={index} className="flex items-center gap-1 sm:gap-2">
                                                    <div className="flex items-center gap-1 sm:gap-2 bg-black/40 p-1 sm:p-1.5 rounded-lg border border-white/10 flex-1">
                                                        <Input
                                                            type="time"
                                                            value={slot.start}
                                                            onChange={(e) => updateSlot(key, index, 'start', e.target.value)}
                                                            className="h-8 flex-1 min-w-[70px] sm:w-[90px] sm:flex-none border-none bg-transparent focus-visible:ring-0 text-center font-mono text-xs text-white p-0"
                                                        />
                                                        <span className="text-white/30 text-xs">→</span>
                                                        <Input
                                                            type="time"
                                                            value={slot.end}
                                                            onChange={(e) => updateSlot(key, index, 'end', e.target.value)}
                                                            className="h-8 flex-1 min-w-[70px] sm:w-[90px] sm:flex-none border-none bg-transparent focus-visible:ring-0 text-center font-mono text-xs text-white p-0"
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
                    {/* Desktop: ScrollArea */}
                    <ScrollArea className="hidden sm:block h-auto max-h-[350px] pr-4">
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


export function WizardModal({
    open,
    step,
    schema,
    data,
    onDataUpdate,
    onStepChange,
    onComplete,
    voiceActive,
    onPlayAudio,
    onClose,
    isDemo = false
}: WizardModalProps) {

    const [formState, setFormState] = useState<Record<string, any>>({});
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [currentAudioText, setCurrentAudioText] = useState<string | null>(null);
    const playedTriggers = useRef<Set<string>>(new Set());

    // Initial Debug Log
    useEffect(() => {
        if (open) {
            console.log("🧙‍♂️ WizardModal Open. Step:", step, "Schema:", schema?.id);
            // Optional: Reset played triggers on fresh open? 
            // If the user closes and re-opens, should it play again? 
            // The requirement says "toda vez que clicamos em um input... apenas uma vez per call".
            // Let's reset if it's a fresh open (step 0 or just opening).
            if (Object.keys(data).length === 0) {
                playedTriggers.current.clear();
            }
        }
    }, [open, step, schema, data]);

    // Sync external data to local state for inputs
    useEffect(() => {
        setFormState(data);
    }, [data]);

    // Audio Playback Helper
    const playAudioGuidance = (trigger: AudioTriggerType) => {
        // Deduplication check
        if (playedTriggers.current.has(trigger)) {
            return;
        }

        try {
            const variation = getRandomAudio(trigger);
            if (!variation || !variation.path) {
                return;
            }

            console.log(`🎵 Playing Audio Guide: [${trigger}] -> ${variation.path}`);

            playedTriggers.current.add(trigger); // Mark as played
            setCurrentAudioText(variation.text);

            if (onPlayAudio) {
                onPlayAudio(variation.path, 0, () => {
                    setCurrentAudioText(null);
                });
            } else {
                console.warn("onPlayAudio prop missing, skipping audio playback.");
                // Fallback or just clear text
                setTimeout(() => setCurrentAudioText(null), 5000);
            }

        } catch (err) {
            console.error("Audio error:", err);
        }
    };

    // Trigger Audio on Step Change
    useEffect(() => {
        if (!open) return;

        try {
            // Intro (Niche Selection)
            if (step === 0) {
                playAudioGuidance('intro_modal');
            } else if (step > 0 && schema) {
                // Determine which logical step this is based on schema
                // 1 -> Identity, 2 -> Location, 3 -> Strategy, 4 -> Operations, 5 -> Catalog
                // We map by ID to be safer than index if we add more steps
                const currentStepObj = schema.steps[step - 1];
                if (currentStepObj) {
                    if (currentStepObj.id === 'identity') playAudioGuidance('step_identity');
                    else if (currentStepObj.id === 'location') playAudioGuidance('step_location');
                    else if (currentStepObj.id === 'strategy') playAudioGuidance('step_strategy');
                    else if (currentStepObj.id === 'operations') playAudioGuidance('step_operations');
                    else if (currentStepObj.id === 'catalog') playAudioGuidance('step_catalog');
                    else if (currentStepObj.id === 'details') playAudioGuidance('step_details');
                }
            }
        } catch (e) {
            console.error("Error triggering audio:", e);
        }
    }, [step, open, schema]);

    const handleInputChange = (name: string, value: any) => {
        const newData = { ...formState, [name]: value };
        setFormState(newData);
        onDataUpdate(newData);
    };

    const handleFieldFocus = (name: string, parentName?: string) => {
        // Only play description audio for the top-level description field
        if (name === 'description' && !parentName) {
            playAudioGuidance('focus_description');
        }
        if (name === 'assistantName') playAudioGuidance('focus_assistant_name');
        if (name === 'usefulLinks' || parentName === 'usefulLinks') playAudioGuidance('focus_links');
    };

    // --- RENDER HELPERS ---



    const renderField = (field: FormField, parentName?: string, index?: number) => {
        const fieldId = parentName && index !== undefined ? `${parentName}-${index}-${field.name}` : field.name;

        let value: any;
        let onChange: (val: any) => void;

        if (parentName && index !== undefined) {
            const parentValue = formState[parentName] as any[] || [];
            value = parentValue[index]?.[field.name] || '';
            onChange = (val) => {
                const currentItems = [...((formState[parentName] as any[]) || [])];
                if (currentItems[index]) {
                    currentItems[index] = { ...currentItems[index], [field.name]: val };
                    handleInputChange(parentName, currentItems);
                }
            };
        } else {
            value = formState[field.name];
            onChange = (val) => handleInputChange(field.name, val);
        }

        // Common onFocus to trigger audio guide for focus
        const onFocus = () => handleFieldFocus(field.name, parentName);

        switch (field.type) {
            case 'textarea':
                return (
                    <Textarea
                        id={fieldId}
                        placeholder={field.placeholder}
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className="bg-black/20 border-white/10 text-white focus:bg-black/40 min-h-[80px] rounded-xl"
                        onFocus={onFocus}
                    />
                );
            case 'select':
                return (
                    <Select value={value || ''} onValueChange={onChange}>
                        <SelectTrigger className="bg-black/20 border-white/10 text-white rounded-xl h-12" onFocus={onFocus}>
                            <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800 text-white">
                            {field.options?.map(opt => (
                                <SelectItem key={opt} value={opt} className="cursor-pointer">{opt}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );
            case 'checkbox-group':
                const currentSelection = (value as string[]) || [];
                return (
                    <div className="flex flex-wrap gap-2">
                        {field.options?.map(opt => (
                            <div key={opt} className="flex items-center space-x-2 bg-black/20 p-3 rounded-xl border border-white/5">
                                <Checkbox
                                    id={`${fieldId}-${opt}`}
                                    checked={currentSelection.includes(opt)}
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            // Ensure unique values, though Set implicitly handles this logic if refactored
                                            if (!currentSelection.includes(opt)) onChange([...currentSelection, opt]);
                                        } else {
                                            onChange(currentSelection.filter(o => o !== opt));
                                        }
                                    }}
                                    className="border-white/20 data-[state=checked]:bg-purple-600"
                                    onFocus={onFocus}
                                />
                                <Label htmlFor={`${fieldId}-${opt}`} className="text-white/80 cursor-pointer text-sm">{opt}</Label>
                            </div>
                        ))}
                    </div>
                );
            case 'radio-group':
                return (
                    <RadioGroup value={value || ''} onValueChange={onChange} className="grid sm:grid-cols-2 gap-3" onFocus={onFocus}>
                        {field.options?.map(opt => (
                            <div key={opt}>
                                <RadioGroupItem value={opt} id={`${fieldId}-${opt}`} className="peer sr-only" />
                                <Label
                                    htmlFor={`${fieldId}-${opt}`}
                                    className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-black/20 hover:bg-white/5 peer-data-[state=checked]:border-purple-500 peer-data-[state=checked]:bg-purple-500/10 cursor-pointer transition-all"
                                >
                                    <span className="text-white/90 font-normal">{opt}</span>
                                    {value === opt && <Check className="w-4 h-4 text-purple-400" />}
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                );
            case 'card-group':
                return (
                    <RadioGroup value={value || ''} onValueChange={onChange} className="grid sm:grid-cols-2 gap-4" onFocus={onFocus}>
                        {field.cardOptions?.map((opt) => {
                            const Icon = opt.icon === 'TrendingUp' ? TrendingUp : opt.icon === 'ArrowRightCircle' ? ArrowRightCircle : Sparkles;
                            const isSelected = value === opt.value;
                            return (
                                <div key={opt.value}>
                                    <RadioGroupItem value={opt.value} id={`${fieldId}-${opt.value}`} className="peer sr-only" />
                                    <Label
                                        htmlFor={`${fieldId}-${opt.value}`}
                                        className={cn(
                                            "flex flex-col p-5 rounded-2xl border bg-black/20 hover:bg-white/5 cursor-pointer transition-all h-full relative overflow-hidden",
                                            isSelected ? "border-purple-500 bg-purple-500/10" : "border-white/10"
                                        )}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className={cn("p-2 rounded-lg", isSelected ? "bg-purple-500 text-white" : "bg-white/10 text-white/70")}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            {isSelected && <Check className="w-5 h-5 text-purple-400" />}
                                        </div>
                                        <h4 className={cn("text-base font-semibold mb-1", isSelected ? "text-purple-100" : "text-white/90")}>{opt.label}</h4>
                                        <p className="text-sm text-white/50 leading-relaxed">{opt.description}</p>
                                    </Label>
                                </div>
                            )
                        })}
                    </RadioGroup>
                );

            case 'schedule':
                return <SchedulePicker value={value} onChange={onChange} />;

            case 'duration-selector':
                const durations = [30, 45, 60, 90, 120];
                return (
                    <div className="p-4 bg-black/20 rounded-xl border border-white/10">
                        <Label className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center gap-2 mb-3">
                            <Clock className="h-3 w-3 text-purple-400" />
                            Duração Padrão dos Agendamentos <span className="text-purple-500">*</span>
                        </Label>
                        <div className="flex flex-wrap gap-2">
                            {durations.map((duration) => (
                                <button
                                    key={duration}
                                    type="button"
                                    onClick={() => onChange(duration)}
                                    className={cn(
                                        "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                        value === duration
                                            ? "bg-purple-600 text-white shadow-lg shadow-purple-900/50"
                                            : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10"
                                    )}
                                >
                                    {duration < 60 ? `${duration} min` : duration === 60 ? '1 hora' : `${duration / 60}h${duration % 60 ? (duration % 60) + 'min' : ''}`}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-white/40 mt-2">
                            Tempo padrão de cada compromisso agendado pelo assistente.
                        </p>
                    </div>
                );

            case 'repeater':
                const items = (value as any[]) || [];
                return (
                    <div className="space-y-4">
                        {items.map((_item, idx) => (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                key={idx}
                                className="relative p-4 bg-black/20 rounded-xl border border-white/10 space-y-4"
                            >
                                <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-2">
                                    <h4 className="text-sm font-medium text-white/50">Item {idx + 1}</h4>
                                    <button
                                        onClick={() => {
                                            const newItems = items.filter((_, i) => i !== idx);
                                            handleInputChange(field.name, newItems);
                                        }}
                                        className="text-white/30 hover:text-red-400 text-xs transition-colors"
                                    >Remove</button>
                                </div>
                                <div className="grid gap-4">
                                    {field.subFields?.map(subField => (
                                        <div key={subField.name}>
                                            <Label className="text-xs text-white/40 mb-1.5 block uppercase tracking-wider">{subField.label}</Label>
                                            {renderField(subField, field.name, idx)}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                        <Button
                            onClick={() => {
                                const newItem: Record<string, any> = {};
                                field.subFields?.forEach(f => newItem[f.name] = '');
                                handleInputChange(field.name, [...items, newItem]);
                            }}
                            variant="outline"
                            className="w-full h-12 rounded-xl border-dashed border-white/20 bg-transparent text-white/60 hover:bg-white/5 hover:text-white"
                        >
                            <span className="mr-2">+</span> {field.addButtonText || 'Adicionar Item'}
                        </Button>
                    </div>
                );
            default:
                return (
                    <Input
                        id={fieldId}
                        type={field.type === 'number' ? 'number' : 'text'}
                        placeholder={field.placeholder}
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className="bg-black/20 border-white/10 text-white focus:bg-black/40 h-12 rounded-xl transition-all"
                        onFocus={onFocus}
                    />
                );
        }
    };


    if (!open) return null;


    // --- STEP 0: NICHE SELECTION ---
    // REMOVED as per user request. We start at Step 1 now.
    const isStepValid = () => {
        if (!schema || !schema.steps[step - 1]) return true;

        const currentStepObj = schema.steps[step - 1];

        // SPECIAL VALIDATION: Location step requires either "100% Online" checked OR address filled
        if (currentStepObj.id === 'location') {
            const onlineOnly = formState.onlineOnly as string[] || [];
            const address = formState.address as string || '';
            const is100Online = onlineOnly.some(opt => opt.toLowerCase().includes('100% online') || opt.toLowerCase().includes('sem endereço'));
            const hasAddress = address.trim().length > 0;

            // Must have either 100% online checked OR address filled
            if (!is100Online && !hasAddress) {
                return false;
            }
        }

        return currentStepObj.fields.every(field => {
            // Allow skipping description in Demo mode (Not Required)
            if (isDemo && field.name === 'description') return true;

            if (field.required) {
                // Check Visibility
                if (field.showIf) {
                    const dependencyValue = formState[field.showIf.field];
                    let isVisible = false;
                    if (Array.isArray(dependencyValue)) {
                        isVisible = field.showIf.operator === 'neq'
                            ? !dependencyValue.includes(field.showIf.value)
                            : dependencyValue.includes(field.showIf.value);
                    } else {
                        isVisible = field.showIf.operator === 'neq'
                            ? dependencyValue !== field.showIf.value
                            : dependencyValue === field.showIf.value;
                    }
                    if (!isVisible) return true;
                }

                const value = formState[field.name];
                if (value === undefined || value === null) return false;
                if (typeof value === 'string' && value.trim() === '') return false;
                if (Array.isArray(value) && value.length === 0) return false;
                if (typeof value === 'object' && Object.keys(value).length === 0) return false;

                // SPECIAL VALIDATION: Description minimum length (except for Demo)
                if (field.name === 'description' && !isDemo) {
                    if (typeof value === 'string' && value.trim().length < 50) return false;
                }
            }
            return true;
        });
    };

    // --- FOOTER ---
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5, type: 'spring', damping: 25 }}
                className={cn(
                    "w-[calc(100vw-2rem)] sm:w-full max-w-6xl mx-auto z-20 relative",
                    "bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 rounded-2xl sm:rounded-3xl overflow-hidden",
                    "min-h-fit sm:min-h-[500px] flex flex-col"
                )}
            >
                {/* --- HEADER --- */}
                <div className="p-4 sm:p-6 lg:p-8 border-b border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white tracking-tight flex items-center gap-2 sm:gap-3">
                            <Sparkles className="w-6 h-6 text-purple-400" />
                            {schema?.title}
                        </h2>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1 min-h-[1.5rem]">
                            <AnimatePresence mode="wait">
                                {/* Mobile: Hide step text when audio is playing */}
                                {!currentAudioText && (
                                    <motion.span
                                        key="step-text"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="text-white/50 text-sm"
                                    >
                                        {`Passo ${step} de ${schema ? schema.steps.length : '?'}: ${schema?.steps?.[step - 1]?.title || ''}`}
                                    </motion.span>
                                )}
                                {/* Audio Indicator - takes full width on mobile when visible */}
                                {currentAudioText && (
                                    <motion.div
                                        key="audio-text"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="flex items-start gap-2 bg-purple-500/20 text-purple-200 text-xs px-2 py-1 rounded-lg sm:rounded-full"
                                    >
                                        <Volume2 className="w-3 h-3 animate-pulse flex-shrink-0 mt-0.5" />
                                        <span className="leading-tight">Lia: "{currentAudioText}"</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                    {/* Step Indicator + Volume Control */}
                    <div className="flex items-center gap-3 sm:gap-4">
                        {/* Volume Control */}
                        <LiaVolumeControl compact className="flex-shrink-0" />

                        {/* Step Indicator */}
                        {schema && (
                            <div className="flex gap-1 sm:gap-1.5 bg-black/20 p-1 sm:p-1.5 rounded-lg sm:rounded-full w-full sm:w-auto">
                                {schema.steps.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={cn(
                                            "flex-1 sm:flex-none h-1.5 sm:h-2.5 sm:w-2.5 rounded-full transition-all duration-500",
                                            (idx + 1) <= step ? "bg-purple-500 shadow-[0_0_10px_purple]" : "bg-white/10"
                                        )}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* --- BODY --- */}
                <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-h-[calc(100vh-280px)] sm:max-h-[60vh] custom-scrollbar">

                    {/* FORM STEPS */}
                    <div className="space-y-6">
                        <div className="space-y-6">
                            {schema?.steps?.[step - 1] && (
                                <motion.div
                                    key={step} // Re-animate when step changes
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <h3 className="text-lg font-medium text-white mb-6 border-l-4 border-purple-500 pl-4">
                                        {schema?.steps[step - 1]?.description || ''}
                                    </h3>

                                    <motion.div
                                        className="grid gap-6"
                                        variants={{
                                            hidden: { opacity: 0 },
                                            visible: {
                                                opacity: 1,
                                                transition: {
                                                    staggerChildren: 0.1
                                                }
                                            }
                                        }}
                                        initial="hidden"
                                        animate="visible"
                                    >
                                        {schema?.steps[step - 1]?.fields.map((field) => {
                                            // Check Conditional Visibility
                                            if (field.showIf) {
                                                const dependencyValue = formState[field.showIf.field];
                                                // Handle Array dependency (checkbox-group)
                                                if (Array.isArray(dependencyValue)) {
                                                    const conditionMet = field.showIf.operator === 'neq'
                                                        ? !dependencyValue.includes(field.showIf.value)
                                                        : dependencyValue.includes(field.showIf.value);
                                                    if (!conditionMet) return null;
                                                } else {
                                                    // Safe loose comparison or strict? Strict is better for strings.
                                                    const conditionMet = field.showIf.operator === 'neq'
                                                        ? dependencyValue !== field.showIf.value
                                                        : dependencyValue === field.showIf.value;
                                                    if (!conditionMet) return null;
                                                }
                                            }

                                            return (
                                                <motion.div
                                                    key={field.name}
                                                    className="space-y-2 group"
                                                    variants={{
                                                        hidden: { opacity: 0, y: 20 },
                                                        visible: {
                                                            opacity: 1,
                                                            y: 0,
                                                            transition: {
                                                                type: "spring",
                                                                damping: 20,
                                                                stiffness: 100
                                                            }
                                                        }
                                                    }}
                                                >
                                                    <Label
                                                        htmlFor={field.name}
                                                        className="text-white/80 font-medium ml-1 transition-colors group-focus-within:text-purple-400"
                                                    >
                                                        {field.label} {field.required && <span className="text-purple-500">*</span>}
                                                    </Label>
                                                    {renderField(field)}
                                                    {field.helperText && (
                                                        <p className="text-xs text-white/40 ml-1">{field.helperText}</p>
                                                    )}
                                                </motion.div>
                                            )
                                        })}
                                    </motion.div>
                                </motion.div>
                            )}
                        </div>
                    </div>

                </div>

                {/* --- FOOTER --- */}
                <div className="p-4 sm:p-6 border-t border-white/5 bg-black/20 flex justify-between items-center gap-2">
                    {step > 1 ? (
                        <Button
                            variant="ghost"
                            onClick={() => onStepChange(step - 1)}
                            className="text-white/50 hover:text-white hover:bg-white/5 rounded-xl h-10 sm:h-12 px-3 sm:px-6"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">Voltar</span>
                        </Button>
                    ) : (
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="text-white/30 hover:text-white hover:bg-white/5 rounded-xl h-10 sm:h-12 px-3 sm:px-6 text-xs sm:text-sm"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">{isDemo ? "Voltar" : "Voltar e adicionar o prompt"}</span>
                            <span className="sm:hidden">Voltar</span>
                        </Button>
                    )}

                    <Button
                        onClick={() => {
                            if (schema && step >= schema.steps.length) {
                                onComplete();
                            } else {
                                onStepChange(step + 1);
                            }
                        }}
                        disabled={!isStepValid()}
                        className={cn(
                            "bg-purple-600 hover:bg-purple-500 text-white rounded-xl h-10 sm:h-12 px-4 sm:px-6 lg:px-8 shadow-lg transition-all text-sm sm:text-base",
                            isStepValid() ? "shadow-purple-900/40 hover:scale-105" : "opacity-50 grayscale cursor-not-allowed"
                        )}
                    >
                        {schema && step >= schema.steps.length ? (
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
