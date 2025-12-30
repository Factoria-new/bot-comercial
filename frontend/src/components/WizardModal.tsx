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
    Volume2
} from "lucide-react";
import { NicheSchema, FormField } from "@/lib/nicheSchemas";
import { getRandomAudio, AudioTriggerType } from "@/lib/audioMappings";

interface WizardModalProps {
    open: boolean;
    step: number; // 0=Intro/Niche, 1+ = Schema Steps
    schema: NicheSchema | null;
    data: Record<string, any>;
    onDataUpdate: (newData: Record<string, any>) => void;
    onStepChange: (newStep: number) => void;
    onComplete: () => void;
    voiceActive?: boolean;
}


export function WizardModal({
    open,
    step,
    schema,
    data,
    onDataUpdate,
    onStepChange,
    onComplete,
}: WizardModalProps) {

    const [formState, setFormState] = useState<Record<string, any>>({});
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [currentAudioText, setCurrentAudioText] = useState<string | null>(null);

    // Initial Debug Log
    useEffect(() => {
        if (open) console.log("🧙‍♂️ WizardModal Open. Step:", step, "Schema:", schema?.id);
    }, [open, step, schema]);

    // Sync external data to local state for inputs
    useEffect(() => {
        setFormState(data);
    }, [data]);

    // Audio Playback Helper
    const playAudioGuidance = (trigger: AudioTriggerType) => {
        try {
            if (!audioRef.current) {
                audioRef.current = new Audio();
            }

            const variation = getRandomAudio(trigger);
            if (!variation || !variation.path) {
                // Squelch missing audio warning for now
                return;
            }

            console.log(`🎵 Playing Audio Guide: [${trigger}] -> ${variation.path}`);

            audioRef.current.src = variation.path;
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(e => console.warn("Audio play blocked/error:", e));
            }

            setCurrentAudioText(variation.text);
            setTimeout(() => setCurrentAudioText(null), 5000);
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
                // 1 -> Identity, 2 -> Operations, 3 -> Catalog
                if (step === 1) playAudioGuidance('step_identity');
                else if (step === 3) playAudioGuidance('step_catalog');
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
                    <div className="grid grid-cols-2 gap-2">
                        {field.options?.map(opt => (
                            <div key={opt} className="flex items-center space-x-2 bg-black/20 p-3 rounded-xl border border-white/5">
                                <Checkbox
                                    id={`${fieldId}-${opt}`}
                                    checked={currentSelection.includes(opt)}
                                    onCheckedChange={(checked) => {
                                        if (checked) onChange([...currentSelection, opt]);
                                        else onChange(currentSelection.filter(o => o !== opt));
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
                    "min-h-[500px] flex flex-col"
                )}
            >
                {/* --- HEADER --- */}
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                            <Sparkles className="w-6 h-6 text-purple-400" />
                            {schema?.title}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            {`Passo ${step} de ${schema ? schema.steps.length : '?'}: ${schema?.steps?.[step - 1]?.title || ''}`}
                            {/* Audio Indicator */}
                            {currentAudioText && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-2 bg-purple-500/20 text-purple-200 text-xs px-2 py-1 rounded-full"
                                >
                                    <Volume2 className="w-3 h-3 animate-pulse" />
                                    <span>Lia: "{currentAudioText}"</span>
                                </motion.div>
                            )}
                        </div>
                    </div>
                    {/* Step Indicator */}
                    {schema && (
                        <div className="flex gap-1.5 bg-black/20 p-1.5 rounded-full">
                            {schema.steps.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={cn(
                                        "w-2.5 h-2.5 rounded-full transition-all duration-500",
                                        (idx + 1) <= step ? "bg-purple-500 shadow-[0_0_10px_purple]" : "bg-white/10"
                                    )}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* --- BODY --- */}
                <div className="flex-1 p-8 overflow-y-auto max-h-[60vh] custom-scrollbar">

                    {/* FORM STEPS */}
                    <div className="space-y-6">
                        <div className="space-y-6">
                            {schema?.steps?.[step - 1] && (
                                <motion.div
                                    key={step}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <h3 className="text-lg font-medium text-white mb-6 border-l-4 border-purple-500 pl-4">
                                        {schema?.steps[step - 1]?.description || ''}
                                    </h3>

                                    <div className="grid gap-6">
                                        {schema?.steps[step - 1]?.fields.map((field) => (
                                            <div key={field.name} className="space-y-2 group">
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
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>

                </div>

                {/* --- FOOTER --- */}
                <div className="p-6 border-t border-white/5 bg-black/20 flex justify-between items-center">
                    {step > 1 ? (
                        <Button
                            variant="ghost"
                            onClick={() => onStepChange(step - 1)}
                            className="text-white/50 hover:text-white hover:bg-white/5 rounded-xl h-12 px-6"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Voltar
                        </Button>
                    ) : <div />}

                    <Button
                        onClick={() => {
                            if (schema && step >= schema.steps.length) {
                                onComplete();
                            } else {
                                onStepChange(step + 1);
                            }
                        }}
                        className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl h-12 px-8 shadow-lg shadow-purple-900/40 transition-all hover:scale-105"
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
