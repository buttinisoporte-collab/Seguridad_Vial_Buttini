import React, { useState, useMemo, useEffect } from 'react';
import type { Siniestro, InvestigacionData } from '../types';
import { FileSpreadsheet, Save, Search, AlertTriangle, ShieldAlert, MapPin, Edit2, ExternalLink, Image as ImageIcon } from 'lucide-react';

interface SeguimientoAdminProps {
    siniestros: Siniestro[];
    onUpdateSiniestro: (sin: Siniestro) => void;
    selectedSiniestroId: string | null;
    setSelectedSiniestroId: (id: string | null) => void;
    eventosFilterYear: string; setEventosFilterYear: (v: string) => void;
    eventosFilterMonth: string; setEventosFilterMonth: (v: string) => void;
    eventosFilterTipo: string; setEventosFilterTipo: (v: string) => void;
}

export const SeguimientoAdmin: React.FC<SeguimientoAdminProps> = ({ 
    siniestros, onUpdateSiniestro, selectedSiniestroId, setSelectedSiniestroId,
    eventosFilterYear, setEventosFilterYear, eventosFilterMonth, setEventosFilterMonth, eventosFilterTipo, setEventosFilterTipo
}) => {
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedSin, setSelectedSin] = useState<Siniestro | null>(null);
    const [inv, setInv] = useState<InvestigacionData>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [isEditingVideo, setIsEditingVideo] = useState(false);
    const [photoModal, setPhotoModal] = useState<string | null>(null);
    const years = Array.from({ length: new Date().getFullYear() - 2020 + 2 }, (_, i) => (2020 + i).toString());

    const filteredList = useMemo(() => {
        let list = Array.isArray(siniestros) ? [...siniestros] : [];
        if (eventosFilterYear) {
            list = list.filter(item => {
                const itemDate = new Date(item.fechaHora || item.timestamp);
                return itemDate.getFullYear().toString() === eventosFilterYear && (!eventosFilterMonth || (itemDate.getMonth() + 1).toString() === eventosFilterMonth);
            });
        }
        if (eventosFilterTipo) list = list.filter(s => (s.tipoEvento || 'Siniestro') === eventosFilterTipo);
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            list = list.filter(s => s.conductor?.nombre?.toLowerCase().includes(lower) || s.conductor?.linea?.toLowerCase().includes(lower) || s.conductor?.interno?.toLowerCase().includes(lower) || s.investigacion?.numeroSiniestro?.toLowerCase().includes(lower));
        }
        return list.sort((a, b) => b.timestamp - a.timestamp);
    }, [siniestros, eventosFilterTipo, eventosFilterYear, eventosFilterMonth, searchTerm]);

    useEffect(() => {
        if (selectedSiniestroId) {
            const match = siniestros.find(s => s.id === selectedSiniestroId);
            if (match) {
                setSelectedSin(match); setInv(match.investigacion || {}); setIsDirty(false); setIsEditingVideo(false);
            }
        } else { setSelectedSin(null); setInv({}); setIsDirty(false); }
    }, [selectedSiniestroId, siniestros]);

    const handleSelectRow = (id: string | null) => {
        if (isDirty) {
            if (!window.confirm("Tiene cambios sin guardar en la Información Complementaria.\n\nPresione Aceptar para PERDER LOS CAMBIOS y cambiar de registro.\nPresione Cancelar para QUEDARSE AQUÍ y guardar.")) return;
        }
        setSelectedSiniestroId(id);
    };

    const requiredVictims = useMemo(() => {
        if (!selectedSin?.descripcion?.consecuencias) return [];
        const victims: { id: string, label: string }[] = [];
        selectedSin.descripcion.consecuencias.forEach(c => {
            if (c.activa && c.tipo !== 'Solo daños materiales') {
                const count = parseInt(c.cantidad) || 0;
                for (let i = 0; i < count; i++) victims.push({ id: `${c.tipo}-${i}`, label: `${c.tipo} (${i + 1} de ${count})` });
            }
        });
        return victims;
    }, [selectedSin]);

    const handleInvChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setInv(prev => ({ ...prev, [e.target.name]: e.target.value })); setIsDirty(true);
    };

    const handleVictimChange = (id: string, field: string, value: string) => {
        setInv(prev => {
            const currentVictimas = prev.victimasDetalle ? [...prev.victimasDetalle] : [];
            const index = currentVictimas.findIndex(v => v.id === id);
            if (index >= 0) currentVictimas[index] = { ...currentVictimas[index], [field]: value };
            else currentVictimas.push({ id, nombre: field === 'nombre' ? value : '', dni: field === 'dni' ? value : '', domicilio: field === 'domicilio' ? value : '', telefono: field === 'telefono' ? value : '', correo: field === 'correo' ? value : '' });
            return { ...prev, victimasDetalle: currentVictimas };
        });
        setIsDirty(true);
    };

    const handleSave = async () => {
        if (!selectedSin) return;
        setIsSaving(true);
        try {
            const updatedSin: Siniestro = { ...selectedSin, investigacion: inv };
            onUpdateSiniestro(updatedSin); setSelectedSin(updatedSin); setIsDirty(false);
            alert("Información Complementaria guardada exitosamente.");
        } catch (error) { alert("Error al guardar los datos."); }
        setIsSaving(false);
    };

    return (
        <div className="flex h-full w-full text-white">
            {photoModal && (
                <div onClick={() => setPhotoModal(null)} className="fixed inset-0 z-[99999] bg-black/95 flex items-center justify-center p-4 cursor-pointer">
                    <img src={photoModal} alt="Ampliada" className="max-w-full max-h-full object-contain rounded border border-gray-700 shadow-2xl" />
                    <button className="absolute top-6 right-6 text-white bg-red-600 rounded-full p-2 hover:bg-red-500"><X size={24}/></button>
                </div>
            )}

            <div className="w-[35%] flex flex-col bg-[#111827] border-r border-gray-700 flex-shrink-0">
                <div className="p-4 border-b border-gray-700 bg-gray-900/50">
                    <h2 className="text-lg font-bold mb-2 text-emerald-400 flex items-center gap-2"><FileSpreadsheet size={20}/> Seguimiento de Eventos</h2>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                        <div className="col-span-2 relative">
                            <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                            <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); if(isDirty && !window.confirm("Perderá los cambios si busca otro registro. ¿Continuar?")) return; }} className="w-full bg-gray-900 border border-gray-600 rounded p-1.5 pl-8 text-xs outline-none focus:border-emerald-500" />
                        </div>
                        <select value={eventosFilterTipo} onChange={e => handleSelectRow(null) ?? setEventosFilterTipo(e.target.value)} className="bg-gray-900 border border-gray-600 rounded p-1.5 text-xs outline-none focus:border-emerald-500">
                            <option value="">Siniestros e Incidentes</option>
                            <option value="Siniestro">Siniestros</option>
                            <option value="Incidente">Incidentes</option>
                        </select>
                        <div className="flex gap-1">
                            <select value={eventosFilterYear} onChange={e => handleSelectRow(null) ?? setEventosFilterYear(e.target.value)} className="bg-gray-900 border border-gray-600 rounded p-1.5 text-xs outline-none focus:border-emerald-500 w-1/2"><option value="">Año</option>{years.map(y => <option key={y} value={y}>{y}</option>)}</select>
                            <select value={eventosFilterMonth} onChange={e => handleSelectRow(null) ?? setEventosFilterMonth(e.target.value)} disabled={!eventosFilterYear} className="bg-gray-900 border border-gray-600 rounded p-1.5 text-xs outline-none focus:border-emerald-500 w-1/2 disabled:opacity-50"><option value="">Mes</option>{Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m.toString()}>{m.toString().padStart(2, '0')}</option>)}</select>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-900 border-b border-gray-700 text-[9px] uppercase tracking-wider text-gray-400 sticky top-0 z-10">
                                <th className="p-2 font-bold">Fecha</th><th className="p-2 font-bold">Tipo</th><th className="p-2 font-bold">Línea/Int.</th><th className="p-2 font-bold">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="text-[11px] divide-y divide-gray-700/50">
                            {filteredList.map(sin => {
                                const isIncidente = sin.tipoEvento === 'Incidente';
                                const estado = sin.investigacion?.estadoReclamo || 'Pendiente';
                                return (
                                    <tr key={sin.id} onClick={() => handleSelectRow(selectedSin?.id === sin.id ? null : sin.id)} className={`cursor-pointer transition-colors hover:bg-gray-700/50 ${selectedSin?.id === sin.id ? 'bg-emerald-900/30' : ''}`}>
                                        <td className="p-2 text-gray-300 whitespace-nowrap">{new Date(sin.fechaHora).toLocaleDateString('es-AR')}</td>
                                        <td className="p-2"><span className={`px-1 py-0.5 rounded text-[8px] font-bold uppercase ${isIncidente ? 'bg-yellow-900/50 text-yellow-500' : 'bg-red-900/50 text-red-400'}`}>{isIncidente ? 'INC' : 'SIN'}</span></td>
                                        <td className="p-2 text-gray-300 max-w-[80px] truncate" title={`${sin.conductor?.linea} (Int: ${sin.conductor?.interno})`}>{sin.conductor?.interno}</td>
                                        <td className="p-2"><span className={`px-1 py-0.5 rounded text-[8px] font-bold ${estado === 'Cerrado' ? 'bg-green-900/50 text-green-400' : estado === 'Legales' ? 'bg-orange-900/50 text-orange-400' : 'bg-gray-700 text-gray-300'}`}>{estado}</span></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex-1 bg-black flex flex-col relative overflow-hidden">
                {!selectedSin ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-600"><FileSpreadsheet size={80} className="mb-4 opacity-50" /><p className="text-xl font-bold">Seleccione un registro</p></div>
                ) : (
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 w-full">
                        <div className="mb-6 flex justify-between items-end border-b border-gray-800 pb-4">
                            <div>
                                <h1 className="text-2xl font-bold text-emerald-400 mb-1">Información Complementaria</h1>
                                <div className="flex items-center gap-3 text-sm text-gray-400"><span className={`px-2 py-1 rounded font-bold text-xs uppercase ${selectedSin.tipoEvento === 'Incidente' ? 'bg-yellow-900 text-yellow-400' : 'bg-red-900 text-red-400'}`}>{selectedSin.tipoEvento === 'Incidente' ? 'Incidente' : 'Siniestro'}</span><span>Fecha: {new Date(selectedSin.fechaHora).toLocaleString('es-AR')}</span></div>
                            </div>
                            <a href={`https://www.google.com/maps/search/?api=1&query=${selectedSin.ubicacion.lat},${selectedSin.ubicacion.lng}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-bold text-sm transition-colors"><MapPin size={16}/> Ver en Google Maps</a>
                        </div>

                        {/* RELEVAMIENTO INICIAL (FULL) */}
                        <div className="bg-gray-900 p-5 rounded-xl border border-gray-700 mb-6 text-sm shadow-lg">
                            <h4 className="text-gray-400 font-bold mb-3 border-b border-gray-700 pb-1 uppercase text-xs tracking-wider flex justify-between"><span>Relevamiento Inicial con el Formulario</span> <span className="text-[10px] text-gray-500 font-normal">Solo Lectura</span></h4>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-gray-300 mb-4">
                                <div><p className="text-[10px] text-gray-500 uppercase">Conductor</p><p className="font-bold text-white">{selectedSin.conductor?.nombre || '-'}</p></div>
                                <div><p className="text-[10px] text-gray-500 uppercase">Legajo / DNI</p><p className="font-bold text-white">{selectedSin.conductor?.legajo || '-'}</p></div>
                                <div><p className="text-[10px] text-gray-500 uppercase">Unidad / Línea</p><p className="font-bold text-white">Int: {selectedSin.conductor?.interno} | L: {selectedSin.conductor?.linea}</p></div>
                                <div><p className="text-[10px] text-gray-500 uppercase">Ubicación (Manual / GPS)</p><p className="truncate" title={selectedSin.ubicacion?.manual}>{selectedSin.ubicacion?.manual || '-'} ({selectedSin.ubicacion?.lugar})</p></div>
                                
                                <div><p className="text-[10px] text-gray-500 uppercase">Visibilidad</p><p>{selectedSin.entorno?.visibilidades?.join(', ') || 'N/A'}</p></div>
                                <div><p className="text-[10px] text-gray-500 uppercase">Clima</p><p>{selectedSin.entorno?.climas?.join(', ') || 'N/A'}</p></div>
                                <div><p className="text-[10px] text-gray-500 uppercase">Condición del Camino</p><p>{selectedSin.entorno?.caminos?.join(', ') || 'N/A'}</p></div>
                                <div><p className="text-[10px] text-gray-500 uppercase">Gravedad / Tipo</p><p className={selectedSin.tipoEvento === 'Incidente' ? 'text-yellow-400' : 'text-red-400'}>{selectedSin.descripcion?.gravedad} | {selectedSin.descripcion?.tipo}</p></div>
                                
                                <div className="col-span-2 lg:col-span-4"><p className="text-[10px] text-gray-500 uppercase">Resumen del Hecho</p><p className="italic bg-black p-3 rounded mt-1 text-sm">"{selectedSin.descripcion?.resumen}"</p></div>
                                <div className="col-span-2 lg:col-span-4"><p className="text-[10px] text-gray-500 uppercase">Factores Causales Indicados</p><p className="font-bold">{selectedSin.descripcion?.factoresCausales || '-'}</p></div>
                            </div>

                            {Array.isArray(selectedSin.images) && selectedSin.images.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-800">
                                    <p className="text-[10px] text-gray-500 uppercase mb-2">Registro Fotográfico ({selectedSin.images.length}) - Clic para ampliar</p>
                                    <div className="flex gap-3 overflow-x-auto pb-2">
                                        {selectedSin.images.map((img, i) => (
                                            <div key={i} onClick={() => setPhotoModal(img)} className="w-24 h-24 flex-shrink-0 cursor-pointer border border-gray-700 rounded-lg overflow-hidden hover:border-emerald-500 transition-colors relative group"><img src={img} alt="Foto" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ImageIcon size={24} className="text-white"/></div></div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* FORMULARIO DE INFORMACIÓN COMPLEMENTARIA */}
                        <div className="space-y-6 text-sm">
                            <div className="bg-[#111827] p-6 rounded-xl border border-gray-800 shadow-lg">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mb-5">
                                    <div><label className="block text-[10px] text-emerald-500 font-bold uppercase mb-1">Zona</label><input type="text" name="zona" value={inv.zona || ''} onChange={handleInvChange} className="w-full bg-black border border-gray-700 rounded p-2.5 text-white outline-none focus:border-emerald-500" /></div>
                                    <div><label className="block text-[10px] text-emerald-500 font-bold uppercase mb-1">N° de Siniestro / Exp.</label><input type="text" name="numeroSiniestro" value={inv.numeroSiniestro || ''} onChange={handleInvChange} className="w-full bg-black border border-gray-700 rounded p-2.5 text-emerald-400 font-bold outline-none focus:border-emerald-500" /></div>
                                    <div><label className="block text-[10px] text-emerald-500 font-bold uppercase mb-1">Grupo</label><input type="text" name="grupo" value={inv.grupo || ''} onChange={handleInvChange} className="w-full bg-black border border-gray-700 rounded p-2.5 text-white outline-none focus:border-emerald-500" /></div>
                                    
                                    <div><label className="block text-[10px] text-gray-400 uppercase mb-1">Tipo de Servicio</label><input type="text" name="tipoServicio" value={inv.tipoServicio || selectedSin.conductor?.linea || ''} onChange={handleInvChange} className="w-full bg-black border border-gray-700 rounded p-2.5 text-white outline-none focus:border-emerald-500" /></div>
                                    <div><label className="block text-[10px] text-gray-400 uppercase mb-1">Dominio (Vehículo)</label><input type="text" name="dominio" value={inv.dominio || ''} onChange={handleInvChange} className="w-full bg-black border border-gray-700 rounded p-2.5 text-white outline-none focus:border-emerald-500" /></div>
                                    <div><label className="block text-[10px] text-gray-400 uppercase mb-1">Sector Dañado de la Unidad</label><input type="text" name="sectorDanado" value={inv.sectorDanado || ''} onChange={handleInvChange} className="w-full bg-black border border-gray-700 rounded p-2.5 text-white outline-none focus:border-emerald-500" /></div>
                                </div>

                                <div className="mb-5"><label className="block text-[10px] text-gray-400 uppercase mb-1">Acción Correctiva (Empresa)</label><textarea name="accionCorrectiva" rows={2} value={inv.accionCorrectiva || ''} onChange={handleInvChange} className="w-full bg-black border border-gray-700 rounded p-2.5 text-white outline-none focus:border-emerald-500" /></div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5 items-end">
                                    <div><label className="block text-[10px] text-emerald-500 font-bold uppercase mb-1">Presentó Reclamo</label><select name="presentoReclamo" value={inv.presentoReclamo || ''} onChange={handleInvChange} className="w-full bg-black border border-gray-700 rounded p-2.5 text-white outline-none focus:border-emerald-500"><option value="">Seleccione...</option><option value="Si">Sí</option><option value="No">No</option></select></div>
                                    <div className="col-span-2">
                                        <label className="block text-[10px] text-gray-400 uppercase mb-1">Video Cámara (Link Nube/Drive)</label>
                                        {isEditingVideo ? (
                                            <div className="flex gap-2"><input type="text" name="linkVideoCamara" value={inv.linkVideoCamara || ''} onChange={handleInvChange} className="w-full bg-black border border-gray-700 rounded p-2.5 text-sky-400 font-mono text-sm outline-none focus:border-emerald-500" placeholder="https://..." /><button onClick={() => setIsEditingVideo(false)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 rounded font-bold">OK</button></div>
                                        ) : (
                                            <div className="flex items-center justify-between bg-black border border-gray-700 rounded p-2.5">
                                                {inv.linkVideoCamara ? <a href={inv.linkVideoCamara} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline flex items-center gap-1 font-mono text-xs truncate"><ExternalLink size={14}/> {inv.linkVideoCamara}</a> : <span className="text-gray-600 italic text-xs">Sin link cargado</span>}
                                                <button onClick={() => setIsEditingVideo(true)} className="text-gray-400 hover:text-white flex items-center gap-1 text-xs"><Edit2 size={12}/> Modificar</button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mb-5"><label className="block text-[10px] text-gray-400 uppercase mb-1">Ampliación de Declaración</label><textarea name="ampliacionDeclaracion" rows={3} value={inv.ampliacionDeclaracion || ''} onChange={handleInvChange} className="w-full bg-black border border-gray-700 rounded p-2.5 text-white outline-none focus:border-emerald-500" /></div>
                                <div className="mb-5"><label className="block text-[10px] text-gray-400 uppercase mb-1">Ampliación del lugar de ocurrencia</label><textarea name="ampliacionLugar" rows={3} value={inv.ampliacionLugar || ''} onChange={handleInvChange} className="w-full bg-black border border-gray-700 rounded p-2.5 text-white outline-none focus:border-emerald-500" /></div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-5 pt-5 border-t border-gray-800">
                                    <div><label className="block text-[10px] text-emerald-500 font-bold uppercase mb-1">Estado Amd</label><input type="text" name="estadoAmd" value={inv.estadoAmd || ''} onChange={handleInvChange} className="w-full bg-black border border-gray-700 rounded p-2.5 text-white outline-none focus:border-emerald-500" /></div>
                                    <div><label className="block text-[10px] text-emerald-500 font-bold uppercase mb-1">Estado Judicial</label><input type="text" name="estadoJudicial" value={inv.estadoJudicial || ''} onChange={handleInvChange} className="w-full bg-black border border-gray-700 rounded p-2.5 text-white outline-none focus:border-emerald-500" /></div>
                                    <div><label className="block text-[10px] text-emerald-500 font-bold uppercase mb-1">Responsabilidad Final</label><input type="text" name="responsabilidadFinal" value={inv.responsabilidadFinal || ''} onChange={handleInvChange} className="w-full bg-black border border-gray-700 rounded p-2.5 text-white outline-none focus:border-emerald-500" /></div>
                                    <div><label className="block text-[10px] text-emerald-500 font-bold uppercase mb-1">Resp. a nivel C.S.V.</label><input type="text" name="responsabilidadCsv" value={inv.responsabilidadCsv || ''} onChange={handleInvChange} className="w-full bg-black border border-gray-700 rounded p-2.5 text-white outline-none focus:border-emerald-500" /></div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-5">
                                    <div><label className="block text-[10px] text-gray-400 uppercase mb-1">Franquicia ($)</label><input type="text" name="franquicia" value={inv.franquicia || ''} onChange={handleInvChange} className="w-full bg-black border border-gray-700 rounded p-2.5 text-white outline-none focus:border-emerald-500" /></div>
                                    <div className="col-span-2"><label className="block text-[10px] text-gray-400 uppercase mb-1">Seguro N° y Compañía del 3ro</label><input type="text" name="seguroTercero" value={inv.seguroTercero || (selectedSin.datosComplementarios?.seguroTercero ? `${selectedSin.datosComplementarios?.seguroTercero} - Póliza: ${selectedSin.datosComplementarios?.polizaTercero}` : '')} onChange={handleInvChange} className="w-full bg-black border border-gray-700 rounded p-2.5 text-white outline-none focus:border-emerald-500" /></div>
                                    <div><label className="block text-[10px] text-gray-400 uppercase mb-1">Ofrecimiento Empresa ($)</label><input type="text" name="ofrecimiento" value={inv.ofrecimiento || ''} onChange={handleInvChange} className="w-full bg-black border border-gray-700 rounded p-2.5 text-white outline-none focus:border-emerald-500" /></div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                                    <div><label className="block text-[10px] text-gray-400 uppercase mb-1">Pretensiones ($)</label><input type="text" name="pretension" value={inv.pretension || ''} onChange={handleInvChange} className="w-full bg-black border border-gray-700 rounded p-2.5 text-white outline-none focus:border-emerald-500" /></div>
                                    <div><label className="block text-[10px] text-emerald-500 font-bold uppercase mb-1">Estado Reclamo</label><select name="estadoReclamo" value={inv.estadoReclamo || ''} onChange={handleInvChange} className="w-full bg-black border border-gray-700 rounded p-2.5 text-white outline-none focus:border-emerald-500"><option value="Pendiente">Pendiente</option><option value="En Análisis">En Análisis</option><option value="En Negociación">En Negociación</option><option value="Legales">Legales / Mediación</option><option value="Cerrado">Cerrado</option></select></div>
                                    <div><label className="block text-[10px] text-gray-400 uppercase mb-1">Abonado por empresa ($)</label><input type="text" name="abonado" value={inv.abonado || ''} onChange={handleInvChange} className="w-full bg-black border border-gray-700 rounded p-2.5 text-white outline-none focus:border-emerald-500" /></div>
                                </div>
                            </div>

                            {/* CAMPOS DINÁMICOS PARA VÍCTIMAS */}
                            {requiredVictims.length > 0 && (
                                <div className="bg-[#111827] p-6 rounded-xl border border-red-900/50 shadow-lg">
                                    <h4 className="text-red-400 font-bold mb-5 border-b border-gray-800 pb-2 uppercase text-sm tracking-wider">
                                        <AlertTriangle size={18} className="inline mr-2" /> Registro de Víctimas
                                    </h4>
                                    {requiredVictims.map((v) => {
                                        const existing = (inv.victimasDetalle || []).find(vd => vd.id === v.id) || { nombre: '', dni: '', domicilio: '', telefono: '', correo: '' };
                                        return (
                                            <div key={v.id} className="mb-4 p-5 bg-black rounded-lg border border-gray-800">
                                                <div className="text-sm font-bold text-red-300 mb-3 border-b border-gray-800 pb-2">{v.label}</div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <div><label className="block text-[10px] text-gray-500 uppercase mb-1">Nombre y Apellido</label><input type="text" value={existing.nombre} onChange={(e) => handleVictimChange(v.id, 'nombre', e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white outline-none focus:border-red-500" /></div>
                                                    <div><label className="block text-[10px] text-gray-500 uppercase mb-1">DNI</label><input type="text" value={existing.dni} onChange={(e) => handleVictimChange(v.id, 'dni', e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white outline-none focus:border-red-500" /></div>
                                                    <div><label className="block text-[10px] text-gray-500 uppercase mb-1">Teléfono</label><input type="text" value={existing.telefono || ''} onChange={(e) => handleVictimChange(v.id, 'telefono', e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white outline-none focus:border-red-500" /></div>
                                                    <div className="md:col-span-2"><label className="block text-[10px] text-gray-500 uppercase mb-1">Domicilio</label><input type="text" value={existing.domicilio || ''} onChange={(e) => handleVictimChange(v.id, 'domicilio', e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white outline-none focus:border-red-500" /></div>
                                                    <div><label className="block text-[10px] text-gray-500 uppercase mb-1">Correo Electrónico</label><input type="text" value={existing.correo || ''} onChange={(e) => handleVictimChange(v.id, 'correo', e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white outline-none focus:border-red-500" /></div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}

                            <div className="pt-6 pb-20">
                                <button onClick={handleSave} disabled={isSaving} className={`w-full md:w-auto px-10 py-4 rounded-lg font-bold text-lg text-white transition-colors flex items-center justify-center gap-3 ${isSaving ? 'bg-gray-600' : 'bg-emerald-600 hover:bg-emerald-500'}`}>
                                    <Save size={24} /> {isSaving ? 'Guardando...' : 'Guardar Información Complementaria'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};