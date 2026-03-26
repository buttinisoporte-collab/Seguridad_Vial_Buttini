import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Users, PlusCircle, Trash2, Edit, Shield } from 'lucide-react';
import type { User, AppTab } from '../types';

interface UserManagerProps {
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    currentUser: User;
}

const DISPONIBLES: { id: AppTab, label: string }[] =[
    { id: 'routes', label: 'Recorridos' },
    { id: 'riskTypes', label: 'Cargar Puntos' },
    { id: 'riskViewer', label: 'Visor de Mapa' },
    { id: 'reports', label: 'Reportes' },
    { id: 'settings', label: 'Ajustes' }
];

export const UserManager: React.FC<UserManagerProps> = ({ users, setUsers, currentUser }) => {
    const[editingUser, setEditingUser] = useState<User | null>(null);
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [pin, setPin] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [allowedTabs, setAllowedTabs] = useState<AppTab[]>(['riskTypes', 'riskViewer']);

    const handleSave = () => {
        if (!name || !username || !pin) return alert("Complete los campos obligatorios.");
        
        // Si es admin, tiene acceso a todo.
        const finalTabs = isAdmin ? DISPONIBLES.map(d => d.id) : allowedTabs;

        if (editingUser) {
            setUsers(users.map(u => u.id === editingUser.id ? { ...u, name, username, pin, isAdmin, allowedTabs: finalTabs } : u));
            setEditingUser(null);
        } else {
            if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) return alert("El nombre de usuario ya existe.");
            setUsers([...users, { id: uuidv4(), name, username, pin, isAdmin, allowedTabs: finalTabs }]);
        }
        resetForm();
    };

    const handleEdit = (user: User) => {
        setEditingUser(user); setName(user.name); setUsername(user.username); setPin(user.pin); setIsAdmin(user.isAdmin); setAllowedTabs(user.allowedTabs);
    };

    const handleDelete = (id: string) => {
        if (id === currentUser.id) return alert("No puedes eliminar tu propio usuario.");
        if (window.confirm("¿Eliminar este usuario?")) setUsers(users.filter(u => u.id !== id));
    };

    const resetForm = () => {
        setEditingUser(null); setName(''); setUsername(''); setPin(''); setIsAdmin(false); setAllowedTabs(['riskTypes', 'riskViewer']);
    };

    const toggleTab = (tabId: AppTab) => {
        if (allowedTabs.includes(tabId)) setAllowedTabs(allowedTabs.filter(t => t !== tabId));
        else setAllowedTabs([...allowedTabs, tabId]);
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-4 text-sky-300">Gestión de Usuarios</h2>
            
            {/* Formulario */}
            <div className="bg-gray-700 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-white mb-3">{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <input type="text" placeholder="Nombre completo" value={name} onChange={e=>setName(e.target.value)} className="bg-gray-800 text-white p-2 text-sm rounded border border-gray-600 focus:border-sky-500" />
                    <input type="text" placeholder="Nombre de usuario" value={username} onChange={e=>setUsername(e.target.value)} className="bg-gray-800 text-white p-2 text-sm rounded border border-gray-600 focus:border-sky-500" />
                    <input type="text" placeholder="Contraseña / PIN" value={pin} onChange={e=>setPin(e.target.value)} className="bg-gray-800 text-white p-2 text-sm rounded border border-gray-600 focus:border-sky-500" />
                    <label className="flex items-center space-x-2 bg-gray-800 p-2 rounded border border-gray-600 cursor-pointer">
                        <input type="checkbox" checked={isAdmin} onChange={e=>setIsAdmin(e.target.checked)} className="text-sky-500" />
                        <span className="text-sm text-gray-300">Es Administrador</span>
                    </label>
                </div>

                {!isAdmin && (
                    <div className="mb-4 bg-gray-800 p-3 rounded border border-gray-600">
                        <p className="text-xs text-gray-400 mb-2 font-bold uppercase">Módulos Permitidos:</p>
                        <div className="grid grid-cols-2 gap-2">
                            {DISPONIBLES.map(tab => (
                                <label key={tab.id} className="flex items-center space-x-2 cursor-pointer">
                                    <input type="checkbox" checked={allowedTabs.includes(tab.id)} onChange={() => toggleTab(tab.id)} className="text-sky-500" />
                                    <span className="text-sm text-gray-300">{tab.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-2">
                    {editingUser && <button onClick={resetForm} className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm">Cancelar</button>}
                    <button onClick={handleSave} className="bg-sky-500 hover:bg-sky-600 text-white px-3 py-2 rounded text-sm font-bold flex items-center gap-1">
                        <PlusCircle size={16}/> {editingUser ? 'Actualizar' : 'Crear Usuario'}
                    </button>
                </div>
            </div>

            {/* Lista */}
            <div className="space-y-2">
                {users.map(u => (
                    <div key={u.id} className="bg-gray-700 p-3 rounded-lg flex items-center justify-between">
                        <div>
                            <p className="font-bold text-white flex items-center gap-2">
                                {u.isAdmin && <Shield size={14} className="text-yellow-400"/>} {u.name}
                            </p>
                            <p className="text-xs text-gray-400">@{u.username} • Pass: {u.pin}</p>
                            {!u.isAdmin && <p className="text-[10px] text-sky-400 mt-1">Permisos: {u.allowedTabs.join(', ')}</p>}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => handleEdit(u)} className="text-yellow-400 hover:text-yellow-300"><Edit size={16}/></button>
                            {u.id !== currentUser.id && <button onClick={() => handleDelete(u.id)} className="text-red-400 hover:text-red-300"><Trash2 size={16}/></button>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};