
import React, { useState } from 'react';
import type { RiskType } from '../types';
import { X } from 'lucide-react';

interface AddRiskModalProps {
    riskTypes: RiskType[];
    onClose: () => void;
    onAddRisk: (riskTypeId: string, description: string) => void;
}

export const AddRiskModal: React.FC<AddRiskModalProps> = ({ riskTypes, onClose, onAddRisk }) => {
    const [selectedRiskTypeId, setSelectedRiskTypeId] = useState<string>(riskTypes.length > 0 ? riskTypes[0].id : '');
    const [description, setDescription] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedRiskTypeId) {
            onAddRisk(selectedRiskTypeId, description);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-gray-800 text-white rounded-lg shadow-xl p-6 w-full max-w-md m-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-sky-400">Agregar Nuevo Riesgo</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="risk-type" className="block text-sm font-medium text-gray-300 mb-1">Tipo de Riesgo</label>
                        <select
                            id="risk-type"
                            value={selectedRiskTypeId}
                            onChange={(e) => setSelectedRiskTypeId(e.target.value)}
                            className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-sky-500 focus:border-sky-500"
                        >
                            {riskTypes.map(rt => (
                                <option key={rt.id} value={rt.id}>{rt.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-6">
                        <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Descripción (Opcional)</label>
                        <textarea
                            id="description"
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-sky-500 focus:border-sky-500"
                            placeholder="Ej: Curva cerrada sin visibilidad"
                        ></textarea>
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">
                            Cancelar
                        </button>
                        <button type="submit" className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-lg">
                            Agregar Riesgo
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
