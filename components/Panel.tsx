import React, { ReactNode } from 'react';
import type { RiskType, Route, Risk, AppTab, User, Siniestro, Position } from '../types';
import { RouteManager } from './RouteManager';
import { RiskTypeManager } from './RiskTypeManager';
import { ReportViewer } from './ReportViewer';
import { RiskViewer } from './RiskViewer';
import { NovedadesList } from './NovedadesList';
import { SiniestrosAdmin } from './SiniestrosAdmin';
import { SeguimientoAdmin } from './SeguimientoAdmin';
import { IndicadoresAdmin } from './IndicadoresAdmin';
import { Settings } from './Settings';
import { UserManager } from './UserManager';
import { MapPin, AlertTriangle, FileBarChart, Layers, Settings as SettingsIcon, Users, LogOut, Key, List, ShieldAlert, FileSpreadsheet, PieChart as PieChartIcon } from 'lucide-react';

const LOGO_BASE64 = "data:image/png;base64,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";

interface PanelProps {
    children?: ReactNode; 
    currentUser: User; onLogout: () => void; users: User[]; setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    riskTypes: RiskType[]; setRiskTypes: React.Dispatch<React.SetStateAction<RiskType[]>>;
    routes: Route[]; setRoutes: React.Dispatch<React.SetStateAction<Route[]>>;
    risks: Risk[]; setRisks: React.Dispatch<React.SetStateAction<Risk[]>>;
    siniestros: Siniestro[]; incidentRisks: Risk[]; handleDeleteSiniestro: (id: string) => void;
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
    onUpdateSiniestro: (sin: Siniestro) => void;
    groupColors: Record<string, string>; setGroupColors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    novedadesFilterDate: string; setNovedadesFilterDate: (v: string) => void;
    novedadesFilterLine: string; setNovedadesFilterLine: (v: string) => void;
    showNovedadesRoutes: boolean; setShowNovedadesRoutes: (v: boolean) => void;
    showRiskTypesRoutes: boolean; setShowRiskTypesRoutes: (v: boolean) => void;
    selectedSiniestroId: string | null; setSelectedSiniestroId: (v: string | null) => void;
    showRiskViewerRoutes: boolean; setShowRiskViewerRoutes: (v: boolean) => void;
    onAddNewSiniestro: () => void;
    relocatingSiniestroId: string | null; setRelocatingSiniestroId: (v: string | null) => void;
    companyLogo: string; setCompanyLogo: (v: string) => void;
    eventosFilterYear: string; setEventosFilterYear: (v: string) => void;
    eventosFilterMonth: string; setEventosFilterMonth: (v: string) => void;
    eventosFilterTipo: string; setEventosFilterTipo: (v: string) => void;
}

export const Panel: React.FC<PanelProps> = ({
    children, currentUser, onLogout, users, setUsers, riskTypes, setRiskTypes, routes, setRoutes, risks, setRisks, siniestros, incidentRisks, handleDeleteSiniestro,
    proximityDistance, setProximityDistance, driverReportTTL, setDriverReportTTL, onAddRoute, getRiskType, activeTab, setActiveTab, showRisks, setShowRisks, showIncidents, setShowIncidents,
    filterGroup, setFilterGroup, filterLine, setFilterLine, filterService, setFilterService, activeRouteId, setActiveRouteId, reportSelectedRouteId, setReportSelectedRouteId,
    riskViewerSelectedTypes, setRiskViewerSelectedTypes, togglePublicRoute, handleDeleteRisk, setFocusPosition, showAllRoutes, setShowAllRoutes,
    telegramToken, setTelegramToken, telegramChatId, setTelegramChatId, onUpdateRisk, onUpdateSiniestro, groupColors, setGroupColors,
    novedadesFilterDate, setNovedadesFilterDate, novedadesFilterLine, setNovedadesFilterLine, showNovedadesRoutes, setShowNovedadesRoutes,
    showRiskTypesRoutes, setShowRiskTypesRoutes,
    selectedSiniestroId, setSelectedSiniestroId, showRiskViewerRoutes, setShowRiskViewerRoutes, onAddNewSiniestro,
    relocatingSiniestroId, setRelocatingSiniestroId, companyLogo, setCompanyLogo,
    eventosFilterYear, setEventosFilterYear, eventosFilterMonth, setEventosFilterMonth, eventosFilterTipo, setEventosFilterTipo
}) => {

    const renderTabContent = () => {
        switch (activeTab) {
            case 'routes': return <RouteManager routes={routes} onAddRoute={onAddRoute} setRoutes={setRoutes} showRisks={showRisks} setShowRisks={setShowRisks} showIncidents={showIncidents} setShowIncidents={setShowIncidents} filterGroup={filterGroup} setFilterGroup={setFilterGroup} filterLine={filterLine} setFilterLine={setFilterLine} filterService={filterService} setFilterService={setFilterService} activeRouteId={activeRouteId} setActiveRouteId={setActiveRouteId} togglePublicRoute={togglePublicRoute} isAdmin={currentUser.isAdmin} showAllRoutes={showAllRoutes} setShowAllRoutes={setShowAllRoutes} />;
            case 'riskTypes': return <RiskTypeManager riskTypes={riskTypes} setRiskTypes={setRiskTypes} isAdmin={currentUser.isAdmin} showRoutes={showRiskTypesRoutes} setShowRoutes={setShowRiskTypesRoutes} />;
            case 'riskViewer': return <RiskViewer riskTypes={riskTypes} risks={risks} routes={routes} selectedTypes={riskViewerSelectedTypes} setSelectedTypes={setRiskViewerSelectedTypes} showRiskViewerRoutes={showRiskViewerRoutes} setShowRiskViewerRoutes={setShowRiskViewerRoutes} filterLine={filterLine} setFilterLine={setFilterLine} filterService={filterService} setFilterService={setFilterService} />;
            case 'novedades': return <NovedadesList risks={risks} routes={routes} currentUser={currentUser} handleDeleteRisk={handleDeleteRisk} onFocusPosition={setFocusPosition} onUpdateRisk={onUpdateRisk} novedadesFilterDate={novedadesFilterDate} setNovedadesFilterDate={setNovedadesFilterDate} novedadesFilterLine={novedadesFilterLine} setNovedadesFilterLine={setNovedadesFilterLine} showNovedadesRoutes={showNovedadesRoutes} setShowNovedadesRoutes={setShowNovedadesRoutes} />;
            case 'siniestros': return <SiniestrosAdmin siniestros={siniestros} incidentRisks={incidentRisks} riskTypes={riskTypes} routes={routes} handleDeleteSiniestro={handleDeleteSiniestro} handleDeleteRisk={handleDeleteRisk} selectedSiniestroId={selectedSiniestroId} setSelectedSiniestroId={setSelectedSiniestroId} onFocusPosition={setFocusPosition} onUpdateRisk={onUpdateRisk} onUpdateSiniestro={onUpdateSiniestro} onAddNewSiniestro={onAddNewSiniestro} relocatingSiniestroId={relocatingSiniestroId} setRelocatingSiniestroId={setRelocatingSiniestroId} eventosFilterYear={eventosFilterYear} setEventosFilterYear={setEventosFilterYear} eventosFilterMonth={eventosFilterMonth} setEventosFilterMonth={setEventosFilterMonth} eventosFilterTipo={eventosFilterTipo} setEventosFilterTipo={setEventosFilterTipo} />;
            case 'seguimiento': return <SeguimientoAdmin currentUser={currentUser} siniestros={siniestros} onUpdateSiniestro={onUpdateSiniestro} selectedSiniestroId={selectedSiniestroId} setSelectedSiniestroId={setSelectedSiniestroId} eventosFilterYear={eventosFilterYear} setEventosFilterYear={setEventosFilterYear} eventosFilterMonth={eventosFilterMonth} setEventosFilterMonth={setEventosFilterMonth} eventosFilterTipo={eventosFilterTipo} setEventosFilterTipo={setEventosFilterTipo} />;
            case 'indicadores': return <IndicadoresAdmin siniestros={siniestros} />;
            case 'reports': return <ReportViewer routes={routes} risks={risks} getRiskType={getRiskType} selectedRouteId={reportSelectedRouteId} setSelectedRouteId={setReportSelectedRouteId} />;
            case 'settings': return <Settings proximityDistance={proximityDistance} setProximityDistance={setProximityDistance} driverReportTTL={driverReportTTL} setDriverReportTTL={setDriverReportTTL} telegramToken={telegramToken} setTelegramToken={setTelegramToken} telegramChatId={telegramChatId} setTelegramChatId={setTelegramChatId} routes={routes} groupColors={groupColors} setGroupColors={setGroupColors} companyLogo={companyLogo} setCompanyLogo={setCompanyLogo} risks={risks} setRisks={setRisks} riskTypes={riskTypes}  />;
            case 'users': return <UserManager users={users} setUsers={setUsers} currentUser={currentUser} />;
            default: return null;
        }
    };
    
    const TabButton: React.FC<{ tabName: AppTab; icon: React.ReactNode; label: string }> = ({ tabName, icon, label }) => {
        if (!currentUser.isAdmin && !(currentUser.allowedTabs||[]).includes(tabName) && tabName !== 'users') return null;
        if (tabName === 'users' && !currentUser.isAdmin) return null; 

        const isActive = activeTab === tabName;
        return (
            <button 
                onClick={() => setActiveTab(tabName)} 
                className={`flex flex-col items-center justify-center h-full px-3 min-w-[95px] transition-all duration-200 border-x border-white/5 ${
                    isActive 
                        ? 'bg-[#0284c7] text-white shadow-inner' 
                        : 'bg-transparent text-gray-400 hover:bg-white/5 hover:text-white'
                }`} 
                title={label}
            >
                <div className="mb-1">{icon}</div>
                <span className="text-[11px] font-semibold text-center leading-tight whitespace-nowrap">{label}</span>
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

    const isFullScreenTab = activeTab === 'seguimiento' || activeTab === 'indicadores';

    return (
        <div className="flex flex-col h-screen w-screen bg-slate-100 font-sans overflow-hidden">
            <header className="h-[72px] bg-[#0b0f19] text-white flex items-center justify-between shadow-md z-20 flex-shrink-0">
                <div className="flex items-center h-full pl-3 pr-6 bg-white/5 border-r border-white/10">
                    <img 
                        src={companyLogo || LOGO_BASE64} 
                        alt="Logo Empresa" 
                        className="h-12 max-w-[140px] object-contain bg-white rounded p-1 mr-3" 
                        onError={(e) => { e.currentTarget.src = LOGO_BASE64; }}
                    />
                    <div className="font-bold leading-tight hidden xl:block">
                        <div className="text-[15px] text-white tracking-wide">Matriz de Análisis de Riesgos</div>
                        <div className="text-[13px] text-sky-400">de Seguridad Vial</div>
                    </div>
                </div>
                
                <div className="flex items-center h-full flex-1 overflow-x-auto no-scrollbar">
                    <TabButton tabName="routes" icon={<MapPin size={20} />} label="Recorridos" />
                    <TabButton tabName="riskTypes" icon={<AlertTriangle size={20} />} label="Carga de Datos" />
                    <TabButton tabName="novedades" icon={<List size={20} />} label="Novedades" />
                    <TabButton tabName="siniestros" icon={<ShieldAlert size={20} />} label="Siniestros" />
                    <TabButton tabName="seguimiento" icon={<FileSpreadsheet size={20} />} label="Seguimiento CRM" />
                    <TabButton tabName="indicadores" icon={<PieChartIcon size={20} />} label="Indicadores" />
                    <TabButton tabName="riskViewer" icon={<Layers size={20} />} label="Mapa Riesgo" />
                    <TabButton tabName="reports" icon={<FileBarChart size={20} />} label="Riesgo por Servicio" />
                    <TabButton tabName="settings" icon={<SettingsIcon size={20} />} label="Ajustes" />
                    <TabButton tabName="users" icon={<Users size={20} />} label="Usuarios" />
                </div>
                
                <div className="flex items-center flex-shrink-0 h-full">
                    {!currentUser.isAdmin && !currentUser.isDriver && (
                        <button onClick={handleChangePass} className="flex flex-col items-center justify-center h-full px-4 border-l border-white/10 text-yellow-400 hover:bg-white/10 transition-colors" title="Cambiar mi Contraseña">
                            <Key size={18} />
                            <span className="mt-1 text-[10px] font-medium leading-none">Clave</span>
                        </button>
                    )}
                    <div className="hidden lg:block text-right px-4 border-l border-white/10">
                        <div className="text-[10px] text-slate-400 uppercase tracking-wide">Usuario</div>
                        <div className="text-sm font-bold text-sky-400 truncate max-w-[120px]">{currentUser.name}</div>
                    </div>
                    <button onClick={onLogout} className="flex flex-col items-center justify-center h-full px-5 border-l border-white/10 bg-red-900/20 text-red-400 hover:bg-red-600 hover:text-white transition-colors" title="Cerrar Sesión">
                        <LogOut size={18} />
                        <span className="mt-1 text-[11px] font-bold leading-none">Salir</span>
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden min-h-0 relative">
                {/* SIDEBAR NORMAL (Se oculta cuando estamos en Seguimiento CRM o Indicadores) */}
                <aside className={`bg-[#111827] text-white shadow-[4px_0_24px_rgba(0,0,0,0.4)] z-10 flex flex-col flex-shrink-0 border-r border-slate-800 transition-all duration-300 ease-in-out ${isFullScreenTab ? 'hidden' : 'w-[380px]'}`}>
                    <div className="flex-1 p-5 overflow-y-auto custom-scrollbar">
                        {!isFullScreenTab && renderTabContent()}
                    </div>
                </aside>
                
                {/* ÁREA PRINCIPAL */}
                <main className="flex-1 relative z-0 bg-slate-200 overflow-hidden">
                    {/* El mapa DEBE permanecer siempre montado en el DOM para que la librería Leaflet no se rompa ni pierda sus dimensiones.
                        Por eso usamos opacity-0 y pointer-events-none en lugar de ocultarlo completamente o quitarlo de la vista. */}
                    <div className={`w-full h-full absolute inset-0 ${isFullScreenTab ? 'opacity-0 pointer-events-none z-0' : 'z-10'}`}>
                        {children}
                    </div>

                    {/* Cuando entramos a Seguimiento o Indicadores, montamos la pantalla a FULL WIDTH sobre fondo negro */}
                    {isFullScreenTab && (
                        <div className="absolute inset-0 z-50 bg-black flex w-full h-full">
                            {renderTabContent()}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};