import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MapPin, AlertTriangle, CheckCircle, Navigation, AlertOctagon, Construction, Zap, Info } from 'lucide-react';
import type { Risk, DriverReportDetails, RiskType, Position } from '../types';

interface DriverAppProps {
    riskTypes: RiskType[];
    onSaveReport: (risk: Risk) => void;
}

const CATEGORIAS_IRAM =[
    { id: 'obstaculo', name: 'Obstáculo Físico', desc: 'Ramas, cables, escombros', icon: <AlertOctagon size={32}/>, color: '#f97316' },
    { id: 'infraestructura', name: 'Falla Infraestructura', desc: 'Bache, hundimiento', icon: <Construction size={32}/>, color: '#ef4444' },
    { id: 'senalizacion', name: 'Señalización/Semáforo', desc: 'Apagado, tapada', icon: <Zap size={32}/>, color: '#eab308' },
    { id: 'desvio', name: 'Corte/Desvío', desc: 'Obra, evento, accidente', icon: <Navigation size={32}/>, color: '#8b5cf6' },
    { id: 'riesgo', name: 'Punto de Riesgo', desc: 'Agua, baja visibilidad, animales', icon: <AlertTriangle size={32}/>, color: '#3b82f6' },
];

export const DriverApp: React.FC<DriverAppProps> = ({ riskTypes, onSaveReport }) => {
    // Estado del formulario
    const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Categoria, 2: Detalles, 3: Exito
    const [categoria, setCategoria] = useState<any>(null);
    const[gpsPosition, setGpsPosition] = useState<Position | null>(null);
    const[gpsStatus, setGpsStatus] = useState<'buscando' | 'ok' | 'error'>('buscando');
    
    // Datos precargados del conductor (se guardan en localStorage para rapidez)
    const[unidad, setUnidad] = useState(localStorage.getItem('driver_unidad') || '');
    const [linea, setLinea] = useState(localStorage.getItem('driver_linea') || '');
    
    // Campos IRAM
    const[sentido, setSentido] = useState('Ambos');
    const [ubicacionManual, setUbicacionManual] = useState('');
    const [huboDesvio, setHuboDesvio] = useState(false);
    const [rutaAlternativa, setRutaAlternativa] = useState('');
    const[velocidadSugerida, setVelocidadSugerida] = useState('');
    const[carrilRecomendado, setCarrilRecomendado] = useState('');
    const [observaciones, setObservaciones] = useState('');

    useEffect(() => {
        // Pedir GPS al abrir la app para ganar tiempo
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setGpsPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setGpsStatus('ok');
            },
            (err) => {
                console.warn("Error GPS:", err);
                setGpsStatus('error');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    },[]);

    const handleSelectCategory = (cat: any) => {
        setCategoria(cat);
        setStep(2);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Guardar unidad/linea para la próxima vez
        localStorage.setItem('driver_unidad', unidad);
        localStorage.setItem('driver_linea', linea);

        // Intentar vincular a un Tipo de Riesgo del sistema principal (fallback al primero)
        const defaultRiskType = riskTypes.find(rt => rt.isIncident) || riskTypes[0];
        
        const driverDetails: DriverReportDetails = {
            unidad, linea, sentido,
            categoriaIRAM: categoria.name,
            huboDesvio, rutaAlternativa, velocidadSugerida, carrilRecomendado, ubicacionManual
        };

        const newRisk: Risk = {
            id: uuidv4(),
            position: gpsPosition || { lat: -34.6175, lng: -68.335 }, // Fallback a San Rafael centro si no hay GPS
            riskTypeId: defaultRiskType?.id || '1',
            description: observaciones || `Reporte IRAM 3810: ${categoria.name}`,
            associatedRouteIds: [], // Se calculará en el App.tsx principal al sincronizar
            images:[],
            driverReportDetails: driverDetails
        };

        onSaveReport(newRisk);
        setStep(3);
    };

    const resetForm = () => {
        setCategoria(null); setHuboDesvio(false); setRutaAlternativa(''); 
        setVelocidadSugerida(''); setCarrilRecomendado(''); setObservaciones(''); setUbicacionManual('');
        setStep(1);
    };

    // PANTALLA 1: BOTONES GIGANTES
    if (step === 1) {
        return (
            <div className="min-h-screen bg-gray-900 text-white p-4 flex flex-col">
                <div className="flex items-center gap-3 mb-6 bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-md">
                    <AlertTriangle className="text-yellow-400 flex-shrink-0" size={32} />
                    <div>
                        <h1 className="text-xl font-bold text-sky-400 leading-tight">Reporte Novedades</h1>
                        <p className="text-xs text-gray-400">IRAM 3810 - Uso Exclusivo Conductores</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pb-6">
                    <h2 className="text-gray-300 font-medium px-1 mb-2">Seleccione el tipo de incidencia:</h2>
                    {CATEGORIAS_IRAM.map(cat => (
                        <button key={cat.id} onClick={() => handleSelectCategory(cat)} className="w-full bg-gray-800 border-2 border-gray-700 hover:border-sky-500 rounded-2xl p-4 flex items-center gap-4 transition-all active:scale-95 text-left">
                            <div className="p-3 rounded-full" style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>
                                {cat.icon}
                            </div>
                            <div>
                                <p className="font-bold text-lg">{cat.name}</p>
                                <p className="text-sm text-gray-400">{cat.desc}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // PANTALLA 3: ÉXITO
    if (step === 3) {
        return (
            <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center justify-center text-center">
                <CheckCircle size={80} className="text-green-500 mb-6" />
                <h1 className="text-3xl font-bold mb-2">Reporte Enviado</h1>
                <p className="text-gray-400 mb-8">La novedad ha sido registrada en el sistema central y aparecerá en el mapa.</p>
                <button onClick={resetForm} className="bg-sky-500 text-white font-bold text-xl py-4 px-8 rounded-xl w-full shadow-lg active:bg-sky-600">
                    Nuevo Reporte
                </button>
            </div>
        );
    }

    // PANTALLA 2: DETALLES IRAM 3810
    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 flex flex-col">
            <div className="flex justify-between items-center mb-4 bg-gray-800 p-3 rounded-xl border border-gray-700">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: categoria.color }}></div>
                    <span className="font-bold">{categoria.name}</span>
                </div>
                <button onClick={() => setStep(1)} className="text-sky-400 text-sm font-bold p-2">Cambiar</button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pb-24 space-y-5">
                {/* Info Unidad */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Unidad N°</label>
                        <input type="text" required value={unidad} onChange={e=>setUnidad(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-lg font-bold focus:border-sky-500 outline-none" placeholder="Ej: 142" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Línea/Ramal</label>
                        <input type="text" required value={linea} onChange={e=>setLinea(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-lg font-bold focus:border-sky-500 outline-none" placeholder="Ej: 510" />
                    </div>
                </div>

                {/* GPS / Ubicacion */}
                <div className="bg-gray-800 p-3 rounded-xl border border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                        <MapPin size={18} className={gpsStatus === 'ok' ? 'text-green-400' : (gpsStatus === 'buscando' ? 'text-yellow-400 animate-pulse' : 'text-red-400')} />
                        <span className="text-sm font-medium">
                            {gpsStatus === 'ok' ? 'GPS Capturado Exitosamente' : (gpsStatus === 'buscando' ? 'Obteniendo GPS...' : 'GPS No Disponible')}
                        </span>
                    </div>
                    {gpsStatus !== 'ok' && (
                        <input type="text" value={ubicacionManual} onChange={e=>setUbicacionManual(e.target.value)} placeholder="Escriba calle/intersección manual..." className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-sm outline-none" required={gpsStatus !== 'ok'} />
                    )}
                </div>

                {/* Sentido */}
                <div>
                    <label className="block text-xs text-gray-400 mb-2">Sentido de Circulación</label>
                    <div className="flex gap-2">
                        {['Ascendente', 'Descendente', 'Ambos'].map(op => (
                            <button type="button" key={op} onClick={() => setSentido(op)} className={`flex-1 py-3 rounded-lg text-sm font-bold border transition-colors ${sentido === op ? 'bg-sky-600 border-sky-500 text-white' : 'bg-gray-800 border-gray-600 text-gray-400'}`}>
                                {op}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Acción Tomada */}
                <div className="bg-gray-800 p-3 rounded-xl border border-gray-700 space-y-3">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-medium">¿Hubo desvío?</label>
                        <button type="button" onClick={() => setHuboDesvio(!huboDesvio)} className={`w-14 h-8 rounded-full relative transition-colors ${huboDesvio ? 'bg-green-500' : 'bg-gray-600'}`}>
                            <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-all ${huboDesvio ? 'left-7' : 'left-1'}`}></div>
                        </button>
                    </div>
                    
                    {huboDesvio && (
                        <input type="text" value={rutaAlternativa} onChange={e=>setRutaAlternativa(e.target.value)} placeholder="Ruta alternativa utilizada..." className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-sm outline-none" />
                    )}

                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Vel. Precautoria</label>
                            <input type="number" value={velocidadSugerida} onChange={e=>setVelocidadSugerida(e.target.value)} placeholder="Ej: 20 km/h" className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-sm outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Carril Recomendado</label>
                            <select value={carrilRecomendado} onChange={e=>setCarrilRecomendado(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-sm outline-none text-white">
                                <option value="">Ninguno</option>
                                <option value="Izquierdo">Izquierdo</option>
                                <option value="Central">Central</option>
                                <option value="Derecho">Derecho</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Observaciones (Texto/Voz nativa) */}
                <div>
                    <label className="flex items-center gap-1 text-xs text-gray-400 mb-1"><Info size={14}/> Observaciones / Detalles (Use micrófono del teclado)</label>
                    <textarea rows={3} value={observaciones} onChange={e=>setObservaciones(e.target.value)} placeholder="Detalle la novedad aquí..." className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-sm outline-none focus:border-sky-500"></textarea>
                </div>

                {/* Fixed Bottom Button */}
                <div className="fixed bottom-0 left-0 w-full p-4 bg-gray-900 border-t border-gray-800">
                    <button type="submit" className="w-full bg-sky-500 text-white font-bold text-lg py-4 rounded-xl shadow-[0_0_15px_rgba(14,165,233,0.5)] active:bg-sky-600 flex justify-center items-center gap-2">
                        Enviar Reporte a Base
                    </button>
                </div>
            </form>
        </div>
    );
};