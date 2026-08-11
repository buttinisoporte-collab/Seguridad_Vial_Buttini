import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { PlusCircle, Trash2, Edit, Shield, Bus, MonitorSmartphone, Search, Key } from 'lucide-react';
import type { User, AppTab } from '../types';

interface UserManagerProps {
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    currentUser: User;
}

// LISTA ACTUALIZADA CON TODOS LOS MÓDULOS DE LA APLICACIÓN
const DISPONIBLES: { id: AppTab, label: string }[] =[
    { id: 'routes', label: 'Recorridos' },
    { id: 'riskTypes', label: 'Carga de Datos' },
    { id: 'novedades', label: 'Novedades' },
    { id: 'siniestros', label: 'Siniestros' },
    { id: 'seguimiento', label: 'Seguimiento CRM' },
    { id: 'indicadores', label: 'Indicadores' },
    { id: 'riskViewer', label: 'Mapa Riesgo' },
    { id: 'reports', label: 'Riesgo por Servicio' },
    { id: 'settings', label: 'Ajustes' }
];

export const UserManager: React.FC<UserManagerProps> = ({ users, setUsers, currentUser }) => {
    const[editingUser, setEditingUser] = useState<User | null>(null);
    const[name, setName] = useState('');
    const [username, setUsername] = useState('');
    const[pin, setPin] = useState('');
    const[role, setRole] = useState<'admin' | 'operador' | 'conductor'>('operador');
    const [allowedTabs, setAllowedTabs] = useState<AppTab[]>(['riskTypes', 'novedades', 'siniestros']);

    // Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'operador' | 'conductor'>('all');

    const handleSave = () => {
        if (!name || !username || !pin) return alert("Complete los campos obligatorios.");
        const isAdm = role === 'admin';
        const isDriv = role === 'conductor';
        // Si es admin se le dan todos los permisos, si es conductor ninguno (usa app móvil), y si es operador los seleccionados
        const finalTabs = isAdm ? DISPONIBLES.map(d => d.id) : (isDriv ? [] : allowedTabs);

        if (editingUser) {
            setUsers(users.map(u => u.id === editingUser.id ? { ...u, name, username, pin, isAdmin: isAdm, isDriver: isDriv, allowedTabs: finalTabs } : u));
            setEditingUser(null);
        } else {
            if (users.find(u => u.username.toLowerCase() === username.toLowerCase() && (u.isDriver === isDriv))) {
                return alert(`El ${isDriv ? 'legajo' : 'nombre de usuario'} ya existe para este rol.`);
            }
            // Al crear uno nuevo, forzamos mustChangePassword: true
            setUsers([...users, { id: uuidv4(), name, username, pin, isAdmin: isAdm, isDriver: isDriv, allowedTabs: finalTabs, mustChangePassword: true }]);
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
        setEditingUser(null); setName(''); setUsername(''); setPin(''); setRole('operador'); setAllowedTabs(['riskTypes', 'novedades', 'siniestros']);
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
            
            <div className="bg-gray-700 p-4 rounded-lg mb-6 shadow-md">
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
                        <input type="text" value={name} onChange={e=>setName(e.target.value)} className="w-full bg-gray-800 text-white p-2 text-sm rounded border border-gray-600 focus:border-sky-500 outline-none" placeholder="Ej: Juan Pérez" />
                    </div>
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="block text-[10px] uppercase text-gray-400 mb-1">{role === 'conductor' ? 'N° Legajo' : 'Usuario'}</label>
                            <input type="text" value={username} onChange={e=>setUsername(e.target.value)} className="w-full bg-gray-800 text-white p-2 text-sm rounded border border-gray-600 focus:border-sky-500 outline-none" placeholder={role === 'conductor' ? 'Ej: 1234' : 'Ej: jperez'} />
                        </div>
                        <div className="flex-1">
                            <label className="block text-[10px] uppercase text-gray-400 mb-1">Contraseña/PIN</label>
                            <input type="text" value={pin} onChange={e=>setPin(e.target.value)} className="w-full bg-gray-800 text-white p-2 text-sm rounded border border-gray-600 focus:border-sky-500 outline-none" placeholder="Ej: 1234" />
                        </div>
                    </div>
                </div>

                {role === 'operador' && (
                    <div className="mb-4 bg-gray-800 p-4 rounded-lg border border-gray-600">
                        <p className="text-xs text-sky-400 mb-3 font-bold uppercase">Módulos Permitidos para este Operador:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {DISPONIBLES.map(tab => (
                                <label key={tab.id} className="flex items-center space-x-2 cursor-pointer bg-gray-900 p-2 rounded border border-gray-700 hover:border-sky-500 transition-colors">
                                    <input type="checkbox" checked={allowedTabs.includes(tab.id)} onChange={() => toggleTab(tab.id)} className="text-sky-500 w-4 h-4 rounded border-gray-600" />
                                    <span className="text-sm text-gray-300 font-medium">{tab.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-3 mt-4">
                    {editingUser && <button onClick={resetForm} className="bg-gray-500 hover:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">Cancelar</button>}
                    <button onClick={handleSave} className={`${role === 'conductor' ? 'bg-green-600 hover:bg-green-500' : 'bg-sky-600 hover:bg-sky-500'} text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors`}>
                        <PlusCircle size={16}/> {editingUser ? 'Actualizar Perfil' : 'Crear Perfil'}
                    </button>
                </div>
            </div>

            {/* Filtros */}
            <div className="mb-4 space-y-3">
                <div className="flex gap-2 overflow-x-auto pb-1">
                    <button onClick={() => setFilterRole('all')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${filterRole === 'all' ? 'bg-gray-200 text-gray-800' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>Todos</button>
                    <button onClick={() => setFilterRole('admin')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${filterRole === 'admin' ? 'bg-yellow-500 text-white shadow-lg' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>Admin</button>
                    <button onClick={() => setFilterRole('operador')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${filterRole === 'operador' ? 'bg-sky-500 text-white shadow-lg' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>Operadores</button>
                    <button onClick={() => setFilterRole('conductor')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${filterRole === 'conductor' ? 'bg-green-500 text-white shadow-lg' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>Conductores</button>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    <input type="text" placeholder="Buscar por nombre o legajo/usuario..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="w-full bg-gray-800 text-white pl-10 p-2.5 text-sm rounded-lg border border-gray-600 focus:border-sky-500 outline-none shadow-inner" />
                </div>
            </div>

            {/* Lista Filtrada */}
            <div className="space-y-3 pb-10">
                {filteredUsers.map(u => (
                    <div key={u.id} className={`bg-gray-800 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between border-l-4 shadow-md ${u.isAdmin ? 'border-yellow-400' : (u.isDriver ? 'border-green-500' : 'border-sky-500')}`}>
                        <div className="mb-3 md:mb-0">
                            <p className="font-bold text-white text-base flex items-center gap-2 mb-1">
                                {u.isAdmin && <Shield size={16} className="text-yellow-400"/>} 
                                {u.isDriver && <Bus size={16} className="text-green-500"/>} 
                                {!u.isAdmin && !u.isDriver && <MonitorSmartphone size={16} className="text-sky-400"/>} 
                                {u.name}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-gray-400">
                                <span>{u.isDriver ? 'Legajo:' : 'Usuario:'} <b className="text-gray-200">{u.username}</b></span>
                                <span className="bg-gray-700 px-2 py-0.5 rounded text-gray-300">PIN: {u.pin}</span>
                            </div>
                            {!u.isAdmin && !u.isDriver && (
                                <p className="text-[10px] text-sky-300 mt-2 font-medium">
                                    Módulos: {(u.allowedTabs||[]).map(t => DISPONIBLES.find(d => d.id === t)?.label || t).join(', ')}
                                </p>
                            )}
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => handleResetPin(u.id)} className="flex items-center gap-1 bg-gray-700 hover:bg-gray-600 text-sky-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors" title="Resetear Clave"><Key size={14}/> Resetear</button>
                            <button onClick={() => handleEdit(u)} className="flex items-center gap-1 bg-gray-700 hover:bg-gray-600 text-yellow-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors" title="Editar"><Edit size={14}/> Editar</button>
                            {u.id !== currentUser.id && <button onClick={() => handleDelete(u.id)} className="flex items-center gap-1 bg-red-900/30 hover:bg-red-900/50 text-red-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors" title="Eliminar"><Trash2 size={14}/> Borrar</button>}
                        </div>
                    </div>
                ))}
                {filteredUsers.length === 0 && (
                    <div className="bg-gray-800 p-8 rounded-xl text-center border border-gray-700">
                        <Search size={32} className="mx-auto text-gray-500 mb-3" />
                        <p className="text-gray-400 text-sm font-bold">No se encontraron usuarios.</p>
                        <p className="text-gray-500 text-xs mt-1">Pruebe cambiando el filtro de búsqueda o de rol.</p>
                    </div>
                )}
            </div>
        </div>
    );
};