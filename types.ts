export type AppTab = 'routes' | 'riskTypes' | 'reports' | 'riskViewer' | 'novedades' | 'settings' | 'users';

export interface Position {
    lat: number;
    lng: number;
}

export interface RiskType {
    id: string;
    name: string;
    color: string;
    isIncident: boolean;
}

export interface DriverReportDetails {
    unidad: string;
    linea: string;
    sentido: string;
    categoriaIRAM: string;
    huboDesvio: boolean;
    rutaAlternativa?: string;
    velocidadSugerida?: string;
    carrilRecomendado?: string;
    ubicacionManual?: string;
    conductorName?: string;
}

export interface Risk {
    id: string;
    position: Position;
    riskTypeId: string;
    description: string;
    associatedRouteIds: string[];
    images: string[];
    videoUrl?: string;
    driveUrl?: string;
    driverReportDetails?: DriverReportDetails;
    timestamp?: number; // NUEVO: Para saber cuándo caduca
}

export interface GeoJSONFeature<T> {
    type: "Feature";
    properties: any;
    geometry: T;
}

export interface GeoJSONLineString {
    type: "LineString";
    coordinates:[number, number][];
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
    isPublic?: boolean;
}

export interface User {
    id: string;
    name: string;
    username: string;
    pin: string;
    isAdmin: boolean;
    isDriver?: boolean;
    allowedTabs: AppTab[];
}