import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import type { User } from '../types';

interface LoginProps {
    users: User[];
    onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ users, onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const foundUser = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.pin === password);
        
        if (foundUser) {
            setError('');
            onLogin(foundUser);
        } else {
            setError('Usuario o contraseña incorrectos.');
        }
    };

    return (
        <div className="flex h-screen w-screen items-center justify-center bg-gray-900">
            <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-md">
                <div className="flex flex-col items-center mb-6">
                    <ShieldCheck size={48} className="text-sky-500 mb-2" />
                    <h1 className="text-2xl font-bold text-white">Sistema de Gestión</h1>
                    <p className="text-sm text-gray-400">Riesgo Vial y Novedades</p>
                </div>
                
                {error && <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded-lg mb-4 text-sm text-center">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Usuario</label>
                        <input type="text" value={username} onChange={e=>setUsername(e.target.value)} required className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:border-sky-500 outline-none" placeholder="Ej: admin" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Contraseña</label>
                        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:border-sky-500 outline-none" placeholder="••••" />
                    </div>
                    <button type="submit" className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-4 rounded-lg transition-colors mt-2">
                        Ingresar
                    </button>
                </form>
            </div>
        </div>
    );
};