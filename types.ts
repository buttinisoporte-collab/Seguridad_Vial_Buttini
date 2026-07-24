export type AppTab = 'routes' | 'riskTypes' | 'reports' | 'riskViewer' | 'settings' | 'users' | 'novedades' | 'siniestros' | 'seguimiento' | 'indicadores';

export interface Position { lat: number; lng: number; }
export interface RiskType { id: string; name: string; color: string; isIncident: boolean; }

export interface DriverReportDetails {
    unidad: string; linea: string; sentido: string; categoriaIRAM: string;
    huboDesvio: boolean; rutaAlternativa?: string; velocidadSugerida?: string;
    carrilRecomendado?: string; ubicacionManual?: string; conductorName?: string;
    subeProblema?: string; subePasajerosSinCobrar?: string;
}

export interface Risk {
    id: string; position: Position; riskTypeId: string; description: string;
    associatedRouteIds: string[]; images: string[]; videoUrl?: string; driveUrl?: string;
    driverReportDetails?: DriverReportDetails; timestamp?: number; isVisibleOnMap?: boolean;
    gravedad?: string; // NUEVO: Para guardar la gravedad en siniestros manuales
}

export interface Consecuencia { tipo: string; activa: boolean; cantidad: string; }

export interface VictimaDetalle {
    id: string;
    nombre: string;
    dni: string;
    domicilio?: string;
    telefono?: string;
    correo?: string;
}

export interface MetricasMensuales {
    id: string; 
    nominaActiva: number;
    flotaActiva: number;
    kmsUrbano540: number;
    kmsUrbano570: number;
    kmsMedia540: number;
    kmsMedia570: number;
    kmsLarga570: number;
    // OBJETIVOS
    objUnidades: number;
    objConductores: number;
    objKmsTotales: number;
    objKms540: number;
    objKmsUrbano540: number;
    objKmsMedia540: number;
    objKms570: number;
    objKmsUrbano570: number;
    objKmsMedia570: number;
    objKmsLarga570: number;
}

export interface InvestigacionData {
    // Campos CRM
    zona?: string; numeroSiniestro?: string; grupo?: string; tipoServicio?: string; dominio?: string;
    sectorDanado?: string; accionCorrectiva?: string; presentoReclamo?: string;
    ampliacionDeclaracion?: string; ampliacionLugar?: string; estadoAmd?: string; estadoJudicial?: string;
    responsabilidadFinal?: string; responsabilidadCsv?: string; franquicia?: string;
    seguroTercero?: string; ofrecimiento?: string; pretension?: string; estadoReclamo?: string;
    abonado?: string; linkVideoCamara?: string; victimasDetalle?: VictimaDetalle[];
    
    // Campos INFORME INVESTIGACION (R-CH-Ad-08-02)
    estadoInvestigacion?: 'Pendiente' | 'En Curso' | 'Finalizada';
    antiguedadEmpresa?: string;
    pasajerosBordo?: string;
    danosMateriales?: string;
    notiAsegFecha?: string;
    notiAsegHora?: string;
    evidencias?: string[]; // 'Fotografías', 'Croquis', 'Videos', 'Registro GPS/Tacógrafo', 'Declaraciones de testigos', 'Informe técnico del vehículo', 'Otro'
    evidenciaOtro?: string;
    causaTipo?: string;
    causaDescripcion?: string;
    causaInmediata?: string;
    causaRaiz?: string;
    metodoCausa?: string; // '5 Porqués', 'Ishikawa', '5M', 'Otro'
    metodoOtro?: string;
    conclusiones?: string;
    correspondeAccion?: string; // 'Si', 'No'
    nroAccion?: string;
}

export interface Siniestro {
    id: string; tipoEvento?: 'Siniestro' | 'Incidente'; timestamp: number; fechaHora: string; investigacion?: InvestigacionData;
    ubicacion: { lat?: number; lng?: number; manual: string; lugar: string; };
    conductor: { nombre: string; legajo: string; interno: string; kilometraje: string; linea: string; };
    descripcion: { tipo: string; resumen: string; consecuencias: Consecuencia[]; factoresCausales: string; gravedad: string; };
    entorno: { climas: string[]; caminos: string[]; visibilidades?: string[]; };
    datosComplementarios: { 
        nombreTercero: string; dniTercero: string; vehiculoTercero: string; patenteTercero: string; seguroTercero: string; polizaTercero: string;
        intervencionPolicial: boolean; hayTestigos: boolean; testigosInfo: string;
    };
    images: string[];
    driveUrl?: string; 
    associatedRouteId?: string;
}

export interface GeoJSONFeature<T> { type: "Feature"; properties: any; geometry: T; }
export interface GeoJSONLineString { type: "LineString"; coordinates:[number, number][]; }
export interface GeoJSONGeometryCollection { type: "GeometryCollection"; geometries: any[]; }
export interface RouteGeoJSON { type: "FeatureCollection"; features: GeoJSONFeature<GeoJSONLineString | GeoJSONGeometryCollection>[]; }

export interface Route { 
    id: string; name: string; origin: string; destination: string; group: string; line: string; service: string; 
    geoJson: RouteGeoJSON; geoJsonUrl?: string; isPublic?: boolean; 
}
export interface User { id: string; name: string; username: string; pin: string; isAdmin: boolean; isDriver?: boolean; allowedTabs: AppTab[]; }