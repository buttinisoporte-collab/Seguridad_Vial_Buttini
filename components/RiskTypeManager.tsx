import React, { useState } from 'react';
import type { RiskType } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { AlertTriangle, Trash2, Edit } from 'lucide-react';

interface RiskTypeManagerProps {
    riskTypes: RiskType[];
    setRiskTypes: React.Dispatch<React.SetStateAction<RiskType[]>>;
    isAdmin: boolean;
}

export const RiskTypeManager: React.FC<RiskTypeManagerProps> = ({ riskTypes, setRiskTypes, isAdmin }) => {
    const[newTypeName, setNewTypeName] = useState('');
    const[newTypeColor, setNewTypeColor] = useState('#ffffff');
    const[editingType, setEditingType] = useState<RiskType | null>(null);

    const handleAddOrUpdate = () => {
        if (!newTypeName.trim()) return;

        if (editingType) {
            setRiskTypes(riskTypes.map(rt => rt.id === editingType.id ? { ...rt, name: newTypeName, color: newTypeColor, isIncident: false } : rt));
            setEditingType(null);
        } else {
            const newType: RiskType = { id: uuidv4(), name: newTypeName, color: newTypeColor, isIncident: false };
            setRiskTypes([...riskTypes, newType]);
        }
        setNewTypeName(''); setNewTypeColor('#ffffff');
    };
    
    const handleEdit = (riskType: RiskType) => {
        setEditingType(riskType);
        setNewTypeName(riskType.name);
        setNewTypeColor(riskType.color);
    };

    const handleDelete = (id: string) => {
        if (!isAdmin) return alert("No tienes permisos para eliminar.");
        if(window.confirm("¿Está seguro que desea eliminar esta categoría?")) setRiskTypes(riskTypes.filter(rt => rt.id !== id));
    };
    
    const cancelEdit = () => {
        setEditingType(null); setNewTypeName(''); setNewTypeColor('#ffffff');
    }

    return (
        <div>
            <h2 className="text-xl font-bold mb-4 text-sky-300">Categorías de Puntos</h2>
            <div className="bg-gray-700 p-4 rounded-lg mb-4">
                <h3 className="font-semibold text-white mb-3">{editingType ? 'Editar Categoría' : 'Agregar Nueva Categoría'}</h3>
                <div className="flex flex-col space-y-3">
                    <div className="flex items-center space-x-2">
                        <input type="text" value={newTypeName} onChange={(e) => setNewTypeName(e.target.value)} placeholder="Nombre del riesgo..." className="flex-grow bg-gray-800 text-white p-2 rounded-md border border-gray-600 focus:ring-sky-500 outline-none" />
                        <input type="color" value={newTypeColor} onChange={(e) => setNewTypeColor(e.target.value)} className="p-1 h-10 w-10 block bg-gray-800 border border-gray-600 cursor-pointer rounded-lg" />
                    </div>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                    {editingType && <button onClick={cancelEdit} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-3 rounded-lg text-sm">Cancelar</button>}
                    <button onClick={handleAddOrUpdate} className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-3 rounded-lg text-sm">{editingType ? 'Actualizar' : 'Agregar'}</button>
                </div>
            </div>

            <div className="space-y-2">
                {riskTypes.length > 0 ? riskTypes.map(rt => (
                    <div key={rt.id} className="bg-gray-700 p-3 rounded-lg flex items-center justify-between border-l-4" style={{ borderLeftColor: rt.color}}>
                        <div>
                            <div className="flex items-center">
                                <div className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: rt.color }}></div>
                                <span className="font-semibold text-white">{rt.name}</span>
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <button onClick={() => handleEdit(rt)} className="text-yellow-400 hover:text-yellow-500 p-1"><Edit size={16} /></button>
                            {isAdmin && <button onClick={() => handleDelete(rt.id)} className="text-red-400 hover:text-red-500 p-1"><Trash2 size={16} /></button>}
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-8 px-4 bg-gray-700 rounded-lg"><AlertTriangle size={40} className="mx-auto text-gray-500" /><p className="mt-2 text-gray-400">No hay categorías definidas.</p></div>
                )}
            </div>
            <p className="text-xs text-gray-400 mt-4 italic">Haz clic en el mapa estando en esta pestaña para marcar un nuevo punto referenciado.</p>
        </div>
    );
};