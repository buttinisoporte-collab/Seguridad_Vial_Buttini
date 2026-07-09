import React, { useState, useEffect, useMemo } from 'react';
import { loadMetricasFromDB, saveMetricasToDB } from '../lib/supabase';
import type { Siniestro, MetricasMensuales } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Activity, AlertCircle, Save, X } from 'lucide-react';

interface IndicadoresAdminProps {
    siniestros: Siniestro[];
}

const DEFAULT_METRICAS: MetricasMensuales = {
    id: '', nominaActiva: 0, flotaActiva: 0, kmsUrbano540: 0, kmsUrbano570: 0, kmsMedia540: 0, kmsMedia570: 0, kmsLarga570: 0
};

const COLORS = ['#0284c7', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1', '#ec4899'];

export const IndicadoresAdmin: React.FC<IndicadoresAdminProps> = ({ siniestros }) => {
    const [mesSeleccionado, setMesSeleccionado] = useState<string>(new Date().toISOString().slice(0, 7)); // "YYYY-MM"
    const [metricas, setMetricas] = useState<MetricasMensuales>({ ...DEFAULT_METRICAS, id: mesSeleccionado });
    const [isSaving, setIsSaving] = useState(false);
    const [showMissingModal, setShowMissingModal] = useState(false);

    useEffect(() => {
        const fetchMetricas = async () => {
            const data = await loadMetricasFromDB(mesSeleccionado);
            if (data) setMetricas(data);
            else setMetricas({ ...DEFAULT_METRICAS, id: mesSeleccionado });
        };
        fetchMetricas();
    }, [mesSeleccionado]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value) || 0;
        setMetricas(prev => ({ ...prev, [e.target.name]: val }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        await saveMetricasToDB(metricas);
        alert("Parámetros del mes guardados.");
        setIsSaving(false);
    };

    // 1. FILTRADO DEL MES ACTUAL
    const eventosMes = useMemo(() => {
        return siniestros.filter(s => {
            const date = new Date(s.fechaHora || s.timestamp);
            return date.toISOString().slice(0, 7) === mesSeleccionado;
        });
    }, [siniestros, mesSeleccionado]);

    // 2. DETECCIÓN DE DATOS FALTANTES (GRUPO)
    const eventosSinGrupo = useMemo(() => {
        return eventosMes.filter(e => !e.investigacion?.grupo || e.investigacion.grupo.trim() === '');
    }, [eventosMes]);

    // 3. CÁLCULOS MATEMÁTICOS PARA SINIESTROS
    const statsSiniestros = useMemo(() => {
        const s = eventosMes.filter(e => (e.tipoEvento || 'Siniestro') === 'Siniestro');
        
        const tot = s.length;
        const s540 = s.filter(e => e.investigacion?.grupo?.includes('540')).length;
        const s540Urb = s.filter(e => e.investigacion?.grupo?.includes('540') && e.investigacion?.tipoServicio === 'Urbano').length;
        const s540Med = s.filter(e => e.investigacion?.grupo?.includes('540') && e.investigacion?.tipoServicio === 'Media Distancia').length;
        
        const s570 = s.filter(e => e.investigacion?.grupo?.includes('570')).length;
        const s570Urb = s.filter(e => e.investigacion?.grupo?.includes('570') && e.investigacion?.tipoServicio === 'Urbano').length;
        const s570Med = s.filter(e => e.investigacion?.grupo?.includes('570') && e.investigacion?.tipoServicio === 'Media Distancia').length;
        const s570Larga = s.filter(e => e.investigacion?.grupo?.includes('570') && e.investigacion?.tipoServicio === 'Larga Distancia').length;

        const totKms540 = metricas.kmsUrbano540 + metricas.kmsMedia540;
        const totKms570 = metricas.kmsUrbano570 + metricas.kmsMedia570 + metricas.kmsLarga570;
        const totKms = totKms540 + totKms570;

        // Función segura de división (Kms multiplicados por 100,000 para legibilidad del índice)
        const calc = (num: number, den: number, isKm: boolean = false) => den > 0 ? Number(((num / den) * (isKm ? 100000 : 1)).toFixed(3)) : 0;

        return [
            { name: 'Siniestros / Nómina Activa', value: calc(tot, metricas.nominaActiva) },
            { name: 'Siniestros / Flota Activa', value: calc(tot, metricas.flotaActiva) },
            { name: 'Siniestros / Kms Totales (Índice 100k)', value: calc(tot, totKms, true) },
            { name: 'Siniestros / Kms Grupo 540 (Índice 100k)', value: calc(s540, totKms540, true) },
            { name: 'Siniestros / Kms Urb. G540 (Índice 100k)', value: calc(s540Urb, metricas.kmsUrbano540, true) },
            { name: 'Siniestros / Kms Med. G540 (Índice 100k)', value: calc(s540Med, metricas.kmsMedia540, true) },
            { name: 'Siniestros / Kms Grupo 570 (Índice 100k)', value: calc(s570, totKms570, true) },
            { name: 'Siniestros / Kms Urb. G570 (Índice 100k)', value: calc(s570Urb, metricas.kmsUrbano570, true) },
            { name: 'Siniestros / Kms Med. G570 (Índice 100k)', value: calc(s570Med, metricas.kmsMedia570, true) },
            { name: 'Siniestros / Kms Larga G570 (Índice 100k)', value: calc(s570Larga, metricas.kmsLarga570, true) }
        ];
    }, [eventosMes, metricas]);

    // 4. DATOS PARA GRÁFICOS DE INCIDENTES Y LESIONADOS
    const dataIncidentesLinea = useMemo(() => {
        const incidentes = eventosMes.filter(e => e.tipoEvento === 'Incidente');
        const map: Record<string, number> = {};
        incidentes.forEach(i => {
            const linea = i.conductor?.linea || 'Sin Línea';
            map[linea] = (map[linea] || 0) + 1;
        });
        return Object.entries(map).map(([name, Incidentes]) => ({ name, Incidentes })).sort((a,b) => b.Incidentes - a.Incidentes);
    }, [eventosMes]);

    // Lógica para extraer lesionados de un evento sumando todos los tipos (Leves, Graves, Fallecidos, etc)
    const getLesionadosCount = (e: Siniestro) => {
        let leves = 0, graves = 0, fallecidos = 0;
        if (!e.descripcion?.consecuencias) return { total: 0, leves, graves, fallecidos };
        e.descripcion.consecuencias.forEach(c => {
            if (c.activa && c.tipo !== 'Solo daños materiales') {
                const q = parseInt(c.cantidad) || 0;
                if (c.tipo.toLowerCase().includes('leve')) leves += q;
                else if (c.tipo.toLowerCase().includes('grave')) graves += q;
                else if (c.tipo.toLowerCase().includes('fallecido')) fallecidos += q;
                else leves += q; // Fallback
            }
        });
        return { total: leves + graves + fallecidos, leves, graves, fallecidos };
    };

    const dataLesionadosConductor = useMemo(() => {
        const map: Record<string, { name: string, Leves: number, Graves: number, Fallecidos: number, total: number }> = {};
        eventosMes.forEach(e => {
            const l = getLesionadosCount(e);
            if (l.total > 0) {
                const cond = e.conductor?.nombre || 'Desconocido';
                if (!map[cond]) map[cond] = { name: cond, Leves: 0, Graves: 0, Fallecidos: 0, total: 0 };
                map[cond].Leves += l.leves; map[cond].Graves += l.graves; map[cond].Fallecidos += l.fallecidos; map[cond].total += l.total;
            }
        });
        return Object.values(map).sort((a,b) => b.total - a.total).slice(0, 15); // Top 15
    }, [eventosMes]);

    const dataLesionadosRecorrido = useMemo(() => {
        const map: Record<string, { name: string, Leves: number, Graves: number, Fallecidos: number, total: number }> = {};
        eventosMes.forEach(e => {
            const l = getLesionadosCount(e);
            if (l.total > 0) {
                const rec = e.conductor?.linea || 'Sin Recorrido';
                if (!map[rec]) map[rec] = { name: rec, Leves: 0, Graves: 0, Fallecidos: 0, total: 0 };
                map[rec].Leves += l.leves; map[rec].Graves += l.graves; map[rec].Fallecidos += l.fallecidos; map[rec].total += l.total;
            }
        });
        return Object.values(map).sort((a,b) => b.total - a.total).slice(0, 15);
    }, [eventosMes]);

    const dataLesionadosMes = useMemo(() => {
        // Para este gráfico, evaluamos el año completo del mes seleccionado
        const year = mesSeleccionado.split('-')[0];
        const eventosAño = siniestros.filter(s => (s.fechaHora || s.timestamp).toString().startsWith(year));
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const data = meses.map((m, i) => ({ name: m, Lesionados: 0 }));
        
        eventosAño.forEach(e => {
            const monthIndex = new Date(e.fechaHora || e.timestamp).getMonth();
            data[monthIndex].Lesionados += getLesionadosCount(e).total;
        });
        return data;
    }, [siniestros, mesSeleccionado]);

    const dataLesionadosGrupo = useMemo(() => {
        let g540 = 0, g570 = 0, otros = 0;
        eventosMes.forEach(e => {
            const t = getLesionadosCount(e).total;
            if (t > 0) {
                if (e.investigacion?.grupo?.includes('540')) g540 += t;
                else if (e.investigacion?.grupo?.includes('570')) g570 += t;
                else otros += t;
            }
        });
        const data = [];
        if (g540 > 0) data.push({ name: 'Grupo 540', value: g540 });
        if (g570 > 0) data.push({ name: 'Grupo 570', value: g570 });
        if (otros > 0) data.push({ name: 'Otros / Sin Grupo', value: otros });
        return data;
    }, [eventosMes]);

    return (
        <div className="flex flex-col h-full bg-[#111827] text-white p-6 overflow-y-auto custom-scrollbar">
            {/* HEADER Y ALERTA DE FALTANTES */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-sky-400 flex items-center gap-2"><Activity /> Dashboards e Indicadores</h2>
                    <p className="text-gray-400 text-sm mt-1">Seleccione el mes para calcular métricas y gráficos.</p>
                </div>
                <div className="flex items-center gap-4">
                    {eventosSinGrupo.length > 0 && (
                        <button onClick={() => setShowMissingModal(true)} className="bg-red-900/40 border border-red-500 text-red-400 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-red-900/60 transition-colors animate-pulse">
                            <AlertCircle size={18} /> Faltan Grupos en {eventosSinGrupo.length} Eventos
                        </button>
                    )}
                    <input type="month" value={mesSeleccionado} onChange={(e) => setMesSeleccionado(e.target.value)} className="bg-gray-800 border border-gray-600 rounded-lg p-3 text-lg font-bold text-white outline-none focus:border-sky-500" />
                </div>
            </div>

            {/* FORMULARIO DE METRICAS DEL MES */}
            <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 mb-8 shadow-lg">
                <h3 className="text-sky-400 font-bold mb-4 uppercase text-sm tracking-wider border-b border-gray-700 pb-2">1. Parámetros del Mes ({mesSeleccionado})</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div><label className="block text-[10px] text-gray-400 uppercase mb-1">Nómina Activa</label><input type="number" name="nominaActiva" value={metricas.nominaActiva} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white outline-none focus:border-sky-500" /></div>
                    <div><label className="block text-[10px] text-gray-400 uppercase mb-1">Flota Activa</label><input type="number" name="flotaActiva" value={metricas.flotaActiva} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white outline-none focus:border-sky-500" /></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                    <div><label className="block text-[10px] text-gray-400 uppercase mb-1">Kms Urbano (G540)</label><input type="number" name="kmsUrbano540" value={metricas.kmsUrbano540} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white outline-none focus:border-sky-500" /></div>
                    <div><label className="block text-[10px] text-gray-400 uppercase mb-1">Kms Urbano (G570)</label><input type="number" name="kmsUrbano570" value={metricas.kmsUrbano570} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white outline-none focus:border-sky-500" /></div>
                    <div><label className="block text-[10px] text-gray-400 uppercase mb-1">Kms Media Dist. (G540)</label><input type="number" name="kmsMedia540" value={metricas.kmsMedia540} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white outline-none focus:border-sky-500" /></div>
                    <div><label className="block text-[10px] text-gray-400 uppercase mb-1">Kms Media Dist. (G570)</label><input type="number" name="kmsMedia570" value={metricas.kmsMedia570} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white outline-none focus:border-sky-500" /></div>
                    <div><label className="block text-[10px] text-gray-400 uppercase mb-1">Kms Larga Dist. (G570)</label><input type="number" name="kmsLarga570" value={metricas.kmsLarga570} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white outline-none focus:border-sky-500" /></div>
                </div>
                <button onClick={handleSave} disabled={isSaving} className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 transition-colors text-sm">
                    <Save size={16}/> Guardar Parámetros
                </button>
            </div>

            {/* SECCIÓN SINIESTROS: TABLA + GRÁFICO */}
            <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 mb-8 shadow-lg">
                <h3 className="text-red-400 font-bold mb-4 uppercase text-sm tracking-wider border-b border-gray-700 pb-2">2. Métricas de Siniestros (Mes Actual)</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="bg-gray-900 border-b border-gray-700 text-[10px] uppercase text-gray-400">
                                    <th className="p-3 font-bold">Métrica / Fórmula</th>
                                    <th className="p-3 font-bold text-right">Resultado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700/50">
                                {statsSiniestros.map((stat, i) => (
                                    <tr key={i} className="hover:bg-gray-700/30 transition-colors">
                                        <td className="p-3 text-gray-300">{stat.name}</td>
                                        <td className="p-3 text-right font-mono text-sky-400 font-bold">{stat.value}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <p className="text-[10px] text-gray-500 mt-2 italic">* Los índices de Kms están multiplicados x 100.000 para legibilidad.</p>
                    </div>
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={statsSiniestros} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                                <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                                <YAxis dataKey="name" type="category" width={150} stroke="#9ca3af" fontSize={10} />
                                <ChartTooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} />
                                <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* SECCIÓN INCIDENTES Y LESIONADOS: GRÁFICOS */}
            <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 mb-8 shadow-lg">
                <h3 className="text-yellow-400 font-bold mb-6 uppercase text-sm tracking-wider border-b border-gray-700 pb-2">3. Estadísticas de Incidentes y Lesionados</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* INCIDENTES POR LÍNEA */}
                    <div className="h-[300px] bg-gray-900 p-4 rounded-lg border border-gray-700">
                        <h4 className="text-xs font-bold text-gray-400 text-center mb-4 uppercase">Incidentes por Línea (Mes)</h4>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dataIncidentesLinea} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tick={{ fill: '#9ca3af' }} />
                                <YAxis stroke="#9ca3af" fontSize={10} />
                                <ChartTooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} />
                                <Bar dataKey="Incidentes" fill="#eab308" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* LESIONADOS POR MES (ANUAL) */}
                    <div className="h-[300px] bg-gray-900 p-4 rounded-lg border border-gray-700">
                        <h4 className="text-xs font-bold text-gray-400 text-center mb-4 uppercase">Evolución Lesionados por Mes (Año {mesSeleccionado.split('-')[0]})</h4>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dataLesionadosMes} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} />
                                <YAxis stroke="#9ca3af" fontSize={10} />
                                <ChartTooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} />
                                <Bar dataKey="Lesionados" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* LESIONADOS POR CONDUCTOR */}
                    <div className="h-[400px] bg-gray-900 p-4 rounded-lg border border-gray-700">
                        <h4 className="text-xs font-bold text-gray-400 text-center mb-4 uppercase">Lesionados por Conductor (Top 15)</h4>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dataLesionadosConductor} layout="vertical" margin={{ top: 5, right: 5, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                                <XAxis type="number" stroke="#9ca3af" fontSize={10} />
                                <YAxis dataKey="name" type="category" width={100} stroke="#9ca3af" fontSize={10} />
                                <ChartTooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} />
                                <Legend wrapperStyle={{ fontSize: '10px' }} />
                                <Bar dataKey="Leves" stackId="a" fill="#10b981" />
                                <Bar dataKey="Graves" stackId="a" fill="#f59e0b" />
                                <Bar dataKey="Fallecidos" stackId="a" fill="#ef4444" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* LESIONADOS POR RECORRIDO */}
                    <div className="h-[400px] bg-gray-900 p-4 rounded-lg border border-gray-700">
                        <h4 className="text-xs font-bold text-gray-400 text-center mb-4 uppercase">Lesionados por Recorrido (Top 15)</h4>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dataLesionadosRecorrido} layout="vertical" margin={{ top: 5, right: 5, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                                <XAxis type="number" stroke="#9ca3af" fontSize={10} />
                                <YAxis dataKey="name" type="category" width={100} stroke="#9ca3af" fontSize={10} />
                                <ChartTooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} />
                                <Legend wrapperStyle={{ fontSize: '10px' }} />
                                <Bar dataKey="Leves" stackId="a" fill="#10b981" />
                                <Bar dataKey="Graves" stackId="a" fill="#f59e0b" />
                                <Bar dataKey="Fallecidos" stackId="a" fill="#ef4444" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* LESIONADOS POR GRUPO (TORTA) */}
                <div className="h-[300px] bg-gray-900 p-4 rounded-lg border border-gray-700 flex flex-col items-center">
                    <h4 className="text-xs font-bold text-gray-400 text-center mb-2 uppercase w-full">Distribución de Lesionados por Grupo</h4>
                    {dataLesionadosGrupo.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">No hay lesionados registrados este mes.</div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={dataLesionadosGrupo} cx="50%" cy="50%" labelLine={true} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} outerRadius={80} fill="#8884d8" dataKey="value">
                                    {dataLesionadosGrupo.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <ChartTooltip contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* MODAL DE ADVERTENCIA: DATOS FALTANTES */}
            {showMissingModal && (
                <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4">
                    <div className="bg-gray-900 rounded-xl w-full max-w-2xl border border-red-500 shadow-2xl flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-red-900/20">
                            <h3 className="font-bold text-lg text-red-400 flex items-center gap-2"><AlertCircle /> Atención Administrativa Requerida</h3>
                            <button onClick={() => setShowMissingModal(false)} className="text-gray-400 hover:text-white"><X size={24}/></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 text-sm text-gray-300">
                            <p className="mb-4">Para que los cálculos de <b>Indicadores por Grupo (540/570)</b> sean precisos, es obligatorio que todos los eventos del mes tengan asignado su Grupo en la pestaña <b>Seguimiento CRM</b>.</p>
                            <p className="mb-4 font-bold text-white">Los siguientes eventos de {mesSeleccionado} no tienen grupo asignado:</p>
                            <ul className="space-y-2">
                                {eventosSinGrupo.map(e => (
                                    <li key={e.id} className="bg-black p-3 rounded border border-gray-800 flex justify-between">
                                        <span><b>{new Date(e.fechaHora).toLocaleDateString('es-AR')}</b> | {e.conductor?.nombre} (Línea: {e.conductor?.linea})</span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${e.tipoEvento==='Incidente'?'bg-yellow-900 text-yellow-400':'bg-red-900 text-red-400'}`}>{e.tipoEvento || 'Siniestro'}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="p-4 border-t border-gray-800 bg-black text-right">
                            <button onClick={() => setShowMissingModal(false)} className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded font-bold">Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};