import React, { useMemo } from 'react';
import type { RiskType, Risk, Route } from '../types';
import { Layers } from 'lucide-react';

interface RiskViewerProps {
    riskTypes: RiskType[];
    risks: Risk[];
    routes: Route[];
    selectedTypes: string[];
    setSelectedTypes: React.Dispatch<React.SetStateAction<string[]>>;
}

// AQUÍ ESTÁ LA EXPORTACIÓN QUE VERCEL NO ENCONTRABA 👇
export const RiskViewer: React.FC<RiskViewerProps> = ({ riskTypes, risks, routes, selectedTypes, setSelectedTypes }) => {
    
    const handleToggle = (id: string) => {
        if (selectedTypes.includes(id)) {
            setSelectedTypes(selectedTypes.filter(t => t !== id));
        } else {
            setSelectedTypes([...selectedTypes, id]);
        }
    };

    // Computar las rutas afectadas en base a los riesgos visibles (Blindado)
    const affectedRoutes = useMemo(() => {
        if (!Array.isArray(selectedTypes) || selectedTypes.length === 0) return[];
        const affectedIds = new Set<string>();
        
        if (Array.isArray(risks)) {
            risks.forEach(risk => {
                if (selectedTypes.includes(risk.riskTypeId) && Array.isArray(risk.associatedRouteIds)) {
                    risk.associatedRouteIds.forEach(id => affectedIds.add(id));
                }
            });
        }
        
        return Array.isArray(routes) ? routes.filter(r => affectedIds.has(r.id)) :[];
    }, [risks, routes, selectedTypes]);

    return (
        <div className="flex flex-col h-full">
            <h2 className="text-xl font-bold mb-4 text-sky-300">Visor de Riesgos Globales</h2>
            <p className="text-xs text-gray-400 mb-4">Seleccione las categorías que desea aislar en el mapa para ver su impacto cruzado.</p>
            
            <div className="bg-gray-700 p-3 rounded-lg mb-4">
                <h3 className="text-sm font-semibold text-white mb-2 border-b border-gray-600 pb-1">Categorías</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {Array.isArray(riskTypes) && riskTypes.map(rt => (
                        <label key={rt.id} className="flex items-center space-x-3 cursor-pointer p-1 rounded hover:bg-gray-600 transition-colors">
                            <input 
                                type="checkbox" 
                                checked={Array.isArray(selectedTypes) && selectedTypes.includes(rt.id)} 
                                onChange={() => handleToggle(rt.id)} 
                                className="rounded border-gray-500 focus:ring-sky-500 w-4 h-4 bg-gray-800 text-sky-500" 
                            />
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: rt.color }}></div>
                            <span className="text-sm text-gray-200 flex-1">{rt.name}</span>
                            <span className="text-[9px] uppercase font-bold text-gray-500">{rt.isIncident ? 'Siniestro' : 'Riesgo'}</span>
                        </label>
                    ))}
                    {(!Array.isArray(riskTypes) || riskTypes.length === 0) && <p className="text-xs text-gray-500">No hay categorías cargadas.</p>}
                </div>
            </div>

            <div className="flex-1 bg-gray-700 p-3 rounded-lg flex flex-col min-h-0">
                <h3 className="text-sm font-semibold text-sky-400 mb-2 border-b border-gray-600 pb-1 flex justify-between">
                    <span>Recorridos Afectados</span>
                    <span className="bg-sky-900 text-sky-200 px-2 rounded-full text-xs">{affectedRoutes.length}</span>
                </h3>
                <div className="overflow-y-auto flex-1 pr-2 space-y-2">
                    {affectedRoutes.length > 0 ? (
                        affectedRoutes.map(route => (
                            <div key={route.id} className="bg-gray-800 p-2 rounded border border-gray-600">
                                <p className="font-medium text-white text-sm">{route.name}</p>
                                <p className="text-[10px] text-gray-400 truncate">{route.origin} &rarr; {route.destination}</p>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-6">
                            <Layers size={32} className="mx-auto text-gray-500 mb-2" />
                            <p className="text-xs text-gray-400">
                                {Array.isArray(selectedTypes) && selectedTypes.length === 0 ? "Seleccione categorías arriba para ver los recorridos afectados." : "No hay recorridos afectados por las categorías seleccionadas."}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};