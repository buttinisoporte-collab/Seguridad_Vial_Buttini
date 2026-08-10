import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ShieldAlert, MapPin, Camera, CheckCircle, Trash2, Image as ImageIcon, X } from 'lucide-react';
import type { Siniestro, Consecuencia } from '../types';
import { uploadSiniestroImage, loadExternalData } from '../lib/supabase';

interface SiniestroFormProps { 
    onSaveSiniestro: (sin: Siniestro) => Promise<void>; 
    initialPosition?: { lat: number; lng: number; }; 
    initialSiniestro?: Siniestro;
    hideFiles?: boolean;
    onCancel?: () => void; 
    onRequestMapSelect?: () => void;
    isModal?: boolean; // NUEVO: Identifica si está abierto desde el panel de control
}

const VISIBILIDAD =['Noche', 'Día', 'Luz Natural', 'Luz Artificial', 'Sin Luz'];
const CLIMAS =['Niebla', 'Resplandor Solar', 'Lluvia', 'Nieve', 'Granizo', 'Calor extremo', 'Viento Zonda', 'Polvo en suspensión'];
const CAMINOS =['Asfalto Rugoso', 'Hielo Negro', 'Obra Vial', 'Ripio', 'Serruchos', 'Guardaganado', 'Badén', 'Animales Sueltos', 'Arena en Ruta', 'Anegamiento (Agua)', 'Aquaplaning (Perdida de adherencia)'];
const CONSECUENCIAS_DEFAULT: Consecuencia[] =[
    { tipo: 'Solo daños materiales', activa: false, cantidad: '' },
    { tipo: 'Heridos Leves Transportados', activa: false, cantidad: '' },
    { tipo: 'Heridos Leves No Transportados', activa: false, cantidad: '' },
    { tipo: 'Heridos Graves Transportados', activa: false, cantidad: '' },
    { tipo: 'Heridos Graves No Transportados', activa: false, cantidad: '' },
    { tipo: 'Lesionados Transportados', activa: false, cantidad: '' },
    { tipo: 'Lesionados No Transportados', activa: false, cantidad: '' },
    { tipo: 'Fallecidos Transportados', activa: false, cantidad: '' },
    { tipo: 'Fallecidos No Transportados', activa: false, cantidad: '' }
];

export const SiniestroForm: React.FC<SiniestroFormProps> = ({ onSaveSiniestro, initialPosition, initialSiniestro, hideFiles, onCancel, onRequestMapSelect, isModal }) => {
    const[step, setStep] = useState(1);
    const[isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState("");
    const[gpsPosition, setGpsPosition] = useState<{lat: number, lng: number}|null>(null);
    const[selectedFiles, setSelectedFiles] = useState<File[]>([]);

    const[f, setF] = useState({
        tipoEvento: (initialSiniestro?.tipoEvento || 'Siniestro') as 'Siniestro' | 'Incidente',
        fechaHora: new Date().toISOString().slice(0,16), ubicacionManual: '', lugar: 'Ciudad',
        climas: [] as string[], caminos:[] as string[], visibilidades: [] as string[],
        condNombre: '', condLegajo: '', condInterno: '', condKm: '', condLinea: '',
        descTipo: 'Choque entre vehículos-Moto-Bicicletas', descResumen: '', 
        consecuencias: JSON.parse(JSON.stringify(CONSECUENCIAS_DEFAULT)) as Consecuencia[], 
        descFactores: 'Factor Humano (error, descripción, velocidad)', gravedad: 'Leve',
        tercInvolucrado: false, tercNombre: '', tercDNI: '', tercVehiculo: '', tercPatente: '', tercSeguro: '', tercPoliza: '',
        intervencionPolicial: false, hayTestigos: false, testigosInfo: '', driveUrl: '', victimasIniciales: [] as { id: string; tipo: string; nombre: string; dni: string; }[] 
    });

    // Estado para guardar los datos de la BD externa
    const [externalLists, setExternalLists] = useState({ conductores: [] as any[], unidades: [] as any[], servicios: [] as any[] });

    // Cargar las 3 listas al abrir el formulario
    useEffect(() => {
        loadExternalData().then(data => setExternalLists(data));
    }, []);

    // Función especial para cuando seleccionan un conductor (autocompleta el legajo)
    const handleConductorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        // ⚠️ ATENCIÓN: Asegúrate de que 'nombre' y 'legajo' sean las columnas reales de tu BD
        const conductor = externalLists.conductores.find(c => c.nombre === val);
        
        setF(prev => ({
            ...prev,
            condNombre: val,
            condLegajo: conductor ? conductor.legajo : prev.condLegajo // Si lo encuentra, llena el legajo
        }));
    };
    
    useEffect(() => {
        if (initialSiniestro) {
            if (initialSiniestro.ubicacion.lat && initialSiniestro.ubicacion.lng) {
                setGpsPosition({ lat: initialSiniestro.ubicacion.lat, lng: initialSiniestro.ubicacion.lng });
            }
            
            // Merge existing consequences with default to ensure all options are present
            const mergedConsecuencias = JSON.parse(JSON.stringify(CONSECUENCIAS_DEFAULT)) as Consecuencia[];
            if (Array.isArray(initialSiniestro.descripcion?.consecuencias)) {
                initialSiniestro.descripcion.consecuencias.forEach(ic => {
                    const found = mergedConsecuencias.find(mc => mc.tipo === ic.tipo);
                    if (found) { found.activa = ic.activa; found.cantidad = ic.cantidad; }
                    else mergedConsecuencias.push(ic);
                });
            }

            setF({
                tipoEvento: initialSiniestro.tipoEvento || 'Siniestro',
                fechaHora: initialSiniestro.fechaHora ? new Date(initialSiniestro.fechaHora).toISOString().slice(0,16) : new Date(initialSiniestro.timestamp).toISOString().slice(0,16),
                ubicacionManual: initialSiniestro.ubicacion.manual || '',
                lugar: initialSiniestro.ubicacion.lugar || 'Ciudad',
                climas: initialSiniestro.entorno?.climas || [],
                caminos: initialSiniestro.entorno?.caminos || [],
                visibilidades: initialSiniestro.entorno?.visibilidades || [],
                condNombre: initialSiniestro.conductor?.nombre || '',
                condLegajo: initialSiniestro.conductor?.legajo || '',
                condInterno: initialSiniestro.conductor?.interno || '',
                condKm: initialSiniestro.conductor?.kilometraje || '',
                condLinea: initialSiniestro.conductor?.linea || '',
                descTipo: initialSiniestro.descripcion?.tipo || 'Choque entre vehículos-Moto-Bicicletas',
                descResumen: initialSiniestro.descripcion?.resumen || '',
                consecuencias: mergedConsecuencias,
                descFactores: initialSiniestro.descripcion?.factoresCausales || 'Factor Humano (error, descripción, velocidad)',
                gravedad: initialSiniestro.descripcion?.gravedad || 'Leve',
                tercInvolucrado: !!initialSiniestro.datosComplementarios?.nombreTercero || !!initialSiniestro.datosComplementarios?.vehiculoTercero,
                tercNombre: initialSiniestro.datosComplementarios?.nombreTercero || '',
                tercDNI: initialSiniestro.datosComplementarios?.dniTercero || '',
                tercVehiculo: initialSiniestro.datosComplementarios?.vehiculoTercero || '',
                tercPatente: initialSiniestro.datosComplementarios?.patenteTercero || '',
                tercSeguro: initialSiniestro.datosComplementarios?.seguroTercero || '',
                tercPoliza: initialSiniestro.datosComplementarios?.polizaTercero || '',
                intervencionPolicial: initialSiniestro.datosComplementarios?.intervencionPolicial || false,
                hayTestigos: initialSiniestro.datosComplementarios?.hayTestigos || false,
                testigosInfo: initialSiniestro.datosComplementarios?.testigosInfo || '',
                driveUrl: initialSiniestro.driveUrl || ''
            });

        } else if (initialPosition) {
            setGpsPosition(initialPosition);
        } else if (!isModal) {
            // Solo busca GPS si NO es modal (es decir, si es el conductor en la calle)
            navigator.geolocation.getCurrentPosition(
                pos => setGpsPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => console.warn("GPS no disponible"), { enableHighAccuracy: true }
            );
        }
    },[initialPosition, isModal, initialSiniestro]);

    // NUEVO: Envía la señal de éxito a la aplicación principal si está dentro de un iframe
    useEffect(() => {
        if (step === 2 && window.parent && window.parent !== window) {
            window.parent.postMessage({ status: 'success_siniestro' }, '*');
        }
    }, [step]);
    
    const handleChange = (e: any) => setF({ ...f, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]); };
    const removeFile = (index: number) => setSelectedFiles(prev => prev.filter((_, i) => i !== index));

    const toggleArray = (arrayName: 'climas' | 'caminos' | 'visibilidades', item: string) => {
        setF(prev => ({ ...prev, [arrayName]: prev[arrayName].includes(item) ? prev[arrayName].filter(i => i !== item) : [...prev[arrayName], item] }));
    };

    const handleConsecuenciaChange = (index: number, field: 'activa' | 'cantidad', value: any) => {
        const newCons =[...f.consecuencias];
        newCons[index] = { ...newCons[index],[field]: value };
        setF({ ...f, consecuencias: newCons });
    };

    const handleVictimInicialChange = (id: string, tipo: string, field: 'nombre' | 'dni', value: string) => {
        setF(prev => {
            const current = [...prev.victimasIniciales];
            const index = current.findIndex(v => v.id === id);
            if (index >= 0) current[index] = { ...current[index], [field]: value };
            else current.push({ id, tipo, nombre: field === 'nombre' ? value : '', dni: field === 'dni' ? value : '' });
            return { ...prev, victimasIniciales: current };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isModal && !initialSiniestro && selectedFiles.length === 0) return alert("Debe adjuntar al menos una fotografía del hecho.");
        if (isModal && !gpsPosition && !f.ubicacionManual) return alert("Debe seleccionar una ubicación en el mapa o ingresarla manualmente.");
        
        setIsSubmitting(true);
        const siniestroId = initialSiniestro?.id || uuidv4();
        const uploadedImageUrls: string[] = initialSiniestro?.images ? [...initialSiniestro.images] : [];

        try {
            for (let i = 0; i < selectedFiles.length; i++) {
                setUploadProgress(`Subiendo foto ${i + 1} de ${selectedFiles.length}...`);
                const url = await uploadSiniestroImage(siniestroId, selectedFiles[i]);
                uploadedImageUrls.push(url);
            }

            const newSiniestro: Siniestro = {
                ...initialSiniestro, // Retain other missing properties if any
                id: siniestroId, tipoEvento: f.tipoEvento, timestamp: initialSiniestro?.timestamp || Date.now(), fechaHora: f.fechaHora,
                ubicacion: { lat: gpsPosition?.lat, lng: gpsPosition?.lng, manual: f.ubicacionManual, lugar: f.lugar },
                conductor: { nombre: f.condNombre, legajo: f.condLegajo, interno: f.condInterno, kilometraje: f.condKm, linea: f.condLinea },
                descripcion: { tipo: f.descTipo, resumen: f.descResumen, consecuencias: f.consecuencias, factoresCausales: f.descFactores, gravedad: f.gravedad },
                entorno: { climas: f.climas, caminos: f.caminos, visibilidades: f.visibilidades },
                datosComplementarios: { 
                    nombreTercero: f.tercNombre, dniTercero: f.tercDNI, vehiculoTercero: f.tercVehiculo, patenteTercero: f.tercPatente, seguroTercero: f.tercSeguro, polizaTercero: f.tercPoliza,
                    intervencionPolicial: f.intervencionPolicial, hayTestigos: f.hayTestigos, testigosInfo: f.testigosInfo
                },
                images: uploadedImageUrls, driveUrl: f.driveUrl
            };

            await onSaveSiniestro(newSiniestro);
            if (!initialSiniestro) {
                setStep(2);
            } else {
                if (onCancel) onCancel();
            }
        } catch (error) { alert("Error al subir las imágenes. Verifique su conexión."); }
        setIsSubmitting(false);
    };

    if (step === 2) return (
        <div className="bg-gray-900 text-white flex flex-col items-center justify-center p-10 text-center h-full min-h-[50vh]">
            <CheckCircle size={80} className="text-green-500 mb-4" />
            <h1 className="text-2xl font-bold mb-2">Denuncia Registrada</h1>
            <p className="text-gray-400 mb-6">El siniestro y las fotos han sido enviados exitosamente.</p>
            <button onClick={onCancel ? onCancel : () => window.location.reload()} className="bg-sky-600 hover:bg-sky-500 px-6 py-3 rounded-lg font-bold transition-colors">
                {onCancel ? 'Cerrar Ventana' : 'Volver al Inicio'}
            </button>
        </div>
    );

    return (
        <div className={`bg-gray-900 text-white flex flex-col relative ${onCancel ? 'h-[85vh]' : 'min-h-screen'}`}>
            <div className="bg-red-600 p-4 sticky top-0 z-50 shadow-lg flex justify-between items-center flex-shrink-0">
                <div>
                    <h1 className="text-xl font-bold flex items-center gap-2"><ShieldAlert /> Reporte de Siniestro - ANTONIO BUTTINI</h1>
                    <p className="text-xs opacity-90">Protocolo IRAM 3810 - Emergencias</p>
                </div>
                {onCancel && (
                    <button type="button" onClick={onCancel} className="text-white hover:text-red-200 transition-colors p-1 rounded-full bg-red-700">
                        <X size={20} />
                    </button>
                )}
            </div>

            <div className="p-4 space-y-6 w-full max-w-lg mx-auto overflow-y-auto flex-1">
                {/* SECCION 1 */}
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-md">
                    <h2 className="font-bold text-sky-400 mb-3 border-b border-gray-700 pb-1 uppercase text-xs tracking-wider">1. Información General</h2>
                    
                    <div className="flex gap-3 mb-4">
                        <label className={`flex-1 p-3 rounded-lg border text-center font-bold cursor-pointer transition-all ${f.tipoEvento === 'Siniestro' ? 'bg-red-900/50 border-red-500 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'bg-gray-900 border-gray-700 text-gray-500 hover:border-gray-500'}`}>
                            <input type="radio" name="tipoEvento" value="Siniestro" checked={f.tipoEvento === 'Siniestro'} onChange={handleChange} className="hidden" />
                            🚨 Es un Siniestro
                        </label>
                        <label className={`flex-1 p-3 rounded-lg border text-center font-bold cursor-pointer transition-all ${f.tipoEvento === 'Incidente' ? 'bg-yellow-900/50 border-yellow-500 text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.2)]' : 'bg-gray-900 border-gray-700 text-gray-500 hover:border-gray-500'}`}>
                            <input type="radio" name="tipoEvento" value="Incidente" checked={f.tipoEvento === 'Incidente'} onChange={handleChange} className="hidden" />
                            ⚠️ Es un Incidente
                        </label>
                    </div>

                    <div className="space-y-3"></div>
                    
                    <div className="space-y-3">
                        <label className="block"><span className="text-[10px] text-gray-400 uppercase">Fecha y Hora</span><input type="datetime-local" name="fechaHora" value={f.fechaHora} onChange={handleChange} required className="w-full bg-gray-900 border border-gray-600 rounded p-3 outline-none" /></label>
                        
                        {/* LÓGICA DE MAPA O GPS SEGÚN MODO */}
                        <div className="flex flex-col gap-2 text-xs text-gray-400 bg-gray-900/50 p-2 rounded">
                            <div className="flex items-center gap-2">
                                <MapPin size={14}/> 
                                {gpsPosition ? (
                                    <span className="text-green-400 font-bold">Ubicación Capturada</span>
                                ) : isModal ? (
                                    <span className="text-orange-400 font-bold">Falta ubicación precisa</span>
                                ) : (
                                    <span className="animate-pulse">Buscando GPS...</span>
                                )}
                            </div>
                            {isModal ? (
                                <button type="button" onClick={() => { 
                                    if(onRequestMapSelect) {
                                        onRequestMapSelect();
                                    } else if(onCancel) {
                                        onCancel(); 
                                        alert("Haga clic directamente en el mapa para establecer la ubicación."); 
                                    }
                                }} className="w-full bg-sky-600 text-white px-2 py-2 rounded font-bold hover:bg-sky-500 transition-colors">📍 Seleccionar punto en mapa</button>
                            ) : null}
                        </div>

                        <input type="text" name="ubicacionManual" value={f.ubicacionManual} onChange={handleChange} placeholder="Calle/Intersección/KM..." required={!gpsPosition} className="w-full bg-gray-900 border border-gray-600 rounded p-3 outline-none text-sm" />
                        <label className="block"><span className="text-[10px] text-gray-400 uppercase font-bold">ZONA:</span>
                            <select name="lugar" value={f.lugar} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded p-3 outline-none text-sm"><option value="Ciudad">Ciudad</option><option value="Rural">Rural</option><option value="Terminal">Terminal</option><option value="Base">Base</option></select>
                        </label>
                        
                        <div className="pt-2 border-t border-gray-700">
                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-2">Visibilidad</p>
                            <div className="grid grid-cols-2 gap-2">
                                {VISIBILIDAD.map(c => (
                                    <label key={c} className={`flex items-center gap-2 p-2 rounded text-xs border cursor-pointer transition-colors ${f.visibilidades.includes(c) ? 'bg-sky-900 border-sky-500 text-sky-100' : 'bg-gray-900 border-gray-600 text-gray-400'}`}>
                                        <input type="checkbox" className="hidden" checked={f.visibilidades.includes(c)} onChange={() => toggleArray('visibilidades', c)} /> {c}
                                    </label>
                                ))}
                            </div>
                        </div>
                        
                        <div className="pt-2 border-t border-gray-700">
                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-2">Condiciones Climáticas</p>
                            <div className="grid grid-cols-2 gap-2">
                                {CLIMAS.map(c => (
                                    <label key={c} className={`flex items-center gap-2 p-2 rounded text-xs border cursor-pointer transition-colors ${f.climas.includes(c) ? 'bg-sky-900 border-sky-500 text-sky-100' : 'bg-gray-900 border-gray-600 text-gray-400'}`}>
                                        <input type="checkbox" className="hidden" checked={f.climas.includes(c)} onChange={() => toggleArray('climas', c)} /> {c}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="pt-2 border-t border-gray-700">
                            <p className="text-[10px] text-gray-400 uppercase font-bold mb-2">Condición del Camino</p>
                            <div className="grid grid-cols-2 gap-2">
                                {CAMINOS.map(c => (
                                    <label key={c} className={`flex items-center gap-2 p-2 rounded text-xs border cursor-pointer transition-colors ${f.caminos.includes(c) ? 'bg-sky-900 border-sky-500 text-sky-100' : 'bg-gray-900 border-gray-600 text-gray-400'}`}>
                                        <input type="checkbox" className="hidden" checked={f.caminos.includes(c)} onChange={() => toggleArray('caminos', c)} /> {c}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                  {/* SECCION 2 */}
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-md">
                    <h2 className="font-bold text-sky-400 mb-3 border-b border-gray-700 pb-1 uppercase text-xs tracking-wider">2. Conductor y Unidad</h2>
                    
                    <div className="space-y-3">
                        {/* INPUT CONDUCTOR CON AUTOCOMPLETAR */}
                        <div>
                            <input 
                                type="text" 
                                list="lista-conductores" 
                                name="condNombre" 
                                value={f.condNombre} 
                                onChange={handleConductorChange} 
                                placeholder="Nombre y Apellido (Escriba para buscar...)" 
                                required 
                                className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-sm focus:border-sky-500 outline-none" 
                            />
                            <datalist id="lista-conductores">
                                {externalLists.conductores.map(c => (
                                    <option key={c.id} value={c.nombre} />
                                ))}
                            </datalist>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <input type="text" name="condLegajo" value={f.condLegajo} onChange={handleChange} placeholder="Legajo/DNI" required className="bg-gray-900 border border-gray-600 rounded p-3 text-sm focus:border-sky-500 outline-none" />
                            
                            {/* INPUT UNIDAD CON AUTOCOMPLETAR */}
                            <div>
                                <input 
                                    type="text" 
                                    list="lista-unidades" 
                                    name="condInterno" 
                                    value={f.condInterno} 
                                    onChange={handleChange} 
                                    placeholder="Interno N°" 
                                    required 
                                    className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-sm focus:border-sky-500 outline-none" 
                                />
                                <datalist id="lista-unidades">
                                    {/* ⚠️ Ajusta 'c.interno' si en tu BD se llama diferente */}
                                    {externalLists.unidades.map(u => (
                                        <option key={u.id} value={u.numero} />
                                    ))}
                                </datalist>
                            </div>
                        </div>

                        {/* INPUT SERVICIO/LINEA CON AUTOCOMPLETAR */}
                        <div>
                            <input 
                                type="text" 
                                list="lista-servicios" 
                                name="condLinea" 
                                value={f.condLinea} 
                                onChange={handleChange} 
                                placeholder="Línea afectada" 
                                required 
                                className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-sm focus:border-sky-500 outline-none" 
                            />
                            <datalist id="lista-servicios">
                                {/* ⚠️ Ajusta 's.linea' si en tu BD se llama diferente */}
                                {externalLists.servicios.map(s => (
                                    <option key={s.id} value={s.nombre} />
                                ))}
                            </datalist>
                        </div>
                    </div>
                </div>

                {/* SECCION 3 */}
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-md">
                    <h2 className="font-bold text-sky-400 mb-3 border-b border-gray-700 pb-1 uppercase text-xs tracking-wider">3. Descripción</h2>
                    
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-2">Gravedad del Siniestro</p>
                    <select name="gravedad" value={f.gravedad} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded p-3 mb-3 text-sm">
                        <option value="Leve">Leve</option>
                        <option value="Moderado">Moderado</option>
                        <option value="Grave">Grave</option>
                        <option value="Solo daños materiales">Solo daños materiales</option>
                        <option value="Fallecidos">Fallecidos</option>
                    </select>

                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-2">Tipo de Siniestro</p>
                    <select name="descTipo" value={f.descTipo} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded p-3 mb-3 text-sm">
                        <option value="Choque entre vehículos-Moto-Bicicletas">Choque entre vehículos-Moto-Bicicletas</option>
                        <option value="Choque con objeto físico">Choque con objeto físico</option>
                        <option value="Impacto a peatón">Impacto a peatón</option>
                        <option value="Caída de pasajero abordo">Caída de pasajero abordo</option>
                        <option value="Rotura de Cristales">Rotura de Cristales</option>
                    </select>
                    <textarea name="descResumen" value={f.descResumen} onChange={handleChange} placeholder="Relato de lo ocurrido..." required rows={3} className="w-full bg-gray-900 border border-gray-600 rounded p-3 mb-4 text-sm"></textarea>
                    
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-2">Consecuencias del Siniestro</p>
                    <div className="space-y-2 mb-4">
                        {f.consecuencias.map((cons, idx) => (
                            <div key={cons.tipo} className="flex items-center gap-2 bg-gray-900 p-2 rounded border border-gray-700">
                                <input type="checkbox" checked={cons.activa} onChange={(e) => handleConsecuenciaChange(idx, 'activa', e.target.checked)} className="w-5 h-5 rounded bg-gray-800 text-sky-500 focus:ring-0 border-gray-600" />
                                <span className={`flex-1 text-sm ${cons.activa ? 'text-white' : 'text-gray-500'}`}>{cons.tipo}</span>
                                {cons.tipo !== 'Solo daños materiales' && (
                                    <input type="number" placeholder="Cant." disabled={!cons.activa} value={cons.cantidad} onChange={(e) => handleConsecuenciaChange(idx, 'cantidad', e.target.value)} className="w-16 bg-gray-800 border border-gray-600 rounded p-1 text-xs text-center disabled:opacity-30" />
                                )}
                            </div>
                        ))}
                        {/* NUEVO: CAMPOS DINÁMICOS DE VÍCTIMAS INICIALES */}
                        {f.consecuencias.some(c => c.activa && c.tipo !== 'Solo daños materiales' && parseInt(c.cantidad) > 0) && (
                            <div className="mt-4 mb-4 pt-4 border-t border-gray-700">
                                <p className="text-[10px] text-red-400 uppercase font-bold mb-3">Detalle de Personas Afectadas</p>
                                {f.consecuencias.filter(c => c.activa && c.tipo !== 'Solo daños materiales' && parseInt(c.cantidad) > 0).map(c => {
                                    const count = parseInt(c.cantidad) || 0;
                                    return Array.from({ length: count }).map((_, i) => {
                                        const vId = `${c.tipo}-${i}`;
                                        const existing = f.victimasIniciales.find(v => v.id === vId) || { id: vId, tipo: c.tipo, nombre: '', dni: '' };
                                        return (
                                            <div key={vId} className="bg-gray-900 p-3 rounded mb-2 border border-red-900/50">
                                                <p className="text-[11px] text-red-300 font-bold mb-2 uppercase">{c.tipo} ({i + 1} de {count})</p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <input type="text" placeholder="Nombre y Apellido" value={existing.nombre} onChange={e => handleVictimInicialChange(vId, c.tipo, 'nombre', e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-xs text-white outline-none focus:border-sky-500" />
                                                    <input type="text" placeholder="DNI" value={existing.dni} onChange={e => handleVictimInicialChange(vId, c.tipo, 'dni', e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-xs text-white outline-none focus:border-sky-500" />
                                                </div>
                                            </div>
                                        )
                                    })
                                })}
                            </div>
                        )}
                    </div>

                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-2">Factores Causales</p>
                    <select name="descFactores" value={f.descFactores} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-sm">
                        <option value="Factor Humano (error, descripción, velocidad)">Factor Humano (error, descripción, velocidad)</option>
                        <option value="Factor vehículo (falla mecánica)">Factor vehículo (falla mecánica)</option>
                        <option value="Factor vía (estado ruta, señalización)">Factor vía (estado ruta, señalización)</option>
                        <option value="Factor externo (terceros, clima)">Factor externo (terceros, clima)</option>
                        <option value="Vandalismo">Vandalismo</option>
                    </select>
                </div>

                {/* SECCION 4 (Antes Datos Complementarios) */}
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-md">
                    <div className="flex justify-between items-center mb-3 border-b border-gray-700 pb-1">
                        <h2 className="font-bold text-sky-400 uppercase text-xs tracking-wider">4. Datos Complementarios</h2>
                        <input type="checkbox" name="tercInvolucrado" checked={f.tercInvolucrado} onChange={handleChange} className="w-6 h-6 rounded bg-gray-900 border-gray-600 text-sky-500 focus:ring-0" title="Terceros Involucrados" />
                    </div>
                    {f.tercInvolucrado && (
                        <div className="space-y-3 animate-in fade-in duration-300">
                            <input type="text" name="tercNombre" value={f.tercNombre} onChange={handleChange} placeholder="Nombre del Tercero (Opcional)" className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-sm" />
                            <div className="grid grid-cols-2 gap-3">
                                <input type="text" name="tercVehiculo" value={f.tercVehiculo} onChange={handleChange} placeholder="Marca/Modelo" className="bg-gray-900 border border-gray-600 rounded p-3 text-sm" />
                                <input type="text" name="tercPatente" value={f.tercPatente} onChange={handleChange} placeholder="Patente" className="bg-gray-900 border border-gray-600 rounded p-3 text-sm" />
                            </div>
                            <input type="text" name="tercSeguro" value={f.tercSeguro} onChange={handleChange} placeholder="Compañía de Seguro" className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-sm" />
                            
                            <div className="pt-3 border-t border-gray-700 space-y-3">
                                <label className="flex items-center gap-3 bg-gray-900 p-3 rounded border border-gray-600">
                                    <input type="checkbox" name="intervencionPolicial" checked={f.intervencionPolicial} onChange={handleChange} className="w-5 h-5 rounded bg-gray-800 border-gray-600 text-sky-500 focus:ring-0" />
                                    <span className="text-sm">Intervención Policial</span>
                                </label>
                                
                                <label className="flex items-center gap-3 bg-gray-900 p-3 rounded border border-gray-600">
                                    <input type="checkbox" name="hayTestigos" checked={f.hayTestigos} onChange={handleChange} className="w-5 h-5 rounded bg-gray-800 border-gray-600 text-sky-500 focus:ring-0" />
                                    <span className="text-sm">Testigos Disponibles</span>
                                </label>
                                {f.hayTestigos && (
                                    <textarea name="testigosInfo" value={f.testigosInfo} onChange={handleChange} placeholder="Nombre y contacto de los testigos..." rows={2} className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-sm outline-none focus:border-sky-500 animate-in fade-in"></textarea>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* SECCION 5 (Antes Fotografias) */}
                {!hideFiles && (
                    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-md pb-8">
                        <h2 className="font-bold text-sky-400 mb-3 border-b border-gray-700 pb-1 uppercase text-xs tracking-wider">5. Fotografías del Hecho {isModal && "(Opcional)"}</h2>
                        <p className="text-[11px] text-gray-400 mb-4 italic">Suba fotos de: daños propios, daños terceros, posición de vehículos (TOME FOTOS PANORÁMICAS) y documentos (TOME FOTOS ENFOCADAS Y CLARAS).</p>
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-xl cursor-pointer hover:bg-gray-700 transition-colors bg-gray-900/50">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6"><Camera size={32} className="text-sky-500 mb-2" /><p className="text-sm text-gray-400 font-bold">Tomar Foto o Abrir Galería</p></div>
                            <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
                        </label>
                        {selectedFiles.length > 0 && (
                            <div className="mt-4 grid grid-cols-2 gap-2">
                                {selectedFiles.map((file, index) => (
                                    <div key={index} className="relative bg-gray-900 p-2 rounded border border-gray-700 flex items-center justify-between">
                                        <div className="flex items-center gap-2 overflow-hidden"><ImageIcon size={14} className="text-gray-500 flex-shrink-0" /><span className="text-[10px] truncate text-gray-300">{file.name}</span></div>
                                        <button type="button" onClick={() => removeFile(index)} className="text-red-500 hover:text-red-400 p-1"><Trash2 size={14} /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="sticky bottom-0 left-0 w-full p-4 bg-gray-900 border-t border-gray-800 shadow-[0_-10px_20px_rgba(0,0,0,0.5)] z-50 flex-shrink-0">
                <button type="submit" onClick={handleSubmit} disabled={isSubmitting} className={`w-full ${isSubmitting ? 'bg-gray-600' : 'bg-red-600 hover:bg-red-500'} text-white font-bold text-lg py-4 rounded-xl shadow-lg flex flex-col items-center justify-center transition-all active:scale-95`}>
                    <span>{isSubmitting ? 'PROCESANDO...' : (initialSiniestro ? 'GUARDAR CAMBIOS' : 'REGISTRAR SINIESTRO')}</span>
                    {isSubmitting && <span className="text-[10px] font-normal animate-pulse">{uploadProgress}</span>}
                </button>
            </div>
        </div>
    );
};