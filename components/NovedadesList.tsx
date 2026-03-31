import React, { useMemo, useState } from 'react';
import type { Risk, Position } from '../types';
import { Bus, MapPin, Search, Calendar } from 'lucide-react';

interface NovedadesListProps {
    risks: Risk[];
    onFocusPosition: (pos: Position) => void;
}

export const NovedadesList: React.FC<NovedadesListProps> = ({ risks, onFocusPosition }) => {
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
    }, [risks, filterDate, filterLine]);

    return (
        <div className="h-full flex flex-col">
            <h2 className="text-xl font-bold mb-2 text-sky-300 flex items-center gap-2"><Bus /> Histórico Novedades</h2>
            
            {/* Filtros */}
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
                        const date = nov.timestamp ? new Date(nov.timestamp).toLocaleDateString('es-AR', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'}) : '';
                        
                        return (
                            <div 
                                key={nov.id} 
                                onClick={() => onFocusPosition(nov.position)}
                                className="bg-gray-800 border border-gray-700 hover:border-sky-500 cursor-pointer rounded-lg p-3 transition-colors"
                                title="Clic para ver en el mapa"
                            >
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-white text-sm">Línea {d.linea} | U: {d.unidad}</h3>
                                    <span className="text-[10px] text-gray-400">{date}</span>
                                </div>
                                <p className="text-xs text-sky-400 font-semibold my-1">{d.categoriaIRAM}</p>
                                <p className="text-[11px] text-gray-400 truncate"><MapPin size={10} className="inline mr-1"/>{d.ubicacionManual || 'Ubicación GPS'}</p>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    );
};