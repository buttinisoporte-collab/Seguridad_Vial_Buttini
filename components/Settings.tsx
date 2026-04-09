import React from 'react';
import { Send, Palette } from 'lucide-react';
import type { Route } from '../types';

interface SettingsProps {
    proximityDistance: number; setProximityDistance: (v: number) => void;
    driverReportTTL: number; setDriverReportTTL: (v: number) => void;
    telegramToken: string; setTelegramToken: (v: string) => void;
    telegramChatId: string; setTelegramChatId: (v: string) => void;
    routes: Route[];
    groupColors: Record<string, string>; setGroupColors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export const Settings: React.FC<SettingsProps> = ({ 
    proximityDistance, setProximityDistance, driverReportTTL, setDriverReportTTL,
    telegramToken, setTelegramToken, telegramChatId, setTelegramChatId,
    routes, groupColors, setGroupColors
}) => {
    const uniqueGroups = Array.from(new Set(routes.map(r => r.group).filter(Boolean))).sort();

    const handleColorChange = (group: string, color: string) => {
        setGroupColors(prev => ({ ...prev, [group]: color }));
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