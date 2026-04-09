import React from 'react';
import type { Siniestro } from '../types';
import { ShieldAlert, Trash2, Folder, MapPin } from 'lucide-react';

interface SiniestrosAdminProps {
    siniestros: Siniestro[];
    handleDeleteSiniestro: (id: string) => void;
    selectedSiniestroId: string | null;
    setSelectedSiniestroId: (id: string | null) => void;
}

export const SiniestrosAdmin: React.FC<SiniestrosAdminProps> = ({ siniestros, handleDeleteSiniestro, selectedSiniestroId, setSelectedSiniestroId }) => {
    return (
        <div className="h-full flex flex-col">
            <h2 className="text-xl font-bold mb-2 text-red-400 flex items-center gap-2"><ShieldAlert /> Reportes de Siniestros</h2>
            <p className="text-xs text-gray-400 mb-4">Registro legal IRAM 3810. Haga clic en un registro para ver las rutas de la línea afectada en el mapa.</p>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {siniestros.length === 0 ? (
                    <div className="text-center py-10 text-gray-500"><ShieldAlert size={40} className="mx-auto mb-2 opacity-50" /><p>No hay siniestros registrados.</p></div>
                ) : (
                    siniestros.map(sin => (
                        <div key={sin.id} className={`bg-gray-800 border transition-colors rounded-lg shadow-md overflow-hidden ${selectedSiniestroId === sin.id ? 'border-red-500' : 'border-gray-700'}`}>
                            <div className="p-4 cursor-pointer hover:bg-gray-750 flex justify-between items-center" onClick={() => setSelectedSiniestroId(selectedSiniestroId === sin.id ? null : sin.id)}>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="bg-red-900 text-red-300 text-[10px] font-bold px-2 py-1 rounded">{sin.descripcion.tipo}</span>
                                        <span className="text-xs text-gray-400">{new Date(sin.fechaHora).toLocaleString()}</span>
                                    </div>
                                    <h3 className="font-bold text-white text-sm">Línea: {sin.conductor.linea} | Interno: {sin.conductor.interno}</h3>
                                    <p className="text-[10px] text-gray-400">{sin.conductor.nombre}</p>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteSiniestro(sin.id); }} className="text-gray-500 hover:text-red-500 p-2"><Trash2 size={16} /></button>
                            </div>

                            {selectedSiniestroId === sin.id && (
                                <div className="p-4 border-t border-gray-700 bg-gray-900 text-sm space-y-4">
                                    <div><h4 className="text-sky-400 font-bold mb-1 border-b border-gray-700 pb-1">Ubicación</h4><p className="text-gray-300"><MapPin size={12} className="inline mr-1"/> {sin.ubicacion.manual} ({sin.ubicacion.lugar})</p></div>
                                    <div><h4 className="text-sky-400 font-bold mb-1 border-b border-gray-700 pb-1">Detalles y Gravedad</h4><p className="text-gray-300 mb-1"><b>Gravedad:</b> {sin.descripcion.gravedad}</p><p className="text-gray-300 italic bg-gray-800 p-2 rounded">"{sin.descripcion.resumen}"</p></div>
                                    {sin.terceros.involucrado && (<div><h4 className="text-sky-400 font-bold mb-1 border-b border-gray-700 pb-1">Tercero Involucrado</h4><p className="text-gray-300"><b>Nombre:</b> {sin.terceros.nombre || 'N/A'}</p><p className="text-gray-300"><b>Vehículo:</b> {sin.terceros.vehiculo} - {sin.terceros.patente}</p><p className="text-gray-300"><b>Seguro:</b> {sin.terceros.seguro}</p></div>)}
                                    <div className="pt-2"><a href={sin.driveUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold"><Folder size={16}/> Ver Fotos en Drive</a></div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};