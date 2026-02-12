
export interface Position {
    lat: number;
    lng: number;
}

export interface RiskType {
    id: string;
    name: string;
    color: string;
}

export interface Risk {
    id: string;
    position: Position;
    riskTypeId: string;
    description: string;
    associatedRouteIds: string[];
}

export interface Route {
    id: string;
    name: string;
    origin: string;
    destination: string;
    // FIX: Changed GeoJSON.FeatureCollection to GeoJSONFeatureCollection to use the type defined in this file.
    geoJson: GeoJSONFeatureCollection | null;
}

// Simplified GeoJSON types for our use case
export interface GeoJSONPoint {
    type: 'Point';
    coordinates: [number, number];
}

export interface GeoJSONLineString {
    type: 'LineString';
    coordinates: [number, number][];
}

export interface GeoJSONFeature<T extends GeoJSONPoint | GeoJSONLineString> {
    type: 'Feature';
    geometry: T;
    properties: Record<string, any>;
}

export interface GeoJSONFeatureCollection {
    type: 'FeatureCollection';
    features: GeoJSONFeature<any>[];
}