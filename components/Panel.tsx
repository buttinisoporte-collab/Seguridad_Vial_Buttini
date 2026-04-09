import React from 'react';
import type { RiskType, Route, Risk, AppTab, User, Siniestro, Position } from '../types';
import { RouteManager } from './RouteManager';
import { RiskTypeManager } from './RiskTypeManager';
import { ReportViewer } from './ReportViewer';
import { RiskViewer } from './RiskViewer';
import { NovedadesList } from './NovedadesList';
import { SiniestrosAdmin } from './SiniestrosAdmin';
import { Settings } from './Settings';
import { UserManager } from './UserManager';
import { Map, MapPin, AlertTriangle, FileBarChart, Layers, Settings as SettingsIcon, Users, LogOut, Key, List, ShieldAlert } from 'lucide-react';

interface PanelProps {
    currentUser: User; onLogout: () => void; users: User[]; setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    riskTypes: RiskType[]; setRiskTypes: React.Dispatch<React.SetStateAction<RiskType[]>>;
    routes: Route[]; setRoutes: React.Dispatch<React.SetStateAction<Route[]>>;
    risks: Risk[]; setRisks: React.Dispatch<React.SetStateAction<Risk[]>>;
    siniestros: Siniestro[]; handleDeleteSiniestro: (id: string) => void;
    proximityDistance: number; setProximityDistance: React.Dispatch<React.SetStateAction<number>>;
    driverReportTTL: number; setDriverReportTTL: React.Dispatch<React.SetStateAction<number>>;
    onAddRoute: (name: string, origin: string, destination: string, group: string, line: string, service: string, kmlFile: File) => void;
    getRiskType: (id: string) => RiskType | undefined;
    activeTab: AppTab; setActiveTab: React.Dispatch<React.SetStateAction<AppTab>>;
    showRisks: boolean; setShowRisks: React.Dispatch<React.SetStateAction<boolean>>;
    showIncidents: boolean; setShowIncidents: React.Dispatch<React.SetStateAction<boolean>>;
    filterGroup: string; setFilterGroup: React.Dispatch<React.SetStateAction<string>>;
    filterLine: string; setFilterLine: React.Dispatch<React.SetStateAction<string>>;
    filterService: string; setFilterService: React.Dispatch<React.SetStateAction<string>>;
    activeRouteId: string | null; setActiveRouteId: React.Dispatch<React.SetStateAction<string | null>>;
    reportSelectedRouteId: string; setReportSelectedRouteId: React.Dispatch<React.SetStateAction<string>>;
    riskViewerSelectedTypes: string[]; setRiskViewerSelectedTypes: React.Dispatch<React.SetStateAction<string[]>>;
    togglePublicRoute: (id: string) => void; handleDeleteRisk: (id: string) => void;
    setFocusPosition: React.Dispatch<React.SetStateAction<Position | null>>;
    showAllRoutes: boolean; setShowAllRoutes: (v: boolean) => void;
    telegramToken: string; setTelegramToken: (v: string) => void;
    telegramChatId: string; setTelegramChatId: (v: string) => void;
    onUpdateRisk: (risk: Risk) => void;
    groupColors: Record<string, string>; setGroupColors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    novedadesFilterDate: string; setNovedadesFilterDate: (v: string) => void;
    novedadesFilterLine: string; setNovedadesFilterLine: (v: string) => void;
    showNovedadesRoutes: boolean; setShowNovedadesRoutes: (v: boolean) => void;
    selectedSiniestroId: string | null; setSelectedSiniestroId: (v: string | null) => void;
    showRiskViewerRoutes: boolean; setShowRiskViewerRoutes: (v: boolean) => void;
}

export const Panel: React.FC<PanelProps> = ({
    currentUser, onLogout, users, setUsers, riskTypes, setRiskTypes, routes, setRoutes, risks, setRisks, siniestros, handleDeleteSiniestro,
    proximityDistance, setProximityDistance, driverReportTTL, setDriverReportTTL, onAddRoute, getRiskType, activeTab, setActiveTab, showRisks, setShowRisks, showIncidents, setShowIncidents,
    filterGroup, setFilterGroup, filterLine, setFilterLine, filterService, setFilterService, activeRouteId, setActiveRouteId, reportSelectedRouteId, setReportSelectedRouteId,
    riskViewerSelectedTypes, setRiskViewerSelectedTypes, togglePublicRoute, handleDeleteRisk, setFocusPosition, showAllRoutes, setShowAllRoutes,
    telegramToken, setTelegramToken, telegramChatId, setTelegramChatId, onUpdateRisk, groupColors, setGroupColors,
    novedadesFilterDate, setNovedadesFilterDate, novedadesFilterLine, setNovedadesFilterLine, showNovedadesRoutes, setShowNovedadesRoutes,
    selectedSiniestroId, setSelectedSiniestroId, showRiskViewerRoutes, setShowRiskViewerRoutes
}) => {

    const renderTabContent = () => {
        switch (activeTab) {
            case 'routes': return <RouteManager routes={routes} onAddRoute={onAddRoute} setRoutes={setRoutes} showRisks={showRisks} setShowRisks={setShowRisks} showIncidents={showIncidents} setShowIncidents={setShowIncidents} filterGroup={filterGroup} setFilterGroup={setFilterGroup} filterLine={filterLine} setFilterLine={setFilterLine} filterService={filterService} setFilterService={setFilterService} activeRouteId={activeRouteId} setActiveRouteId={setActiveRouteId} togglePublicRoute={togglePublicRoute} isAdmin={currentUser.isAdmin} showAllRoutes={showAllRoutes} setShowAllRoutes={setShowAllRoutes} />;
            case 'riskTypes': return <RiskTypeManager riskTypes={riskTypes} setRiskTypes={setRiskTypes} isAdmin={currentUser.isAdmin} />;
            case 'riskViewer': return <RiskViewer riskTypes={riskTypes} risks={risks} routes={routes} selectedTypes={riskViewerSelectedTypes} setSelectedTypes={setRiskViewerSelectedTypes} showRiskViewerRoutes={showRiskViewerRoutes} setShowRiskViewerRoutes={setShowRiskViewerRoutes} filterLine={filterLine} setFilterLine={setFilterLine} filterService={filterService} setFilterService={setFilterService} />;
            case 'novedades': return <NovedadesList risks={risks} routes={routes} currentUser={currentUser} handleDeleteRisk={handleDeleteRisk} onFocusPosition={setFocusPosition} onUpdateRisk={onUpdateRisk} novedadesFilterDate={novedadesFilterDate} setNovedadesFilterDate={setNovedadesFilterDate} novedadesFilterLine={novedadesFilterLine} setNovedadesFilterLine={setNovedadesFilterLine} showNovedadesRoutes={showNovedadesRoutes} setShowNovedadesRoutes={setShowNovedadesRoutes} />;
            case 'siniestros': return <SiniestrosAdmin siniestros={siniestros} handleDeleteSiniestro={handleDeleteSiniestro} selectedSiniestroId={selectedSiniestroId} setSelectedSiniestroId={setSelectedSiniestroId} />;
            case 'reports': return <ReportViewer routes={routes} risks={risks} getRiskType={getRiskType} selectedRouteId={reportSelectedRouteId} setSelectedRouteId={setReportSelectedRouteId} />;
            case 'settings': return <Settings proximityDistance={proximityDistance} setProximityDistance={setProximityDistance} driverReportTTL={driverReportTTL} setDriverReportTTL={setDriverReportTTL} telegramToken={telegramToken} setTelegramToken={setTelegramToken} telegramChatId={telegramChatId} setTelegramChatId={setTelegramChatId} routes={routes} groupColors={groupColors} setGroupColors={setGroupColors} />;
            case 'users': return <UserManager users={users} setUsers={setUsers} currentUser={currentUser} />;
            default: return null;
        }
    };
    
    const TabButton: React.FC<{ tabName: AppTab; icon: React.ReactNode; label: string }> = ({ tabName, icon, label }) => {
        if (!currentUser.isAdmin && !(currentUser.allowedTabs||[]).includes(tabName) && tabName !== 'users') return null;
        if (tabName === 'users' && !currentUser.isAdmin) return null; 

        return (
            <button onClick={() => setActiveTab(tabName)} className={`flex flex-col items-center justify-center p-2 w-full text-xs transition-colors duration-200 ${activeTab === tabName ? 'bg-sky-600 text-white' : 'text-gray-300 hover:bg-sky-800 hover:text-white'}`} title={label}>
                {icon}
                <span className="mt-1 text-center leading-tight">{label}</span>
            </button>
        );
    };

    const handleChangePass = () => {
        const newPin = window.prompt("Ingrese su nueva contraseña:");
        if (newPin && newPin.trim().length > 0) {
            setUsers(users.map(u => u.id === currentUser.id ? { ...u, pin: newPin.trim() } : u));
            alert("Contraseña actualizada. Use la nueva clave la próxima vez que inicie sesión.");
        }
    };

    return (
        <aside className="w-[420px] h-full flex bg-gray-800 text-white shadow-lg z-10 flex-shrink-0 relative">
            <div className="w-20 bg-gray-900 flex flex-col items-center py-4 space-y-1 overflow-y-auto">
                 <div className="flex items-center text-sky-400 mb-2" title={`Conectado como: ${currentUser.name}`}><Map size={32} /></div>
                
                <TabButton tabName="routes" icon={<MapPin size={24} />} label="Recorridos" />
                <TabButton tabName="riskTypes" icon={<AlertTriangle size={24} />} label="Carga de Datos" />
                <TabButton tabName="novedades" icon={<List size={24} />} label="Novedades" />
                <TabButton tabName="siniestros" icon={<ShieldAlert size={24} />} label="Siniestros" />
                <TabButton tabName="riskViewer" icon={<Layers size={24} />} label="Mapa Riesgo" />
                <TabButton tabName="reports" icon={<FileBarChart size={24} />} label="Riesgo por Servicio" />
                <TabButton tabName="settings" icon={<SettingsIcon size={24} />} label="Ajustes" />
                <TabButton tabName="users" icon={<Users size={24} />} label="Usuarios" />

                <div className="flex-1"></div>
                
                {!currentUser.isAdmin && !currentUser.isDriver && (
                    <button onClick={handleChangePass} className="flex flex-col items-center justify-center p-2 w-full text-[10px] text-yellow-400 hover:bg-gray-800" title="Cambiar mi Contraseña">
                        <Key size={20} />
                        <span className="mt-1 text-center leading-tight">Clave</span>
                    </button>
                )}

                <button onClick={onLogout} className="flex flex-col items-center justify-center p-2 w-full text-xs text-red-400 hover:bg-red-900/50 hover:text-white mt-1" title="Cerrar Sesión">
                    <LogOut size={24} />
                    <span className="mt-1 text-center leading-tight">Salir</span>
                </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">{renderTabContent()}</div>
        </aside>
    );
};