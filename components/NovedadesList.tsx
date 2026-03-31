import React, { useMemo } from 'react';
import type { Risk, Route, User } from '../types';
import { Clock, ShieldAlert, Trash2, MapPin, Bus } from 'lucide-react';

interface NovedadesListProps {
    risks: Risk[];
    routes: Route[];
    currentUser: User;
    handleDeleteRisk: (id: string) => void;
}

export const NovedadesList: React.FC<NovedadesListProps> = ({ risks, routes, currentUser, handleDeleteRisk }) => {
    
    // Filtramos solo los riesgos que vinieron desde la App de Conductores (IRAM 3810)
    const novedades = useMemo(() => {
        return risks
            .filter(r => r.driverReportDetails)
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)); // Más recientes primero
    }, [risks]);

    const getRouteNames = (ids: string[]) => {
        if (!ids || ids.length === 0) return 'No asociado';
        return ids.map(id => routes.find(r => r.id === id)?.name || 'Desconocido').join(', ');
    };

    return (
        <div className="h-full flex flex-col">
            <h2 className="text-xl font-bold mb-2 text-sky-300 flex items-center gap-2"><Bus /> Histórico Novedades (Conductores)</h2>
            <p className="text-xs text-gray-400 mb-4">Registro completo de todos los reportes IRAM 3810 enviados desde la calle.</p>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {novedades.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        <ShieldAlert size={40} className="mx-auto mb-2 opacity-50" />
                        <p>Aún no hay reportes de conductores.</p>
                    </div>
                ) : (
                    novedades.map(nov => {
                        const date = nov.timestamp ? new Date(nov.timestamp).toLocaleString() : 'Fecha desconocida';
                        const d = nov.driverReportDetails!;
                        
                        return (
                            <div key={nov.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4 relative shadow-md">
                                <div className="absolute top-4 right-4 flex gap-2">
                                    {currentUser.isAdmin && (
                                        <button onClick={() => handleDeleteRisk(nov.id)} className="text-red-400 hover:text-red-300 bg-red-900/30 p-2 rounded-lg" title="Eliminar definitivamente">
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>

                                <div className="mb-2">
                                    <span className="bg-sky-900 text-sky-300 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide">{d.categoriaIRAM}</span>
                                </div>
                                
                                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                                    <Bus size={16} className="text-gray-400" /> U: {d.unidad} - Línea {d.linea}
                                </h3>
                                <p className="text-xs text-gray-400 mb-3"><Clock size={12} className="inline mr-1"/> {date} • Por: {d.conductorName}</p>

                                <div className="grid grid-cols-2 gap-2 text-sm bg-gray-900/50 p-3 rounded mb-3 border border-gray-700">
                                    <p><span className="text-gray-500">Sentido:</span> {d.sentido}</p>
                                    <p><span className="text-gray-500">Desvío:</span> {d.huboDesvio ? <span className="text-red-400 font-bold">Sí</span> : 'No'}</p>
                                    <p className="col-span-2 text-xs"><MapPin size={12} className="inline text-gray-500 mr-1"/> {d.ubicacionManual || 'GPS Capturado'}</p>
                                    <p className="col-span-2 text-xs"><span className="text-gray-500">Rutas Afectadas:</span> {getRouteNames(nov.associatedRouteIds)}</p>
                                </div>

                                {nov.description && (
                                    <div className="bg-gray-700 p-2 rounded text-gray-300 text-sm italic">
                                        "{nov.description}"
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    );
};