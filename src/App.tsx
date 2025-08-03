import React from 'react';

const App: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-blue-600 text-white p-4">
                <h1 className="text-2xl font-bold">Temper App</h1>
            </header>

            <main className="container mx-auto p-4">
                <h2 className="text-xl mb-4">¡Bienvenido!</h2>
                <p>Esta es tu aplicación funcionando.</p>
            </main>

            <footer className="bg-gray-800 text-white p-4 text-center">
                <p>&copy; 2025 Temper</p>
            </footer>
        </div>
    );
};
export default App;