import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap, Tooltip } from 'react-leaflet';
import L, { LatLngExpression, LatLng, Icon } from 'leaflet';
import * as turf from '@turf/turf'; 
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
} from './lib/supabase';

const SAN_RAFAEL_CENTER: LatLngExpression =[-34.6175, -68.335];

const createRiskIcon = (color: string) => {
    return new Icon({ iconUrl: `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32" height="32"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`)}`, iconSize:[32, 32], iconAnchor:[16, 32], popupAnchor:[0, -32] });
};

const MapFixer = () => {
    const map = useMap();
    useEffect(() => { const timer = setTimeout(() => map.invalidateSize(), 300); return () => clearTimeout(timer); }, [map]);
    return null;
}

const MapFocusUpdater = ({ focusPosition }: { focusPosition: Position | null }) => {
    const map = useMap();
    useEffect(() => { if (focusPosition) map.flyTo([focusPosition.lat, focusPosition.lng], 18, { animate: true }); }, [focusPosition, map]);
    return null;
};

const isPointNearRoute = (position: Position, geoJson: RouteGeoJSON, distanceThreshold: number): boolean => {
    if (!geoJson || !Array.isArray(geoJson.features) || !position || typeof position.lat !== 'number' || typeof position.lng !== 'number') return false;
    try {
        const riskPoint = turf.point([position.lng, position.lat]);
        const features = geoJson.features.filter((f): f is GeoJSONFeature<GeoJSONLineString> => f?.geometry?.type === 'LineString' && Array.isArray(f.geometry?.coordinates));
        for (const feature of features) {
            const validCoords = feature.geometry.coordinates.filter(c => Array.isArray(c) && c.length >= 2 && typeof c[0] === 'number' && typeof c[1] === 'number');
            if (validCoords.length >= 2) {
                const line = turf.lineString(validCoords as[number, number][]);
                if (turf.pointToLineDistance(riskPoint, line, { units: 'meters' }) <= distanceThreshold) return true;
            }
        }
    } catch (e) { console.warn("Cálculo omitido por geometría inválida."); }
    return false;
};

const MapBoundsUpdater: React.FC<{ routes: Route[], risks: Risk[], siniestros?: Siniestro[], activeTab?: string, focusPosition?: Position | null }> = ({ routes, risks, siniestros, activeTab, focusPosition }) => {
    const map = useMap();
    useEffect(() => {
        if (focusPosition) return;
        const points: LatLngExpression[] =[];
        if (Array.isArray(routes)) routes.forEach(r => { if (r?.geoJson?.features && Array.isArray(r.geoJson.features)) r.geoJson.features.forEach(f => { if (f?.geometry?.type === 'LineString' && Array.isArray(f.geometry.coordinates)) f.geometry.coordinates.forEach(c => { if (Array.isArray(c) && c.length>=2) points.push([c[1], c[0]]); }); }); });
        if (Array.isArray(risks)) risks.forEach(r => { if (r?.position?.lat && r?.position?.lng) points.push([r.position.lat, r.position.lng]); });
        if ((activeTab === 'siniestros' || activeTab === 'seguimiento') && Array.isArray(siniestros)) { siniestros.forEach(s => { if (s?.ubicacion?.lat && s?.ubicacion?.lng) points.push([s.ubicacion.lat, s.ubicacion.lng]); }); }
        if (Array.isArray(points) && points.length > 0) map.fitBounds(L.latLngBounds(points), { padding:[50, 50], maxZoom: 15 });
        else map.setView(SAN_RAFAEL_CENTER, 13);
    },[routes, risks, siniestros, activeTab, map, focusPosition]);
    return null;
};

const App: React.FC = () => {
    const[isLoadingData, setIsLoadingData] = useState(true);
    const[currentUser, setCurrentUser] = useState<User | null>(() => { const s = localStorage.getItem('currentUser'); return s ? JSON.parse(s) : null; });
    const[currentDriver, setCurrentDriver] = useState<User | null>(() => { const s = localStorage.getItem('currentDriver'); return s ? JSON.parse(s) : null; });

    const[activeTab, setActiveTab] = useState<AppTab>('routes');
    const[showRisks, setShowRisks] = useState(true);
    const[showIncidents, setShowIncidents] = useState(true);
    const[filterGroup, setFilterGroup] = useState('');
    const[filterLine, setFilterLine] = useState('');
    const[filterService, setFilterService] = useState('');
    const[activeRouteId, setActiveRouteId] = useState<string | null>(null);
    const[reportSelectedRouteId, setReportSelectedRouteId] = useState<string>('');
    const[riskViewerSelectedTypes, setRiskViewerSelectedTypes] = useState<string[]>([]);
    const[relocatingSiniestroId, setRelocatingSiniestroId] = useState<string | null>(null);
    const[focusPosition, setFocusPosition] = useState<Position | null>(null);

    const[users, setUsers] = useState<User[]>([]);
    const[riskTypes, setRiskTypes] = useState<RiskType[]>([]);
    const[routes, setRoutes] = useState<Route[]>([]);
    const[risks, setRisks] = useState<Risk[]>([]);
    const[siniestros, setSiniestros] = useState<Siniestro[]>([]);
    const[companyLogo, setCompanyLogo] = useState<string>(() => localStorage.getItem('companyLogo') || '');
    
    const[proximityDistance, setProximityDistance] = useState<number>(() => Number(localStorage.getItem('proximityDistance')) || 50);
    const[showAllRoutes, setShowAllRoutes] = useState(true); 
    const[showRiskViewerRoutes, setShowRiskViewerRoutes] = useState(false);
    const[driverReportTTL, setDriverReportTTL] = useState<number>(() => Number(localStorage.getItem('driverReportTTL')) || 12);
    
    const[telegramToken, setTelegramToken] = useState(() => localStorage.getItem('tg_token') || '');
    const[telegramChatId, setTelegramChatId] = useState(() => localStorage.getItem('tg_chat') || '');
    const[groupColors, setGroupColors] = useState<Record<string, string>>(() => JSON.parse(localStorage.getItem('groupColors') || '{}'));

    const[novedadesFilterDate, setNovedadesFilterDate] = useState('');
    const[novedadesFilterLine, setNovedadesFilterLine] = useState('');
    const[showNovedadesRoutes, setShowNovedadesRoutes] = useState(true);
    const[showRiskTypesRoutes, setShowRiskTypesRoutes] = useState(true);
    const[selectedSiniestroId, setSelectedSiniestroId] = useState<string | null>(null);

    // NUEVOS FILTROS GLOBALES PARA MAPA DE SINIESTROS/SEGUIMIENTO
    const[eventosFilterYear, setEventosFilterYear] = useState(new Date().getFullYear().toString());
    const[eventosFilterMonth, setEventosFilterMonth] = useState('');
    const[eventosFilterTipo, setEventosFilterTipo] = useState('');

    useEffect(() => { localStorage.setItem('tg_token', telegramToken); },[telegramToken]);
    useEffect(() => { localStorage.setItem('tg_chat', telegramChatId); },[telegramChatId]);
    useEffect(() => { localStorage.setItem('groupColors', JSON.stringify(groupColors)); },[groupColors]);
    useEffect(() => { localStorage.setItem('companyLogo', companyLogo); },[companyLogo]);

    const[isAddRiskModalOpen, setIsAddRiskModalOpen] = useState<boolean>(false);
    const[editingRisk, setEditingRisk] = useState<Risk | null>(null);
    const[newRiskPosition, setNewRiskPosition] = useState<Position | null>(null);

    const[isAddSiniestroModalOpen, setIsAddSiniestroModalOpen] = useState<boolean>(false);
    const[isHidingSiniestroModalForMap, setIsHidingSiniestroModalForMap] = useState<boolean>(false);
    const[newSiniestroPosition, setNewSiniestroPosition] = useState<Position | null>(null);

    const prevRoutesRef = useRef<Route[]>([]);
    const prevRisksRef = useRef<Risk[]>([]);
    const prevRiskTypesRef = useRef<RiskType[]>([]);
    const prevUsersRef = useRef<User[]>([]);
    const prevSiniestrosRef = useRef<Siniestro[]>([]);

    const urlParams = new URLSearchParams(window.location.search);
    const rawPublicRouteId = urlParams.get('publicRoute');
    const publicRouteId = rawPublicRouteId ? rawPublicRouteId.replace(/[^a-zA-Z0-9-]/g, '') : null;
    const expireParam = urlParams.get('expire');
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
                    if (!dbRiskTypes.find(rt => rt.id === 'incidente-ruta')) { const incType = { id: 'incidente-ruta', name: 'Incidente en Ruta', color: '#000000', isIncident: true }; dbRiskTypes.push(incType); saveRiskTypeToDB(incType).catch(()=>{}); }
                    if (!dbRiskTypes.find(rt => rt.id === 'novedad-ruta')) { const novType = { id: 'novedad-ruta', name: 'Novedad en Ruta', color: '#000000', isIncident: false }; dbRiskTypes.push(novType); saveRiskTypeToDB(novType).catch(()=>{}); }
                    setRiskTypes(dbRiskTypes); prevRiskTypesRef.current = dbRiskTypes; 
                } else {
                    const defaultTypes: RiskType[] =[{ id: 'incidente-ruta', name: 'Incidente en Ruta', color: '#000000', isIncident: true }, { id: 'novedad-ruta', name: 'Novedad en Ruta', color: '#000000', isIncident: false }, { id: '1', name: 'Escuela', color: '#3b82f6', isIncident: false }];
                    setRiskTypes(defaultTypes); defaultTypes.forEach(t => saveRiskTypeToDB(t).catch(()=>{})); prevRiskTypesRef.current = defaultTypes;
                }

                if (Array.isArray(dbUsers) && dbUsers.length > 0) { setUsers(dbUsers); prevUsersRef.current = dbUsers; } 
                else {
                    const defaultAdmin: User = { id: uuidv4(), name: 'Administrador Principal', username: 'admin', pin: '1234', isAdmin: true, allowedTabs:['routes', 'riskTypes', 'reports', 'riskViewer', 'settings', 'users', 'novedades', 'siniestros', 'seguimiento'] };
                    setUsers([defaultAdmin]); saveUserToDB(defaultAdmin).catch(()=>{}); prevUsersRef.current =[defaultAdmin];
                }
            } catch (err) {
                console.warn("Usando Modo Local.", err);
                setRoutes(Array.isArray(JSON.parse(localStorage.getItem('routes') || '[]')) ? JSON.parse(localStorage.getItem('routes') || '[]') :[]);
                setRisks(Array.isArray(JSON.parse(localStorage.getItem('risks') || '[]')) ? JSON.parse(localStorage.getItem('risks') || '[]') :[]);
                setSiniestros(Array.isArray(JSON.parse(localStorage.getItem('siniestros') || '[]')) ? JSON.parse(localStorage.getItem('siniestros') || '[]') :[]);
                const localTypes = JSON.parse(localStorage.getItem('riskTypes') || '[]'); if(Array.isArray(localTypes) && localTypes.length > 0) setRiskTypes(localTypes);
            } finally { setIsLoadingData(false); }
        };
        initData();
    },[]);

    // Sincronizaciones DB
    useEffect(() => {
        if (isLoadingData) return;
        localStorage.setItem('routes', JSON.stringify(routes));
        const prev = prevRoutesRef.current;
        const deleted = prev.filter(p => !routes.find(c => c.id === p.id)); // <-- Línea restaurada
        const added = routes.filter(c => !prev.find(p => p.id === c.id) || JSON.stringify(prev.find(p=>p.id===c.id)) !== JSON.stringify(c));
        deleted.forEach(d => deleteRouteFromDB(d.id).catch(()=>{})); // <-- Línea restaurada
        added.forEach(c => saveRouteToDB(c).catch(()=>{}));
        prevRoutesRef.current = routes;
    },[routes, isLoadingData]);

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
        localStorage.setItem('siniestros', JSON.stringify(siniestros));
        const prev = prevSiniestrosRef.current;
        const deleted = prev.filter(p => !siniestros.find(c => c.id === p.id));
        const added = siniestros.filter(c => !prev.find(p => p.id === c.id) || JSON.stringify(prev.find(p=>p.id===c.id)) !== JSON.stringify(c));
        deleted.forEach(d => deleteSiniestroFromDB(d.id).catch(()=>{}));
        added.forEach(c => saveSiniestroToDB(c).catch(()=>{}));
        prevSiniestrosRef.current = siniestros;
    },[siniestros, isLoadingData]);

    useEffect(() => {
        if (isLoadingData) return;
        localStorage.setItem('riskTypes', JSON.stringify(riskTypes));
        const prev = prevRiskTypesRef.current;
        const deleted = prev.filter(p => !riskTypes.find(c => c.id === p.id));
        const added = riskTypes.filter(c => !prev.find(p => p.id === c.id) || JSON.stringify(prev.find(p=>p.id===c.id)) !== JSON.stringify(c));
        deleted.forEach(d => deleteRiskTypeFromDB(d.id).catch(()=>{}));
        added.forEach(c => saveRiskTypeToDB(c).catch(()=>{}));
        prevRiskTypesRef.current = riskTypes;
    },[riskTypes, isLoadingData]);

    useEffect(() => {
        if (isLoadingData) return;
        localStorage.setItem('users', JSON.stringify(users));
        const prev = prevUsersRef.current;
        const deleted = prev.filter(p => !users.find(c => c.id === p.id));
        const added = users.filter(c => !prev.find(p => p.id === c.id) || JSON.stringify(prev.find(p=>p.id===c.id)) !== JSON.stringify(c));
        deleted.forEach(d => deleteUserFromDB(d.id).catch(()=>{}));
        added.forEach(c => saveUserToDB(c).catch(()=>{}));
        prevUsersRef.current = users;
        
        if (currentUser) {
            const updatedMe = users.find(u => u.id === currentUser.id);
            if (updatedMe && JSON.stringify(updatedMe) !== JSON.stringify(currentUser)) { setCurrentUser(updatedMe); localStorage.setItem('currentUser', JSON.stringify(updatedMe)); }
            else if (!updatedMe) { setCurrentUser(null); localStorage.removeItem('currentUser'); }
        }
    },[users, isLoadingData, currentUser]);

    useEffect(() => { setIsAddRiskModalOpen(false); setNewRiskPosition(null); setEditingRisk(null); setIsAddSiniestroModalOpen(false); setNewSiniestroPosition(null); },[activeTab]);

    const handleLogin = useCallback((user: User) => { setCurrentUser(user); localStorage.setItem('currentUser', JSON.stringify(user)); if (user.isAdmin) setActiveTab('routes'); else if (Array.isArray(user.allowedTabs) && user.allowedTabs.length > 0) setActiveTab(user.allowedTabs[0]); },[]);
    const handleLogout = useCallback(() => { setCurrentUser(null); localStorage.removeItem('currentUser'); },[]);

    const findAssociatedRouteIds = useCallback((position: Position): string[] => {
        const associatedIds: string[] =[];
        if (Array.isArray(routes)) routes.forEach(route => { if (route?.geoJson && isPointNearRoute(position, route.geoJson, proximityDistance)) associatedIds.push(route.id); });
        return associatedIds;
    },[routes, proximityDistance]);

    const incidentRisks = useMemo(() => Array.isArray(risks) ? risks.filter(r => { const rt = Array.isArray(riskTypes) ? riskTypes.find(t => t.id === r.riskTypeId) : undefined; return rt && rt.isIncident && !r.driverReportDetails; }) : [], [risks, riskTypes]);

    const sendTelegramNotification = async (risk: Risk) => { /* Código Telegram */ };
    const sendSiniestroTelegramNotification = async (siniestro: Siniestro) => { /* Código Telegram Siniestros */ };

    const handleDriverSave = useCallback((newRisk: Risk) => {
        const riskType = Array.isArray(riskTypes) ? (riskTypes.find(rt => rt.id === 'novedad-ruta') || riskTypes.find(rt => !rt.isIncident) || riskTypes[0]) : undefined;
        const finalizedRisk = { ...newRisk, riskTypeId: riskType?.id || '1', associatedRouteIds: findAssociatedRouteIds(newRisk.position), isVisibleOnMap: true };
        setRisks(prev =>[...prev, finalizedRisk]);
        sendTelegramNotification(finalizedRisk);
    },[riskTypes, findAssociatedRouteIds]);

    const togglePublicRoute = useCallback((id: string) => setRoutes(prev => prev.map(r => r.id === id ? { ...r, isPublic: !r.isPublic } : r)),[]);
    
    const handleMapClick = useCallback((latlng: LatLng) => { 
        const hasTabAccess = (tab: AppTab) => currentUser?.isAdmin || (Array.isArray(currentUser?.allowedTabs) && currentUser!.allowedTabs.includes(tab));

        if (relocatingSiniestroId) {
            const targetSin = siniestros.find(s => s.id === relocatingSiniestroId);
            if (targetSin) {
                const updatedSin = { ...targetSin, ubicacion: { ...targetSin.ubicacion, lat: latlng.lat, lng: latlng.lng } };
                setSiniestros(prev => prev.map(s => s.id === updatedSin.id ? updatedSin : s));
                saveSiniestroToDB(updatedSin).catch(()=>{}); setRelocatingSiniestroId(null); setFocusPosition({ lat: latlng.lat, lng: latlng.lng });
                return;
            }
            const targetRisk = risks.find(r => r.id === relocatingSiniestroId);
            if (targetRisk) {
                const updatedRisk = { ...targetRisk, position: { lat: latlng.lat, lng: latlng.lng } };
                setRisks(prev => prev.map(r => r.id === updatedRisk.id ? updatedRisk : r));
                saveRiskToDB(updatedRisk).catch(()=>{}); setRelocatingSiniestroId(null); setFocusPosition({ lat: latlng.lat, lng: latlng.lng });
                return;
            }
            setRelocatingSiniestroId(null); return;
        }

        if (activeTab === 'riskTypes' && hasTabAccess('riskTypes')) { setNewRiskPosition({ lat: latlng.lat, lng: latlng.lng }); setIsAddRiskModalOpen(true); } 
        else if (activeTab === 'siniestros' && hasTabAccess('siniestros')) { setNewSiniestroPosition({ lat: latlng.lat, lng: latlng.lng }); setIsAddSiniestroModalOpen(true); setIsHidingSiniestroModalForMap(false); }
    },[activeTab, currentUser, relocatingSiniestroId, siniestros, risks]);

    const handleSaveRisk = useCallback((id: string, riskTypeId: string, description: string, images: string[], videoUrl: string, driveUrl: string, isEditing: boolean) => {
        if (isEditing && editingRisk) { setRisks(prev => prev.map(r => r.id === id ? { ...r, riskTypeId, description, images: Array.isArray(images) ? images :[], videoUrl, driveUrl, associatedRouteIds: findAssociatedRouteIds(r.position) } : r)); setEditingRisk(null); } 
        else if (newRiskPosition) { setRisks(prev =>[...prev, { id, position: newRiskPosition, riskTypeId, description, images: Array.isArray(images) ? images : [], videoUrl, driveUrl, associatedRouteIds: findAssociatedRouteIds(newRiskPosition) }]); setIsAddRiskModalOpen(false); setNewRiskPosition(null); }
    },[editingRisk, newRiskPosition, findAssociatedRouteIds]);

    const handleDeleteRisk = useCallback((id: string) => { 
        if (!currentUser?.isAdmin && !(currentUser?.allowedTabs||[]).includes('riskTypes')) return alert("No tienes permisos.");
        if (window.confirm("¿Eliminar este reporte?")) setRisks(prev => prev.filter(r => r.id !== id)); 
    },[currentUser]);
   
    const handleAddRoute = useCallback((name: string, origin: string, destination: string, group: string, line: string, service: string, kmlFile: File) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const rawGeoJson = kml(new DOMParser().parseFromString(event.target?.result as string, 'application/xml')) as any;
                const lineFeatures = Array.isArray(rawGeoJson.features) ? rawGeoJson.features.filter((f: any) => f?.geometry?.type === 'LineString' || f?.geometry?.type === 'MultiLineString') :[];
                const cleanFeatures = lineFeatures.map((f: any) => ({ type: 'Feature', properties: { name }, geometry: f.geometry }));
                const simplifiedGeoJson = turf.simplify({ type: 'FeatureCollection', features: cleanFeatures } as any, { tolerance: 0.0001, highQuality: false });
                const finalGeoJson = turf.truncate(simplifiedGeoJson, { precision: 5, coordinates: 2 });
                const newRoute: Route = { id: uuidv4(), name, origin, destination, group, line, service, geoJson: finalGeoJson as any, isPublic: false };
                setRoutes(prev =>[...prev, newRoute]);
                setRisks(prevRisks => prevRisks.map(risk => isPointNearRoute(risk.position, finalGeoJson as any, proximityDistance) ? { ...risk, associatedRouteIds:[...new Set([...(Array.isArray(risk.associatedRouteIds) ? risk.associatedRouteIds : []), newRoute.id])] } : risk));
            } catch (error) { alert("Error al procesar el KML."); }
        };
        reader.readAsText(kmlFile);
    }, [proximityDistance]);
   
    const getRiskType = useCallback((id: string): RiskType | undefined => Array.isArray(riskTypes) ? riskTypes.find(rt => rt.id === id) : undefined,[riskTypes]);

    const baseVisibleRisks = useMemo(() => Array.isArray(risks) ? risks.filter(risk => {
        const rt = getRiskType(risk.riskTypeId);
        if (!rt || risk.isVisibleOnMap === false || activeTab === 'siniestros' || activeTab === 'seguimiento') return false; 
        if (activeTab === 'novedades') {
            if (!risk.driverReportDetails) return false;
            if (novedadesFilterLine && !risk.driverReportDetails.linea.toLowerCase().includes(novedadesFilterLine.toLowerCase())) return false;
            if (novedadesFilterDate && risk.timestamp && new Date(risk.timestamp).toISOString().split('T')[0] !== novedadesFilterDate) return false;
            return true;
        }
        if (activeTab === 'routes') { if (rt.isIncident && !showIncidents) return false; if (!rt.isIncident && !showRisks) return false; }
        if (risk.driverReportDetails && risk.timestamp && ((Date.now() - risk.timestamp) / 3600000) > driverReportTTL) return false;
        return true;
    }) : [],[risks, getRiskType, showRisks, showIncidents, driverReportTTL, activeTab, novedadesFilterLine, novedadesFilterDate]);

    // MAPEO EXCLUSIVO PARA EL MAPA DE SINIESTROS E INCIDENTES
    const visibleSiniestros = useMemo(() => {
        if (activeTab !== 'siniestros' && activeTab !== 'seguimiento') return [];
        let list = Array.isArray(siniestros) ? siniestros : [];
        if (eventosFilterYear) {
            list = list.filter(item => {
                const itemDate = new Date(item.fechaHora || item.timestamp);
                const yearMatch = itemDate.getFullYear().toString() === eventosFilterYear;
                if (!eventosFilterMonth) return yearMatch;
                return yearMatch && (itemDate.getMonth() + 1).toString() === eventosFilterMonth;
            });
        }
        if (eventosFilterTipo) {
            list = list.filter(item => (item.tipoEvento || 'Siniestro') === eventosFilterTipo);
        }
        return list;
    }, [siniestros, activeTab, eventosFilterYear, eventosFilterMonth, eventosFilterTipo]);

    const visibleRoutes = useMemo(() => {
        if (!Array.isArray(routes)) return[];
        if (activeTab === 'routes') {
            if (!showAllRoutes) return[];
            return activeRouteId ? routes.filter(r => r.id === activeRouteId) : routes.filter(route => (filterGroup === '' || (route.group||'').toLowerCase().includes(filterGroup.toLowerCase())) && (filterLine === '' || (route.line||'').toLowerCase().includes(filterLine.toLowerCase())) && (filterService === '' || (route.service||'').toLowerCase().includes(filterService.toLowerCase())));
        } 
        else if (activeTab === 'reports') { return reportSelectedRouteId ? routes.filter(r => r.id === reportSelectedRouteId) :[]; } 
        else if (activeTab === 'riskViewer') {
            if (!showRiskViewerRoutes) return[];
            const affectedRouteIds = new Set<string>();
            baseVisibleRisks.forEach(risk => { if (Array.isArray(riskViewerSelectedTypes) && riskViewerSelectedTypes.includes(risk.riskTypeId)) (Array.isArray(risk.associatedRouteIds) ? risk.associatedRouteIds :[]).forEach(id => affectedRouteIds.add(id)); });
            return routes.filter(route => affectedRouteIds.has(route.id) && (!filterLine || route.line === filterLine) && (!filterService || route.service === filterService));
        }
        else if (activeTab === 'novedades') {
            if (!showNovedadesRoutes) return[];
            const affectedRouteIds = new Set<string>();
            baseVisibleRisks.forEach(risk => { (Array.isArray(risk.associatedRouteIds) ? risk.associatedRouteIds :[]).forEach(id => affectedRouteIds.add(id)); });
            return routes.filter(route => affectedRouteIds.has(route.id));
        }
        else if (activeTab === 'riskTypes') return showRiskTypesRoutes ? routes : [];
        else if (activeTab === 'siniestros' || activeTab === 'seguimiento') {
            if (!selectedSiniestroId) return[];
            const sin = Array.isArray(siniestros) ? siniestros.find(s => s.id === selectedSiniestroId) : undefined;
            const manualRisk = Array.isArray(risks) ? risks.find(r => r.id === selectedSiniestroId) : undefined;
            if (sin) {
                if ((sin as any).associatedRouteId) return routes.filter(r => r.id === (sin as any).associatedRouteId);
                return routes.filter(r => r.line === sin.conductor?.linea);
            }
            if (manualRisk) return routes.filter(r => (Array.isArray(manualRisk.associatedRouteIds) ? manualRisk.associatedRouteIds :[]).includes(r.id));
            return[];
        }
        return routes;
    },[routes, activeTab, filterGroup, filterLine, filterService, activeRouteId, reportSelectedRouteId, riskViewerSelectedTypes, baseVisibleRisks, showAllRoutes, showNovedadesRoutes, selectedSiniestroId, siniestros, showRiskViewerRoutes, risks]);

    const visibleRisks = useMemo(() => {
        const safeVisibleRoutes = Array.isArray(visibleRoutes) ? visibleRoutes :[];
        if (activeTab === 'routes') { const visibleRouteIds = new Set(safeVisibleRoutes.map(r => r.id)); return baseVisibleRisks.filter(risk => (Array.isArray(risk.associatedRouteIds) ? risk.associatedRouteIds :[]).some(id => visibleRouteIds.has(id))); }
        else if (activeTab === 'reports') return reportSelectedRouteId ? baseVisibleRisks.filter(risk => (Array.isArray(risk.associatedRouteIds) ? risk.associatedRouteIds :[]).includes(reportSelectedRouteId)) :[];
        else if (activeTab === 'riskViewer') return (!Array.isArray(riskViewerSelectedTypes) || riskViewerSelectedTypes.length === 0) ?[] : baseVisibleRisks.filter(risk => riskViewerSelectedTypes.includes(risk.riskTypeId));
        return baseVisibleRisks;
    },[baseVisibleRisks, activeTab, visibleRoutes, reportSelectedRouteId, riskViewerSelectedTypes]);

    if (isSiniestroMode) return <SiniestroForm onSaveSiniestro={async (sin) => { setSiniestros(prev =>[...prev, sin]); await saveSiniestroToDB(sin); sendSiniestroTelegramNotification(sin); }} />;
    if (isDriverMode) return (!currentDriver && !isLoadingData) ? <Login users={users} isDriverMode={true} onLogin={(d) => { setCurrentDriver(d); localStorage.setItem('currentDriver', JSON.stringify(d)); }} /> : (currentDriver ? <DriverApp routes={routes} currentDriver={currentDriver} onLogout={() => { setCurrentDriver(null); localStorage.removeItem('currentDriver'); }} onSaveReport={handleDriverSave}/> : <div className="flex h-screen bg-gray-900 items-center justify-center text-sky-400 font-bold">Cargando...</div>);
    if (publicRouteId) return (expireParam && Date.now() > Number(expireParam)) ? <div className="flex h-screen w-screen items-center justify-center bg-gray-900 text-white flex-col"><AlertCircle size={64} className="text-red-500 mb-4" /><h1 className="text-2xl font-bold mb-2 text-sky-400">Enlace Expirado</h1></div> : (isLoadingData ? <div className="flex h-screen w-screen items-center justify-center bg-gray-900 text-sky-400 font-bold animate-pulse text-xl">Cargando mapa público...</div> : ((routes.find(r => r.id === publicRouteId) && (routes.find(r => r.id === publicRouteId)?.isPublic || expireParam)) ? <PublicRouteViewer route={routes.find(r => r.id === publicRouteId)!} risks={Array.isArray(risks)?risks.filter(risk=>(Array.isArray(risk.associatedRouteIds)?risk.associatedRouteIds:[]).includes(publicRouteId)):[]} riskTypes={riskTypes} groupColors={groupColors} /> : <div className="flex h-screen w-screen items-center justify-center bg-gray-900 text-white flex-col"><AlertCircle size={64} className="text-red-500 mb-4" /><h1 className="text-2xl font-bold mb-2 text-sky-400">Acceso Denegado</h1></div>));

    if (!currentUser && !isLoadingData) return <Login users={users} onLogin={handleLogin} isDriverMode={false} />;
    if (isLoadingData) return <div className="flex h-screen w-screen items-center justify-center bg-gray-900 text-white flex-col"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-sky-500 mb-4"></div><h1 className="text-xl font-bold text-sky-400">Iniciando Sistema Seguro...</h1></div>;

    return (
        <div className="flex flex-col h-screen w-screen bg-slate-100 font-sans overflow-hidden">
            <Panel
                currentUser={currentUser!} onLogout={handleLogout} users={users} setUsers={setUsers}
                riskTypes={riskTypes} setRiskTypes={setRiskTypes} routes={routes} setRoutes={setRoutes} 
                risks={risks} setRisks={setRisks} siniestros={siniestros} incidentRisks={incidentRisks} handleDeleteSiniestro={(id) => { if(window.confirm('¿Borrar?')) setSiniestros(p => p.filter(s=>s.id!==id)); }}
                proximityDistance={proximityDistance} setProximityDistance={setProximityDistance} driverReportTTL={driverReportTTL} setDriverReportTTL={setDriverReportTTL}
                onAddRoute={handleAddRoute} getRiskType={getRiskType} activeTab={activeTab} setActiveTab={setActiveTab}
                showRisks={showRisks} setShowRisks={setShowRisks} showIncidents={showIncidents} setShowIncidents={setShowIncidents}
                filterGroup={filterGroup} setFilterGroup={setFilterGroup} filterLine={filterLine} setFilterLine={setFilterLine} filterService={filterService} setFilterService={setFilterService}
                activeRouteId={activeRouteId} setActiveRouteId={setActiveRouteId} reportSelectedRouteId={reportSelectedRouteId} setReportSelectedRouteId={setReportSelectedRouteId}
                riskViewerSelectedTypes={riskViewerSelectedTypes} setRiskViewerSelectedTypes={setRiskViewerSelectedTypes} togglePublicRoute={togglePublicRoute} handleDeleteRisk={handleDeleteRisk}
                setFocusPosition={setFocusPosition} showAllRoutes={showAllRoutes} setShowAllRoutes={setShowAllRoutes}
                telegramToken={telegramToken} setTelegramToken={setTelegramToken} telegramChatId={telegramChatId} setTelegramChatId={setTelegramChatId}
                onUpdateRisk={(updatedRisk) => { setRisks(prev => prev.map(r => r.id === updatedRisk.id ? updatedRisk : r)); }}
                onUpdateSiniestro={(updatedSin) => { setSiniestros(prev => prev.map(s => s.id === updatedSin.id ? updatedSin : s)); }}
                groupColors={groupColors} setGroupColors={setGroupColors}
                novedadesFilterDate={novedadesFilterDate} setNovedadesFilterDate={setNovedadesFilterDate}
                companyLogo={companyLogo} setCompanyLogo={setCompanyLogo}
                novedadesFilterLine={novedadesFilterLine} setNovedadesFilterLine={setNovedadesFilterLine}
                showNovedadesRoutes={showNovedadesRoutes} setShowNovedadesRoutes={setShowNovedadesRoutes}
                showRiskTypesRoutes={showRiskTypesRoutes} setShowRiskTypesRoutes={setShowRiskTypesRoutes}
                selectedSiniestroId={selectedSiniestroId} setSelectedSiniestroId={setSelectedSiniestroId}
                showRiskViewerRoutes={showRiskViewerRoutes} setShowRiskViewerRoutes={setShowRiskViewerRoutes}
                onAddNewSiniestro={() => setIsAddSiniestroModalOpen(true)}
                relocatingSiniestroId={relocatingSiniestroId} setRelocatingSiniestroId={setRelocatingSiniestroId}
                eventosFilterYear={eventosFilterYear} setEventosFilterYear={setEventosFilterYear}
                eventosFilterMonth={eventosFilterMonth} setEventosFilterMonth={setEventosFilterMonth}
                eventosFilterTipo={eventosFilterTipo} setEventosFilterTipo={setEventosFilterTipo}
            >
                <MapContainer center={SAN_RAFAEL_CENTER} zoom={13} style={{ height: '100%', width: '100%' }} className="z-0">
                    <MapFixer />
                    <MapFocusUpdater focusPosition={focusPosition} />
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
                    <MapBoundsUpdater routes={visibleRoutes} risks={visibleRisks} siniestros={visibleSiniestros} activeTab={activeTab} focusPosition={focusPosition} />
                    {(activeTab === 'riskTypes' || activeTab === 'siniestros') && (currentUser?.isAdmin || (Array.isArray(currentUser?.allowedTabs) && currentUser.allowedTabs.includes(activeTab))) && <MapClickHandler onMapClick={handleMapClick} />}

                    {Array.isArray(visibleRoutes) && visibleRoutes.map(route => {
                        const path: LatLngExpression[][] =[];
                        if (route?.geoJson && Array.isArray(route.geoJson.features)) {
                            route.geoJson.features.forEach(feature => { 
                                if (feature?.geometry?.type === 'LineString' && Array.isArray(feature.geometry.coordinates)) {
                                    const validSegment = feature.geometry.coordinates.filter((c: any) => Array.isArray(c) && c.length >= 2 && typeof c[0] === 'number' && typeof c[1] === 'number').map((c: any) => [c[1], c[0]] as LatLngExpression);
                                    if (validSegment.length > 0) path.push(validSegment);
                                }
                            });
                        }
                        if (path.length === 0) return null;
                        const opacity = (activeTab === 'routes' || activeTab === 'reports' || activeTab === 'riskViewer' || activeTab === 'novedades' || activeTab === 'siniestros' || activeTab === 'seguimiento') ? 1 : 0.4;
                        let routeColor = groupColors[route.group] || "#0284c7"; 
                        return <Polyline key={route.id} positions={path} color={routeColor} weight={5} opacity={opacity} />;
                    })}

                    {Array.isArray(visibleRisks) && visibleRisks.map(risk => {
                        if (!risk?.position || typeof risk.position.lat !== 'number' || typeof risk.position.lng !== 'number') return null;
                        const riskType = getRiskType(risk.riskTypeId);
                        if (!riskType) return null;
                        const icon = createRiskIcon(riskType.color);
                        const associatedRoutes = Array.isArray(routes) ? routes.filter(r => (Array.isArray(risk.associatedRouteIds) ? risk.associatedRouteIds :[]).includes(r.id)) :[];
                       
                        return (
                             <Marker key={risk.id} position={[risk.position.lat, risk.position.lng]} icon={icon}>
                                <Tooltip permanent direction="top" offset={[0, -25]} className="bg-white/90 border border-gray-300 shadow-md font-bold text-[10px] py-1 px-2 rounded-md" opacity={0.9}>{riskType.name}</Tooltip>
                                <Popup>
                                    <div className="flex justify-between items-start mb-1 min-w-[250px]">
                                        <div>
                                            <div className="font-bold text-lg leading-tight" style={{ color: riskType.color }}>{risk.driverReportDetails ? risk.driverReportDetails.categoriaIRAM : riskType.name}</div>
                                            <div className="text-[10px] text-gray-500 uppercase tracking-wide">{risk.driverReportDetails ? 'Reporte Conductor' : (riskType.isIncident ? 'Siniestro' : 'Riesgo Vial')}</div>
                                        </div>
                                        {activeTab === 'riskTypes' && (Array.isArray(currentUser?.allowedTabs) ? currentUser!.allowedTabs :[]).includes('riskTypes') && (
                                            <div className="flex gap-1 ml-2">
                                                {!risk.driverReportDetails && <button onClick={() => setEditingRisk(risk)} className="p-1 text-gray-400 hover:text-sky-500"><Edit2 size={14} /></button>}
                                                <button onClick={() => handleDeleteRisk(risk.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
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
                                        </div>
                                    ) : <p className="text-gray-700 text-sm mb-2">{risk.description}</p>}
                                </Popup>
                            </Marker>
                        )
                    })}

                    {/* MARCADORES PARA LOS SINIESTROS/INCIDENTES IRAM */}
                    {(activeTab === 'siniestros' || activeTab === 'seguimiento') && visibleSiniestros.map(sin => {
                        if (!sin.ubicacion?.lat || !sin.ubicacion?.lng) return null;
                        
                        const isIncidente = sin.tipoEvento === 'Incidente';
                        const iconColor = isIncidente ? '#eab308' : '#ef4444'; // Amarillo vs Rojo
                        const badgeColor = isIncidente ? 'bg-yellow-600' : 'bg-red-600';
                        const textColor = isIncidente ? 'text-yellow-500' : 'text-red-600';
                        const icon = createRiskIcon(iconColor); 

                        return (
                            <Marker 
                                key={`iram-${sin.id}`} 
                                position={[sin.ubicacion.lat, sin.ubicacion.lng]} 
                                icon={icon}
                                eventHandlers={{ click: () => setSelectedSiniestroId(selectedSiniestroId === sin.id ? null : sin.id) }}
                            >
                                <Tooltip permanent direction="top" offset={[0, -25]} className={`${badgeColor} text-white border-0 shadow-md font-bold text-[10px] py-1 px-2 rounded-md`} opacity={1}>
                                    {isIncidente ? 'Incidente' : 'Siniestro'}
                                </Tooltip>
                                <Popup>
                                    <div className="min-w-[250px]">
                                        <div className={`font-bold text-lg leading-tight ${textColor}`}>Reporte de {isIncidente ? 'Incidente' : 'Siniestro'}</div>
                                        <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">{new Date(sin.fechaHora).toLocaleString('es-AR')}</div>
                                        
                                        <div className="bg-gray-100 rounded-lg p-2 my-2 border border-gray-200">
                                            <p className="text-xs text-gray-800"><b>Línea:</b> {sin.conductor?.linea} | <b>Interno:</b> {sin.conductor?.interno}</p>
                                            <p className="text-xs text-gray-800"><b>Conductor:</b> {sin.conductor?.nombre}</p>
                                            <p className="text-xs text-gray-800 mt-1"><b>Tipo:</b> {sin.descripcion?.tipo}</p>
                                            <p className={`text-xs font-bold ${textColor}`}>Gravedad: {sin.descripcion?.gravedad}</p>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}
                </MapContainer>

                {(isAddRiskModalOpen || editingRisk) && <RiskModal riskTypes={riskTypes} onClose={() => { setIsAddRiskModalOpen(false); setNewRiskPosition(null); setEditingRisk(null); }} onSave={(typeId, desc, imgs, vid, drive) => { handleSaveRisk(editingRisk ? editingRisk.id : uuidv4(), typeId, desc, imgs, vid, drive, !!editingRisk); }} editingRisk={editingRisk || undefined} />}
                
                {isAddSiniestroModalOpen && (
                    <div className={`fixed inset-0 bg-black/80 z-[9999] flex items-start justify-center overflow-y-auto p-4 sm:p-6 ${isHidingSiniestroModalForMap ? 'hidden' : ''}`}>
                        <div className="relative w-full max-w-lg my-4 bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-700">
                            <SiniestroForm isModal={true} initialPosition={newSiniestroPosition || undefined} onCancel={() => { setIsAddSiniestroModalOpen(false); setNewSiniestroPosition(null); setIsHidingSiniestroModalForMap(false); }} onRequestMapSelect={() => setIsHidingSiniestroModalForMap(true)} onSaveSiniestro={async (sin) => { setSiniestros(prev =>[...prev, sin]); await saveSiniestroToDB(sin); sendSiniestroTelegramNotification(sin); setIsAddSiniestroModalOpen(false); setNewSiniestroPosition(null); }} />
                        </div>
                    </div>
                )}
            </Panel>    
        </div>
    );
};
export default App;