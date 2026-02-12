
import React, { useState } from 'react';
import type { RiskType } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { AlertTriangle, PlusCircle, Trash2, Edit } from 'lucide-react';


interface RiskTypeManagerProps {
    riskTypes: RiskType[];
    setRiskTypes: React.Dispatch<React.SetStateAction<RiskType[]>>;
}

export const RiskTypeManager: React.FC<RiskTypeManagerProps> = ({ riskTypes, setRiskTypes }) => {
    const [newTypeName, setNewTypeName] = useState('');
    const [newTypeColor, setNewTypeColor] = useState('#ffffff');
    const [editingType, setEditingType] = useState<RiskType | null>(null);

    const handleAddOrUpdate = () => {
        if (!newTypeName.trim()) return;

        if (editingType) {
            setRiskTypes(riskTypes.map(rt => rt.id === editingType.id ? { ...rt, name: newTypeName, color: newTypeColor } : rt));
            setEditingType(null);
        } else {
            const newType: RiskType = {
                id: uuidv4(),
                name: newTypeName,
                color: newTypeColor,
            };
            setRiskTypes([...riskTypes, newType]);
        }
        setNewTypeName('');
        setNewTypeColor('#ffffff');
    };
    
    const handleEdit = (riskType: RiskType) => {
        setEditingType(riskType);
        setNewTypeName(riskType.name);
        setNewTypeColor(riskType.color);
    };

    const handleDelete = (id: string) => {
        if(window.confirm("¿Está seguro que desea eliminar este tipo de riesgo?")) {
            setRiskTypes(riskTypes.filter(rt => rt.id !== id));
        }
    };
    
    const cancelEdit = () => {
        setEditingType(null);
        setNewTypeName('');
        setNewTypeColor('#ffffff');
    }

    return (
        <div>
            <h2 className="text-xl font-bold mb-4 text-sky-300">Tipos de Riesgo</h2>
            <div className="bg-gray-700 p-4 rounded-lg mb-4">
                <h3 className="font-semibold mb-2">{editingType ? 'Editar Tipo de Riesgo' : 'Agregar Nuevo Tipo'}</h3>
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={newTypeName}
                        onChange={(e) => setNewTypeName(e.target.value)}
                        placeholder="Nombre del riesgo"
                        className="flex-grow bg-gray-800 text-white p-2 rounded-md border border-gray-600 focus:ring-sky-500 focus:border-sky-500"
                    />
                    <input
                        type="color"
                        value={newTypeColor}
                        onChange={(e) => setNewTypeColor(e.target.value)}
                        className="p-1 h-10 w-10 block bg-gray-800 border border-gray-600 cursor-pointer rounded-lg disabled:opacity-50 disabled:pointer-events-none"
                    />
                </div>
                <div className="flex justify-end space-x-2 mt-3">
                    {editingType && <button onClick={cancelEdit} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-3 rounded-lg text-sm">Cancelar</button>}
                    <button onClick={handleAddOrUpdate} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-3 rounded-lg text-sm">
                        {editingType ? 'Actualizar' : 'Agregar'}
                    </button>
                </div>
            </div>

            <div className="space-y-2">
                {riskTypes.length > 0 ? riskTypes.map(rt => (
                    <div key={rt.id} className="bg-gray-700 p-3 rounded-lg flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: rt.color }}></div>
                            <span>{rt.name}</span>
                        </div>
                        <div className="flex space-x-2">
                            <button onClick={() => handleEdit(rt)} className="text-yellow-400 hover:text-yellow-500 p-1"><Edit size={16} /></button>
                            <button onClick={() => handleDelete(rt.id)} className="text-red-400 hover:text-red-500 p-1"><Trash2 size={16} /></button>
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-8 px-4 bg-gray-700 rounded-lg">
                        <AlertTriangle size={40} className="mx-auto text-gray-500" />
                        <p className="mt-2 text-gray-400">No hay tipos de riesgo definidos.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
