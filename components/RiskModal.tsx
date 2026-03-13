import React, { useState, useEffect } from 'react';
import type { RiskType, Risk } from '../types';
import { X } from 'lucide-react';

interface RiskModalProps {
    riskTypes: RiskType[];
    onClose: () => void;
    onSave: (riskTypeId: string, description: string, images: string[], videoUrl: string, driveUrl: string) => void;
    editingRisk?: Risk | null;
}

export const RiskModal: React.FC<RiskModalProps> = ({ riskTypes, onClose, onSave, editingRisk }) => {
    const [selectedRiskTypeId, setSelectedRiskTypeId] = useState<string>(editingRisk ? editingRisk.riskTypeId : (riskTypes.length > 0 ? riskTypes[0].id : ''));
    const[description, setDescription] = useState(editingRisk ? editingRisk.description : '');
    
    // Media States
    const [img1, setImg1] = useState(editingRisk?.images?.[0] || '');
    const [img2, setImg2] = useState(editingRisk?.images?.[1] || '');
    const [img3, setImg3] = useState(editingRisk?.images?.[2] || '');
    const [img4, setImg4] = useState(editingRisk?.images?.[3] || '');
    const [videoUrl, setVideoUrl] = useState(editingRisk?.videoUrl || '');
    const[driveUrl, setDriveUrl] = useState(editingRisk?.driveUrl || '');

    useEffect(() => {
        if (editingRisk) {
            setSelectedRiskTypeId(editingRisk.riskTypeId); setDescription(editingRisk.description);
        }
    }, [editingRisk]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedRiskTypeId) {
            const images =[img1, img2, img3, img4].filter(u => u.trim() !== '');
            onSave(selectedRiskTypeId, description, images, videoUrl, driveUrl);
        }
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