import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { PlusCircle, Trash2, Edit, Shield, Bus, MonitorSmartphone, Search, Key } from 'lucide-react';
import type { User, AppTab } from '../types';

interface UserManagerProps {
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    currentUser: User;
}

const DISPONIBLES: { id: AppTab, label: string }[] =[
    { id: 'routes', label: 'Recorridos' },
    { id: 'riskTypes', label: 'Cargar Puntos' },
    { id: 'riskViewer', label: 'Visor Mapa' },
    { id: 'novedades', label: 'Novedades (Lista)' },
    { id: 'reports', label: 'Reportes' },
    { id: 'settings', label: 'Ajustes' }
];

export const UserManager: React.FC<UserManagerProps> = ({ users, setUsers, currentUser }) => {
    const[editingUser, setEditingUser] = useState<User | null>(null);
    const[name, setName] = useState('');
    const [username, setUsername] = useState('');
    const[pin, setPin] = useState('');
    const[role, setRole] = useState<'admin' | 'operador' | 'conductor'>('operador');
    const [allowedTabs, setAllowedTabs] = useState<AppTab[]>(['riskTypes', 'riskViewer', 'novedades']);

    // Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'operador' | 'conductor'>('all');

    const handleSave = () => {
        if (!name || !username || !pin) return alert("Complete los campos obligatorios.");
        const isAdm = role === 'admin';
        const isDriv = role === 'conductor';
        const finalTabs = isAdm ? DISPONIBLES.map(d => d.id) : (isDriv ?[] : allowedTabs);

        if (editingUser) {
            setUsers(users.map(u => u.id === editingUser.id ? { ...u, name, username, pin, isAdmin: isAdm, isDriver: isDriv, allowedTabs: finalTabs } : u));
            setEditingUser(null);
        } else {
            if (users.find(u => u.username.toLowerCase() === username.toLowerCase() && (u.isDriver === isDriv))) {
                return alert(`El ${isDriv ? 'legajo' : 'nombre de usuario'} ya existe para este rol.`);
            }
            setUsers([...users, { id: uuidv4(), name, username, pin, isAdmin: isAdm, isDriver: isDriv, allowedTabs: finalTabs, mustChangePassword: true  }]);
        }
        resetForm();
    };

    const handleEdit = (user: User) => {
        setEditingUser(user); setName(user.name); setUsername(user.username); setPin(user.pin); setAllowedTabs(user.allowedTabs ||[]);
        setRole(user.isAdmin ? 'admin' : (user.isDriver ? 'conductor' : 'operador'));
    };

    const handleDelete = (id: string) => {
        if (id === currentUser.id) return alert("No puedes eliminar tu propio usuario.");
        if (window.confirm("¿Eliminar este usuario?")) setUsers(users.filter(u => u.id !== id));
    };
    const handleResetPin = (id: string) => {
        if (window.confirm("¿Restablecer contraseña a '1234'? El usuario deberá cambiarla obligatoriamente al ingresar.")) {
            setUsers(users.map(u => u.id === id ? { ...u, pin: '1234', mustChangePassword: true } : u));
        }
    };

    const resetForm = () => {
        setEditingUser(null); setName(''); setUsername(''); setPin(''); setRole('operador'); setAllowedTabs(['riskTypes', 'riskViewer', 'novedades']);
    };

    const toggleTab = (tabId: AppTab) => {
        if (allowedTabs.includes(tabId)) setAllowedTabs(allowedTabs.filter(t => t !== tabId));
        else setAllowedTabs([...allowedTabs, tabId]);
    };

    // Filtrar lista
    const filteredUsers = users.filter(u => {
        if (filterRole === 'admin' && !u.isAdmin) return false;
        if (filterRole === 'conductor' && !u.isDriver) return false;
        if (filterRole === 'operador' && (u.isAdmin || u.isDriver)) return false;
        if (searchTerm && !u.name.toLowerCase().includes(searchTerm.toLowerCase()) && !u.username.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    return (
        <div>
            <h2 className="text-xl font-bold mb-4 text-sky-300">Gestión de Usuarios</h2>
            
            {/* Formulario arreglado (flex-col para no desbordar) */}
            <div className="bg-gray-700 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-white mb-3">{editingUser ? 'Editar Perfil' : 'Nuevo Perfil'}</h3>
                
                <div className="mb-4">
                    <label className="block text-xs text-gray-400 mb-1 uppercase font-bold">Perfil / Rol</label>
                    <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => setRole('admin')} className={`flex-1 min-w-[100px] p-2 rounded text-sm font-bold transition-colors flex justify-center items-center gap-1 ${role === 'admin' ? 'bg-sky-600 text-white' : 'bg-gray-800 text-gray-400 border border-gray-600'}`}><Shield size={14}/> Admin</button>
                        <button type="button" onClick={() => setRole('operador')} className={`flex-1 min-w-[100px] p-2 rounded text-sm font-bold transition-colors flex justify-center items-center gap-1 ${role === 'operador' ? 'bg-sky-600 text-white' : 'bg-gray-800 text-gray-400 border border-gray-600'}`}><MonitorSmartphone size={14}/> Operador</button>
                        <button type="button" onClick={() => setRole('conductor')} className={`flex-1 min-w-[100px] p-2 rounded text-sm font-bold transition-colors flex justify-center items-center gap-1 ${role === 'conductor' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 border border-gray-600'}`}><Bus size={14}/> Conductor</button>
                    </div>
                </div>

                <div className="flex flex-col gap-3 mb-3">
                    <div>
                        <label className="block text-[10px] uppercase text-gray-400 mb-1">Nombre Completo</label>
                        <input type="text" value={name} onChange={e=>setName(e.target.value)} className="w-full bg-gray-800 text-white p-2 text-sm rounded border border-gray-600 focus:border-sky-500 outline-none" />
                    </div>
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="block text-[10px] uppercase text-gray-400 mb-1">{role === 'conductor' ? 'N° Legajo' : 'Usuario'}</label>
                            <input type="text" value={username} onChange={e=>setUsername(e.target.value)} className="w-full bg-gray-800 text-white p-2 text-sm rounded border border-gray-600 focus:border-sky-500 outline-none" />
                        </div>
                        <div className="flex-1">
                            <label className="block text-[10px] uppercase text-gray-400 mb-1">Contraseña/PIN</label>
                            <input type="text" value={pin} onChange={e=>setPin(e.target.value)} className="w-full bg-gray-800 text-white p-2 text-sm rounded border border-gray-600 focus:border-sky-500 outline-none" />
                        </div>
                    </div>
                </div>

                {role === 'operador' && (
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

                <div className="flex justify-end gap-2 mt-4">
                    {editingUser && <button onClick={resetForm} className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm">Cancelar</button>}
                    <button onClick={handleSave} className={`${role === 'conductor' ? 'bg-green-600 hover:bg-green-500' : 'bg-sky-500 hover:bg-sky-600'} text-white px-3 py-2 rounded text-sm font-bold flex items-center gap-1`}>
                        <PlusCircle size={16}/> {editingUser ? 'Actualizar' : 'Crear Perfil'}
                    </button>
                </div>
            </div>

            {/* Filtros */}
            <div className="mb-4 space-y-2">
                <div className="flex gap-2 overflow-x-auto pb-1">
                    <button onClick={() => setFilterRole('all')} className={`px-3 py-1 rounded-full text-xs font-bold ${filterRole === 'all' ? 'bg-gray-200 text-gray-800' : 'bg-gray-700 text-gray-300'}`}>Todos</button>
                    <button onClick={() => setFilterRole('admin')} className={`px-3 py-1 rounded-full text-xs font-bold ${filterRole === 'admin' ? 'bg-yellow-500 text-white' : 'bg-gray-700 text-gray-300'}`}>Admin</button>
                    <button onClick={() => setFilterRole('operador')} className={`px-3 py-1 rounded-full text-xs font-bold ${filterRole === 'operador' ? 'bg-sky-500 text-white' : 'bg-gray-700 text-gray-300'}`}>Operadores</button>
                    <button onClick={() => setFilterRole('conductor')} className={`px-3 py-1 rounded-full text-xs font-bold ${filterRole === 'conductor' ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-300'}`}>Conductores</button>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    <input type="text" placeholder="Buscar por nombre o legajo..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="w-full bg-gray-700 text-white pl-9 p-2 text-sm rounded border border-gray-600 focus:border-sky-500 outline-none" />
                </div>
            </div>

            {/* Lista Filtrada */}
            <div className="space-y-2">
                {filteredUsers.map(u => (
                    <div key={u.id} className={`bg-gray-700 p-3 rounded-lg flex items-center justify-between border-l-4 ${u.isAdmin ? 'border-yellow-400' : (u.isDriver ? 'border-green-500' : 'border-sky-500')}`}>
                        <div>
                            <p className="font-bold text-white flex items-center gap-2">
                                {u.isAdmin && <Shield size={14} className="text-yellow-400"/>} 
                                {u.isDriver && <Bus size={14} className="text-green-500"/>} 
                                {!u.isAdmin && !u.isDriver && <MonitorSmartphone size={14} className="text-sky-400"/>} 
                                {u.name}
                            </p>
                            <p className="text-xs text-gray-400">{u.isDriver ? 'Legajo:' : 'Usuario:'} <b>{u.username}</b> • PIN: {u.pin}</p>
                            {!u.isAdmin && !u.isDriver && <p className="text-[10px] text-gray-500 mt-1">Permisos: {(u.allowedTabs||[]).join(', ')}</p>}
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => handleResetPin(u.id)} className="text-sky-400 hover:text-sky-300" title="Resetear Clave"><Key size={16}/></button>
                            <button onClick={() => handleEdit(u)} className="text-yellow-400 hover:text-yellow-300" title="Editar"><Edit size={16}/></button>
                            {u.id !== currentUser.id && <button onClick={() => handleDelete(u.id)} className="text-red-400 hover:text-red-300" title="Eliminar"><Trash2 size={16}/></button>}
                        </div>
                    </div>
                ))}
                {filteredUsers.length === 0 && <p className="text-center text-gray-500 text-sm mt-4">No se encontraron usuarios.</p>}
            </div>
        </div>
    );
};