import React, { useState, useEffect, useMemo } from 'react';
import { loadMetricasFromDB, saveMetricasToDB, loadMetricasAnualesFromDB } from '../lib/supabase';
import type { Siniestro, MetricasMensuales } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer, ComposedChart, Line, LabelList } from 'recharts';
import { Activity, Save } from 'lucide-react';

interface IndicadoresAdminProps {
    siniestros: Siniestro[];
}

const DEFAULT_METRICAS: MetricasMensuales = {
    id: '', nominaActiva: 0, flotaActiva: 0, kmsUrbano540: 0, kmsUrbano570: 0, kmsMedia540: 0, kmsMedia570: 0, kmsLarga570: 0,
    objUnidades: 0, objConductores: 0, objKmsTotales: 0, objKms540: 0, objKmsUrbano540: 0, objKmsMedia540: 0, objKms570: 0, objKmsUrbano570: 0, objKmsMedia570: 0, objKmsLarga570: 0
};

const COLORS = ['#0284c7', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1', '#ec4899'];
const MESES_NOMBRES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export const IndicadoresAdmin: React.FC<IndicadoresAdminProps> = ({ siniestros }) => {
    const [yearSeleccionado, setYearSeleccionado] = useState<string>(new Date().getFullYear().toString());
    const [mesFormulario, setMesFormulario] = useState<string>(new Date().toISOString().slice(0, 7)); // "YYYY-MM"
    const [metricasForm, setMetricasForm] = useState<MetricasMensuales>({ ...DEFAULT_METRICAS, id: mesFormulario });
    const [metricasAnuales, setMetricasAnuales] = useState<MetricasMensuales[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Cargar datos para el formulario (Mes Específico)
    useEffect(() => {
        const fetchMetricasForm = async () => {
            const data = await loadMetricasFromDB(mesFormulario);
            if (data) setMetricasForm(data);
            else setMetricasForm({ ...DEFAULT_METRICAS, id: mesFormulario });
        };
        fetchMetricasForm();
    }, [mesFormulario]);

    // Cargar TODAS las métricas del año para armar los gráficos
    useEffect(() => {
        const fetchMetricasAnuales = async () => {
            const data = await loadMetricasAnualesFromDB(yearSeleccionado);
            setMetricasAnuales(data);
        };
        fetchMetricasAnuales();
    }, [yearSeleccionado, isSaving]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = parseFloat(e.target.value);
        if (isNaN(val)) val = 0;
        setMetricasForm(prev => ({ ...prev, [e.target.name]: val }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        await saveMetricasToDB(metricasForm);
        alert("Parámetros y Objetivos del mes guardados.");
        setIsSaving(false);
    };

    // Filtramos todos los eventos del año seleccionado
    const eventosAño = useMemo(() => {
        return siniestros.filter(s => (s.fechaHora || s.timestamp).toString().startsWith(yearSeleccionado));
    }, [siniestros, yearSeleccionado]);

    // Función segura de división (Multiplicada por 10.000 o 100 según corresponda)
    const calc = (num: number, den: number, multiplier: number = 1) => den > 0 ? Number(((num / den) * multiplier).toFixed(3)) : 0;

    // =======================================================
    // 1. CÁLCULO DE SINIESTROS (GRAFICOS ANUALES CON OBJETIVOS)
    // =======================================================
    const dataAnualSiniestros = useMemo(() => {
        const data = [];
        for (let i = 1; i <= 12; i++) {
            const mesStr = `${yearSeleccionado}-${i.toString().padStart(2, '0')}`;
            const mData = metricasAnuales.find(m => m.id === mesStr) || { ...DEFAULT_METRICAS };
            
            const s = siniestros.filter(e => (e.fechaHora || e.timestamp).toString().startsWith(mesStr) && (e.tipoEvento || 'Siniestro') === 'Siniestro');
            const tot = s.length;
            const s540 = s.filter(e => e.investigacion?.grupo?.includes('540')).length;
            const s540Urb = s.filter(e => e.investigacion?.grupo?.includes('540') && e.investigacion?.tipoServicio === 'Urbano').length;
            const s540Med = s.filter(e => e.investigacion?.grupo?.includes('540') && e.investigacion?.tipoServicio === 'Media Distancia').length;
            const s570 = s.filter(e => e.investigacion?.grupo?.includes('570')).length;
            const s570Urb = s.filter(e => e.investigacion?.grupo?.includes('570') && e.investigacion?.tipoServicio === 'Urbano').length;
            const s570Med = s.filter(e => e.investigacion?.grupo?.includes('570') && e.investigacion?.tipoServicio === 'Media Distancia').length;
            const s570Larga = s.filter(e => e.investigacion?.grupo?.includes('570') && e.investigacion?.tipoServicio === 'Larga Distancia').length;

            const totKms540 = mData.kmsUrbano540 + mData.kmsMedia540;
            const totKms570 = mData.kmsUrbano570 + mData.kmsMedia570 + mData.kmsLarga570;
            const totKms = totKms540 + totKms570;

            data.push({
                name: MESES_NOMBRES[i-1],
                indUnidades: calc(tot, mData.flotaActiva, 100), objUnidades: mData.objUnidades,
                indConductores: calc(tot, mData.nominaActiva, 100), objConductores: mData.objConductores,
                indKmsTot: calc(tot, totKms, 10000), objKmsTot: mData.objKmsTotales,
                indKms540: calc(s540, totKms540, 10000), objKms540: mData.objKms540,
                indKmsUrb540: calc(s540Urb, mData.kmsUrbano540, 10000), objKmsUrb540: mData.objKmsUrbano540,
                indKmsMed540: calc(s540Med, mData.kmsMedia540, 10000), objKmsMed540: mData.objKmsMedia540,
                indKms570: calc(s570, totKms570, 10000), objKms570: mData.objKms570,
                indKmsUrb570: calc(s570Urb, mData.kmsUrbano570, 10000), objKmsUrb570: mData.objKmsUrbano570,
                indKmsMed570: calc(s570Med, mData.kmsMedia570, 10000), objKmsMed570: mData.objKmsMedia570,
                indKmsLarga570: calc(s570Larga, mData.kmsLarga570, 10000), objKmsLarga570: mData.objKmsLarga570,
            });
        }
        return data;
    }, [metricasAnuales, siniestros, yearSeleccionado]);

    // =======================================================
    // 2. CÁLCULO DE INCIDENTES Y LESIONADOS (ANUAL)
    // =======================================================
    const getLesionadosCount = (e: Siniestro) => {
        let leves = 0, graves = 0, fallecidos = 0;
        if (!e.descripcion?.consecuencias) return { total: 0, leves, graves, fallecidos };
        e.descripcion.consecuencias.forEach(c => {
            if (c.activa && c.tipo !== 'Solo daños materiales') {
                const q = parseInt(c.cantidad) || 0;
                if (c.tipo.toLowerCase().includes('leve')) leves += q;
                else if (c.tipo.toLowerCase().includes('grave')) graves += q;
                else if (c.tipo.toLowerCase().includes('fallecido')) fallecidos += q;
                else leves += q;
            }
        });
        return { total: leves + graves + fallecidos, leves, graves, fallecidos };
    };

    const dataIncidentesLinea = useMemo(() => {
        const incidentes = eventosAño.filter(e => e.tipoEvento === 'Incidente');
        const map: Record<string, number> = {};
        incidentes.forEach(i => { const l = i.conductor?.linea || 'Sin Línea'; map[l] = (map[l] || 0) + 1; });
        return Object.entries(map).map(([name, Indicador]) => ({ name, Indicador })).sort((a,b) => b.Indicador - a.Indicador);
    }, [eventosAño]);

    const dataLesionadosMes = useMemo(() => {
        const data = MESES_NOMBRES.map(m => ({ name: m, Indicador: 0 }));
        eventosAño.forEach(e => {
            const monthIndex = new Date(e.fechaHora || e.timestamp).getMonth();
            data[monthIndex].Indicador += getLesionadosCount(e).total;
        });
        return data;
    }, [eventosAño]);

    const dataLesionadosConductor = useMemo(() => {
        const map: Record<string, { name: string, Leves: number, Graves: number, Fallecidos: number, total: number }> = {};
        eventosAño.forEach(e => {
            const l = getLesionadosCount(e);
            if (l.total > 0) {
                const cond = e.conductor?.nombre || 'Desconocido';
                if (!map[cond]) map[cond] = { name: cond, Leves: 0, Graves: 0, Fallecidos: 0, total: 0 };
                map[cond].Leves += l.leves; map[cond].Graves += l.graves; map[cond].Fallecidos += l.fallecidos; map[cond].total += l.total;
            }
        });
        return Object.values(map).sort((a,b) => b.total - a.total).slice(0, 15);
    }, [eventosAño]);

    const dataLesionadosRecorrido = useMemo(() => {
        const map: Record<string, { name: string, Leves: number, Graves: number, Fallecidos: number, total: number }> = {};
        eventosAño.forEach(e => {
            const l = getLesionadosCount(e);
            if (l.total > 0) {
                const rec = e.conductor?.linea || 'Sin Recorrido';
                if (!map[rec]) map[rec] = { name: rec, Leves: 0, Graves: 0, Fallecidos: 0, total: 0 };
                map[rec].Leves += l.leves; map[rec].Graves += l.graves; map[rec].Fallecidos += l.fallecidos; map[rec].total += l.total;
            }
        });
        return Object.values(map).sort((a,b) => b.total - a.total).slice(0, 15);
    }, [eventosAño]);

    const dataLesionadosGrupo = useMemo(() => {
        let g540 = 0, g570 = 0, otros = 0;
        eventosAño.forEach(e => {
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
    }, [eventosAño]);


    // =======================================================
    // COMPONENTES DE GRÁFICO REUTILIZABLES
    // =======================================================
    
    // Gráfico de Siniestros (Combinado: Barras y Línea de Objetivo)
    const ChartCard = ({ title, dataKeyBar, dataKeyObj, color, format }: { title: string, dataKeyBar: string, dataKeyObj: string, color: string, format: string }) => (
        <div className="bg-white p-4 rounded-xl border border-gray-300 shadow-md h-[300px] flex flex-col">
            <h4 className="text-xs font-bold text-gray-800 text-center mb-2">{title}</h4>
            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={dataAnualSiniestros} margin={{ top: 20, right: 10, left: -20, bottom: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" fontSize={10} tick={{ fill: '#4b5563' }} angle={-45} textAnchor="end" height={45} />
                        <YAxis fontSize={10} tickFormatter={(tick) => `${tick}${format}`} />
                        <ChartTooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ backgroundColor: '#1f2937', color: '#fff', borderRadius: '8px', fontSize: '12px' }} />
                        <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '0px' }} />
                        <Bar dataKey={dataKeyBar} name="INDICADOR" fill={color} barSize={25} radius={[2, 2, 0, 0]}>
                            <LabelList dataKey={dataKeyBar} position="top" fill={color} fontSize={10} formatter={(v:any) => v > 0 ? `${v}${format}` : ''} />
                        </Bar>
                        <Line type="step" dataKey={dataKeyObj} name="OBJETIVO" stroke="#f97316" strokeWidth={2} dot={false} activeDot={false} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-slate-100 text-gray-800 overflow-y-auto custom-scrollbar w-full">
            
            <div className="bg-[#111827] text-white p-6 flex justify-between items-center sticky top-0 z-50 shadow-md flex-shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-sky-400 flex items-center gap-2"><Activity /> Dashboards e Indicadores Anuales</h2>
                    <p className="text-gray-400 text-sm mt-1">Configure los parámetros mensuales y visualice la evolución estadística.</p>
                </div>
                <select value={yearSeleccionado} onChange={(e) => setYearSeleccionado(e.target.value)} className="bg-gray-800 border border-gray-600 rounded-lg p-3 text-lg font-bold text-white outline-none focus:border-sky-500 cursor-pointer">
                    {Array.from({ length: new Date().getFullYear() - 2020 + 2 }, (_, i) => (2020 + i).toString()).map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>

            <div className="p-8 w-full space-y-8">
                
                {/* 1. FORMULARIO DE CARGA */}
                <div className="bg-white p-6 rounded-xl border border-gray-300 shadow-md">
                    <div className="flex justify-between items-center border-b border-gray-300 pb-3 mb-4">
                        <h3 className="text-sky-600 font-bold uppercase text-sm tracking-wider">Carga de Parámetros y Objetivos Mensuales</h3>
                        <input type="month" value={mesFormulario} onChange={(e) => setMesFormulario(e.target.value)} className="bg-gray-100 border border-gray-300 rounded p-2 text-sm font-bold outline-none focus:border-sky-500 cursor-pointer" />
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div><label className="block text-[10px] text-gray-500 uppercase mb-1">Nómina Activa</label><input type="number" step="any" name="nominaActiva" value={metricasForm.nominaActiva} onChange={handleChange} className="w-full bg-gray-50 border border-gray-300 rounded p-1.5 outline-none text-sm" /></div>
                        <div><label className="block text-[10px] text-gray-500 uppercase mb-1">Obj. Conductores (%)</label><input type="number" step="any" name="objConductores" value={metricasForm.objConductores} onChange={handleChange} className="w-full bg-orange-50 border border-orange-300 rounded p-1.5 outline-none text-orange-700 font-bold text-sm" /></div>
                        <div><label className="block text-[10px] text-gray-500 uppercase mb-1">Flota Activa</label><input type="number" step="any" name="flotaActiva" value={metricasForm.flotaActiva} onChange={handleChange} className="w-full bg-gray-50 border border-gray-300 rounded p-1.5 outline-none text-sm" /></div>
                        <div><label className="block text-[10px] text-gray-500 uppercase mb-1">Obj. Unidades (%)</label><input type="number" step="any" name="objUnidades" value={metricasForm.objUnidades} onChange={handleChange} className="w-full bg-orange-50 border border-orange-300 rounded p-1.5 outline-none text-orange-700 font-bold text-sm" /></div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="md:col-span-2 border-t pt-3"><label className="block text-[10px] text-gray-500 uppercase mb-1">Obj. Kms Totales (Índice 10k)</label><input type="number" step="any" name="objKmsTotales" value={metricasForm.objKmsTotales} onChange={handleChange} className="w-full bg-orange-50 border border-orange-300 rounded p-1.5 outline-none text-orange-700 font-bold text-sm" /></div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 border-t pt-3">
                        <div><label className="block text-[10px] text-gray-500 uppercase mb-1">Kms Urbano (G540)</label><input type="number" step="any" name="kmsUrbano540" value={metricasForm.kmsUrbano540} onChange={handleChange} className="w-full bg-gray-50 border border-gray-300 rounded p-1.5 outline-none text-sm" /></div>
                        <div><label className="block text-[10px] text-gray-500 uppercase mb-1">Obj. Urbano G540</label><input type="number" step="any" name="objKmsUrbano540" value={metricasForm.objKmsUrbano540} onChange={handleChange} className="w-full bg-orange-50 border border-orange-300 rounded p-1.5 outline-none text-orange-700 font-bold text-sm" /></div>
                        <div><label className="block text-[10px] text-gray-500 uppercase mb-1">Kms Urbano (G570)</label><input type="number" step="any" name="kmsUrbano570" value={metricasForm.kmsUrbano570} onChange={handleChange} className="w-full bg-gray-50 border border-gray-300 rounded p-1.5 outline-none text-sm" /></div>
                        <div><label className="block text-[10px] text-gray-500 uppercase mb-1">Obj. Urbano G570</label><input type="number" step="any" name="objKmsUrbano570" value={metricasForm.objKmsUrbano570} onChange={handleChange} className="w-full bg-orange-50 border border-orange-300 rounded p-1.5 outline-none text-orange-700 font-bold text-sm" /></div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        <div><label className="block text-[10px] text-gray-500 uppercase mb-1">Kms Media Dist. (G540)</label><input type="number" step="any" name="kmsMedia540" value={metricasForm.kmsMedia540} onChange={handleChange} className="w-full bg-gray-50 border border-gray-300 rounded p-1.5 outline-none text-sm" /></div>
                        <div><label className="block text-[10px] text-gray-500 uppercase mb-1">Obj. Media G540</label><input type="number" step="any" name="objKmsMedia540" value={metricasForm.objKmsMedia540} onChange={handleChange} className="w-full bg-orange-50 border border-orange-300 rounded p-1.5 outline-none text-orange-700 font-bold text-sm" /></div>
                        <div><label className="block text-[10px] text-gray-500 uppercase mb-1">Kms Media Dist. (G570)</label><input type="number" step="any" name="kmsMedia570" value={metricasForm.kmsMedia570} onChange={handleChange} className="w-full bg-gray-50 border border-gray-300 rounded p-1.5 outline-none text-sm" /></div>
                        <div><label className="block text-[10px] text-gray-500 uppercase mb-1">Obj. Media G570</label><input type="number" step="any" name="objKmsMedia570" value={metricasForm.objKmsMedia570} onChange={handleChange} className="w-full bg-orange-50 border border-orange-300 rounded p-1.5 outline-none text-orange-700 font-bold text-sm" /></div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                        <div><label className="block text-[10px] text-gray-500 uppercase mb-1">Kms Larga Dist. (G570)</label><input type="number" step="any" name="kmsLarga570" value={metricasForm.kmsLarga570} onChange={handleChange} className="w-full bg-gray-50 border border-gray-300 rounded p-1.5 outline-none text-sm" /></div>
                        <div><label className="block text-[10px] text-gray-500 uppercase mb-1">Obj. Larga G570</label><input type="number" step="any" name="objKmsLarga570" value={metricasForm.objKmsLarga570} onChange={handleChange} className="w-full bg-orange-50 border border-orange-300 rounded p-1.5 outline-none text-orange-700 font-bold text-sm" /></div>
                        <div><label className="block text-[10px] text-gray-500 uppercase mb-1">Obj. TOTAL G540</label><input type="number" step="any" name="objKms540" value={metricasForm.objKms540} onChange={handleChange} className="w-full bg-orange-50 border border-orange-300 rounded p-1.5 outline-none text-orange-700 font-bold text-sm" /></div>
                        <div><label className="block text-[10px] text-gray-500 uppercase mb-1">Obj. TOTAL G570</label><input type="number" step="any" name="objKms570" value={metricasForm.objKms570} onChange={handleChange} className="w-full bg-orange-50 border border-orange-300 rounded p-1.5 outline-none text-orange-700 font-bold text-sm" /></div>
                    </div>

                    <button onClick={handleSave} disabled={isSaving} className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-2.5 px-8 rounded-lg flex items-center gap-2 transition-colors w-full md:w-auto justify-center text-sm">
                        <Save size={16}/> Guardar Configuración de {mesFormulario}
                    </button>
                </div>


                {/* 2. GRÁFICOS ANUALES DE SINIESTROS (2 POR FILA) */}
                <h3 className="text-2xl font-bold text-gray-800 text-center mt-10 uppercase tracking-widest border-b-4 border-red-500 pb-2 inline-block mx-auto">SINIESTROS {yearSeleccionado}</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartCard title="Siniestros por Cantidad de Unidades (%)" dataKeyBar="indUnidades" dataKeyObj="objUnidades" color="#0000ff" format="%" />
                    <ChartCard title="Siniestros por Cantidad de Conductores (%)" dataKeyBar="indConductores" dataKeyObj="objConductores" color="#ff0000" format="%" />
                    <ChartCard title="Total Siniestros por C/10.000 Kms Totales" dataKeyBar="indKmsTot" dataKeyObj="objKmsTot" color="#00ff00" format="" />
                    <ChartCard title="Total Siniestros por C/10.000 Kms G540" dataKeyBar="indKms540" dataKeyObj="objKms540" color="#00ff00" format="" />
                    <ChartCard title="Total Siniestros por C/10.000 Kms G570" dataKeyBar="indKms570" dataKeyObj="objKms570" color="#0000ff" format="" />
                    <ChartCard title="Siniestros por C/10.000 Kms URBANO G540" dataKeyBar="indKmsUrb540" dataKeyObj="objKmsUrb540" color="#0000ff" format="" />
                    <ChartCard title="Siniestros por C/10.000 Kms URBANO G570" dataKeyBar="indKmsUrb570" dataKeyObj="objKmsUrb570" color="#ff0000" format="" />
                    <ChartCard title="Siniestros por C/10.000 Kms Media Distancia G540" dataKeyBar="indKmsMed540" dataKeyObj="objKmsMed540" color="#0000ff" format="" />
                    <ChartCard title="Siniestros por C/10.000 Kms Media Distancia G570" dataKeyBar="indKmsMed570" dataKeyObj="objKmsMed570" color="#00ff00" format="" />
                    <ChartCard title="Siniestros por C/10.000 Kms Larga Distancia G570" dataKeyBar="indKmsLarga570" dataKeyObj="objKmsLarga570" color="#0000ff" format="" />
                </div>


                {/* 3. GRÁFICOS DE INCIDENTES Y LESIONADOS (MÁS BAJITOS: h-[280px]) */}
                <h3 className="text-2xl font-bold text-gray-800 text-center mt-12 uppercase tracking-widest border-b-4 border-yellow-500 pb-2 inline-block mx-auto">INCIDENTES Y LESIONADOS {yearSeleccionado}</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* INCIDENTES POR LÍNEA - BARRAS HORIZONTALES */}
                    <div className="h-[280px] bg-white p-4 rounded-xl border border-gray-300 shadow-md flex flex-col">
                        <h4 className="text-xs font-bold text-gray-800 text-center mb-2 uppercase">Cantidad de Incidentes por Línea</h4>
                        <div className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dataIncidentesLinea} layout="vertical" margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" fontSize={10} />
                                    <YAxis dataKey="name" type="category" width={220} fontSize={9} tickFormatter={(v) => v.length > 35 ? v.substring(0,35)+'...' : v} />
                                    <ChartTooltip contentStyle={{ backgroundColor: '#1f2937', color: '#fff', borderRadius: '8px', fontSize: '11px' }} />
                                    <Bar dataKey="Indicador" fill="#eab308" radius={[0, 4, 4, 0]}>
                                        <LabelList dataKey="Indicador" position="right" fill="#6b7280" fontSize={10} formatter={(v:any) => v > 0 ? v : ''} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* LESIONADOS POR MES */}
                    <div className="h-[280px] bg-white p-4 rounded-xl border border-gray-300 shadow-md flex flex-col">
                        <h4 className="text-xs font-bold text-gray-800 text-center mb-2 uppercase">Cantidad de Lesionados por Mes</h4>
                        <div className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dataLesionadosMes} margin={{ top: 20, right: 5, left: -20, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" fontSize={10} tick={{ fill: '#4b5563' }} />
                                    <YAxis fontSize={10} />
                                    <ChartTooltip contentStyle={{ backgroundColor: '#1f2937', color: '#fff', borderRadius: '8px', fontSize: '11px' }} />
                                    <Bar dataKey="Indicador" fill="#8b5cf6" radius={[2, 2, 0, 0]}>
                                        <LabelList dataKey="Indicador" position="top" fill="#6b7280" fontSize={10} formatter={(v:any) => v > 0 ? v : ''} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* LESIONADOS POR CONDUCTOR */}
                    <div className="h-[280px] bg-white p-4 rounded-xl border border-gray-300 shadow-md flex flex-col">
                        <h4 className="text-xs font-bold text-gray-800 text-center mb-1 uppercase">Lesionados por Conductor (Top 15)</h4>
                        <div className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dataLesionadosConductor} layout="vertical" margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" fontSize={10} />
                                    <YAxis dataKey="name" type="category" width={220} fontSize={9} tickFormatter={(v) => v.length > 35 ? v.substring(0,35)+'...' : v} />
                                    <ChartTooltip contentStyle={{ backgroundColor: '#1f2937', color: '#fff', borderRadius: '8px', fontSize: '11px' }} />
                                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                                    <Bar dataKey="Leves" stackId="a" fill="#10b981" />
                                    <Bar dataKey="Graves" stackId="a" fill="#f59e0b" />
                                    <Bar dataKey="Fallecidos" stackId="a" fill="#ef4444" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* LESIONADOS POR RECORRIDO */}
                    <div className="h-[280px] bg-white p-4 rounded-xl border border-gray-300 shadow-md flex flex-col">
                        <h4 className="text-xs font-bold text-gray-800 text-center mb-1 uppercase">Lesionados por Recorrido (Top 15)</h4>
                        <div className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dataLesionadosRecorrido} layout="vertical" margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" fontSize={10} />
                                    <YAxis dataKey="name" type="category" width={220} fontSize={9} tickFormatter={(v) => v.length > 35 ? v.substring(0,35)+'...' : v} />
                                    <ChartTooltip contentStyle={{ backgroundColor: '#1f2937', color: '#fff', borderRadius: '8px', fontSize: '11px' }} />
                                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                                    <Bar dataKey="Leves" stackId="a" fill="#10b981" />
                                    <Bar dataKey="Graves" stackId="a" fill="#f59e0b" />
                                    <Bar dataKey="Fallecidos" stackId="a" fill="#ef4444" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* LESIONADOS POR GRUPO (TORTA) - AHORA OCUPA MEDIA PANTALLA */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div className="h-[280px] bg-white p-4 rounded-xl border border-gray-300 shadow-md flex flex-col items-center">
                        <h4 className="text-xs font-bold text-gray-800 text-center mb-1 uppercase w-full">Cantidad de Lesionados x Grupo</h4>
                        {dataLesionadosGrupo.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">No hay lesionados registrados este año.</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie 
                                        data={dataLesionadosGrupo} 
                                        cx="50%" 
                                        cy="50%" 
                                        labelLine={true} 
                                        label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(1)}%)`} 
                                        outerRadius={70} 
                                        fill="#8884d8" 
                                        dataKey="value" 
                                        style={{fontSize: '10px'}}
                                    >
                                        {dataLesionadosGrupo.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <ChartTooltip contentStyle={{ backgroundColor: '#1f2937', color: '#fff', borderRadius: '8px', fontSize: '11px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                    {/* El div vacío al lado permite que la torta solo ocupe la mitad izquierda en monitores grandes */}
                    <div className="hidden lg:block"></div>
                </div>

            </div>
        </div>
    );
};