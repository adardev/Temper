import React from 'react'
import { User } from '@supabase/supabase-js'

interface SidebarProps {
    sidebarOpen: boolean
    setSidebarOpen: (open: boolean) => void
    user: User
    signOut: () => Promise<void>
}

export function Sidebar({ sidebarOpen, setSidebarOpen, user, signOut }: SidebarProps) {
    return (
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
                        <h2 className="text-xl font-bold mt-2 text-primary">Temper</h2>
                        <p className="text-gray-300 text-sm">{user.email}</p>
                    </div>
                )}
            </div>

            <nav className="p-4">
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
    )
}