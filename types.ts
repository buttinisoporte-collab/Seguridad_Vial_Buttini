export interface Position {
    lat: number;
    lng: number;
}

export interface RiskType {
    id: string;
    name: string;
    color: string;
    isIncident: boolean; // NUEVO: Para distinguir riesgo de siniestro
}

export interface Risk {
    id: string;
    position: Position;
    riskTypeId: string;
    description: string;
    associatedRouteIds: string[];
    // NUEVO: Multimedia
    images: string[];
    videoUrl?: string;
    driveUrl?: string;
}

export interface GeoJSONFeature<T> {
    type: "Feature";
    properties: any;
    geometry: T;
}

export interface GeoJSONLineString {
    type: "LineString";
    coordinates: [number, number][]; // [lng, lat]
}

export interface GeoJSONGeometryCollection {
    type: "GeometryCollection";
    geometries: any[];
}

export interface RouteGeoJSON {
    type: "FeatureCollection";
    features: GeoJSONFeature<GeoJSONLineString | GeoJSONGeometryCollection>[];
}

export interface Route {
    id: string;
    name: string;
    origin: string;
    destination: string;
    group: string;
    line: string;
    service: string;
    geoJson: RouteGeoJSON;
}