import React, { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, Task } from './lib/supabase'
import './styles/global.css'
import { useGoogleCalendar } from './hooks/useGoogleCalendar'

type ViewType = 'month' | 'week' | 'day'

function App() {
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(false)
    const [user, setUser] = useState<User | null>(null)
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState<boolean>(true)

    // Verificar autenticación
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
            setLoading(false)
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                console.log('Auth event:', event, session?.user?.email)
                setUser(session?.user ?? null)
            }
        )

        return () => subscription.unsubscribe()
    }, [])

    useEffect(() => {
        if (user) {
            fetchTasks()
        }
    }, [user])

    const fetchTasks = async (): Promise<void> => {
        if (!user) return

        try {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            setTasks(data || [])
        } catch (error) {
            console.error('Error fetching tasks:', error)
        }
    }

    const addTask = async (taskText: string): Promise<void> => {
        if (!user) return

        try {
            const { data, error } = await supabase
                .from('tasks')
                .insert([
                    {
                        title: taskText,
                        user_id: user.id,
                        completed: false
                    }
                ])
                .select()

            if (error) throw error
            if (data) {
                setTasks([...tasks, ...data])
            }
        } catch (error) {
            console.error('Error adding task:', error)
        }
    }

    const toggleTask = async (taskId: string, completed: boolean): Promise<void> => {
        try {
            if (completed) {
                // Si está marcada como completada, eliminarla
                const { error } = await supabase
                    .from('tasks')
                    .delete()
                    .eq('id', taskId)

                if (error) throw error

                setTasks(tasks.filter(task => task.id !== taskId))
            } else {
                // Si se desmarca, solo actualizamos completed
                const { error } = await supabase
                    .from('tasks')
                    .update({ completed })
                    .eq('id', taskId)

                if (error) throw error

                setTasks(tasks.map(task =>
                    task.id === taskId ? { ...task, completed } : task
                ))
            }
        } catch (error) {
            console.error('Error updating task:', error)
        }
    }

    const signInWithEmail = async (email: string, password: string): Promise<{ error: string | null }> => {
        try {
            console.log('Attempting to sign in with:', email)

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            })

            if (error) {
                console.error('Sign in error:', error.message)
                return { error: error.message }
            }

            console.log('Sign in successful:', data.user?.email)
            return { error: null }

        } catch (error) {
            console.error('Unexpected error:', error)
            return { error: 'Error inesperado al iniciar sesión' }
        }
    }

    const signInWithGoogle = async (): Promise<void> => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/`,
                    scopes: 'https://www.googleapis.com/auth/calendar.readonly'
                }
            })

            if (error) {
                console.error('Google sign in error:', error.message)
            }
        } catch (error) {
            console.error('Unexpected error:', error)
        }
    }

    const signUp = async (email: string, password: string): Promise<{ error: string | null }> => {
        try {
            console.log('Attempting to sign up with:', email)

            const { data, error } = await supabase.auth.signUp({
                email,
                password
            })

            if (error) {
                console.error('Sign up error:', error.message)
                return { error: error.message }
            }

            console.log('Sign up response:', data)

            if (data.user && !data.session) {
                return { error: 'Revisa tu email para confirmar tu cuenta' }
            }

            return { error: null }

        } catch (error) {
            console.error('Unexpected error:', error)
            return { error: 'Error inesperado al crear cuenta' }
        }
    }

    const signOut = async (): Promise<void> => {
        const { error } = await supabase.auth.signOut()
        if (error) console.error('Error signing out:', error)
    }

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-background">
                <div className="text-primary text-xl">Cargando...</div>
            </div>
        )
    }

    if (!user) {
        return <AuthForm signIn={signInWithEmail} signUp={signUp} signInWithGoogle={signInWithGoogle} />
    }

    return (
        <div className="h-screen flex bg-background">
            {/* Panel lateral izquierdo desplegable */}
            <div className={`bg-backgroundPrimary text-white transition-all duration-300 ${
                sidebarOpen ? 'w-64' : 'w-16'
            }`}>
                <div className="p-4 border-b border-neutral">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="text-white hover:text-primary transition-colors"
                    >
                        {sidebarOpen ? '◀' : '▶'}
                    </button>
                    {sidebarOpen && (
                        <div>
                            <h2 className="text-xl font-bold mt-2 text-primary">Mi App</h2>
                            <p className="text-gray-300 text-sm">{user.email}</p>
                        </div>
                    )}
                </div>

                <nav className="p-4">
                    <ul className="space-y-2">
                        <li>
                            <a href="#" className="flex items-center p-2 rounded hover:bg-backgroundSecondary transition-colors">
                                <span className="text-xl">🏠</span>
                                {sidebarOpen && <span className="ml-3">Inicio</span>}
                            </a>
                        </li>
                        <li>
                            <a href="#" className="flex items-center p-2 rounded hover:bg-backgroundSecondary transition-colors">
                                <span className="text-xl">✓</span>
                                {sidebarOpen && <span className="ml-3">Tareas</span>}
                            </a>
                        </li>
                        <li>
                            <a href="#" className="flex items-center p-2 rounded hover:bg-backgroundSecondary transition-colors">
                                <span className="text-xl">📅</span>
                                {sidebarOpen && <span className="ml-3">Calendario</span>}
                            </a>
                        </li>
                    </ul>

                    {sidebarOpen && (
                        <button
                            onClick={signOut}
                            className="mt-8 w-full bg-secondary hover:bg-primary px-4 py-2 rounded transition-colors"
                        >
                            Cerrar Sesión
                        </button>
                    )}
                </nav>
            </div>

            <TaskPanel tasks={tasks} addTask={addTask} toggleTask={toggleTask} />
            <CalendarPanel user={user} />
        </div>
    )
}

// Componente de autenticación
interface AuthFormProps {
    signIn: (email: string, password: string) => Promise<{ error: string | null }>
    signUp: (email: string, password: string) => Promise<{ error: string | null }>
    signInWithGoogle: () => Promise<void>
}

function AuthForm({ signIn, signUp, signInWithGoogle }: AuthFormProps) {
    const [email, setEmail] = useState<string>('')
    const [password, setPassword] = useState<string>('')
    const [isSignUp, setIsSignUp] = useState<boolean>(false)
    const [error, setError] = useState<string>('')
    const [loading, setLoading] = useState<boolean>(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        console.log('Form submitted:', { email, isSignUp })

        try {
            const result = isSignUp
                ? await signUp(email, password)
                : await signIn(email, password)

            if (result.error) {
                setError(result.error)
            }
        } catch (error) {
            setError('Error inesperado')
            console.error('Form error:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="h-screen flex items-center justify-center bg-background">
            <div className="bg-backgroundPrimary p-8 rounded-lg shadow-lg w-96 border border-neutral">
                <h2 className="text-2xl font-bold text-primary mb-6 text-center">
                    {isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
                </h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-900/20 border border-red-600 text-red-400 rounded">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3 border border-neutral rounded bg-backgroundSecondary text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                        disabled={loading}
                    />
                    <input
                        type="password"
                        placeholder="Contraseña (mínimo 6 caracteres)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 border border-neutral rounded bg-backgroundSecondary text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                        minLength={6}
                        disabled={loading}
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-background font-semibold py-3 rounded hover:bg-secondary transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Procesando...' : (isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión')}
                    </button>
                </form>

                <div className="mt-4">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-neutral"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-backgroundPrimary text-gray-400">o</span>
                        </div>
                    </div>

                    <button
                        onClick={signInWithGoogle}
                        disabled={loading}
                        className="mt-4 w-full bg-white text-gray-900 font-semibold py-3 rounded hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center justify-center"
                    >
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Continuar con Google
                    </button>
                </div>

                <p className="mt-4 text-center text-gray-300">
                    {isSignUp ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
                    <button
                        onClick={() => {
                            setIsSignUp(!isSignUp)
                            setError('')
                        }}
                        className="ml-2 text-primary hover:text-secondary transition-colors"
                        disabled={loading}
                    >
                        {isSignUp ? 'Iniciar Sesión' : 'Crear Cuenta'}
                    </button>
                </p>
            </div>
        </div>
    )
}

// Panel de tareas
interface TaskPanelProps {
    tasks: Task[]
    addTask: (taskText: string) => Promise<void>
    toggleTask: (taskId: string, completed: boolean) => Promise<void>
}

function TaskPanel({ tasks, addTask, toggleTask }: TaskPanelProps) {
    const [newTask, setNewTask] = useState<string>('')

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault()
        if (newTask.trim()) {
            addTask(newTask.trim())
            setNewTask('')
        }
    }

    return (
        <div className="w-80 bg-backgroundPrimary border-r border-neutral flex flex-col">
            <div className="p-4 border-b border-neutral">
                <h3 className="text-lg font-semibold text-primary">Tareas</h3>
                <form onSubmit={handleAddTask} className="mt-2">
                    <input
                        type="text"
                        placeholder="Nueva tarea..."
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        className="w-full p-2 border border-neutral rounded mb-2 bg-backgroundSecondary text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                        type="submit"
                        className="w-full bg-primary text-background font-semibold px-4 py-2 rounded hover:bg-secondary transition-colors"
                    >
                        + Agregar Tarea
                    </button>
                </form>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-3">
                    {tasks.map((task) => (
                        <div key={task.id} className="bg-backgroundSecondary border border-neutral rounded-lg p-3">
                            <div className="flex items-center justify-between">
                                <span className={`font-medium ${task.completed ? 'text-gray-400 line-through' : 'text-white'}`}>
                                    {task.title}
                                </span>
                                <input
                                    type="checkbox"
                                    checked={task.completed}
                                    onChange={(e) => toggleTask(task.id, e.target.checked)}
                                    className="accent-primary"
                                />
                            </div>
                            <p className="text-sm text-gray-400 mt-1">
                                {new Date(task.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    ))}
                    {tasks.length === 0 && (
                        <p className="text-gray-400 text-center py-8">No hay tareas aún</p>
                    )}
                </div>
            </div>
        </div>
    )
}

// Panel del calendario con integración de Google Calendar
interface CalendarPanelProps {
    user: User
}

function CalendarPanel({ user }: CalendarPanelProps) {
    const [accessToken, setAccessToken] = useState<string | null>(null)
    const [currentDate, setCurrentDate] = useState(new Date())
    const [viewType, setViewType] = useState<ViewType>('month')

    // Obtener token de Google
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

    // Función para obtener eventos del día específico
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

    // Generar días del mes
    const generateCalendarDays = () => {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const daysInMonth = lastDay.getDate()
        const startingDayOfWeek = (firstDay.getDay() + 6) % 7 // Lunes = 0

        const days = []

        // Días en blanco al inicio
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null)
        }

        // Días del mes
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(day)
        }

        // Completar hasta 42 días (6 semanas)
        while (days.length < 42) {
            days.push(null)
        }

        return days
    }

    // Generar días de la semana
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

    // Generar horas del día
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

    // Renderizar vista mensual
    const renderMonthView = () => {
        const calendarDays = generateCalendarDays()

        return (
            <div className="grid grid-cols-7 gap-1 h-full">
                {/* Cabeceras de días */}
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
                    <div key={day} className="p-2 text-center font-semibold text-primary border-b border-neutral">
                        {day}
                    </div>
                ))}

                {/* Días del calendario */}
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

                            {/* Mostrar eventos de Google Calendar */}
                            <div className="mt-1 space-y-1">
                                {dayEvents.slice(0, 3).map((event, eventIndex) => (
                                    <div
                                        key={event.id}
                                        className="bg-blue-600 text-white text-xs px-1 py-0.5 rounded truncate"
                                        title={`${event.summary || 'Evento sin título'}${event.start.dateTime ? ' - ' + new Date(event.start.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}`}
                                    >
                                        {event.summary || 'Evento'}
                                    </div>
                                ))}

                                {/* Indicador si hay más eventos */}
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

    // Renderizar vista semanal
    const renderWeekView = () => {
        const weekDays = generateWeekDays()
        const hours = generateHours()

        return (
            <div className="h-full flex flex-col">
                {/* Cabecera de días */}
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

                {/* Contenido de horas */}
                <div className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-8">
                        {/* Columna de horas */}
                        <div className="border-r border-neutral">
                            {hours.map(hour => (
                                <div key={hour} className="h-16 p-1 border-b border-neutral text-xs text-gray-300 text-right">
                                    {hour.toString().padStart(2, '0')}:00
                                </div>
                            ))}
                        </div>

                        {/* Columnas de días */}
                        {weekDays.map((date, dayIndex) => {
                            const dayEvents = getEventsForDay(date)
                            const isToday = today.toDateString() === date.toDateString()

                            return (
                                <div key={dayIndex} className={`border-r border-neutral ${isToday ? 'bg-primary/5' : ''}`}>
                                    {hours.map(hour => (
                                        <div key={hour} className="h-16 border-b border-neutral relative p-1">
                                            {/* Eventos en esta hora */}
                                            {dayEvents.filter(event => {
                                                if (event.start.dateTime) {
                                                    const eventHour = new Date(event.start.dateTime).getHours()
                                                    return eventHour === hour
                                                }
                                                return hour === 0 && event.start.date // Eventos de día completo
                                            }).map(event => (
                                                <div
                                                    key={event.id}
                                                    className="bg-blue-600 text-white text-xs px-1 py-0.5 rounded mb-1 truncate"
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

    // Renderizar vista diaria
    const renderDayView = () => {
        const hours = generateHours()
        const dayEvents = getEventsForDay(currentDate)

        return (
            <div className="h-full flex flex-col">
                {/* Cabecera del día */}
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

                {/* Lista de eventos del día */}
                {dayEvents.length > 0 && (
                    <div className="border-b border-neutral p-4">
                        <h4 className="text-sm font-semibold text-primary mb-2">Eventos del día</h4>
                        <div className="space-y-2">
                            {dayEvents.map(event => (
                                <div key={event.id} className="bg-blue-600 text-white p-2 rounded">
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

                {/* Contenido de horas */}
                <div className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-2">
                        {/* Columna de horas */}
                        <div className="border-r border-neutral">
                            {hours.map(hour => (
                                <div key={hour} className="h-16 p-2 border-b border-neutral text-sm text-gray-300">
                                    {hour.toString().padStart(2, '0')}:00
                                </div>
                            ))}
                        </div>

                        {/* Columna de eventos */}
                        <div>
                            {hours.map(hour => (
                                <div key={hour} className="h-16 border-b border-neutral p-2">
                                    {/* Eventos en esta hora */}
                                    {dayEvents.filter(event => {
                                        if (event.start.dateTime) {
                                            const eventHour = new Date(event.start.dateTime).getHours()
                                            return eventHour === hour
                                        }
                                        return hour === 0 && event.start.date // Eventos de día completo
                                    }).map(event => (
                                        <div
                                            key={event.id}
                                            className="bg-blue-600 text-white text-sm px-2 py-1 rounded mb-1"
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

                {/* Indicador de conexión con Google Calendar */}
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

export default App