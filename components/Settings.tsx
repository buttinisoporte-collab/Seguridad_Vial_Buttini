import React from 'react';
import { Send } from 'lucide-react';

interface SettingsProps {
    proximityDistance: number; setProximityDistance: (v: number) => void;
    driverReportTTL: number; setDriverReportTTL: (v: number) => void;
    telegramToken: string; setTelegramToken: (v: string) => void;
    telegramChatId: string; setTelegramChatId: (v: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({ 
    proximityDistance, setProximityDistance, 
    driverReportTTL, setDriverReportTTL,
    telegramToken, setTelegramToken,
    telegramChatId, setTelegramChatId
}) => {
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

                {/* Telegram Integration */}
                <div className="border-t border-gray-600 pt-4 space-y-4">
                    <h3 className="text-sm font-bold text-sky-400 flex items-center gap-2 uppercase tracking-wider">
                        <Send size={16}/> Integración Telegram
                    </h3>
                    <div>
                        <label className="block text-[10px] text-gray-400 uppercase mb-1">Bot API Token</label>
                        <input type="password" value={telegramToken} onChange={e=>setTelegramToken(e.target.value)} placeholder="000000000:AAxxxx..." className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-xs text-white outline-none focus:border-sky-500" />
                    </div>
                    <div>
                        <label className="block text-[10px] text-gray-400 uppercase mb-1">Chat ID / Canal ID</label>
                        <input type="text" value={telegramChatId} onChange={e=>setTelegramChatId(e.target.value)} placeholder="-100xxxxxxxx" className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-xs text-white outline-none focus:border-sky-500" />
                    </div>
                    <p className="text-[10px] text-gray-500 italic">Cada vez que un conductor reporte una novedad, se enviará un mensaje detallado a este chat automáticamente.</p>
                </div>
            </div>
        </div>
    );
};