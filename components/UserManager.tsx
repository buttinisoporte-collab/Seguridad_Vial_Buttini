import React, { useState } from 'react';
import { User, AppTab } from '../types';
import { UserPlus, Trash2, Shield, User as UserIcon, CheckSquare, Square, Save, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface UserManagerProps {
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    currentUser: User;
}

export const UserManager: React.FC<UserManagerProps> = ({ users, setUsers, currentUser }) => {
    const [isAddingUser, setIsAddingUser] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        pin: '',
        isAdmin: false,
        allowedTabs:['routes', 'riskTypes', 'reports', 'riskViewer', 'settings'] as AppTab[]
    });

    const resetForm = () => {
        setFormData({
            name: '',
            username: '',
            pin: '',
            isAdmin: false,
            allowedTabs:['routes', 'riskTypes', 'reports', 'riskViewer', 'settings']
        });
        setIsAddingUser(false);
        setEditingUser(null);
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            username: user.username,
            pin: user.pin,
            isAdmin: user.isAdmin,
            allowedTabs: user.allowedTabs
        });
        setIsAddingUser(true);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingUser) {
            setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...formData } : u));
        } else {
            setUsers(prev =>[...prev, { id: uuidv4(), ...formData }]);
        }
        resetForm();
    };

    const handleDelete = (id: string) => {
        if (id === currentUser.id) {
            alert("No puedes eliminarte a ti mismo.");
            return;
        }
        if (window.confirm("¿Estás seguro de eliminar este usuario?")) {
            setUsers(prev => prev.filter(u => u.id !== id));
        }
    };

    const toggleTab = (tab: AppTab) => {
        setFormData(prev => ({
            ...prev,
            allowedTabs: prev.allowedTabs.includes(tab) 
                ? prev.allowedTabs.filter(t => t !== tab) 
                : [...prev.allowedTabs, tab]
        }));
    };

    const allTabs: { id: AppTab; label: string }[] =[
        { id: 'routes', label: 'Recorridos' },
        { id: 'riskTypes', label: 'Cargar Riesgos' },
        { id: 'riskViewer', label: 'Visor de Riesgos' },
        { id: 'reports', label: 'Reportes' },
        { id: 'settings', label: 'Ajustes' }
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-sky-400 flex items-center gap-2">
                    <Shield size={24} /> Gestión de Usuarios
                </h2>
                {!isAddingUser && (
                    <button 
                        onClick={() => setIsAddingUser(true)}
                        className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all"
                    >
                        <UserPlus size={18} /> Nuevo Usuario
                    </button>
                )}
            </div>

            {isAddingUser ? (
                <form onSubmit={handleSave} className="bg-gray-700/50 p-6 rounded-xl border border-gray-600 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs text-gray-400 uppercase font-bold">Nombre Completo</label>
                            <input 
                                type="text" 
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                className="w-full bg-gray-800 border border-gray-600 p-2 rounded text-sm outline-none focus:border-sky-500"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-gray-400 uppercase font-bold">Usuario (Login)</label>
                            <input 
                                type="text" 
                                value={formData.username}
                                onChange={e => setFormData({...formData, username: e.target.value})}
                                className="w-full bg-gray-800 border border-gray-600 p-2 rounded text-sm outline-none focus:border-sky-500"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-gray-400 uppercase font-bold">PIN de Acceso</label>
                            <input 
                                type="password" 
                                value={formData.pin}
                                onChange={e => setFormData({...formData, pin: e.target.value})}
                                className="w-full bg-gray-800 border border-gray-600 p-2 rounded text-sm outline-none focus:border-sky-500"
                                required
                            />
                        </div>
                        <div className="flex items-end pb-2">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div 
                                    onClick={() => setFormData({...formData, isAdmin: !formData.isAdmin})}
                                    className={`w-10 h-5 rounded-full transition-all relative ${formData.isAdmin ? 'bg-sky-500' : 'bg-gray-600'}`}
                                >
                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.isAdmin ? 'left-6' : 'left-1'}`}></div>
                                </div>
                                <span className="text-sm font-bold">¿Es Administrador?</span>
                            </label>
                        </div>
                    </div>

                    {!formData.isAdmin && (
                        <div className="space-y-2">
                            <label className="text-xs text-gray-400 uppercase font-bold">Módulos Permitidos</label>
                            <div className="grid grid-cols-2 gap-2">
                                {allTabs.map(tab => (
                                    <div 
                                        key={tab.id}
                                        onClick={() => toggleTab(tab.id)}
                                        className="flex items-center gap-2 p-2 bg-gray-800 rounded border border-gray-600 cursor-pointer hover:bg-gray-750 transition-all"
                                    >
                                        {formData.allowedTabs.includes(tab.id) ? <CheckSquare size={18} className="text-sky-400" /> : <Square size={18} className="text-gray-500" />}
                                        <span className="text-sm">{tab.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2 pt-4">
                        <button type="submit" className="flex-1 bg-sky-600 hover:bg-sky-700 text-white py-2 rounded font-bold flex items-center justify-center gap-2">
                            <Save size={18} /> {editingUser ? 'Actualizar' : 'Guardar'}
                        </button>
                        <button type="button" onClick={resetForm} className="px-4 bg-gray-600 hover:bg-gray-500 text-white rounded font-bold flex items-center justify-center gap-2">
                            <X size={18} /> Cancelar
                        </button>
                    </div>
                </form>
            ) : (
                <div className="grid gap-4">
                    {users.map(user => (
                        <div key={user.id} className="bg-gray-700/30 p-4 rounded-xl border border-gray-600 flex justify-between items-center group hover:border-sky-500/50 transition-all">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${user.isAdmin ? 'bg-sky-500/20 text-sky-400' : 'bg-gray-600 text-gray-400'}`}>
                                    <UserIcon size={24} />
                                </div>
                                <div>
                                    <div className="font-bold flex items-center gap-2">
                                        {user.name}
                                        {user.isAdmin && <span className="text-[10px] bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded-full uppercase">Admin</span>}
                                    </div>
                                    <div className="text-xs text-gray-400">@{user.username} • {user.isAdmin ? 'Acceso Total' : `${user.allowedTabs.length} módulos`}</div>
                                </div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                <button onClick={() => handleEdit(user)} className="p-2 text-gray-400 hover:text-sky-400 hover:bg-sky-400/10 rounded-lg transition-all">
                                    <UserPlus size={18} />
                                </button>
                                <button onClick={() => handleDelete(user.id)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
