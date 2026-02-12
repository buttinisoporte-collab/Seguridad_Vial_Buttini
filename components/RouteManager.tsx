
import React, { useState } from 'react';
import type { Route } from '../types';
import { AddRouteModal } from './AddRouteModal';
import { MapPin, PlusCircle, Trash2 } from 'lucide-react';

interface RouteManagerProps {
    routes: Route[];
    setRoutes: React.Dispatch<React.SetStateAction<Route[]>>;
    onAddRoute: (name: string, origin: string, destination: string, kmlFile: File) => void;
}

export const RouteManager: React.FC<RouteManagerProps> = ({ routes, onAddRoute, setRoutes }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const deleteRoute = (id: string) => {
        if(window.confirm("¿Está seguro que desea eliminar este recorrido?")) {
            setRoutes(routes.filter(route => route.id !== id));
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-sky-300">Gestión de Recorridos</h2>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-3 rounded-lg transition-colors duration-200 text-sm"
                >
                    <PlusCircle size={18} className="mr-2" />
                    Nuevo
                </button>
            </div>
            <div className="space-y-3">
                {routes.length > 0 ? routes.map(route => (
                    <div key={route.id} className="bg-gray-700 p-3 rounded-lg flex justify-between items-center">
                        <div>
                            <p className="font-semibold text-white">{route.name}</p>
                            <p className="text-xs text-gray-400">{route.origin} &rarr; {route.destination}</p>
                        </div>
                        <button onClick={() => deleteRoute(route.id)} className="text-red-400 hover:text-red-600 p-1">
                            <Trash2 size={18} />
                        </button>
                    </div>
                )) : (
                    <div className="text-center py-8 px-4 bg-gray-700 rounded-lg">
                        <MapPin size={40} className="mx-auto text-gray-500" />
                        <p className="mt-2 text-gray-400">No hay recorridos cargados.</p>
                        <p className="text-xs text-gray-500">Agregue uno para comenzar.</p>
                    </div>
                )}
            </div>
            {isModalOpen && (
                <AddRouteModal
                    onClose={() => setIsModalOpen(false)}
                    onAddRoute={onAddRoute}
                />
            )}
        </div>
    );
};
