
import React, { useState, useMemo } from 'react';
import type { Route, Risk, RiskType } from '../types';
import { FileBarChart, Search } from 'lucide-react';

interface ReportViewerProps {
    routes: Route[];
    risks: Risk[];
    getRiskType: (id: string) => RiskType | undefined;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({ routes, risks, getRiskType }) => {
    const [selectedRouteId, setSelectedRouteId] = useState<string>('');

    const selectedRouteRisks = useMemo(() => {
        if (!selectedRouteId) return [];
        return risks.filter(risk => risk.associatedRouteIds.includes(selectedRouteId));
    }, [selectedRouteId, risks]);
    
    const selectedRoute = useMemo(() => {
        return routes.find(r => r.id === selectedRouteId);
    }, [selectedRouteId, routes]);


    return (
        <div>
            <h2 className="text-xl font-bold mb-4 text-sky-300">Reporte de Riesgos por Recorrido</h2>
            
            <div className="mb-4">
                <label htmlFor="route-select" className="block text-sm font-medium text-gray-300 mb-1">Seleccionar Recorrido</label>
                <select
                    id="route-select"
                    value={selectedRouteId}
                    onChange={(e) => setSelectedRouteId(e.target.value)}
                    className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-sky-500 focus:border-sky-500"
                >
                    <option value="">-- Elija un recorrido --</option>
                    {routes.map(route => (
                        <option key={route.id} value={route.id}>{route.name}</option>
                    ))}
                </select>
            </div>

            {selectedRoute ? (
                 <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-1">{selectedRoute.name}</h3>
                    <div className="flex gap-2 text-[10px] text-sky-400 font-mono uppercase mb-2">
                        <span>G: {selectedRoute.group}</span>
                        <span>L: {selectedRoute.line}</span>
                        <span>S: {selectedRoute.service}</span>
                    </div>
                    <p className="text-sm text-gray-400 mb-3">{selectedRoute.origin} &rarr; {selectedRoute.destination}</p>
                    
                    <div className="border-t border-gray-600 pt-3">
                        <h4 className="font-bold text-sky-400 mb-2">Riesgos Asociados ({selectedRouteRisks.length})</h4>
                        {selectedRouteRisks.length > 0 ? (
                            <ul className="space-y-2">
                                {selectedRouteRisks.map(risk => {
                                    const riskType = getRiskType(risk.riskTypeId);
                                    return (
                                        <li key={risk.id} className="bg-gray-800 p-3 rounded-md">
                                            <div className="flex items-center mb-1">
                                                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: riskType?.color || '#fff' }}></div>
                                                <span className="font-semibold text-white">{riskType?.name || 'Desconocido'}</span>
                                            </div>
                                            <p className="text-sm text-gray-300 pl-5">{risk.description}</p>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <p className="text-gray-400">No se encontraron riesgos para este recorrido.</p>
                        )}
                    </div>
                </div>
            ) : (
                <div className="text-center py-10 px-4 bg-gray-700 rounded-lg">
                    <FileBarChart size={40} className="mx-auto text-gray-500" />
                    <p className="mt-2 text-gray-400">Seleccione un recorrido para ver su reporte de riesgos.</p>
                </div>
            )}
        </div>
    );
};
