import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ShieldAlert, MapPin, Camera, CheckCircle, ExternalLink, Trash2, Image as ImageIcon } from 'lucide-react';
import type { Siniestro } from '../types';
import { uploadSiniestroImage } from '../lib/firebase'; // Asegura que la ruta sea correcta según tu carpeta

interface SiniestroFormProps {
    onSaveSiniestro: (sin: Siniestro) => Promise<void>;
}

export const SiniestroForm: React.FC<SiniestroFormProps> = ({ onSaveSiniestro }) => {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState("");
    const [gpsPosition, setGpsPosition] = useState<{lat: number, lng: number}|null>(null);
    
    // Estado para las fotos seleccionadas
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

    const [f, setF] = useState({
        fechaHora: new Date().toISOString().slice(0,16), ubicacionManual: '', lugar: 'Urbano',
        condNombre: '', condLegajo: '', condInterno: '', condKm: '', condServicio: '',
        descTipo: 'Choque entre vehículos', descResumen: '', descCausas: 'Maniobra de tercero', descGravedad: 'Solo daños materiales',
        tercInvolucrado: false, tercNombre: '', tercDNI: '', tercVehiculo: '', tercPatente: '', tercSeguro: '', tercPoliza: '',
        pasLesionados: false, pasCantidad: '', pasTestigos: '',
        entClima: 'Despejado', entCalzada: 'Seca', entIluminacion: 'Día',
        autIntervino: false, autDependencia: '', autAlcoholemia: false, autResultado: '',
        driveUrl: ''
    });

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            pos => setGpsPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => console.warn("GPS no disponible"),
            { enableHighAccuracy: true }
        );
    }, []);

    const handleChange = (e: any) => setF({ ...f,[e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setSelectedFiles(prev => [...prev, ...filesArray]);
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedFiles.length === 0) return alert("Debe adjuntar al menos una fotografía del hecho.");
        
        setIsSubmitting(true);
        const siniestroId = uuidv4();
        const uploadedImageUrls: string[] = [];

        try {
            // 1. Subir fotos al Storage una por una
            for (let i = 0; i < selectedFiles.length; i++) {
                setUploadProgress(`Subiendo foto ${i + 1} de ${selectedFiles.length}...`);
                const url = await uploadSiniestroImage(siniestroId, selectedFiles[i]);
                uploadedImageUrls.push(url);
            }

            // 2. Crear objeto final
            const newSiniestro: Siniestro = {
                id: siniestroId, timestamp: Date.now(), fechaHora: f.fechaHora,
                ubicacion: { lat: gpsPosition?.lat, lng: gpsPosition?.lng, manual: f.ubicacionManual, lugar: f.lugar },
                conductor: { nombre: f.condNombre, legajo: f.condLegajo, interno: f.condInterno, kilometraje: f.condKm, servicio: f.condServicio },
                descripcion: { tipo: f.descTipo, resumen: f.descResumen, causas: f.descCausas, gravedad: f.descGravedad },
                terceros: { involucrado: f.tercInvolucrado, nombre: f.tercNombre, dni: f.tercDNI, vehiculo: f.tercVehiculo, patente: f.tercPatente, seguro: f.tercSeguro, poliza: f.tercPoliza },
                pasajerosTestigos: { lesionados: f.pasLesionados, cantidad: f.pasCantidad, testigos: f.pasTestigos },
                entorno: { clima: f.entClima, calzada: f.entCalzada, iluminacion: f.entIluminacion },
                autoridades: { intervino: f.autIntervino, dependencia: f.autDependencia, alcoholemia: f.autAlcoholemia, resultadoAlcoholemia: f.autResultado },
                images: uploadedImageUrls,
                driveUrl: f.driveUrl
            };

            await onSaveSiniestro(newSiniestro);
            setStep(2);
        } catch (error) {
            console.error(error);
            alert("Error al subir las imágenes. Verifique su conexión.");
        }
        setIsSubmitting(false);
    };

    if (step === 2) return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6 text-center">
            <CheckCircle size={80} className="text-green-500 mb-4" />
            <h1 className="text-2xl font-bold mb-2">Denuncia Registrada</h1>
            <p className="text-gray-400 mb-6">El siniestro y las fotos han sido enviados exitosamente.</p>
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
                {/* SECCION 1 */}
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-md">
                    <h2 className="font-bold text-sky-400 mb-3 border-b border-gray-700 pb-1 uppercase text-xs tracking-wider">1. Información General</h2>
                    <div className="space-y-3">
                        <label className="block">
                            <span className="text-[10px] text-gray-400 uppercase">Fecha y Hora del Hecho</span>
                            <input type="datetime-local" name="fechaHora" value={f.fechaHora} onChange={handleChange} required className="w-full bg-gray-900 border border-gray-600 rounded p-3 outline-none" />
                        </label>
                        <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-900/50 p-2 rounded"><MapPin size={14}/> {gpsPosition ? <span className="text-green-400 font-bold">Ubicación GPS Obtenida</span> : <span className="animate-pulse">Buscando GPS...</span>}</div>
                        <input type="text" name="ubicacionManual" value={f.ubicacionManual} onChange={handleChange} placeholder="Calle/Intersección/KM..." required className="w-full bg-gray-900 border border-gray-600 rounded p-3 outline-none text-sm" />
                        <select name="lugar" value={f.lugar} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded p-3 outline-none text-sm">
                            <option value="Urbano">Urbano</option><option value="Rural">Rural</option><option value="Terminal">Terminal</option><option value="Taller">Taller</option>
                        </select>
                    </div>
                </div>

                {/* SECCION 2 */}
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-md">
                    <h2 className="font-bold text-sky-400 mb-3 border-b border-gray-700 pb-1 uppercase text-xs tracking-wider">2. Conductor y Unidad</h2>
                    <div className="space-y-3">
                        <input type="text" name="condNombre" value={f.condNombre} onChange={handleChange} placeholder="Nombre y Apellido" required className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-sm" />
                        <div className="grid grid-cols-2 gap-3">
                            <input type="text" name="condLegajo" value={f.condLegajo} onChange={handleChange} placeholder="Legajo/DNI" required className="bg-gray-900 border border-gray-600 rounded p-3 text-sm" />
                            <input type="text" name="condInterno" value={f.condInterno} onChange={handleChange} placeholder="Interno N°" required className="bg-gray-900 border border-gray-600 rounded p-3 text-sm" />
                        </div>
                    </div>
                </div>

                {/* SECCION 3 */}
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-md">
                    <h2 className="font-bold text-sky-400 mb-3 border-b border-gray-700 pb-1 uppercase text-xs tracking-wider">3. Descripción</h2>
                    <select name="descTipo" value={f.descTipo} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded p-3 mb-3 text-sm">
                        <option value="Choque entre vehículos">Choque entre vehículos</option>
                        <option value="Atropello">Atropello</option>
                        <option value="Caída de pasajero">Caída de pasajero</option>
                        <option value="Incendio">Incendio</option>
                        <option value="Despiste">Despiste</option>
                        <option value="Rotura mecánica con riesgo">Rotura mecánica con riesgo</option>
                        <option value="Otro">Otro</option>
                    </select>
                    <textarea name="descResumen" value={f.descResumen} onChange={handleChange} placeholder="Relato de lo ocurrido..." required rows={3} className="w-full bg-gray-900 border border-gray-600 rounded p-3 mb-3 text-sm"></textarea>
                    <select name="descGravedad" value={f.descGravedad} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-sm">
                        <option value="Solo daños materiales">Solo daños materiales</option>
                        <option value="Heridos leves">Heridos leves</option>
                        <option value="Heridos graves">Heridos graves</option>
                        <option value="Fallecidos">Fallecidos</option>
                    </select>
                </div>

                {/* NUEVA SECCION 4 */}
                <div className="bg-blue-900/30 p-4 rounded-xl border border-blue-500/50 shadow-md">
                    <h2 className="font-bold text-blue-400 mb-3 border-b border-blue-500/30 pb-1 uppercase text-xs tracking-wider">4. Deslinde de Atención Médica</h2>
                    <p className="text-[11px] text-blue-200/70 mb-4">Si el pasajero o tercero manifiesta no requerir atención médica inmediata, debe completar el siguiente formulario digital.</p>
                    <a 
                        href="https://deslinde-responsabilidad.vercel.app/" 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors shadow-lg"
                    >
                        Acceder al Formulario <ExternalLink size={18} />
                    </a>
                </div>

                {/* SECCION 5 (Antes 4) */}
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-md">
                    <div className="flex justify-between items-center mb-3 border-b border-gray-700 pb-1">
                        <h2 className="font-bold text-sky-400 uppercase text-xs tracking-wider">5. Terceros Involucrados</h2>
                        <input type="checkbox" name="tercInvolucrado" checked={f.tercInvolucrado} onChange={handleChange} className="w-6 h-6 rounded bg-gray-900 border-gray-600 text-sky-500 focus:ring-0" />
                    </div>
                    {f.tercInvolucrado && (
                        <div className="space-y-3 animate-in fade-in duration-300">
                            <input type="text" name="tercNombre" value={f.tercNombre} onChange={handleChange} placeholder="Nombre del Tercero" className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-sm" />
                            <div className="grid grid-cols-2 gap-3">
                                <input type="text" name="tercVehiculo" value={f.tercVehiculo} onChange={handleChange} placeholder="Marca/Modelo" className="bg-gray-900 border border-gray-600 rounded p-3 text-sm" />
                                <input type="text" name="tercPatente" value={f.tercPatente} onChange={handleChange} placeholder="Patente" className="bg-gray-900 border border-gray-600 rounded p-3 text-sm" />
                            </div>
                            <input type="text" name="tercSeguro" value={f.tercSeguro} onChange={handleChange} placeholder="Compañía de Seguro" className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-sm" />
                        </div>
                    )}
                </div>

                {/* SECCION 6 (Antes 5) - ACTUALIZADA CON CARGA DE ARCHIVOS */}
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-md">
                    <h2 className="font-bold text-sky-400 mb-3 border-b border-gray-700 pb-1 uppercase text-xs tracking-wider">6. Fotografías del Hecho</h2>
                    <p className="text-[11px] text-gray-400 mb-4 italic">Suba fotos de: daños propios, daños terceros, posición de vehículos y documentos.</p>
                    
                    {/* Botón para activar cámara/galería */}
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-xl cursor-pointer hover:bg-gray-700 transition-colors bg-gray-900/50">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Camera size={32} className="text-sky-500 mb-2" />
                            <p className="text-sm text-gray-400 font-bold">Tomar Foto o Abrir Galería</p>
                        </div>
                        <input 
                            type="file" 
                            accept="image/*" 
                            multiple 
                            capture="environment" // Esto fuerza a algunos móviles a abrir la cámara trasera directamente
                            className="hidden" 
                            onChange={handleFileSelect}
                        />
                    </label>

                    {/* Previsualización de archivos seleccionados */}
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
                    <h2 className="text-[10px] font-bold text-gray-500 uppercase mb-2 italic">Opcional: Carpeta Drive</h2>
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