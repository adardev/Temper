import React, { useEffect } from 'react'
import { useGoogleCalendar } from '../hooks/useGoogleCalendar'
import { supabase } from '../lib/supabase'

export default function GoogleCalendarPanel() {
    const [accessToken, setAccessToken] = React.useState<string | null>(null)

    // Obtener token actual de Supabase
    useEffect(() => {
        const getToken = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession()
            setAccessToken(session?.access_token ?? null)
        }
        getToken()
    }, [])

    const { isLoaded, events, loading, fetchEvents } = useGoogleCalendar(accessToken)

    useEffect(() => {
        if (isLoaded) fetchEvents()
    }, [isLoaded])

    if (!accessToken) {
        return <div className="p-4 text-white">Necesitas iniciar sesión para ver tu calendario.</div>
    }

    return (
        <div className="w-96 bg-backgroundPrimary border-l border-neutral flex flex-col p-4 text-white">
            <h3 className="text-xl font-semibold mb-4">Eventos de Google Calendar</h3>

            {loading && <p>Cargando eventos...</p>}

            {!loading && events.length === 0 && <p>No hay eventos próximos.</p>}

            <ul className="space-y-3 overflow-y-auto max-h-[60vh]">
                {events.map((event) => (
                    <li key={event.id} className="border border-neutral rounded p-2 bg-backgroundSecondary">
                        <div className="font-semibold">{event.summary || '(Sin título)'}</div>
                        <div className="text-sm text-gray-400">
                            {event.start.dateTime
                                ? new Date(event.start.dateTime).toLocaleString()
                                : event.start.date
                                    ? new Date(event.start.date).toLocaleDateString()
                                    : 'Fecha no disponible'}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    )
}
