import React, { useState } from 'react';
import type { Route } from '../types';
import { AddRouteModal } from './AddRouteModal';
import { MapPin, PlusCircle, Trash2 } from 'lucide-react';

interface RouteManagerProps {
    routes: Route[];
    setRoutes: React.Dispatch<React.SetStateAction<Route[]>>;
    onAddRoute: (name: string, origin: string, destination: string, group: string, line: string, service: string, kmlFile: File) => void;
    
    showRisks: boolean; setShowRisks: (v: boolean) => void;
    showIncidents: boolean; setShowIncidents: (v: boolean) => void;
    
    filterGroup: string; setFilterGroup: (v: string) => void;
    filterLine: string; setFilterLine: (v: string) => void;
    filterService: string; setFilterService: (v: string) => void;
    activeRouteId: string | null; setActiveRouteId: (v: string | null) => void;
}

export const RouteManager: React.FC<RouteManagerProps> = ({ 
    routes, onAddRoute, setRoutes,
    showRisks, setShowRisks, showIncidents, setShowIncidents,
    filterGroup, setFilterGroup, filterLine, setFilterLine, filterService, setFilterService,
    activeRouteId, setActiveRouteId
}) => {
    const[isModalOpen, setIsModalOpen] = useState(false);
    
    const deleteRoute = (id: string) => {
        if(window.confirm("¿Está seguro que desea eliminar este recorrido?")) {
            setRoutes(routes.filter(route => route.id !== id));
            if (activeRouteId === id) setActiveRouteId(null);
        }
    };

    const handleFilterChange = (setter: (v: string) => void, value: string) => {
        setter(value); setActiveRouteId(null);
    };

    const filteredRoutes = routes.filter(route => {
        return (
            (filterGroup === '' || route.group.toLowerCase().includes(filterGroup.toLowerCase())) &&
            (filterLine === '' || route.line.toLowerCase().includes(filterLine.toLowerCase())) &&
            (filterService === '' || route.service.toLowerCase().includes(filterService.toLowerCase()))
        );
    });

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-sky-300">Recorridos</h2>
                <button onClick={() => setIsModalOpen(true)} className="flex items-center bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-3 rounded-lg text-sm">
                    <PlusCircle size={18} className="mr-2" /> Nuevo
                </button>
            </div>

            <div className="bg-gray-700 p-3 rounded-lg mb-4 flex gap-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" checked={showRisks} onChange={(e) => setShowRisks(e.target.checked)} className="rounded text-sky-500 focus:ring-sky-500 bg-gray-800 border-gray-600" />
                    <span className="text-sm font-medium text-gray-200">Ver Riesgos Viales</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" checked={showIncidents} onChange={(e) => setShowIncidents(e.target.checked)} className="rounded text-red-500 focus:ring-red-500 bg-gray-800 border-gray-600" />
                    <span className="text-sm font-medium text-gray-200">Ver Siniestros</span>
                </label>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
                <input type="text" placeholder="Filtrar Grupo" value={filterGroup} onChange={(e) => handleFilterChange(setFilterGroup, e.target.value)} className="bg-gray-700 text-white text-xs p-2 rounded border border-gray-600 focus:ring-sky-500 focus:border-sky-500" />
                <input type="text" placeholder="Filtrar Línea" value={filterLine} onChange={(e) => handleFilterChange(setFilterLine, e.target.value)} className="bg-gray-700 text-white text-xs p-2 rounded border border-gray-600 focus:ring-sky-500 focus:border-sky-500" />
                <input type="text" placeholder="Filtrar Servicio" value={filterService} onChange={(e) => handleFilterChange(setFilterService, e.target.value)} className="bg-gray-700 text-white text-xs p-2 rounded border border-gray-600 focus:ring-sky-500 focus:border-sky-500" />
            </div>

            <div className="space-y-3">
                {filteredRoutes.length > 0 ? filteredRoutes.map(route => (
                    <div key={route.id} onClick={() => setActiveRouteId(activeRouteId === route.id ? null : route.id)} className={`p-3 rounded-lg flex justify-between items-center cursor-pointer transition-colors border ${activeRouteId === route.id ? 'bg-sky-900 border-sky-500' : 'bg-gray-700 border-transparent hover:bg-gray-600'}`}>
                        <div className="flex-1">
                            <p className="font-semibold text-white">{route.name}</p>
                            <div className="flex gap-2 text-[10px] text-sky-400 font-mono uppercase mb-1">
                                <span>G: {route.group}</span><span>L: {route.line}</span><span>S: {route.service}</span>
                            </div>
                            <p className="text-xs text-gray-400">{route.origin} &rarr; {route.destination}</p>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); deleteRoute(route.id); }} className="text-red-400 hover:text-red-600 p-2 ml-2"><Trash2 size={18} /></button>
                    </div>
                )) : (
                    <div className="text-center py-8 px-4 bg-gray-700 rounded-lg"><MapPin size={40} className="mx-auto text-gray-500" /><p className="mt-2 text-gray-400">No se encontraron recorridos.</p></div>
                )}
            </div>
            {isModalOpen && <AddRouteModal onClose={() => setIsModalOpen(false)} onAddRoute={onAddRoute} />}
        </div>
    );
};