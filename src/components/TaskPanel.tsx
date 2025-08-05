import React, { useState } from 'react'
import { Task, List } from '../lib/supabase'
interface TaskPanelProps {
    tasks: Task[]
    addTask: (taskText: string, listId: string) => Promise<void>
    toggleTask: (taskId: string, completed: boolean) => Promise<void>
    selectedList: string | null
    lists: List[]
}
export function TaskPanel({ tasks, addTask, toggleTask, selectedList, lists }: TaskPanelProps) {
    const [newTask, setNewTask] = useState<string>('')
    const selectedListData = lists.find(list => list.id === selectedList)
    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault()
        if (newTask.trim() && selectedList) {
            addTask(newTask.trim(), selectedList)
            setNewTask('')
        }
    }
    if (!selectedList) {
        return (
            <div className="w-80 bg-backgroundPrimary border-r border-neutral flex flex-col items-center justify-center">
                <div className="text-center p-8">
                    <div className="text-6xl mb-4">📝</div>
                    <h3 className="text-lg font-semibold text-primary mb-2">Selecciona una lista</h3>
                    <p className="text-gray-400">Elige una lista del sidebar para ver y agregar tareas</p>
                </div>
            </div>
        )
    }
    return (
        <div className="w-80 bg-backgroundPrimary border-r border-neutral flex flex-col">
            <div className="p-4 border-b border-neutral">
                <div className="flex items-center gap-2 mb-2">
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: selectedListData?.color || '#10b981' }}
                    />
                    <h3 className="text-lg font-semibold text-primary">
                        {selectedListData?.name || 'Lista'}
                    </h3>
                </div>
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