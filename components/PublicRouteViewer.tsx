import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, Tooltip } from 'react-leaflet';
import L, { LatLngExpression, Icon } from 'leaflet';
import type { Route, Risk, RiskType } from '../types';
import { Folder, Video, AlertTriangle } from 'lucide-react';

interface PublicRouteViewerProps {
    route: Route;
    risks: Risk[];
    riskTypes: RiskType[];
}

const createRiskIcon = (color: string) => {
    const iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32" height="32"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
    return new Icon({
        iconUrl: `data:image/svg+xml;base64,${btoa(iconHtml)}`,
        iconSize:[32, 32],
        iconAnchor: [16, 32],
        popupAnchor:[0, -32]
    });
};

const MapBoundsUpdater: React.FC<{ route: Route, risks: Risk[] }> = ({ route, risks }) => {
    const map = useMap();
    useEffect(() => {
        const points: LatLngExpression[] =[];
        if (route.geoJson) {
            route.geoJson.features.forEach(feature => {
                if (feature.geometry.type === 'LineString') {
                    feature.geometry.coordinates.forEach(([lng, lat]) => points.push([lat, lng]));
                }
            });
        }
        risks.forEach(risk => points.push([risk.position.lat, risk.position.lng]));

        if (points.length > 0) {
            const bounds = L.latLngBounds(points);
            map.fitBounds(bounds, { padding:[50, 50], maxZoom: 15 });
        }
    },[route, risks, map]);
    return null;
};

export const PublicRouteViewer: React.FC<PublicRouteViewerProps> = ({ route, risks, riskTypes }) => {
    const path: LatLngExpression[] =[];
    if (route.geoJson) {
        route.geoJson.features.forEach(feature => {
            if (feature.geometry.type === 'LineString') {
                feature.geometry.coordinates.forEach(([lng, lat]) => path.push([lat, lng]));
            }
        });
    }

    const getRiskType = (id: string): RiskType | undefined => riskTypes.find(rt => rt.id === id);

    return (
        <div className="flex flex-col h-screen w-screen bg-gray-100 font-sans relative">
            {/* Header / Info Panel */}
            <div className="absolute top-4 left-4 z-[1000] bg-gray-800 text-white p-4 rounded-lg shadow-xl border border-gray-600 max-w-sm">
                <div className="flex items-center gap-2 mb-2 border-b border-gray-600 pb-2">
                    <AlertTriangle className="text-yellow-400" size={24} />
                    <h1 className="text-lg font-bold text-sky-400">Mapa de Riesgo Vial</h1>
                </div>
                <h2 className="text-xl font-bold">{route.name}</h2>
                <div className="flex gap-2 text-[11px] text-sky-300 font-mono uppercase mb-2">
                    <span>G: {route.group}</span><span>L: {route.line}</span><span>S: {route.service}</span>
                </div>
                <p className="text-sm text-gray-300 font-medium">📍 {route.origin}</p>
                <p className="text-sm text-gray-300 font-medium mb-2">🏁 {route.destination}</p>
                <div className="mt-3 pt-3 border-t border-gray-600">
                    <p className="text-xs text-gray-400">Modo Solo Lectura - Uso exclusivo para conductores.</p>
                </div>
            </div>

            <main className="flex-1 h-full relative z-0">
                 <MapContainer center={[-34.6175, -68.335]} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
                    <MapBoundsUpdater route={route} risks={risks} />

                    <Polyline positions={path} color="#0284c7" weight={6} opacity={0.8} />

                    {risks.map(risk => {
                        const riskType = getRiskType(risk.riskTypeId);
                        if (!riskType) return null;
                        const icon = createRiskIcon(riskType.color);
                        
                        return (
                             <Marker key={risk.id} position={[risk.position.lat, risk.position.lng]} icon={icon}>
                                <Tooltip permanent direction="top" offset={[0, -25]} className="bg-white border border-gray-300 shadow-md font-bold text-xs py-1 px-2 rounded-md" opacity={0.9}>
                                    {riskType.name}
                                </Tooltip>
                                <Popup>
                                    <div className="min-w-[200px]">
                                        <div className="font-bold text-lg leading-tight" style={{ color: riskType.color }}>{riskType.name}</div>
                                        <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">{riskType.isIncident ? 'Siniestro' : 'Riesgo Vial'}</div>
                                        <p className="text-gray-700 text-sm mb-3">{risk.description}</p>
                                        
                                        {/* Media Adjunta en modo lectura */}
                                        <div className="flex gap-2 items-center flex-wrap">
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
                                    </div>
                                </Popup>
                            </Marker>
                        )
                    })}
                </MapContainer>
            </main>
        </div>
    );
};