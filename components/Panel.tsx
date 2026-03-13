import React from 'react';
import type { RiskType, Route, Risk } from '../types';
import type { AppTab } from '../App';
import { RouteManager } from './RouteManager';
import { RiskTypeManager } from './RiskTypeManager';
import { ReportViewer } from './ReportViewer';
import { RiskViewer } from './RiskViewer';
import { Settings } from './Settings';
import { Map, MapPin, AlertTriangle, FileBarChart, Layers, Settings as SettingsIcon } from 'lucide-react';

interface PanelProps {
    riskTypes: RiskType[]; setRiskTypes: React.Dispatch<React.SetStateAction<RiskType[]>>;
    routes: Route[]; setRoutes: React.Dispatch<React.SetStateAction<Route[]>>;
    risks: Risk[]; setRisks: React.Dispatch<React.SetStateAction<Risk[]>>;
    proximityDistance: number; setProximityDistance: React.Dispatch<React.SetStateAction<number>>;
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
    
    togglePublicRoute: (id: string) => void; // NUEVO
}

export const Panel: React.FC<PanelProps> = ({
    riskTypes, setRiskTypes, routes, setRoutes, risks, setRisks, proximityDistance,
    setProximityDistance, onAddRoute, getRiskType,
    activeTab, setActiveTab, showRisks, setShowRisks, showIncidents, setShowIncidents,
    filterGroup, setFilterGroup, filterLine, setFilterLine, filterService, setFilterService, 
    activeRouteId, setActiveRouteId, reportSelectedRouteId, setReportSelectedRouteId,
    riskViewerSelectedTypes, setRiskViewerSelectedTypes, togglePublicRoute
}) => {

    const renderTabContent = () => {
        switch (activeTab) {
            case 'routes':
                return (
                    <RouteManager 
                        routes={routes} onAddRoute={onAddRoute} setRoutes={setRoutes}
                        showRisks={showRisks} setShowRisks={setShowRisks} showIncidents={showIncidents} setShowIncidents={setShowIncidents}
                        filterGroup={filterGroup} setFilterGroup={setFilterGroup}
                        filterLine={filterLine} setFilterLine={setFilterLine}
                        filterService={filterService} setFilterService={setFilterService}
                        activeRouteId={activeRouteId} setActiveRouteId={setActiveRouteId}
                        togglePublicRoute={togglePublicRoute}
                    />
                );
            case 'riskTypes': return <RiskTypeManager riskTypes={riskTypes} setRiskTypes={setRiskTypes} />;
            case 'riskViewer': return <RiskViewer riskTypes={riskTypes} risks={risks} routes={routes} selectedTypes={riskViewerSelectedTypes} setSelectedTypes={setRiskViewerSelectedTypes} />;
            case 'reports': return <ReportViewer routes={routes} risks={risks} getRiskType={getRiskType} selectedRouteId={reportSelectedRouteId} setSelectedRouteId={setReportSelectedRouteId} />;
            case 'settings': return <Settings proximityDistance={proximityDistance} setProximityDistance={setProximityDistance} />;
            default: return null;
        }
    };
    
    const TabButton: React.FC<{ tabName: AppTab; icon: React.ReactNode; label: string }> = ({ tabName, icon, label }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`flex flex-col items-center justify-center p-2 w-full text-xs transition-colors duration-200 ${
                activeTab === tabName ? 'bg-sky-600 text-white' : 'text-gray-300 hover:bg-sky-800 hover:text-white'
            }`} title={label}
        >
            {icon}
            <span className="mt-1 text-center leading-tight">{label}</span>
        </button>
    );

    return (
        <aside className="w-[400px] h-full flex bg-gray-800 text-white shadow-lg z-10 flex-shrink-0">
            <div className="w-20 bg-gray-900 flex flex-col items-center py-4 space-y-2 overflow-y-auto">
                 <div className="flex items-center text-sky-400 mb-2"><Map size={32} /></div>
                <TabButton tabName="routes" icon={<MapPin size={24} />} label="Recorridos" />
                <TabButton tabName="riskTypes" icon={<AlertTriangle size={24} />} label="Cargar" />
                <TabButton tabName="riskViewer" icon={<Layers size={24} />} label="Visor" />
                <TabButton tabName="reports" icon={<FileBarChart size={24} />} label="Reportes" />
                <TabButton tabName="settings" icon={<SettingsIcon size={24} />} label="Ajustes" />
            </div>
            <div className="flex-1 p-4 overflow-y-auto">{renderTabContent()}</div>
        </aside>
    );
};