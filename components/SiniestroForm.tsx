import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ShieldAlert, MapPin, Camera, CheckCircle, Trash2, Image as ImageIcon } from 'lucide-react';
import type { Siniestro, Consecuencia } from '../types';
import { uploadSiniestroImage } from '../lib/firebase';

interface SiniestroFormProps { onSaveSiniestro: (sin: Siniestro) => Promise<void>; }

const CLIMAS =['Niebla', 'Resplandor Solar', 'Lluvia', 'Nieve', 'Granizo', 'Calor extremo', 'Viento Zonda', 'Polvo en suspensión'];
const CAMINOS =['Asfalto Rugoso', 'Hielo Negro', 'Obra Vial', 'Ripio', 'Serruchos', 'Guardaganado', 'Badén', 'Animales Sueltos', 'Arena en Ruta'];
const CONSECUENCIAS_DEFAULT: Consecuencia[] =[
    { tipo: 'Solo daños materiales', activa: false, cantidad: '' },
    { tipo: 'Heridos Leves', activa: false, cantidad: '' },
    { tipo: 'Heridos Graves', activa: false, cantidad: '' },
    { tipo: 'Lesionados Transportados', activa: false, cantidad: '' },
    { tipo: 'Lesionados No Transportados', activa: false, cantidad: '' }
];

export const SiniestroForm: React.FC<SiniestroFormProps> = ({ onSaveSiniestro }) => {
    const [step, setStep] = useState(1);
    const[isSubmitting, setIsSubmitting] = useState(false);
    const[uploadProgress, setUploadProgress] = useState("");
    const[gpsPosition, setGpsPosition] = useState<{lat: number, lng: number}|null>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    const[f, setF] = useState({
        fechaHora: new Date().toISOString().slice(0,16), ubicacionManual: '', lugar: 'Ciudad',
        climas: [] as string[], caminos: [] as string[],
        condNombre: '', condLegajo: '', condInterno: '', condKm: '', condLinea: '',
        descTipo: 'Choque entre vehículos-Moto-Bicicletas', descResumen: '', 
        consecuencias: JSON.parse(JSON.stringify(CONSECUENCIAS_DEFAULT)) as Consecuencia[], 
        descFactores: 'Factor Humano (error, descripción, velocidad)',
        tercNombre: '', tercDNI: '', tercVehiculo: '', tercPatente: '', tercSeguro: '', tercPoliza: '',
        intervencionPolicial: false, hayTestigos: false, testigosInfo: '', driveUrl: ''
    });

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            pos => setGpsPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => console.warn("GPS no disponible"), { enableHighAccuracy: true }
        );
    },[]);

    const handleChange = (e: any) => setF({ ...f, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) setSelectedFiles(prev =>[...prev, ...Array.from(e.target.files!)]); };
    const removeFile = (index: number) => setSelectedFiles(prev => prev.filter((_, i) => i !== index));

    const toggleArray = (arrayName: 'climas' | 'caminos', item: string) => {
        setF(prev => ({ ...prev, [arrayName]: prev[arrayName].includes(item) ? prev[arrayName].filter(i => i !== item) : [...prev[arrayName], item] }));
    };

    const handleConsecuenciaChange = (index: number, field: 'activa' | 'cantidad', value: any) => {
        const newCons =[...f.consecuencias];
        newCons[index] = { ...newCons[index], [field]: value };
        setF({ ...f, consecuencias: newCons });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedFiles.length === 0) return alert("Debe adjuntar al menos una fotografía del hecho.");
        
        setIsSubmitting(true);
        const siniestroId = uuidv4();
        const uploadedImageUrls: string[] =[];

        try {
            for (let i = 0; i < selectedFiles.length; i++) {
                setUploadProgress(`Subiendo foto ${i + 1} de ${selectedFiles.length}...`);
                const url = await uploadSiniestroImage(siniestroId, selectedFiles[i]);
                uploadedImageUrls.push(url);
            }

            const newSiniestro: Siniestro = {
                id: siniestroId, timestamp: Date.now(), fechaHora: f.fechaHora,
                ubicacion: { lat: gpsPosition?.lat, lng: gpsPosition?.lng, manual: f.ubicacionManual, lugar: f.lugar },
                conductor: { nombre: f.condNombre, legajo: f.condLegajo, interno: f.condInterno, kilometraje: f.condKm, linea: f.condLinea },
                descripcion: { tipo: f.descTipo, resumen: f.descResumen, consecuencias: f.consecuencias, factoresCausales: f.descFactores },
                entorno: { climas: f.climas, caminos: f.caminos },
                datosComplementarios: { 
                    nombreTercero: f.tercNombre, dniTercero: f.tercDNI, vehiculoTercero: f.tercVehiculo, patenteTercero: f.tercPatente, seguroTercero: f.tercSeguro, polizaTercero: f.tercPoliza,
                    intervencionPolicial: f.intervencionPolicial, hayTestigos: f.hayTestigos, testigosInfo: f.testigosInfo
                },
                images: uploadedImageUrls, driveUrl: f.driveUrl
            };

            await onSaveSiniestro(newSiniestro);
            setStep(2);
        } catch (error) { alert("Error al subir las imágenes. Verifique su conexión."); }
        setIsSubmitting(false);
    };

    if (step === 2) return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6 text-center">
            <CheckCircle size={80} className="text-green-500 mb-4" />
            <h1 className="text-2xl font-bold mb-2">Denuncia Registrada</h1>
            <p className="text-gray-400 mb-6">El siniestro ha sido enviado exitosamente.</p>
            <button onClick={() => window.location.reload()} className="bg-sky-600 px-6 py-3 rounded-lg font-bold">Volver al Inicio</button>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-900 text-white pb-32">
            <div className="bg-red-600 p-4 sticky top-0 z-50 shadow-lg">
                <h1 className="text-xl font-bold flex items-center gap-2"><ShieldAlert /> Reporte de Siniestro</h1>
                <p className="text-xs opacity-90">Protocolo IRAM 3810 - Emergencias</p>
            </div>

            <div className="p-4 space-y-6 max-w-md mx-auto">
                {/* 1. INFO GENERAL */}
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-md">
                    <h2 className="font-bold text-sky-400 mb-3 border-b border-gray-700 pb-1 uppercase text-xs tracking-wider">1. Información General</h2>
                    <div className="space-y-3">
                        <label className="block"><span className="text-[10px] text-gray-400 uppercase">Fecha y Hora</span><input type="datetime-local" name="fechaHora" value={f.fechaHora} onChange={handleChange} required className="w-full bg-gray-900 border border-gray-600 rounded p-3 outline-none" /></label>
                        <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-900/50 p-2 rounded"><MapPin size={14}/> {gpsPosition ? <span className="text-green-400 font-bold">Ubicación GPS Obtenida</span> : <span className="animate-pulse">Buscando GPS...</span>}</div>
                        <input type="text" name="ubicacionManual" value={f.ubicacionManual} onChange={handleChange} placeholder="Calle/Intersección/KM..." required className="w-full bg-gray-900 border border-gray-600 rounded p-3 outline-none text-sm" />
                        <label className="block"><span className="text-[10px] text-gray-400 uppercase font-bold">ZONA:</span>
                            <select name="lugar" value={f.lugar} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded p-3 outline-none text-sm"><option value="Ciudad">Ciudad</option><option value="Rural">Rural</option><option value="Terminal">Terminal</option><option value="Base">Base</option></select>
                        </label>
                        
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

                {/* 2. CONDUCTOR */}
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-md">
                    <h2 className="font-bold text-sky-400 mb-3 border-b border-gray-700 pb-1 uppercase text-xs tracking-wider">2. Conductor y Unidad</h2>
                    <div className="space-y-3">
                        <input type="text" name="condNombre" value={f.condNombre} onChange={handleChange} placeholder="Nombre y Apellido" required className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-sm" />
                        <div className="grid grid-cols-2 gap-3">
                            <input type="text" name="condLegajo" value={f.condLegajo} onChange={handleChange} placeholder="Legajo/DNI" required className="bg-gray-900 border border-gray-600 rounded p-3 text-sm" />
                            <input type="text" name="condInterno" value={f.condInterno} onChange={handleChange} placeholder="Interno N°" required className="bg-gray-900 border border-gray-600 rounded p-3 text-sm" />
                        </div>
                        <input type="text" name="condLinea" value={f.condLinea} onChange={handleChange} placeholder="Línea afectada" required className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-sm" />
                    </div>
                </div>

                {/* 3. DESCRIPCION */}
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-md">
                    <h2 className="font-bold text-sky-400 mb-3 border-b border-gray-700 pb-1 uppercase text-xs tracking-wider">3. Descripción</h2>
                    <select name="descTipo" value={f.descTipo} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded p-3 mb-3 text-sm">
                        <option value="Choque entre vehículos-Moto-Bicicletas">Choque entre vehículos-Moto-Bicicletas</option>
                        <option value="Choque con objeto físico">Choque con objeto físico</option>
                        <option value="Impacto a peatón">Impacto a peatón</option>
                        <option value="Caída de pasajero abordo">Caída de pasajero abordo</option>
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
                    </div>

                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-2">Factores Causales</p>
                    <select name="descFactores" value={f.descFactores} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-sm">
                        <option value="Factor Humano (error, descripción, velocidad)">Factor Humano (error, descripción, velocidad)</option>
                        <option value="Factor vehículo (falla mecánica)">Factor vehículo (falla mecánica)</option>
                        <option value="Factor vía (estado ruta, señalización)">Factor vía (estado ruta, señalización)</option>
                        <option value="Factor externo (terceros, clima)">Factor externo (terceros, clima)</option>
                    </select>
                </div>

                {/* 4. DATOS COMPLEMENTARIOS (AHORA EL 4) */}
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-md">
                    <div className="flex justify-between items-center mb-3 border-b border-gray-700 pb-1">
                        <h2 className="font-bold text-sky-400 uppercase text-xs tracking-wider">4. Datos Complementarios</h2>
                        <input type="checkbox" name="tercInvolucrado" checked={f.tercInvolucrado} onChange={handleChange} className="w-6 h-6 rounded bg-gray-900 border-gray-600 text-sky-500 focus:ring-0" />
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

                {/* 5. FOTOGRAFIAS (AHORA EL 5) */}
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-md">
                    <h2 className="font-bold text-sky-400 mb-3 border-b border-gray-700 pb-1 uppercase text-xs tracking-wider">5. Fotografías del Hecho</h2>
                    <p className="text-[11px] text-gray-400 mb-4 italic">Suba fotos de: daños propios, daños terceros, posición de vehículos (TOME FOTOS PANORÁMICAS) y documentos (TOME FOTOS ENFOCADAS Y CLARAS).</p>
                    
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-xl cursor-pointer hover:bg-gray-700 transition-colors bg-gray-900/50">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Camera size={32} className="text-sky-500 mb-2" />
                            <p className="text-sm text-gray-400 font-bold">Tomar Foto o Abrir Galería</p>
                        </div>
                        <input type="file" accept="image/*" multiple capture="environment" className="hidden" onChange={handleFileSelect} />
                    </label>

                    {selectedFiles.length > 0 && (
                        <div className="mt-4 grid grid-cols-2 gap-2">
                            {selectedFiles.map((file, index) => (
                                <div key={index} className="relative bg-gray-900 p-2 rounded border border-gray-700 flex items-center justify-between">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <ImageIcon size={14} className="text-gray-500 flex-shrink-0" />
                                        <span className="text-[10px] truncate text-gray-300">{file.name}</span>
                                    </div>
                                    <button type="button" onClick={() => removeFile(index)} className="text-red-500 hover:text-red-400 p-1">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                    <h2 className="text-[10px] font-bold text-gray-500 uppercase mb-2 italic">Opcional: Carpeta Drive Externa</h2>
                    <input type="url" name="driveUrl" value={f.driveUrl} onChange={handleChange} placeholder="Link de carpeta externa (si posee)" className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-xs opacity-60" />
                </div>

                <div className="fixed bottom-0 left-0 w-full p-4 bg-gray-900 border-t border-gray-800 shadow-[0_-10px_20px_rgba(0,0,0,0.5)] z-50">
                    <button 
                        type="submit" 
                        disabled={isSubmitting} 
                        className={`w-full ${isSubmitting ? 'bg-gray-600' : 'bg-red-600 hover:bg-red-500'} text-white font-bold text-lg py-4 rounded-xl shadow-lg flex flex-col items-center justify-center transition-all active:scale-95`}
                    >
                        <span>{isSubmitting ? 'PROCESANDO...' : 'REGISTRAR SINIESTRO'}</span>
                        {isSubmitting && <span className="text-[10px] font-normal animate-pulse">{uploadProgress}</span>}
                    </button>
                </div>
            </div>
        </div>
    );
};