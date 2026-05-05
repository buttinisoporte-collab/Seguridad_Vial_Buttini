import React, { useRef } from 'react';
import { Send, Palette, Image as ImageIcon, Download, Upload, FileDown, FileUp, Trash2 } from 'lucide-react';
import type { Route, Risk, RiskType } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface SettingsProps {
    proximityDistance: number; setProximityDistance: (v: number) => void;
    driverReportTTL: number; setDriverReportTTL: (v: number) => void;
    telegramToken: string; setTelegramToken: (v: string) => void;
    telegramChatId: string; setTelegramChatId: (v: string) => void;
    routes: Route[];
    groupColors: Record<string, string>; setGroupColors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    companyLogo?: string; setCompanyLogo?: (v: string) => void;
    risks?: Risk[]; setRisks?: React.Dispatch<React.SetStateAction<Risk[]>>;
    riskTypes?: RiskType[];
}

export const Settings: React.FC<SettingsProps> = ({ 
    proximityDistance, setProximityDistance, driverReportTTL, setDriverReportTTL,
    telegramToken, setTelegramToken, telegramChatId, setTelegramChatId,
    routes, groupColors, setGroupColors,
    companyLogo, setCompanyLogo, risks, setRisks, riskTypes
}) => {
    const uniqueGroups: string[] = Array.from(new Set(routes.map(r => r.group).filter((g): g is string => Boolean(g)))).sort() as string[];
    const fileInputRef = useRef<HTMLInputElement>(null);
    const csvInputRef = useRef<HTMLInputElement>(null);

    const handleColorChange = (group: string, color: string) => {
        setGroupColors(prev => ({ ...prev, [group]: color }));
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && setCompanyLogo) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCompanyLogo(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleExportCSV = () => {
        if (!risks || risks.length === 0) {
            alert('No hay riesgos para exportar.');
            return;
        }

        const headers = ['ID', 'Latitud', 'Longitud', 'Categoria_Nombre', 'Gravedad', 'Descripcion', 'Fecha', 'IDS_Rutas'];
        const rows = risks.map(r => {
            const cat = riskTypes?.find(rt => rt.id === r.riskTypeId);
            return [
                r.id, 
                r.position.lat, 
                r.position.lng, 
                cat ? `"${cat.name.replace(/"/g, '""')}"` : '', 
                r.gravedad || '', 
                `"${(r.description || '').replace(/"/g, '""')}"`,
                r.timestamp ? new Date(r.timestamp).toLocaleString() : '',
                `"${(r.associatedRouteIds || []).join(';')}"`
            ].join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `riesgos_exportados_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadTemplate = () => {
        const headers = ['Latitud', 'Longitud', 'Categoria_Nombre', 'Gravedad', 'Descripcion'];
        const sampleRow = ['-34.6037', '-58.3816', 'Bache', 'Alta', 'Bache profundo en el carril derecho'];
        const csvContent = [headers.join(','), sampleRow.join(',')].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'modelo_importacion_riesgos.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !setRisks || !riskTypes) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const lines = text.split('\n').filter(line => line.trim() !== '');
            if (lines.length <= 1) {
                alert('El archivo está vacío o solo contiene encabezados.');
                return;
            }

            const headerLine = lines[0].toLowerCase();
            const hasLat = headerLine.includes('lat');
            const hasLng = headerLine.includes('lon');
            const hasCat = headerLine.includes('cat');

            if (!hasLat || !hasLng || !hasCat) {
                alert('El archivo no tiene el formato correcto. Asegúrese de que tenga columnas para Latitud, Longitud y Categoria_Nombre.');
                return;
            }

            let newRisksCount = 0;
            const newRisks: Risk[] = [];

            for (let i = 1; i < lines.length; i++) {
                // Parse CSV respecting quotes
                const regex = /(?:"([^"]*(?:""[^"]*)*)"|([^,]+))/g;
                const matches = [];
                let match;
                while ((match = regex.exec(lines[i])) !== null) {
                    if (match.index === regex.lastIndex) regex.lastIndex++;
                    matches.push(match[1] ? match[1].replace(/""/g, '"') : match[2]);
                }
                
                if (matches.length >= 3) {
                    const lat = parseFloat(matches[0] || '');
                    const lng = parseFloat(matches[1] || '');
                    const catName = (matches[2] || '').trim();
                    const grav = matches[3] || '';
                    const desc = matches[4] || '';

                    if (!isNaN(lat) && !isNaN(lng) && catName) {
                        // find category by name
                        const category = riskTypes.find(rt => rt.name.toLowerCase() === catName.toLowerCase());
                        if (category) {
                            newRisks.push({
                                id: uuidv4(),
                                position: { lat, lng },
                                riskTypeId: category.id,
                                description: desc,
                                gravedad: grav,
                                associatedRouteIds: [], // Would need spatial matching to populate this properly, handled on render or needs full re-eval
                                images: [],
                                timestamp: Date.now(),
                                isVisibleOnMap: true
                            });
                            newRisksCount++;
                        }
                    }
                }
            }

            if (newRisksCount > 0) {
                if (window.confirm(`Se encontraron ${newRisksCount} riesgos válidos. ¿Desea importarlos?`)) {
                    setRisks(prev => [...prev, ...newRisks]);
                    alert('Riesgos importados exitosamente.');
                }
            } else {
                alert('No se encontraron riesgos válidos para importar. Verifique que los nombres de categoría coincidan con los existentes en el sistema.');
            }
        };
        reader.readAsText(file);
        if (csvInputRef.current) csvInputRef.current.value = '';
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-sky-300">Ajustes Generales</h2>
            
            <div className="bg-gray-700 p-4 rounded-xl space-y-6 border border-gray-600">
                {/* Geocercas */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Distancia de Asociación (Metros)</label>
                    <div className="flex items-center space-x-3">
                         <input type="range" min="10" max="500" step="10" value={proximityDistance} onChange={(e) => setProximityDistance(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer" />
                        <span className="text-sky-400 font-mono w-12">{proximityDistance}m</span>
                    </div>
                </div>

                {/* Expiración */}
                <div className="border-t border-gray-600 pt-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Auto-ocultar Novedades (Horas)</label>
                    <div className="flex items-center space-x-3">
                         <input type="range" min="1" max="72" step="1" value={driverReportTTL} onChange={(e) => setDriverReportTTL(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer" />
                        <span className="text-sky-400 font-mono w-12">{driverReportTTL}h</span>
                    </div>
                </div>

                {/* Colores por Grupo */}
                <div className="border-t border-gray-600 pt-4 space-y-4">
                    <h3 className="text-sm font-bold text-sky-400 flex items-center gap-2 uppercase tracking-wider"><Palette size={16}/> Colores por Grupo</h3>
                    {uniqueGroups.length === 0 ? <p className="text-xs text-gray-400">Cargue recorridos para asignarles colores.</p> : (
                        <div className="grid grid-cols-2 gap-3">
                            {uniqueGroups.map(g => (
                                <div key={g} className="flex items-center justify-between bg-gray-800 p-2 rounded border border-gray-600">
                                    <span className="text-sm text-gray-300 truncate font-bold">G: {g}</span>
                                    <input type="color" value={groupColors[g] || '#0284c7'} onChange={(e) => handleColorChange(g, e.target.value)} className="w-8 h-8 rounded border-none cursor-pointer bg-transparent" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Logo de Empresa */}
                <div className="border-t border-gray-600 pt-4 space-y-4">
                    <h3 className="text-sm font-bold text-sky-400 flex items-center gap-2 uppercase tracking-wider"><ImageIcon size={16}/> Logo de Empresa</h3>
                    <div className="flex items-center gap-4">
                        {companyLogo && <img src={companyLogo} alt="Logo Prev" className="h-12 object-contain bg-white rounded p-1" />}
                        <div className="flex-1">
                            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" />
                            <div className="flex gap-2">
                                <button onClick={() => fileInputRef.current?.click()} className="bg-gray-800 hover:bg-gray-700 text-sm px-3 py-2 rounded text-white border border-gray-600 transition-colors">Seleccionar Imagen</button>
                                {companyLogo && <button onClick={() => setCompanyLogo?.('')} className="bg-red-900/40 hover:bg-red-600/40 text-sm px-3 py-2 rounded text-red-500 border border-red-900/50 transition-colors" title="Restaurar Logo por Defecto"><Trash2 size={16}/></button>}
                            </div>
                            <p className="text-[10px] text-gray-500 mt-2">Formatos: PNG, JPG, SVG. Recomendado: Imágenes horizontales o cuadradas.</p>
                        </div>
                    </div>
                </div>

                {/* Import / Export */}
                <div className="border-t border-gray-600 pt-4 space-y-4">
                    <h3 className="text-sm font-bold text-sky-400 flex items-center gap-2 uppercase tracking-wider"><Download size={16}/> Exportar / Importar Riesgos</h3>
                    <p className="text-xs text-gray-400">Exporte los riesgos actuales o importe nuevos a través de archivos CSV.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-800 p-3 rounded-lg border border-gray-600 space-y-3">
                            <h4 className="text-sm font-bold text-gray-300">Exportar</h4>
                            <button onClick={handleExportCSV} className="w-full bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded flex items-center justify-center gap-2 text-sm text-white transition-colors"><FileDown size={16}/> Descargar CSV de Riesgos</button>
                        </div>
                        
                        <div className="bg-gray-800 p-3 rounded-lg border border-gray-600 space-y-3">
                            <h4 className="text-sm font-bold text-gray-300">Importar</h4>
                            <input type="file" accept=".csv" ref={csvInputRef} onChange={handleImportCSV} className="hidden" />
                            <button onClick={() => csvInputRef.current?.click()} className="w-full bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded flex items-center justify-center gap-2 text-sm text-white transition-colors"><FileUp size={16}/> Cargar CSV de Riesgos</button>
                            <button onClick={handleDownloadTemplate} className="w-full text-xs text-sky-400 hover:text-sky-300 text-center underline underline-offset-2">Descargar archivo CSV modelo</button>
                        </div>
                    </div>
                </div>

                {/* Telegram Integration */}
                <div className="border-t border-gray-600 pt-4 space-y-4">
                    <h3 className="text-sm font-bold text-sky-400 flex items-center gap-2 uppercase tracking-wider"><Send size={16}/> Integración Telegram</h3>
                    <div><label className="block text-[10px] text-gray-400 uppercase mb-1">Bot API Token</label><input type="password" value={telegramToken} onChange={e=>setTelegramToken(e.target.value)} placeholder="000000000:AAxxxx..." className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-xs text-white outline-none focus:border-sky-500" /></div>
                    <div><label className="block text-[10px] text-gray-400 uppercase mb-1">Chat ID / Canal ID</label><input type="text" value={telegramChatId} onChange={e=>setTelegramChatId(e.target.value)} placeholder="-100xxxxxxxx" className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-xs text-white outline-none focus:border-sky-500" /></div>
                </div>
            </div>
        </div>
    );
};