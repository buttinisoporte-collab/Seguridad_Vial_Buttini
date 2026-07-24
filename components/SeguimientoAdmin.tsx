import React, { useState, useMemo, useEffect } from 'react';
import type { Siniestro, InvestigacionData, User } from '../types';
import { FileSpreadsheet, Save, Search, AlertTriangle, ShieldAlert, MapPin, Edit2, ExternalLink, Image as ImageIcon, Printer, Lock, Unlock } from 'lucide-react';

interface SeguimientoAdminProps {
    currentUser: User;
    siniestros: Siniestro[];
    onUpdateSiniestro: (sin: Siniestro) => void;
    selectedSiniestroId: string | null;
    setSelectedSiniestroId: (id: string | null) => void;
    eventosFilterYear: string; setEventosFilterYear: (v: string) => void;
    eventosFilterMonth: string; setEventosFilterMonth: (v: string) => void;
    eventosFilterTipo: string; setEventosFilterTipo: (v: string) => void;
}

export const SeguimientoAdmin: React.FC<SeguimientoAdminProps> = ({ 
    currentUser, siniestros, onUpdateSiniestro, selectedSiniestroId, setSelectedSiniestroId,
    eventosFilterYear, setEventosFilterYear, eventosFilterMonth, setEventosFilterMonth, eventosFilterTipo, setEventosFilterTipo
}) => {
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedSin, setSelectedSin] = useState<Siniestro | null>(null);
    const [inv, setInv] = useState<InvestigacionData>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [isEditingVideo, setIsEditingVideo] = useState(false);
    const [photoModal, setPhotoModal] = useState<string | null>(null);
    
    // Vista Activa (CRM vs Informe de Investigacion)
    const [activeView, setActiveView] = useState<'crm' | 'investigacion'>('crm');

    const years = Array.from({ length: new Date().getFullYear() - 2020 + 2 }, (_, i) => (2020 + i).toString());

    const filteredList = useMemo(() => {
        let list = Array.isArray(siniestros) ? [...siniestros] : [];
        if (eventosFilterYear) list = list.filter(item => { const itemDate = new Date(item.fechaHora || item.timestamp); return itemDate.getFullYear().toString() === eventosFilterYear && (!eventosFilterMonth || (itemDate.getMonth() + 1).toString() === eventosFilterMonth); });
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
                // Hacemos una copia profunda para edición sin afectar el estado principal hasta guardar
                setSelectedSin(JSON.parse(JSON.stringify(match)));
                
                // Lógica de cruce de evidencias automático
                const loadedInv = { ...(match.investigacion || {}) };
                const currentEvidencias = loadedInv.evidencias || [];
                if (match.images && match.images.length > 0 && !currentEvidencias.includes('Fotografías')) currentEvidencias.push('Fotografías');
                if (loadedInv.linkVideoCamara && !currentEvidencias.includes('Videos')) currentEvidencias.push('Videos');
                loadedInv.evidencias = currentEvidencias;
                
                setInv(loadedInv);
                setIsDirty(false); setIsEditingVideo(false);
            }
        } else { setSelectedSin(null); setInv({}); setIsDirty(false); }
    }, [selectedSiniestroId, siniestros]);

    const handleSelectRow = (id: string | null, view: 'crm'|'investigacion' = 'crm') => {
        if (isDirty) {
            if (!window.confirm("Tiene cambios sin guardar.\n\nPresione Aceptar para PERDER LOS CAMBIOS.\nPresione Cancelar para QUEDARSE AQUÍ.")) return;
        }
        setActiveView(view);
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

    // MANEJO DE CAMBIOS
    const handleInvChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { setInv(prev => ({ ...prev, [e.target.name]: e.target.value })); setIsDirty(true); };
    
    // Manejo de Cambios del Siniestro Original (Solo aplicable en Vista de Investigación)
    const handleSinOriginalChange = (group: string, field: string, value: string) => {
        if (!selectedSin) return;
        setSelectedSin(prev => {
            if (!prev) return prev;
            const updated = { ...prev };
            if (group === 'root') updated[field as keyof Siniestro] = value as never;
            else if (group === 'ubicacion' && updated.ubicacion) updated.ubicacion[field as 'manual'|'lugar'] = value;
            else if (group === 'conductor' && updated.conductor) updated.conductor[field as 'nombre'|'legajo'|'interno'|'linea'] = value;
            else if (group === 'descripcion' && updated.descripcion) updated.descripcion[field as 'tipo'|'resumen'] = value;
            return updated;
        });
        setIsDirty(true);
    };

    const handleEvidenciaToggle = (ev: string) => {
        setInv(prev => {
            const list = prev.evidencias || [];
            return { ...prev, evidencias: list.includes(ev) ? list.filter(i => i !== ev) : [...list, ev] };
        });
        setIsDirty(true);
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

    const handleSave = async (finalizar: boolean = false) => {
        if (!selectedSin) return;
        setIsSaving(true);
        try {
            const updatedInv = { ...inv };
            if (finalizar) updatedInv.estadoInvestigacion = 'Finalizada';
            else if (!updatedInv.estadoInvestigacion || updatedInv.estadoInvestigacion === 'Pendiente') updatedInv.estadoInvestigacion = 'En Curso';

            const updatedSin: Siniestro = { ...selectedSin, investigacion: updatedInv };
            onUpdateSiniestro(updatedSin);
            setSelectedSin(updatedSin); setInv(updatedInv); setIsDirty(false);
            alert(finalizar ? "Investigación Finalizada y bloqueada con éxito." : "Datos guardados exitosamente.");
        } catch (error) { alert("Error al guardar los datos."); }
        setIsSaving(false);
    };

    const handlePrint = () => {
        window.print();
    };

    const isInvFinalizada = inv.estadoInvestigacion === 'Finalizada';

    return (
        <div className="flex h-full w-full text-white print:bg-white print:text-black">
            
            {/* CSS EXCLUSIVO PARA IMPRESIÓN DEL PDF */}
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    @page { margin: 15mm; size: A4 portrait; }
                    body * { visibility: hidden; }
                    .print-area, .print-area * { visibility: visible; }
                    .print-area { position: absolute; left: 0; top: 0; width: 100%; color: black !important; font-family: Arial, sans-serif !important; }
                    .no-print { display: none !important; }
                    .print-border { border: 1px solid black !important; }
                    .print-bg { background-color: #e5e7eb !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            `}} />

            {/* MODAL FOTOS */}
            {photoModal && (
                <div onClick={() => setPhotoModal(null)} className="fixed inset-0 z-[99999] bg-black/95 flex items-center justify-center p-4 cursor-pointer no-print">
                    <img src={photoModal} alt="Ampliada" className="max-w-full max-h-full object-contain rounded border border-gray-700 shadow-2xl" />
                    <button className="absolute top-6 right-6 text-white bg-red-600 rounded-full p-2 hover:bg-red-500"><X size={24}/></button>
                </div>
            )}

            {/* PANEL IZQUIERDO: LISTA */}
            <div className="w-[45%] flex flex-col bg-[#111827] border-r border-gray-700 flex-shrink-0 no-print">
                <div className="p-4 border-b border-gray-700 bg-gray-900/50">
                    <h2 className="text-lg font-bold mb-2 text-emerald-400 flex items-center gap-2"><FileSpreadsheet size={20}/> Seguimiento de Eventos</h2>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                        <div className="col-span-2 relative">
                            <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                            <input type="text" placeholder="Buscar por conductor, línea, int..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); if(isDirty && !window.confirm("Perderá los cambios. ¿Continuar?")) return; }} className="w-full bg-gray-900 border border-gray-600 rounded p-1.5 pl-8 text-xs outline-none focus:border-emerald-500" />
                        </div>
                        <select value={eventosFilterTipo} onChange={e => handleSelectRow(null) ?? setEventosFilterTipo(e.target.value)} className="bg-gray-900 border border-gray-600 rounded p-1.5 text-xs outline-none focus:border-emerald-500"><option value="">Siniestros e Incidentes</option><option value="Siniestro">Siniestros</option><option value="Incidente">Incidentes</option></select>
                        <div className="flex gap-1">
                            <select value={eventosFilterYear} onChange={e => handleSelectRow(null) ?? setEventosFilterYear(e.target.value)} className="bg-gray-900 border border-gray-600 rounded p-1.5 text-xs outline-none focus:border-emerald-500 w-1/2"><option value="">Año</option>{years.map(y => <option key={y} value={y}>{y}</option>)}</select>
                            <select value={eventosFilterMonth} onChange={e => handleSelectRow(null) ?? setEventosFilterMonth(e.target.value)} disabled={!eventosFilterYear} className="bg-gray-900 border border-gray-600 rounded p-1.5 text-xs outline-none focus:border-emerald-500 w-1/2 disabled:opacity-50"><option value="">Mes</option>{Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m.toString()}>{m.toString().padStart(2, '0')}</option>)}</select>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse table-fixed">
                        <thead>
                            <tr className="bg-gray-900 border-b border-gray-700 text-[9px] uppercase tracking-wider text-gray-400 sticky top-0 z-10">
                                <th className="p-2 w-[12%] font-bold">Fecha</th>
                                <th className="p-2 w-[18%] font-bold">Línea/Int.</th>
                                <th className="p-2 w-[25%] font-bold">Conductor</th>
                                <th className="p-2 w-[15%] font-bold text-center">Estado</th>
                                <th className="p-2 w-[20%] font-bold text-center">Investigación</th>
                                <th className="p-2 w-[10%] font-bold text-center">CRM</th>
                            </tr>
                        </thead>
                        <tbody className="text-[11px] divide-y divide-gray-700/50">
                            {filteredList.map(sin => {
                                const invData = sin.investigacion || {};
                                const estCrm = invData.estadoReclamo || 'Pendiente';
                                const estInv = invData.estadoInvestigacion || 'Pendiente';
                                
                                let invLabel = 'Habilitar'; let invClass = 'bg-yellow-400 text-black hover:bg-yellow-500';
                                if (estInv === 'Finalizada') { invLabel = 'Finalizada'; invClass = 'bg-emerald-600 text-white hover:bg-emerald-500'; } 
                                else if (estInv === 'En Curso') { invLabel = 'En Curso'; invClass = 'bg-red-600 text-white hover:bg-red-500'; }

                                return (
                                    <tr key={sin.id} className={`transition-colors hover:bg-gray-700/50 ${selectedSin?.id === sin.id ? 'bg-emerald-900/30' : ''}`}>
                                        <td className="p-2 text-gray-300 truncate" onClick={() => handleSelectRow(sin.id, 'crm')}>{new Date(sin.fechaHora).toLocaleDateString('es-AR')}</td>
                                        <td className="p-2 text-gray-300 truncate" onClick={() => handleSelectRow(sin.id, 'crm')} title={`${sin.conductor?.linea} (Int: ${sin.conductor?.interno})`}>{sin.conductor?.interno || sin.conductor?.linea || '-'}</td>
                                        <td className="p-2 text-gray-300 truncate" onClick={() => handleSelectRow(sin.id, 'crm')} title={sin.conductor?.nombre}>{sin.conductor?.nombre || '-'}</td>
                                        <td className="p-2 text-center" onClick={() => handleSelectRow(sin.id, 'crm')}><span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${estCrm === 'Cerrado' ? 'bg-green-900/50 text-green-400' : estCrm === 'Legales' ? 'bg-orange-900/50 text-orange-400' : 'bg-gray-700 text-gray-300'}`}>{estCrm}</span></td>
                                        <td className="p-2 text-center">
                                            <button onClick={() => handleSelectRow(sin.id, 'investigacion')} className={`${invClass} px-2 py-1 rounded text-[9px] uppercase tracking-wider font-bold shadow-md transition-colors w-full truncate`}>{invLabel}</button>
                                        </td>
                                        <td className="p-2 text-center">
                                            <button onClick={() => handleSelectRow(sin.id, 'crm')} className="text-sky-400 hover:text-sky-300 underline font-bold px-2 py-1">Ver</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* PANEL DERECHO: FORMULARIOS */}
            <div className="flex-1 bg-black flex flex-col relative overflow-hidden">
                {!selectedSin ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-600 no-print"><FileSpreadsheet size={80} className="mb-4 opacity-50" /><p className="text-xl font-bold">Seleccione un registro</p></div>
                ) : (
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 w-full print-area">
                        
                        {/* PESTAÑAS (NO IMPRIMIBLES) */}
                        <div className="flex border-b border-gray-800 mb-6 no-print">
                            <button onClick={() => setActiveView('crm')} className={`px-6 py-3 font-bold text-sm transition-colors ${activeView === 'crm' ? 'border-b-2 border-emerald-500 text-emerald-400' : 'text-gray-500 hover:text-gray-300'}`}>Seguimiento CRM</button>
                            <button onClick={() => setActiveView('investigacion')} className={`px-6 py-3 font-bold text-sm transition-colors ${activeView === 'investigacion' ? 'border-b-2 border-sky-500 text-sky-400' : 'text-gray-500 hover:text-gray-300'}`}>Investigación R-CH-Ad-08-02</button>
                        </div>

                        {/* =============================================================== */}
                        {/* VISTA 1: SEGUIMIENTO CRM (Lo que ya tenías, intacto) */}
                        {/* =============================================================== */}
                        {activeView === 'crm' && (
                            <div className="no-print">
                                <div className="mb-6 flex justify-between items-end border-b border-gray-800 pb-4">
                                    <div>
                                        <h1 className="text-2xl font-bold text-emerald-400 mb-1">Información Complementaria</h1>
                                        <div className="flex items-center gap-3 text-sm text-gray-400"><span className={`px-2 py-1 rounded font-bold text-xs uppercase ${selectedSin.tipoEvento === 'Incidente' ? 'bg-yellow-900 text-yellow-400' : 'bg-red-900 text-red-400'}`}>{selectedSin.tipoEvento === 'Incidente' ? 'Incidente' : 'Siniestro'}</span><span>Fecha: {new Date(selectedSin.fechaHora).toLocaleString('es-AR')}</span></div>
                                    </div>
                                    <a href={`https://www.google.com/maps/search/?api=1&query=${selectedSin.ubicacion.lat},${selectedSin.ubicacion.lng}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-bold text-sm transition-colors"><MapPin size={16}/> Ver en Google Maps</a>
                                </div>

                                <div className="bg-gray-900 p-5 rounded-xl border border-gray-700 mb-6 text-sm shadow-lg">
                                    <h4 className="text-gray-400 font-bold mb-3 border-b border-gray-700 pb-1 uppercase text-xs tracking-wider flex justify-between"><span>Relevamiento Inicial con el Formulario</span> <span className="text-[10px] text-gray-500 font-normal">Solo Lectura</span></h4>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-gray-300 mb-4">
                                        <div><p className="text-[10px] text-gray-500 uppercase">Conductor</p><p className="font-bold text-white">{selectedSin.conductor?.nombre || '-'}</p></div>
                                        <div><p className="text-[10px] text-gray-500 uppercase">Legajo / DNI</p><p className="font-bold text-white">{selectedSin.conductor?.legajo || '-'}</p></div>
                                        <div><p className="text-[10px] text-gray-500 uppercase">Unidad / Línea</p><p className="font-bold text-white">Int: {selectedSin.conductor?.interno} | L: {selectedSin.conductor?.linea}</p></div>
                                        <div><p className="text-[10px] text-gray-500 uppercase">Ubicación</p><p className="truncate">{selectedSin.ubicacion?.manual || '-'}</p></div>
                                        <div><p className="text-[10px] text-gray-500 uppercase">Gravedad / Tipo</p><p className="text-red-400">{selectedSin.descripcion?.gravedad} | {selectedSin.descripcion?.tipo}</p></div>
                                        <div className="col-span-2 lg:col-span-4"><p className="text-[10px] text-gray-500 uppercase">Resumen del Hecho</p><p className="italic bg-black p-3 rounded mt-1 text-sm">"{selectedSin.descripcion?.resumen}"</p></div>
                                    </div>
                                    {Array.isArray(selectedSin.images) && selectedSin.images.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-gray-800">
                                            <p className="text-[10px] text-gray-500 uppercase mb-2">Registro Fotográfico ({selectedSin.images.length})</p>
                                            <div className="flex gap-3 overflow-x-auto pb-2">
                                                {selectedSin.images.map((img, i) => (
                                                    <div key={i} onClick={() => setPhotoModal(img)} className="w-24 h-24 flex-shrink-0 cursor-pointer border border-gray-700 rounded-lg overflow-hidden hover:border-emerald-500 transition-colors"><img src={img} alt="Foto" className="w-full h-full object-cover" /></div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-6 text-sm">
                                    <div className="bg-[#111827] p-6 rounded-xl border border-gray-800 shadow-lg">
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mb-5">
                                            <div><label className="block text-[10px] text-emerald-500 font-bold uppercase mb-1">Zona</label><input type="text" name="zona" value={inv.zona || ''} onChange={handleInvChange} className="w-full bg-black border border-gray-700 rounded p-2.5 text-white outline-none focus:border-emerald-500" /></div>
                                            <div><label className="block text-[10px] text-emerald-500 font-bold uppercase mb-1">N° de Siniestro / Exp.</label><input type="text" name="numeroSiniestro" value={inv.numeroSiniestro || ''} onChange={handleInvChange} className="w-full bg-black border border-gray-700 rounded p-2.5 text-emerald-400 font-bold outline-none focus:border-emerald-500" /></div>
                                            <div><label className="block text-[10px] text-emerald-500 font-bold uppercase mb-1">Grupo</label><input type="text" name="grupo" value={inv.grupo || ''} onChange={handleInvChange} className="w-full bg-black border border-gray-700 rounded p-2.5 text-white outline-none focus:border-emerald-500" /></div>
                                            <div><label className="block text-[10px] text-gray-400 uppercase mb-1">Tipo de Servicio</label><input type="text" name="tipoServicio" value={inv.tipoServicio || selectedSin.conductor?.linea || ''} onChange={handleInvChange} className="w-full bg-black border border-gray-700 rounded p-2.5 text-white outline-none focus:border-emerald-500" /></div>
                                            <div><label className="block text-[10px] text-gray-400 uppercase mb-1">Dominio (Vehículo)</label><input type="text" name="dominio" value={inv.dominio || ''} onChange={handleInvChange} className="w-full bg-black border border-gray-700 rounded p-2.5 text-white outline-none focus:border-emerald-500" /></div>
                                            <div><label className="block text-[10px] text-gray-400 uppercase mb-1">Sector Dañado</label><input type="text" name="sectorDanado" value={inv.sectorDanado || ''} onChange={handleInvChange} className="w-full bg-black border border-gray-700 rounded p-2.5 text-white outline-none focus:border-emerald-500" /></div>
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
                                            <div><label className="block text-[10px] text-emerald-500 font-bold uppercase mb-1">Resp. C.S.V.</label><input type="text" name="responsabilidadCsv" value={inv.responsabilidadCsv || ''} onChange={handleInvChange} className="w-full bg-black border border-gray-700 rounded p-2.5 text-white outline-none focus:border-emerald-500" /></div>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-5">
                                            <div><label className="block text-[10px] text-gray-400 uppercase mb-1">Franquicia ($)</label><input type="text" name="franquicia" value={inv.franquicia || ''} onChange={handleInvChange} className="w-full bg-black border border-gray-700 rounded p-2.5 text-white outline-none focus:border-emerald-500" /></div>
                                            <div className="col-span-2"><label className="block text-[10px] text-gray-400 uppercase mb-1">Seguro y Compañía</label><input type="text" name="seguroTercero" value={inv.seguroTercero || (selectedSin.datosComplementarios?.seguroTercero ? `${selectedSin.datosComplementarios?.seguroTercero} - Póliza: ${selectedSin.datosComplementarios?.polizaTercero}` : '')} onChange={handleInvChange} className="w-full bg-black border border-gray-700 rounded p-2.5 text-white outline-none focus:border-emerald-500" /></div>
                                            <div><label className="block text-[10px] text-gray-400 uppercase mb-1">Ofrecimiento ($)</label><input type="text" name="ofrecimiento" value={inv.ofrecimiento || ''} onChange={handleInvChange} className="w-full bg-black border border-gray-700 rounded p-2.5 text-white outline-none focus:border-emerald-500" /></div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                                            <div><label className="block text-[10px] text-gray-400 uppercase mb-1">Pretensiones ($)</label><input type="text" name="pretension" value={inv.pretension || ''} onChange={handleInvChange} className="w-full bg-black border border-gray-700 rounded p-2.5 text-white outline-none focus:border-emerald-500" /></div>
                                            <div><label className="block text-[10px] text-emerald-500 font-bold uppercase mb-1">Estado Reclamo</label><select name="estadoReclamo" value={inv.estadoReclamo || ''} onChange={handleInvChange} className="w-full bg-black border border-gray-700 rounded p-2.5 text-white outline-none focus:border-emerald-500"><option value="Pendiente">Pendiente</option><option value="En Análisis">En Análisis</option><option value="En Negociación">En Negociación</option><option value="Legales">Legales / Mediación</option><option value="Cerrado">Cerrado</option></select></div>
                                            <div><label className="block text-[10px] text-gray-400 uppercase mb-1">Abonado ($)</label><input type="text" name="abonado" value={inv.abonado || ''} onChange={handleInvChange} className="w-full bg-black border border-gray-700 rounded p-2.5 text-white outline-none focus:border-emerald-500" /></div>
                                        </div>
                                    </div>
                                    <div className="pt-6 pb-20"><button onClick={() => handleSave(false)} disabled={isSaving} className={`px-10 py-4 rounded-lg font-bold text-lg text-white transition-colors flex items-center justify-center gap-3 ${isSaving ? 'bg-gray-600' : 'bg-emerald-600 hover:bg-emerald-500'}`}><Save size={24} /> {isSaving ? 'Guardando...' : 'Guardar Información Complementaria'}</button></div>
                                </div>
                            </div>
                        )}

                        {/* =============================================================== */}
                        {/* VISTA 2: INFORME INVESTIGACION (R-CH-Ad-08-02) */}
                        {/* =============================================================== */}
                        {activeView === 'investigacion' && (
                            <div>
                                {/* ENCABEZADO VISTA PANTALLA */}
                                <div className="mb-6 flex justify-between items-center border-b border-gray-800 pb-4 no-print">
                                    <div>
                                        <h1 className="text-2xl font-bold text-sky-400 mb-1">Informe de Investigación R-CH-Ad-08-02</h1>
                                        <div className="flex items-center gap-3 text-sm text-gray-400">
                                            <span className={`px-2 py-1 rounded font-bold text-xs uppercase text-white ${isInvFinalizada ? 'bg-emerald-600' : 'bg-red-600'}`}>
                                                {isInvFinalizada ? <Lock size={12} className="inline mr-1"/> : <Unlock size={12} className="inline mr-1"/>}
                                                ESTADO: {inv.estadoInvestigacion || 'Pendiente'}
                                            </span>
                                            {isInvFinalizada && <span className="text-yellow-500 font-bold">Bloqueado - Solo Lectura</span>}
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        {isInvFinalizada && currentUser.isAdmin && (
                                            <button onClick={() => { setInv({...inv, estadoInvestigacion: 'En Curso'}); setIsDirty(true); }} className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded font-bold text-sm transition-colors"><Unlock size={16}/> Reabrir (Admin)</button>
                                        )}
                                        <button onClick={handlePrint} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded font-bold text-sm transition-colors"><Printer size={16}/> Imprimir PDF</button>
                                    </div>
                                </div>

                                {/* FORMULARIO ESTILO PDF */}
                                <div className="bg-white text-black p-8 mx-auto max-w-[210mm] min-h-[297mm] shadow-2xl relative print-area print-border">
                                    
                                    {/* HEADER PDF */}
                                    <div className="flex border-2 border-black mb-6">
                                        <div className="w-1/4 p-4 border-r-2 border-black flex items-center justify-center"><h1 className="font-black text-3xl italic text-blue-600 tracking-tighter">Buttini</h1></div>
                                        <div className="w-2/4 flex flex-col justify-center items-center font-bold text-center">
                                            <div className="text-lg">REGISTRO</div>
                                            <div className="text-lg">INFORME INVESTIGACION DE SINIESTROS GRAVES</div>
                                            <div className="flex w-full border-t-2 border-black mt-2"><div className="w-1/2 border-r-2 border-black p-1">COD: R-CH-Ad-08-02</div><div className="w-1/2 p-1">Rev.0</div></div>
                                        </div>
                                        <div className="w-1/4 p-4 border-l-2 border-black flex items-center justify-center"><div className="w-16 h-16 rounded-full border-4 border-blue-600 flex items-center justify-center text-4xl font-black text-blue-600 italic">B</div></div>
                                    </div>

                                    {/* 1. DATOS GENERALES */}
                                    <div className="mb-6">
                                        <div className="bg-gray-200 border-2 border-black text-center font-bold p-1 print-bg">1. DATOS GENERALES DEL SINIESTRO</div>
                                        <div className="border-x-2 border-b-2 border-black text-sm">
                                            <div className="flex border-b border-black"><div className="w-1/3 p-1.5 border-r border-black font-semibold">Fecha y hora del siniestro</div><div className="w-2/3 p-1.5"><input disabled={isInvFinalizada} type="datetime-local" value={selectedSin.fechaHora.slice(0,16)} onChange={e => handleSinOriginalChange('root', 'fechaHora', e.target.value)} className="w-full outline-none bg-transparent" /></div></div>
                                            <div className="flex border-b border-black"><div className="w-1/3 p-1.5 border-r border-black font-semibold">Lugar (calle, ruta, km, localidad)</div><div className="w-2/3 p-1.5"><input disabled={isInvFinalizada} type="text" value={selectedSin.ubicacion.manual || ''} onChange={e => handleSinOriginalChange('ubicacion', 'manual', e.target.value)} className="w-full outline-none bg-transparent" /></div></div>
                                            <div className="flex border-b border-black"><div className="w-1/3 p-1.5 border-r border-black font-semibold">Unidad involucrada (interno / dominio)</div><div className="w-2/3 p-1.5 flex gap-2"><input disabled={isInvFinalizada} type="text" value={selectedSin.conductor?.interno || ''} onChange={e => handleSinOriginalChange('conductor', 'interno', e.target.value)} className="w-1/2 outline-none bg-transparent" placeholder="Int..." /> / <input disabled={isInvFinalizada} type="text" name="dominio" value={inv.dominio || ''} onChange={handleInvChange} className="w-1/2 outline-none bg-transparent" placeholder="Dominio..." /></div></div>
                                            <div className="flex border-b border-black"><div className="w-1/3 p-1.5 border-r border-black font-semibold">Servicio / recorrido</div><div className="w-2/3 p-1.5"><input disabled={isInvFinalizada} type="text" value={selectedSin.conductor?.linea || ''} onChange={e => handleSinOriginalChange('conductor', 'linea', e.target.value)} className="w-full outline-none bg-transparent" /></div></div>
                                            <div className="flex border-b border-black"><div className="w-1/3 p-1.5 border-r border-black font-semibold">Conductor involucrado</div><div className="w-2/3 p-1.5"><input disabled={isInvFinalizada} type="text" value={selectedSin.conductor?.nombre || ''} onChange={e => handleSinOriginalChange('conductor', 'nombre', e.target.value)} className="w-full outline-none bg-transparent" /></div></div>
                                            <div className="flex border-b border-black"><div className="w-1/3 p-1.5 border-r border-black font-semibold">Legajo N°</div><div className="w-2/3 p-1.5"><input disabled={isInvFinalizada} type="text" value={selectedSin.conductor?.legajo || ''} onChange={e => handleSinOriginalChange('conductor', 'legajo', e.target.value)} className="w-full outline-none bg-transparent" /></div></div>
                                            <div className="flex border-b border-black"><div className="w-1/3 p-1.5 border-r border-black font-semibold">Antigüedad en la empresa</div><div className="w-2/3 p-1.5"><input disabled={isInvFinalizada} type="text" name="antiguedadEmpresa" value={inv.antiguedadEmpresa || ''} onChange={handleInvChange} className="w-full outline-none bg-transparent" /></div></div>
                                            <div className="flex border-b border-black"><div className="w-1/3 p-1.5 border-r border-black font-semibold">Pasajeros a bordo</div><div className="w-2/3 p-1.5"><input disabled={isInvFinalizada} type="text" name="pasajerosBordo" value={inv.pasajerosBordo || ''} onChange={handleInvChange} className="w-full outline-none bg-transparent" /></div></div>
                                            <div className="flex border-b border-black"><div className="w-1/3 p-1.5 border-r border-black font-semibold">Lesionados (sí / no / cantidad)</div><div className="w-2/3 p-1.5">{requiredVictims.length > 0 ? `Sí, ${requiredVictims.length} reportado/s` : 'No'}</div></div>
                                            <div className="flex border-b border-black"><div className="w-1/3 p-1.5 border-r border-black font-semibold">Daños materiales</div><div className="w-2/3 p-1.5"><input disabled={isInvFinalizada} type="text" name="danosMateriales" value={inv.danosMateriales || ''} onChange={handleInvChange} className="w-full outline-none bg-transparent" /></div></div>
                                            <div className="flex"><div className="w-1/3 p-1.5 border-r border-black font-semibold">Notificación a aseguradora</div><div className="w-2/3 p-1.5 flex gap-4"><span>Fecha: <input disabled={isInvFinalizada} type="date" name="notiAsegFecha" value={inv.notiAsegFecha || ''} onChange={handleInvChange} className="outline-none bg-transparent w-32"/></span> <span>Hora: <input disabled={isInvFinalizada} type="time" name="notiAsegHora" value={inv.notiAsegHora || ''} onChange={handleInvChange} className="outline-none bg-transparent w-24"/></span></div></div>
                                        </div>
                                    </div>

                                    {/* 2. DESCRIPCION */}
                                    <div className="mb-6">
                                        <div className="bg-gray-200 border-2 border-black text-center font-bold p-1 print-bg">2. DESCRIPCIÓN DEL HECHO</div>
                                        <div className="border-x-2 border-b-2 border-black p-2 text-sm">
                                            <p className="mb-2 italic text-xs">&gt; Relatar de forma clara y objetiva cómo ocurrió el siniestro, según los datos recabados, testimonios y observaciones.</p>
                                            <textarea disabled={isInvFinalizada} value={selectedSin.descripcion?.resumen || ''} onChange={e => handleSinOriginalChange('descripcion', 'resumen', e.target.value)} className="w-full outline-none bg-transparent border-b border-dotted border-gray-400 mb-2 resize-none" rows={3} placeholder="Resumen del hecho..."/>
                                            <textarea disabled={isInvFinalizada} name="ampliacionDeclaracion" value={inv.ampliacionDeclaracion || ''} onChange={handleInvChange} className="w-full outline-none bg-transparent border-b border-dotted border-gray-400 resize-none" rows={3} placeholder="Ampliación..."/>
                                        </div>
                                    </div>

                                    {/* 3. EVIDENCIAS */}
                                    <div className="mb-6">
                                        <div className="bg-gray-200 border-2 border-black text-center font-bold p-1 print-bg">3. EVIDENCIAS RECOPILADAS</div>
                                        <div className="border-x-2 border-b-2 border-black p-3 text-sm">
                                            <div className="grid grid-cols-3 gap-y-3 mb-2">
                                                {['Fotografías', 'Croquis', 'Videos', 'Registro GPS/Tacógrafo', 'Declaraciones de testigos', 'Informe técnico del vehículo'].map(ev => (
                                                    <label key={ev} className="flex items-center gap-2 cursor-pointer"><input disabled={isInvFinalizada} type="checkbox" checked={(inv.evidencias||[]).includes(ev)} onChange={() => handleEvidenciaToggle(ev)} className="w-4 h-4"/> {ev}</label>
                                                ))}
                                                <div className="flex items-center gap-2 col-span-2"><label className="flex items-center gap-2"><input disabled={isInvFinalizada} type="checkbox" checked={(inv.evidencias||[]).includes('Otro')} onChange={() => handleEvidenciaToggle('Otro')} className="w-4 h-4"/> Otro: </label> <input disabled={isInvFinalizada} type="text" name="evidenciaOtro" value={inv.evidenciaOtro || ''} onChange={handleInvChange} className="flex-1 border-b border-black outline-none bg-transparent" /></div>
                                            </div>
                                            <p className="italic text-xs mt-2">&gt; Adjuntar documentación o imágenes relevantes.</p>
                                        </div>
                                    </div>

                                    {/* 4. ANALISIS */}
                                    <div className="mb-6">
                                        <div className="bg-gray-200 border-2 border-black text-center font-bold p-1 print-bg">4. ANÁLISIS DE CAUSAS</div>
                                        <div className="border-x-2 border-b-2 border-black text-sm">
                                            <div className="flex border-b border-black"><div className="w-1/3 p-2 border-r border-black font-semibold">Tipo de causa</div><div className="w-2/3 p-2"><input disabled={isInvFinalizada} type="text" name="causaTipo" value={inv.causaTipo || ''} onChange={handleInvChange} className="w-full outline-none bg-transparent" /></div></div>
                                            <div className="flex border-b border-black"><div className="w-1/3 p-2 border-r border-black font-semibold">Descripción</div><div className="w-2/3 p-2"><textarea disabled={isInvFinalizada} name="causaDescripcion" value={inv.causaDescripcion || ''} onChange={handleInvChange} className="w-full outline-none bg-transparent resize-none border-b border-dotted border-gray-400" rows={2}/></div></div>
                                            <div className="flex border-b border-black"><div className="w-1/3 p-2 border-r border-black font-semibold">Causa inmediata</div><div className="w-2/3 p-2"><textarea disabled={isInvFinalizada} name="causaInmediata" value={inv.causaInmediata || ''} onChange={handleInvChange} className="w-full outline-none bg-transparent resize-none border-b border-dotted border-gray-400" rows={2}/></div></div>
                                            <div className="flex border-b border-black"><div className="w-1/3 p-2 border-r border-black font-semibold">Causa raíz</div><div className="w-2/3 p-2"><textarea disabled={isInvFinalizada} name="causaRaiz" value={inv.causaRaiz || ''} onChange={handleInvChange} className="w-full outline-none bg-transparent resize-none border-b border-dotted border-gray-400" rows={2}/></div></div>
                                            <div className="p-2 flex gap-4 items-center">
                                                <span className="font-semibold">Método utilizado:</span>
                                                {['5 Porqués', 'Ishikawa', '5M'].map(met => (
                                                    <label key={met} className="flex items-center gap-1 cursor-pointer"><input disabled={isInvFinalizada} type="radio" name="metodoCausa" value={met} checked={inv.metodoCausa === met} onChange={handleInvChange} className="w-4 h-4"/> {met}</label>
                                                ))}
                                                <label className="flex items-center gap-1"><input disabled={isInvFinalizada} type="radio" name="metodoCausa" value="Otro" checked={inv.metodoCausa === 'Otro'} onChange={handleInvChange} className="w-4 h-4"/> Otro: </label> <input disabled={isInvFinalizada} type="text" name="metodoOtro" value={inv.metodoOtro || ''} onChange={handleInvChange} className="border-b border-black outline-none bg-transparent w-32" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* 5. CONCLUSIONES */}
                                    <div className="mb-6">
                                        <div className="bg-gray-200 border-2 border-black text-center font-bold p-1 print-bg">5. CONCLUSIONES</div>
                                        <div className="border-x-2 border-b-2 border-black p-2 text-sm">
                                            <p className="mb-2 italic text-xs">&gt; Indicar las principales conclusiones de la investigación, considerando aspectos técnicos, humanos y organizacionales.</p>
                                            <textarea disabled={isInvFinalizada} name="conclusiones" value={inv.conclusiones || ''} onChange={handleInvChange} className="w-full outline-none bg-transparent border-b border-dotted border-gray-400 resize-none" rows={4}/>
                                        </div>
                                    </div>

                                    {/* ACCIONES */}
                                    <div className="mb-6">
                                        <div className="bg-gray-200 border-2 border-black text-center font-bold p-1 print-bg">ACCIONES CORRECTIVAS Y PREVENTIVAS</div>
                                        <div className="border-x-2 border-b-2 border-black p-3 text-sm flex gap-6">
                                            <span className="font-semibold">Corresponde SI/ NO - </span>
                                            <label className="flex items-center gap-1 cursor-pointer"><input disabled={isInvFinalizada} type="radio" name="correspondeAccion" value="Si" checked={inv.correspondeAccion === 'Si'} onChange={handleInvChange} className="w-4 h-4"/> SÍ</label>
                                            <label className="flex items-center gap-1 cursor-pointer"><input disabled={isInvFinalizada} type="radio" name="correspondeAccion" value="No" checked={inv.correspondeAccion === 'No'} onChange={handleInvChange} className="w-4 h-4"/> NO</label>
                                            <span className="ml-6 font-semibold">Nº: <input disabled={isInvFinalizada} type="text" name="nroAccion" value={inv.nroAccion || ''} onChange={handleInvChange} className="border-b border-black outline-none bg-transparent w-24" /></span>
                                        </div>
                                    </div>
                                    
                                    {/* BOTONES (NO IMPRIMIBLES) */}
                                    {!isInvFinalizada && (
                                        <div className="pt-8 pb-10 flex gap-4 justify-end no-print">
                                            <button onClick={() => handleSave(false)} disabled={isSaving} className="bg-sky-600 hover:bg-sky-500 px-6 py-3 rounded-lg font-bold text-white shadow-lg transition-colors flex items-center gap-2"><Save size={20}/> Guardar Borrador</button>
                                            <button onClick={() => { if(window.confirm('¿Está seguro de FINALIZAR? El reporte se bloqueará.')) handleSave(true); }} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-500 px-8 py-3 rounded-lg font-bold text-white shadow-lg transition-colors flex items-center gap-2"><Lock size={20}/> Cerrar y Finalizar Investigación</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>
                )}
            </div>
        </div>
    );
};