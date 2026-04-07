export type AppTab = 'routes' | 'riskTypes' | 'reports' | 'riskViewer' | 'novedades' | 'siniestros' | 'settings' | 'users';

export interface Position { lat: number; lng: number; }

export interface RiskType { id: string; name: string; color: string; isIncident: boolean; }

export interface DriverReportDetails {
    unidad: string; linea: string; sentido: string; categoriaIRAM: string;
    huboDesvio: boolean; rutaAlternativa?: string; velocidadSugerida?: string;
    carrilRecomendado?: string; ubicacionManual?: string; conductorName?: string;
}

export interface Risk {
    id: string; position: Position; riskTypeId: string; description: string;
    associatedRouteIds: string[]; images: string[]; videoUrl?: string; driveUrl?: string;
    driverReportDetails?: DriverReportDetails; timestamp?: number;
    isVisibleOnMap?: boolean; // NUEVO: Control manual de visibilidad
}

export interface Siniestro {
    id: string; timestamp: number; fechaHora: string;
    ubicacion: { lat?: number; lng?: number; manual: string; lugar: string; };
    conductor: { nombre: string; legajo: string; interno: string; kilometraje: string; servicio: string; };
    descripcion: { tipo: string; resumen: string; causas: string; gravedad: string; };
    terceros: { involucrado: boolean; nombre?: string; dni?: string; vehiculo?: string; patente?: string; seguro?: string; poliza?: string; };
    pasajerosTestigos: { lesionados: boolean; cantidad?: string; testigos?: string; };
    entorno: { clima: string; calzada: string; iluminacion: string; };
    autoridades: { intervino: boolean; dependencia?: string; alcoholemia?: boolean; resultadoAlcoholemia?: string; };
    images: string[]; // NUEVO: Lista de fotos subidas directamente
    driveUrl?: string; 
}

export interface GeoJSONFeature<T> { type: "Feature"; properties: any; geometry: T; }
export interface GeoJSONLineString { type: "LineString"; coordinates:[number, number][]; }
export interface GeoJSONGeometryCollection { type: "GeometryCollection"; geometries: any[]; }
export interface RouteGeoJSON { type: "FeatureCollection"; features: GeoJSONFeature<GeoJSONLineString | GeoJSONGeometryCollection>[]; }
export interface Route { id: string; name: string; origin: string; destination: string; group: string; line: string; service: string; geoJson: RouteGeoJSON; isPublic?: boolean; }
export interface User { id: string; name: string; username: string; pin: string; isAdmin: boolean; isDriver?: boolean; allowedTabs: AppTab[]; }