// Centralized schedule types and constants
// Used by WizardModal, CalendarSettingsModal, and other schedule-related components

import { Sun, Zap, Moon, CalendarDays, LucideIcon } from 'lucide-react';

// --- CORE TYPES ---

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
    meetingAddress?: string;
}

// --- CONSTANTS ---

export const WEEKDAYS_MAP: Record<WeekDay, string> = {
    'seg': 'Segunda-feira',
    'ter': 'Terça-feira',
    'qua': 'Quarta-feira',
    'qui': 'Quinta-feira',
    'sex': 'Sexta-feira',
    'sab': 'Sábado',
    'dom': 'Domingo',
};

export const WEEKDAYS_SHORT: Record<WeekDay, string> = {
    'seg': 'S',
    'ter': 'T',
    'qua': 'Q',
    'qui': 'Q',
    'sex': 'S',
    'sab': 'S',
    'dom': 'D',
};

export const WEEKDAYS_ORDER: WeekDay[] = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];

export const DEFAULT_SCHEDULE: Record<WeekDay, DaySchedule> = {
    'seg': { enabled: true, slots: [{ start: '09:00', end: '18:00' }] },
    'ter': { enabled: true, slots: [{ start: '09:00', end: '18:00' }] },
    'qua': { enabled: true, slots: [{ start: '09:00', end: '18:00' }] },
    'qui': { enabled: true, slots: [{ start: '09:00', end: '18:00' }] },
    'sex': { enabled: true, slots: [{ start: '09:00', end: '18:00' }] },
    'sab': { enabled: false, slots: [{ start: '09:00', end: '13:00' }] },
    'dom': { enabled: false, slots: [] },
};

// --- PRESETS ---

export type PresetType = 'business' | '24-7' | 'weekends' | 'custom';

export interface SchedulePreset {
    label: string;
    icon: LucideIcon;
    schedule: Record<WeekDay, DaySchedule>;
}

export const SCHEDULE_PRESETS: Record<PresetType, SchedulePreset> = {
    'business': {
        label: 'Horário Comercial',
        icon: Sun,
        schedule: {
            'seg': { enabled: true, slots: [{ start: '09:00', end: '18:00' }] },
            'ter': { enabled: true, slots: [{ start: '09:00', end: '18:00' }] },
            'qua': { enabled: true, slots: [{ start: '09:00', end: '18:00' }] },
            'qui': { enabled: true, slots: [{ start: '09:00', end: '18:00' }] },
            'sex': { enabled: true, slots: [{ start: '09:00', end: '18:00' }] },
            'sab': { enabled: false, slots: [] },
            'dom': { enabled: false, slots: [] },
        }
    },
    '24-7': {
        label: '24/7 Disponível',
        icon: Zap,
        schedule: {
            'seg': { enabled: true, slots: [{ start: '00:00', end: '23:59' }] },
            'ter': { enabled: true, slots: [{ start: '00:00', end: '23:59' }] },
            'qua': { enabled: true, slots: [{ start: '00:00', end: '23:59' }] },
            'qui': { enabled: true, slots: [{ start: '00:00', end: '23:59' }] },
            'sex': { enabled: true, slots: [{ start: '00:00', end: '23:59' }] },
            'sab': { enabled: true, slots: [{ start: '00:00', end: '23:59' }] },
            'dom': { enabled: true, slots: [{ start: '00:00', end: '23:59' }] },
        }
    },
    'weekends': {
        label: 'Apenas Fins de Semana',
        icon: Moon,
        schedule: {
            'seg': { enabled: false, slots: [] },
            'ter': { enabled: false, slots: [] },
            'qua': { enabled: false, slots: [] },
            'qui': { enabled: false, slots: [] },
            'sex': { enabled: false, slots: [] },
            'sab': { enabled: true, slots: [{ start: '10:00', end: '16:00' }] },
            'dom': { enabled: true, slots: [{ start: '10:00', end: '16:00' }] },
        }
    },
    'custom': {
        label: 'Personalizado',
        icon: CalendarDays,
        schedule: DEFAULT_SCHEDULE
    }
};

// --- HELPER FUNCTIONS ---

/**
 * Deep clones a schedule object to avoid mutation
 */
export const cloneSchedule = (schedule: Record<WeekDay, DaySchedule>): Record<WeekDay, DaySchedule> => {
    return JSON.parse(JSON.stringify(schedule));
};

/**
 * Creates a new default schedule (deep cloned)
 */
export const createDefaultSchedule = (): Record<WeekDay, DaySchedule> => {
    return cloneSchedule(DEFAULT_SCHEDULE);
};

/**
 * Gets a preset schedule by key (deep cloned)
 */
export const getPresetSchedule = (preset: PresetType): Record<WeekDay, DaySchedule> => {
    return cloneSchedule(SCHEDULE_PRESETS[preset].schedule);
};
