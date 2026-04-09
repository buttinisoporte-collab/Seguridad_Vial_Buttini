import React, { useState, useMemo } from 'react';
import type { Route } from '../types';
import { AddRouteModal } from './AddRouteModal';
import { MapPin, PlusCircle, Trash2, Link as LinkIcon, Eye, EyeOff } from 'lucide-react';

interface RouteManagerProps {
    routes: Route[]; setRoutes: React.Dispatch<React.SetStateAction<Route[]>>;
    onAddRoute: (name: string, origin: string, destination: string, group: string, line: string, service: string, kmlFile: File) => void;
    showRisks: boolean; setShowRisks: (v: boolean) => void;
    showIncidents: boolean; setShowIncidents: (v: boolean) => void;
    filterGroup: string; setFilterGroup: (v: string) => void;
    filterLine: string; setFilterLine: (v: string) => void;
    filterService: string; setFilterService: (v: string) => void;
    activeRouteId: string | null; setActiveRouteId: (v: string | null) => void;
    togglePublicRoute: (id: string) => void;
    isAdmin: boolean;
    showAllRoutes: boolean; setShowAllRoutes: (v: boolean) => void;
}

export const RouteManager: React.FC<RouteManagerProps> = ({ 
    routes, onAddRoute, setRoutes, showRisks, setShowRisks, showIncidents, setShowIncidents,
    filterGroup, setFilterGroup, filterLine, setFilterLine, filterService, setFilterService,
    activeRouteId, setActiveRouteId, togglePublicRoute, isAdmin, showAllRoutes, setShowAllRoutes
}) => {
    const[isModalOpen, setIsModalOpen] = useState(false);

    // Filtros lógicos y dependientes
    const uniqueGroups = useMemo(() => Array.from(new Set(routes.map(r => r.group))).sort(), [routes]);
    const uniqueLines = useMemo(() => Array.from(new Set(routes.filter(r => !filterGroup || r.group === filterGroup).map(r => r.line))).sort(), [routes, filterGroup]);
    
    // Los servicios dependen de la línea filtrada (si hay una)
    const uniqueServices = useMemo(() => Array.from(new Set(routes.filter(r => (!filterGroup || r.group === filterGroup) && (!filterLine || r.line === filterLine)).map(r => r.service))).sort(),[routes, filterGroup, filterLine]);

    const handleShare = (e: React.MouseEvent, route: Route) => {
        e.stopPropagation();
        togglePublicRoute(route.id);
        const url = `${window.location.origin}${window.location.pathname}?publicRoute=${route.id}`;
        if (!route.isPublic) navigator.clipboard.writeText(url).then(() => alert(`Link copiado para conductores.`));
    };

    // Orden alfabético ascendente por nombre
    const filteredRoutes = routes.filter(route => {
        return (!filterGroup || route.group === filterGroup) && (!filterLine || route.line === filterLine) && (!filterService || route.service === filterService);
    }).sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-sky-300">Recorridos</h2>
                <button onClick={() => setIsModalOpen(true)} className="bg-sky-500 hover:bg-sky-600 text-white p-2 rounded-lg transition-colors"><PlusCircle size={20} /></button>
            </div>

            <label className="flex items-center space-x-3 bg-gray-700/50 p-3 rounded-xl border border-gray-600 cursor-pointer hover:bg-gray-700 transition-all">
                <input type="checkbox" checked={showAllRoutes} onChange={(e) => setShowAllRoutes(e.target.checked)} className="w-5 h-5 rounded text-sky-500 bg-gray-900 border-gray-600 focus:ring-0" />
                <span className="text-sm font-bold text-gray-200 flex items-center gap-2">
                    {showAllRoutes ? <Eye size={16} className="text-sky-400"/> : <EyeOff size={16} className="text-gray-500"/>}
                    Visualizar trazas en mapa
                </span>
            </label>

            <div className="grid grid-cols-1 gap-2">
                <select value={filterGroup} onChange={(e) => { setFilterGroup(e.target.value); setFilterLine(''); setFilterService(''); }} className="bg-gray-800 text-white text-xs p-2 rounded border border-gray-600 outline-none focus:border-sky-500">
                    <option value="">Todos los Grupos</option>
                    {uniqueGroups.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-2">
                    <select value={filterLine} onChange={(e) => { setFilterLine(e.target.value); setFilterService(''); }} className="bg-gray-800 text-white text-xs p-2 rounded border border-gray-600 outline-none focus:border-sky-500">
                        <option value="">Línea...</option>
                        {uniqueLines.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <select value={filterService} onChange={(e) => setFilterService(e.target.value)} className="bg-gray-800 text-white text-xs p-2 rounded border border-gray-600 outline-none focus:border-sky-500">
                        <option value="">Servicio...</option>
                        {uniqueServices.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            <div className="space-y-2">
                {filteredRoutes.map(route => (
                    <div key={route.id} onClick={() => setActiveRouteId(activeRouteId === route.id ? null : route.id)} className={`p-3 rounded-lg flex justify-between items-center cursor-pointer transition-all border ${activeRouteId === route.id ? 'bg-sky-900/50 border-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.2)]' : 'bg-gray-800/40 border-transparent hover:border-gray-600'}`}>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-white text-sm truncate">{route.name}</p>
                            <p className="text-[10px] text-sky-400 font-mono uppercase">G:{route.group} L:{route.line} S:{route.service}</p>
                        </div>
                        <div className="flex gap-1 ml-2">
                            <button onClick={(e) => handleShare(e, route)} className={`p-2 rounded-md ${route.isPublic ? 'text-green-400 bg-green-900/20' : 'text-gray-500 hover:text-white'}`}><LinkIcon size={16} /></button>
                            {isAdmin && <button onClick={(e) => { e.stopPropagation(); if(window.confirm('¿Eliminar?')) setRoutes(p => p.filter(r => r.id !== route.id)); }} className="text-red-400 hover:text-red-300 p-2"><Trash2 size={16} /></button>}
                        </div>
                    </div>
                ))}
            </div>
            {isModalOpen && <AddRouteModal onClose={() => setIsModalOpen(false)} onAddRoute={onAddRoute} />}
        </div>
    );
};