import React, { useMemo, useState } from 'react';
import type { Route, Risk, RiskType } from '../types';
import { FileBarChart } from 'lucide-react';
import { nearestPointOnLine, point } from '@turf/turf';

interface ReportViewerProps {
    routes: Route[]; risks: Risk[]; getRiskType: (id: string) => RiskType | undefined;
    selectedRouteId: string; setSelectedRouteId: (id: string) => void;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({ routes, risks, getRiskType, selectedRouteId, setSelectedRouteId }) => {
    const[filterGroup, setFilterGroup] = useState('');
    const [filterLine, setFilterLine] = useState('');

    const uniqueGroups = useMemo(() => Array.from(new Set(routes.map(r => r.group))).sort(), [routes]);
    const uniqueLines = useMemo(() => Array.from(new Set(routes.filter(r => !filterGroup || r.group === filterGroup).map(r => r.line))).sort(), [routes, filterGroup]);
    const filteredDropdownRoutes = useMemo(() => routes.filter(r => (!filterGroup || r.group === filterGroup) && (!filterLine || r.line === filterLine)).sort((a,b)=>a.name.localeCompare(b.name)), [routes, filterGroup, filterLine]);

    const selectedRoute = useMemo(() => Array.isArray(routes) ? routes.find(r => r.id === selectedRouteId) : null, [selectedRouteId, routes]);
    const sortedSelectedRouteRisks = useMemo(() => {
        if (!selectedRouteId || !selectedRoute || !Array.isArray(risks)) return[];
        const unsortedRisks = risks.filter(risk => Array.isArray(risk.associatedRouteIds) && risk.associatedRouteIds.includes(selectedRouteId));
        let referenceLine: GeoJSON.Feature<GeoJSON.LineString> | null = null;
        if (selectedRoute.geoJson && Array.isArray(selectedRoute.geoJson.features)) {
            const lineFeature = selectedRoute.geoJson.features.find(f => f?.geometry?.type === 'LineString' && Array.isArray(f.geometry?.coordinates) && f.geometry.coordinates.length >= 2);
            if (lineFeature) referenceLine = lineFeature as GeoJSON.Feature<GeoJSON.LineString>;
        }
        if (!referenceLine) return unsortedRisks;
        return[...unsortedRisks].sort((a, b) => {
            try {
                if(!a.position || !b.position) return 0;
                const ptA = point([a.position.lng, a.position.lat]); const ptB = point([b.position.lng, b.position.lat]);
                const snappedA = nearestPointOnLine(referenceLine!, ptA); const snappedB = nearestPointOnLine(referenceLine!, ptB);
                return (snappedA.properties?.location || 0) - (snappedB.properties?.location || 0);
            } catch (e) { return 0; }
        });
    },[selectedRouteId, risks, selectedRoute]);

    return (
        <div>
            <h2 className="text-xl font-bold mb-4 text-sky-300">Riesgo por Servicio</h2>
            <div className="bg-gray-800 p-3 rounded-lg mb-4 flex gap-2">
                <select value={filterGroup} onChange={(e) => { setFilterGroup(e.target.value); setFilterLine(''); setSelectedRouteId(''); }} className="flex-1 bg-gray-900 text-white p-2 text-xs rounded border border-gray-700 outline-none"><option value="">Grupo...</option>{uniqueGroups.map(g => <option key={g} value={g}>{g}</option>)}</select>
                <select value={filterLine} onChange={(e) => { setFilterLine(e.target.value); setSelectedRouteId(''); }} className="flex-1 bg-gray-900 text-white p-2 text-xs rounded border border-gray-700 outline-none"><option value="">Línea...</option>{uniqueLines.map(l => <option key={l} value={l}>{l}</option>)}</select>
            </div>
            <div className="mb-4">
                <select value={selectedRouteId} onChange={(e) => setSelectedRouteId(e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-sky-500 outline-none">
                    <option value="">-- Elija un recorrido --</option>{filteredDropdownRoutes.map(route => <option key={route.id} value={route.id}>{route.name}</option>)}
                </select>
            </div>

            {selectedRoute ? (
                 <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-1">{selectedRoute.name}</h3>
                    <p className="text-sm text-gray-400 mb-3 font-medium">📍 Origen: {selectedRoute.origin} <br/>🏁 Destino: {selectedRoute.destination}</p>
                    <div className="border-t border-gray-600 pt-3">
                        <h4 className="font-bold text-sky-400 mb-4">Puntos de Riesgo en la ruta ({sortedSelectedRouteRisks.length})</h4>
                        {sortedSelectedRouteRisks.length > 0 ? (
                            <div className="relative pl-4 border-l-2 border-sky-800 space-y-4">
                                {sortedSelectedRouteRisks.map(risk => {
                                    const riskType = getRiskType(risk.riskTypeId);
                                    return (
                                        <div key={risk.id} className="relative bg-gray-800 p-3 rounded-md shadow">
                                            <div className="absolute -left-[21px] top-4 w-3 h-3 rounded-full border-2 border-gray-800" style={{ backgroundColor: riskType?.color || '#fff' }}></div>
                                            <div className="flex justify-between items-start mb-1"><span className="font-bold text-white text-sm" style={{ color: riskType?.color }}>{riskType?.name || 'Desconocido'}</span></div>
                                            <p className="text-xs text-gray-300">{risk.description}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : <p className="text-gray-400">Ruta limpia. Sin novedades registradas.</p>}
                    </div>
                </div>
            ) : <div className="text-center py-10 px-4 bg-gray-700 rounded-lg"><FileBarChart size={40} className="mx-auto text-gray-500" /><p className="mt-2 text-gray-400">Seleccione un recorrido.</p></div>}
        </div>
    );
};