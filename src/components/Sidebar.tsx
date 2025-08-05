import React, { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { Folder, List } from '../lib/supabase'
interface SidebarProps {
    sidebarOpen: boolean
    setSidebarOpen: (open: boolean) => void
    user: User
    signOut: () => Promise<void>
    folders: Folder[]
    lists: List[]
    addFolder: (name: string, color?: string) => Promise<void>
    addList: (name: string, folderId: string, color?: string) => Promise<void>
    deleteFolder: (folderId: string) => Promise<void>
    deleteList: (listId: string) => Promise<void>
    selectedList: string | null
    setSelectedList: (listId: string | null) => void
}
export function Sidebar({
                            sidebarOpen,
                            setSidebarOpen,
                            user,
                            signOut,
                            folders,
                            lists,
                            addFolder,
                            addList,
                            deleteFolder,
                            deleteList,
                            selectedList,
                            setSelectedList
                        }: SidebarProps) {
    const [newFolderName, setNewFolderName] = useState('')
    const [newListName, setNewListName] = useState('')
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
    const [showFolderForm, setShowFolderForm] = useState(false)
    const [showListForm, setShowListForm] = useState<string | null>(null)
    const toggleFolder = (folderId: string) => {
        const newExpanded = new Set(expandedFolders)
        if (newExpanded.has(folderId)) {
            newExpanded.delete(folderId)
        } else {
            newExpanded.add(folderId)
        }
        setExpandedFolders(newExpanded)
    }
    const handleAddFolder = async (e: React.FormEvent) => {
        e.preventDefault()
        if (newFolderName.trim()) {
            try {
                await addFolder(newFolderName.trim())
                setNewFolderName('')
                setShowFolderForm(false)
            } catch (error) {
                console.error('Error creating folder:', error)
            }
        }
    }
    const handleAddList = async (e: React.FormEvent, folderId: string) => {
        e.preventDefault()
        if (newListName.trim()) {
            try {
                await addList(newListName.trim(), folderId)
                setNewListName('')
                setShowListForm(null)
                console.log('List created successfully') // Debug
            } catch (error) {
                console.error('Error creating list:', error)
            }
        }
    }
    const getListsForFolder = (folderId: string) => {
        return lists.filter(list => list.folder_id === folderId)
    }
    return (
        <>
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
            <div className={`
                fixed lg:static inset-y-0 left-0 z-50
                w-64 bg-backgroundSecondary border-r border-neutral
                transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0 transition-transform duration-200 ease-in-out
                flex flex-col
            `}>
                <div className="p-4 border-b border-neutral">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-primary">TaskManager</h2>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden text-gray-400 hover:text-white"
                        >
                            ✕
                        </button>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{user.email}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                            Organización
                        </h3>
                        <button
                            onClick={() => {
                                setShowFolderForm(true)
                            }}
                            className="text-primary hover:text-secondary text-sm font-medium px-2 py-1 rounded hover:bg-primary/10 transition-colors"
                            title="Agregar carpeta"
                        >
                            + Carpeta
                        </button>
                    </div>
                    {showFolderForm && (
                        <div className="mb-4 p-3 bg-backgroundPrimary rounded-lg border border-neutral">
                            <form onSubmit={handleAddFolder}>
                                <input
                                    type="text"
                                    placeholder="Nombre de la carpeta..."
                                    value={newFolderName}
                                    onChange={(e) => {
                                        console.log('Folder name input:', e.target.value) // Debug
                                        setNewFolderName(e.target.value)
                                    }}
                                    className="w-full p-2 text-sm border border-neutral rounded bg-backgroundSecondary text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary mb-2"
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        className="px-3 py-1 bg-primary text-background text-sm rounded hover:bg-secondary transition-colors"
                                    >
                                        Crear
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowFolderForm(false)
                                            setNewFolderName('')
                                        }}
                                        className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                    <div className="mb-2 text-xs text-gray-500">
                        Carpetas: {folders.length} | Listas: {lists.length}
                    </div>
                    <div className="space-y-2">
                        {folders.map((folder) => (
                            <div key={folder.id} className="border border-neutral rounded-lg overflow-hidden">
                                <div className="flex items-center justify-between p-3 bg-backgroundPrimary hover:bg-gray-700/50 transition-colors group">
                                    <div
                                        className="flex items-center gap-2 flex-1 cursor-pointer"
                                        onClick={() => toggleFolder(folder.id)}
                                    >
                                        <div
                                            className="w-3 h-3 rounded"
                                            style={{ backgroundColor: folder.color }}
                                        />
                                        <span className="text-white font-medium">{folder.name}</span>
                                        <span className="text-xs text-gray-400">
                                            ({getListsForFolder(folder.id).length})
                                        </span>
                                        <span className={`ml-auto transition-transform ${expandedFolders.has(folder.id) ? 'rotate-90' : ''}`}>
                                            ▶
                                        </span>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            if (window.confirm('¿Estás seguro de que quieres eliminar esta carpeta? Se eliminarán todas las listas y tareas dentro de ella.')) {
                                                deleteFolder(folder.id)
                                            }
                                        }}
                                        className="text-red-400 hover:text-red-300 text-sm ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Eliminar carpeta"
                                    >
                                        🗑
                                    </button>
                                </div>
                                {expandedFolders.has(folder.id) && (
                                    <div className="bg-backgroundSecondary">
                                        <div className="p-2 border-b border-neutral">
                                            <button
                                                onClick={() => setShowListForm(folder.id)}
                                                className="w-full text-left text-sm text-primary hover:text-secondary px-2 py-1 rounded hover:bg-primary/10 transition-colors"
                                            >
                                                + Agregar lista
                                            </button>
                                        </div>
                                        {showListForm === folder.id && (
                                            <div className="p-3 border-b border-neutral">
                                                <form onSubmit={(e) => handleAddList(e, folder.id)}>
                                                    <input
                                                        type="text"
                                                        placeholder="Nombre de la lista..."
                                                        value={newListName}
                                                        onChange={(e) => setNewListName(e.target.value)}
                                                        className="w-full p-2 text-sm border border-neutral rounded bg-background text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary mb-2"
                                                        autoFocus
                                                    />
                                                    <div className="flex gap-2">
                                                        <button
                                                            type="submit"
                                                            className="px-3 py-1 bg-primary text-background text-sm rounded hover:bg-secondary transition-colors"
                                                        >
                                                            Crear
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setShowListForm(null)
                                                                setNewListName('')
                                                            }}
                                                            className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                                                        >
                                                            Cancelar
                                                        </button>
                                                    </div>
                                                </form>
                                            </div>
                                        )}
                                        {getListsForFolder(folder.id).map((list) => (
                                            <div
                                                key={list.id}
                                                className={`flex items-center justify-between p-3 cursor-pointer hover:bg-gray-700/30 transition-colors group ${
                                                    selectedList === list.id ? 'bg-primary/20 border-l-2 border-l-primary' : ''
                                                }`}
                                                onClick={() => setSelectedList(list.id)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-2 h-2 rounded-full"
                                                        style={{ backgroundColor: list.color }}
                                                    />
                                                    <span className="text-white text-sm">{list.name}</span>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        if (window.confirm('¿Estás seguro de que quieres eliminar esta lista? Se eliminarán todas las tareas dentro de ella.')) {
                                                            deleteList(list.id)
                                                        }
                                                    }}
                                                    className="text-red-400 hover:text-red-300 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Eliminar lista"
                                                >
                                                    🗑
                                                </button>
                                            </div>
                                        ))}
                                        {getListsForFolder(folder.id).length === 0 && showListForm !== folder.id && (
                                            <div className="p-3 text-center text-gray-400 text-sm">
                                                No hay listas en esta carpeta
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                        {folders.length === 0 && !showFolderForm && (
                            <div className="text-center py-8">
                                <div className="text-4xl mb-2">📁</div>
                                <p className="text-gray-400 text-sm">No hay carpetas aún</p>
                                <p className="text-gray-500 text-xs mt-1">Crea una carpeta para organizar tus listas</p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="p-4 border-t border-neutral">
                    <button
                        onClick={signOut}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded transition-colors"
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </div>
            <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-30 bg-primary text-background p-2 rounded-md shadow-lg"
            >
                ☰
            </button>
        </>
    )
}