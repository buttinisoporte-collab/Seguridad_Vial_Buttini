import React, { useState, useEffect } from 'react';
import type { RiskType, Risk, Route } from '../types';
import { X, MapPin } from 'lucide-react';

interface RiskModalProps {
    riskTypes: RiskType[];
    routes: Route[];
    onClose: () => void;
    onSave: (riskTypeId: string, description: string, images: string[], videoUrl: string, driveUrl: string, associatedRouteIds: string[]) => void;
    editingRisk?: Risk | null;
    initialAssociatedRouteIds?: string[];
}

export const RiskModal: React.FC<RiskModalProps> = ({ riskTypes, routes, onClose, onSave, editingRisk, initialAssociatedRouteIds = [] }) => {
    const [selectedRiskTypeId, setSelectedRiskTypeId] = useState<string>(editingRisk ? editingRisk.riskTypeId : (riskTypes.length > 0 ? riskTypes[0].id : ''));
    const [description, setDescription] = useState(editingRisk ? editingRisk.description : '');
    const [associatedRouteIds, setAssociatedRouteIds] = useState<string[]>(editingRisk ? editingRisk.associatedRouteIds : initialAssociatedRouteIds);
    
    // Media States
    const [img1, setImg1] = useState(editingRisk?.images?.[0] || '');
    const [img2, setImg2] = useState(editingRisk?.images?.[1] || '');
    const [img3, setImg3] = useState(editingRisk?.images?.[2] || '');
    const [img4, setImg4] = useState(editingRisk?.images?.[3] || '');
    const [videoUrl, setVideoUrl] = useState(editingRisk?.videoUrl || '');
    const [driveUrl, setDriveUrl] = useState(editingRisk?.driveUrl || '');

    useEffect(() => {
        if (editingRisk) {
            setSelectedRiskTypeId(editingRisk.riskTypeId); 
            setDescription(editingRisk.description);
            setAssociatedRouteIds(editingRisk.associatedRouteIds);
        }
    }, [editingRisk]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedRiskTypeId) {
            const images = [img1, img2, img3, img4].filter(u => u.trim() !== '');
            onSave(selectedRiskTypeId, description, images, videoUrl, driveUrl, associatedRouteIds);
        }
    };

    const toggleRoute = (id: string) => {
        setAssociatedRouteIds(prev => 
            prev.includes(id) ? prev.filter(rid => rid !== id) : [...prev, id]
        );
    };

    const selectedType = riskTypes.find(rt => rt.id === selectedRiskTypeId);
    const isIncident = selectedType?.isIncident || false;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999]">
            <div className="bg-gray-800 text-white rounded-lg shadow-xl p-6 w-full max-w-lg m-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-sky-400">{editingRisk ? 'Editar Punto' : 'Nuevo Punto en Mapa'}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-300 mb-1">Categoría</label>
                        <select value={selectedRiskTypeId} onChange={(e) => setSelectedRiskTypeId(e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-sky-500">
                            {riskTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.isIncident ? '🔴' : '🟡'} {rt.name}</option>)}
                        </select>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-300 mb-1">Descripción</label>
                        <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-sky-500" placeholder="Ej: Choque en la intersección..."></textarea>
                    </div>

                    {/* NUEVO: Selección de Recorridos */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                            <MapPin size={16} /> Recorridos Asociados
                        </label>
                        <div className="bg-gray-900/50 rounded-lg p-2 border border-gray-700 max-h-40 overflow-y-auto">
                            {routes.length === 0 ? (
                                <p className="text-xs text-gray-500 italic p-2">No hay recorridos cargados.</p>
                            ) : (
                                <div className="space-y-1">
                                    {routes.map(route => (
                                        <div 
                                            key={route.id} 
                                            onClick={() => toggleRoute(route.id)}
                                            className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${associatedRouteIds.includes(route.id) ? 'bg-sky-600/30 border-sky-500/50 border' : 'hover:bg-gray-700 border border-transparent'}`}
                                        >
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${associatedRouteIds.includes(route.id) ? 'bg-sky-500 border-sky-400' : 'border-gray-500'}`}>
                                                {associatedRouteIds.includes(route.id) && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                            </div>
                                            <span className="text-xs truncate">{route.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1 italic">El sistema asocia recorridos automáticamente por cercanía, pero puedes ajustarlos manualmente aquí.</p>
                    </div>

                    <div className="border-t border-gray-600 pt-4 mb-4 space-y-3">
                        <h3 className="text-sm font-bold text-sky-300 uppercase tracking-wider">Documentación Adjunta (URLs)</h3>
                        <div className="grid grid-cols-1 gap-3">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">URL Foto 1 {isIncident ? '' : '(Única permitida para Riesgos)'}</label>
                                <input type="url" value={img1} onChange={(e) => setImg1(e.target.value)} className="w-full bg-gray-700 text-white p-2 text-sm rounded border border-gray-600 focus:ring-sky-500" placeholder="https://..." />
                            </div>
                            {isIncident && (
                                <>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1">URL Foto 2</label>
                                            <input type="url" value={img2} onChange={(e) => setImg2(e.target.value)} className="w-full bg-gray-700 text-white p-2 text-sm rounded border border-gray-600" />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1">URL Foto 3</label>
                                            <input type="url" value={img3} onChange={(e) => setImg3(e.target.value)} className="w-full bg-gray-700 text-white p-2 text-sm rounded border border-gray-600" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">URL Foto 4</label>
                                        <input type="url" value={img4} onChange={(e) => setImg4(e.target.value)} className="w-full bg-gray-700 text-white p-2 text-sm rounded border border-gray-600" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">URL Video (Youtube, mp4, etc)</label>
                                        <input type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className="w-full bg-gray-700 text-white p-2 text-sm rounded border border-gray-600" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Carpeta Google Drive</label>
                                        <input type="url" value={driveUrl} onChange={(e) => setDriveUrl(e.target.value)} className="w-full bg-gray-700 text-white p-2 text-sm rounded border border-gray-600" placeholder="https://drive.google.com/..." />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
                        <button type="submit" className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-lg">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
