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

// NUEVO: Estructura IRAM 3810
export interface DriverReportDetails {
    unidad: string;
    linea: string;
    sentido: string; // 'Ascendente' | 'Descendente' | 'Ambos'
    categoriaIRAM: string;
    huboDesvio: boolean;
    rutaAlternativa?: string;
    velocidadSugerida?: string;
    carrilRecomendado?: string;
    ubicacionManual?: string; // Por si falla el GPS
}

export interface Risk {
    id: string;
    position: Position;
    riskTypeId: string; // Se mapeará al tipo más cercano en tu DB
    description: string;
    associatedRouteIds: string[];
    images: string[];
    videoUrl?: string;
    driveUrl?: string;
    driverReportDetails?: DriverReportDetails; // NUEVO
}

export interface GeoJSONFeature<T> {
    type: "Feature";
    properties: any;
    geometry: T;
}

export interface GeoJSONLineString {
    type: "LineString";
    coordinates: [number, number][];
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