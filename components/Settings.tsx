import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';

interface SettingsProps {
    proximityDistance: number;
    setProximityDistance: React.Dispatch<React.SetStateAction<number>>;
    driverReportTTL: number;
    setDriverReportTTL: React.Dispatch<React.SetStateAction<number>>;
}

export const Settings: React.FC<SettingsProps> = ({ proximityDistance, setProximityDistance, driverReportTTL, setDriverReportTTL }) => {
    return (
        <div>
            <h2 className="text-xl font-bold mb-4 text-sky-300">Ajustes Generales</h2>
            
            <div className="bg-gray-700 p-4 rounded-lg space-y-6">
                <div>
                    <label htmlFor="proximity-distance" className="block text-sm font-medium text-gray-300 mb-2">
                        Distancia de Asociación (Geocerca)
                    </label>
                    <div className="flex items-center space-x-3">
                         <input type="range" id="proximity-distance" min="10" max="500" step="10" value={proximityDistance} onChange={(e) => setProximityDistance(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer" />
                        <span className="text-sky-400 font-semibold w-20 text-center">{proximityDistance} mts.</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Radio alrededor de un punto de riesgo para asociarlo automáticamente a un recorrido.</p>
                </div>

                <div className="border-t border-gray-600 pt-4">
                    <label htmlFor="ttl-distance" className="block text-sm font-medium text-gray-300 mb-2">
                        Tiempo de visibilidad de Novedades (Conductores)
                    </label>
                    <div className="flex items-center space-x-3">
                         <input type="range" id="ttl-distance" min="1" max="72" step="1" value={driverReportTTL} onChange={(e) => setDriverReportTTL(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer" />
                        <span className="text-sky-400 font-semibold w-20 text-center">{driverReportTTL} hrs.</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Horas que dura una novedad en el mapa antes de ocultarse automáticamente. (Siempre quedará guardada en la pestaña Novedades).</p>
                </div>
            </div>
        </div>
    );
};