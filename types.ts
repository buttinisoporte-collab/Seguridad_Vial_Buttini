export type AppTab = 'routes' | 'riskTypes' | 'reports' | 'riskViewer' | 'settings' | 'users';

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
    conductorName?: string; // NUEVO: Registra quién hizo el reporte
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
    username: string; // Para el conductor este será el "Legajo"
    pin: string;
    isAdmin: boolean;
    isDriver?: boolean; // NUEVO: Determina si el usuario es un chofer
    allowedTabs: AppTab[];
}