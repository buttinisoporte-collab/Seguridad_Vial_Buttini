import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { PlusCircle, Trash2, Edit, Shield, Bus, MonitorSmartphone, Search, Key, Users as UsersIcon } from 'lucide-react';
import type { User, AppTab } from '../types';

interface UserManagerProps {
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    currentUser: User;
}

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

    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'operador' | 'conductor'>('all');

    const handleSave = () => {
        if (!name || !username || !pin) return alert("Complete los campos obligatorios.");
        const isAdm = role === 'admin';
        const isDriv = role === 'conductor';
        const finalTabs = isAdm ? DISPONIBLES.map(d => d.id) : (isDriv ? [] : allowedTabs);

        if (editingUser) {
            setUsers(users.map(u => u.id === editingUser.id ? { ...u, name, username, pin, isAdmin: isAdm, isDriver: isDriv, allowedTabs: finalTabs } : u));
            setEditingUser(null);
        } else {
            if (users.find(u => u.username.toLowerCase() === username.toLowerCase() && (u.isDriver === isDriv))) {
                return alert(`El ${isDriv ? 'legajo' : 'nombre de usuario'} ya existe para este rol.`);
            }
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

    const filteredUsers = users.filter(u => {
        if (filterRole === 'admin' && !u.isAdmin) return false;
        if (filterRole === 'conductor' && !u.isDriver) return false;
        if (filterRole === 'operador' && (u.isAdmin || u.isDriver)) return false;
        if (searchTerm && !u.name.toLowerCase().includes(searchTerm.toLowerCase()) && !u.username.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="flex flex-col lg:flex-row h-full w-full bg-[#111827] text-white p-6 gap-6 overflow-hidden">
            
            {/* PANEL IZQUIERDO: FORMULARIO */}
            <div className="w-full lg:w-1/3 flex flex-col bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-700 bg-gray-900/50">
                    <h2 className="text-xl font-bold text-sky-400 flex items-center gap-2"><UsersIcon size={22}/> Gestión de Usuarios</h2>
                    <p className="text-xs text-gray-400 mt-1">Cree o edite los perfiles de acceso.</p>
                </div>
                
                <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                    <h3 className="font-bold text-emerald-400 mb-5 border-b border-gray-700 pb-2 uppercase tracking-wider text-sm">
                        {editingUser ? 'Editando Perfil' : 'Nuevo Perfil'}
                    </h3>
                    
                    <div className="mb-6">
                        <label className="block text-[11px] text-gray-400 mb-2 uppercase font-bold tracking-wider">Perfil / Rol del Usuario</label>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button type="button" onClick={() => setRole('admin')} className={`flex-1 p-3 rounded-lg text-sm font-bold transition-all flex justify-center items-center gap-2 ${role === 'admin' ? 'bg-yellow-600 text-white shadow-[0_0_15px_rgba(202,138,4,0.3)] border border-yellow-500' : 'bg-gray-900 text-gray-400 border border-gray-700 hover:border-gray-500'}`}><Shield size={16}/> Admin</button>
                            <button type="button" onClick={() => setRole('operador')} className={`flex-1 p-3 rounded-lg text-sm font-bold transition-all flex justify-center items-center gap-2 ${role === 'operador' ? 'bg-sky-600 text-white shadow-[0_0_15px_rgba(2,132,199,0.3)] border border-sky-500' : 'bg-gray-900 text-gray-400 border border-gray-700 hover:border-gray-500'}`}><MonitorSmartphone size={16}/> Operador</button>
                            <button type="button" onClick={() => setRole('conductor')} className={`flex-1 p-3 rounded-lg text-sm font-bold transition-all flex justify-center items-center gap-2 ${role === 'conductor' ? 'bg-green-600 text-white shadow-[0_0_15px_rgba(22,163,74,0.3)] border border-green-500' : 'bg-gray-900 text-gray-400 border border-gray-700 hover:border-gray-500'}`}><Bus size={16}/> Conductor</button>
                        </div>
                    </div>

                    <div className="space-y-5 mb-6">
                        <div>
                            <label className="block text-[10px] uppercase text-gray-400 mb-1.5 font-bold">Nombre Completo</label>
                            <input type="text" value={name} onChange={e=>setName(e.target.value)} className="w-full bg-gray-900 text-white p-3 text-sm rounded-lg border border-gray-700 focus:border-sky-500 outline-none transition-colors" placeholder="Ej: Juan Pérez" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] uppercase text-gray-400 mb-1.5 font-bold">{role === 'conductor' ? 'N° Legajo' : 'Usuario (Login)'}</label>
                                <input type="text" value={username} onChange={e=>setUsername(e.target.value)} className="w-full bg-gray-900 text-white p-3 text-sm rounded-lg border border-gray-700 focus:border-sky-500 outline-none transition-colors" placeholder={role === 'conductor' ? 'Ej: 1234' : 'Ej: jperez'} />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase text-gray-400 mb-1.5 font-bold">Contraseña / PIN</label>
                                <input type="text" value={pin} onChange={e=>setPin(e.target.value)} className="w-full bg-gray-900 text-white p-3 text-sm rounded-lg border border-gray-700 focus:border-sky-500 outline-none transition-colors" placeholder="Ej: 1234" />
                            </div>
                        </div>
                    </div>

                    {role === 'operador' && (
                        <div className="mb-6 bg-gray-900 p-5 rounded-xl border border-gray-700">
                            <p className="text-xs text-sky-400 mb-4 font-bold uppercase tracking-wider">Módulos Permitidos para este Operador:</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {DISPONIBLES.map(tab => (
                                    <label key={tab.id} className="flex items-center space-x-3 cursor-pointer bg-gray-800 p-2.5 rounded-lg border border-gray-700 hover:border-sky-500 transition-colors">
                                        <input type="checkbox" checked={allowedTabs.includes(tab.id)} onChange={() => toggleTab(tab.id)} className="text-sky-500 w-4 h-4 rounded border-gray-600 bg-gray-900" />
                                        <span className="text-xs text-gray-200 font-bold">{tab.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-700 bg-gray-900/50 flex justify-end gap-3 flex-shrink-0">
                    {editingUser && <button onClick={resetForm} className="bg-gray-600 hover:bg-gray-500 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors">Cancelar</button>}
                    <button onClick={handleSave} className={`${role === 'conductor' ? 'bg-green-600 hover:bg-green-500' : 'bg-sky-600 hover:bg-sky-500'} text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-lg`}>
                        <PlusCircle size={18}/> {editingUser ? 'Actualizar Perfil' : 'Guardar Perfil'}
                    </button>
                </div>
            </div>

            {/* PANEL DERECHO: LISTA Y FILTROS */}
            <div className="w-full lg:w-2/3 flex flex-col bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-700 bg-gray-900/50">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
                        <h3 className="font-bold text-white uppercase tracking-wider text-sm">Directorio de Usuarios</h3>
                        <div className="flex gap-2 bg-gray-900 p-1.5 rounded-lg border border-gray-700">
                            <button onClick={() => setFilterRole('all')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${filterRole === 'all' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}>Todos</button>
                            <button onClick={() => setFilterRole('admin')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${filterRole === 'admin' ? 'bg-yellow-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>Admins</button>
                            <button onClick={() => setFilterRole('operador')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${filterRole === 'operador' ? 'bg-sky-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>Operadores</button>
                            <button onClick={() => setFilterRole('conductor')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${filterRole === 'conductor' ? 'bg-green-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>Conductores</button>
                        </div>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-4 top-3 text-gray-500" size={18} />
                        <input type="text" placeholder="Buscar por nombre o legajo/usuario..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="w-full bg-gray-900 text-white pl-12 p-3 text-sm rounded-lg border border-gray-700 focus:border-sky-500 outline-none transition-colors" />
                    </div>
                </div>

                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-3 bg-gray-800">
                    {filteredUsers.map(u => (
                        <div key={u.id} className={`bg-gray-900 p-4 rounded-xl flex flex-col xl:flex-row xl:items-center justify-between border-l-4 shadow-sm hover:bg-gray-900/80 transition-colors ${u.isAdmin ? 'border-yellow-500' : (u.isDriver ? 'border-green-500' : 'border-sky-500')}`}>
                            <div className="mb-4 xl:mb-0">
                                <p className="font-bold text-white text-base flex items-center gap-2 mb-1.5">
                                    {u.isAdmin && <Shield size={16} className="text-yellow-500"/>} 
                                    {u.isDriver && <Bus size={16} className="text-green-500"/>} 
                                    {!u.isAdmin && !u.isDriver && <MonitorSmartphone size={16} className="text-sky-500"/>} 
                                    {u.name}
                                </p>
                                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                                    <span className="bg-black px-2.5 py-1 rounded-md border border-gray-800">{u.isDriver ? 'Legajo:' : 'Usuario:'} <b className="text-gray-200">{u.username}</b></span>
                                    <span className="bg-black px-2.5 py-1 rounded-md border border-gray-800">PIN: <b className="text-gray-200">{u.pin}</b></span>
                                    {u.mustChangePassword && <span className="bg-orange-900/30 text-orange-400 px-2 py-1 rounded border border-orange-500/50 font-bold">Cambio Clave Pendiente</span>}
                                </div>
                                {!u.isAdmin && !u.isDriver && (
                                    <p className="text-[10px] text-sky-400 mt-2 font-medium">
                                        <span className="text-gray-500">Módulos:</span> {(u.allowedTabs||[]).map(t => DISPONIBLES.find(d => d.id === t)?.label || t).join(', ')}
                                    </p>
                                )}
                            </div>
                            <div className="flex gap-2 justify-end xl:flex-shrink-0">
                                <button onClick={() => handleResetPin(u.id)} className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-sky-400 border border-gray-700 px-3 py-2 rounded-lg text-xs font-bold transition-colors" title="Restablecer a 1234"><Key size={14}/> Reset Clave</button>
                                <button onClick={() => handleEdit(u)} className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-yellow-500 border border-gray-700 px-3 py-2 rounded-lg text-xs font-bold transition-colors" title="Editar Perfil"><Edit size={14}/> Editar</button>
                                {u.id !== currentUser.id && <button onClick={() => handleDelete(u.id)} className="flex items-center gap-1.5 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/30 px-3 py-2 rounded-lg text-xs font-bold transition-colors" title="Eliminar"><Trash2 size={14}/> Borrar</button>}
                            </div>
                        </div>
                    ))}
                    {filteredUsers.length === 0 && (
                        <div className="p-12 text-center flex flex-col items-center justify-center h-full">
                            <Search size={48} className="text-gray-600 mb-4" />
                            <p className="text-gray-400 text-lg font-bold">No se encontraron usuarios.</p>
                            <p className="text-gray-500 text-sm mt-2">Intente cambiar los filtros o el término de búsqueda.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};