import { createClient } from '@supabase/supabase-js';
import type { Route, Risk, RiskType, User, Siniestro } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// --- SEGUNDO CLIENTE (BD EXTERNA DE CONDUCTORES) ---
const externalDbUrl = import.meta.env.VITE_EXTERNAL_SUPABASE_URL;
const externalDbKey = import.meta.env.VITE_EXTERNAL_SUPABASE_ANON_KEY;
export const externalSupabase = createClient(externalDbUrl, externalDbKey);

console.log("URL de Supabase:", supabaseUrl); // Debería mostrar la URL
console.log("Key de Supabase:", supabaseKey ? "Cargada OK" : "FALTA LA KEY");

export const supabase = createClient(supabaseUrl, supabaseKey);

export const loadExternalData = async () => {
    const [resConductores, resUnidades, resServicios] = await Promise.all([
        externalSupabase.from('conductores').select('*'),
        externalSupabase.from('unidades').select('*'),
        externalSupabase.from('servicios').select('*').eq('activo', true) // <-- AQUÍ ESTÁ LA CLAVE
    ]);

    if (resConductores.error) console.error("Error conductores:", resConductores.error);
    if (resUnidades.error) console.error("Error unidades:", resUnidades.error);
    if (resServicios.error) console.error("Error servicios:", resServicios.error);

    return {
        conductores: resConductores.data || [],
        unidades: resUnidades.data || [],
        servicios: resServicios.data || []
    };
};
// ==========================================================
// STORAGE
// ==========================================================
export const uploadSiniestroImage = async (siniestroId: string, file: File): Promise<string> => {
    const filePath = `${siniestroId}/${file.name}_${Date.now()}`;
    const { error } = await supabase.storage.from('siniestros').upload(filePath, file);
    if (error) throw error;
    
    const { data } = supabase.storage.from('siniestros').getPublicUrl(filePath);
    return data.publicUrl;
};

// ==========================================================
// RUTAS (ROUTES)
// ==========================================================
export const saveRouteToDB = async (route: Route) => {
    let downloadUrl = route.geoJsonUrl || '';

    // 1. Subir geoJson a Storage si existe
    if (route.geoJson) {
        const filePath = `${route.id}.json`;
        const geoJsonString = JSON.stringify(route.geoJson);
        const file = new Blob([geoJsonString], { type: 'application/json' });
        
        await supabase.storage.from('routes').upload(filePath, file, { upsert: true });
        const { data } = supabase.storage.from('routes').getPublicUrl(filePath);
        downloadUrl = data.publicUrl;
    }

    // 2. Guardar en Base de Datos (Mapeando a snake_case)
    await supabase.from('routes').upsert({
        id: route.id,
        name: route.name,
        origin: route.origin,
        destination: route.destination,
        group_name: route.group,
        line: route.line,
        service: route.service,
        geo_json_url: downloadUrl,
        is_public: route.isPublic
    });
};

export const loadRoutesFromDB = async (): Promise<Route[]> => {
    const { data, error } = await supabase.from('routes').select('*');
    if (error || !data) return [];

    const fullRoutes = await Promise.all(data.map(async (r: any) => {
        let geoJson = null;
        if (r.geo_json_url) {
            try {
                const response = await fetch(r.geo_json_url);
                geoJson = await response.json();
            } catch (e) { console.error("Error descargando mapa", e); }
        }
        
        // Mapeamos de snake_case a camelCase (lo que espera tu App.tsx)
        return {
            id: r.id, name: r.name, origin: r.origin, destination: r.destination,
            group: r.group_name, line: r.line, service: r.service,
            geoJsonUrl: r.geo_json_url, isPublic: r.is_public, geoJson
        } as Route;
    }));
    return fullRoutes;
};

export const deleteRouteFromDB = async (id: string) => {
    await supabase.from('routes').delete().eq('id', id);
    await supabase.storage.from('routes').remove([`${id}.json`]);
};

// ==========================================================
// RIESGOS (RISKS)
// ==========================================================
export const saveRiskToDB = async (risk: Risk) => {
    await supabase.from('risks').upsert({
        id: risk.id, lat: risk.position?.lat, lng: risk.position?.lng,
        risk_type_id: risk.riskTypeId, description: risk.description,
        associated_route_ids: risk.associatedRouteIds, images: risk.images,
        video_url: risk.videoUrl, drive_url: risk.driveUrl,
        driver_report_details: risk.driverReportDetails, timestamp: risk.timestamp,
        is_visible_on_map: risk.isVisibleOnMap, gravedad: risk.gravedad
    });
};

export const loadRisksFromDB = async (): Promise<Risk[]> => {
    const { data, error } = await supabase.from('risks').select('*');
    if (error || !data) return [];
    
    return data.map(r => ({
        id: r.id, position: { lat: r.lat, lng: r.lng }, riskTypeId: r.risk_type_id,
        description: r.description, associatedRouteIds: r.associated_route_ids,
        images: r.images, videoUrl: r.video_url, driveUrl: r.drive_url,
        driverReportDetails: r.driver_report_details, timestamp: r.timestamp,
        isVisibleOnMap: r.is_visible_on_map, gravedad: r.gravedad
    })) as Risk[];
};

export const deleteRiskFromDB = async (id: string) => { await supabase.from('risks').delete().eq('id', id); };

// ==========================================================
// TIPOS DE RIESGO (RISK TYPES)
// ==========================================================
export const saveRiskTypeToDB = async (rt: RiskType) => {
    await supabase.from('risk_types').upsert({ id: rt.id, name: rt.name, color: rt.color, is_incident: rt.isIncident });
};

export const loadRiskTypesFromDB = async (): Promise<RiskType[]> => {
    const { data } = await supabase.from('risk_types').select('*');
    return (data || []).map(rt => ({ id: rt.id, name: rt.name, color: rt.color, isIncident: rt.is_incident }));
};

export const deleteRiskTypeFromDB = async (id: string) => { await supabase.from('risk_types').delete().eq('id', id); };

// ==========================================================
// USUARIOS (USERS)
// ==========================================================
export const saveUserToDB = async (u: User) => {
    await supabase.from('users').upsert({ id: u.id, name: u.name, username: u.username, pin: u.pin, is_admin: u.isAdmin, is_driver: u.isDriver, allowed_tabs: u.allowedTabs });
};

export const loadUsersFromDB = async (): Promise<User[]> => {
    const { data } = await supabase.from('users').select('*');
    return (data || []).map(u => ({ id: u.id, name: u.name, username: u.username, pin: u.pin, isAdmin: u.is_admin, isDriver: u.is_driver, allowedTabs: u.allowed_tabs }));
};

export const deleteUserFromDB = async (id: string) => { await supabase.from('users').delete().eq('id', id); };

// ==========================================================
// SINIESTROS
// ==========================================================
export const saveSiniestroToDB = async (sin: Siniestro) => {
    await supabase.from('siniestros').upsert({
        id: sin.id, 
        tipo_evento: sin.tipoEvento || 'Siniestro',
        timestamp: sin.timestamp, 
        fecha_hora: sin.fechaHora,
        ubicacion: sin.ubicacion, 
        conductor: sin.conductor, 
        descripcion: sin.descripcion,
        entorno: sin.entorno, 
        datos_complementarios: sin.datosComplementarios,
        images: sin.images, 
        drive_url: sin.driveUrl, 
        associated_route_id: sin.associatedRouteId,
        investigacion: sin.investigacion
    });
};

export const loadSiniestrosFromDB = async (): Promise<Siniestro[]> => {
    const { data } = await supabase.from('siniestros').select('*');
    return (data || []).map(s => ({
        id: s.id, 
        tipoEvento: s.tipo_evento || 'Siniestro',
        timestamp: s.timestamp, 
        fechaHora: s.fecha_hora,
        ubicacion: s.ubicacion, 
        conductor: s.conductor, 
        descripcion: s.descripcion,
        entorno: s.entorno, 
        datosComplementarios: s.datos_complementarios,
        images: s.images, 
        driveUrl: s.drive_url, 
        associatedRouteId: s.associated_route_id,
        investigacion: s.investigacion 
    })) as Siniestro[];
};

export const deleteSiniestroFromDB = async (id: string) => { 
    await supabase.from('siniestros').delete().eq('id', id); 
};

// ==========================================================
// METRICAS MENSULAES (INDICADORES)
// ==========================================================
import type { MetricasMensuales } from '../types';

export const saveMetricasToDB = async (metricas: MetricasMensuales) => {
    await supabase.from('metricas_mensuales').upsert({
        id: metricas.id,
        nomina_activa: metricas.nominaActiva,
        flota_activa: metricas.flotaActiva,
        kms_urbano_540: metricas.kmsUrbano540,
        kms_urbano_570: metricas.kmsUrbano570,
        kms_media_540: metricas.kmsMedia540,
        kms_media_570: metricas.kmsMedia570,
        kms_larga_570: metricas.kmsLarga570
    });
};

export const loadMetricasFromDB = async (id: string): Promise<MetricasMensuales | null> => {
    const { data, error } = await supabase.from('metricas_mensuales').select('*').eq('id', id).single();
    if (error || !data) return null;
    return {
        id: data.id,
        nominaActiva: data.nomina_activa,
        flotaActiva: data.flota_activa,
        kmsUrbano540: data.kms_urbano_540,
        kmsUrbano570: data.kms_urbano_570,
        kmsMedia540: data.kms_media_540,
        kmsMedia570: data.kms_media_570,
        kmsLarga570: data.kms_larga_570
    };
};
