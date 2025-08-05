import React, { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { useGoogleCalendar } from '../hooks/useGoogleCalendar'
type ViewType = 'month' | 'week' | 'day'
interface CalendarPanelProps {
    user: User
}
export function CalendarPanel({ user }: CalendarPanelProps) {
    const [accessToken, setAccessToken] = useState<string | null>(null)
    const [currentDate, setCurrentDate] = useState(new Date())
    const [viewType, setViewType] = useState<ViewType>('month')
    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            setAccessToken(session?.provider_token ?? null)
        }
        getSession()
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                setAccessToken(session?.provider_token ?? null)
            }
        )
        return () => subscription.unsubscribe()
    }, [])
    const { isLoaded, events, loading, error } = useGoogleCalendar(accessToken)
    const getEventsForDay = (targetDate: Date) => {
        if (!events) return []
        const dayStart = new Date(targetDate)
        dayStart.setHours(0, 0, 0, 0)
        const dayEnd = new Date(targetDate)
        dayEnd.setHours(23, 59, 59, 999)
        return events.filter(event => {
            let eventDate
            if (event.start.dateTime) {
                eventDate = new Date(event.start.dateTime)
            } else if (event.start.date) {
                eventDate = new Date(event.start.date)
            } else {
                return false
            }
            return eventDate >= dayStart && eventDate <= dayEnd
        }).sort((a, b) => {
            const timeA = a.start.dateTime ? new Date(a.start.dateTime) : new Date(a.start.date + 'T00:00:00')
            const timeB = b.start.dateTime ? new Date(b.start.dateTime) : new Date(b.start.date + 'T00:00:00')
            return timeA.getTime() - timeB.getTime()
        })
    }
    const generateCalendarDays = () => {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const daysInMonth = lastDay.getDate()
        const startingDayOfWeek = (firstDay.getDay() + 6) % 7 // Lunes = 0
        const days = []
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null)
        }
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(day)
        }
        while (days.length < 42) {
            days.push(null)
        }
        return days
    }
    const generateWeekDays = () => {
        const startOfWeek = new Date(currentDate)
        const day = startOfWeek.getDay()
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1) // Ajustar para que lunes sea el primer día
        startOfWeek.setDate(diff)
        const weekDays = []
        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek)
            date.setDate(startOfWeek.getDate() + i)
            weekDays.push(date)
        }
        return weekDays
    }
    const generateHours = () => {
        const hours = []
        for (let i = 0; i < 24; i++) {
            hours.push(i)
        }
        return hours
    }
    const navigate = (direction: 'prev' | 'next') => {
        setCurrentDate(prev => {
            const newDate = new Date(prev)
            switch (viewType) {
                case 'month':
                    newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1))
                    break
                case 'week':
                    newDate.setDate(prev.getDate() + (direction === 'next' ? 7 : -7))
                    break
                case 'day':
                    newDate.setDate(prev.getDate() + (direction === 'next' ? 1 : -1))
                    break
            }
            return newDate
        })
    }
    const goToToday = () => {
        setCurrentDate(new Date())
    }
    const getViewTitle = () => {
        const monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ]
        switch (viewType) {
            case 'month':
                return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
            case 'week':
                const weekDays = generateWeekDays()
                const startDay = weekDays[0].getDate()
                const endDay = weekDays[6].getDate()
                const startMonth = weekDays[0].getMonth()
                const endMonth = weekDays[6].getMonth()

                if (startMonth === endMonth) {
                    return `${startDay} - ${endDay} ${monthNames[startMonth]} ${currentDate.getFullYear()}`
                } else {
                    return `${startDay} ${monthNames[startMonth]} - ${endDay} ${monthNames[endMonth]} ${currentDate.getFullYear()}`
                }
            case 'day':
                return `${currentDate.getDate()} ${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
            default:
                return ''
        }
    }
    const today = new Date()
    const renderMonthView = () => {
        const calendarDays = generateCalendarDays()
        return (
            <div className="grid grid-cols-7 gap-1 h-full">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
                    <div key={day} className="p-2 text-center font-semibold text-primary border-b border-neutral">
                        {day}
                    </div>
                ))}
                {calendarDays.map((day, index) => {
                    if (!day) {
                        return <div key={index} className="p-2 border border-neutral bg-backgroundSecondary opacity-30"></div>
                    }
                    const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
                    const dayEvents = getEventsForDay(dayDate)
                    const isToday = today.getDate() === day &&
                        today.getMonth() === currentDate.getMonth() &&
                        today.getFullYear() === currentDate.getFullYear()
                    return (
                        <div key={index} className={`p-2 border border-neutral bg-backgroundSecondary hover:bg-primary/10 transition-colors cursor-pointer relative ${isToday ? 'ring-2 ring-primary' : ''}`}>
                            <span className={`text-sm font-medium ${isToday ? 'text-primary font-bold' : 'text-white'}`}>
                                {day}
                            </span>
                            <div className="mt-1 space-y-1">
                                {dayEvents.slice(0, 3).map((event, eventIndex) => (
                                    <div
                                        key={event.id}
                                        className="bg-primary text-white text-xs px-1 py-0.5 rounded truncate"
                                        title={`${event.summary || 'Evento sin título'}${event.start.dateTime ? ' - ' + new Date(event.start.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}`}
                                    >
                                        {event.summary || 'Evento'}
                                    </div>
                                ))}
                                {dayEvents.length > 3 && (
                                    <div className="text-xs text-gray-300 text-center">
                                        +{dayEvents.length - 3} más
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }
    const renderWeekView = () => {
        const weekDays = generateWeekDays()
        const hours = generateHours()
        return (
            <div className="h-full flex flex-col">
                <div className="grid grid-cols-8 border-b border-neutral">
                    <div className="p-2 border-r border-neutral"></div>
                    {weekDays.map((date, index) => {
                        const isToday = today.toDateString() === date.toDateString()
                        return (
                            <div key={index} className={`p-2 text-center border-r border-neutral ${isToday ? 'bg-primary/20' : ''}`}>
                                <div className="text-xs text-gray-300">
                                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][index]}
                                </div>
                                <div className={`text-sm font-medium ${isToday ? 'text-primary font-bold' : 'text-white'}`}>
                                    {date.getDate()}
                                </div>
                            </div>
                        )
                    })}
                </div>
                <div className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-8">
                        <div className="border-r border-neutral">
                            {hours.map(hour => (
                                <div key={hour} className="h-16 p-1 border-b border-neutral text-xs text-gray-300 text-right">
                                    {hour.toString().padStart(2, '0')}:00
                                </div>
                            ))}
                        </div>
                        {weekDays.map((date, dayIndex) => {
                            const dayEvents = getEventsForDay(date)
                            const isToday = today.toDateString() === date.toDateString()
                            return (
                                <div key={dayIndex} className={`border-r border-neutral ${isToday ? 'bg-primary/5' : ''}`}>
                                    {hours.map(hour => (
                                        <div key={hour} className="h-16 border-b border-neutral relative p-1">
                                            {dayEvents.filter(event => {
                                                if (event.start.dateTime) {
                                                    const eventHour = new Date(event.start.dateTime).getHours()
                                                    return eventHour === hour
                                                }
                                                return hour === 0 && event.start.date
                                            }).map(event => (
                                                <div
                                                    key={event.id}
                                                    className="bg-primary text-white text-xs px-1 py-0.5 rounded mb-1 truncate"
                                                    title={event.summary || 'Evento sin título'}
                                                >
                                                    {event.summary || 'Evento'}
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        )
    }
    const renderDayView = () => {
        const hours = generateHours()
        const dayEvents = getEventsForDay(currentDate)
        return (
            <div className="h-full flex flex-col">
                <div className="border-b border-neutral p-4">
                    <div className="text-center">
                        <div className="text-sm text-gray-300">
                            {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][currentDate.getDay()]}
                        </div>
                        <div className="text-2xl font-bold text-white">
                            {currentDate.getDate()}
                        </div>
                    </div>
                </div>
                {dayEvents.length > 0 && (
                    <div className="border-b border-neutral p-4">
                        <h4 className="text-sm font-semibold text-primary mb-2">Eventos del día</h4>
                        <div className="space-y-2">
                            {dayEvents.map(event => (
                                <div key={event.id} className="bg-primary text-white p-2 rounded">
                                    <div className="font-medium">{event.summary || 'Evento sin título'}</div>
                                    {event.start.dateTime && (
                                        <div className="text-xs opacity-75">
                                            {new Date(event.start.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            {event.end.dateTime && (
                                                ` - ${new Date(event.end.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <div className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-2">
                        <div className="border-r border-neutral">
                            {hours.map(hour => (
                                <div key={hour} className="h-16 p-2 border-b border-neutral text-sm text-gray-300">
                                    {hour.toString().padStart(2, '0')}:00
                                </div>
                            ))}
                        </div>
                        <div>
                            {hours.map(hour => (
                                <div key={hour} className="h-16 border-b border-neutral p-2">
                                    {dayEvents.filter(event => {
                                        if (event.start.dateTime) {
                                            const eventHour = new Date(event.start.dateTime).getHours()
                                            return eventHour === hour
                                        }
                                        return hour === 0 && event.start.date
                                    }).map(event => (
                                        <div
                                            key={event.id}
                                            className="bg-primary text-white text-sm px-2 py-1 rounded mb-1"
                                        >
                                            {event.summary || 'Evento'}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )
    }
    return (
        <div className="flex-1 flex flex-col bg-backgroundSecondary">
            <div className="p-6 border-b border-neutral">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-primary">Calendario</h1>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={goToToday}
                            className="px-4 py-2 border border-neutral rounded bg-backgroundPrimary text-white hover:bg-primary hover:text-background transition-colors"
                        >
                            Hoy
                        </button>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => navigate('prev')}
                                className="p-2 hover:bg-backgroundPrimary rounded transition-colors text-white"
                            >
                                ←
                            </button>
                            <span className="text-lg font-semibold text-white min-w-[200px] text-center">
                               {getViewTitle()}
                           </span>
                            <button
                                onClick={() => navigate('next')}
                                className="p-2 hover:bg-backgroundPrimary rounded transition-colors text-white"
                            >
                                →
                            </button>
                        </div>
                        <select
                            value={viewType}
                            onChange={(e) => setViewType(e.target.value as ViewType)}
                            className="border border-neutral rounded px-3 py-2 bg-backgroundPrimary text-white"
                        >
                            <option value="month">Mes</option>
                            <option value="week">Semana</option>
                            <option value="day">Día</option>
                        </select>
                    </div>
                </div>
                <div className="mt-2 flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${accessToken ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm text-gray-300">
                       {accessToken ? 'Conectado con Google Calendar' : 'Google Calendar no conectado'}
                   </span>
                    {loading && <span className="text-sm text-primary">Sincronizando...</span>}
                    {error && <span className="text-sm text-red-400">{error}</span>}
                </div>
            </div>
            <div className="flex-1 p-6">
                <div className="h-full bg-backgroundPrimary rounded-lg border border-neutral p-4">
                    {viewType === 'month' && renderMonthView()}
                    {viewType === 'week' && renderWeekView()}
                    {viewType === 'day' && renderDayView()}
                </div>
            </div>
        </div>
    )
}