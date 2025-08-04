import React, { useEffect, useState } from 'react'
import { useGoogleCalendar } from '../hooks/useGoogleCalendar'
import { supabase } from '../lib/supabase'

export default function GoogleCalendarPanel() {
    const [accessToken, setAccessToken] = useState<string | null>(null)

    // Obtener token actual de Supabase
    useEffect(() => {
        const getToken = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            setAccessToken(session?.provider_token ?? null)
        }
        getToken()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                setAccessToken(session?.provider_token ?? null)
            }
        )

        return () => subscription.unsubscribe()
    }, [])

    const { isLoaded, events, loading, error, fetchEvents } = useGoogleCalendar(accessToken)

    const handleRefresh = () => {
        if (fetchEvents) {
            fetchEvents()
        }
    }

    if (!accessToken) {
        return (
            <div className="w-96 bg-backgroundPrimary border-l border-neutral flex flex-col p-4 text-white">
                <h3 className="text-xl font-semibold mb-4">Google Calendar</h3>
                <div className="flex items-center justify-center h-32 bg-backgroundSecondary rounded-lg border border-neutral">
                    <div className="text-center">
                        <p className="text-gray-300">Inicia sesión con Google</p>
                        <p className="text-gray-400 text-sm mt-1">para ver tus eventos</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="w-96 bg-backgroundPrimary border-l border-neutral flex flex-col p-4 text-white">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Próximos Eventos</h3>
                <button
                    onClick={handleRefresh}
                    disabled={loading}
                    className="p-2 hover:bg-backgroundSecondary rounded transition-colors disabled:opacity-50"
                    title="Actualizar eventos"
                >
                    <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-900/20 border border-red-600 text-red-400 rounded text-sm">
                    {error}
                </div>
            )}

            {loading && (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            )}

            {!loading && !error && events.length === 0 && (
                <div className="flex items-center justify-center h-32 bg-backgroundSecondary rounded-lg border border-neutral">
                    <p className="text-gray-300">No hay eventos próximos</p>
                </div>
            )}

            <ul className="space-y-3 overflow-y-auto max-h-[60vh]">
                {events.map((event) => {
                    const startTime = event.start.dateTime
                        ? new Date(event.start.dateTime)
                        : event.start.date
                            ? new Date(event.start.date)
                            : null

                    return (
                        <li key={event.id} className="border border-neutral rounded-lg p-3 bg-backgroundSecondary hover:bg-backgroundSecondary/80 transition-colors">
                            <div className="font-semibold text-white truncate" title={event.summary || 'Sin título'}>
                                {event.summary || 'Sin título'}
                            </div>
                            <div className="text-sm text-gray-400 mt-1">
                                {startTime ? (
                                    <>
                                        {event.start.dateTime ? (
                                            <>
                                                {startTime.toLocaleDateString()} - {startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </>
                                        ) : (
                                            <>
                                                {startTime.toLocaleDateString()} - Todo el día
                                            </>
                                        )}
                                    </>
                                ) : (
                                    'Fecha no disponible'
                                )}
                            </div>
                            {event.description && (
                                <div className="text-xs text-gray-500 mt-2 line-clamp-2">
                                    {event.description}
                                </div>
                            )}
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}