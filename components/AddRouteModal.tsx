
import React, { useState } from 'react';
import { X, UploadCloud } from 'lucide-react';

interface AddRouteModalProps {
    onClose: () => void;
    onAddRoute: (name: string, origin: string, destination: string, kmlFile: File) => void;
}

export const AddRouteModal: React.FC<AddRouteModalProps> = ({ onClose, onAddRoute }) => {
    const [name, setName] = useState('');
    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');
    const [kmlFile, setKmlFile] = useState<File | null>(null);
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !origin || !destination || !kmlFile) {
            setError('Todos los campos son obligatorios.');
            return;
        }
        onAddRoute(name, origin, destination, kmlFile);
        onClose();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setKmlFile(e.target.files[0]);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-gray-800 text-white rounded-lg shadow-xl p-6 w-full max-w-lg m-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-sky-400">Agregar Nuevo Recorrido</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    {error && <p className="text-red-400 bg-red-900/50 p-2 rounded-md mb-4 text-sm">{error}</p>}
                    <div className="mb-4">
                        <label htmlFor="route-name" className="block text-sm font-medium text-gray-300 mb-1">Nombre del Recorrido</label>
                        <input type="text" id="route-name" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-sky-500 focus:border-sky-500" placeholder="Ej: Línea 101 - Centro" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label htmlFor="origin" className="block text-sm font-medium text-gray-300 mb-1">Origen</label>
                            <input type="text" id="origin" value={origin} onChange={(e) => setOrigin(e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-sky-500 focus:border-sky-500" placeholder="Ej: Terminal de Ómnibus" />
                        </div>
                        <div>
                            <label htmlFor="destination" className="block text-sm font-medium text-gray-300 mb-1">Destino</label>
                            <input type="text" id="destination" value={destination} onChange={(e) => setDestination(e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-sky-500 focus:border-sky-500" placeholder="Ej: Barrio Unimev" />
                        </div>
                    </div>
                    <div className="mb-6">
                        <label htmlFor="kml-file" className="block text-sm font-medium text-gray-300 mb-1">Archivo de Traza (.kml)</label>
                        <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-500 px-6 py-10">
                            <div className="text-center">
                                <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="mt-4 flex text-sm leading-6 text-gray-400">
                                    <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-semibold text-sky-400 focus-within:outline-none focus-within:ring-2 focus-within:ring-sky-600 focus-within:ring-offset-2 focus-within:ring-offset-gray-800 hover:text-sky-500">
                                        <span>Subir un archivo</span>
                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".kml" onChange={handleFileChange} />
                                    </label>
                                    <p className="pl-1">o arrastrar y soltar</p>
                                </div>
                                <p className="text-xs leading-5 text-gray-400">Solo archivos KML</p>
                                {kmlFile && <p className="text-sm text-green-400 mt-2">{kmlFile.name}</p>}
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">
                            Cancelar
                        </button>
                        <button type="submit" className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-lg">
                            Agregar Recorrido
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
