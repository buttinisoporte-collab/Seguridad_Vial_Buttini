--- START OF FILE src/lib/firebase.ts ---
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDocs, collection, deleteDoc } from "firebase/firestore";
import type { Route, Risk, RiskType, User, Siniestro } from '../types';

// 👇 MANTÉN TUS CLAVES AQUÍ 👇
const firebaseConfig = {
  apiKey: "AIzaSyBiSZHiOG4NPh7nC298DG48t2ARPbR0kWs",
  authDomain: "riesgo-vial.firebaseapp.com",
  projectId: "riesgo-vial",
  storageBucket: "riesgo-vial.firebasestorage.app",
  messagingSenderId: "204923217648",
  appId: "1:204923217648:web:5b655f6469f5ad306e0435"
};

let db: any;
try { const app = initializeApp(firebaseConfig); db = getFirestore(app); } catch (e) { console.warn("Firebase offline"); }

export const saveRouteToDB = async (route: Route) => { if(db) await setDoc(doc(db, "routes", route.id), route); };
export const loadRoutesFromDB = async (): Promise<Route[]> => { if(!db) throw new Error("No DB"); return (await getDocs(collection(db, "routes"))).docs.map(d => d.data() as Route); };
export const deleteRouteFromDB = async (id: string) => { if(db) await deleteDoc(doc(db, "routes", id)); };

export const saveRiskToDB = async (risk: Risk) => { if(db) await setDoc(doc(db, "risks", risk.id), risk); };
export const loadRisksFromDB = async (): Promise<Risk[]> => { if(!db) throw new Error("No DB"); return (await getDocs(collection(db, "risks"))).docs.map(d => d.data() as Risk); };
export const deleteRiskFromDB = async (id: string) => { if(db) await deleteDoc(doc(db, "risks", id)); };

export const saveRiskTypeToDB = async (riskType: RiskType) => { if(db) await setDoc(doc(db, "riskTypes", riskType.id), riskType); };
export const loadRiskTypesFromDB = async (): Promise<RiskType[]> => { if(!db) throw new Error("No DB"); return (await getDocs(collection(db, "riskTypes"))).docs.map(d => d.data() as RiskType); };
export const deleteRiskTypeFromDB = async (id: string) => { if(db) await deleteDoc(doc(db, "riskTypes", id)); };

export const saveUserToDB = async (user: User) => { if(db) await setDoc(doc(db, "users", user.id), user); };
export const loadUsersFromDB = async (): Promise<User[]> => { if(!db) throw new Error("No DB"); return (await getDocs(collection(db, "users"))).docs.map(d => d.data() as User); };
export const deleteUserFromDB = async (id: string) => { if(db) await deleteDoc(doc(db, "users", id)); };

// NUEVO: SINIESTROS
export const saveSiniestroToDB = async (siniestro: Siniestro) => { if(db) await setDoc(doc(db, "siniestros", siniestro.id), siniestro); };
export const loadSiniestrosFromDB = async (): Promise<Siniestro[]> => { if(!db) throw new Error("No DB"); return (await getDocs(collection(db, "siniestros"))).docs.map(d => d.data() as Siniestro); };
export const deleteSiniestroFromDB = async (id: string) => { if(db) await deleteDoc(doc(db, "siniestros", id)); };
--- END OF FILE src/lib/firebase.ts ---