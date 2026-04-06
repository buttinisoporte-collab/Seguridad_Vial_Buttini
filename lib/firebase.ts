import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDocs, collection, deleteDoc } from "firebase/firestore";
import { getStorage, ref, uploadString, getDownloadURL, deleteObject } from "firebase/storage";
import type { Route, Risk, RiskType, User, Siniestro } from '../types';

// 👇 PEGA AQUÍ TUS CLAVES DE FIREBASE 👇
const firebaseConfig = {
  apiKey: "AIzaSyAu_98dHDW30SwUExej7WlMd9BM-Ryz4qs",
  authDomain: "riesgovial-version2.firebaseapp.com",
  projectId: "riesgovial-version2",
  storageBucket: "riesgovial-version2.firebasestorage.app",
  messagingSenderId: "694525740509",
  appId: "1:694525740509:web:3fb69ccee63935408e6234"
};

let db: any;
let storage: any;
try { 
    const app = initializeApp(firebaseConfig); 
    db = getFirestore(app); 
    storage = getStorage(app); 
} catch (e) { 
    console.warn("Firebase offline"); 
}

// ==========================================================
// RUTAS (ESTRATEGIA ESTRICTA PARA EVITAR ARRAYS ANIDADOS)
// ==========================================================
export const saveRouteToDB = async (route: Route) => { 
    if(!db || !storage) return; 

    let downloadUrl = route.geoJsonUrl || '';

    // 1. Subimos el mapa pesado a Storage como archivo .json
    if (route.geoJson) {
        const storageRef = ref(storage, `routes/${route.id}.json`);
        const geoJsonString = JSON.stringify(route.geoJson);
        await uploadString(storageRef, geoJsonString, 'raw', { contentType: 'application/json' });
        downloadUrl = await getDownloadURL(storageRef);
    }

    // 2. EXTRACCIÓN ESTRICTA: Separamos el geoJson del resto de la ruta.
    // routeSinMapa contiene todo (id, name, group...) EXCEPTO geoJson.
    const { geoJson, ...routeSinMapa } = route;
    
    // 3. Preparamos el objeto final asegurando que no tiene arrays anidados
    const routeToSave = { 
        ...routeSinMapa, 
        geoJsonUrl: downloadUrl 
    };

    // 4. Guardamos en Firestore (ahora 100% libre de "basura" geográfica)
    await setDoc(doc(db, "routes", route.id), routeToSave); 
};

export const loadRoutesFromDB = async (): Promise<Route[]> => { 
    if(!db) throw new Error("No DB"); 
    const snap = await getDocs(collection(db, "routes"));
    const routesData = snap.docs.map(d => d.data());

    // Al cargar la app, descargamos los mapas en base a las URLs guardadas
    const fullRoutes = await Promise.all(routesData.map(async (r: any) => {
        if (r.geoJsonUrl) {
            try {
                const response = await fetch(r.geoJsonUrl);
                r.geoJson = await response.json();
            } catch (e) {
                console.error(`Error descargando mapa para la ruta ${r.name}`, e);
                r.geoJson = null;
            }
        }
        return r as Route;
    }));

    return fullRoutes;
};

export const deleteRouteFromDB = async (id: string) => { 
    if(!db) return; 
    await deleteDoc(doc(db, "routes", id)); 
    if (storage) {
        try { await deleteObject(ref(storage, `routes/${id}.json`)); } 
        catch (e) { console.warn("El archivo no existía en Storage."); }
    }
};

// ==========================================================
// RESTO DE COLECCIONES (Ligeras - Van directo a Firestore)
// ==========================================================
export const saveRiskToDB = async (risk: Risk) => { if(db) await setDoc(doc(db, "risks", risk.id), risk); };
export const loadRisksFromDB = async (): Promise<Risk[]> => { if(!db) throw new Error("No DB"); return (await getDocs(collection(db, "risks"))).docs.map(d => d.data() as Risk); };
export const deleteRiskFromDB = async (id: string) => { if(db) await deleteDoc(doc(db, "risks", id)); };

export const saveRiskTypeToDB = async (riskType: RiskType) => { if(db) await setDoc(doc(db, "riskTypes", riskType.id), riskType); };
export const loadRiskTypesFromDB = async (): Promise<RiskType[]> => { if(!db) throw new Error("No DB"); return (await getDocs(collection(db, "riskTypes"))).docs.map(d => d.data() as RiskType); };
export const deleteRiskTypeFromDB = async (id: string) => { if(db) await deleteDoc(doc(db, "riskTypes", id)); };

export const saveUserToDB = async (user: User) => { if(db) await setDoc(doc(db, "users", user.id), user); };
export const loadUsersFromDB = async (): Promise<User[]> => { if(!db) throw new Error("No DB"); return (await getDocs(collection(db, "users"))).docs.map(d => d.data() as User); };
export const deleteUserFromDB = async (id: string) => { if(db) await deleteDoc(doc(db, "users", id)); };

export const saveSiniestroToDB = async (siniestro: Siniestro) => { if(db) await setDoc(doc(db, "siniestros", siniestro.id), siniestro); };
export const loadSiniestrosFromDB = async (): Promise<Siniestro;