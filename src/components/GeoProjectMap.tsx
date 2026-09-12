import React, { useState, useMemo } from 'react';
import { Project, RiskLevel } from '../types';
import { RiskBadge } from './RiskBadge';
import { DataQualityBadge } from './DataQualityBadge';
import { 
  MapPin, 
  Layers, 
  Filter, 
  ExternalLink, 
  ShieldAlert, 
  Compass, 
  Globe, 
  Map as MapIcon, 
  Maximize2, 
  RotateCcw,
  Sparkles,
  Layers2
} from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import firebaseConfigData from '../../firebase-applet-config.json';

interface GeoProjectMapProps {
  projects: Project[];
  onSelectProject: (id: string) => void;
}

export const GeoProjectMap: React.FC<GeoProjectMapProps> = ({ projects, onSelectProject }) => {
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>('all');
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<string>('all');
  const [activePin, setActivePin] = useState<Project | null>(null);
  const [mapMode, setMapMode] = useState<'google' | 'atlas'>('google');
  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('roadmap');

  const mapsApiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || (firebaseConfigData as any).apiKey || '';

  // Get unique sectors
  const sectors = useMemo(() => {
    const s = new Set<string>();
    projects.forEach((p) => {
      if (p.sector) s.add(p.sector);
    });
    return Array.from(s).sort();
  }, [projects]);

  // Filter projects for map
  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (selectedRiskFilter !== 'all' && p.riskLevel !== selectedRiskFilter) return false;
      if (selectedSectorFilter !== 'all' && p.sector !== selectedSectorFilter) return false;
      return true;
    });
  }, [projects, selectedRiskFilter, selectedSectorFilter]);

  // Coordinate projection for SVG Atlas view
  const mapWidth = 560;
  const mapHeight = 600;

  const projectToXY = (lat: number, lng: number) => {
    const minLng = 68.0;
    const maxLng = 97.5;
    const minLat = 8.0;
    const maxLat = 37.0;

    const x = ((lng - minLng) / (maxLng - minLng)) * (mapWidth - 80) + 40;
    const y = ((maxLat - lat) / (maxLat - minLat)) * (mapHeight - 80) + 40;
    return { x, y };
  };

  const getMarkerColor = (level: RiskLevel) => {
    switch (level) {
      case 'critical':
        return '#DC2626';
      case 'high':
        return '#EA580C';
      case 'moderate':
        return '#D97706';
      case 'low':
        return '#16A34A';
    }
  };

  const getMarkerBorder = (level: RiskLevel) => {
    switch (level) {
      case 'critical':
        return '#991B1B';
      case 'high':
        return '#C2410C';
      case 'moderate':
        return '#B45309';
      case 'low':
        return '#15803D';
    }
  };

  return (
    <div id="geo-project-map-container" className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Map Control Toolbar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-700" />
            Pan-India Infrastructure Spatial Risk Atlas
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold">
              <Globe className="w-3 h-3 text-blue-600" />
              Google Maps Platform
            </span>
          </h3>
          <p className="text-xs text-slate-500">
            Real-time geospatial tracking of {projects.length} major infrastructure projects with predictive risk markers
          </p>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* View mode toggle */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setMapMode('google')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors ${
                mapMode === 'google'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Google Maps</span>
            </button>
            <button
              type="button"
              onClick={() => setMapMode('atlas')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors ${
                mapMode === 'atlas'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Vector Atlas</span>
            </button>
          </div>

          {mapMode === 'google' && (
            <select
              value={mapTypeId}
              onChange={(e) => setMapTypeId(e.target.value as any)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="roadmap">Roadmap</option>
              <option value="satellite">Satellite</option>
              <option value="hybrid">Hybrid</option>
              <option value="terrain">Terrain</option>
            </select>
          )}

          {/* Risk Filter */}
          <select
            value={selectedRiskFilter}
            onChange={(e) => setSelectedRiskFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">All Risks ({projects.length})</option>
            <option value="critical">Critical Only ({projects.filter((p) => p.riskLevel === 'critical').length})</option>
            <option value="high">High Risk ({projects.filter((p) => p.riskLevel === 'high').length})</option>
            <option value="moderate">Moderate ({projects.filter((p) => p.riskLevel === 'moderate').length})</option>
            <option value="low">Low Risk ({projects.filter((p) => p.riskLevel === 'low').length})</option>
          </select>

          {/* Sector Filter */}
          <select
            value={selectedSectorFilter}
            onChange={(e) => setSelectedSectorFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 max-w-[140px] truncate"
          >
            <option value="all">All Sectors</option>
            {sectors.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Map Display Viewport */}
        <div className="lg:col-span-8 bg-slate-950 relative min-h-[520px] flex items-center justify-center overflow-hidden">
          {mapMode === 'google' && mapsApiKey ? (
            <div className="w-full h-[520px] relative">
              <APIProvider apiKey={mapsApiKey}>
                <Map
                  id="pan-india-google-map"
                  mapId="DEMO_MAP_ID"
                  defaultCenter={{ lat: 21.7679, lng: 78.8718 }}
                  defaultZoom={5}
                  minZoom={3}
                  maxZoom={18}
                  mapTypeId={mapTypeId}
                  gestureHandling="greedy"
                  disableDefaultUI={false}
                  fullscreenControl={true}
                  mapTypeControl={false}
                  zoomControl={true}
                  streetViewControl={false}
                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                  style={{ width: '100%', height: '100%' }}
                >
                  {filtered.map((proj) => {
                    const isSelected = activePin?.id === proj.id;
                    const pinColor = getMarkerColor(proj.riskLevel);
                    const borderColor = getMarkerBorder(proj.riskLevel);

                    return (
                      <AdvancedMarker
                        key={proj.id}
                        position={{ lat: proj.latitude, lng: proj.longitude }}
                        title={`${proj.projectCode} - ${proj.name}`}
                        onClick={() => setActivePin(proj)}
                        zIndex={isSelected ? 100 : proj.riskLevel === 'critical' ? 50 : 10}
                      >
                        <div className="group relative cursor-pointer flex flex-col items-center">
                          {/* Pulsing indicator for critical projects */}
                          {proj.riskLevel === 'critical' && (
                            <span 
                              className="absolute -top-1 -left-1 -right-1 -bottom-1 rounded-full animate-ping opacity-75"
                              style={{ backgroundColor: pinColor }}
                            />
                          )}

                          <div
                            className={`flex items-center justify-center rounded-full shadow-lg transition-transform transform group-hover:scale-125 ${
                              isSelected ? 'ring-4 ring-white ring-offset-2 scale-125' : ''
                            }`}
                            style={{
                              backgroundColor: pinColor,
                              border: `2px solid ${borderColor}`,
                              width: isSelected ? '28px' : '22px',
                              height: isSelected ? '28px' : '22px',
                            }}
                          >
                            <span className="text-[9px] font-bold text-white font-mono leading-none">
                              {proj.riskLevel === 'critical' ? '!' : '•'}
                            </span>
                          </div>

                          <span className="mt-1 px-1.5 py-0.5 bg-slate-900/90 text-[10px] text-white font-mono font-semibold rounded shadow-md border border-slate-700 whitespace-nowrap">
                            {proj.projectCode}
                          </span>
                        </div>
                      </AdvancedMarker>
                    );
                  })}

                  {activePin && (
                    <InfoWindow
                      position={{ lat: activePin.latitude, lng: activePin.longitude }}
                      onCloseClick={() => setActivePin(null)}
                      headerContent={
                        <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          <span className="font-mono text-blue-700">[{activePin.projectCode}]</span>
                          <span className="truncate max-w-[200px]">{activePin.name}</span>
                        </div>
                      }
                    >
                      <div className="p-1 space-y-2 text-xs text-slate-700 max-w-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-500">{activePin.sector}</span>
                          <RiskBadge level={activePin.riskLevel} score={activePin.riskScore} size="sm" />
                        </div>
                        <div className="grid grid-cols-2 gap-1 bg-slate-50 p-1.5 rounded border border-slate-200 text-[11px]">
                          <div>
                            <span className="text-slate-400 text-[9px] block uppercase">Cost Escalation</span>
                            <span className="font-mono font-bold text-rose-600">+{activePin.costOverrunPct.toFixed(1)}%</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[9px] block uppercase">Schedule Delay</span>
                            <span className="font-mono font-bold text-amber-700">{activePin.delayMonths} mo</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onSelectProject(activePin.id)}
                          className="w-full mt-1 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded text-[11px] font-semibold flex items-center justify-center gap-1"
                        >
                          View Dossier <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </InfoWindow>
                  )}
                </Map>
              </APIProvider>
            </div>
          ) : (
            /* Stylized Spatial Vector Atlas View */
            <div className="w-full h-full p-4 relative flex items-center justify-center select-none">
              <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />
              <svg
                viewBox={`0 0 ${mapWidth} ${mapHeight}`}
                className="w-full max-w-lg h-auto select-none"
                aria-label="Map of India showing infrastructure project locations"
              >
                <path
                  d="M 230,45 C 240,65 260,80 250,110 C 230,140 210,160 210,180 C 190,195 170,220 160,250 C 145,260 135,270 145,290 C 170,300 190,290 220,300 C 250,310 290,300 320,280 C 350,260 380,260 410,240 C 440,210 470,220 500,230 C 510,250 490,270 470,280 C 440,290 410,290 390,300 C 370,320 370,340 370,360 C 360,390 350,420 330,450 C 310,480 290,510 275,540 C 265,520 250,490 240,460 C 230,420 220,380 210,340 C 195,310 180,310 160,330 C 140,360 130,400 140,440 C 150,480 170,520 190,550 C 180,560 160,570 150,560 C 130,520 110,480 110,440 C 110,390 120,340 130,300 C 110,290 90,280 80,260 C 90,240 120,230 140,210 C 160,190 180,160 190,130 C 200,90 210,60 230,45 Z"
                  fill="#0F172A"
                  stroke="#334155"
                  strokeWidth="2"
                  className="transition-colors hover:fill-[#1E293B]"
                />
                <line x1="210" y1="180" x2="390" y2="300" stroke="#1E3A8A" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
                <line x1="210" y1="180" x2="160" y2="330" stroke="#1E3A8A" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
                <line x1="160" y1="330" x2="275" y2="540" stroke="#1E3A8A" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
                <line x1="390" y1="300" x2="275" y2="540" stroke="#1E3A8A" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />

                {filtered.map((proj) => {
                  const { x, y } = projectToXY(proj.latitude, proj.longitude);
                  const isSelected = activePin?.id === proj.id;
                  const pinColor = getMarkerColor(proj.riskLevel);

                  return (
                    <g
                      key={proj.id}
                      className="cursor-pointer transition-transform"
                      onClick={() => setActivePin(proj)}
                    >
                      {proj.riskLevel === 'critical' && (
                        <circle cx={x} cy={y} r="14" fill={pinColor} opacity="0.3" className="animate-ping" />
                      )}
                      {isSelected && (
                        <circle cx={x} cy={y} r="18" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="2 2" />
                      )}
                      <circle
                        cx={x}
                        cy={y}
                        r={isSelected ? 8 : 6}
                        fill={pinColor}
                        stroke="#FFFFFF"
                        strokeWidth="2"
                        className="shadow-md"
                      />
                      <text
                        x={x}
                        y={y + 16}
                        textAnchor="middle"
                        className={`text-[9px] font-mono font-bold select-none pointer-events-none ${
                          isSelected ? 'fill-amber-400 font-extrabold' : 'fill-slate-300'
                        }`}
                      >
                        {proj.projectCode}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}

          {/* Bottom Floating Legend */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-slate-300 bg-slate-900/90 backdrop-blur-xs px-3 py-2 rounded-lg border border-slate-800 shadow-md">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 ring-2 ring-rose-900" />
                <span>Critical ({projects.filter((p) => p.riskLevel === 'critical').length})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-600" />
                <span>High ({projects.filter((p) => p.riskLevel === 'high').length})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                <span>Moderate ({projects.filter((p) => p.riskLevel === 'moderate').length})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span>Low ({projects.filter((p) => p.riskLevel === 'low').length})</span>
              </span>
            </div>
            <span className="text-slate-400 hidden sm:inline">Showing {filtered.length} locations</span>
          </div>
        </div>

        {/* Selected Project Quick Inspection Drawer */}
        <div className="lg:col-span-4 p-5 bg-white flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-200">
          {activePin ? (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-mono font-bold text-blue-700 text-sm">
                    [{activePin.projectCode}]
                  </span>
                  <div className="flex items-center gap-1.5">
                    <DataQualityBadge score={activePin.dataQualityScore ?? 100} size="sm" />
                    <RiskBadge level={activePin.riskLevel} score={activePin.riskScore} size="sm" />
                  </div>
                </div>
                <h4 className="font-bold text-slate-900 text-sm leading-snug">
                  {activePin.name}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activePin.implementingAgency} · {activePin.state}
                </p>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                  Coordinates: {activePin.latitude.toFixed(4)}°N, {activePin.longitude.toFixed(4)}°E
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-semibold block">
                    Revised Outlay
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{activePin.revisedCost.toLocaleString()} Cr
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-semibold block">
                    Escalation
                  </span>
                  <span className="font-mono font-bold text-rose-600">
                    +{activePin.costOverrunPct.toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-semibold block">
                    Schedule Delay
                  </span>
                  <span className="font-mono font-bold text-amber-700">
                    {activePin.delayMonths} Months
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-semibold block">
                    Progress (Phys/Fin)
                  </span>
                  <span className="font-mono font-bold text-slate-800">
                    {activePin.physicalProgress}% / {activePin.financialProgress}%
                  </span>
                </div>
              </div>

              <div>
                <h5 className="text-[11px] font-bold uppercase text-slate-600 mb-1">
                  Primary Risk Attribution:
                </h5>
                <p className="text-xs text-slate-700 bg-amber-50/70 p-2.5 rounded-md border border-amber-200 leading-relaxed">
                  {activePin.riskAssessment.topDrivers[0]?.description || 'Normal monitoring profile with steady milestone adherence.'}
                </p>
              </div>

              <button
                type="button"
                id="btn-open-dossier"
                onClick={() => onSelectProject(activePin.id)}
                className="w-full py-2 bg-blue-700 hover:bg-blue-800 text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>Open Full Analytical Dossier</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
              <MapPin className="w-10 h-10 text-slate-300 stroke-1" />
              <p className="text-xs font-medium text-slate-600">No project location selected</p>
              <p className="text-[11px] text-slate-400 max-w-xs">
                Click any interactive marker on the map to inspect project spatial coordinates, cost variance, delays, and predictive drivers.
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3 text-blue-600" />
              Google Maps Platform
            </span>
            <span>WGS-84 Geospatial Datum</span>
          </div>
        </div>
      </div>
    </div>
  );
};
