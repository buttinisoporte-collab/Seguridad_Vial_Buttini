import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap, Tooltip } from 'react-leaflet';
import L, { LatLngExpression, LatLng, Icon } from 'leaflet';
import { pointToLineDistance } from '@turf/turf';
import { kml } from '@tmcw/togeojson';
import { v4 as uuidv4 } from 'uuid';

import type { Route, Risk, RiskType, Position, GeoJSONFeature, GeoJSONLineString, RouteGeoJSON } from './types';
import { Panel } from './components/Panel';
import { RiskModal } from './components/RiskModal';
import { MapClickHandler } from './components/MapClickHandler';
import { PublicRouteViewer } from './components/PublicRouteViewer';
import { Edit2, Trash2, Folder, Video, AlertCircle } from 'lucide-react';

// Importamos la conexión a la Base de Datos Nube (Firebase)
import { 
    saveRouteToDB, loadRoutesFromDB, deleteRouteFromDB,
    saveRiskToDB, loadRisksFromDB, deleteRiskFromDB,
    saveRiskTypeToDB, loadRiskTypesFromDB, deleteRiskTypeFromDB
} from './lib/firebase';

export type AppTab = 'routes' | 'riskTypes' | 'reports' | 'riskViewer' | 'settings';

const SAN_RAFAEL_CENTER: LatLngExpression =[-34.6175, -68.335];

const createRiskIcon = (color: string) => {
    const iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32" height="32"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
    return new Icon({ iconUrl: `data:image/svg+xml;base64,${btoa(iconHtml)}`, iconSize:[32, 32], iconAnchor:[16, 32], popupAnchor:[0, -32] });
};

// --- FUNCIÓN UTILITARIA PARA CALCULAR CERCANÍA ---
// Extraída para poder usarse tanto al crear riesgos como al crear rutas
const isPointNearRoute = (position: Position, geoJson: RouteGeoJSON, distanceThreshold: number): boolean => {
    if (!geoJson || !geoJson.features) return false;
    const riskPoint =[position.lng, position.lat];
    const features = geoJson.features.filter(
        (feature): feature is GeoJSONFeature<GeoJSONLineString> => feature.geometry.type === 'LineString'
    );
    for (const feature of features) {
        const distance = pointToLineDistance(riskPoint, feature.geometry.coordinates, { units: 'meters' });
        if (distance <= distanceThreshold) {
            return true;
        }
    }
    return false;
};

const MapBoundsUpdater: React.FC<{ routes: Route[], risks: Risk[] }> = ({ routes, risks }) => {
    const map = useMap();
    useEffect(() => {
        const points: LatLngExpression[] =[];
        routes.forEach(route => {
            if (route.geoJson) {
                route.geoJson.features.forEach(feature => {
                    if (feature.geometry.type === 'LineString') {
                        feature.geometry.coordinates.forEach(([lng, lat]) => points.push([lat, lng]));
                    }
                });
            }
        });
        risks.forEach(risk => points.push([risk.position.lat, risk.position.lng]));

        if (points.length > 0) {
            const bounds = L.latLngBounds(points);
            map.fitBounds(bounds, { padding:[50, 50], maxZoom: 15 });
        } else {
            map.setView(SAN_RAFAEL_CENTER, 13);
        }
    }, [routes, risks, map]);
    return null;
};

const App: React.FC = () => {
    const[isLoadingData, setIsLoadingData] = useState(true);
    const [activeTab, setActiveTab] = useState<AppTab>('routes');
   
    const [showRisks, setShowRisks] = useState(true);
    const [showIncidents, setShowIncidents] = useState(true);

    const[filterGroup, setFilterGroup] = useState('');
    const [filterLine, setFilterLine] = useState('');
    const[filterService, setFilterService] = useState('');
    const [activeRouteId, setActiveRouteId] = useState<string | null>(null);
    const [reportSelectedRouteId, setReportSelectedRouteId] = useState<string>('');
    const [riskViewerSelectedTypes, setRiskViewerSelectedTypes] = useState<string[]>([]);

    const [riskTypes, setRiskTypes] = useState<RiskType[]>([]);
    const [routes, setRoutes] = useState<Route[]>([]);
    const[risks, setRisks] = useState<Risk[]>([]);
    const [proximityDistance, setProximityDistance] = useState<number>(() => Number(localStorage.getItem('proximityDistance')) || 50);
    const[isAddRiskModalOpen, setIsAddRiskModalOpen] = useState<boolean>(false);
    const[editingRisk, setEditingRisk] = useState<Risk | null>(null);
    const [newRiskPosition, setNewRiskPosition] = useState<Position | null>(null);

    // Refs para la sincronización Mágica
    const prevRoutesRef = useRef<Route[]>([]);
    const prevRisksRef = useRef<Risk[]>([]);
    const prevRiskTypesRef = useRef<RiskType[]>([]);

    const urlParams = new URLSearchParams(window.location.search);
    const publicRouteId = urlParams.get('publicRoute');

    // Carga inicial (Intenta Firebase, si falla usa LocalStorage)
    useEffect(() => {
        const initData = async () => {
            setIsLoadingData(true);
            try {
                const dbRoutes = await loadRoutesFromDB();
                const dbRisks = await loadRisksFromDB();
                const dbRiskTypes = await loadRiskTypesFromDB();

                setRoutes(dbRoutes); prevRoutesRef.current = dbRoutes;
                setRisks(dbRisks); prevRisksRef.current = dbRisks;

                if (dbRiskTypes.length > 0) {
                    setRiskTypes(dbRiskTypes); prevRiskTypesRef.current = dbRiskTypes;
                } else {
                    const defaultTypes: RiskType[] =[
                        { id: '1', name: 'Escuela', color: '#3b82f6', isIncident: false },
                        { id: '2', name: 'Hospital', color: '#ef4444', isIncident: false },
                        { id: '3', name: 'Cruce Peligroso', color: '#f97316', isIncident: false },
                        { id: '4', name: 'Contingencia Climática', color: '#8b5cf6', isIncident: false },
                        { id: '5', name: 'Accidente Histórico', color: '#eab308', isIncident: true },
                    ];
                    setRiskTypes(defaultTypes);
                    defaultTypes.forEach(t => saveRiskTypeToDB(t).catch(()=>{}));
                    prevRiskTypesRef.current = defaultTypes;
                }
            } catch (err) {
                console.warn("Base de datos Nube no conectada. Usando Modo Local.", err);
                const localRoutes = JSON.parse(localStorage.getItem('routes') || '[]');
                const localRisks = JSON.parse(localStorage.getItem('risks') || '[]');
                const localTypes = JSON.parse(localStorage.getItem('riskTypes') || '[]');
                
                setRoutes(localRoutes); prevRoutesRef.current = localRoutes;
                setRisks(localRisks); prevRisksRef.current = localRisks;
                if(localTypes.length > 0) { setRiskTypes(localTypes); prevRiskTypesRef.current = localTypes; }
            } finally {
                setIsLoadingData(false);
            }
        };
        initData();
    },[]);

    // Sincronización en tiempo real (Guarda en Nube y LocalStorage automáticamente)
    useEffect(() => {
        if (isLoadingData) return;
        localStorage.setItem('routes', JSON.stringify(routes));
        const prev = prevRoutesRef.current;
        const deleted = prev.filter(p => !routes.find(c => c.id === p.id));
        const added = routes.filter(c => !prev.find(p => p.id === c.id) || JSON.stringify(prev.find(p=>p.id===c.id)) !== JSON.stringify(c));
        
        deleted.forEach(d => deleteRouteFromDB(d.id).catch(()=>{}));
        added.forEach(c => saveRouteToDB(c).catch(()=>{}));
        prevRoutesRef.current = routes;
    }, [routes, isLoadingData]);

    useEffect(() => {
        if (isLoadingData) return;
        localStorage.setItem('risks', JSON.stringify(risks));
        const prev = prevRisksRef.current;
        const deleted = prev.filter(p => !risks.find(c => c.id === p.id));
        const added = risks.filter(c => !prev.find(p => p.id === c.id) || JSON.stringify(prev.find(p=>p.id===c.id)) !== JSON.stringify(c));
        
        deleted.forEach(d => deleteRiskFromDB(d.id).catch(()=>{}));
        added.forEach(c => saveRiskToDB(c).catch(()=>{}));
        prevRisksRef.current = risks;
    },[risks, isLoadingData]);

    useEffect(() => {
        if (isLoadingData) return;
        localStorage.setItem('riskTypes', JSON.stringify(riskTypes));
        const prev = prevRiskTypesRef.current;
        const deleted = prev.filter(p => !riskTypes.find(c => c.id === p.id));
        const added = riskTypes.filter(c => !prev.find(p => p.id === c.id) || JSON.stringify(prev.find(p=>p.id===c.id)) !== JSON.stringify(c));
        
        deleted.forEach(d => deleteRiskTypeFromDB(d.id).catch(()=>{}));
        added.forEach(c => saveRiskTypeToDB(c).catch(()=>{}));
        prevRiskTypesRef.current = riskTypes;
    }, [riskTypes, isLoadingData]);

    useEffect(() => { localStorage.setItem('proximityDistance', proximityDistance.toString()); }, [proximityDistance]);
    
    useEffect(() => {
        setIsAddRiskModalOpen(false); setNewRiskPosition(null); setEditingRisk(null);
    }, [activeTab]);

    // Visor Público (Se evalúa después de cargar los datos)
    if (publicRouteId) {
        if (isLoadingData) {
            return (
                <div className="flex h-screen w-screen items-center justify-center bg-gray-900 text-white flex-col">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-sky-500 mb-4"></div>
                    <h1 className="text-xl font-bold text-sky-400">Cargando recorrido público...</h1>
                </div>
            );
        }

        const publicRoute = routes.find(r => r.id === publicRouteId);
        if (publicRoute && publicRoute.isPublic) {
            const associatedRisks = risks.filter(risk => risk.associatedRouteIds.includes(publicRouteId));
            return <PublicRouteViewer route={publicRoute} risks={associatedRisks} riskTypes={riskTypes} />;
        } else {
            return (
                <div className="flex h-screen w-screen items-center justify-center bg-gray-900 text-white flex-col">
                    <AlertCircle size={64} className="text-red-500 mb-4" />
                    <h1 className="text-2xl font-bold mb-2 text-sky-400">Acceso Denegado</h1>
                    <p className="text-gray-400">El recorrido solicitado no existe o su enlace público ha sido revocado.</p>
                </div>
            );
        }
    }

    const togglePublicRoute = (id: string) => {
        setRoutes(prev => prev.map(r => r.id === id ? { ...r, isPublic: !r.isPublic } : r));
    };

    const findAssociatedRouteIds = useCallback((position: Position): string[] => {
        const associatedIds: string[] =[];
        routes.forEach(route => {
            if (route.geoJson && isPointNearRoute(position, route.geoJson, proximityDistance)) {
                associatedIds.push(route.id);
            }
        });
        return associatedIds;
    }, [routes, proximityDistance]);
   
    const handleMapClick = (latlng: LatLng) => {
        if (activeTab === 'riskTypes') {
            setNewRiskPosition({ lat: latlng.lat, lng: latlng.lng });
            setIsAddRiskModalOpen(true);
        }
    };

    const handleSaveRisk = (id: string, riskTypeId: string, description: string, images: string[], videoUrl: string, driveUrl: string, isEditing: boolean) => {
        if (isEditing && editingRisk) {
            setRisks(prev => prev.map(r => r.id === id ? {
                ...r, riskTypeId, description, images, videoUrl, driveUrl, associatedRouteIds: findAssociatedRouteIds(r.position)
            } : r));
            setEditingRisk(null);
        } else if (newRiskPosition) {
            const newRisk: Risk = {
                id, position: newRiskPosition, riskTypeId, description, images, videoUrl, driveUrl, associatedRouteIds: findAssociatedRouteIds(newRiskPosition),
            };
            setRisks(prev => [...prev, newRisk]);
            setIsAddRiskModalOpen(false);
            setNewRiskPosition(null);
        }
    };

    const handleDeleteRisk = (id: string) => {
        if (window.confirm("¿Está seguro que desea eliminar este punto?")) setRisks(prev => prev.filter(r => r.id !== id));
    };
   
    const handleAddRoute = (name: string, origin: string, destination: string, group: string, line: string, service: string, kmlFile: File) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const kmlContent = event.target?.result as string;
                const dom = new DOMParser().parseFromString(kmlContent, 'application/xml');
                const geoJson = kml(dom) as any;
                const newRoute: Route = { id: uuidv4(), name, origin, destination, group, line, service, geoJson, isPublic: false };
                
                // 1. Guardar la nueva ruta
                setRoutes(prev => [...prev, newRoute]);
               
                // 2. MAGIA: Actualizar riesgos existentes escaneando la nueva ruta
                setRisks(prevRisks => prevRisks.map(risk => {
                    // Si el riesgo viejo está cerca de la ruta nueva...
                    if (isPointNearRoute(risk.position, geoJson, proximityDistance)) {
                        return {
                            ...risk,
                            // ... le agregamos el ID de la ruta nueva a su lista de afectados
                            associatedRouteIds: [...new Set([...risk.associatedRouteIds, newRoute.id])]
                        };
                    }
                    return risk;
                }));

            } catch (error) {
                alert("Error al procesar el archivo KML. Por favor, asegúrese de que sea un archivo válido.");
            }
        };
        reader.readAsText(kmlFile);
    };
   
    const getRiskType = (id: string): RiskType | undefined => riskTypes.find(rt => rt.id === id);

    const baseVisibleRisks = useMemo(() => {
        return risks.filter(risk => {
            const rt = getRiskType(risk.riskTypeId);
            if (!rt) return false;
            if (rt.isIncident && !showIncidents) return false;
            if (!rt.isIncident && !showRisks) return false;
            return true;
        });
    },[risks, riskTypes, showRisks, showIncidents]);

    const visibleRoutes = useMemo(() => {
        if (activeTab === 'routes') {
            if (activeRouteId) return routes.filter(r => r.id === activeRouteId);
            return routes.filter(route =>
                (filterGroup === '' || route.group.toLowerCase().includes(filterGroup.toLowerCase())) &&
                (filterLine === '' || route.line.toLowerCase().includes(filterLine.toLowerCase())) &&
                (filterService === '' || route.service.toLowerCase().includes(filterService.toLowerCase()))
            );
        } else if (activeTab === 'reports') {
            return reportSelectedRouteId ? routes.filter(r => r.id === reportSelectedRouteId) :[];
        } else if (activeTab === 'riskViewer') {
            const affectedRouteIds = new Set<string>();
            baseVisibleRisks.forEach(risk => {
                if (riskViewerSelectedTypes.includes(risk.riskTypeId)) {
                    risk.associatedRouteIds.forEach(id => affectedRouteIds.add(id));
                }
            });
            return routes.filter(route => affectedRouteIds.has(route.id));
        }
        return routes;
    },[routes, activeTab, filterGroup, filterLine, filterService, activeRouteId, reportSelectedRouteId, riskViewerSelectedTypes, baseVisibleRisks]);

    const visibleRisks = useMemo(() => {
        if (activeTab === 'routes') {
            const visibleRouteIds = new Set(visibleRoutes.map(r => r.id));
            return baseVisibleRisks.filter(risk => risk.associatedRouteIds.some(id => visibleRouteIds.has(id)));
        } else if (activeTab === 'reports') {
            return reportSelectedRouteId ? baseVisibleRisks.filter(risk => risk.associatedRouteIds.includes(reportSelectedRouteId)) :[];
        } else if (activeTab === 'riskViewer') {
            if (riskViewerSelectedTypes.length === 0) return[];
            return baseVisibleRisks.filter(risk => riskViewerSelectedTypes.includes(risk.riskTypeId));
        }
        return baseVisibleRisks;
    },[baseVisibleRisks, activeTab, visibleRoutes, reportSelectedRouteId, riskViewerSelectedTypes]);

    if (isLoadingData) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-gray-900 text-white flex-col">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-sky-500 mb-4"></div>
                <h1 className="text-xl font-bold text-sky-400">Conectando con la Base de Datos...</h1>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-screen bg-gray-100 font-sans">
            <Panel
                riskTypes={riskTypes} setRiskTypes={setRiskTypes}
                routes={routes} setRoutes={setRoutes}
                risks={risks} setRisks={setRisks}
                proximityDistance={proximityDistance} setProximityDistance={setProximityDistance}
                onAddRoute={handleAddRoute} getRiskType={getRiskType}
                activeTab={activeTab} setActiveTab={setActiveTab}
                showRisks={showRisks} setShowRisks={setShowRisks}
                showIncidents={showIncidents} setShowIncidents={setShowIncidents}
                filterGroup={filterGroup} setFilterGroup={setFilterGroup}
                filterLine={filterLine} setFilterLine={setFilterLine}
                filterService={filterService} setFilterService={setFilterService}
                activeRouteId={activeRouteId} setActiveRouteId={setActiveRouteId}
                reportSelectedRouteId={reportSelectedRouteId} setReportSelectedRouteId={setReportSelectedRouteId}
                riskViewerSelectedTypes={riskViewerSelectedTypes} setRiskViewerSelectedTypes={setRiskViewerSelectedTypes}
                togglePublicRoute={togglePublicRoute}
            />
            <main className="flex-1 h-full relative">
                 <MapContainer center={SAN_RAFAEL_CENTER} zoom={13} style={{ height: '100%', width: '100%' }} className="z-0">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
                    <MapBoundsUpdater routes={visibleRoutes} risks={visibleRisks} />
                    {activeTab === 'riskTypes' && <MapClickHandler onMapClick={handleMapClick} />}

                    {visibleRoutes.map(route => {
                        const path: LatLngExpression[][] =[];
                        if (route.geoJson) {
                            route.geoJson.features.forEach(feature => {
                                if (feature.geometry.type === 'LineString') path.push(feature.geometry.coordinates.map(([lng, lat]) =>[lat, lng]));
                            });
                        }
                        const opacity = (activeTab === 'routes' || activeTab === 'reports' || activeTab === 'riskViewer') ? 1 : 0.4;
                        return <Polyline key={route.id} positions={path} color="#0284c7" weight={5} opacity={opacity} />;
                    })}

                    {visibleRisks.map(risk => {
                        const riskType = getRiskType(risk.riskTypeId);
                        if (!riskType) return null;
                        const icon = createRiskIcon(riskType.color);
                        const associatedRoutes = routes.filter(r => risk.associatedRouteIds.includes(r.id));
                       
                        return (
                             <Marker key={risk.id} position={[risk.position.lat, risk.position.lng]} icon={icon}>
                                {activeTab === 'routes' && (
                                    <Tooltip permanent direction="top" offset={[0, -25]} className="bg-white border border-gray-300 shadow-md font-bold text-xs py-1 px-2 rounded-md" opacity={0.9}>
                                        {riskType.name}
                                    </Tooltip>
                                )}
                                <Popup>
                                    <div className="flex justify-between items-start mb-1 min-w-[200px]">
                                        <div>
                                            <div className="font-bold text-lg leading-tight" style={{ color: riskType.color }}>{riskType.name}</div>
                                            <div className="text-[10px] text-gray-500 uppercase tracking-wide">{riskType.isIncident ? 'Siniestro' : 'Riesgo Vial'}</div>
                                        </div>
                                        {activeTab === 'riskTypes' && (
                                            <div className="flex gap-1 ml-2">
                                                <button onClick={() => setEditingRisk(risk)} className="p-1 text-gray-400 hover:text-sky-500" title="Editar"><Edit2 size={14} /></button>
                                                <button onClick={() => handleDeleteRisk(risk.id)} className="p-1 text-gray-400 hover:text-red-500" title="Eliminar"><Trash2 size={14} /></button>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-gray-700 text-sm mb-2">{risk.description}</p>
                                   
                                    <div className="flex gap-2 items-center mb-2">
                                        {risk.images && risk.images.length > 0 && risk.images.map((img, idx) => img && (
                                            <a key={idx} href={img} target="_blank" rel="noreferrer" title="Ver imagen">
                                                <img src={img} alt="Adjunto" className="w-10 h-10 object-cover rounded border border-gray-300 hover:border-sky-500" />
                                            </a>
                                        ))}
                                        {risk.videoUrl && (
                                            <a href={risk.videoUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded border border-gray-300 text-gray-600 hover:text-sky-500 hover:border-sky-500" title="Ver Video"><Video size={20} /></a>
                                        )}
                                        {risk.driveUrl && (
                                            <a href={risk.driveUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded border border-gray-300 text-gray-600 hover:text-green-500 hover:border-green-500" title="Carpeta Drive"><Folder size={20} /></a>
                                        )}
                                    </div>

                                    {associatedRoutes.length > 0 && (
                                        <div className="mt-2 pt-2 border-t">
                                            <h4 className="font-semibold text-sm text-gray-800">Recorridos Afectados:</h4>
                                            <ul className="list-disc list-inside text-xs text-gray-600 max-h-24 overflow-y-auto">
                                                {associatedRoutes.map(r => <li key={r.id}>{r.name}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                </Popup>
                            </Marker>
                        )
                    })}
                    {newRiskPosition && activeTab === 'riskTypes' && <Circle center={[newRiskPosition.lat, newRiskPosition.lng]} radius={proximityDistance} color="#fb923c" fillOpacity={0.2} />}
                </MapContainer>
            </main>
           
            {isAddRiskModalOpen && newRiskPosition && <RiskModal riskTypes={riskTypes} onClose={() => setIsAddRiskModalOpen(false)} onSave={(...args) => handleSaveRisk(uuidv4(), ...args, false)} />}
            {editingRisk && <RiskModal riskTypes={riskTypes} editingRisk={editingRisk} onClose={() => setEditingRisk(null)} onSave={(...args) => handleSaveRisk(editingRisk.id, ...args, true)} />}
        </div>
    );
};
export default App;