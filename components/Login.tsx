import React, { useState } from 'react';
import { ShieldCheck, Bus } from 'lucide-react';
import type { User } from '../types';

// 👇 REEMPLAZA ESTA CADENA CON EL BASE64 REAL DE TU LOGO 👇
const LOGO_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

interface LoginProps {
    users: User[];
    onLogin: (user: User) => void;
    isDriverMode?: boolean;
}

export const Login: React.FC<LoginProps> = ({ users, onLogin, isDriverMode }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const foundUser = users.find(u => 
            u.username.toLowerCase() === username.toLowerCase() && 
            u.pin === password &&
            (isDriverMode ? u.isDriver : !u.isDriver)
        );
        
        if (foundUser) {
            setError('');
            onLogin(foundUser);
        } else {
            setError(isDriverMode 
                ? 'Legajo o contraseña incorrectos, o usuario sin perfil de Conductor.' 
                : 'Usuario o contraseña incorrectos, o no tiene perfil de Operador/Admin.');
        }
    };

    return (
        <div className="flex h-screen w-screen items-center justify-center bg-gray-900">
            <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-md m-4">
                <div className="flex flex-col items-center mb-6 text-center">
                    
                    {/* 👇 IMAGEN CARGADA COMO BASE64 👇 */}
                    <img 
                        src={LOGO_BASE64} 
                        alt="Logo Empresa" 
                        className="h-24 w-auto mb-4 object-contain drop-shadow-lg" 
                        onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                    />
                    
                    <h1 className="text-2xl font-bold text-white">
                        {isDriverMode ? 'Módulo Conductor' : 'Sistema de Gestión'}
                    </h1>
                    <p className="text-sm text-gray-400">
                        {isDriverMode ? 'Reporte de Novedades en Ruta (IRAM 3810)' : 'Riesgo Vial y Novedades'}
                    </p>
                </div>
                
                {error && <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded-lg mb-4 text-sm text-center">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                            {isDriverMode ? 'Número de Legajo' : 'Usuario'}
                        </label>
                        <input type="text" value={username} onChange={e=>setUsername(e.target.value)} required className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:border-sky-500 outline-none" placeholder={isDriverMode ? "Ej: 1234" : "Ej: admin"} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Contraseña / PIN</label>
                        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:border-sky-500 outline-none" placeholder="••••" />
                    </div>
                    <button type="submit" className={`w-full text-white font-bold py-3 px-4 rounded-lg transition-colors mt-2 ${isDriverMode ? 'bg-green-600 hover:bg-green-500' : 'bg-sky-600 hover:bg-sky-500'}`}>
                        Ingresar
                    </button>
                </form>
            </div>
        </div>
    );
};