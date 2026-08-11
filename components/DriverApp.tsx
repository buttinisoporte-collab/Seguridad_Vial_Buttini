import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MapPin, AlertTriangle, CheckCircle, Navigation, AlertOctagon, Construction, Zap, Info, LogOut, User as UserIcon, Users, CreditCard } from 'lucide-react';
import type { Risk, DriverReportDetails, Position, User, Route } from '../types';
import { loadExternalData } from '../lib/supabase'; // <-- NUEVA IMPORTACIÓN

interface DriverAppProps {
    routes: Route[];
    currentDriver: User;
    onSaveReport: (risk: Risk) => void;
    onLogout: () => void;
}

const CATEGORIAS_IRAM =[
    { id: 'obstaculo', name: 'Obstáculo Físico', desc: 'Ramas, cables, escombros', icon: <AlertOctagon size={36}/>, color: '#f97316' },
    { id: 'infraestructura', name: 'Falla Infraestructura', desc: 'Bache, hundimiento', icon: <Construction size={36}/>, color: '#ef4444' },
    { id: 'senalizacion', name: 'Señalización/Semáforo', desc: 'Apagado, tapada', icon: <Zap size={36}/>, color: '#eab308' },
    { id: 'desvio', name: 'Corte/Desvío', desc: 'Obra, evento, accidente', icon: <Navigation size={36}/>, color: '#8b5cf6' },
    { id: 'riesgo', name: 'Punto de Riesgo', desc: 'Agua, baja visibilidad, animales', icon: <AlertTriangle size={36}/>, color: '#3b82f6' },
    { id: 'pasajeros', name: 'Problemática Pasajeros', desc: 'Falta de pago, agresión, menores, etc.', icon: <Users size={36}/>, color: '#ec4899' },
    { id: 'sube', name: 'SUBE', desc: 'Consola no responde, no cobra, etc.', icon: <CreditCard size={36}/>, color: '#ff6b00' },
];

export const DriverApp: React.FC<DriverAppProps> = ({ routes, currentDriver, onSaveReport, onLogout }) => {
    const[step, setStep] = useState<1 | 2 | 3>(1);
    const[categoria, setCategoria] = useState<any>(null);
    const[gpsPosition, setGpsPosition] = useState<Position | null>(null);
    const[gpsStatus, setGpsStatus] = useState<'buscando' | 'ok' | 'error'>('buscando');
    
    const[unidad, setUnidad] = useState(localStorage.getItem('driver_unidad') || '');
    const[linea, setLinea] = useState(localStorage.getItem('driver_linea') || '');
    
    const[sentido, setSentido] = useState('Ambos');
    const[ubicacionManual, setUbicacionManual] = useState('');
    const[huboDesvio, setHuboDesvio] = useState(false);
    const[rutaAlternativa, setRutaAlternativa] = useState('');
    const[velocidadSugerida, setVelocidadSugerida] = useState('');
    const[carrilRecomendado, setCarrilRecomendado] = useState('');
    const[observaciones, setObservaciones] = useState('');
    
    const[subeProblema, setSubeProblema] = useState('');
    const[subePasajerosSinCobrar, setSubePasajerosSinCobrar] = useState('');

    // ESTADO PARA LA BASE DE DATOS EXTERNA
    const [externalLists, setExternalLists] = useState({ conductores: [] as any[], unidades: [] as any[], servicios: [] as any[] });

    // CARGAR UBICACIÓN Y BASE EXTERNA AL INICIAR
    useEffect(() => {
        // Cargar GPS
        navigator.geolocation.getCurrentPosition(
            (pos) => { setGpsPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGpsStatus('ok'); },
            () => { setGpsStatus('error'); },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );

        // Cargar BD de Unidades y Servicios
        loadExternalData().then(data => setExternalLists(data));
    },[]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem('driver_unidad', unidad); localStorage.setItem('driver_linea', linea);
        
        const driverDetails: DriverReportDetails = {
            unidad, linea, sentido, categoriaIRAM: categoria.name,
            huboDesvio, rutaAlternativa, velocidadSugerida, carrilRecomendado, ubicacionManual,
            subeProblema, subePasajerosSinCobrar,
            conductorName: currentDriver.name
        };

        let finalDescription = observaciones || `Reporte: ${categoria.name}`;
        if (categoria.id === 'sube') {
            finalDescription = `Problema SUBE: ${subeProblema}${subePasajerosSinCobrar ? ` | Pasajeros sin cobrar: ${subePasajerosSinCobrar}` : ''}`;
            if (observaciones) finalDescription += ` | Obs: ${observaciones}`;
        }

        const newRisk: Risk = {
            id: uuidv4(),
            position: gpsPosition || { lat: -34.6175, lng: -68.335 },
            riskTypeId: 'incidente-ruta',
            description: finalDescription,
            associatedRouteIds:[], images:[], driverReportDetails: driverDetails,
            timestamp: Date.now()
        };

        onSaveReport(newRisk); setStep(3);
    };

    const resetForm = () => { setCategoria(null); setHuboDesvio(false); setRutaAlternativa(''); setVelocidadSugerida(''); setCarrilRecomendado(''); setObservaciones(''); setUbicacionManual(''); setSubeProblema(''); setSubePasajerosSinCobrar(''); setStep(1); };

    // ==============================================================================
    // PASO 1: SELECCIÓN DE CATEGORÍA
    // ==============================================================================
    if (step === 1) {
        return (
            <div className="min-h-screen bg-gray-900 text-white p-4 flex flex-col">
                <div className="flex justify-between items-center mb-6 bg-gray-800 p-5 rounded-2xl border border-gray-700 shadow-md">
                    <div>
                        <h1 className="text-2xl font-bold text-sky-400 tracking-wide">Novedades</h1>
                        <p className="text-sm text-gray-400 mt-1 flex items-center gap-1"><UserIcon size={14}/> {currentDriver.name}</p>
                    </div>
                    <button onClick={onLogout} className="p-3 text-red-400 bg-red-900/20 rounded-xl hover:bg-red-900/40 transition-colors"><LogOut size={24}/></button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-4 pb-6 custom-scrollbar">
                    <h2 className="text-gray-400 font-bold px-1 mb-2 text-sm uppercase tracking-wider">¿Qué desea reportar?</h2>
                    {CATEGORIAS_IRAM.map(cat => (
                        <button key={cat.id} onClick={() => { setCategoria(cat); setStep(2); }} className="w-full bg-gray-800 border-2 border-gray-700 hover:border-sky-500 active:bg-gray-700 rounded-2xl p-5 flex items-center gap-5 text-left shadow-sm transition-all">
                            <div className="p-4 rounded-full flex-shrink-0" style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>{cat.icon}</div>
                            <div>
                                <p className="font-bold text-lg leading-tight mb-1">{cat.name}</p>
                                <p className="text-xs text-gray-400 leading-snug">{cat.desc}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // ==============================================================================
    // PASO 3: PANTALLA DE ÉXITO
    // ==============================================================================
    if (step === 3) {
        return (
            <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center justify-center text-center">
                <CheckCircle size={100} className="text-green-500 mb-6 animate-pulse" />
                <h1 className="text-4xl font-bold mb-3 text-white">¡Enviado!</h1>
                <p className="text-gray-400 mb-10 text-lg">El reporte se registró en la base con éxito.</p>
                <button onClick={resetForm} className="bg-sky-500 text-white font-bold text-xl py-5 px-8 rounded-2xl w-full max-w-sm mb-6 shadow-lg active:scale-95 transition-transform">Nuevo Reporte</button>
                <button onClick={onLogout} className="text-gray-500 font-bold py-3 px-6 rounded-xl hover:text-white transition-colors">Cerrar Sesión</button>
            </div>
        );
    }

    // ==============================================================================
    // PASO 2: FORMULARIO DE DETALLES
    // ==============================================================================
    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 flex flex-col">
            <div className="flex justify-between items-center mb-5 bg-gray-800 p-4 rounded-2xl border border-gray-700 shadow-md">
                <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" style={{ backgroundColor: categoria.color }}></div>
                    <span className="font-bold text-lg leading-none">{categoria.name}</span>
                </div>
                <button onClick={() => setStep(1)} className="text-sky-400 text-sm font-bold bg-sky-900/20 px-3 py-2 rounded-lg">Cambiar</button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pb-28 space-y-6 custom-scrollbar">
                
                {/* UNIDAD Y LÍNEA (CON AUTOCOMPLETADO DESDE BD EXTERNA) */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-wide">Unidad N°</label>
                        <input list="driver-unidades-list" type="text" required value={unidad} onChange={e=>setUnidad(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-xl p-4 text-base font-bold focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none text-white shadow-inner" placeholder="Escriba..." />
                        <datalist id="driver-unidades-list">
                            {externalLists.unidades.map(u => <option key={u.id} value={u.numero || u.interno} />)}
                        </datalist>
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-wide">Línea / Servicio</label>
                        <input list="driver-lineas-list" type="text" required value={linea} onChange={e=>setLinea(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-xl p-4 text-base font-bold focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none text-white shadow-inner" placeholder="Escriba..." />
                        <datalist id="driver-lineas-list">
                            {externalLists.servicios.map(s => <option key={s.id} value={s.nombre || s.linea} />)}
                        </datalist>
                    </div>
                </div>

                <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700 shadow-md">
                    <div className="flex items-center gap-3 mb-3">
                        <MapPin size={20} className={gpsStatus === 'ok' ? 'text-green-400' : 'text-red-400'} />
                        <span className="text-sm font-bold text-gray-200">{gpsStatus === 'ok' ? 'Ubicación Satelital OK' : 'Buscando GPS...'}</span>
                    </div>
                    {gpsStatus !== 'ok' && <input type="text" value={ubicacionManual} onChange={e=>setUbicacionManual(e.target.value)} placeholder="Escriba la Calle/Intersección..." className="w-full bg-gray-900 border border-gray-600 rounded-xl p-4 text-sm outline-none text-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20" required />}
                </div>

                {/* BLOQUES EXCLUIDOS PARA SUBE / PASAJEROS */}
                {categoria?.id !== 'pasajeros' && categoria?.id !== 'sube' && (
                    <>
                        <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700 shadow-md">
                            <label className="block text-[11px] font-bold text-gray-400 mb-3 uppercase tracking-wide">Sentido de Circulación</label>
                            <div className="flex gap-2">
                                {['Ascendente', 'Descendente', 'Ambos'].map(op => (
                                    <button type="button" key={op} onClick={() => setSentido(op)} className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-colors ${sentido === op ? 'bg-sky-600 border-sky-500 text-white shadow-lg' : 'bg-gray-900 border-gray-700 text-gray-400 hover:bg-gray-800'}`}>
                                        {op}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700 shadow-md space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-bold text-gray-200">¿Se activó un Desvío?</label>
                                <button type="button" onClick={() => setHuboDesvio(!huboDesvio)} className={`w-16 h-8 rounded-full relative transition-colors shadow-inner ${huboDesvio ? 'bg-green-500' : 'bg-gray-600'}`}>
                                    <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-all shadow-md ${huboDesvio ? 'left-9' : 'left-1'}`}></div>
                                </button>
                            </div>
                            {huboDesvio && <input type="text" value={rutaAlternativa} onChange={e=>setRutaAlternativa(e.target.value)} placeholder="Indique la ruta alternativa..." className="w-full bg-gray-900 border border-gray-600 rounded-xl p-4 text-sm outline-none text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20" />}
                        </div>
                    </>
                )}

                {/* BLOQUE ESPECIAL PARA SUBE */}
                {categoria?.id === 'sube' && (
                    <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700 shadow-md space-y-5">
                        <div>
                            <label className="block text-[11px] font-bold text-gray-400 mb-3 uppercase tracking-wide">¿Cuál es el problema?</label>
                            <div className="flex flex-wrap gap-2">
                                {['CONSOLA NO RESPONDE', 'SINCRONIZANDO', 'NO COBRA QR', 'APAGADA', 'NO ACREDITA CARGAS'].map(prob => (
                                    <button type="button" key={prob} onClick={() => setSubeProblema(prob)} className={`flex-1 min-w-[45%] py-3 px-2 rounded-xl text-xs font-bold border transition-colors ${subeProblema === prob ? 'bg-[#0088ce] border-[#0088ce] text-white shadow-lg' : 'bg-gray-900 border-gray-700 text-gray-400 hover:bg-gray-800'}`}>
                                        {prob}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-wide">Pasajeros Transportados sin cobrar</label>
                            <textarea value={subePasajerosSinCobrar} onChange={e=>setSubePasajerosSinCobrar(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-xl p-4 text-white text-base outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20" rows={2} placeholder="Ej: 15 pasajeros..." />
                        </div>
                    </div>
                )}

                {/* OBSERVACIONES GENERALES */}
                <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700 shadow-md">
                    <label className="flex items-center gap-2 text-[11px] font-bold text-gray-400 mb-3 uppercase tracking-wide"><Info size={16} className="text-sky-400"/> Observaciones Extras</label>
                    <textarea rows={3} value={observaciones} onChange={e=>setObservaciones(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-xl p-4 text-base outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-white" placeholder="Escriba más detalles aquí..." required={categoria?.id === 'pasajeros'}></textarea>
                </div>
            </form>

            <div className="fixed bottom-0 left-0 w-full p-4 bg-gray-900 border-t border-gray-800 z-50">
                <button type="submit" onClick={handleSubmit} className="w-full bg-sky-500 hover:bg-sky-400 text-white font-bold text-xl py-5 rounded-2xl active:scale-95 transition-transform shadow-[0_0_20px_rgba(14,165,233,0.3)] flex items-center justify-center gap-2">
                    Enviar a Central
                </button>
            </div>
        </div>
    );
};