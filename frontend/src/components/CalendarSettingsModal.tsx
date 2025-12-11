import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Clock, CalendarDays, Video, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarSettings {
    workingDays: string[];
    workHours: {
        start: string;
        end: string;
    };
    meetingDuration: number; // minutes
    breakDuration: number; // minutes
    meetingType: 'online' | 'in-person';
}

interface CalendarSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (settings: CalendarSettings) => void;
    isLoading?: boolean;
    initialSettings?: CalendarSettings;
}

const WEEKDAYS = [
    { id: 'seg', label: 'Seg' },
    { id: 'ter', label: 'Ter' },
    { id: 'qua', label: 'Qua' },
    { id: 'qui', label: 'Qui' },
    { id: 'sex', label: 'Sex' },
    { id: 'sab', label: 'Sáb' },
    { id: 'dom', label: 'Dom' },
];

const CalendarSettingsModal: React.FC<CalendarSettingsModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    isLoading = false,
    initialSettings
}) => {
    const defaultSettings: CalendarSettings = {
        workingDays: ['seg', 'ter', 'qua', 'qui', 'sex'],
        workHours: { start: '09:00', end: '18:00' },
        meetingDuration: 30,
        breakDuration: 10,
        meetingType: 'online'
    };

    const [settings, setSettings] = useState<CalendarSettings>(initialSettings || defaultSettings);

    // Atualizar settings se initialSettings mudar (ex: carregou dados do backend)
    React.useEffect(() => {
        if (initialSettings) {
            setSettings(initialSettings);
        }
    }, [initialSettings]);

    const handleDayToggle = (dayId: string) => {
        setSettings(prev => {
            const days = prev.workingDays.includes(dayId)
                ? prev.workingDays.filter(d => d !== dayId)
                : [...prev.workingDays, dayId];
            return { ...prev, workingDays: days };
        });
    };

    const handleConfirm = () => {
        onConfirm(settings);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] gap-6">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-[#00A947] flex items-center gap-2">
                        <CalendarDays className="h-5 w-5" />
                        {initialSettings ? 'Editar Configurações' : 'Configurar Agendamento'}
                    </DialogTitle>
                    <DialogDescription>
                        Defina suas preferências para que o bot possa agendar reuniões corretamente.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-2">
                    {/* Dias de Funcionamento */}
                    <div className="space-y-3">
                        <Label className="text-sm font-medium text-gray-700">Dias de Funcionamento</Label>
                        <div className="flex flex-wrap gap-2">
                            {WEEKDAYS.map((day) => (
                                <div
                                    key={day.id}
                                    onClick={() => handleDayToggle(day.id)}
                                    className={cn(
                                        "cursor-pointer px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                                        settings.workingDays.includes(day.id)
                                            ? "bg-[#00A947] text-white border-[#00A947]"
                                            : "bg-white text-gray-500 border-gray-200 hover:border-[#00A947]/50"
                                    )}
                                >
                                    {day.label}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Horário de Funcionamento */}
                    <div className="space-y-3">
                        <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            Horário de Trabalho
                        </Label>
                        <div className="flex items-center gap-4">
                            <div className="flex-1 space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Início</Label>
                                <Input
                                    type="time"
                                    className="focus-visible:ring-[#00A947]"
                                    value={settings.workHours.start}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        workHours: { ...settings.workHours, start: e.target.value }
                                    })}
                                />
                            </div>
                            <span className="text-gray-400 pt-6">-</span>
                            <div className="flex-1 space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Fim</Label>
                                <Input
                                    type="time"
                                    className="focus-visible:ring-[#00A947]"
                                    value={settings.workHours.end}
                                    onChange={(e) => setSettings({
                                        ...settings,
                                        workHours: { ...settings.workHours, end: e.target.value }
                                    })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Durações */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <Label className="text-sm font-medium text-gray-700">Duração da Reunião</Label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    min="15"
                                    step="15"
                                    className="pr-10 focus-visible:ring-[#00A947]"
                                    value={settings.meetingDuration}
                                    onChange={(e) => setSettings({ ...settings, meetingDuration: parseInt(e.target.value) || 0 })}
                                />
                                <span className="absolute right-3 top-2.5 text-xs text-gray-400">min</span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <Label className="text-sm font-medium text-gray-700">Intervalo entre Reuniões</Label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    min="0"
                                    step="5"
                                    className="pr-10 focus-visible:ring-[#00A947]"
                                    value={settings.breakDuration}
                                    onChange={(e) => setSettings({ ...settings, breakDuration: parseInt(e.target.value) || 0 })}
                                />
                                <span className="absolute right-3 top-2.5 text-xs text-gray-400">min</span>
                            </div>
                        </div>
                    </div>

                    {/* Tipo de Reunião */}
                    <div className="space-y-3">
                        <Label className="text-sm font-medium text-gray-700">Tipo de Reunião</Label>
                        <RadioGroup
                            value={settings.meetingType}
                            onValueChange={(val: 'online' | 'in-person') => setSettings({ ...settings, meetingType: val })}
                            className="flex gap-4"
                        >
                            <div className={cn(
                                "flex-1 flex items-center space-x-2 border rounded-lg p-3 cursor-pointer transition-all hover:bg-gray-50",
                                settings.meetingType === 'online' ? "border-[#00A947] bg-[#00A947]/5" : "border-gray-200"
                            )}>
                                <RadioGroupItem value="online" id="online" className="text-[#00A947]" />
                                <Label htmlFor="online" className="cursor-pointer flex items-center gap-2">
                                    <Video className="h-4 w-4 text-gray-500" />
                                    Online (Google Meet)
                                </Label>
                            </div>
                            <div className={cn(
                                "flex-1 flex items-center space-x-2 border rounded-lg p-3 cursor-pointer transition-all hover:bg-gray-50",
                                settings.meetingType === 'in-person' ? "border-[#00A947] bg-[#00A947]/5" : "border-gray-200"
                            )}>
                                <RadioGroupItem value="in-person" id="in-person" className="text-[#00A947]" />
                                <Label htmlFor="in-person" className="cursor-pointer flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-gray-500" />
                                    Presencial
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="text-[#FE601E] hover:text-[#FE601E]/90 hover:bg-[#FE601E]/10"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className="bg-[#00A947] hover:bg-[#00A947]/90 text-white gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Conectando...
                            </>
                        ) : (
                            'Salvar e Conectar'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CalendarSettingsModal;
