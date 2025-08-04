import { useState, useEffect } from 'react'

// Declarar gapi como variable global
declare global {
    interface Window {
        gapi: any
    }
}

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'

export interface GoogleCalendarEvent {
    id: string
    summary: string
    description?: string
    start: { dateTime?: string; date?: string }
    end: { dateTime?: string; date?: string }
    colorId?: string
}

export function useGoogleCalendar(accessToken: string | null) {
    const [isLoaded, setIsLoaded] = useState(false)
    const [events, setEvents] = useState<GoogleCalendarEvent[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!accessToken) {
            setIsLoaded(false)
            setEvents([])
            setError(null)
            return
        }

        // Cargar gapi script si no está disponible
        if (!window.gapi) {
            const script = document.createElement('script')
            script.src = 'https://apis.google.com/js/api.js'
            script.onload = initializeGapi
            script.onerror = () => {
                setError('Error cargando Google API')
                setIsLoaded(false)
            }
            document.body.appendChild(script)
        } else {
            initializeGapi()
        }

        function initializeGapi() {
            window.gapi.load('client', async () => {
                try {
                    await window.gapi.client.init({
                        discoveryDocs: [DISCOVERY_DOC],
                    })

                    window.gapi.client.setToken({ access_token: accessToken })
                    setIsLoaded(true)
                    setError(null)
                } catch (error) {
                    console.error('Error initializing Google API', error)
                    setError('Error conectando con Google Calendar')
                    setIsLoaded(false)
                }
            })
        }
    }, [accessToken])

    const fetchEvents = async () => {
        if (!isLoaded || !window.gapi) return

        setLoading(true)
        setError(null)

        try {
            const now = new Date()
            const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

            const response = await window.gapi.client.calendar.events.list({
                calendarId: 'primary',
                timeMin: now.toISOString(),
                timeMax: oneMonthFromNow.toISOString(),
                showDeleted: false,
                singleEvents: true,
                maxResults: 100,
                orderBy: 'startTime',
            })

            const fetchedEvents = response.result.items || []
            setEvents(fetchedEvents)
            console.log('Eventos obtenidos:', fetchedEvents.length)
        } catch (error: any) {
            console.error('Error fetching events:', error)
            if (error.status === 401) {
                setError('Token de autenticación expirado')
            } else if (error.status === 403) {
                setError('Sin permisos para acceder al calendario')
            } else {
                setError('Error obteniendo eventos del calendario')
            }
            setEvents([])
        } finally {
            setLoading(false)
        }
    }

    // Auto-fetch events cuando se carga la API
    useEffect(() => {
        if (isLoaded) {
            fetchEvents()
        }
    }, [isLoaded])

    return { isLoaded, events, loading, error, fetchEvents }
}