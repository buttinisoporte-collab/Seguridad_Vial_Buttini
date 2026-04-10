import React, { useMemo } from 'react';
import type { Siniestro, Risk, RiskType } from '../types';
import { ShieldAlert, Trash2, Folder, MapPin } from 'lucide-react';

interface SiniestrosAdminProps {
    siniestros: Siniestro[];
    incidentRisks: Risk[];
    riskTypes: RiskType[];
    handleDeleteSiniestro: (id: string) => void;
    handleDeleteRisk: (id: string) => void;
    selectedSiniestroId: string | null;
    setSelectedSiniestroId: (id: string | null) => void;
}

export const SiniestrosAdmin: React.FC<SiniestrosAdminProps> = ({ 
    siniestros, incidentRisks, riskTypes, handleDeleteSiniestro, handleDeleteRisk, selectedSiniestroId, setSelectedSiniestroId 
}) => {
    
    // Unificar y ordenar ambas listas (IRAM y Manuales del Mapa)
    const unifiedList = useMemo(() => {
        const list =[
            ...siniestros.map(s => ({ type: 'iram', data: s as any, ts: s.timestamp })),
            ...incidentRisks.map(r => ({ type: 'manual', data: r as any, ts: r.timestamp || 0 }))
        ];
        return list.sort((a, b) => b.ts - a.ts);
    },[siniestros, incidentRisks]);

    return (
        <div className="h-full flex flex-col">
            <h2 className="text-xl font-bold mb-2 text-red-400 flex items-center gap-2"><ShieldAlert /> Reportes de Siniestros</h2>
            <p className="text-xs text-gray-400 mb-4">Registro unificado (Protocolo IRAM y Cargas en Mapa). Haga clic en un registro para ver las rutas afectadas.</p>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {unifiedList.length === 0 ? (
                    <div className="text-center py-10 text-gray-500"><ShieldAlert size={40} className="mx-auto mb-2 opacity-50" /><p>No hay siniestros registrados.</p></div>
                ) : (
                    unifiedList.map(item => {
                        if (item.type === 'iram') {
                            const sin = item.data as Siniestro;
                            return (
                                <div key={sin.id} className={`bg-gray-800 border transition-colors rounded-lg shadow-md overflow-hidden ${selectedSiniestroId === sin.id ? 'border-red-500' : 'border-gray-700'}`}>
                                    <div className="p-4 cursor-pointer hover:bg-gray-750 flex justify-between items-center" onClick={() => setSelectedSiniestroId(selectedSiniestroId === sin.id ? null : sin.id)}>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="bg-red-900 text-red-300 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide">Formulario IRAM</span>
                                                <span className="text-xs text-gray-400">{new Date(sin.fechaHora).toLocaleString()}</span>
                                            </div>
                                            <h3 className="font-bold text-white text-sm">Línea: {sin.conductor?.linea} | Interno: {sin.conductor?.interno}</h3>
                                            <p className="text-[10px] text-gray-400">{sin.conductor?.nombre}</p>
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteSiniestro(sin.id); }} className="text-gray-500 hover:text-red-500 p-2"><Trash2 size={16} /></button>
                                    </div>

                                    {selectedSiniestroId === sin.id && (
                                        <div className="p-4 border-t border-gray-700 bg-gray-900 text-sm space-y-4">
                                            <div><h4 className="text-sky-400 font-bold mb-1 border-b border-gray-700 pb-1">Ubicación y Entorno</h4>
                                                <p className="text-gray-300"><MapPin size={12} className="inline mr-1"/> {sin.ubicacion?.manual} ({sin.ubicacion?.lugar})</p>
                                                <p className="text-[11px] text-gray-400 mt-1">Clima: {(sin.entorno?.climas ||[]).join(', ')}</p>
                                                <p className="text-[11px] text-gray-400">Camino: {(sin.entorno?.caminos ||[]).join(', ')}</p>
                                            </div>
                                            
                                            <div><h4 className="text-sky-400 font-bold mb-1 border-b border-gray-700 pb-1">Detalles</h4>
                                                <p className="text-gray-300 mb-1"><b>Gravedad:</b> {sin.descripcion?.gravedad}</p>
                                                <p className="text-gray-300 italic bg-gray-800 p-2 rounded mb-2">"{sin.descripcion?.resumen}"</p>
                                                <p className="text-xs text-gray-400"><b>Factores:</b> {sin.descripcion?.factoresCausales}</p>
                                                <div className="mt-2">
                                                    <p className="text-xs font-bold text-gray-300">Consecuencias registradas:</p>
                                                    <ul className="list-disc list-inside text-[11px] text-gray-400">
                                                        {(sin.descripcion?.consecuencias ||[]).filter(c => c.activa).map(c => (
                                                            <li key={c.tipo}>{c.tipo} {c.cantidad ? `(${c.cantidad})` : ''}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <h4 className="text-sky-400 font-bold mb-1 border-b border-gray-700 pb-1">Datos Complementarios</h4>
                                                <p className="text-gray-300 text-xs"><b>Tercero:</b> {sin.datosComplementarios?.nombreTercero || 'N/A'} - {sin.datosComplementarios?.vehiculoTercero} ({sin.datosComplementarios?.patenteTercero})</p>
                                                <p className="text-gray-300 text-xs"><b>Seguro:</b> {sin.datosComplementarios?.seguroTercero}</p>
                                                <p className="text-gray-300 text-xs mt-1"><b>Policía:</b> {sin.datosComplementarios?.intervencionPolicial ? 'Sí' : 'No'}</p>
                                                {sin.datosComplementarios?.hayTestigos && <p className="text-gray-300 text-xs italic">Testigos: {sin.datosComplementarios?.testigosInfo}</p>}
                                            </div>

                                            {(Array.isArray(sin.images) && sin.images.length > 0) && (
                                                <div>
                                                    <h4 className="text-sky-400 font-bold mb-2 border-b border-gray-700 pb-1">Fotografías ({sin.images.length})</h4>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {sin.images.map((img, idx) => (
                                                            <a key={idx} href={img} target="_blank" rel="noreferrer">
                                                                <img src={img} alt="Siniestro" className="w-full h-16 object-cover rounded border border-gray-600 hover:border-sky-500" />
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {sin.driveUrl && (
                                                <div className="pt-2"><a href={sin.driveUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-xs"><Folder size={16}/> Carpeta Externa Drive</a></div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        } else {
                            // RENDER PARA SINIESTROS MANUALES DE MAPA
                            const risk = item.data as Risk;
                            const rt = riskTypes.find(t => t.id === risk.riskTypeId);
                            return (
                                <div key={risk.id} className={`bg-gray-800 border transition-colors rounded-lg shadow-md overflow-hidden ${selectedSiniestroId === risk.id ? 'border-orange-500' : 'border-gray-700'}`}>
                                    <div className="p-4 cursor-pointer hover:bg-gray-750 flex justify-between items-center" onClick={() => setSelectedSiniestroId(selectedSiniestroId === risk.id ? null : risk.id)}>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="bg-orange-900 text-orange-300 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide">Carga Manual (Mapa)</span>
                                                <span className="text-xs text-gray-400">{risk.timestamp ? new Date(risk.timestamp).toLocaleString() : 'Sin fecha'}</span>
                                            </div>
                                            <h3 className="font-bold text-white text-sm" style={{ color: rt?.color }}>{rt?.name || 'Siniestro'}</h3>
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteRisk(risk.id); }} className="text-gray-500 hover:text-red-500 p-2"><Trash2 size={16} /></button>
                                    </div>
                                    
                                    {selectedSiniestroId === risk.id && (
                                        <div className="p-4 border-t border-gray-700 bg-gray-900 text-sm space-y-4">
                                            <div><h4 className="text-orange-400 font-bold mb-1 border-b border-gray-700 pb-1">Ubicación</h4><p className="text-gray-300"><MapPin size={12} className="inline mr-1"/> Coordenadas: {risk.position.lat.toFixed(5)}, {risk.position.lng.toFixed(5)}</p></div>
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