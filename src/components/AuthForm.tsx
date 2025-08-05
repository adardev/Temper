import React, {useState} from 'react'

interface AuthFormProps {
    signIn: (email: string, password: string) => Promise<{ error: string | null }>
    signUp: (email: string, password: string) => Promise<{ error: string | null }>
    signInWithGoogle: () => Promise<void>
}

export function AuthForm({signIn, signUp, signInWithGoogle}: AuthFormProps) {
    const [email, setEmail] = useState<string>('')
    const [password, setPassword] = useState<string>('')
    const [isSignUp, setIsSignUp] = useState<boolean>(false)
    const [error, setError] = useState<string>('')
    const [loading, setLoading] = useState<boolean>(false)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const result = isSignUp
                ? await signUp(email, password)
                : await signIn(email, password)
            if (result.error) {
                setError(result.error)
            }
        } catch (error) {
            setError('Error inesperado')
            console.error('Form error:', error)
        } finally {
            setLoading(false)
        }
    }
    return (
        <div className="h-screen flex items-center justify-center bg-background">
            <div className="bg-backgroundPrimary p-8 rounded-lg shadow-lg w-96 border border-neutral">
                <h2 className="text-2xl font-bold text-primary mb-6 text-center">
                    {isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
                </h2>
                {error && (
                    <div className="mb-4 p-3 bg-red-900/20 border border-red-600 text-red-400 rounded">
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3 border border-neutral rounded bg-backgroundSecondary text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                        disabled={loading}
                    />
                    <input
                        type="password"
                        placeholder="Contraseña (mínimo 6 caracteres)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 border border-neutral rounded bg-backgroundSecondary text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                        minLength={6}
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-background font-semibold py-3 rounded hover:bg-secondary transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Procesando...' : (isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión')}
                    </button>
                </form>
                <div className="mt-4">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-neutral"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-backgroundPrimary text-gray-400">o</span>
                        </div>
                    </div>
                    <button
                        onClick={signInWithGoogle}
                        disabled={loading}
                        className="mt-4 w-full bg-white text-gray-900 font-semibold py-3 rounded hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center justify-center"
                    >
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Continuar con Google
                    </button>
                </div>
                <p className="mt-4 text-center text-gray-300">
                    {isSignUp ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
                    <button
                        onClick={() => {
                            setIsSignUp(!isSignUp)
                            setError('')
                        }}
                        className="ml-2 text-primary hover:text-secondary transition-colors"
                        disabled={loading}
                    >
                        {isSignUp ? 'Iniciar Sesión' : 'Crear Cuenta'}
                    </button>
                </p>
            </div>
        </div>
    )
}