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
        if (activeTab === 'siniestros' && Array.isArray(siniestros)) { siniestros.forEach(s => { if (s?.ubicacion?.lat && s?.ubicacion?.lng) points.push([s.ubicacion.lat, s.ubicacion.lng]); }); }
        if (Array.isArray(points) && points.length > 0) map.fitBounds(L.latLngBounds(points), { padding:[50, 50], maxZoom: 15 });
        else map.setView(SAN_RAFAEL_CENTER, 13);
    },[routes, risks, siniestros, activeTab, map, focusPosition]);
    return null;
};

const App: React.FC = () => {
    // =========================================================================
    // DETECCIÓN DE PARÁMETROS DE URL (FUERA DE TODO CONDICIONAL)
    // =========================================================================
    const getParam = (name: string) => {
        const urlParams = new URLSearchParams(window.location.search);
        let val = urlParams.get(name);
        // Si URLSearchParams falla, buscamos manualmente en la cadena por si hay errores de formato
        if (!val) {
            const regex = new RegExp(`[?&]${name}=([^&#]*)`, 'i');
            const match = window.location.href.match(regex);
            val = match ? match[1] : null;
        }
        return val ? val.trim().replace(/[^a-zA-Z0-9-]/g, '') : null;
    };

    const publicRouteId = getParam('publicRoute');
    const isSiniestroMode = getParam('mode') === 'siniestro';
    const isDriverMode = getParam('mode') === 'driver';
    const expireParam = getParam('expire');

    // =========================================================================
    // ESTADOS
    // =========================================================================
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

    useEffect(() => {
        const initData = async () => {
            setIsLoadingData(true);
            try {
                const[dbRoutes, dbRisks, dbRiskTypes, dbUsers, dbSiniestros] = await Promise.all([ 
                    loadRoutesFromDB(), loadRisksFromDB(), loadRiskTypesFromDB(), loadUsersFromDB(), loadSiniestrosFromDB() 
                ]);
                
                setRoutes(Array.isArray(dbRoutes) ? dbRoutes :[]); prevRoutesRef.current = Array.isArray(dbRoutes) ? dbRoutes :[];
                setRisks(Array.isArray(dbRisks) ? dbRisks :[]); prevRisksRef.current = Array.isArray(dbRisks) ? dbRisks :[];
                setSiniestros(Array.isArray(dbSiniestros) ? dbSiniestros :[]); prevSiniestrosRef.current = Array.isArray(dbSiniestros) ? dbSiniestros :[];
                setRiskTypes(Array.isArray(dbRiskTypes) ? dbRiskTypes : []); prevRiskTypesRef.current = Array.isArray(dbRiskTypes) ? dbRiskTypes : [];
                setUsers(Array.isArray(dbUsers) ? dbUsers : []); prevUsersRef.current = Array.isArray(dbUsers) ? dbUsers : [];

                if (dbUsers.length === 0) {
                     const defaultAdmin: User = { id: uuidv4(), name: 'Administrador Principal', username: 'admin', pin: '1234', isAdmin: true, allowedTabs:['routes', 'riskTypes', 'reports', 'riskViewer', 'settings', 'users', 'novedades', 'siniestros'] };
                     setUsers([defaultAdmin]);
                }
            } catch (err) {
                console.error("Error cargando BD:", err);
            } finally { 
                setIsLoadingData(false); 
            }
        };
        initData();
    },[]);

    // Sincronizaciones DB y LocalStorage (Efectos Simplificados)
    useEffect(() => { if (!isLoadingData) localStorage.setItem('routes', JSON.stringify(routes)); }, [routes, isLoadingData]);
    useEffect(() => { if (!isLoadingData) localStorage.setItem('risks', JSON.stringify(risks)); }, [risks, isLoadingData]);
    useEffect(() => { if (!isLoadingData) localStorage.setItem('siniestros', JSON.stringify(siniestros)); }, [siniestros, isLoadingData]);
    useEffect(() => { if (!isLoadingData) localStorage.setItem('users', JSON.stringify(users)); }, [users, isLoadingData]);
    
    const handleLogin = (user: User) => {
        setCurrentUser(user); localStorage.setItem('currentUser', JSON.stringify(user));
        if (user.isAdmin) setActiveTab('routes');
        else if (user.allowedTabs?.length) setActiveTab(user.allowedTabs[0] as AppTab);
    };

    const handleLogout = () => { setCurrentUser(null); localStorage.removeItem('currentUser'); };

    const findAssociatedRouteIds = useCallback((position: Position): string[] => {
        const associatedIds: string[] =[];
        if (Array.isArray(routes)) routes.forEach(route => { if (route?.geoJson && isPointNearRoute(position, route.geoJson, proximityDistance)) associatedIds.push(route.id); });
        return associatedIds;
    },[routes, proximityDistance]);

    const getRiskType = (id: string): RiskType | undefined => riskTypes.find(rt => rt.id === id);

    const baseVisibleRisks = useMemo(() => risks.filter(risk => {
        const rt = getRiskType(risk.riskTypeId);
        if (!rt || risk.isVisibleOnMap === false) return false;
        if (activeTab === 'siniestros') return false; 
        if (risk.driverReportDetails && risk.timestamp && ((Date.now() - risk.timestamp) / 3600000) > driverReportTTL) return false;
        return true;
    }),[risks, riskTypes, activeTab, driverReportTTL]);

    const visibleRoutes = useMemo(() => routes, [routes]); // Simplificado para el mapa principal
    const visibleRisks = useMemo(() => baseVisibleRisks, [baseVisibleRisks]);

    // =================================================================================
    // RENDERIZADO CONDICIONAL (EL ORDEN ES VITAL)
    // =================================================================================

    // 1. SI ES UNA RUTA PÚBLICA (No requiere Login)
    if (publicRouteId) {
        if (expireParam && Date.now() > Number(expireParam)) {
            return <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-900 text-white"><AlertCircle size={60} className="text-red-500 mb-4"/><h1 className="text-xl font-bold">Enlace Expirado</h1></div>;
        }

        if (isLoadingData) {
            return <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-sky-400 font-bold animate-pulse">Cargando mapa público...</div>;
        }

        const route = routes.find(r => r.id === publicRouteId);
        // IMPORTANTE: Permitimos verla si es isPublic O si viene con token de expiración (Telegram)
        if (route && (route.isPublic || expireParam)) {
            const routeRisks = risks.filter(risk => risk.associatedRouteIds?.includes(publicRouteId));
            return <PublicRouteViewer route={route} risks={routeRisks} riskTypes={riskTypes} groupColors={groupColors} />;
        }

        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-900 text-white p-6 text-center">
                <AlertCircle size={60} className="text-red-500 mb-4"/>
                <h1 className="text-xl font-bold text-sky-400 mb-2">Acceso Denegado</h1>
                <p className="text-gray-400 text-sm">El recorrido solicitado no existe o es privado.</p>
                {routes.length === 0 && <p className="mt-4 text-[10px] text-red-400">Error: No se pudo conectar con la base de datos para validar la ruta.</p>}
            </div>
        );
    }

    // 2. MODOS ESPECIALES (Siniestro / Conductor)
    if (isSiniestroMode) {
        return <SiniestroForm onSaveSiniestro={async (sin) => { setSiniestros(p => [...p, sin]); await saveSiniestroToDB(sin); }} />;
    }

    if (isDriverMode) {
        if (isLoadingData) return <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-sky-400 font-bold">Cargando...</div>;
        if (!currentDriver) return <Login users={users} isDriverMode={true} onLogin={(d) => { setCurrentDriver(d); localStorage.setItem('currentDriver', JSON.stringify(d)); }} />;
        return <DriverApp routes={routes} currentDriver={currentDriver} onLogout={() => { setCurrentDriver(null); localStorage.removeItem('currentDriver'); }} onSaveReport={(r) => setRisks(p => [...p, r])} />;
    }

    // 3. SI NO ES NADA DE LO ANTERIOR, RECIÉN AQUÍ PEDIMOS LOGIN
    if (!currentUser && !isLoadingData) {
        return <Login users={users} onLogin={handleLogin} isDriverMode={false} />;
    }

    // 4. PANTALLA DE CARGA GENERAL
    if (isLoadingData) {
        return <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-sky-400 font-bold">Iniciando Sistema...</div>;
    }

    // 5. INTERFAZ DE ADMINISTRACIÓN (PANEL)
    return (
        <div className="flex flex-col h-screen w-screen bg-slate-100 overflow-hidden">
            <Panel
                currentUser={currentUser!} onLogout={handleLogout} users={users} setUsers={setUsers}
                riskTypes={riskTypes} setRiskTypes={setRiskTypes} routes={routes} setRoutes={setRoutes} 
                risks={risks} setRisks={setRisks} siniestros={siniestros} incidentRisks={[]} 
                handleDeleteSiniestro={(id) => setSiniestros(p => p.filter(s=>s.id!==id))}
                proximityDistance={proximityDistance} setProximityDistance={setProximityDistance} 
                driverReportTTL={driverReportTTL} setDriverReportTTL={setDriverReportTTL}
                onAddRoute={() => {}} getRiskType={getRiskType} activeTab={activeTab} setActiveTab={setActiveTab}
                showRisks={showRisks} setShowRisks={setShowRisks} showIncidents={showIncidents} setShowIncidents={setShowIncidents}
                filterGroup={filterGroup} setFilterGroup={setFilterGroup} filterLine={filterLine} setFilterLine={setFilterLine} filterService={filterService} setFilterService={setFilterService}
                activeRouteId={activeRouteId} setActiveRouteId={setActiveRouteId} reportSelectedRouteId={reportSelectedRouteId} setReportSelectedRouteId={setReportSelectedRouteId}
                riskViewerSelectedTypes={[]} setRiskViewerSelectedTypes={() => {}} togglePublicRoute={togglePublicRoute} 
                handleDeleteRisk={(id) => setRisks(p => p.filter(r=>r.id!==id))}
                setFocusPosition={setFocusPosition} showAllRoutes={showAllRoutes} setShowAllRoutes={setShowAllRoutes}
                telegramToken={telegramToken} setTelegramToken={setTelegramToken} telegramChatId={telegramChatId} setTelegramChatId={setTelegramChatId}
                onUpdateRisk={() => {}} onUpdateSiniestro={() => {}}
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
            >
                <MapContainer center={SAN_RAFAEL_CENTER} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <MapFixer />
                    <MapFocusUpdater focusPosition={focusPosition} />
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <MapBoundsUpdater routes={visibleRoutes} risks={visibleRisks} siniestros={siniestros} activeTab={activeTab} focusPosition={focusPosition} />
                    
                    {visibleRoutes.map(route => (
                        <Polyline key={route.id} positions={[]} color={groupColors[route.group] || "#3b82f6"} weight={5} />
                    ))}

                    {visibleRisks.map(risk => {
                        const icon = createRiskIcon(getRiskType(risk.riskTypeId)?.color || "#000");
                        return <Marker key={risk.id} position={[risk.position.lat, risk.position.lng]} icon={icon} />
                    })}
                </MapContainer>
            </Panel>    
        </div>
    );
};
export default App;