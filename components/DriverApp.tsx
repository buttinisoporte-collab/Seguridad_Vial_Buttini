import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MapPin, AlertTriangle, CheckCircle, Navigation, AlertOctagon, Construction, Zap, Info, LogOut, User as UserIcon } from 'lucide-react';
import type { Risk, DriverReportDetails, Position, User, Route } from '../types';

interface DriverAppProps {
    routes: Route[];
    currentDriver: User;
    onSaveReport: (risk: Risk) => void;
    onLogout: () => void;
}

const CATEGORIAS_IRAM =[
    { id: 'obstaculo', name: 'Obstáculo Físico', desc: 'Ramas, cables, escombros', icon: <AlertOctagon size={32}/>, color: '#f97316' },
    { id: 'infraestructura', name: 'Falla Infraestructura', desc: 'Bache, hundimiento', icon: <Construction size={32}/>, color: '#ef4444' },
    { id: 'senalizacion', name: 'Señalización/Semáforo', desc: 'Apagado, tapada', icon: <Zap size={32}/>, color: '#eab308' },
    { id: 'desvio', name: 'Corte/Desvío', desc: 'Obra, evento, accidente', icon: <Navigation size={32}/>, color: '#8b5cf6' },
    { id: 'riesgo', name: 'Punto de Riesgo', desc: 'Agua, baja visibilidad, animales', icon: <AlertTriangle size={32}/>, color: '#3b82f6' },
];

// Unidades Mockeadas para el autocompletado (Se podrían cargar de la DB a futuro)
const UNIDADES_HABILITADAS = Array.from({length: 150}, (_, i) => (i + 1).toString().padStart(3, '0'));

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

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (pos) => { setGpsPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGpsStatus('ok'); },
            () => { setGpsStatus('error'); },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    },[]);

    const lineasUnicas = Array.from(new Set(routes.map(r => r.line).filter(l => l)));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        localStorage.setItem('driver_unidad', unidad); localStorage.setItem('driver_linea', linea);
        
        const driverDetails: DriverReportDetails = {
            unidad, linea, sentido, categoriaIRAM: categoria.name,
            huboDesvio, rutaAlternativa, velocidadSugerida, carrilRecomendado, ubicacionManual,
            conductorName: currentDriver.name
        };

        const newRisk: Risk = {
            id: uuidv4(),
            position: gpsPosition || { lat: -34.6175, lng: -68.335 },
            // SIEMPRE SE FUERZA EL TIPO NEGRO DE INCIDENTE EN RUTA
            riskTypeId: 'incidente-ruta',
            description: observaciones || `Reporte IRAM: ${categoria.name}`,
            associatedRouteIds: [], images:[], driverReportDetails: driverDetails,
            timestamp: Date.now()
        };

        onSaveReport(newRisk); setStep(3);
    };

    const resetForm = () => { setCategoria(null); setHuboDesvio(false); setRutaAlternativa(''); setVelocidadSugerida(''); setCarrilRecomendado(''); setObservaciones(''); setUbicacionManual(''); setStep(1); };

    if (step === 1) {
        return (
            <div className="min-h-screen bg-gray-900 text-white p-4 flex flex-col">
                <div className="flex justify-between items-center mb-6 bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-md">
                    <div><h1 className="text-xl font-bold text-sky-400">Novedades</h1><p className="text-xs text-gray-400"><UserIcon size={12} className="inline"/> {currentDriver.name}</p></div>
                    <button onClick={onLogout} className="p-2 text-red-400 bg-red-900/20 rounded-lg"><LogOut size={20}/></button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3 pb-6">
                    <h2 className="text-gray-300 font-medium px-1 mb-2">Tipo de incidencia:</h2>
                    {CATEGORIAS_IRAM.map(cat => (
                        <button key={cat.id} onClick={() => { setCategoria(cat); setStep(2); }} className="w-full bg-gray-800 border-2 border-gray-700 hover:border-sky-500 rounded-2xl p-4 flex items-center gap-4 text-left">
                            <div className="p-3 rounded-full" style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>{cat.icon}</div>
                            <div><p className="font-bold text-lg">{cat.name}</p><p className="text-sm text-gray-400">{cat.desc}</p></div>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    if (step === 3) {
        return (
            <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center justify-center text-center">
                <CheckCircle size={80} className="text-green-500 mb-6" />
                <h1 className="text-3xl font-bold mb-2">Enviado</h1>
                <button onClick={resetForm} className="bg-sky-500 text-white font-bold text-xl py-4 px-8 rounded-xl w-full mt-6 mb-4">Nuevo Reporte</button>
                <button onClick={onLogout} className="text-gray-400 font-bold py-2 underline">Cerrar Sesión</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 flex flex-col">
            <div className="flex justify-between items-center mb-4 bg-gray-800 p-3 rounded-xl border border-gray-700">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: categoria.color }}></div><span className="font-bold">{categoria.name}</span></div>
                <button onClick={() => setStep(1)} className="text-sky-400 text-sm font-bold p-2">Cambiar</button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pb-24 space-y-5">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Unidad N°</label>
                        <input list="unidades-list" type="text" required value={unidad} onChange={e=>setUnidad(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-lg font-bold focus:border-sky-500 outline-none" placeholder="Buscar..." />
                        <datalist id="unidades-list">{UNIDADES_HABILITADAS.map(u => <option key={u} value={u} />)}</datalist>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Línea / Servicio</label>
                        <input list="lineas-list" type="text" required value={linea} onChange={e=>setLinea(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-lg font-bold focus:border-sky-500 outline-none" placeholder="Buscar..." />
                        <datalist id="lineas-list">{lineasUnicas.map(l => <option key={l} value={l} />)}</datalist>
                    </div>
                </div>

                <div className="bg-gray-800 p-3 rounded-xl border border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                        <MapPin size={18} className={gpsStatus === 'ok' ? 'text-green-400' : 'text-red-400'} />
                        <span className="text-sm font-medium">{gpsStatus === 'ok' ? 'GPS Capturado' : 'GPS No Disponible'}</span>
                    </div>
                    {gpsStatus !== 'ok' && <input type="text" value={ubicacionManual} onChange={e=>setUbicacionManual(e.target.value)} placeholder="Calle/Intersección..." className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-sm outline-none" required />}
                </div>

                <div>
                    <label className="block text-xs text-gray-400 mb-2">Sentido</label>
                    <div className="flex gap-2">
                        {['Ascendente', 'Descendente', 'Ambos'].map(op => <button type="button" key={op} onClick={() => setSentido(op)} className={`flex-1 py-3 rounded-lg text-sm font-bold border ${sentido === op ? 'bg-sky-600 border-sky-500' : 'bg-gray-800 border-gray-600'}`}>{op}</button>)}
                    </div>
                </div>

                <div className="bg-gray-800 p-3 rounded-xl border border-gray-700 space-y-3">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-medium">¿Hubo desvío?</label>
                        <button type="button" onClick={() => setHuboDesvio(!huboDesvio)} className={`w-14 h-8 rounded-full relative transition-colors ${huboDesvio ? 'bg-green-500' : 'bg-gray-600'}`}><div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-all ${huboDesvio ? 'left-7' : 'left-1'}`}></div></button>
                    </div>
                    {huboDesvio && <input type="text" value={rutaAlternativa} onChange={e=>setRutaAlternativa(e.target.value)} placeholder="Ruta alternativa..." className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-sm outline-none" />}
                </div>

                <div>
                    <label className="flex items-center gap-1 text-xs text-gray-400 mb-1"><Info size={14}/> Detalles</label>
                    <textarea rows={2} value={observaciones} onChange={e=>setObservaciones(e.target.value)} className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-sm outline-none focus:border-sky-500"></textarea>
                </div>

                <div className="fixed bottom-0 left-0 w-full p-4 bg-gray-900 border-t border-gray-800">
                    <button type="submit" className="w-full bg-sky-500 text-white font-bold text-lg py-4 rounded-xl active:bg-sky-600">Enviar a Base</button>
                </div>
            </form>
        </div>
    );
};