import React, { useMemo } from 'react';
import type { Risk, Position, User, Route } from '../types';
import { Bus, MapPin, Search, Calendar, Eye, EyeOff, Trash2 } from 'lucide-react';

interface NovedadesListProps {
    risks: Risk[]; routes: Route[]; currentUser: User;
    onFocusPosition: (pos: Position) => void;
    onUpdateRisk: (risk: Risk) => void;
    handleDeleteRisk: (id: string) => void;
    novedadesFilterYear: string; setNovedadesFilterYear: (v: string) => void;
    novedadesFilterMonth: string; setNovedadesFilterMonth: (v: string) => void;
    novedadesFilterGroup: string; setNovedadesFilterGroup: (v: string) => void;
    novedadesFilterLine: string; setNovedadesFilterLine: (v: string) => void;
    showNovedadesRoutes: boolean; setShowNovedadesRoutes: (v: boolean) => void;
}

export const NovedadesList: React.FC<NovedadesListProps> = ({ 
    risks, currentUser, onFocusPosition, onUpdateRisk, handleDeleteRisk,
    novedadesFilterYear, setNovedadesFilterYear, novedadesFilterMonth, setNovedadesFilterMonth, novedadesFilterGroup, setNovedadesFilterGroup, novedadesFilterLine, setNovedadesFilterLine,
    showNovedadesRoutes, setShowNovedadesRoutes
}) => {
    const uniqueGroups = useMemo(() => Array.from(new Set(routes.map(r => r.group).filter(Boolean))).sort(), [routes]);
    const years = Array.from({ length: new Date().getFullYear() - 2020 + 2 }, (_, i) => (2020 + i).toString());
    const months = [
        { val: '1', label: '01 - Enero' }, { val: '2', label: '02 - Febrero' },
        { val: '3', label: '03 - Marzo' }, { val: '4', label: '04 - Abril' },
        { val: '5', label: '05 - Mayo' }, { val: '6', label: '06 - Junio' },
        { val: '7', label: '07 - Julio' }, { val: '8', label: '08 - Agosto' },
        { val: '9', label: '09 - Septiembre' }, { val: '10', label: '10 - Octubre' },
        { val: '11', label: '11 - Noviembre' }, { val: '12', label: '12 - Diciembre' }
    ];

    const novedades = useMemo(() => {
        return risks.filter(r => r.driverReportDetails).filter(r => {
            if (novedadesFilterLine && !r.driverReportDetails?.linea.toLowerCase().includes(novedadesFilterLine.toLowerCase())) return false;
            
            if (novedadesFilterYear) {
                if (!r.timestamp) return false;
                const rDate = new Date(r.timestamp);
                if (rDate.getFullYear().toString() !== novedadesFilterYear) return false;
                if (novedadesFilterMonth && (rDate.getMonth() + 1).toString() !== novedadesFilterMonth) return false;
            }
            
            if (novedadesFilterGroup) {
                const hasGroup = (r.associatedRouteIds || []).some(routeId => {
                    const route = routes.find(rt => rt.id === routeId);
                    return route?.group === novedadesFilterGroup;
                });
                if (!hasGroup) return false;
            }

            return true;
        }).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    },[risks, novedadesFilterLine, novedadesFilterYear, novedadesFilterMonth, novedadesFilterGroup, routes]);

    const toggleVisibility = (e: React.MouseEvent, risk: Risk) => {
        e.stopPropagation(); onUpdateRisk({ ...risk, isVisibleOnMap: risk.isVisibleOnMap === false ? true : false });
    };

    return (
        <div className="h-full flex flex-col">
            <h2 className="text-xl font-bold mb-2 text-sky-300 flex items-center gap-2"><Bus /> Historial Novedades</h2>
            
            <label className="flex items-center space-x-3 bg-gray-700/50 p-3 rounded-xl border border-gray-600 cursor-pointer hover:bg-gray-700 transition-all mb-4">
                <input type="checkbox" checked={showNovedadesRoutes} onChange={(e) => setShowNovedadesRoutes(e.target.checked)} className="w-5 h-5 rounded text-sky-500 bg-gray-900 border-gray-600 focus:ring-0" />
                <span className="text-sm font-bold text-gray-200 flex items-center gap-2">
                    {showNovedadesRoutes ? <Eye size={16} className="text-sky-400"/> : <EyeOff size={16} className="text-gray-500"/>}
                    Ver recorridos afectados
                </span>
            </label>

            <div className="bg-gray-800 p-3 rounded-lg mb-4 flex flex-col gap-2">
                <div className="flex gap-2">
                    <select value={novedadesFilterYear} onChange={e => setNovedadesFilterYear(e.target.value)} className="flex-1 bg-gray-900 border border-gray-700 text-white rounded p-2 text-xs outline-none focus:border-sky-500">
                        <option value="">Año...</option>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <select value={novedadesFilterMonth} onChange={e => setNovedadesFilterMonth(e.target.value)} disabled={!novedadesFilterYear} className="flex-1 bg-gray-900 border border-gray-700 text-white rounded p-2 text-xs outline-none focus:border-sky-500 disabled:opacity-50">
                        <option value="">Mes...</option>
                        {months.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
                    </select>
                </div>
                <div className="flex gap-2">
                    <select value={novedadesFilterGroup} onChange={e => setNovedadesFilterGroup(e.target.value)} className="flex-1 bg-gray-900 border border-gray-700 text-white rounded p-2 text-xs outline-none focus:border-sky-500">
                        <option value="">Grupo...</option>
                        {uniqueGroups.map(g => <option key={g as string} value={g as string}>{g as string}</option>)}
                    </select>
                    <div className="flex-1 relative"><Search className="absolute left-2 top-2.5 text-gray-400" size={14} /><input type="text" placeholder="Línea..." value={novedadesFilterLine} onChange={e=>setNovedadesFilterLine(e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white rounded p-2 pl-8 text-xs outline-none focus:border-sky-500" /></div>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {novedades.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 text-sm">
                        No se hallaron registros de novedades para el mes / año / grupo seleccionado.
                    </div>
                ) : novedades.map(nov => {
                    const d = nov.driverReportDetails!;
                    const isVisible = nov.isVisibleOnMap !== false;
                    const date = nov.timestamp ? new Date(nov.timestamp).toLocaleDateString('es-AR', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'}) : '';
                    return (
                        <div key={nov.id} onClick={() => onFocusPosition(nov.position)} className={`bg-gray-800 border ${isVisible ? 'border-gray-700 hover:border-sky-500' : 'border-dashed border-gray-600 opacity-60'} rounded-lg p-3 cursor-pointer relative group transition-colors`}>
                            <div className="absolute top-3 right-3 flex gap-2">
                                <button onClick={(e) => toggleVisibility(e, nov)} className={`p-1.5 rounded-md transition-colors ${isVisible ? 'text-sky-400 bg-sky-900/30' : 'text-gray-500 bg-gray-900'}`}>{isVisible ? <Eye size={16}/> : <EyeOff size={16}/>}</button>
                                {currentUser.isAdmin && <button onClick={(e) => { e.stopPropagation(); handleDeleteRisk(nov.id); }} className="p-1.5 text-red-500 hover:bg-red-900/20 rounded-md"><Trash2 size={16} /></button>}
                            </div>
                            <div className="pr-16"><div className="flex justify-between items-start mb-1"><p className="text-[10px] text-sky-400 font-bold uppercase">{d.categoriaIRAM}</p><span className="text-[10px] text-gray-400">{date}</span></div><h3 className="font-bold text-white text-sm">Línea {d.linea} | U: {d.unidad}</h3><p className="text-[10px] text-gray-500 mt-1">Reportado por: {d.conductorName}</p><p className="text-[11px] text-gray-400 truncate mt-1"><MapPin size={10} className="inline mr-1"/>{d.ubicacionManual || 'Ubicación GPS'}</p></div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};