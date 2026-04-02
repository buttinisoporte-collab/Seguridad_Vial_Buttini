import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap, Tooltip } from 'react-leaflet';
import L, { LatLngExpression, LatLng, Icon } from 'leaflet';
import { pointToLineDistance, point, lineString } from '@turf/turf';
import { kml } from '@tmcw/togeojson';
import { v4 as uuidv4 } from 'uuid';

import type { Route, Risk, RiskType, Position, GeoJSONFeature, GeoJSONLineString, RouteGeoJSON, User, AppTab, Siniestro } from './types';
import { Panel } from './components/Panel';
import { RiskModal } from './components/RiskModal';
import { MapClickHandler } from './components/MapClickHandler';
import { PublicRouteViewer } from './components/PublicRouteViewer';
import { DriverApp } from './components/DriverApp';
import { SiniestroForm } from './components/SiniestroForm';
import { Login } from './components/Login';
import { Edit2, Trash2, Folder, Video, AlertCircle, Bus, ShieldAlert, Navigation } from 'lucide-react';

import { 
    saveRouteToDB, loadRoutesFromDB, deleteRouteFromDB,
    saveRiskToDB, loadRisksFromDB, deleteRiskFromDB,
    saveRiskTypeToDB, loadRiskTypesFromDB, deleteRiskTypeFromDB,
    saveUserToDB, loadUsersFromDB, deleteUserFromDB,
    saveSiniestroToDB, loadSiniestrosFromDB, deleteSiniestroFromDB
} from './lib/firebase';

const SAN_RAFAEL_CENTER: LatLngExpression =[-34.6175, -68.335];

const createRiskIcon = (color: string) => {
    const iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32" height="32"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
    return new Icon({ iconUrl: `data:image/svg+xml;base64,${btoa(iconHtml)}`, iconSize:[32, 32], iconAnchor:[16, 32], popupAnchor:[0, -32] });
};

const MapFixer = () => {
    const map = useMap();
    useEffect(() => { const timer = setTimeout(() => map.invalidateSize(), 300); return () => clearTimeout(timer); }, [map]);
    return null;
}

const MapFocusUpdater = ({ focusPosition }: { focusPosition: Position | null }) => {
    const map = useMap();
    useEffect(() => { if (focusPosition) map.flyTo([focusPosition.lat, focusPosition.lng], 16, { animate: true }); }, [focusPosition, map]);
    return null;
};

const isPointNearRoute = (position: Position, geoJson: RouteGeoJSON, distanceThreshold: number): boolean => {
    if (!geoJson || !Array.isArray(geoJson.features) || !position || typeof position.lat !== 'number' || typeof position.lng !== 'number') return false;
    try {
        const riskPoint = point([position.lng, position.lat]);
        const features = geoJson.features.filter((f): f is GeoJSONFeature<GeoJSONLineString> => f?.geometry?.type === 'LineString' && Array.isArray(f.geometry?.coordinates));
        for (const feature of features) {
            const validCoords = feature.geometry.coordinates.filter(c => Array.isArray(c) && c.length >= 2 && typeof c[0] === 'number' && typeof c[1] === 'number');
            if (Array.isArray(validCoords) && validCoords.length >= 2) {
                const line = lineString(validCoords as[number, number][]);
                if (pointToLineDistance(riskPoint, line, { units: 'meters' }) <= distanceThreshold) return true;
            }
        }
    } catch (e) { console.warn("Cálculo omitido por geometría inválida."); }
    return false;
};

const MapBoundsUpdater: React.FC<{ routes: Route[], risks: Risk[] }> = ({ routes, risks }) => {
    const map = useMap();
    useEffect(() => {
        const points: LatLngExpression[] =[];
        if (Array.isArray(routes)) routes.forEach(r => { if (r?.geoJson?.features && Array.isArray(r.geoJson.features)) r.geoJson.features.forEach(f => { if (f?.geometry?.type === 'LineString' && Array.isArray(f.geometry.coordinates)) f.geometry.coordinates.forEach(c => { if (Array.isArray(c) && c.length>=2) points.push([c[1], c[0]]); }); }); });
        if (Array.isArray(risks)) risks.forEach(r => { if (r?.position?.lat && r?.position?.lng) points.push([r.position.lat, r.position.lng]); });
        if (Array.isArray(points) && points.length > 0) map.fitBounds(L.latLngBounds(points), { padding:[50, 50], maxZoom: 15 });
        else map.setView(SAN_RAFAEL_CENTER, 13);
    },[routes, risks, map]);
    return null;
};

const App: React.FC = () => {
    const [isLoadingData, setIsLoadingData] = useState(true);
    
    const [currentUser, setCurrentUser] = useState<User | null>(() => { const s = localStorage.getItem('currentUser'); return s ? JSON.parse(s) : null; });
    const[currentDriver, setCurrentDriver] = useState<User | null>(() => { const s = localStorage.getItem('currentDriver'); return s ? JSON.parse(s) : null; });

    const[activeTab, setActiveTab] = useState<AppTab>('routes');
    const [showRisks, setShowRisks] = useState(true);
    const[showIncidents, setShowIncidents] = useState(true);
    const[filterGroup, setFilterGroup] = useState('');
    const[filterLine, setFilterLine] = useState('');
    const [filterService, setFilterService] = useState('');
    const[activeRouteId, setActiveRouteId] = useState<string | null>(null);
    const[reportSelectedRouteId, setReportSelectedRouteId] = useState<string>('');
    const[riskViewerSelectedTypes, setRiskViewerSelectedTypes] = useState<string[]>([]);
    
    const [focusPosition, setFocusPosition] = useState<Position | null>(null);

    const [users, setUsers] = useState<User[]>([]);
    const[riskTypes, setRiskTypes] = useState<RiskType[]>([]);
    const[routes, setRoutes] = useState<Route[]>([]);
    const [risks, setRisks] = useState<Risk[]>([]);
    const [siniestros, setSiniestros] = useState<Siniestro[]>([]);
    
    const [proximityDistance, setProximityDistance] = useState<number>(() => Number(localStorage.getItem('proximityDistance')) || 50);
    const [driverReportTTL, setDriverReportTTL] = useState<number>(() => Number(localStorage.getItem('driverReportTTL')) || 12);
    
    const[isAddRiskModalOpen, setIsAddRiskModalOpen] = useState<boolean>(false);
    const[editingRisk, setEditingRisk] = useState<Risk | null>(null);
    const [newRiskPosition, setNewRiskPosition] = useState<Position | null>(null);

    const prevRoutesRef = useRef<Route[]>([]);
    const prevRisksRef = useRef<Risk[]>([]);
    const prevRiskTypesRef = useRef<RiskType[]>([]);
    const prevUsersRef = useRef<User[]>([]);
    const prevSiniestrosRef = useRef<Siniestro[]>([]);

    const urlParams = new URLSearchParams(window.location.search);
    const publicRouteId = urlParams.get('publicRoute');
    const isDriverMode = urlParams.get('mode') === 'driver';
    const isSiniestroMode = urlParams.get('mode') === 'siniestro';

    useEffect(() => {
        const initData = async () => {
            setIsLoadingData(true);
            try {
                const[dbRoutes, dbRisks, dbRiskTypes, dbUsers, dbSiniestros] = await Promise.all([ loadRoutesFromDB(), loadRisksFromDB(), loadRiskTypesFromDB(), loadUsersFromDB(), loadSiniestrosFromDB() ]);
                
                setRoutes(Array.isArray(dbRoutes) ? dbRoutes :[]); prevRoutesRef.current = Array.isArray(dbRoutes) ? dbRoutes :[];
                setRisks(Array.isArray(dbRisks) ? dbRisks :[]); prevRisksRef.current = Array.isArray(dbRisks) ? dbRisks :[];
                setSiniestros(Array.isArray(dbSiniestros) ? dbSiniestros :[]); prevSiniestrosRef.current = Array.isArray(dbSiniestros) ? dbSiniestros :[];

                if (Array.isArray(dbRiskTypes) && dbRiskTypes.length > 0) { 
                    if (!dbRiskTypes.find(rt => rt.id === 'incidente-ruta')) {
                        const incType = { id: 'incidente-ruta', name: 'Incidente en Ruta', color: '#000000', isIncident: true };
                        dbRiskTypes.push(incType); saveRiskTypeToDB(incType).catch(()=>{});
                    }
                    setRiskTypes(dbRiskTypes); prevRiskTypesRef.current = dbRiskTypes; 
                } else {
                    const defaultTypes: RiskType[] =[{ id: 'incidente-ruta', name: 'Incidente en Ruta', color: '#000000', isIncident: true }, { id: '1', name: 'Escuela', color: '#3b82f6', isIncident: false }, { id: '2', name: 'Hospital', color: '#ef4444', isIncident: false }];
                    setRiskTypes(defaultTypes); defaultTypes.forEach(t => saveRiskTypeToDB(t).catch(()=>{})); prevRiskTypesRef.current = defaultTypes;
                }

                if (Array.isArray(dbUsers) && dbUsers.length > 0) { setUsers(dbUsers); prevUsersRef.current = dbUsers; } 
                else {
                    const defaultAdmin: User = { id: uuidv4(), name: 'Administrador', username: 'admin', pin: '1234', isAdmin: true, allowedTabs:['routes', 'riskTypes', 'reports', 'riskViewer', 'settings', 'users', 'novedades', 'siniestros'] };
                    setUsers([defaultAdmin]); saveUserToDB(defaultAdmin).catch(()=>{}); prevUsersRef.current =[defaultAdmin];
                }

                const offlineSiniestros = JSON.parse(localStorage.getItem('offline_siniestros') || '[]');
                if (Array.isArray(offlineSiniestros) && offlineSiniestros.length > 0 && navigator.onLine) {
                    for (const os of offlineSiniestros) { await saveSiniestroToDB(os).catch(()=>{}); }
                    localStorage.removeItem('offline_siniestros');
                }

            } catch (err) {
                console.warn("Usando Modo Local.");
                setRoutes(Array.isArray(JSON.parse(localStorage.getItem('routes') || '[]')) ? JSON.parse(localStorage.getItem('routes') || '[]') :[]);
                setRisks(Array.isArray(JSON.parse(localStorage.getItem('risks') || '[]')) ? JSON.parse(localStorage.getItem('risks') || '[]') :[]);
                setSiniestros(Array.isArray(JSON.parse(localStorage.getItem('siniestros') || '[]')) ? JSON.parse(localStorage.getItem('siniestros') || '[]') :[]);
                const localTypes = JSON.parse(localStorage.getItem('riskTypes') || '[]'); if(Array.isArray(localTypes) && localTypes.length > 0) setRiskTypes(localTypes);
                const localUsers = JSON.parse(localStorage.getItem('users') || '[]');
                if(Array.isArray(localUsers) && localUsers.length > 0) setUsers(localUsers);
                else setUsers([{ id: uuidv4(), name: 'Admin Local', username: 'admin', pin: '1234', isAdmin: true, allowedTabs:['routes', 'riskTypes', 'reports', 'riskViewer', 'settings', 'users', 'novedades', 'siniestros'] }]);
            } finally { setIsLoadingData(false); }
        };
        initData();
    },[]);

    // Sincronizaciones DB y LocalStorage...
    useEffect(() => {
        if (isLoadingData) return;
        localStorage.setItem('routes', JSON.stringify(routes));
        const prev = prevRoutesRef.current;
        const deleted = prev.filter(p => !routes.find(c => c.id === p.id));
        const added = routes.filter(c => !prev.find(p => p.id === c.id) || JSON.stringify(prev.find(p=>p.id===c.id)) !== JSON.stringify(c));
        deleted.forEach(d => deleteRouteFromDB(d.id).catch(()=>{}));
        added.forEach(c => saveRouteToDB(c).catch((e) => {
            console.error(e);
            alert(`No se pudo subir a Firebase la ruta ${c.name} porque es demasiado pesada.`);
        }));
        prevRoutesRef.current = routes;
    },[routes, isLoadingData]);

    useEffect(() => {
        if (isLoadingData) return;
        localStorage.setItem('risks', JSON.stringify(risks));
        const prev = prevRisksRef.current;
        const added = risks.filter(c => !prev.find(p => p.id === c.id) || JSON.stringify(prev.find(p=>p.id===c.id)) !== JSON.stringify(c));
        prev.filter(p => !risks.find(c => c.id === p.id)).forEach(d => deleteRiskFromDB(d.id).catch(()=>{}));
        added.forEach(c => saveRiskToDB(c).catch(()=>{}));
        prevRisksRef.current = risks;
    },[risks, isLoadingData]);

    useEffect(() => {
        if (isLoadingData) return;
        localStorage.setItem('siniestros', JSON.stringify(siniestros));
        const prev = prevSiniestrosRef.current;
        const added = siniestros.filter(c => !prev.find(p => p.id === c.id) || JSON.stringify(prev.find(p=>p.id===c.id)) !== JSON.stringify(c));
        prev.filter(p => !siniestros.find(c => c.id === p.id)).forEach(d => deleteSiniestroFromDB(d.id).catch(()=>{}));
        added.forEach(c => saveSiniestroToDB(c).catch(()=>{}));
        prevSiniestrosRef.current = siniestros;
    },[siniestros, isLoadingData]);

    useEffect(() => {
        if (isLoadingData) return;
        localStorage.setItem('riskTypes', JSON.stringify(riskTypes));
        const prev = prevRiskTypesRef.current;
        const added = riskTypes.filter(c => !prev.find(p => p.id === c.id) || JSON.stringify(prev.find(p=>p.id===c.id)) !== JSON.stringify(c));
        prev.filter(p => !riskTypes.find(c => c.id === p.id)).forEach(d => deleteRiskTypeFromDB(d.id).catch(()=>{}));
        added.forEach(c => saveRiskTypeToDB(c).catch(()=>{}));
        prevRiskTypesRef.current = riskTypes;
    },[riskTypes, isLoadingData]);

    useEffect(() => {
        if (isLoadingData) return;
        localStorage.setItem('users', JSON.stringify(users));
        const prev = prevUsersRef.current;
        const added = users.filter(c => !prev.find(p => p.id === c.id) || JSON.stringify(prev.find(p=>p.id===c.id)) !== JSON.stringify(c));
        prev.filter(p => !users.find(c => c.id === p.id)).forEach(d => deleteUserFromDB(d.id).catch(()=>{}));
        added.forEach(c => saveUserToDB(c).catch(()=>{}));
        prevUsersRef.current = users;
        
        if (currentUser) {
            const updatedMe = users.find(u => u.id === currentUser.id);
            if (updatedMe && JSON.stringify(updatedMe) !== JSON.stringify(currentUser)) { setCurrentUser(updatedMe); localStorage.setItem('currentUser', JSON.stringify(updatedMe)); }
            else if (!updatedMe) { setCurrentUser(null); localStorage.removeItem('currentUser'); }
        }
        if (currentDriver) {
            const updatedDriver = users.find(u => u.id === currentDriver.id);
            if (updatedDriver && JSON.stringify(updatedDriver) !== JSON.stringify(currentDriver)) { setCurrentDriver(updatedDriver); localStorage.setItem('currentDriver', JSON.stringify(updatedDriver)); }
            else if (!updatedDriver) { setCurrentDriver(null); localStorage.removeItem('currentDriver'); }
        }
    },[users, isLoadingData, currentUser, currentDriver]);

    useEffect(() => { localStorage.setItem('proximityDistance', proximityDistance.toString()); },[proximityDistance]);
    useEffect(() => { localStorage.setItem('driverReportTTL', driverReportTTL.toString()); },[driverReportTTL]);
    useEffect(() => { setIsAddRiskModalOpen(false); setNewRiskPosition(null); setEditingRisk(null); },[activeTab]);

    const handleLogin = useCallback((user: User) => {
        setCurrentUser(user); localStorage.setItem('currentUser', JSON.stringify(user));
        if (user.isAdmin) setActiveTab('routes');
        else if (Array.isArray(user.allowedTabs) && user.allowedTabs.length > 0) setActiveTab(user.allowedTabs[0]);
    },[]);

    const handleLogout = useCallback(() => { setCurrentUser(null); localStorage.removeItem('currentUser'); },[]);

    const findAssociatedRouteIds = useCallback((position: Position): string[] => {
        const associatedIds: string[] =[];
        if (Array.isArray(routes)) routes.forEach(route => { if (route?.geoJson && isPointNearRoute(position, route.geoJson, proximityDistance)) associatedIds.push(route.id); });
        return associatedIds;
    },[routes, proximityDistance]);

    const togglePublicRoute = useCallback((id: string) => setRoutes(prev => prev.map(r => r.id === id ? { ...r, isPublic: !r.isPublic } : r)),[]);
    
    const handleMapClick = useCallback((latlng: LatLng) => {
        const allowedTabs = Array.isArray(currentUser?.allowedTabs) ? currentUser!.allowedTabs :[];
        if (activeTab === 'riskTypes' && allowedTabs.includes('riskTypes')) { setNewRiskPosition({ lat: latlng.lat, lng: latlng.lng }); setIsAddRiskModalOpen(true); }
    }, [activeTab, currentUser]);

    const handleSaveRisk = useCallback((id: string, riskTypeId: string, description: string, images: string[], videoUrl: string, driveUrl: string, isEditing: boolean) => {
        if (isEditing && editingRisk) {
            setRisks(prev => prev.map(r => r.id === id ? { ...r, riskTypeId, description, images: Array.isArray(images) ? images :[], videoUrl, driveUrl, associatedRouteIds: findAssociatedRouteIds(r.position) } : r));
            setEditingRisk(null);
        } else if (newRiskPosition) {
            setRisks(prev =>[...prev, { id, position: newRiskPosition, riskTypeId, description, images: Array.isArray(images) ? images : [], videoUrl, driveUrl, associatedRouteIds: findAssociatedRouteIds(newRiskPosition) }]);
            setIsAddRiskModalOpen(false); setNewRiskPosition(null);
        }
    },[editingRisk, newRiskPosition, findAssociatedRouteIds]);

    const handleDeleteRisk = useCallback((id: string) => { 
        if (!currentUser?.isAdmin) return alert("No tienes permisos.");
        if (window.confirm("¿Está seguro que desea eliminar este reporte?")) setRisks(prev => prev.filter(r => r.id !== id)); 
    },[currentUser]);
   
    // IMPORTANTE: COMPRESOR KML AGRESIVO PARA FIREBASE
    const handleAddRoute = useCallback((name: string, origin: string, destination: string, group: string, line: string, service: string, kmlFile: File) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const rawGeoJson = kml(new DOMParser().parseFromString(event.target?.result as string, 'application/xml')) as any;
                
                const geoJson = {
                    ...rawGeoJson,
                    features: Array.isArray(rawGeoJson.features) ? rawGeoJson.features.map((f: any) => {
                        if (f?.geometry?.type === 'LineString' && Array.isArray(f.geometry.coordinates)) {
                            // 1. LIMITAR CANTIDAD DE PUNTOS (Evita que Firebase explote por peso)
                            let coords = f.geometry.coordinates;
                            if (coords.length > 300) {
                                // Si tiene más de 300 puntos, calculamos un salto para quedarnos solo con 300 distribuidos
                                const step = Math.ceil(coords.length / 300);
                                coords = coords.filter((_: any, index: number) => index % step === 0);
                            }

                            return {
                                ...f,
                                properties: { name: f.properties?.name }, // Borramos propiedades basura
                                geometry: {
                                    ...f.geometry,
                                    // 2. REDONDEAR DECIMALES
                                    coordinates: coords.map((c: any) =>[ Number(Number(c[0]).toFixed(5)), Number(Number(c[1]).toFixed(5)) ])
                                }
                            };
                        }
                        return f;
                    }) :[]
                };

                const newRoute: Route = { id: uuidv4(), name, origin, destination, group, line, service, geoJson, isPublic: false };
                setRoutes(prev =>[...prev, newRoute]);
                setRisks(prevRisks => prevRisks.map(risk => isPointNearRoute(risk.position, geoJson, proximityDistance) ? { ...risk, associatedRouteIds:[...new Set([...(Array.isArray(risk.associatedRouteIds) ? risk.associatedRouteIds : []), newRoute.id])] } : risk));
            } catch (error) { alert("Error al procesar el archivo KML."); }
        };
        reader.readAsText(kmlFile);
    }, [proximityDistance]);
       
    const getRiskType = useCallback((id: string): RiskType | undefined => riskTypes.find(rt => rt.id === id),[riskTypes]);

    // MAP FILTER TTL
    const baseVisibleRisks = useMemo(() => Array.isArray(risks) ? risks.filter(risk => {
        const rt = getRiskType(risk.riskTypeId);
        if (!rt) return false;
        if (rt.isIncident && !showIncidents) return false;
        if (!rt.isIncident && !showRisks) return false;

        if (risk.driverReportDetails && risk.timestamp) {
            const ageInHours = (Date.now() - risk.timestamp) / (1000 * 60 * 60);
            if (ageInHours > driverReportTTL) return false;
        }
        return true;
    }) : [],[risks, getRiskType, showRisks, showIncidents, driverReportTTL]);

    const visibleRoutes = useMemo(() => {
        if (!Array.isArray(routes)) return[];
        if (activeTab === 'routes') return activeRouteId ? routes.filter(r => r.id === activeRouteId) : routes.filter(route => (filterGroup === '' || (route.group||'').toLowerCase().includes(filterGroup.toLowerCase())) && (filterLine === '' || (route.line||'').toLowerCase().includes(filterLine.toLowerCase())) && (filterService === '' || (route.service||'').toLowerCase().includes(filterService.toLowerCase())));
        else if (activeTab === 'reports') return reportSelectedRouteId ? routes.filter(r => r.id === reportSelectedRouteId) :[];
        else if (activeTab === 'riskViewer') {
            const affectedRouteIds = new Set<string>();
            baseVisibleRisks.forEach(risk => { if (Array.isArray(riskViewerSelectedTypes) && riskViewerSelectedTypes.includes(risk.riskTypeId)) (Array.isArray(risk.associatedRouteIds) ? risk.associatedRouteIds :[]).forEach(id => affectedRouteIds.add(id)); });
            return routes.filter(route => affectedRouteIds.has(route.id));
        }
        return routes;
    },[routes, activeTab, filterGroup, filterLine, filterService, activeRouteId, reportSelectedRouteId, riskViewerSelectedTypes, baseVisibleRisks]);

    const visibleRisks = useMemo(() => {
        if (activeTab === 'routes') { const visibleRouteIds = new Set(visibleRoutes.map(r => r.id)); return baseVisibleRisks.filter(risk => (Array.isArray(risk.associatedRouteIds) ? risk.associatedRouteIds :[]).some(id => visibleRouteIds.has(id))); }
        else if (activeTab === 'reports') return reportSelectedRouteId ? baseVisibleRisks.filter(risk => (Array.isArray(risk.associatedRouteIds) ? risk.associatedRouteIds :[]).includes(reportSelectedRouteId)) :[];
        else if (activeTab === 'riskViewer') return (!Array.isArray(riskViewerSelectedTypes) || riskViewerSelectedTypes.length === 0) ?[] : baseVisibleRisks.filter(risk => riskViewerSelectedTypes.includes(risk.riskTypeId));
        return baseVisibleRisks;
    },[baseVisibleRisks, activeTab, visibleRoutes, reportSelectedRouteId, riskViewerSelectedTypes]);

    if (isSiniestroMode) return <SiniestroForm onSaveSiniestro={async (sin) => { setSiniestros(prev => [...prev, sin]); await saveSiniestroToDB(sin); }} />;
    if (isDriverMode) {
        if (isLoadingData) return <div className="flex h-screen bg-gray-900 items-center justify-center text-sky-400 font-bold">Cargando Sistema...</div>;
        if (!currentDriver) return <Login users={users} isDriverMode={true} onLogin={(d) => { setCurrentDriver(d); localStorage.setItem('currentDriver', JSON.stringify(d)); }} />;
        return <DriverApp routes={routes} currentDriver={currentDriver} onLogout={() => { setCurrentDriver(null); localStorage.removeItem('currentDriver'); }} onSaveReport={(newRisk) => setRisks(prev =>[...prev, { ...newRisk, associatedRouteIds: findAssociatedRouteIds(newRisk.position) }])} />;
    }
    if (publicRouteId) {
        if (isLoadingData) return <div className="flex h-screen bg-gray-900 items-center justify-center text-sky-400 font-bold animate-pulse">Cargando recorrido...</div>;
        const publicRoute = Array.isArray(routes) ? routes.find(r => r.id === publicRouteId) : null;
        if (publicRoute && publicRoute.isPublic) return <PublicRouteViewer route={publicRoute} risks={Array.isArray(risks) ? risks.filter(risk => (Array.isArray(risk.associatedRouteIds) ? risk.associatedRouteIds :[]).includes(publicRouteId)) :[]} riskTypes={riskTypes} />;
        return <div className="flex h-screen w-screen items-center justify-center bg-gray-900 text-white flex-col"><AlertCircle size={64} className="text-red-500 mb-4" /><h1 className="text-2xl font-bold mb-2 text-sky-400">Acceso Denegado</h1></div>;
    }
    if (!currentUser && !isLoadingData) return <Login users={users} onLogin={handleLogin} isDriverMode={false} />;
    if (isLoadingData) return <div className="flex h-screen w-screen items-center justify-center bg-gray-900 text-white flex-col"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-sky-500 mb-4"></div><h1 className="text-xl font-bold text-sky-400">Iniciando...</h1></div>;

    return (
        <div className="flex h-screen w-screen bg-gray-100 font-sans">
            <Panel
                currentUser={currentUser!} onLogout={handleLogout} users={users} setUsers={setUsers}
                riskTypes={riskTypes} setRiskTypes={setRiskTypes} routes={routes} setRoutes={setRoutes} 
                risks={risks} setRisks={setRisks} siniestros={siniestros} handleDeleteSiniestro={(id) => { if(window.confirm('¿Borrar?')) setSiniestros(p => p.filter(s=>s.id!==id)); }}
                proximityDistance={proximityDistance} setProximityDistance={setProximityDistance} driverReportTTL={driverReportTTL} setDriverReportTTL={setDriverReportTTL}
                onAddRoute={handleAddRoute} getRiskType={getRiskType} activeTab={activeTab} setActiveTab={setActiveTab}
                showRisks={showRisks} setShowRisks={setShowRisks} showIncidents={showIncidents} setShowIncidents={setShowIncidents}
                filterGroup={filterGroup} setFilterGroup={setFilterGroup} filterLine={filterLine} setFilterLine={setFilterLine} filterService={filterService} setFilterService={setFilterService}
                activeRouteId={activeRouteId} setActiveRouteId={setActiveRouteId} reportSelectedRouteId={reportSelectedRouteId} setReportSelectedRouteId={setReportSelectedRouteId}
                riskViewerSelectedTypes={riskViewerSelectedTypes} setRiskViewerSelectedTypes={setRiskViewerSelectedTypes} togglePublicRoute={togglePublicRoute} handleDeleteRisk={handleDeleteRisk}
                setFocusPosition={setFocusPosition}
            />
            <main className="flex-1 h-full relative">
                 <MapContainer center={SAN_RAFAEL_CENTER} zoom={13} style={{ height: '100%', width: '100%' }} className="z-0">
                    <MapFixer />
                    <MapFocusUpdater focusPosition={focusPosition} />
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
                    <MapBoundsUpdater routes={visibleRoutes} risks={visibleRisks} />
                    {activeTab === 'riskTypes' && (Array.isArray(currentUser?.allowedTabs) ? currentUser!.allowedTabs :[]).includes('riskTypes') && <MapClickHandler onMapClick={handleMapClick} />}

                    {visibleRoutes.map(route => {
                        const path: LatLngExpression[][] =[];
                        if (route?.geoJson && Array.isArray(route.geoJson.features)) {
                            route.geoJson.features.forEach(feature => { 
                                if (feature?.geometry?.type === 'LineString' && Array.isArray(feature.geometry.coordinates)) {
                                    const validSegment = feature.geometry.coordinates.filter((c: any) => Array.isArray(c) && c.length >= 2 && typeof c[0] === 'number' && typeof c[1] === 'number').map((c: any) => [c[1], c[0]] as LatLngExpression);
                                    if (Array.isArray(validSegment) && validSegment.length > 0) path.push(validSegment);
                                }
                            });
                        }
                        if (!Array.isArray(path) || path.length === 0) return null;
                        const opacity = (activeTab === 'routes' || activeTab === 'reports' || activeTab === 'riskViewer') ? 1 : 0.4;
                        return <Polyline key={route.id} positions={path} color="#0284c7" weight={5} opacity={opacity} />;
                    })}

                    {visibleRisks.map(risk => {
                        if (!risk?.position || typeof risk.position.lat !== 'number' || typeof risk.position.lng !== 'number') return null;
                        const riskType = getRiskType(risk.riskTypeId);
                        if (!riskType) return null;
                        const icon = createRiskIcon(riskType.color);
                        const associatedRoutes = routes.filter(r => (Array.isArray(risk.associatedRouteIds) ? risk.associatedRouteIds :[]).includes(r.id));
                       
                        return (
                             <Marker key={risk.id} position={[risk.position.lat, risk.position.lng]} icon={icon}>
                                {activeTab === 'routes' && <Tooltip permanent direction="top" offset={[0, -25]} className="bg-white border border-gray-300 shadow-md font-bold text-xs py-1 px-2 rounded-md" opacity={0.9}>{riskType.name}</Tooltip>}
                                <Popup>
                                    <div className="flex justify-between items-start mb-1 min-w-[250px]">
                                        <div>
                                            <div className="font-bold text-lg leading-tight" style={{ color: riskType.color }}>{risk.driverReportDetails ? risk.driverReportDetails.categoriaIRAM : riskType.name}</div>
                                            <div className="text-[10px] text-gray-500 uppercase tracking-wide">{risk.driverReportDetails ? 'Reporte Conductor' : (riskType.isIncident ? 'Siniestro' : 'Riesgo Vial')}</div>
                                        </div>
                                        {activeTab === 'riskTypes' && (Array.isArray(currentUser?.allowedTabs) ? currentUser!.allowedTabs :[]).includes('riskTypes') && (
                                            <div className="flex gap-1 ml-2">
                                                {!risk.driverReportDetails && <button onClick={() => setEditingRisk(risk)} className="p-1 text-gray-400 hover:text-sky-500"><Edit2 size={14} /></button>}
                                                {currentUser?.isAdmin && <button onClick={() => handleDeleteRisk(risk.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>}
                                            </div>
                                        )}
                                    </div>
                                    {risk.driverReportDetails ? (
                                        <div className="bg-gray-100 rounded-lg p-2 my-2 border border-gray-200">
                                            <div className="grid grid-cols-2 gap-2 text-xs mb-2 pb-2 border-b border-gray-300">
                                                <div className="flex items-center gap-1 text-gray-700 col-span-2 font-bold"><Bus size={12}/> Reportado por: {risk.driverReportDetails.conductorName}</div>
                                                <div className="flex items-center gap-1 text-gray-700"><b>Línea:</b> {risk.driverReportDetails.linea}</div>
                                                <div className="flex items-center gap-1 text-gray-700"><b>U.:</b> {risk.driverReportDetails.unidad}</div>
                                                <div className="flex items-center gap-1 text-gray-700 col-span-2"><Navigation size={12}/> <b>Sentido:</b> {risk.driverReportDetails.sentido}</div>
                                            </div>
                                            <div className="text-xs space-y-1 mb-2">
                                                {risk.driverReportDetails.ubicacionManual && <p><b>Ubicación Manual:</b> {risk.driverReportDetails.ubicacionManual}</p>}
                                                <p className="flex items-center gap-1 text-red-600 font-bold"><ShieldAlert size={12}/> {risk.driverReportDetails.huboDesvio ? 'Desvío Activado' : 'Sin Desvío'}</p>
                                            </div>
                                        </div>
                                    ) : <p className="text-gray-700 text-sm mb-2">{risk.description}</p>}
                                   
                                    <div className="flex gap-2 items-center mb-2">
                                        {Array.isArray(risk.images) && risk.images.length > 0 && risk.images.map((img, idx) => img && <a key={idx} href={img} target="_blank" rel="noreferrer"><img src={img} alt="Adjunto" className="w-10 h-10 object-cover rounded border border-gray-300 hover:border-sky-500" /></a>)}
                                    </div>

                                    {Array.isArray(associatedRoutes) && associatedRoutes.length > 0 && (
                                        <div className="mt-2 pt-2 border-t">
                                            <h4 className="font-semibold text-sm text-gray-800">Recorridos Afectados:</h4>
                                            <ul className="list-disc list-inside text-xs text-gray-600 max-h-24 overflow-y-auto">{associatedRoutes.map(r => <li key={r.id}>{r.name}</li>)}</ul>
                                        </div>
                                    )}
                                </Popup>
                            </Marker>
                        )
                    })}
                    {newRiskPosition && activeTab === 'riskTypes' && (Array.isArray(currentUser?.allowedTabs) ? currentUser!.allowedTabs :[]).includes('riskTypes') && <Circle center={[newRiskPosition.lat, newRiskPosition.lng]} radius={proximityDistance} color="#fb923c" fillOpacity={0.2} />}
                </MapContainer>
            </main>
           
            {isAddRiskModalOpen && newRiskPosition && <RiskModal riskTypes={riskTypes} onClose={() => setIsAddRiskModalOpen(false)} onSave={(...args) => handleSaveRisk(uuidv4(), ...args, false)} />}
            {editingRisk && <RiskModal riskTypes={riskTypes} editingRisk={editingRisk} onClose={() => setEditingRisk(null)} onSave={(...args) => handleSaveRisk(editingRisk.id, ...args, true)} />}
        </div>
    );
};
export default App;