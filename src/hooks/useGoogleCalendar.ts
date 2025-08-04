import { useState, useEffect } from 'react'
import { gapi } from 'gapi-script'

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

    useEffect(() => {
        if (!accessToken) return

        gapi.load('client', async () => {
            try {
                await gapi.client.init({
                    discoveryDocs: [DISCOVERY_DOC],
                })

                gapi.client.setToken({ access_token: accessToken })

                setIsLoaded(true)
            } catch (error) {
                console.error('Error initializing Google API', error)
            }
        })
    }, [accessToken])

    const fetchEvents = async () => {
        if (!isLoaded) return

        setLoading(true)
        try {
            const response = await gapi.client.calendar.events.list({
                calendarId: 'primary',
                timeMin: new Date().toISOString(),
                showDeleted: false,
                singleEvents: true,
                maxResults: 20,
                orderBy: 'startTime',
            })

            setEvents(response.result.items || [])
        } catch (error) {
            console.error('Error fetching events:', error)
        } finally {
            setLoading(false)
        }
    }

    return { isLoaded, events, loading, fetchEvents }
}
