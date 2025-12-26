
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { X, CheckCircle2, Store, ArrowRight, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { NicheSchema, FormField } from "@/lib/nicheSchemas";

interface DynamicNicheModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    schema: NicheSchema;
    onSubmit: (data: Record<string, any>) => void;
}

export function DynamicNicheModal({ open, onOpenChange, schema, onSubmit }: DynamicNicheModalProps) {
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [tagsInput, setTagsInput] = useState<Record<string, string>>({});
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    // Reset when schema changes or re-opens
    useEffect(() => {
        if (open) {
            setFormData({});
            setCurrentStepIndex(0);
        }
    }, [open, schema.id]);

    const handleInputChange = (name: string, value: any) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNext = () => {
        if (currentStepIndex < schema.steps.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        } else {
            handleSubmit();
        }
    };

    const handleBack = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1);
        }
    };

    const handleSubmit = () => {
        onSubmit({
            _niche_id: schema.id,
            _niche_title: schema.title,
            ...formData
        });
        onOpenChange(false);
    };

    // Helper for Repeater Fields
    const addRepeaterItem = (fieldName: string, subFields: FormField[]) => {
        const currentItems = (formData[fieldName] as any[]) || [];
        const newItem: Record<string, any> = {};
        subFields.forEach(f => newItem[f.name] = '');
        handleInputChange(fieldName, [...currentItems, newItem]);
    };

    const removeRepeaterItem = (fieldName: string, index: number) => {
        const currentItems = (formData[fieldName] as any[]) || [];
        handleInputChange(fieldName, currentItems.filter((_, i) => i !== index));
    };

    const updateRepeaterItem = (fieldName: string, index: number, subFieldName: string, value: any) => {
        const currentItems = [...((formData[fieldName] as any[]) || [])];
        if (currentItems[index]) {
            currentItems[index] = { ...currentItems[index], [subFieldName]: value };
            handleInputChange(fieldName, currentItems);
        }
    };

    // Helper for Tag Input
    const handleTagKeyDown = (e: React.KeyboardEvent, fieldName: string) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const val = tagsInput[fieldName]?.trim();
            if (val) {
                const currentTags = (formData[fieldName] as string[]) || [];
                handleInputChange(fieldName, [...currentTags, val]);
                setTagsInput(prev => ({ ...prev, [fieldName]: '' }));
            }
        }
    };

    const removeTag = (fieldName: string, tagToRemove: string) => {
        const currentTags = (formData[fieldName] as string[]) || [];
        handleInputChange(fieldName, currentTags.filter(t => t !== tagToRemove));
    };

    const renderField = (field: FormField, parentName?: string, index?: number) => {
        const fieldId = parentName && index !== undefined ? `${parentName}-${index}-${field.name}` : field.name;

        // Handling values for regular fields vs repeater sub-fields
        let value: any;
        let onChange: (val: any) => void;

        if (parentName && index !== undefined) {
            // Inside repeater
            const parentValue = formData[parentName] as any[] || [];
            value = parentValue[index]?.[field.name] || '';
            onChange = (val) => updateRepeaterItem(parentName, index, field.name, val);
        } else {
            // Top level
            value = formData[field.name];
            onChange = (val) => handleInputChange(field.name, val);
        }

        switch (field.type) {
            case 'textarea':
                return (
                    <Textarea
                        id={fieldId}
                        placeholder={field.placeholder}
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className="bg-white/5 border-white/10 text-white min-h-[80px]"
                    />
                );
            case 'select':
                return (
                    <Select value={value || ''} onValueChange={onChange}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800 text-white">
                            {field.options?.map(opt => (
                                <SelectItem key={opt} value={opt} className="focus:bg-slate-800 focus:text-white cursor-pointer">
                                    {opt}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );
            case 'checkbox-group':
                const currentSelection = (value as string[]) || [];
                return (
                    <div className="grid grid-cols-2 gap-2">
                        {field.options?.map(opt => (
                            <div key={opt} className="flex items-center space-x-2 bg-white/5 p-2 rounded border border-white/5">
                                <Checkbox
                                    id={`${fieldId}-${opt}`}
                                    checked={currentSelection.includes(opt)}
                                    onCheckedChange={(checked) => {
                                        if (checked) onChange([...currentSelection, opt]);
                                        else onChange(currentSelection.filter(o => o !== opt));
                                    }}
                                    className="border-white/20 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                                />
                                <Label htmlFor={`${fieldId}-${opt}`} className="text-white/80 cursor-pointer text-sm">{opt}</Label>
                            </div>
                        ))}
                    </div>
                );
            case 'radio-group':
                return (
                    <RadioGroup value={value || ''} onValueChange={onChange} className="grid gap-2">
                        {field.options?.map(opt => (
                            <div key={opt} className="flex items-center space-x-2 space-y-0">
                                <RadioGroupItem value={opt} id={`${fieldId}-${opt}`} className="border-white/20 text-purple-600" />
                                <Label htmlFor={`${fieldId}-${opt}`} className="text-white/80 text-sm font-normal">{opt}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                );
            case 'tags':
                const currentTags = (value as string[]) || [];
                return (
                    <div className="space-y-2">
                        <div className="flex flex-wrap gap-2 mb-2">
                            {currentTags.map((tag, idx) => (
                                <Badge key={idx} variant="secondary" className="bg-purple-500/20 text-purple-200 hover:bg-purple-500/30 gap-1 pl-2 pr-1 py-1">
                                    {tag}
                                    <button onClick={() => removeTag(field.name, tag)} className="hover:text-white ml-1">
                                        <X className="w-3 h-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                        <Input
                            placeholder={field.placeholder}
                            value={tagsInput[field.name] || ''}
                            onChange={(e) => setTagsInput(prev => ({ ...prev, [field.name]: e.target.value }))}
                            onKeyDown={(e) => handleTagKeyDown(e, field.name)}
                            className="bg-white/5 border-white/10 text-white"
                        />
                        <p className="text-xs text-white/40">Pressione Enter para adicionar</p>
                    </div>
                );
            case 'repeater':
                const items = (value as any[]) || [];
                return (
                    <div className="space-y-3">
                        {items.map((item, idx) => (
                            <div key={idx} className="relative p-3 bg-white/5 rounded border border-white/10 space-y-3">
                                <button
                                    onClick={() => removeRepeaterItem(field.name, idx)}
                                    className="absolute top-2 right-2 text-white/30 hover:text-red-400 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <h4 className="text-sm font-medium text-white/60">Item {idx + 1}</h4>
                                <div className="grid gap-3">
                                    {field.subFields?.map(subField => (
                                        <div key={subField.name}>
                                            <Label className="text-xs text-white/50 mb-1 block">{subField.label}</Label>
                                            {renderField(subField, field.name, idx)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <Button
                            onClick={() => addRepeaterItem(field.name, field.subFields || [])}
                            variant="outline"
                            className="w-full border-dashed border-white/20 bg-transparent text-white/60 hover:bg-white/5 hover:text-white hover:border-white/40"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            {field.addButtonText || 'Adicionar Item'}
                        </Button>
                    </div>
                );
            default: // text, time, number
                return (
                    <Input
                        id={fieldId}
                        type={field.type === 'number' ? 'number' : field.type === 'time' ? 'time' : 'text'}
                        placeholder={field.placeholder}
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className="bg-white/5 border-white/10 text-white"
                    />
                );
        }
    };

    const currentStep = schema.steps[currentStepIndex];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                onInteractOutside={(e) => e.preventDefault()}
                overlayClassName="bg-transparent backdrop-blur-none"
                className="bg-[#0f172a]/50 backdrop-blur-md border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto sm:rounded-2xl flex flex-col p-0 gap-0"
            >

                {/* Header */}
                <div className="p-6 pb-4 border-b border-white/10 bg-[#0f172a]/50 sticky top-0 z-10 backdrop-blur-md">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-600/50 flex items-center justify-center">
                                <Store className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-outfit">{schema.title}</DialogTitle>
                                <p className="text-sm text-white/60">Passo {currentStepIndex + 1} de {schema.steps.length}: {currentStep.title}</p>
                            </div>
                        </div>
                        {/* Progress Indicator */}
                        <div className="flex gap-1">
                            {schema.steps.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`h-1.5 w-6 rounded-full transition-colors ${idx <= currentStepIndex ? 'bg-purple-500' : 'bg-white/10'}`}
                                />
                            ))}
                        </div>
                    </div>
                    <DialogDescription className="text-white/60 text-sm hidden">
                        {currentStep.description}
                    </DialogDescription>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 text-sm text-purple-200 mb-4">
                        {currentStep.description}
                    </div>

                    <div className="grid gap-6">
                        {currentStep.fields.map((field) => (
                            <div key={field.name} className="space-y-2">
                                <Label htmlFor={field.name} className="text-white/80 font-medium ml-1">
                                    {field.label} {field.required && <span className="text-purple-400">*</span>}
                                </Label>
                                {renderField(field)}
                                {field.helperText && (
                                    <p className="text-xs text-white/40 ml-1">{field.helperText}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 pt-4 border-t border-white/10 bg-[#0f172a]/20 sticky bottom-0 z-10 flex justify-between backdrop-blur-md">
                    <Button
                        variant="ghost"
                        onClick={currentStepIndex === 0 ? () => onOpenChange(false) : handleBack}
                        className="text-white/60 hover:text-white hover:bg-white/10"
                    >
                        {currentStepIndex === 0 ? 'Cancelar' : <><ArrowLeft className="w-4 h-4 mr-2" /> Voltar</>}
                    </Button>

                    <Button
                        onClick={handleNext}
                        className="bg-purple-600 hover:bg-purple-500 text-white gap-2 px-6"
                    >
                        {currentStepIndex === schema.steps.length - 1 ? (
                            <>Concluir <CheckCircle2 className="w-4 h-4" /></>
                        ) : (
                            <>Próximo <ArrowRight className="w-4 h-4" /></>
                        )}
                    </Button>
                </div>

            </DialogContent>
        </Dialog>
    );
}
