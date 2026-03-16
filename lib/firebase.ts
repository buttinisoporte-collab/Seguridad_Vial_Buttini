--- START OF FILE src/lib/firebase.ts ---
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDocs, collection, deleteDoc } from "firebase/firestore";
import type { Route, Risk, RiskType } from '../types';

// 👇 REEMPLAZA ESTO CON LO QUE TE DIO FIREBASE 👇
const firebaseConfig = {
  apiKey: "AIzaSyBiSZHiOG4NPh7nC298DG48t2ARPbR0kWs";
  authDomain: "riesgo-vial.firebaseapp.com";
  projectId: "riesgo-vial";
  storageBucket: "riesgo-vial.firebasestorage.app";
  messagingSenderId: "204923217648";
  appId: "1:204923217648:web:5b655f6469f5ad306e0435"
};
// 👆 ------------------------------------------- 👆

let db: any;
try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("🔥 Firebase conectado correctamente");
} catch (error) {
    console.warn("Error conectando Firebase:", error);
}

export const saveRouteToDB = async (route: Route) => { if(db) await setDoc(doc(db, "routes", route.id), route); };
export const loadRoutesFromDB = async (): Promise<Route[]> => { 
    if(!db) throw new Error("No DB"); 
    return (await getDocs(collection(db, "routes"))).docs.map(d => d.data() as Route); 
};
export const deleteRouteFromDB = async (id: string) => { if(db) await deleteDoc(doc(db, "routes", id)); };

export const saveRiskToDB = async (risk: Risk) => { if(db) await setDoc(doc(db, "risks", risk.id), risk); };
export const loadRisksFromDB = async (): Promise<Risk[]> => { 
    if(!db) throw new Error("No DB"); 
    return (await getDocs(collection(db, "risks"))).docs.map(d => d.data() as Risk); 
};
export const deleteRiskFromDB = async (id: string) => { if(db) await deleteDoc(doc(db, "risks", id)); };

export const saveRiskTypeToDB = async (riskType: RiskType) => { if(db) await setDoc(doc(db, "riskTypes", riskType.id), riskType); };
export const loadRiskTypesFromDB = async (): Promise<RiskType[]> => { 
    if(!db) throw new Error("No DB"); 
    return (await getDocs(collection(db, "riskTypes"))).docs.map(d => d.data() as RiskType); 
};
export const deleteRiskTypeFromDB = async (id: string) => { if(db) await deleteDoc(doc(db, "riskTypes", id)); };
--- END OF FILE src/lib/firebase.ts ---