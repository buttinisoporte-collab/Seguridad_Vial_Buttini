import React, { useMemo, useState, useEffect } from 'react';
import type { Siniestro, Risk, RiskType, Position, Route } from '../types';
import { ShieldAlert, Trash2, Folder, MapPin, Edit, Plus, Crosshair, X } from 'lucide-react';
import { SiniestroForm } from './SiniestroForm';

interface SiniestrosAdminProps {
    siniestros: Siniestro[];
    incidentRisks: Risk[];
    riskTypes: RiskType[];
    routes: Route[];
    handleDeleteSiniestro: (id: string) => void;
    handleDeleteRisk: (id: string) => void;
    selectedSiniestroId: string | null;
    setSelectedSiniestroId: (id: string | null) => void;
    onFocusPosition: (pos: Position) => void;
    onUpdateRisk: (risk: Risk) => void;
    onUpdateSiniestro: (sin: Siniestro) => void;
    onAddNewSiniestro: () => void;
    relocatingSiniestroId: string | null;
    setRelocatingSiniestroId: (id: string | null) => void;
    eventosFilterYear: string; setEventosFilterYear: (v: string) => void;
    eventosFilterMonth: string; setEventosFilterMonth: (v: string) => void;
    eventosFilterTipo: string; setEventosFilterTipo: (v: string) => void;
}

export const SiniestrosAdmin: React.FC<SiniestrosAdminProps> = ({ 
    siniestros, incidentRisks, riskTypes, routes, handleDeleteSiniestro, handleDeleteRisk, selectedSiniestroId, setSelectedSiniestroId, onFocusPosition, onUpdateRisk, onUpdateSiniestro, onAddNewSiniestro, relocatingSiniestroId, setRelocatingSiniestroId,
    eventosFilterYear, setEventosFilterYear, eventosFilterMonth, setEventosFilterMonth, eventosFilterTipo, setEventosFilterTipo
}) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editDate, setEditDate] = useState('');
    const [editRouteId, setEditRouteId] = useState('');
    const [editGravedad, setEditGravedad] = useState('');
    const [editingSiniestroIram, setEditingSiniestroIram] = useState<Siniestro | null>(null);
    const years = Array.from({ length: new Date().getFullYear() - 2020 + 2 }, (_, i) => (2020 + i).toString());

    const unifiedList = useMemo(() => {
        const safeSiniestros = Array.isArray(siniestros) ? siniestros : [];
        const safeIncidentRisks = Array.isArray(incidentRisks) ? incidentRisks : [];
        let list = [
            ...safeSiniestros.map(s => ({ type: 'iram', data: s as any, ts: s.fechaHora ? new Date(s.fechaHora).getTime() : s.timestamp })),
            ...safeIncidentRisks.map(r => ({ type: 'manual', data: r as any, ts: r.timestamp || 0 }))
        ];
        
        if (eventosFilterYear) {
            list = list.filter(item => {
                const itemDate = new Date(item.ts);
                const yearMatch = itemDate.getFullYear().toString() === eventosFilterYear;
                if (!eventosFilterMonth) return yearMatch;
                return yearMatch && (itemDate.getMonth() + 1).toString() === eventosFilterMonth;
            });
        }
        if (eventosFilterTipo) {
            list = list.filter(item => {
                if (item.type === 'iram') return ((item.data as Siniestro).tipoEvento || 'Siniestro') === eventosFilterTipo;
                return eventosFilterTipo === 'Siniestro'; 
            });
        }
        return list.sort((a, b) => b.ts - a.ts);
    }, [siniestros, incidentRisks, eventosFilterYear, eventosFilterMonth, eventosFilterTipo]);

    useEffect(() => {
        if (selectedSiniestroId) {
            setTimeout(() => {
                const elemento = document.getElementById(`siniestro-card-${selectedSiniestroId}`);
                if (elemento) elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }, [selectedSiniestroId]);

    const startEditIram = (sin: Siniestro) => { setEditingSiniestroIram(sin); };
    const startEditManual = (risk: Risk) => { setEditingId(risk.id); if (risk.timestamp) { const d = new Date(risk.timestamp); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); setEditDate(d.toISOString().slice(0, 16)); } else setEditDate(''); setEditRouteId(Array.isArray(risk.associatedRouteIds) ? risk.associatedRouteIds[0] || '' : ''); setEditGravedad(risk.gravedad || 'Leve'); };
    const saveManualEdit = (risk: Risk) => { const updatedRisk = { ...risk, gravedad: editGravedad }; if (editDate) updatedRisk.timestamp = new Date(editDate).getTime(); updatedRisk.associatedRouteIds = editRouteId ? [editRouteId] : []; onUpdateRisk(updatedRisk); setEditingId(null); };
    const saveIramEdit = (sin: Siniestro) => { const updatedSin = { ...sin }; if (editDate) { updatedSin.timestamp = new Date(editDate).getTime(); updatedSin.fechaHora = new Date(editDate).toISOString(); } updatedSin.associatedRouteId = editRouteId; updatedSin.descripcion = { ...updatedSin.descripcion, gravedad: editGravedad }; onUpdateSiniestro(updatedSin); setEditingId(null); };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-xl font-bold mb-1 text-red-400 flex items-center gap-2"><ShieldAlert /> Reportes de Eventos</h2>
                    <p className="text-xs text-gray-400">Haga clic en un registro para editarlo o ubicarlo.</p>
                </div>
                <button onClick={onAddNewSiniestro} className="bg-red-600 hover:bg-red-500 text-white px-3 py-2 rounded-lg flex items-center gap-2 shadow hover:shadow-lg transition-all text-sm font-bold shrink-0"><Plus size={16} /> Cargar Evento</button>
            </div>
            
            <div className="flex gap-2 mb-4 flex-wrap">
                <select value={eventosFilterTipo} onChange={e => setEventosFilterTipo(e.target.value)} className="bg-gray-800 border border-gray-600 rounded p-2 text-white text-sm outline-none flex-1 min-w-[150px]">
                    <option value="">Siniestros e Incidentes</option>
                    <option value="Siniestro">Solo Siniestros</option>
                    <option value="Incidente">Solo Incidentes</option>
                </select>
                <select value={eventosFilterYear} onChange={e => setEventosFilterYear(e.target.value)} className="bg-gray-800 border border-gray-600 rounded p-2 text-white text-sm outline-none w-32">
                    <option value="">Año</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <select value={eventosFilterMonth} onChange={e => setEventosFilterMonth(e.target.value)} disabled={!eventosFilterYear} className="bg-gray-800 border border-gray-600 rounded p-2 text-white text-sm outline-none disabled:opacity-50 w-32">
                    <option value="">Mes</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m.toString()}>{m.toString().padStart(2, '0')}</option>)}
                </select>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scroll-smooth">
                {Array.isArray(unifiedList) && unifiedList.length === 0 ? (
                    <div className="text-center py-10 text-gray-500"><ShieldAlert size={40} className="mx-auto mb-2 opacity-50" /><p>No hay eventos registrados para este filtro.</p></div>
                ) : (
                    Array.isArray(unifiedList) && unifiedList.map(item => {
                        if (item.type === 'iram') {
                            const sin = item.data as Siniestro;
                            const isIncidente = sin.tipoEvento === 'Incidente';
                            const badgeBg = isIncidente ? 'bg-yellow-900 text-yellow-400' : 'bg-red-900 text-red-300';
                            const badgeBorder = isIncidente ? 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]';

                            return (
                                <div key={sin.id} id={`siniestro-card-${sin.id}`} className={`bg-gray-800 border transition-all duration-300 rounded-lg shadow-md overflow-hidden ${selectedSiniestroId === sin.id ? `${badgeBorder} bg-gray-800` : 'border-gray-700'}`}>
                                    <div className="p-4 cursor-pointer hover:bg-gray-750 flex justify-between items-center" onClick={() => { setSelectedSiniestroId(selectedSiniestroId === sin.id ? null : sin.id); if (sin.ubicacion?.lat && sin.ubicacion?.lng) onFocusPosition({ lat: sin.ubicacion.lat, lng: sin.ubicacion.lng }); }}>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`${badgeBg} text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide`}>{isIncidente ? '⚠️ Incidente' : '🚨 Siniestro'}</span>
                                                <span className="text-xs text-gray-400">{sin.timestamp ? new Date(sin.fechaHora).toLocaleString('es-AR') : <span className="text-orange-400 font-bold">Sin fecha (Use Editar)</span>}</span>
                                            </div>
                                            <h3 className="font-bold text-white text-sm">Línea: {sin.conductor?.linea} | Interno: {sin.conductor?.interno}</h3>
                                            <p className="text-[10px] text-gray-400">{sin.conductor?.nombre}</p>
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteSiniestro(sin.id); }} className="text-gray-500 hover:text-red-500 p-2"><Trash2 size={16} /></button>
                                    </div>
                                    {selectedSiniestroId === sin.id && (
                                        <div className="p-4 border-t border-gray-700 bg-gray-900 text-sm space-y-4">
                                            <div className="flex justify-between items-start border-b border-gray-700 pb-2">
                                                <div><p className="text-[11px] text-gray-400"><b>Ruta Afectada:</b> {sin.associatedRouteId && Array.isArray(routes) ? routes.find(r=>r.id===sin.associatedRouteId)?.name : `Línea ${sin.conductor?.linea} (Genérico)`}</p></div>
                                                <div className="flex gap-2">
                                                    <button onClick={(e) => { e.stopPropagation(); setRelocatingSiniestroId(relocatingSiniestroId === sin.id ? null : sin.id); }} className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded ${relocatingSiniestroId === sin.id ? 'bg-sky-600 text-white font-bold animate-pulse' : 'bg-gray-700 hover:bg-gray-600 text-sky-400'}`}><Crosshair size={12}/> {relocatingSiniestroId === sin.id ? 'Elegir en el mapa...' : 'Reubicar Punto'}</button>
                                                    <button onClick={(e) => { e.stopPropagation(); startEditIram(sin); }} className="flex items-center gap-1 text-[10px] bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-sky-400"><Edit size={12}/> Editar Info</button>
                                                </div>
                                            </div>
                                            <div><h4 className="text-sky-400 font-bold mb-1 border-b border-gray-700 pb-1">1. Ubicación y Entorno</h4><p className="text-gray-300"><MapPin size={12} className="inline mr-1"/> {sin.ubicacion?.manual} ({sin.ubicacion?.lugar})</p></div>
                                            <div><h4 className="text-sky-400 font-bold mb-1 border-b border-gray-700 pb-1">2. Conductor y Unidad</h4>
                                                <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-400"><p><b>Nombre:</b> {sin.conductor?.nombre || 'N/A'}</p><p><b>Legajo:</b> {sin.conductor?.legajo || 'N/A'}</p><p><b>Línea:</b> {sin.conductor?.linea || 'N/A'}</p><p><b>Interno:</b> {sin.conductor?.interno || 'N/A'}</p></div>
                                            </div>
                                            <div><h4 className="text-sky-400 font-bold mb-1 border-b border-gray-700 pb-1">3. Detalles</h4><p className={`${isIncidente ? 'text-yellow-500' : 'text-red-400'} font-bold mb-1 text-xs`}>Tipo: {sin.descripcion?.tipo || 'N/A'}</p><p className={`${isIncidente ? 'text-yellow-500' : 'text-red-400'} font-bold mb-1 text-xs`}>Gravedad: {sin.descripcion?.gravedad || 'No especificada'}</p><p className="text-gray-300 italic bg-gray-800 p-2 rounded mb-2 text-xs">"{sin.descripcion?.resumen}"</p></div>
                                            {(Array.isArray(sin.images) && sin.images.length > 0) && (
                                                <div><h4 className="text-sky-400 font-bold mb-2 border-b border-gray-700 pb-1">Fotografías ({sin.images.length})</h4><div className="grid grid-cols-3 gap-2">{sin.images.map((img, idx) => (<a key={idx} href={img} target="_blank" rel="noreferrer"><img src={img} alt="Siniestro" className="w-full h-16 object-cover rounded border border-gray-600 hover:border-sky-500" /></a>))}</div></div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        } else {
                            const risk = item.data as Risk;
                            const rt = Array.isArray(riskTypes) ? riskTypes.find(t => t.id === risk.riskTypeId) : null;
                            return (
                                <div key={risk.id} id={`siniestro-card-${risk.id}`} className={`bg-gray-800 border transition-all duration-300 rounded-lg shadow-md overflow-hidden ${selectedSiniestroId === risk.id ? 'border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)] bg-gray-800' : 'border-gray-700'}`}>
                                    <div className="p-4 cursor-pointer hover:bg-gray-750 flex justify-between items-center" onClick={() => { setSelectedSiniestroId(selectedSiniestroId === risk.id ? null : risk.id); if (risk.position) onFocusPosition(risk.position); }}>
                                        <div><div className="flex items-center gap-2 mb-1"><span className="bg-orange-900 text-orange-300 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide">Carga Manual (Mapa)</span><span className="text-xs text-gray-400">{risk.timestamp ? new Date(risk.timestamp).toLocaleString('es-AR') : <span className="text-orange-400 font-bold">Sin fecha</span>}</span></div><h3 className="font-bold text-white text-sm" style={{ color: rt?.color }}>{rt?.name || 'Siniestro'}</h3></div>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteRisk(risk.id); }} className="text-gray-500 hover:text-red-500 p-2"><Trash2 size={16} /></button>
                                    </div>
                                    {selectedSiniestroId === risk.id && (
                                        <div className="p-4 border-t border-gray-700 bg-gray-900 text-sm space-y-4">
                                            <div><h4 className="text-orange-400 font-bold mb-1 border-b border-gray-700 pb-1">Ubicación y Detalles</h4><p className="text-gray-300 italic bg-gray-800 p-2 rounded">"{risk.description}"</p></div>
                                        </div>
                                    )}
                                </div>
                            );
                        }
                    })
                )}
            </div>
            {editingSiniestroIram && (
                <div className="fixed inset-0 z-[100] bg-black bg-opacity-80 flex items-center justify-center p-4">
                    <div className="bg-gray-900 rounded-xl overflow-hidden w-full max-w-2xl max-h-[90vh] flex flex-col relative shadow-2xl border border-gray-700"><SiniestroForm isModal={true} initialSiniestro={editingSiniestroIram} hideFiles={true} onCancel={() => setEditingSiniestroIram(null)} onSaveSiniestro={async (updatedSin) => { onUpdateSiniestro(updatedSin); }} /></div>
                </div>
            )}
        </div>
    );
};