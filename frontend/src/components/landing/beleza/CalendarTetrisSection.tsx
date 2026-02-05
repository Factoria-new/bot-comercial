import { useEffect, useState } from "react";
import { Calendar, Check } from "lucide-react";

/**
 * CalendarTetrisSection - Beleza Landing Page
 * Google Calendar visualization with "Tetris" style filled slots
 * Uses --beleza-* CSS variables
 */

const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
const timeSlots = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

const appointmentColors = [
    'hsl(292 91% 73%)',     // Primary purple
    'hsl(262 83% 66%)',     // Violet
    'hsl(330 80% 60%)',     // Pink
    'hsl(280 70% 60%)',     // Magenta
    'hsl(48 96% 53%)',      // Gold
];

const generateAppointments = () => {
    const appointments: { day: number; slot: number; color: string; duration: number }[] = [];

    weekDays.forEach((_, dayIndex) => {
        let currentSlot = 0;
        while (currentSlot < timeSlots.length) {
            if (Math.random() > 0.15) {
                const duration = Math.random() > 0.6 ? 2 : 1;
                appointments.push({
                    day: dayIndex,
                    slot: currentSlot,
                    color: appointmentColors[Math.floor(Math.random() * appointmentColors.length)],
                    duration: Math.min(duration, timeSlots.length - currentSlot)
                });
                currentSlot += duration;
            } else {
                currentSlot++;
            }
        }
    });

    return appointments;
};

export const CalendarTetrisSection = () => {
    const [appointments, setAppointments] = useState<ReturnType<typeof generateAppointments>>([]);
    const [visibleAppointments, setVisibleAppointments] = useState<number>(0);

    useEffect(() => {
        setAppointments(generateAppointments());
    }, []);

    useEffect(() => {
        if (visibleAppointments < appointments.length) {
            const timeout = setTimeout(() => {
                setVisibleAppointments(prev => prev + 1);
            }, 80);
            return () => clearTimeout(timeout);
        }
    }, [visibleAppointments, appointments.length]);

    const getAppointmentForSlot = (dayIndex: number, slotIndex: number) => {
        return appointments.find(
            apt => apt.day === dayIndex && apt.slot === slotIndex
        );
    };

    const isSlotOccupied = (dayIndex: number, slotIndex: number) => {
        return appointments.some(
            apt => apt.day === dayIndex &&
                slotIndex >= apt.slot &&
                slotIndex < apt.slot + apt.duration
        );
    };

    const getAppointmentIndex = (dayIndex: number, slotIndex: number) => {
        return appointments.findIndex(
            apt => apt.day === dayIndex && apt.slot === slotIndex
        );
    };

    return (
        <section
            className="py-20 relative overflow-hidden"
            style={{ backgroundColor: 'hsl(var(--beleza-background))' }}
        >
            {/* Background Glow */}
            <div
                className="absolute top-1/2 right-0 w-[500px] h-[500px] rounded-full blur-[150px] -z-10"
                style={{ background: 'var(--beleza-gradient-primary)', opacity: 0.1 }}
            />

            <div className="container px-4 md:px-6">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Left Content - Calendar */}
                    <div className="order-2 lg:order-1">
                        <div
                            className="rounded-3xl backdrop-blur-xl p-6 overflow-hidden"
                            style={{
                                backgroundColor: 'hsl(var(--beleza-card))',
                                border: '1px solid hsl(var(--beleza-border))',
                                boxShadow: 'var(--beleza-shadow-card)'
                            }}
                        >
                            {/* Calendar Header */}
                            <div
                                className="flex items-center justify-between mb-6 pb-4"
                                style={{ borderBottom: '1px solid hsl(var(--beleza-border))' }}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                                        style={{ background: 'var(--beleza-gradient-primary)' }}
                                    >
                                        <Calendar className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h4
                                            className="font-bold font-display uppercase text-sm"
                                            style={{ color: 'hsl(var(--beleza-foreground))' }}
                                        >
                                            Google Agenda
                                        </h4>
                                        <span
                                            className="text-xs"
                                            style={{ color: 'hsl(var(--beleza-muted-foreground))' }}
                                        >
                                            Fevereiro 2026
                                        </span>
                                    </div>
                                </div>
                                <div
                                    className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
                                    style={{
                                        backgroundColor: 'hsl(142 76% 36% / 0.2)',
                                        color: 'hsl(142 76% 46%)'
                                    }}
                                >
                                    <Check className="w-3 h-3" />
                                    Sincronizado
                                </div>
                            </div>

                            {/* Calendar Grid */}
                            <div className="overflow-x-auto">
                                <div className="min-w-[500px]">
                                    {/* Days Header */}
                                    <div className="grid grid-cols-7 gap-1 mb-2">
                                        <div className="w-12" />
                                        {weekDays.map((day) => (
                                            <div
                                                key={day}
                                                className="text-center text-xs font-bold uppercase py-2"
                                                style={{ color: 'hsl(var(--beleza-muted-foreground))' }}
                                            >
                                                {day}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Time Slots */}
                                    {timeSlots.map((time, slotIndex) => (
                                        <div key={time} className="grid grid-cols-7 gap-1 mb-1">
                                            <div
                                                className="w-12 text-xs py-2 text-right pr-2"
                                                style={{ color: 'hsl(var(--beleza-muted-foreground))' }}
                                            >
                                                {time}
                                            </div>
                                            {weekDays.map((_, dayIndex) => {
                                                const appointment = getAppointmentForSlot(dayIndex, slotIndex);
                                                const isOccupied = isSlotOccupied(dayIndex, slotIndex);
                                                const appointmentIndex = getAppointmentIndex(dayIndex, slotIndex);
                                                const isVisible = appointmentIndex !== -1 && appointmentIndex < visibleAppointments;

                                                if (appointment && isVisible) {
                                                    return (
                                                        <div
                                                            key={dayIndex}
                                                            className="rounded-lg transition-all duration-300 animate-scale-in"
                                                            style={{
                                                                backgroundColor: appointment.color,
                                                                height: `${appointment.duration * 32 + (appointment.duration - 1) * 4}px`,
                                                                boxShadow: `0 4px 12px ${appointment.color}40`
                                                            }}
                                                        />
                                                    );
                                                } else if (!isOccupied || !isVisible) {
                                                    return (
                                                        <div
                                                            key={dayIndex}
                                                            className="h-8 rounded-lg"
                                                            style={{
                                                                backgroundColor: 'hsl(var(--beleza-background))',
                                                                border: '1px dashed hsl(var(--beleza-border))'
                                                            }}
                                                        />
                                                    );
                                                }
                                                return <div key={dayIndex} className="h-8" />;
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Content */}
                    <div className="order-1 lg:order-2 space-y-8">
                        <div
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                            style={{
                                background: 'var(--beleza-gradient-primary)',
                                color: 'white'
                            }}
                        >
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm font-medium uppercase tracking-wider">
                                Integracao Google
                            </span>
                        </div>

                        <h2
                            className="text-3xl md:text-5xl font-display font-bold leading-tight uppercase"
                            style={{ color: 'hsl(var(--beleza-foreground))' }}
                        >
                            Agenda cheia,<br />
                            <span
                                className="text-transparent bg-clip-text"
                                style={{ backgroundImage: 'var(--beleza-gradient-primary)' }}
                            >
                                sem buracos
                            </span>
                        </h2>

                        <p
                            className="text-lg leading-relaxed max-w-lg"
                            style={{ color: 'hsl(var(--beleza-muted-foreground))' }}
                        >
                            A IA encaixa os agendamentos como pecas de Tetris.
                            Cada horario livre e preenchido automaticamente,
                            maximizando seu faturamento.
                        </p>

                        <ul className="space-y-4 pt-4">
                            {[
                                'Sincronizacao em tempo real',
                                'Evita conflitos de horario',
                                'Otimiza gaps na agenda'
                            ].map((item, i) => (
                                <li
                                    key={i}
                                    className="flex items-center gap-3"
                                    style={{ color: 'hsl(var(--beleza-foreground))' }}
                                >
                                    <div
                                        className="w-6 h-6 rounded-full flex items-center justify-center"
                                        style={{ background: 'hsl(var(--beleza-primary) / 0.2)' }}
                                    >
                                        <Check
                                            className="w-3 h-3"
                                            style={{ color: 'hsl(var(--beleza-primary))' }}
                                        />
                                    </div>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes scale-in {
                    from {
                        transform: scaleY(0);
                        opacity: 0;
                    }
                    to {
                        transform: scaleY(1);
                        opacity: 1;
                    }
                }
                .animate-scale-in {
                    animation: scale-in 0.3s ease-out forwards;
                    transform-origin: top;
                }
            `}</style>
        </section>
    );
};

export default CalendarTetrisSection;
