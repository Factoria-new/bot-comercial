import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Loader2, CalendarDays, Video, MapPin, Plus, Trash2, Clock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TimeSlot,
    DaySchedule,
    WeekDay,
    CalendarSettings,
    PresetType,
    WEEKDAYS_MAP,
    WEEKDAYS_SHORT,
    DEFAULT_SCHEDULE,
    SCHEDULE_PRESETS
} from '@/lib/scheduleTypes';

// Re-export types for backwards compatibility
export type { TimeSlot, DaySchedule, WeekDay, CalendarSettings };

interface CalendarSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (settings: CalendarSettings) => void;
    isLoading?: boolean;
    initialSettings?: any; // Pode vir no formato antigo, precisaremos migrar
}

// Use centralized presets
const PRESETS = SCHEDULE_PRESETS;

const CalendarSettingsModal: React.FC<CalendarSettingsModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    isLoading = false,
    initialSettings
}) => {
    // Função para migrar configurações antigas ou usar padrão
    const getInitialState = (): CalendarSettings => {
        if (!initialSettings) {
            return {
                schedule: JSON.parse(JSON.stringify(DEFAULT_SCHEDULE)), // Deep copy
                meetingDuration: 30,
                breakDuration: 10,
                meetingType: 'online',
                meetingAddress: ''
            };
        }

        // Se já estiver no formato novo (tem propriedade schedule)
        if (initialSettings.schedule) {
            return initialSettings;
        }

        // Migração do formato antigo (workingDays + workHours)
        const migratedSchedule = JSON.parse(JSON.stringify(DEFAULT_SCHEDULE));
        const oldWorkHours = initialSettings.workHours || { start: '09:00', end: '18:00' };

        // Resetar todos como disabled primeiro
        (Object.keys(migratedSchedule) as WeekDay[]).forEach(day => {
            migratedSchedule[day].enabled = false;
            migratedSchedule[day].slots = [];
        });

        // Habilitar apenas os dias do array antigo
        if (Array.isArray(initialSettings.workingDays)) {
            initialSettings.workingDays.forEach((day: string) => {
                const d = day as WeekDay;
                if (migratedSchedule[d]) {
                    migratedSchedule[d].enabled = true;
                    migratedSchedule[d].slots = [{ ...oldWorkHours }];
                }
            });
        }

        return {
            schedule: migratedSchedule,
            meetingDuration: initialSettings.meetingDuration || 30,
            breakDuration: initialSettings.breakDuration || 0,
            meetingType: initialSettings.meetingType || 'online',
            meetingAddress: initialSettings.meetingAddress || ''
        };
    };

    const [settings, setSettings] = useState<CalendarSettings>(getInitialState());
    const [selectedPreset, setSelectedPreset] = useState<PresetType>('custom');

    // Atualizar settings se initialSettings mudar
    useEffect(() => {
        if (isOpen) {
            setSettings(getInitialState());
        }
    }, [initialSettings, isOpen]);

    const handlePresetSelect = (preset: PresetType) => {
        setSelectedPreset(preset);
        if (preset !== 'custom') {
            setSettings(prev => ({
                ...prev,
                schedule: JSON.parse(JSON.stringify(PRESETS[preset].schedule))
            }));
        }
    };

    const handleDayToggle = (day: WeekDay) => {
        setSelectedPreset('custom');
        setSettings(prev => ({
            ...prev,
            schedule: {
                ...prev.schedule,
                [day]: {
                    ...prev.schedule[day],
                    enabled: !prev.schedule[day].enabled,
                    // Se estiver habilitando e não tiver slots, adiciona um slot padrão
                    slots: !prev.schedule[day].enabled && prev.schedule[day].slots.length === 0
                        ? [{ start: '09:00', end: '18:00' }]
                        : prev.schedule[day].slots
                }
            }
        }));
    };

    const addSlot = (day: WeekDay) => {
        setSelectedPreset('custom');
        setSettings(prev => ({
            ...prev,
            schedule: {
                ...prev.schedule,
                [day]: {
                    ...prev.schedule[day],
                    slots: [...prev.schedule[day].slots, { start: '08:00', end: '12:00' }]
                }
            }
        }));
    };

    const removeSlot = (day: WeekDay, index: number) => {
        setSelectedPreset('custom');
        setSettings(prev => ({
            ...prev,
            schedule: {
                ...prev.schedule,
                [day]: {
                    ...prev.schedule[day],
                    slots: prev.schedule[day].slots.filter((_, i) => i !== index)
                }
            }
        }));
    };

    const updateSlot = (day: WeekDay, index: number, field: 'start' | 'end', value: string) => {
        setSelectedPreset('custom');
        setSettings(prev => {
            const newSlots = [...prev.schedule[day].slots];
            newSlots[index] = { ...newSlots[index], [field]: value };
            return {
                ...prev,
                schedule: {
                    ...prev.schedule,
                    [day]: {
                        ...prev.schedule[day],
                        slots: newSlots
                    }
                }
            };
        });
    };

    const handleConfirm = () => {
        onConfirm(settings);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-6xl gap-0 p-0 overflow-hidden bg-gradient-to-br from-white to-gray-50 border-none shadow-2xl">
                <DialogHeader className="p-6 pb-4 border-b border-gray-100 bg-white/80 backdrop-blur-xl z-10">
                    <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <div className="p-2 bg-gradient-to-br from-[#00A947]/10 to-[#00A947]/5 rounded-xl">
                            <CalendarDays className="h-6 w-6 text-[#00A947]" />
                        </div>
                        {initialSettings ? 'Editar Disponibilidade' : 'Configurar Agendamento'}
                    </DialogTitle>
                    <DialogDescription className="text-gray-500 ml-14">
                        Defina os horários em que o bot pode realizar agendamentos com seus clientes.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="h-[70vh] max-h-[700px] px-6 py-6">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                        {/* Coluna Esquerda: Quick Presets & Global Settings (1/4) */}
                        <div className="space-y-6">
                            {/* Quick Presets */}
                            <div className="space-y-3">
                                <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-[#00A947]" />
                                    Presets Rápidos
                                </Label>
                                <div className="space-y-2">
                                    {(Object.entries(PRESETS) as [PresetType, typeof PRESETS[PresetType]][]).map(([key, preset]) => {
                                        const Icon = preset.icon;
                                        const isSelected = selectedPreset === key;
                                        return (
                                            <motion.button
                                                key={key}
                                                onClick={() => handlePresetSelect(key)}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                className={cn(
                                                    "w-full p-3 rounded-xl border-2 transition-all text-left flex items-center gap-3",
                                                    isSelected
                                                        ? "border-[#00A947] bg-gradient-to-br from-[#00A947]/10 to-[#00A947]/5 shadow-md"
                                                        : "border-gray-200 bg-white hover:border-[#00A947]/30 hover:bg-gray-50"
                                                )}
                                            >
                                                <div className={cn(
                                                    "p-2 rounded-lg transition-colors",
                                                    isSelected ? "bg-[#00A947]/20" : "bg-gray-100"
                                                )}>
                                                    <Icon className={cn(
                                                        "h-4 w-4",
                                                        isSelected ? "text-[#00A947]" : "text-gray-600"
                                                    )} />
                                                </div>
                                                <span className={cn(
                                                    "text-sm font-medium",
                                                    isSelected ? "text-[#00A947]" : "text-gray-700"
                                                )}>
                                                    {preset.label}
                                                </span>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Visual Day Selector */}
                            <div className="space-y-3 p-4 bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200">
                                <Label className="text-sm font-semibold text-gray-900">
                                    Seleção Rápida
                                </Label>
                                <div className="grid grid-cols-7 gap-1">
                                    {(Object.keys(WEEKDAYS_SHORT) as WeekDay[]).map((day) => {
                                        const isEnabled = settings.schedule[day].enabled;
                                        return (
                                            <motion.button
                                                key={day}
                                                onClick={() => handleDayToggle(day)}
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                className={cn(
                                                    "aspect-square rounded-full font-bold text-xs transition-all shadow-sm",
                                                    isEnabled
                                                        ? "bg-gradient-to-br from-[#00A947] to-[#008a3a] text-white shadow-lg shadow-[#00A947]/30"
                                                        : "bg-white text-gray-400 border-2 border-gray-200 hover:border-[#00A947]/30"
                                                )}
                                            >
                                                {WEEKDAYS_SHORT[day]}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                                <p className="text-xs text-gray-500 text-center">
                                    Clique para ativar/desativar
                                </p>
                            </div>
                        </div>

                        {/* Coluna Central: Horários por Dia (2/4) */}
                        <div className="lg:col-span-2 space-y-4">
                            <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                <Clock className="h-4 w-4 text-[#00A947]" />
                                Horários Detalhados
                            </Label>

                            <div className="space-y-3">
                                {(Object.entries(WEEKDAYS_MAP) as [WeekDay, string][]).map(([key, label]) => {
                                    const daySchedule = settings.schedule[key];

                                    return (
                                        <motion.div
                                            key={key}
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={cn(
                                                "flex flex-col gap-3 p-4 rounded-xl border-2 transition-all",
                                                daySchedule.enabled
                                                    ? "bg-gradient-to-br from-white to-gray-50 border-[#00A947]/20 shadow-sm"
                                                    : "bg-gray-50/50 border-gray-200 opacity-60"
                                            )}
                                        >
                                            {/* Header do Dia */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Switch
                                                        checked={daySchedule.enabled}
                                                        onCheckedChange={() => handleDayToggle(key)}
                                                        className="data-[state=checked]:bg-[#00A947]"
                                                    />
                                                    <span className={cn(
                                                        "text-sm font-semibold",
                                                        daySchedule.enabled ? "text-gray-900" : "text-gray-400"
                                                    )}>
                                                        {label}
                                                    </span>
                                                </div>
                                                {daySchedule.enabled && (
                                                    <span className="text-xs text-[#00A947] font-medium">
                                                        {daySchedule.slots.length} {daySchedule.slots.length === 1 ? 'período' : 'períodos'}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Time Slots */}
                                            <AnimatePresence>
                                                {daySchedule.enabled && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="space-y-2 pl-11"
                                                    >
                                                        {daySchedule.slots.map((slot, index) => (
                                                            <motion.div
                                                                key={index}
                                                                initial={{ opacity: 0, x: -10 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                exit={{ opacity: 0, x: 10 }}
                                                                className="flex items-center gap-2"
                                                            >
                                                                <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm flex-1">
                                                                    <Input
                                                                        type="time"
                                                                        value={slot.start}
                                                                        onChange={(e) => updateSlot(key, index, 'start', e.target.value)}
                                                                        className="h-8 w-[110px] border-none bg-transparent focus-visible:ring-1 focus-visible:ring-[#00A947] text-center font-mono text-sm shadow-none p-1"
                                                                    />
                                                                    <span className="text-gray-400 font-bold">→</span>
                                                                    <Input
                                                                        type="time"
                                                                        value={slot.end}
                                                                        onChange={(e) => updateSlot(key, index, 'end', e.target.value)}
                                                                        className="h-8 w-[110px] border-none bg-transparent focus-visible:ring-1 focus-visible:ring-[#00A947] text-center font-mono text-sm shadow-none p-1"
                                                                    />
                                                                </div>

                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => removeSlot(key, index)}
                                                                    className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </motion.div>
                                                        ))}

                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => addSlot(key)}
                                                            className="text-xs text-[#00A947] hover:text-[#00A947]/80 hover:bg-[#00A947]/10 h-8 px-3 gap-1.5 w-full border-2 border-dashed border-[#00A947]/20 hover:border-[#00A947]/40"
                                                        >
                                                            <Plus className="h-3.5 w-3.5" />
                                                            Adicionar período
                                                        </Button>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            {!daySchedule.enabled && (
                                                <div className="pl-11">
                                                    <span className="text-xs text-gray-400 italic">Fechado neste dia</span>
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Coluna Direita: Meeting Settings (1/4) */}
                        <div className="space-y-5">
                            {/* Durações */}
                            <div className="space-y-4 p-5 bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-gray-200 shadow-sm h-fit">
                                <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-[#00A947]" />
                                    Tempo
                                </Label>

                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-xs text-gray-600 mb-2 block font-medium">Duração do Agendamento</Label>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                min="15"
                                                step="15"
                                                className="bg-white pr-12 focus-visible:ring-[#00A947] border-gray-300"
                                                value={settings.meetingDuration}
                                                onChange={(e) => setSettings({ ...settings, meetingDuration: parseInt(e.target.value) || 0 })}
                                            />
                                            <span className="absolute right-3 top-2.5 text-xs text-gray-500 font-medium">minutos</span>
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="text-xs text-gray-600 mb-2 block font-medium">Intervalo entre Reuniões</Label>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                min="0"
                                                step="5"
                                                className="bg-white pr-12 focus-visible:ring-[#00A947] border-gray-300"
                                                value={settings.breakDuration}
                                                onChange={(e) => setSettings({ ...settings, breakDuration: parseInt(e.target.value) || 0 })}
                                            />
                                            <span className="absolute right-3 top-2.5 text-xs text-gray-500 font-medium">minutos</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tipo de Agendamento */}
                            <div className="space-y-4 p-5 bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-gray-200 shadow-sm h-fit">
                                <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                    <Video className="h-4 w-4 text-[#00A947]" />
                                    Local
                                </Label>
                                <RadioGroup
                                    value={settings.meetingType}
                                    onValueChange={(val: 'online' | 'in-person') => setSettings({ ...settings, meetingType: val })}
                                    className="flex flex-col gap-3"
                                >
                                    <div className={cn(
                                        "flex flex-col space-y-2 border-2 rounded-xl p-3 cursor-pointer transition-all hover:bg-white",
                                        settings.meetingType === 'online' ? "border-[#00A947] bg-[#00A947]/5 shadow-sm" : "border-gray-200 bg-white"
                                    )}>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="online" id="online" className="text-[#00A947]" />
                                            <Label htmlFor="online" className="cursor-pointer font-medium flex items-center gap-2">
                                                <Video className="h-3.5 w-3.5" />
                                                <span className="text-sm">Online</span>
                                            </Label>
                                        </div>
                                        <p className="text-xs text-gray-500 pl-6">Google Meet automático</p>
                                    </div>

                                    <div className={cn(
                                        "flex flex-col space-y-2 border-2 rounded-xl p-3 cursor-pointer transition-all hover:bg-white",
                                        settings.meetingType === 'in-person' ? "border-[#00A947] bg-[#00A947]/5 shadow-sm" : "border-gray-200 bg-white"
                                    )}>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="in-person" id="in-person" className="text-[#00A947]" />
                                            <Label htmlFor="in-person" className="cursor-pointer font-medium flex items-center gap-2">
                                                <MapPin className="h-3.5 w-3.5" />
                                                <span className="text-sm">Presencial</span>
                                            </Label>
                                        </div>

                                        <AnimatePresence>
                                            {settings.meetingType === 'in-person' && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="pl-6"
                                                >
                                                    <Label className="text-xs text-gray-600 mb-1.5 block">Endereço</Label>
                                                    <Input
                                                        placeholder="Av. Paulista, 1000"
                                                        value={settings.meetingAddress || ''}
                                                        onChange={(e) => setSettings({ ...settings, meetingAddress: e.target.value })}
                                                        className="bg-white text-sm focus-visible:ring-[#00A947] border-gray-300"
                                                    />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </RadioGroup>
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <DialogFooter className="p-6 pt-4 border-t border-gray-200 bg-white/80 backdrop-blur-xl">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-[#00A947] to-[#008a3a] hover:from-[#008a3a] hover:to-[#00A947] text-white gap-2 shadow-lg shadow-[#00A947]/30 px-6"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Conectando...
                            </>
                        ) : (
                            <>
                                <CalendarDays className="h-4 w-4" />
                                Salvar Configurações
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CalendarSettingsModal;
