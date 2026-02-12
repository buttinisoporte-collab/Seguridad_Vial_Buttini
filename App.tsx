
import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, Circle } from 'react-leaflet';
import { LatLngExpression, LatLng, Icon } from 'leaflet';
import { pointToLineDistance } from '@turf/turf';
import { kml } from '@tmcw/togeojson';
import { v4 as uuidv4 } from 'uuid';

import type { Route, Risk, RiskType, Position, GeoJSONFeature, GeoJSONLineString } from './types';
import { Panel } from './components/Panel';
import { AddRiskModal } from './components/AddRiskModal';
import { MapClickHandler } from './components/MapClickHandler';

// Default map center: San Rafael, Mendoza, Argentina
const SAN_RAFAEL_CENTER: LatLngExpression = [-34.6175, -68.335];

const createRiskIcon = (color: string) => {
    const iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32" height="32"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
    return new Icon({
        iconUrl: `data:image/svg+xml;base64,${btoa(iconHtml)}`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
};


const App: React.FC = () => {
    const [riskTypes, setRiskTypes] = useState<RiskType[]>(() => {
        const saved = localStorage.getItem('riskTypes');
        return saved ? JSON.parse(saved) : [
            { id: '1', name: 'Escuela', color: '#3b82f6' },
            { id: '2', name: 'Hospital', color: '#ef4444' },
            { id: '3', name: 'Cruce Peligroso', color: '#f97316' },
            { id: '4', name: 'Contingencia Climática', color: '#8b5cf6' },
            { id: '5', name: 'Accidente Histórico', color: '#eab308' },
        ];
    });
    
    const [routes, setRoutes] = useState<Route[]>(() => JSON.parse(localStorage.getItem('routes') || '[]'));
    const [risks, setRisks] = useState<Risk[]>(() => JSON.parse(localStorage.getItem('risks') || '[]'));
    const [proximityDistance, setProximityDistance] = useState<number>(() => Number(localStorage.getItem('proximityDistance')) || 50); // in meters
    const [isAddRiskModalOpen, setIsAddRiskModalOpen] = useState<boolean>(false);
    const [newRiskPosition, setNewRiskPosition] = useState<Position | null>(null);

    useEffect(() => {
        localStorage.setItem('riskTypes', JSON.stringify(riskTypes));
    }, [riskTypes]);

    useEffect(() => {
        localStorage.setItem('routes', JSON.stringify(routes));
    }, [routes]);

    useEffect(() => {
        localStorage.setItem('risks', JSON.stringify(risks));
    }, [risks]);

    useEffect(() => {
        localStorage.setItem('proximityDistance', proximityDistance.toString());
    }, [proximityDistance]);
    
    const findAssociatedRouteIds = useCallback((position: Position): string[] => {
        const associatedIds: string[] = [];
        const riskPoint = [position.lng, position.lat];

        routes.forEach(route => {
            if (route.geoJson) {
                const features = route.geoJson.features.filter(
                    (feature): feature is GeoJSONFeature<GeoJSONLineString> => feature.geometry.type === 'LineString'
                );

                for (const feature of features) {
                    const distance = pointToLineDistance(riskPoint, feature.geometry.coordinates, { units: 'meters' });
                    if (distance <= proximityDistance) {
                        associatedIds.push(route.id);
                        break; // A route is associated if any of its segments are close
                    }
                }
            }
        });
        return associatedIds;
    }, [routes, proximityDistance]);
    
    const handleMapClick = (latlng: LatLng) => {
        setNewRiskPosition({ lat: latlng.lat, lng: latlng.lng });
        setIsAddRiskModalOpen(true);
    };

    const handleAddRisk = (riskTypeId: string, description: string) => {
        if (newRiskPosition && riskTypeId) {
            const newRisk: Risk = {
                id: uuidv4(),
                position: newRiskPosition,
                riskTypeId: riskTypeId,
                description,
                associatedRouteIds: findAssociatedRouteIds(newRiskPosition),
            };
            setRisks(prev => [...prev, newRisk]);
            setIsAddRiskModalOpen(false);
            setNewRiskPosition(null);
        }
    };
    
    const handleAddRoute = (name: string, origin: string, destination: string, kmlFile: File) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const kmlContent = event.target?.result as string;
                const dom = new DOMParser().parseFromString(kmlContent, 'application/xml');
                const geoJson = kml(dom);

                const newRoute: Route = {
                    id: uuidv4(),
                    name,
                    origin,
                    destination,
                    geoJson,
                };
                setRoutes(prev => [...prev, newRoute]);
                
                // After adding a new route, check existing risks
                setRisks(prevRisks => prevRisks.map(risk => ({
                    ...risk,
                    associatedRouteIds: findAssociatedRouteIds(risk.position)
                })));

            } catch (error) {
                console.error("Error parsing KML file:", error);
                alert("Error al procesar el archivo KML. Por favor, asegúrese de que sea un archivo válido.");
            }
        };
        reader.readAsText(kmlFile);
    };
    
    const getRiskType = (id: string): RiskType | undefined => riskTypes.find(rt => rt.id === id);

    return (
        <div className="flex h-screen w-screen bg-gray-100 font-sans">
            <Panel
                riskTypes={riskTypes}
                setRiskTypes={setRiskTypes}
                routes={routes}
                setRoutes={setRoutes}
                risks={risks}
                setRisks={setRisks}
                proximityDistance={proximityDistance}
                setProximityDistance={setProximityDistance}
                onAddRoute={handleAddRoute}
                getRiskType={getRiskType}
            />
            <main className="flex-1 h-full relative">
                 <MapContainer center={SAN_RAFAEL_CENTER} zoom={13} style={{ height: '100%', width: '100%' }} className="z-0">
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    
                    <MapClickHandler onMapClick={handleMapClick} />

                    {routes.map(route => {
                        const path: LatLngExpression[][] = [];
                        if (route.geoJson) {
                            route.geoJson.features.forEach(feature => {
                                if (feature.geometry.type === 'LineString') {
                                    path.push(feature.geometry.coordinates.map(([lng, lat]) => [lat, lng]));
                                }
                            });
                        }
                        return <Polyline key={route.id} positions={path} color="#0284c7" weight={5} />;
                    })}

                    {risks.map(risk => {
                        const riskType = getRiskType(risk.riskTypeId);
                        if (!riskType) return null;
                        
                        const icon = createRiskIcon(riskType.color);
                        
                        const associatedRoutes = routes.filter(r => risk.associatedRouteIds.includes(r.id));
                        
                        return (
                             <Marker key={risk.id} position={[risk.position.lat, risk.position.lng]} icon={icon}>
                                <Popup>
                                    <div className="font-bold text-lg" style={{ color: riskType.color }}>{riskType.name}</div>
                                    <p className="text-gray-700">{risk.description}</p>
                                    {associatedRoutes.length > 0 && (
                                        <div className="mt-2 pt-2 border-t">
                                            <h4 className="font-semibold text-sm text-gray-800">Recorridos Afectados:</h4>
                                            <ul className="list-disc list-inside text-xs text-gray-600">
                                                {associatedRoutes.map(r => <li key={r.id}>{r.name}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                </Popup>
                            </Marker>
                        )
                    })}
                    
                    {newRiskPosition && (
                         <Circle center={[newRiskPosition.lat, newRiskPosition.lng]} radius={proximityDistance} color="#fb923c" fillOpacity={0.2} />
                    )}

                </MapContainer>
            </main>
            
            {isAddRiskModalOpen && newRiskPosition && (
                <AddRiskModal
                    riskTypes={riskTypes}
                    onClose={() => setIsAddRiskModalOpen(false)}
                    onAddRisk={handleAddRisk}
                />
            )}
        </div>
    );
};

export default App;