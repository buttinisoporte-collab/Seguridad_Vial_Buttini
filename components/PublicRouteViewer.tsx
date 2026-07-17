import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, Tooltip, CircleMarker } from 'react-leaflet';
import L, { LatLngExpression, Icon } from 'leaflet';
import type { Route, Risk, RiskType, Position } from '../types';
import { Bus } from 'lucide-react';

const UserLocation = () => {
    const[pos, setPos] = useState<Position | null>(null);
    const map = useMap();
    useEffect(() => {
        const watchId = navigator.geolocation.watchPosition(
            (p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
            () => {}, { enableHighAccuracy: true }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    },[]);
    return pos ? (
        <>
            <CircleMarker center={[pos.lat, pos.lng]} radius={10} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.8 }}>
                <Tooltip permanent direction="top">Mi Ubicación</Tooltip>
            </CircleMarker>
            <CircleMarker center={[pos.lat, pos.lng]} radius={25} pathOptions={{ color: '#3b82f6', weight: 1, fillOpacity: 0.1, dashArray: '5, 5' }} />
        </>
    ) : null;
};

const createRiskIcon = (color: string) => {
    const iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="30" height="30"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
    return new Icon({ iconUrl: `data:image/svg+xml;base64,${btoa(iconHtml)}`, iconSize:[30, 30], iconAnchor:[15, 30], popupAnchor:[0, -30] });
};

export const PublicRouteViewer: React.FC<{ route: Route, risks: Risk[], riskTypes: RiskType[], groupColors: Record<string, string> }> = ({ route, risks, riskTypes, groupColors }) => {
    const path: LatLngExpression[] =[];
    if (route.geoJson?.features) {
        route.geoJson.features.forEach(f => { 
            if (f?.geometry?.type === 'LineString') {
                f.geometry.coordinates.forEach(c => {
                    if(Array.isArray(c) && c.length >= 2) path.push([c[1], c[0]]);
                });
            } 
        });
    }

    const safeRisks = risks.filter(risk => {
        const type = riskTypes.find(rt => rt.id === risk.riskTypeId);
        return type && !type.isIncident; 
    });

    let routeColor = groupColors[route.group] || "#0284c7";

    return (
        <div className="h-screen w-screen relative overflow-hidden">
            <div className="absolute top-3 left-3 right-3 z-[1000] pointer-events-none">
                <div className="bg-gray-900/90 backdrop-blur-md text-white p-3 rounded-2xl shadow-2xl border border-white/10 pointer-events-auto">
                    <div className="flex items-center justify-between">
                        <div className="min-w-0">
                            <h2 className="text-sm font-bold truncate leading-tight">{route.name}</h2>
                            <p className="text-[10px] text-sky-400 font-mono mt-0.5">G:{route.group} L:{route.line} S:{route.service}</p>
                        </div>
                        <div className="bg-sky-500/20 p-2 rounded-lg ml-3 flex-shrink-0 border border-sky-500/30">
                            <Bus size={18} className="text-sky-400" />
                        </div>
                    </div>
                </div>
            </div>

            <MapContainer center={[-34.6175, -68.335]} zoom={13} zoomControl={false} style={{ height: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <UserLocation />
                
                <Polyline positions={path} color={routeColor} weight={6} opacity={0.8} lineJoin="round" />
                
                {safeRisks.map(risk => {
                    const rt = riskTypes.find(t => t.id === risk.riskTypeId);
                    if (!rt) return null;
                    return (
                        <Marker key={risk.id} position={[risk.position.lat, risk.position.lng]} icon={createRiskIcon(rt.color)}>
                            {/* TOOLTIP PERMANENTE SIN CONDICIONES */}
                            <Tooltip permanent direction="top" offset={[0, -25]} className="bg-white/90 border border-gray-300 shadow-md font-bold text-[10px] py-1 px-2 rounded-md" opacity={0.9}>{rt.name}</Tooltip>
                            <Popup className="custom-popup">
                                <div className="p-1 max-w-[200px]">
                                    <p className="font-bold text-sky-600 mb-1">{rt.name}</p>
                                    <p className="text-xs text-gray-600 leading-tight">{risk.description}</p>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
};