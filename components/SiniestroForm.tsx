import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ShieldAlert, MapPin, Camera, CheckCircle, AlertTriangle } from 'lucide-react';
import type { Siniestro } from '../types';

interface SiniestroFormProps {
    onSaveSiniestro: (sin: Siniestro) => Promise<void>;
}

export const SiniestroForm: React.FC<SiniestroFormProps> = ({ onSaveSiniestro }) => {
    const[step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [gpsPosition, setGpsPosition] = useState<{lat: number, lng: number}|null>(null);

    // Form State
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const newSiniestro: Siniestro = {
            id: uuidv4(), timestamp: Date.now(), fechaHora: f.fechaHora,
            ubicacion: { lat: gpsPosition?.lat, lng: gpsPosition?.lng, manual: f.ubicacionManual, lugar: f.lugar },
            conductor: { nombre: f.condNombre, legajo: f.condLegajo, interno: f.condInterno, kilometraje: f.condKm, servicio: f.condServicio },
            descripcion: { tipo: f.descTipo, resumen: f.descResumen, causas: f.descCausas, gravedad: f.descGravedad },
            terceros: { involucrado: f.tercInvolucrado, nombre: f.tercNombre, dni: f.tercDNI, vehiculo: f.tercVehiculo, patente: f.tercPatente, seguro: f.tercSeguro, poliza: f.tercPoliza },
            pasajerosTestigos: { lesionados: f.pasLesionados, cantidad: f.pasCantidad, testigos: f.pasTestigos },
            entorno: { clima: f.entClima, calzada: f.entCalzada, iluminacion: f.entIluminacion },
            autoridades: { intervino: f.autIntervino, dependencia: f.autDependencia, alcoholemia: f.autAlcoholemia, resultadoAlcoholemia: f.autResultado },
            driveUrl: f.driveUrl
        };

        try {
            await onSaveSiniestro(newSiniestro);
            setStep(2);
        } catch (error) {
            // Guardar offline si falla Firebase
            const offline = JSON.parse(localStorage.getItem('offline_siniestros') || '[]');
            offline.push(newSiniestro);
            localStorage.setItem('offline_siniestros', JSON.stringify(offline));
            setStep(2);
        }
        setIsSubmitting(false);
    };

    if (step === 2) return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6 text-center">
            <CheckCircle size={80} className="text-green-500 mb-4" />
            <h1 className="text-2xl font-bold mb-2">Denuncia Registrada</h1>
            <p className="text-gray-400 mb-6">El siniestro ha sido enviado al Responsable Operativo. Si no hay conexión, se enviará automáticamente luego.</p>
            <button onClick={() => window.location.reload()} className="bg-sky-600 px-6 py-3 rounded-lg font-bold">Volver al Inicio</button>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-900 text-white pb-24">
            <div className="bg-red-600 p-4 sticky top-0 z-10 shadow-lg">
                <h1 className="text-xl font-bold flex items-center gap-2"><ShieldAlert /> Reporte de Siniestro</h1>
                <p className="text-xs opacity-90">Protocolo IRAM 3810 - Emergencias</p>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-6 max-w-md mx-auto">
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                    <h2 className="font-bold text-sky-400 mb-3 border-b border-gray-700 pb-1">1. Información General</h2>
                    <input type="datetime-local" name="fechaHora" value={f.fechaHora} onChange={handleChange} required className="w-full bg-gray-900 border border-gray-600 rounded p-3 mb-3 outline-none" />
                    <div className="flex items-center gap-2 mb-2 text-xs text-gray-400"><MapPin size={14}/> {gpsPosition ? <span className="text-green-400">GPS Capturado</span> : 'Buscando GPS...'}</div>
                    <input type="text" name="ubicacionManual" value={f.ubicacionManual} onChange={handleChange} placeholder="Calle/Intersección/KM..." required className="w-full bg-gray-900 border border-gray-600 rounded p-3 mb-3 outline-none text-sm" />
                    <select name="lugar" value={f.lugar} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded p-3 outline-none text-sm">
                        <option value="Urbano">Urbano</option><option value="Rural">Rural</option><option value="Terminal">Terminal</option><option value="Taller">Taller</option>
                    </select>
                </div>

                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                    <h2 className="font-bold text-sky-400 mb-3 border-b border-gray-700 pb-1">2. Conductor y Unidad</h2>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <input type="text" name="condNombre" value={f.condNombre} onChange={handleChange} placeholder="Nombre Conductor" required className="col-span-2 bg-gray-900 border border-gray-600 rounded p-3 text-sm" />
                        <input type="text" name="condLegajo" value={f.condLegajo} onChange={handleChange} placeholder="Legajo" required className="bg-gray-900 border border-gray-600 rounded p-3 text-sm" />
                        <input type="text" name="condInterno" value={f.condInterno} onChange={handleChange} placeholder="Interno N°" required className="bg-gray-900 border border-gray-600 rounded p-3 text-sm" />
                    </div>
                </div>

                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                    <h2 className="font-bold text-sky-400 mb-3 border-b border-gray-700 pb-1">3. Descripción</h2>
                    <select name="descTipo" value={f.descTipo} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded p-3 mb-3 text-sm"><option value="Choque entre vehículos">Choque entre vehículos</option><option value="Atropello">Atropello</option><option value="Caída de pasajero">Caída de pasajero</option><option value="Despiste">Despiste</option><option value="Otro">Otro</option></select>
                    <textarea name="descResumen" value={f.descResumen} onChange={handleChange} placeholder="Relato breve de lo ocurrido..." required rows={3} className="w-full bg-gray-900 border border-gray-600 rounded p-3 mb-3 text-sm"></textarea>
                    <select name="descGravedad" value={f.descGravedad} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-sm"><option value="Solo daños materiales">Solo daños materiales</option><option value="Heridos leves">Heridos leves</option><option value="Heridos graves">Heridos graves</option><option value="Fallecidos">Fallecidos</option></select>
                </div>

                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                    <div className="flex justify-between items-center mb-3 border-b border-gray-700 pb-1">
                        <h2 className="font-bold text-sky-400">4. Terceros Involucrados</h2>
                        <input type="checkbox" name="tercInvolucrado" checked={f.tercInvolucrado} onChange={handleChange} className="w-5 h-5" />
                    </div>
                    {f.tercInvolucrado && (
                        <div className="space-y-3">
                            <input type="text" name="tercNombre" value={f.tercNombre} onChange={handleChange} placeholder="Nombre Tercero" className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-sm" />
                            <div className="grid grid-cols-2 gap-3">
                                <input type="text" name="tercVehiculo" value={f.tercVehiculo} onChange={handleChange} placeholder="Vehículo" className="bg-gray-900 border border-gray-600 rounded p-3 text-sm" />
                                <input type="text" name="tercPatente" value={f.tercPatente} onChange={handleChange} placeholder="Patente" className="bg-gray-900 border border-gray-600 rounded p-3 text-sm" />
                            </div>
                            <input type="text" name="tercSeguro" value={f.tercSeguro} onChange={handleChange} placeholder="Compañía Seguro / Póliza" className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-sm" />
                        </div>
                    )}
                </div>

                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                    <h2 className="font-bold text-sky-400 mb-3 border-b border-gray-700 pb-1">5. Fotografías (Google Drive)</h2>
                    <p className="text-xs text-gray-400 mb-3"><Camera className="inline" size={14}/> Pegue aquí el enlace a la carpeta de Google Drive o sistema de fotos corporativo donde subió las imágenes del siniestro.</p>
                    <input type="url" name="driveUrl" value={f.driveUrl} onChange={handleChange} placeholder="https://drive.google.com/..." required className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-sm" />
                </div>

                <p className="text-[10px] text-gray-500 text-center px-4">Al enviar este formulario, los datos se tratarán conforme a la Ley 25.326 de Protección de Datos Personales.</p>

                <div className="fixed bottom-0 left-0 w-full p-4 bg-gray-900 border-t border-gray-800">
                    <button type="submit" disabled={isSubmitting} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold text-lg py-4 rounded-xl shadow-lg flex justify-center items-center">
                        {isSubmitting ? 'Enviando...' : 'Registrar Siniestro'}
                    </button>
                </div>
            </form>
        </div>
    );
};