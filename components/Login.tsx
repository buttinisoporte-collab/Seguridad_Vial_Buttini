import React, { useState } from 'react';
import { User } from '../types';
import { Shield, Lock, User as UserIcon, AlertCircle } from 'lucide-react';

interface LoginProps {
    users: User[];
    onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ users, onLogin }) => {
    const [username, setUsername] = useState('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.pin === pin);
        
        if (user) {
            onLogin(user);
        } else {
            setError('Usuario o PIN incorrectos');
        }
    };

    return (
        <div className="flex h-screen w-screen items-center justify-center bg-gray-900 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="bg-sky-600 p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                        <Shield className="text-white" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Sistema Seguro</h1>
                    <p className="text-sky-100 text-sm">Gestión de Riesgos Viales</p>
                </div>
                
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}
                    
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <UserIcon size={16} /> Usuario
                        </label>
                        <input 
                            type="text" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all"
                            placeholder="Ingrese su usuario"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <Lock size={16} /> PIN de Acceso
                        </label>
                        <input 
                            type="password" 
                            value={pin} 
                            onChange={(e) => setPin(e.target.value)}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all"
                            placeholder="••••"
                            required
                        />
                    </div>

                    <button 
                        type="submit"
                        className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg shadow-lg shadow-sky-600/20 transition-all transform active:scale-[0.98]"
                    >
                        Ingresar al Sistema
                    </button>
                </form>
                
                <div className="px-8 pb-8 text-center">
                    <p className="text-xs text-gray-400 italic">
                        Acceso restringido a personal autorizado.
                    </p>
                </div>
            </div>
        </div>
    );
};
