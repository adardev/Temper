import React, { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase, Task, Folder, List } from './lib/supabase'
import './styles/global.css'
import { Sidebar } from './components/Sidebar'
import { AuthForm } from './components/AuthForm'
import { TaskPanel } from './components/TaskPanel'
import GoogleCalendarPanel from "./components/GoogleCalendarPanel";
import { CalendarPanel } from './components/CalendarPanel'
function App() {
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(false)
    const [user, setUser] = useState<User | null>(null)
    const [folders, setFolders] = useState<Folder[]>([])
    const [lists, setLists] = useState<List[]>([])
    const [tasks, setTasks] = useState<Task[]>([])
    const [selectedList, setSelectedList] = useState<string | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
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
            fetchFolders()
            fetchLists()
            fetchTasks()
        }
    }, [user])
    const fetchFolders = async (): Promise<void> => {
        if (!user) return
        try {
            const { data, error } = await supabase
                .from('folders')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: true })
            if (error) throw error
            setFolders(data || [])
        } catch (error) {
            console.error('Error fetching folders:', error)
        }
    }
    const fetchLists = async (): Promise<void> => {
        if (!user) return
        try {
            const { data, error } = await supabase
                .from('lists')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: true })

            if (error) throw error
            setLists(data || [])
        } catch (error) {
            console.error('Error fetching lists:', error)
        }
    }
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
    const addFolder = async (folderName: string, color: string = '#6366f1'): Promise<void> => {
        if (!user) return
        try {
            const { data, error } = await supabase
                .from('folders')
                .insert([
                    {
                        name: folderName,
                        color,
                        user_id: user.id
                    }
                ])
                .select()

            if (error) throw error
            if (data) {
                setFolders([...folders, ...data])
            }
        } catch (error) {
            console.error('Error adding folder:', error)
        }
    }
    const addList = async (listName: string, folderId: string, color: string = '#10b981'): Promise<void> => {
        if (!user) return
        try {
            const { data, error } = await supabase
                .from('lists')
                .insert([
                    {
                        name: listName,
                        folder_id: folderId,
                        color,
                        user_id: user.id
                    }
                ])
                .select()
            if (error) throw error
            if (data) {
                setLists([...lists, ...data])
            }
        } catch (error) {
            console.error('Error adding list:', error)
        }
    }
    const addTask = async (taskText: string, listId: string): Promise<void> => {
        if (!user) return
        try {
            const { data, error } = await supabase
                .from('tasks')
                .insert([
                    {
                        title: taskText,
                        list_id: listId,
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
                const { error } = await supabase
                    .from('tasks')
                    .delete()
                    .eq('id', taskId)
                if (error) throw error
                setTasks(tasks.filter(task => task.id !== taskId))
            } else {
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
    const deleteFolder = async (folderId: string): Promise<void> => {
        try {
            const { error } = await supabase
                .from('folders')
                .delete()
                .eq('id', folderId)
            if (error) throw error
            setFolders(folders.filter(folder => folder.id !== folderId))
            setLists(lists.filter(list => list.folder_id !== folderId))
        } catch (error) {
            console.error('Error deleting folder:', error)
        }
    }
    const deleteList = async (listId: string): Promise<void> => {
        try {
            const { error } = await supabase
                .from('lists')
                .delete()
                .eq('id', listId)
            if (error) throw error
            setLists(lists.filter(list => list.id !== listId))
            setTasks(tasks.filter(task => task.list_id !== listId))
            if (selectedList === listId) {
                setSelectedList(null)
            }
        } catch (error) {
            console.error('Error deleting list:', error)
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
            <Sidebar
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                user={user}
                signOut={signOut}
                folders={folders}
                lists={lists}
                addFolder={addFolder}
                addList={addList}
                deleteFolder={deleteFolder}
                deleteList={deleteList}
                selectedList={selectedList}
                setSelectedList={setSelectedList}
            />
            <TaskPanel
                tasks={tasks.filter(task => selectedList ? task.list_id === selectedList : false)}
                addTask={addTask}
                toggleTask={toggleTask}
                selectedList={selectedList}
                lists={lists}
            />
            <CalendarPanel user={user}/>
            <GoogleCalendarPanel user={user} />
        </div>
    )
}
export default App