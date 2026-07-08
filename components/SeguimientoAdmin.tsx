import React, { useState, useMemo, useEffect } from 'react';
import type { Siniestro, InvestigacionData } from '../types';
import { FileSpreadsheet, Save, Search, AlertTriangle, ShieldAlert } from 'lucide-react';

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
    const years = Array.from({ length: new Date().getFullYear() - 2020 + 2 }, (_, i) => (2020 + i).toString());

    const filteredList = useMemo(() => {
        let list = Array.isArray(siniestros) ? [...siniestros] : [];
        if (eventosFilterYear) {
            list = list.filter(item => {
                const itemDate = new Date(item.fechaHora || item.timestamp);
                const yearMatch = itemDate.getFullYear().toString() === eventosFilterYear;
                if (!eventosFilterMonth) return yearMatch;
                return yearMatch && (itemDate.getMonth() + 1).toString() === eventosFilterMonth;
            });
        }
        if (eventosFilterTipo) {
            list = list.filter(s => (s.tipoEvento || 'Siniestro') === eventosFilterTipo);
        }
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            list = list.filter(s => 
                s.conductor?.nombre?.toLowerCase().includes(lower) || 
                s.conductor?.linea?.toLowerCase().includes(lower) ||
                s.conductor?.interno?.toLowerCase().includes(lower) ||
                s.investigacion?.numeroSiniestro?.toLowerCase().includes(lower)
            );
        }
        return list.sort((a, b) => b.timestamp - a.timestamp);
    }, [siniestros, eventosFilterTipo, eventosFilterYear, eventosFilterMonth, searchTerm]);

    useEffect(() => {
        if (selectedSiniestroId) {
            const match = siniestros.find(s => s.id === selectedSiniestroId);
            if (match) {
                setSelectedSin(match);
                setInv(match.investigacion || {});
            }
        } else {
            setSelectedSin(null);
            setInv({});
        }
    }, [selectedSiniestroId, siniestros]);

    // Lógica dinámica para crear campos de víctimas
    const requiredVictims = useMemo(() => {
        if (!selectedSin?.descripcion?.consecuencias) return [];
        const victims: { id: string, label: string }[] = [];
        selectedSin.descripcion.consecuencias.forEach(c => {
            if (c.activa && c.tipo !== 'Solo daños materiales') {
                const count = parseInt(c.cantidad) || 0;
                for (let i = 0; i < count; i++) {
                    victims.push({
                        id: `${c.tipo}-${i}`,
                        label: `${c.tipo} (${i + 1} de ${count})`
                    });
                }
            }
        });
        return victims;
    }, [selectedSin]);

    const handleInvChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setInv(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleVictimChange = (id: string, field: 'nombre' | 'dni', value: string) => {
        setInv(prev => {
            const currentVictimas = prev.victimasDetalle ? [...prev.victimasDetalle] : [];
            const index = currentVictimas.findIndex(v => v.id === id);
            if (index >= 0) {
                currentVictimas[index] = { ...currentVictimas[index], [field]: value };
            } else {
                currentVictimas.push({ id, nombre: field === 'nombre' ? value : '', dni: field === 'dni' ? value : '' });
            }
            return { ...prev, victimasDetalle: currentVictimas };
        });
    };

    const handleSave = async () => {
        if (!selectedSin) return;
        setIsSaving(true);
        try {
            const updatedSin: Siniestro = { ...selectedSin, investigacion: inv };
            onUpdateSiniestro(updatedSin);
            setSelectedSin(updatedSin);
            alert("Información Complementaria guardada exitosamente.");
        } catch (error) { alert("Error al guardar los datos."); }
        setIsSaving(false);
    };

    return (
        <div className="flex h-full w-full text-white">
            {/* PANEL IZQUIERDO: LISTA AL 50% DE PANTALLA */}
            <div className="w-1/2 flex flex-col bg-[#111827] border-r border-gray-700 flex-shrink-0">
                <div className="p-6 border-b border-gray-700">
                    <h2 className="text-xl font-bold mb-2 text-emerald-400 flex items-center gap-2"><FileSpreadsheet size={22}/> Seguimiento de Eventos</h2>
                    
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="col-span-2 relative">
                            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                            <input type="text" placeholder="Buscar por N° Exp, Int, Conductor..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 pl-9 text-sm outline-none focus:border-emerald-500" />
                        </div>
                        <select value={eventosFilterTipo} onChange={e => setEventosFilterTipo(e.target.value)} className="bg-gray-900 border border-gray-600 rounded p-2 text-sm outline-none focus:border-emerald-500">
                            <option value="">Todos los eventos</option>
                            <option value="Siniestro">Siniestros</option>
                            <option value="Incidente">Incidentes</option>
                        </select>
                        <div className="flex gap-2">
                            <select value={eventosFilterYear} onChange={e => setEventosFilterYear(e.target.value)} className="bg-gray-900 border border-gray-600 rounded p-2 text-sm outline-none focus:border-emerald-500 w-1/2">
                                <option value="">Año</option>
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <select value={eventosFilterMonth} onChange={e => setEventosFilterMonth(e.target.value)} disabled={!eventosFilterYear} className="bg-gray-900 border border-gray-600 rounded p-2 text-sm outline-none focus:border-emerald-500 w-1/2 disabled:opacity-50">
                                <option value="">Mes</option>
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m.toString()}>{m.toString().padStart(2, '0')}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-900 border-b border-gray-700 text-xs uppercase tracking-wider text-gray-400 sticky top-0 z-10">
                                <th className="p-3 font-bold">Fecha</th>
                                <th className="p-3 font-bold">Tipo</th>
                                <th className="p-3 font-bold">N° Exp.</th>
                                <th className="p-3 font-bold">Línea/Int.</th>
                                <th className="p-3 font-bold">Estado</th>
                                <th className="p-3 font-bold text-center">Inv.</th>
                                <th className="p-3 font-bold text-center">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-gray-700/50">
                            {filteredList.length === 0 ? (
                                <tr><td colSpan={7} className="text-center p-8 text-gray-500">No hay registros.</td></tr>
                            ) : (
                                filteredList.map(sin => {
                                    const isIncidente = sin.tipoEvento === 'Incidente';
                                    const estado = sin.investigacion?.estadoReclamo || 'Pendiente';
                                    return (
                                        <tr key={sin.id} onClick={() => setSelectedSiniestroId(selectedSin?.id === sin.id ? null : sin.id)} className={`cursor-pointer transition-colors hover:bg-gray-700/50 ${selectedSin?.id === sin.id ? 'bg-emerald-900/30' : ''}`}>
                                            <td className="p-3 text-gray-300 whitespace-nowrap">{new Date(sin.fechaHora).toLocaleDateString('es-AR')}</td>
                                            <td className="p-3"><span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${isIncidente ? 'bg-yellow-900/50 text-yellow-500' : 'bg-red-900/50 text-red-400'}`}>{isIncidente ? 'INC' : 'SIN'}</span></td>
                                            <td className="p-3 text-emerald-400 font-mono">{sin.investigacion?.numeroSiniestro || '-'}</td>
                                            <td className="p-3 text-gray-300 max-w-[120px] truncate" title={`${sin.conductor?.linea} (Int: ${sin.conductor?.interno})`}>{sin.conductor?.interno}</td>
                                            <td className="p-3"><span className={`px-2 py-1 rounded text-[10px] font-bold ${estado === 'Cerrado' ? 'bg-green-900/50 text-green-400' : estado === 'Legales' ? 'bg-orange-900/50 text-orange-400' : 'bg-gray-700 text-gray-300'}`}>{estado}</span></td>
                                            <td className="p-3 text-center"><button className="bg-sky-700 hover:bg-sky-600 px-2 py-1 rounded text-xs text-white transition-colors" title="Botón demostrativo">Iniciar</button></td>
                                            <td className="p-3 text-center"><button className="text-emerald-500 hover:text-emerald-400 font-bold underline">Ver</button></td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* PANEL DERECHO: FONDO NEGRO Y FORMULARIO (Toma el otro 50%) */}
            <div className="flex-1 bg-black flex flex-col relative overflow-hidden">
                {!selectedSin ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-600">
                        <FileSpreadsheet size={80} className="mb-4 opacity-50" />
                        <p className="text-xl font-bold">Seleccione un registro a la izquierda</p>
                        <p className="text-base mt-2">Para cargar la información complementaria.</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10 max-w-5xl mx-auto w-full">
                        <div className="mb-6 flex justify-between items-end border-b border-gray-800 pb-4">
                            <div>
                                <h1 className="text-2xl font-bold text-emerald-400 mb-1">Información Complementaria</h1>
                                <div className="flex items-center gap-3 text-sm text-gray-400">
                                    <span className={`px-2 py-1 rounded font-bold text-xs uppercase ${selectedSin.tipoEvento === 'Incidente' ? 'bg-yellow-900 text-yellow-400' : 'bg-red-900 text-red-400'}`}>
                                        {selectedSin.tipoEvento === 'Incidente' ? 'Incidente' : 'Siniestro'}
                                    </span>
                                    <span>Fecha: {new Date(selectedSin.fechaHora).toLocaleString('es-AR')}</span>
                                </div>
                            </div>
                        </div>

                        {/* RESUMEN DE DATOS CARGADOS INICIALMENTE */}
                        <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 mb-6 text-sm shadow-lg">
                            <h4 className="text-gray-500 font-bold mb-3 border-b border-gray-800 pb-1 uppercase text-xs tracking-wider">Resumen de Carga Original</h4>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-gray-300">
                                <div><p className="text-[10px] text-gray-500 uppercase">Conductor</p><p className="font-bold text-white">{selectedSin.conductor?.nombre || '-'}</p></div>
                                <div><p className="text-[10px] text-gray-500 uppercase">Unidad / Línea</p><p className="font-bold text-white">Int: {selectedSin.conductor?.interno} | L: {selectedSin.conductor?.linea}</p></div>
                                <div><p className="text-[10px] text-gray-500 uppercase">Ubicación</p><p className="truncate" title={selectedSin.ubicacion?.manual}>{selectedSin.ubicacion?.manual || '-'}</p></div>
                                <div><p className="text-[10px] text-gray-500 uppercase">Gravedad / Tipo</p><p className={selectedSin.tipoEvento === 'Incidente' ? 'text-yellow-400' : 'text-red-400'}>{selectedSin.descripcion?.gravedad} | {selectedSin.descripcion?.tipo}</p></div>
                                <div className="col-span-2 lg:col-span-4"><p className="text-[10px] text-gray-500 uppercase">Resumen del Hecho</p><p className="italic bg-black p-3 rounded mt-1 text-sm">"{selectedSin.descripcion?.resumen}"</p></div>
                            </div>
                        </div>

                        {/* FORMULARIO DE INFORMACIÓN COMPLEMENTARIA */}
                        <div className="space-y-6 text-sm">
                            <div className="bg-[#111827] p-6 rounded-xl border border-gray-800 shadow-lg">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mb-5">
                                    <div><label className="block text-[10px] text-emerald-500 font-bold uppercase mb-1">Zona</label><input type="text" name="zona" value={inv.zona || ''} onChange={handleInvChange} className="w-full bg-black border border-gray-700 rounded p-2.5 text-white outline-none focus:border-emerald-500" /></div>
                                    <div><label className="block text-[10px] text-emerald-500 font-bold uppercase mb-1">N° de Siniestro / Exp.</label><input type="text" name="numeroSiniestro" value={inv.numeroSiniestro || ''} onChange={handleInvChange} className="w-full bg-black border border-gray-700 rounded p-2.5 text-emerald-400 font-bold outline-none focus:border-emerald-500" /></div>
                                    <div><label className="block text-[10px] text-emerald-500 font-bold uppercase mb-1">Grupo</label><input type="text" name="grupo" value={inv.grupo || ''} onChange={handleInvChange} className="w-full bg-black border border-gray-700 rounded p-2.5 text-white outline-none focus:border-emerald-500" /></div>
                                    
                                    <div><label className="block text-[10px] text-gray-400 uppercase mb-1">Tipo de Servicio</label><select name="tipoServicio" value={inv.tipoServicio || selectedSin.conductor?.linea || ''} onChange={handleInvChange} className="w-full bg-black border border-gray-700 rounded p-2.5 text-white outline-none focus:border-emerald-500"><option value="">Seleccione...</option><option value="Urbano">Urbano</option><option value="Media Distancia">Media Distancia</option><option value="Larga Distancia">Larga Distancia</option></select></div>
                                    <div><label className="block text-[10px] text-gray-400 uppercase mb-1">Dominio (Vehículo)</label><input type="text" name="dominio" value={inv.dominio || ''} onChange={handleInvChange} className="w-full bg-black border border-gray-700 rounded p-2.5 text-white outline-none focus:border-emerald-500" /></div>
                                    <div><label className="block text-[10px] text-gray-400 uppercase mb-1">Sector Dañado de la Unidad</label><input type="text" name="sectorDanado" value={inv.sectorDanado || ''} onChange={handleInvChange} className="w-full bg-black border border-gray-700 rounded p-2.5 text-white outline-none focus:border-emerald-500" /></div>
                                </div>

                                <div className="mb-5"><label className="block text-[10px] text-gray-400 uppercase mb-1">Acción Correctiva (Empresa)</label><textarea name="accionCorrectiva" rows={2} value={inv.accionCorrectiva || ''} onChange={handleInvChange} className="w-full bg-black border border-gray-700 rounded p-2.5 text-white outline-none focus:border-emerald-500" /></div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                                    <div><label className="block text-[10px] text-emerald-500 font-bold uppercase mb-1">Presentó Reclamo</label><select name="presentoReclamo" value={inv.presentoReclamo || ''} onChange={handleInvChange} className="w-full bg-black border border-gray-700 rounded p-2.5 text-white outline-none focus:border-emerald-500"><option value="">Seleccione...</option><option value="Si">Sí</option><option value="No">No</option></select></div>
                                    <div className="col-span-2"><label className="block text-[10px] text-gray-400 uppercase mb-1">Video Cámara (Link Nube/Drive)</label><input type="text" name="linkVideoCamara" value={inv.linkVideoCamara || ''} onChange={handleInvChange} className="w-full bg-black border border-gray-700 rounded p-2.5 text-sky-400 font-mono text-sm outline-none focus:border-emerald-500" placeholder="https://..." /></div>
                                </div>

                                <div className="mb-5"><label className="block text-[10px] text-gray-400 uppercase mb-1">Ampliación de Declaración</label><textarea name="ampliacionDeclaracion" rows={3} value={inv.ampliacionDeclaracion || ''} onChange={handleInvChange} className="w-full bg-black border border-gray-700 rounded p-2.5 text-white outline-none focus:border-emerald-500" /></div>
                                <div className="mb-5"><label className="block text-[10px] text-gray-400 uppercase mb-1">Ampliación del lugar de ocurrencia</label><textarea name="ampliacionLugar" rows={3} value={inv.ampliacionLugar || ''} onChange={handleInvChange} className="w-full bg-black border border-gray-700 rounded p-2.5 text-white outline-none focus:border-emerald-500" /></div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-5 pt-5 border-t border-gray-800">
                                    <div><label className="block text-[10px] text-emerald-500 font-bold uppercase mb-1">Estado Amd</label><input type="text" name="estadoAmd" value={inv.estadoAmd || ''} onChange={handleInvChange} className="w-full bg-black border border-gray-700 rounded p-2.5 text-white outline-none focus:border-emerald-500" /></div>
                                    <div><label className="block text-[10px] text-emerald-500 font-bold uppercase mb-1">Estado Judicial</label><input type="text" name="estadoJudicial" value={inv.estadoJudicial || ''} onChange={handleInvChange} className="w-full bg-black border border-gray-700 rounded p-2.5 text-white outline-none focus:border-emerald-500" /></div>
                                    <div><label className="block text-[10px] text-emerald-500 font-bold uppercase mb-1">Responsabilidad Final</label><select name="responsabilidadFinal" value={inv.responsabilidadFinal || ''} onChange={handleInvChange} className="w-full bg-black border border-gray-700 rounded p-2.5 text-white outline-none focus:border-emerald-500"><option value="">Seleccione...</option><option value="Empresa">Nuestra (Empresa)</option><option value="Tercero">Del Tercero</option><option value="Concurrente">Concurrente</option></select></div>
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
                                        <AlertTriangle size={18} className="inline mr-2" />
                                        Registro de Víctimas (Heridos / Lesionados / Fallecidos)
                                    </h4>
                                    {requiredVictims.map((v) => {
                                        const existing = (inv.victimasDetalle || []).find(vd => vd.id === v.id) || { nombre: '', dni: '' };
                                        return (
                                            <div key={v.id} className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-4 p-5 bg-black rounded-lg border border-gray-800 items-center">
                                                <div className="text-sm font-bold text-red-300">{v.label}</div>
                                                <div>
                                                    <label className="block text-[10px] text-gray-500 uppercase mb-1">Nombre y Apellido</label>
                                                    <input type="text" value={existing.nombre} onChange={(e) => handleVictimChange(v.id, 'nombre', e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 text-white outline-none focus:border-red-500" />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] text-gray-500 uppercase mb-1">DNI</label>
                                                    <input type="text" value={existing.dni} onChange={(e) => handleVictimChange(v.id, 'dni', e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded p-2.5 text-white outline-none focus:border-red-500" />
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