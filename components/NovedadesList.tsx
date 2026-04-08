import React, { useMemo, useState } from 'react';
import type { Risk, Position, User, Route } from '../types';
import { Bus, MapPin, Search, Calendar, Eye, EyeOff, Trash2 } from 'lucide-react';

interface NovedadesListProps {
    risks: Risk[];
    routes: Route[];
    currentUser: User;
    onFocusPosition: (pos: Position) => void;
    onUpdateRisk: (risk: Risk) => void;
    handleDeleteRisk: (id: string) => void;
}

// AQUÍ ESTÁ EL EXPORT QUE VERCEL ESTABA BUSCANDO 👇
export const NovedadesList: React.FC<NovedadesListProps> = ({ risks, routes, currentUser, onFocusPosition, onUpdateRisk, handleDeleteRisk }) => {
    const [filterDate, setFilterDate] = useState('');
    const [filterLine, setFilterLine] = useState('');
    
    const novedades = useMemo(() => {
        return risks
            .filter(r => r.driverReportDetails)
            .filter(r => {
                if (filterLine && !r.driverReportDetails?.linea.toLowerCase().includes(filterLine.toLowerCase())) return false;
                if (filterDate && r.timestamp) {
                    const rDate = new Date(r.timestamp).toISOString().split('T')[0];
                    if (rDate !== filterDate) return false;
                }
                return true;
            })
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    },[risks, filterDate, filterLine]);

    const toggleVisibility = (e: React.MouseEvent, risk: Risk) => {
        e.stopPropagation();
        onUpdateRisk({ ...risk, isVisibleOnMap: risk.isVisibleOnMap === false ? true : false });
    };

    return (
        <div className="h-full flex flex-col">
            <h2 className="text-xl font-bold mb-2 text-sky-300 flex items-center gap-2"><Bus /> Historial Novedades</h2>
            
            <div className="bg-gray-800 p-3 rounded-lg mb-4 flex gap-2">
                <div className="flex-1 relative">
                    <Calendar className="absolute left-2 top-2 text-gray-400" size={16} />
                    <input type="date" value={filterDate} onChange={e=>setFilterDate(e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white rounded p-1 pl-8 text-xs outline-none focus:border-sky-500" />
                </div>
                <div className="flex-1 relative">
                    <Search className="absolute left-2 top-2 text-gray-400" size={16} />
                    <input type="text" placeholder="Línea..." value={filterLine} onChange={e=>setFilterLine(e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white rounded p-1 pl-8 text-xs outline-none focus:border-sky-500" />
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {novedades.length === 0 ? (
                    <p className="text-center text-gray-500 text-sm mt-10">No hay registros para estos filtros.</p>
                ) : (
                    novedades.map(nov => {
                        const d = nov.driverReportDetails!;
                        const isVisible = nov.isVisibleOnMap !== false;
                        const date = nov.timestamp ? new Date(nov.timestamp).toLocaleDateString('es-AR', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'}) : '';
                        
                        return (
                            <div 
                                key={nov.id} 
                                onClick={() => onFocusPosition(nov.position)} 
                                className={`bg-gray-800 border ${isVisible ? 'border-gray-700 hover:border-sky-500' : 'border-dashed border-gray-600 opacity-60'} rounded-lg p-3 cursor-pointer relative group transition-colors`}
                            >
                                <div className="absolute top-3 right-3 flex gap-2">
                                    <button 
                                        onClick={(e) => toggleVisibility(e, nov)}
                                        className={`p-1.5 rounded-md transition-colors ${isVisible ? 'text-sky-400 bg-sky-900/30' : 'text-gray-500 bg-gray-900'}`}
                                        title={isVisible ? "Visible en mapa (Clic para ocultar)" : "Oculto en mapa (Clic para mostrar)"}
                                    >
                                        {isVisible ? <Eye size={16}/> : <EyeOff size={16}/>}
                                    </button>
                                    {currentUser.isAdmin && (
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteRisk(nov.id); }} className="p-1.5 text-red-500 hover:bg-red-900/20 rounded-md">
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>

                                <div className="pr-16">
                                    <div className="flex justify-between items-start mb-1">
                                        <p className="text-[10px] text-sky-400 font-bold uppercase">{d.categoriaIRAM}</p>
                                        <span className="text-[10px] text-gray-400">{date}</span>
                                    </div>
                                    <h3 className="font-bold text-white text-sm">Línea {d.linea} | U: {d.unidad}</h3>
                                    <p className="text-[10px] text-gray-500 mt-1">Reportado por: {d.conductorName}</p>
                                    <p className="text-[11px] text-gray-400 truncate mt-1"><MapPin size={10} className="inline mr-1"/>{d.ubicacionManual || 'Ubicación GPS'}</p>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    );
};