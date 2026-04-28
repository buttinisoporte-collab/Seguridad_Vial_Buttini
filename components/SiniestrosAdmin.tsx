import React, { useMemo, useState } from 'react';
import type { Siniestro, Risk, RiskType, Position, Route } from '../types';
import { ShieldAlert, Trash2, Folder, MapPin, Edit } from 'lucide-react';

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
}

export const SiniestrosAdmin: React.FC<SiniestrosAdminProps> = ({ 
    siniestros, incidentRisks, riskTypes, routes, handleDeleteSiniestro, handleDeleteRisk, selectedSiniestroId, setSelectedSiniestroId, onFocusPosition, onUpdateRisk, onUpdateSiniestro
}) => {
    
    // Estados para la Edición Rápida
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editDate, setEditDate] = useState('');
    const [editRouteId, setEditRouteId] = useState('');
    const [editGravedad, setEditGravedad] = useState('');

    const unifiedList = useMemo(() => {
        const safeSiniestros = Array.isArray(siniestros) ? siniestros :[];
        const safeIncidentRisks = Array.isArray(incidentRisks) ? incidentRisks :[];
        
        const list =[
            ...safeSiniestros.map(s => ({ type: 'iram', data: s as any, ts: s.timestamp })),
            ...safeIncidentRisks.map(r => ({ type: 'manual', data: r as any, ts: r.timestamp || 0 }))
        ];
        return list.sort((a, b) => b.ts - a.ts);
    },[siniestros, incidentRisks]);

    const startEditIram = (sin: Siniestro) => {
        setEditingId(sin.id);
        if (sin.timestamp) {
            const d = new Date(sin.timestamp);
            d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
            setEditDate(d.toISOString().slice(0, 16));
        } else setEditDate('');
        setEditRouteId(sin.associatedRouteId || '');
        setEditGravedad(sin.descripcion?.gravedad || 'Leve');
    };

    const startEditManual = (risk: Risk) => {
        setEditingId(risk.id);
        if (risk.timestamp) {
            const d = new Date(risk.timestamp);
            d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
            setEditDate(d.toISOString().slice(0, 16));
        } else setEditDate('');
        setEditRouteId(Array.isArray(risk.associatedRouteIds) ? risk.associatedRouteIds[0] || '' : '');
        setEditGravedad(risk.gravedad || 'Leve');
    };

    const saveManualEdit = (risk: Risk) => {
        const updatedRisk = { ...risk, gravedad: editGravedad };
        if (editDate) updatedRisk.timestamp = new Date(editDate).getTime();
        updatedRisk.associatedRouteIds = editRouteId ? [editRouteId] :[];
        onUpdateRisk(updatedRisk);
        setEditingId(null);
    };

    const saveIramEdit = (sin: Siniestro) => {
        const updatedSin = { ...sin };
        if (editDate) {
            updatedSin.timestamp = new Date(editDate).getTime();
            updatedSin.fechaHora = new Date(editDate).toISOString();
        }
        updatedSin.associatedRouteId = editRouteId;
        updatedSin.descripcion = { ...updatedSin.descripcion, gravedad: editGravedad };
        onUpdateSiniestro(updatedSin);
        setEditingId(null);
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-xl font-bold mb-1 text-red-400 flex items-center gap-2"><ShieldAlert /> Reportes de Siniestros</h2>
                    <p className="text-xs text-gray-400">Haga clic en un registro para editarlo o ubicarlo.</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {Array.isArray(unifiedList) && unifiedList.length === 0 ? (
                    <div className="text-center py-10 text-gray-500"><ShieldAlert size={40} className="mx-auto mb-2 opacity-50" /><p>No hay siniestros registrados.</p></div>
                ) : (
                    Array.isArray(unifiedList) && unifiedList.map(item => {
                        if (item.type === 'iram') {
                            const sin = item.data as Siniestro;
                            return (
                                <div key={sin.id} className={`bg-gray-800 border transition-colors rounded-lg shadow-md overflow-hidden ${selectedSiniestroId === sin.id ? 'border-red-500' : 'border-gray-700'}`}>
                                    <div className="p-4 cursor-pointer hover:bg-gray-750 flex justify-between items-center" onClick={() => { setSelectedSiniestroId(selectedSiniestroId === sin.id ? null : sin.id); if (sin.ubicacion?.lat && sin.ubicacion?.lng) onFocusPosition({ lat: sin.ubicacion.lat, lng: sin.ubicacion.lng }); }}>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="bg-red-900 text-red-300 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide">Formulario IRAM</span>
                                                <span className="text-xs text-gray-400">{sin.timestamp ? new Date(sin.fechaHora).toLocaleString('es-AR') : <span className="text-orange-400 font-bold">Sin fecha (Use Editar)</span>}</span>
                                            </div>
                                            <h3 className="font-bold text-white text-sm">Línea: {sin.conductor?.linea} | Interno: {sin.conductor?.interno}</h3>
                                            <p className="text-[10px] text-gray-400">{sin.conductor?.nombre}</p>
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteSiniestro(sin.id); }} className="text-gray-500 hover:text-red-500 p-2"><Trash2 size={16} /></button>
                                    </div>

                                    {selectedSiniestroId === sin.id && (
                                        editingId === sin.id ? (
                                            <div className="p-4 border-t border-gray-700 bg-gray-900 text-sm space-y-3">
                                                <label className="block text-[10px] text-gray-400 uppercase">Fecha y Hora</label>
                                                <input type="datetime-local" value={editDate} onChange={e=>setEditDate(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white text-xs outline-none" />
                                                
                                                <label className="block text-[10px] text-gray-400 uppercase mt-2">Gravedad del Siniestro</label>
                                                <select value={editGravedad} onChange={e=>setEditGravedad(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white text-xs outline-none">
                                                    <option value="Leve">Leve</option>
                                                    <option value="Moderado">Moderado</option>
                                                    <option value="Grave">Grave</option>
                                                    <option value="Solo daños materiales">Solo daños materiales</option>
                                                    <option value="Fallecidos">Fallecidos</option>
                                                </select>

                                                <label className="block text-[10px] text-gray-400 uppercase mt-2">Recorrido Afectado (Opcional)</label>
                                                <select value={editRouteId} onChange={e=>setEditRouteId(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white text-xs outline-none">
                                                    <option value="">No aplica / Default de Línea</option>
                                                    {Array.isArray(routes) && routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                                </select>
                                                <div className="flex gap-2 justify-end mt-3">
                                                    <button onClick={() => setEditingId(null)} className="px-3 py-1 bg-gray-600 text-white rounded text-xs">Cancelar</button>
                                                    <button onClick={() => saveIramEdit(sin)} className="px-3 py-1 bg-sky-500 text-white rounded text-xs font-bold">Guardar</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-4 border-t border-gray-700 bg-gray-900 text-sm space-y-4">
                                                <div className="flex justify-between items-start border-b border-gray-700 pb-2">
                                                    <div>
                                                        <p className="text-[11px] text-gray-400"><b>Ruta Afectada:</b> {sin.associatedRouteId && Array.isArray(routes) ? routes.find(r=>r.id===sin.associatedRouteId)?.name : `Línea ${sin.conductor?.linea} (Genérico)`}</p>
                                                    </div>
                                                    <button onClick={() => startEditIram(sin)} className="flex items-center gap-1 text-[10px] bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-sky-400"><Edit size={12}/> Editar Fecha/Ruta/Gravedad</button>
                                                </div>
                                                <div><h4 className="text-sky-400 font-bold mb-1 border-b border-gray-700 pb-1">Ubicación y Entorno</h4><p className="text-gray-300"><MapPin size={12} className="inline mr-1"/> {sin.ubicacion?.manual} ({sin.ubicacion?.lugar})</p><p className="text-[11px] text-gray-400 mt-1">Clima: {(Array.isArray(sin.entorno?.climas) ? sin.entorno.climas :[]).join(', ')}</p><p className="text-[11px] text-gray-400">Camino: {(Array.isArray(sin.entorno?.caminos) ? sin.entorno.caminos :[]).join(', ')}</p></div>
                                                <div><h4 className="text-sky-400 font-bold mb-1 border-b border-gray-700 pb-1">Detalles</h4><p className="text-red-400 font-bold mb-1">Gravedad: {sin.descripcion?.gravedad || 'No especificada'}</p><p className="text-gray-300 italic bg-gray-800 p-2 rounded mb-2">"{sin.descripcion?.resumen}"</p><p className="text-xs text-gray-400"><b>Factores:</b> {sin.descripcion?.factoresCausales}</p>
                                                    <div className="mt-2"><p className="text-xs font-bold text-gray-300">Consecuencias:</p><ul className="list-disc list-inside text-[11px] text-gray-400">{(Array.isArray(sin.descripcion?.consecuencias) ? sin.descripcion.consecuencias :[]).filter(c => c.activa).map(c => (<li key={c.tipo}>{c.tipo} {c.cantidad ? `(${c.cantidad})` : ''}</li>))}</ul></div>
                                                </div>
                                                <div><h4 className="text-sky-400 font-bold mb-1 border-b border-gray-700 pb-1">Datos Complementarios</h4><p className="text-gray-300 text-xs"><b>Tercero:</b> {sin.datosComplementarios?.nombreTercero || 'N/A'} - {sin.datosComplementarios?.vehiculoTercero} ({sin.datosComplementarios?.patenteTercero})</p><p className="text-gray-300 text-xs"><b>Seguro:</b> {sin.datosComplementarios?.seguroTercero}</p><p className="text-gray-300 text-xs mt-1"><b>Policía:</b> {sin.datosComplementarios?.intervencionPolicial ? 'Sí' : 'No'}</p>{sin.datosComplementarios?.hayTestigos && <p className="text-gray-300 text-xs italic">Testigos: {sin.datosComplementarios?.testigosInfo}</p>}</div>
                                                {(Array.isArray(sin.images) && sin.images.length > 0) && (<div><h4 className="text-sky-400 font-bold mb-2 border-b border-gray-700 pb-1">Fotografías ({sin.images.length})</h4><div className="grid grid-cols-3 gap-2">{sin.images.map((img, idx) => (<a key={idx} href={img} target="_blank" rel="noreferrer"><img src={img} alt="Siniestro" className="w-full h-16 object-cover rounded border border-gray-600 hover:border-sky-500" /></a>))}</div></div>)}
                                                {sin.driveUrl && (<div className="pt-2"><a href={sin.driveUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-xs"><Folder size={16}/> Carpeta Externa Drive</a></div>)}
                                            </div>
                                        )
                                    )}
                                </div>
                            );
                        } else {
                            // RENDER PARA SINIESTROS MANUALES DE MAPA
                            const risk = item.data as Risk;
                            const rt = Array.isArray(riskTypes) ? riskTypes.find(t => t.id === risk.riskTypeId) : null;
                            return (
                                <div key={risk.id} className={`bg-gray-800 border transition-colors rounded-lg shadow-md overflow-hidden ${selectedSiniestroId === risk.id ? 'border-orange-500' : 'border-gray-700'}`}>
                                    <div className="p-4 cursor-pointer hover:bg-gray-750 flex justify-between items-center" onClick={() => { setSelectedSiniestroId(selectedSiniestroId === risk.id ? null : risk.id); if (risk.position) onFocusPosition(risk.position); }}>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="bg-orange-900 text-orange-300 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide">Carga Manual (Mapa)</span>
                                                <span className="text-xs text-gray-400">{risk.timestamp ? new Date(risk.timestamp).toLocaleString('es-AR') : <span className="text-orange-400 font-bold">Sin fecha (Use Editar)</span>}</span>
                                            </div>
                                            <h3 className="font-bold text-white text-sm" style={{ color: rt?.color }}>{rt?.name || 'Siniestro'}</h3>
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteRisk(risk.id); }} className="text-gray-500 hover:text-red-500 p-2"><Trash2 size={16} /></button>
                                    </div>
                                    
                                    {selectedSiniestroId === risk.id && (
                                        editingId === risk.id ? (
                                            <div className="p-4 border-t border-gray-700 bg-gray-900 text-sm space-y-3">
                                                <label className="block text-[10px] text-gray-400 uppercase">Fecha y Hora</label>
                                                <input type="datetime-local" value={editDate} onChange={e=>setEditDate(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white text-xs outline-none" />
                                                
                                                <label className="block text-[10px] text-gray-400 uppercase mt-2">Gravedad del Siniestro</label>
                                                <select value={editGravedad} onChange={e=>setEditGravedad(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white text-xs outline-none">
                                                    <option value="Leve">Leve</option>
                                                    <option value="Moderado">Moderado</option>
                                                    <option value="Grave">Grave</option>
                                                    <option value="Solo daños materiales">Solo daños materiales</option>
                                                    <option value="Fallecidos">Fallecidos</option>
                                                </select>

                                                <label className="block text-[10px] text-gray-400 uppercase mt-2">Recorrido Afectado (Opcional)</label>
                                                <select value={editRouteId} onChange={e=>setEditRouteId(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white text-xs outline-none">
                                                    <option value="">Ninguno / No aplica</option>
                                                    {Array.isArray(routes) && routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                                </select>
                                                <div className="flex gap-2 justify-end mt-3">
                                                    <button onClick={() => setEditingId(null)} className="px-3 py-1 bg-gray-600 text-white rounded text-xs">Cancelar</button>
                                                    <button onClick={() => saveManualEdit(risk)} className="px-3 py-1 bg-sky-500 text-white rounded text-xs font-bold">Guardar</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-4 border-t border-gray-700 bg-gray-900 text-sm space-y-4">
                                                <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                                                    <p className="text-[11px] text-gray-400"><b>Ruta Afectada:</b> {Array.isArray(risk.associatedRouteIds) && risk.associatedRouteIds[0] && Array.isArray(routes) ? routes.find(r=>r.id===risk.associatedRouteIds[0])?.name : 'No asignada'}</p>
                                                    <button onClick={() => startEditManual(risk)} className="flex items-center gap-1 text-[10px] bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-sky-400"><Edit size={12}/> Editar Fecha/Ruta/Gravedad</button>
                                                </div>
                                                <div><h4 className="text-orange-400 font-bold mb-1 border-b border-gray-700 pb-1">Ubicación y Gravedad</h4><p className="text-gray-300"><MapPin size={12} className="inline mr-1"/> Coordenadas: {risk.position.lat.toFixed(5)}, {risk.position.lng.toFixed(5)}</p><p className="text-red-400 font-bold mt-1">Gravedad: {risk.gravedad || 'No especificada'}</p></div>
                                                <div><h4 className="text-orange-400 font-bold mb-1 border-b border-gray-700 pb-1">Detalles</h4><p className="text-gray-300 italic bg-gray-800 p-2 rounded">"{risk.description}"</p></div>
                                                {(Array.isArray(risk.images) && risk.images.length > 0) && (
                                                    <div>
                                                        <h4 className="text-orange-400 font-bold mb-2 border-b border-gray-700 pb-1">Fotografías ({risk.images.length})</h4>
                                                        <div className="grid grid-cols-3 gap-2">
                                                            {risk.images.map((img, idx) => (
                                                                <a key={idx} href={img} target="_blank" rel="noreferrer"><img src={img} alt="Siniestro" className="w-full h-16 object-cover rounded border border-gray-600 hover:border-sky-500" /></a>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {risk.driveUrl && (
                                                    <div className="pt-2"><a href={risk.driveUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-xs"><Folder size={16}/> Carpeta Externa Drive</a></div>
                                                )}
                                            </div>
                                        ) 
                                    )}
                                </div>
                            );
                        }
                    })
                )}
            </div>
        </div>
    );
};