import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para la base de datos
export interface Task {
    id: string
    user_id: string
    title: string
    description?: string
    completed: boolean
    due_date?: string
    created_at: string
    updated_at: string
}

export interface CalendarEvent {
    id: string
    user_id: string
    title: string
    description?: string
    start_date: string
    end_date: string
    all_day: boolean
    color: string
    created_at: string
    updated_at: string
}

// Funciones de autenticación
export const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            scopes: 'https://www.googleapis.com/auth/calendar.readonly',
            redirectTo: `${window.location.origin}/auth/callback`
        }
    })
    return { data, error }
}

export const signInWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    })
    return { data, error }
}

export const signUpWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password
    })
    return { data, error }
}