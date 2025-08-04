import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { supabase } from './lib/supabase'
import { SessionContextProvider } from '@supabase/auth-helpers-react'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <SessionContextProvider supabaseClient={supabase}>
            <App />
        </SessionContextProvider>
    </React.StrictMode>
)
