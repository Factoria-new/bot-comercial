import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Loader2, CalendarDays, Video, MapPin, Plus, Trash2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

// Interfaces atualizadas para suportar horários granulares
export interface TimeSlot {
    start: string;
    end: string;
}

export interface DaySchedule {
    enabled: boolean;
    slots: TimeSlot[];
}

export type WeekDay = 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom';

export interface CalendarSettings {
    schedule: Record<WeekDay, DaySchedule>;
    meetingDuration: number; // minutes
    breakDuration: number; // minutes
    meetingType: 'online' | 'in-person';
    meetingAddress?: string; // Endereço para reuniões presenciais
}

interface CalendarSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (settings: CalendarSettings) => void;
    isLoading?: boolean;
    initialSettings?: any; // Pode vir no formato antigo, precisaremos migrar
}

const WEEKDAYS_MAP: Record<WeekDay, string> = {
    'seg': 'Segunda-feira',
    'ter': 'Terça-feira',
    'qua': 'Quarta-feira',
    'qui': 'Quinta-feira',
    'sex': 'Sexta-feira',
    'sab': 'Sábado',
    'dom': 'Domingo',
};

const DEFAULT_SCHEDULE: Record<WeekDay, DaySchedule> = {
    'seg': { enabled: true, slots: [{ start: '09:00', end: '18:00' }] },
    'ter': { enabled: true, slots: [{ start: '09:00', end: '18:00' }] },
    'qua': { enabled: true, slots: [{ start: '09:00', end: '18:00' }] },
    'qui': { enabled: true, slots: [{ start: '09:00', end: '18:00' }] },
    'sex': { enabled: true, slots: [{ start: '09:00', end: '18:00' }] },
    'sab': { enabled: false, slots: [{ start: '09:00', end: '13:00' }] },
    'dom': { enabled: false, slots: [] },
};

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

    // Atualizar settings se initialSettings mudar
    useEffect(() => {
        if (isOpen) {
            setSettings(getInitialState());
        }
    }, [initialSettings, isOpen]);

    const handleDayToggle = (day: WeekDay) => {
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
            <DialogContent className="sm:max-w-5xl gap-0 p-0 overflow-hidden bg-white border-none shadow-2xl">
                <DialogHeader className="p-6 pb-4 border-b border-gray-100 bg-white z-10">
                    <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <CalendarDays className="h-5 w-5 text-[#00A947]" />
                        {initialSettings ? 'Editar Disponibilidade' : 'Configurar Agendamento'}
                    </DialogTitle>
                    <DialogDescription className="text-gray-500">
                        Defina os horários em que o bot pode realizar agendamentos.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="h-[70vh] max-h-[700px] px-6 py-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Coluna Esquerda: Horários Semanal (Ocupa 2/3) */}
                        <div className="lg:col-span-2 space-y-4">
                            <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                <Clock className="h-4 w-4 text-[#00A947]" />
                                Horários por Dia
                            </Label>

                            <div className="space-y-3">
                                {(Object.entries(WEEKDAYS_MAP) as [WeekDay, string][]).map(([key, label]) => {
                                    const daySchedule = settings.schedule[key];

                                    return (
                                        <div key={key} className={cn(
                                            "flex flex-col sm:flex-row sm:items-start gap-4 p-4 rounded-xl border transition-all",
                                            daySchedule.enabled
                                                ? "bg-white border-green-100 shadow-sm"
                                                : "bg-gray-50 border-gray-100 opacity-80"
                                        )}>
                                            {/* Toggle do Dia */}
                                            <div className="flex items-center gap-3 min-w-[140px] pt-2">
                                                <Switch
                                                    checked={daySchedule.enabled}
                                                    onCheckedChange={() => handleDayToggle(key)}
                                                    className="data-[state=checked]:bg-[#00A947]"
                                                />
                                                <span className={cn(
                                                    "text-sm font-medium",
                                                    daySchedule.enabled ? "text-gray-900" : "text-gray-400"
                                                )}>
                                                    {label}
                                                </span>
                                            </div>

                                            {/* Lista de Slots */}
                                            <div className="flex-1 space-y-2">
                                                {daySchedule.enabled ? (
                                                    <>
                                                        {daySchedule.slots.map((slot, index) => (
                                                            <div key={index} className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                                                                <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200 group-hover:border-[#00A947]/30 transition-colors">
                                                                    <Input
                                                                        type="time"
                                                                        value={slot.start}
                                                                        onChange={(e) => updateSlot(key, index, 'start', e.target.value)}
                                                                        className="h-8 w-[100px] border-none bg-transparent focus-visible:ring-0 text-center font-mono text-sm shadow-none p-0"
                                                                    />
                                                                    <span className="text-gray-400">-</span>
                                                                    <Input
                                                                        type="time"
                                                                        value={slot.end}
                                                                        onChange={(e) => updateSlot(key, index, 'end', e.target.value)}
                                                                        className="h-8 w-[100px] border-none bg-transparent focus-visible:ring-0 text-center font-mono text-sm shadow-none p-0"
                                                                    />
                                                                </div>

                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => removeSlot(key, index)}
                                                                    className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        ))}

                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => addSlot(key)}
                                                            className="text-xs text-[#00A947] hover:text-[#00A947]/80 hover:bg-[#00A947]/10 h-7 px-2 gap-1"
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                            Adicionar intervalo
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <div className="pt-2">
                                                        <span className="text-sm text-gray-400 italic">Fechado</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Coluna Direita: Configurações Gerais (Ocupa 1/3) */}
                        <div className="space-y-6">
                            {/* Durações */}
                            <div className="space-y-4 p-5 bg-gray-50 rounded-xl border border-gray-100 h-fit">
                                <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-[#00A947]" />
                                    Configurações de Tempo
                                </Label>

                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-xs text-gray-500 mb-1.5 block">Duração do Agendamento</Label>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                min="15"
                                                step="15"
                                                className="bg-white pr-10 focus-visible:ring-[#00A947]"
                                                value={settings.meetingDuration}
                                                onChange={(e) => setSettings({ ...settings, meetingDuration: parseInt(e.target.value) || 0 })}
                                            />
                                            <span className="absolute right-3 top-2.5 text-xs text-gray-400">min</span>
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="text-xs text-gray-500 mb-1.5 block">Intervalo entre Agendamentos</Label>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                min="0"
                                                step="5"
                                                className="bg-white pr-10 focus-visible:ring-[#00A947]"
                                                value={settings.breakDuration}
                                                onChange={(e) => setSettings({ ...settings, breakDuration: parseInt(e.target.value) || 0 })}
                                            />
                                            <span className="absolute right-3 top-2.5 text-xs text-gray-400">min</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tipo de Agendamento */}
                            <div className="space-y-4 p-5 bg-gray-50 rounded-xl border border-gray-100 h-fit">
                                <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                    <Video className="h-4 w-4 text-[#00A947]" />
                                    Local do Agendamento
                                </Label>
                                <RadioGroup
                                    value={settings.meetingType}
                                    onValueChange={(val: 'online' | 'in-person') => setSettings({ ...settings, meetingType: val })}
                                    className="flex flex-col gap-3"
                                >
                                    <div className={cn(
                                        "flex flex-col space-y-1 border rounded-lg p-3 cursor-pointer transition-all hover:bg-white",
                                        settings.meetingType === 'online' ? "border-[#00A947] bg-[#00A947]/5" : "border-gray-200 bg-white"
                                    )}>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="online" id="online" className="text-[#00A947]" />
                                            <Label htmlFor="online" className="cursor-pointer font-medium flex items-center gap-2">
                                                <Video className="h-3.5 w-3.5" />
                                                Online (Google Meet)
                                            </Label>
                                        </div>
                                    </div>

                                    <div className={cn(
                                        "flex flex-col space-y-1 border rounded-lg p-3 cursor-pointer transition-all hover:bg-white",
                                        settings.meetingType === 'in-person' ? "border-[#00A947] bg-[#00A947]/5" : "border-gray-200 bg-white"
                                    )}>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="in-person" id="in-person" className="text-[#00A947]" />
                                            <Label htmlFor="in-person" className="cursor-pointer font-medium flex items-center gap-2">
                                                <MapPin className="h-3.5 w-3.5" />
                                                Presencial
                                            </Label>
                                        </div>

                                        {settings.meetingType === 'in-person' && (
                                            <div className="pt-3 pl-6 animate-in fade-in slide-in-from-top-1 duration-200">
                                                <Label className="text-xs text-gray-500 mb-1.5 block">Endereço do Local</Label>
                                                <Input
                                                    placeholder="Ex: Av. Paulista, 1000 - Sala 42"
                                                    value={settings.meetingAddress || ''}
                                                    onChange={(e) => setSettings({ ...settings, meetingAddress: e.target.value })}
                                                    className="bg-white text-sm focus-visible:ring-[#00A947]"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </RadioGroup>
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <DialogFooter className="p-6 pt-4 border-t border-gray-100 bg-gray-50/50">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-900"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className="bg-[#00A947] hover:bg-[#00A947]/90 text-white gap-2 shadow-md shadow-green-200"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Conectando...
                            </>
                        ) : (
                            'Salvar Configurações'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CalendarSettingsModal;
