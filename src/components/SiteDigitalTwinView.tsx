import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  MapPin,
  Layers,
  Activity,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Maximize2,
  Sliders,
  ChevronRight,
  Eye,
  Camera,
  Cpu,
  Hammer,
  Truck,
  Building2,
  HardHat,
  Search,
  Filter,
  Sparkles,
  Download,
  Info,
  Radio,
  FileCheck
} from 'lucide-react';
import { Project } from '../types';
import { RiskBadge } from './RiskBadge';

declare global {
  interface Window {
    L: any;
  }
}

export interface SiteZone {
  id: string;
  code: string;
  name: string;
  category: 'Tunnel' | 'Viaduct' | 'Bridge' | 'Station' | 'Pavement' | 'Earthworks' | 'Spillway' | 'Utilities';
  chainage: string;
  lat: number;
  lng: number;
  plannedProgress: number;
  actualProgress: number;
  status: 'completed' | 'on_track' | 'delayed' | 'critical_block';
  delayDays: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  contractor: string;
  workforce: number;
  equipment: string[];
  currentActivity: string;
  bottleneck?: string;
  sensorHealth: {
    displacement: string;
    temperature: string;
    vibration: string;
    stressFactor: string;
  };
  lastDroneSurvey: string;
}

interface SiteDigitalTwinViewProps {
  project: Project;
}

type ViewMode = 'map' | 'schematic' | 'split';
type LayerFilter = 'all' | 'delayed_only' | 'sensors_only';

export const SiteDigitalTwinView: React.FC<SiteDigitalTwinViewProps> = ({ project }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('schematic');
  const [selectedZoneId, setSelectedZoneId] = useState<string>('zone-1');
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);
  const [layerFilter, setLayerFilter] = useState<LayerFilter>('all');
  const [showSensors, setShowSensors] = useState<boolean>(true);
  const [showProgressHeatmap, setShowProgressHeatmap] = useState<boolean>(true);
  const [activeSchematicLayer, setActiveSchematicLayer] = useState<'civil' | 'systems' | 'telemetry'>('civil');
  const [inspectionSuccessNote, setInspectionSuccessNote] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<{ [id: string]: any }>({});
  const polygonsRef = useRef<{ [id: string]: any }>({});

  // Generate tailored realistic site zones for the project based on sector & physical attributes
  const siteZones = useMemo<SiteZone[]>(() => {
    const baseLat = project.latitude || 26.4499;
    const baseLng = project.longitude || 80.3319;
    const prog = project.physicalProgress || 55;
    const isDelayed = project.delayMonths > 0;
    const sec = (project.sector || '').toLowerCase();

    if (sec.includes('rail') || sec.includes('metro')) {
      return [
        {
          id: 'zone-1',
          code: 'ZN-01',
          name: 'Underground Bored Tunnel Package (TBM Shaft)',
          category: 'Tunnel',
          chainage: 'Ch 04+200 to 11+450',
          lat: baseLat + 0.008,
          lng: baseLng - 0.009,
          plannedProgress: Math.min(100, Math.round(prog * 1.05)),
          actualProgress: Math.max(10, Math.round(prog * 0.92)),
          status: isDelayed ? 'delayed' : 'on_track',
          delayDays: isDelayed ? Math.min(project.delayMonths * 8, 90) : 0,
          riskLevel: isDelayed ? 'critical' : 'moderate',
          contractor: project.contractorName || 'Larsen & Toubro Heavy Civil Infrastructure',
          workforce: 240,
          equipment: ['2x 6.65m Slurry TBMs', 'Segment Pre-cast Gantry', 'Slurry Treatment Plant'],
          currentActivity: 'Boring tunnel ring 742; segmental lining assembly & ring grouting.',
          bottleneck: isDelayed ? 'Water ingress mitigated at karst geological fissure; grouting under pressure.' : undefined,
          sensorHealth: { displacement: '1.8 mm (Stable)', temperature: '24.2 °C', vibration: '0.35 mm/s RMS', stressFactor: '72% Capacity' },
          lastDroneSurvey: '2026-08-28',
        },
        {
          id: 'zone-2',
          code: 'ZN-02',
          name: 'Elevated Viaduct & Special Steel Truss Bridge',
          category: 'Bridge',
          chainage: 'Ch 11+450 to 18+900',
          lat: baseLat + 0.004,
          lng: baseLng - 0.003,
          plannedProgress: Math.min(100, Math.round(prog * 1.15)),
          actualProgress: prog,
          status: 'on_track',
          delayDays: 0,
          riskLevel: 'moderate',
          contractor: 'Afcons – IRCON JV',
          workforce: 185,
          equipment: ['1x Launching Girder (900T)', 'Tandem Hydraulic Jacks', 'Straddle Carrier'],
          currentActivity: 'Launching 45m prestressed U-girder spans over national highway intersection.',
          sensorHealth: { displacement: '0.4 mm (Normal)', temperature: '28.5 °C', vibration: '0.12 mm/s RMS', stressFactor: '54% Capacity' },
          lastDroneSurvey: '2026-08-30',
        },
        {
          id: 'zone-3',
          code: 'ZN-03',
          name: 'Main Terminal Station & Multi-Modal Concourse',
          category: 'Station',
          chainage: 'Ch 18+900 to 20+500',
          lat: baseLat,
          lng: baseLng,
          plannedProgress: Math.min(100, Math.round(prog * 1.08)),
          actualProgress: Math.max(15, Math.round(prog * 0.88)),
          status: isDelayed ? 'critical_block' : 'delayed',
          delayDays: isDelayed ? project.delayMonths * 12 : 24,
          riskLevel: 'critical',
          contractor: 'Tata Projects Ltd',
          workforce: 310,
          equipment: ['4x Tower Cranes (12T)', 'Batching Plant 60m³/h', 'Concrete Boom Placers'],
          currentActivity: 'Concourse slab casting at Level +1; structural steel roof canopy erection.',
          bottleneck: 'Statutory fire buffer and electrical clearance pending from State Municipal Authority.',
          sensorHealth: { displacement: '2.4 mm (Watch)', temperature: '31.0 °C', vibration: '0.48 mm/s RMS', stressFactor: '81% Capacity' },
          lastDroneSurvey: '2026-08-25',
        },
        {
          id: 'zone-4',
          code: 'ZN-04',
          name: 'Ballastless Track & 25kV OHE Electrification',
          category: 'Viaduct',
          chainage: 'Ch 20+500 to 29+200',
          lat: baseLat - 0.005,
          lng: baseLng + 0.006,
          plannedProgress: Math.min(100, Math.round(prog * 0.9)),
          actualProgress: Math.max(5, Math.round(prog * 0.82)),
          status: 'on_track',
          delayDays: 14,
          riskLevel: 'low',
          contractor: 'Siemens – Alstom Mobility Consortia',
          workforce: 130,
          equipment: ['Flash Butt Rail Welding Plant', 'Track Measurement Trolley', 'OHE Wiring Wagon'],
          currentActivity: 'Continuous welded 60-E1 rail fastening and overhead contact wire tensioning.',
          sensorHealth: { displacement: '0.2 mm (Normal)', temperature: '22.0 °C', vibration: '0.08 mm/s RMS', stressFactor: '38% Capacity' },
          lastDroneSurvey: '2026-08-29',
        },
        {
          id: 'zone-5',
          code: 'ZN-05',
          name: 'Stabling Depot & Operations Control Center (OCC)',
          category: 'Utilities',
          chainage: 'Ch 29+200 to 32+800',
          lat: baseLat - 0.009,
          lng: baseLng + 0.012,
          plannedProgress: Math.min(100, Math.round(prog * 1.1)),
          actualProgress: Math.min(100, Math.round(prog * 1.02)),
          status: 'completed',
          delayDays: 0,
          riskLevel: 'low',
          contractor: 'BEML – NCC Consortium',
          workforce: 95,
          equipment: ['Automated Train Wash Plant', 'Underfloor Wheel Lathe', 'SCADA Servers'],
          currentActivity: 'SCADA telemetry synchronization and dynamic trainset parking trials.',
          sensorHealth: { displacement: '0.1 mm (Optimal)', temperature: '21.5 °C', vibration: '0.04 mm/s RMS', stressFactor: '28% Capacity' },
          lastDroneSurvey: '2026-08-31',
        },
      ];
    } else if (sec.includes('power') || sec.includes('dam') || sec.includes('water')) {
      return [
        {
          id: 'zone-1',
          code: 'ZN-01',
          name: 'Roller Compacted Concrete (RCC) Dam Wall',
          category: 'Spillway',
          chainage: 'Block 01 to Block 18',
          lat: baseLat + 0.006,
          lng: baseLng - 0.008,
          plannedProgress: Math.min(100, Math.round(prog * 1.05)),
          actualProgress: prog,
          status: 'on_track',
          delayDays: 0,
          riskLevel: 'moderate',
          contractor: 'Jaiprakash Associates / NHPC',
          workforce: 420,
          equipment: ['Continuous Pugmill Mixer', 'Chilled Water Plant 800T', 'Radial Cable Cranes'],
          currentActivity: 'RCC mass pour at Block 7; thermistor core temperature monitoring.',
          sensorHealth: { displacement: '1.2 mm (Normal)', temperature: '19.4 °C', vibration: '0.18 mm/s RMS', stressFactor: '62% Capacity' },
          lastDroneSurvey: '2026-08-27',
        },
        {
          id: 'zone-2',
          code: 'ZN-02',
          name: 'Head Race Tunnel (HRT) & Surge Shaft',
          category: 'Tunnel',
          chainage: 'Ch 00+000 to 07+800',
          lat: baseLat + 0.002,
          lng: baseLng - 0.002,
          plannedProgress: Math.min(100, Math.round(prog * 1.2)),
          actualProgress: Math.max(15, Math.round(prog * 0.85)),
          status: isDelayed ? 'critical_block' : 'delayed',
          delayDays: isDelayed ? project.delayMonths * 15 : 45,
          riskLevel: 'critical',
          contractor: 'Patel Engineering',
          workforce: 210,
          equipment: ['Drill Jumbos (3-Boom)', 'Shotcrete Robotic Manipulators', 'Heavy Muck Dumpers'],
          currentActivity: 'Surge shaft excavation benching; rock bolting & steel rib installation.',
          bottleneck: 'Fragile Himalayan thrust zone geological cavity; pre-grouting mandatory.',
          sensorHealth: { displacement: '4.8 mm (Critical Alert)', temperature: '26.8 °C', vibration: '0.82 mm/s RMS', stressFactor: '88% Capacity' },
          lastDroneSurvey: '2026-08-26',
        },
        {
          id: 'zone-3',
          code: 'ZN-03',
          name: 'Underground Powerhouse & Transformer Cavern',
          category: 'Utilities',
          chainage: 'Cavern Level EL 485m',
          lat: baseLat - 0.003,
          lng: baseLng + 0.004,
          plannedProgress: Math.min(100, Math.round(prog * 1.02)),
          actualProgress: Math.max(20, Math.round(prog * 0.94)),
          status: 'on_track',
          delayDays: 10,
          riskLevel: 'moderate',
          contractor: 'BHEL Power Sector',
          workforce: 160,
          equipment: ['EOT Overhead Cranes (350T)', 'Turbine Spiral Casing Rig', 'Prestress Cable Grouting'],
          currentActivity: 'Francis turbine runner positioning and generator stator winding.',
          sensorHealth: { displacement: '0.9 mm (Stable)', temperature: '21.0 °C', vibration: '0.22 mm/s RMS', stressFactor: '58% Capacity' },
          lastDroneSurvey: '2026-08-30',
        },
        {
          id: 'zone-4',
          code: 'ZN-04',
          name: '400kV Gas Insulated Switchyard (GIS) & Transmission',
          category: 'Utilities',
          chainage: 'Substation Yard East',
          lat: baseLat - 0.007,
          lng: baseLng + 0.009,
          plannedProgress: Math.min(100, Math.round(prog * 1.1)),
          actualProgress: Math.min(100, Math.round(prog * 1.06)),
          status: 'completed',
          delayDays: 0,
          riskLevel: 'low',
          contractor: 'Power Grid Corporation of India (PGCIL)',
          workforce: 85,
          equipment: ['SF6 Gas Handling Units', 'High Voltage Test Sets', 'Tower Winch Hoists'],
          currentActivity: 'Switchyard busbar energization trials and optical ground wire (OPGW) splicing.',
          sensorHealth: { displacement: '0.1 mm (Optimal)', temperature: '25.0 °C', vibration: '0.05 mm/s RMS', stressFactor: '30% Capacity' },
          lastDroneSurvey: '2026-08-29',
        },
      ];
    } else {
      // Default Highway / Corridor / Civil Project
      return [
        {
          id: 'zone-1',
          code: 'ZN-01',
          name: 'Main Alignment Earthworks & Sub-base Formation',
          category: 'Earthworks',
          chainage: 'Km 00+000 to Km 18+500',
          lat: baseLat + 0.007,
          lng: baseLng - 0.007,
          plannedProgress: Math.min(100, Math.round(prog * 1.05)),
          actualProgress: prog,
          status: 'on_track',
          delayDays: 0,
          riskLevel: 'low',
          contractor: project.contractorName || 'Dilip Buildcon Ltd',
          workforce: 175,
          equipment: ['Motor Graders (160HP)', 'Vibratory Soil Compactors', 'Articulated Water Tankers'],
          currentActivity: 'Granular Sub-Base (GSB) compaction and CBR soil testing.',
          sensorHealth: { displacement: '0.3 mm (Normal)', temperature: '32.0 °C', vibration: '0.15 mm/s RMS', stressFactor: '45% Capacity' },
          lastDroneSurvey: '2026-08-30',
        },
        {
          id: 'zone-2',
          code: 'ZN-02',
          name: 'Major Multi-Level Interchange & Cloverleaf Flyover',
          category: 'Bridge',
          chainage: 'Km 18+500 to Km 24+200',
          lat: baseLat + 0.002,
          lng: baseLng - 0.001,
          plannedProgress: Math.min(100, Math.round(prog * 1.15)),
          actualProgress: Math.max(10, Math.round(prog * 0.85)),
          status: isDelayed ? 'critical_block' : 'delayed',
          delayDays: isDelayed ? project.delayMonths * 14 : 35,
          riskLevel: 'critical',
          contractor: 'Ashoka Buildcon Ltd',
          workforce: 220,
          equipment: ['Hydraulic Rotary Piling Rigs', 'Concrete Batching Unit', 'Precast Girder Yard'],
          currentActivity: 'Pier cap concrete casting; 32m precast I-girder erection over bypass.',
          bottleneck: 'High-voltage 220kV transmission line shifting pending with State Discom.',
          sensorHealth: { displacement: '2.1 mm (Watch)', temperature: '30.5 °C', vibration: '0.52 mm/s RMS', stressFactor: '78% Capacity' },
          lastDroneSurvey: '2026-08-27',
        },
        {
          id: 'zone-3',
          code: 'ZN-03',
          name: 'Dense Bituminous Macadam (DBM) & Concrete Pavement',
          category: 'Pavement',
          chainage: 'Km 24+200 to Km 38+000',
          lat: baseLat - 0.003,
          lng: baseLng + 0.005,
          plannedProgress: Math.min(100, Math.round(prog * 1.0)),
          actualProgress: Math.max(15, Math.round(prog * 0.94)),
          status: 'on_track',
          delayDays: 8,
          riskLevel: 'moderate',
          contractor: 'PNC Infratech',
          workforce: 140,
          equipment: ['Electronic Sensor Pavers', 'Hot Mix Asphalt Plant (200 TPH)', 'Tandem Steel Rollers'],
          currentActivity: 'Paving 50mm Bituminous Concrete wearing coat with polymer modified binder.',
          sensorHealth: { displacement: '0.2 mm (Normal)', temperature: '145 °C (Mix Temp)', vibration: '0.10 mm/s RMS', stressFactor: '40% Capacity' },
          lastDroneSurvey: '2026-08-29',
        },
        {
          id: 'zone-4',
          code: 'ZN-04',
          name: 'Electronic Toll Plaza, Weigh-In-Motion & ATMS Facility',
          category: 'Utilities',
          chainage: 'Km 38+000 to Km 42+600',
          lat: baseLat - 0.008,
          lng: baseLng + 0.010,
          plannedProgress: Math.min(100, Math.round(prog * 1.1)),
          actualProgress: Math.min(100, Math.round(prog * 1.04)),
          status: 'completed',
          delayDays: 0,
          riskLevel: 'low',
          contractor: 'L&T Technology Services',
          workforce: 65,
          equipment: ['FASTag RFID Scanners', 'Optical Fiber Splicers', 'Variable Message Signs (VMS)'],
          currentActivity: 'FASTag lane automated toll reconciliation and speed camera calibration.',
          sensorHealth: { displacement: '0.05 mm (Optimal)', temperature: '24.0 °C', vibration: '0.02 mm/s RMS', stressFactor: '20% Capacity' },
          lastDroneSurvey: '2026-08-31',
        },
      ];
    }
  }, [project]);

  // Selected Zone
  const selectedZone = useMemo(() => {
    return siteZones.find((z) => z.id === selectedZoneId) || siteZones[0];
  }, [siteZones, selectedZoneId]);

  // Filtered Zones
  const visibleZones = useMemo(() => {
    if (layerFilter === 'delayed_only') {
      return siteZones.filter((z) => z.status === 'delayed' || z.status === 'critical_block');
    }
    if (layerFilter === 'sensors_only') {
      return siteZones.filter((z) => z.sensorHealth);
    }
    return siteZones;
  }, [siteZones, layerFilter]);

  // Leaflet Map Initialization
  useEffect(() => {
    if (viewMode === 'schematic') return;
    if (!mapContainerRef.current) return;
    const L = window.L;
    if (!L) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [selectedZone.lat, selectedZone.lng],
        zoom: 14,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors | MoSPI Digital Twin',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.invalidateSize();
    }

    const map = mapInstanceRef.current;

    // Clear old markers
    Object.values(markersRef.current).forEach((m: any) => m?.remove?.());
    markersRef.current = {};
    Object.values(polygonsRef.current).forEach((p: any) => p?.remove?.());
    polygonsRef.current = {};

    // Add zone markers and footprints
    visibleZones.forEach((z) => {
      const isSelected = z.id === selectedZoneId;
      const markerColor =
        z.status === 'critical_block'
          ? '#DC2626'
          : z.status === 'delayed'
          ? '#EA580C'
          : z.status === 'completed'
          ? '#16A34A'
          : '#2563EB';

      // Zone Boundary Circle / Polygon Footprint
      const circle = L.circle([z.lat, z.lng], {
        color: markerColor,
        fillColor: markerColor,
        fillOpacity: isSelected ? 0.35 : 0.15,
        radius: isSelected ? 220 : 160,
        weight: isSelected ? 3 : 1.5,
      }).addTo(map);

      circle.on('click', () => {
        setSelectedZoneId(z.id);
      });
      polygonsRef.current[z.id] = circle;

      // Custom HTML Pin Marker
      const customIcon = L.divIcon({
        className: 'custom-site-zone-marker',
        html: `
          <div style="
            background: ${markerColor};
            color: #FFFFFF;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 700;
            font-family: monospace;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
            border: 2px solid #FFFFFF;
            white-space: nowrap;
            transform: translate(-50%, -100%);
            display: flex;
            align-items: center;
            gap: 4px;
            cursor: pointer;
            outline: ${isSelected ? '3px solid #3b82f6' : 'none'};
          ">
            <span>${z.code}</span>
            <span style="font-size: 9px; opacity: 0.9;">(${z.actualProgress}%)</span>
          </div>
        `,
        iconSize: [0, 0],
      });

      const marker = L.marker([z.lat, z.lng], { icon: customIcon }).addTo(map);
      marker.on('click', () => {
        setSelectedZoneId(z.id);
        map.setView([z.lat, z.lng], 15, { animate: true });
      });

      markersRef.current[z.id] = marker;
    });

    // Fly to active zone
    if (selectedZone) {
      map.setView([selectedZone.lat, selectedZone.lng], 14, { animate: true });
    }
  }, [viewMode, visibleZones, selectedZoneId, selectedZone]);

  const handleSimulateInspection = () => {
    setInspectionSuccessNote(`Digital inspection logged for ${selectedZone.code}: Workfront telemetry certified at ${selectedZone.actualProgress}% completion.`);
    setTimeout(() => setInspectionSuccessNote(null), 5000);
  };

  const getStatusColor = (status: SiteZone['status']) => {
    switch (status) {
      case 'completed':
        return { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', fill: '#10b981' };
      case 'on_track':
        return { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200', fill: '#2563eb' };
      case 'delayed':
        return { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', fill: '#f59e0b' };
      case 'critical_block':
        return { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200', fill: '#ef4444' };
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
      {/* Top Banner & Control Deck */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                Live Site Digital Twin · IoT & CAD Telemetry
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-300 font-mono">
                {project.projectCode} · {siteZones.length} Active Workfronts
              </span>
            </div>

            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-blue-400" />
              Spatial Progress Twin & Engineering Schematics
            </h3>

            <p className="text-xs text-slate-300">
              Interactive 2D geospatial mapping and structural schematics overlay monitoring package-level progress, sensor strain, and physical bottlenecks.
            </p>
          </div>

          {/* View Mode Toggle Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 bg-slate-800/90 border border-slate-700 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode('schematic')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === 'schematic'
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Schematics</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === 'map'
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>2D Map View</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`px-3 py-1.5 rounded-lg transition-all hidden sm:flex items-center gap-1.5 ${
                  viewMode === 'split'
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Split Dual-View</span>
              </button>
            </div>
          </div>
        </div>

        {/* Site KPIs Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-700/60 text-xs">
          <div className="bg-slate-800/60 border border-slate-700/80 p-2.5 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Monitored Workfronts
            </span>
            <span className="text-base font-bold font-mono text-white">
              {siteZones.length} Site Zones
            </span>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/80 p-2.5 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Active Workforce
            </span>
            <span className="text-base font-bold font-mono text-emerald-400">
              {siteZones.reduce((sum, z) => sum + z.workforce, 0)} Personnel
            </span>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/80 p-2.5 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Critical Bottleneck
            </span>
            <span className="text-xs font-bold text-rose-300 truncate block">
              {siteZones.find((z) => z.status === 'critical_block')?.code || 'None Logged'}
            </span>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/80 p-2.5 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              CAD Model Version
            </span>
            <span className="text-xs font-mono font-semibold text-blue-300">
              BIM Level 3 / IFC 4.3
            </span>
          </div>
        </div>
      </div>

      {/* Secondary Controls Bar */}
      <div className="px-5 py-2 flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-700 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            Filter Workfronts:
          </span>
          <div className="flex items-center gap-1">
            {[
              { id: 'all', label: `All Zones (${siteZones.length})` },
              { id: 'delayed_only', label: 'Delayed / Critical Only' },
              { id: 'sensors_only', label: 'IoT Telemetry Active' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setLayerFilter(f.id as LayerFilter)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  layerFilter === f.id
                    ? 'bg-blue-700 text-white font-bold shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Layer Toggles */}
        <div className="flex items-center gap-4 text-xs">
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium">
            <input
              type="checkbox"
              checked={showProgressHeatmap}
              onChange={(e) => setShowProgressHeatmap(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
            />
            <span>Progress Heatmap</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium">
            <input
              type="checkbox"
              checked={showSensors}
              onChange={(e) => setShowSensors(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
            />
            <span>Sensors & Strain</span>
          </label>
        </div>
      </div>

      {inspectionSuccessNote && (
        <div className="mx-5 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{inspectionSuccessNote}</span>
        </div>
      )}

      {/* Main Digital Twin Visuals Body */}
      <div className="px-5 pb-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Visual Presentation Area (Map / Schematics / Split) */}
          <div className={`${viewMode === 'split' ? 'lg:col-span-8' : 'lg:col-span-8'} space-y-4`}>
            {/* SCHEMATICS MODE & SPLIT VIEW */}
            {(viewMode === 'schematic' || viewMode === 'split') && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-white shadow-md relative overflow-hidden">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                      Engineering CAD Schematic & Longitudinal Elevation
                    </span>
                  </div>

                  {/* Schematic Layer Selector */}
                  <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg text-[11px] font-mono">
                    <button
                      onClick={() => setActiveSchematicLayer('civil')}
                      className={`px-2 py-0.5 rounded ${
                        activeSchematicLayer === 'civil' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Civil & Structural
                    </button>
                    <button
                      onClick={() => setActiveSchematicLayer('systems')}
                      className={`px-2 py-0.5 rounded ${
                        activeSchematicLayer === 'systems' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      MEP & Systems
                    </button>
                    <button
                      onClick={() => setActiveSchematicLayer('telemetry')}
                      className={`px-2 py-0.5 rounded ${
                        activeSchematicLayer === 'telemetry' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Strain Hotspots
                    </button>
                  </div>
                </div>

                {/* Interactive SVG Engineering Schematic Diagram */}
                <div className="w-full bg-slate-950/90 border border-slate-800/80 rounded-xl p-4 overflow-x-auto">
                  <div className="min-w-[620px]">
                    <svg viewBox="0 0 720 220" className="w-full h-auto select-none">
                      {/* Technical Grid Pattern */}
                      <defs>
                        <pattern id="cadGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                        </pattern>
                        <linearGradient id="gradCompleted" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#059669" />
                          <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                        <linearGradient id="gradDelayed" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#d97706" />
                          <stop offset="100%" stopColor="#f59e0b" />
                        </linearGradient>
                        <linearGradient id="gradCritical" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#dc2626" />
                          <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                        <linearGradient id="gradOnTrack" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#1d4ed8" />
                          <stop offset="100%" stopColor="#3b82f6" />
                        </linearGradient>
                      </defs>

                      <rect width="720" height="220" fill="url(#cadGrid)" rx="8" />

                      {/* Datum Line & Chainage Axis */}
                      <line x1="30" y1="170" x2="690" y2="170" stroke="#475569" strokeWidth="1.5" strokeDasharray="3 3" />
                      <text x="30" y="195" fill="#64748b" fontSize="10" fontFamily="monospace">Ch 00+000</text>
                      <text x="345" y="195" fill="#64748b" fontSize="10" fontFamily="monospace">Alignment Baseline (EL +420m)</text>
                      <text x="640" y="195" fill="#64748b" fontSize="10" fontFamily="monospace">Ch 35+000</text>

                      {/* Render Zone Schematic Blocks */}
                      {siteZones.map((z, idx) => {
                        const blockWidth = 110;
                        const blockGap = 20;
                        const startX = 40 + idx * (blockWidth + blockGap);
                        const isSelected = z.id === selectedZoneId;
                        const isHovered = z.id === hoveredZoneId;
                        const progressHeight = Math.round((z.actualProgress / 100) * 80);
                        const statusColors = getStatusColor(z.status);

                        return (
                          <g
                            key={z.id}
                            className="cursor-pointer transition-all duration-150"
                            onClick={() => setSelectedZoneId(z.id)}
                            onMouseEnter={() => setHoveredZoneId(z.id)}
                            onMouseLeave={() => setHoveredZoneId(null)}
                          >
                            {/* Selection Glow Box */}
                            {isSelected && (
                              <rect
                                x={startX - 6}
                                y={30}
                                width={blockWidth + 12}
                                height={135}
                                fill="#3b82f6"
                                fillOpacity="0.12"
                                stroke="#60a5fa"
                                strokeWidth="1.5"
                                rx="8"
                                strokeDasharray="4 2"
                              />
                            )}

                            {/* Outer Structural Envelope */}
                            <rect
                              x={startX}
                              y={40}
                              width={blockWidth}
                              height={110}
                              fill="#0f172a"
                              stroke={isSelected ? '#3b82f6' : isHovered ? '#94a3b8' : '#334155'}
                              strokeWidth={isSelected ? '2' : '1'}
                              rx="6"
                            />

                            {/* Physical Progress Fill */}
                            <rect
                              x={startX + 3}
                              y={40 + (110 - progressHeight - 3)}
                              width={blockWidth - 6}
                              height={progressHeight}
                              fill={
                                z.status === 'completed'
                                  ? 'url(#gradCompleted)'
                                  : z.status === 'critical_block'
                                  ? 'url(#gradCritical)'
                                  : z.status === 'delayed'
                                  ? 'url(#gradDelayed)'
                                  : 'url(#gradOnTrack)'
                              }
                              opacity={showProgressHeatmap ? '0.75' : '0.4'}
                              rx="3"
                            />

                            {/* Zone Header Label */}
                            <rect
                              x={startX + 4}
                              y={44}
                              width={blockWidth - 8}
                              height={18}
                              fill="#1e293b"
                              rx="4"
                            />
                            <text
                              x={startX + blockWidth / 2}
                              y={57}
                              fill="#f8fafc"
                              fontSize="10"
                              fontWeight="bold"
                              fontFamily="monospace"
                              textAnchor="middle"
                            >
                              {z.code} · {z.category}
                            </text>

                            {/* Progress Percentage Display */}
                            <text
                              x={startX + blockWidth / 2}
                              y={98}
                              fill="#ffffff"
                              fontSize="16"
                              fontWeight="900"
                              fontFamily="monospace"
                              textAnchor="middle"
                            >
                              {z.actualProgress}%
                            </text>
                            <text
                              x={startX + blockWidth / 2}
                              y={112}
                              fill="#94a3b8"
                              fontSize="9"
                              fontFamily="monospace"
                              textAnchor="middle"
                            >
                              Plan: {z.plannedProgress}%
                            </text>

                            {/* Chainage Marker */}
                            <text
                              x={startX + blockWidth / 2}
                              y={142}
                              fill="#cbd5e1"
                              fontSize="8.5"
                              fontFamily="monospace"
                              textAnchor="middle"
                            >
                              {z.chainage.split(' ')[1] || z.chainage}
                            </text>

                            {/* Telemetry Sensor Indicator Pulse */}
                            {showSensors && (
                              <g transform={`translate(${startX + blockWidth - 12}, 48)`}>
                                <circle
                                  r="4"
                                  fill={z.status === 'critical_block' ? '#ef4444' : '#10b981'}
                                  className="animate-ping opacity-75"
                                />
                                <circle
                                  r="3"
                                  fill={z.status === 'critical_block' ? '#ef4444' : '#10b981'}
                                />
                              </g>
                            )}

                            {/* Bottleneck Warning Icon on Schematic */}
                            {z.status === 'critical_block' && (
                              <g transform={`translate(${startX + 8}, 48)`}>
                                <circle r="4" fill="#ef4444" />
                                <text x="0" y="3" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">!</text>
                              </g>
                            )}
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>

                {/* Schematic Legend */}
                <div className="flex flex-wrap items-center justify-between gap-2 mt-3 text-[11px] text-slate-400 font-mono">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
                      Completed
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-xs bg-blue-500" />
                      On Schedule
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-xs bg-amber-500" />
                      Lagging (&gt;10d)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-xs bg-rose-500" />
                      Critical Bottleneck
                    </span>
                  </div>

                  <span className="text-slate-500">
                    Click any zone block to inspect telemetric health & contractors
                  </span>
                </div>
              </div>
            )}

            {/* 2D GEOSPATIAL MAP VIEW & SPLIT VIEW */}
            {(viewMode === 'map' || viewMode === 'split') && (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-700" />
                    <span className="font-bold text-slate-800">
                      2D GIS Spatial Footprint & Workfront Zones
                    </span>
                  </div>
                  <span className="text-slate-500 font-mono text-[11px]">
                    Center: {selectedZone.lat.toFixed(4)}°N, {selectedZone.lng.toFixed(4)}°E
                  </span>
                </div>

                <div
                  ref={mapContainerRef}
                  className="w-full h-80 sm:h-96 relative z-0 bg-slate-100"
                />

                <div className="p-3 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
                  <span>
                    Interactive Leaflet Site Map: Click pins or circle boundaries to isolate workfronts.
                  </span>
                  <span className="font-mono text-slate-500">
                    Active: {selectedZone.code} ({selectedZone.name})
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right 4 Columns: Zone Detail Inspector Panel */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-xs bg-blue-100 text-blue-900 px-2 py-0.5 rounded">
                      {selectedZone.code}
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getStatusColor(selectedZone.status).bg} ${getStatusColor(selectedZone.status).text} ${getStatusColor(selectedZone.status).border}`}>
                      {selectedZone.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">
                    {selectedZone.name}
                  </h4>
                  <span className="text-[11px] font-mono text-slate-500">
                    Chainage: {selectedZone.chainage}
                  </span>
                </div>

                <RiskBadge level={selectedZone.riskLevel} score={selectedZone.riskLevel === 'critical' ? 85 : 55} size="sm" />
              </div>

              {/* Progress Gauges */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-600">Physical Progress:</span>
                  <span className="font-mono font-bold text-blue-800">
                    {selectedZone.actualProgress}% <span className="text-slate-400 font-normal">/ Plan: {selectedZone.plannedProgress}%</span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      selectedZone.status === 'completed'
                        ? 'bg-emerald-600'
                        : selectedZone.status === 'critical_block'
                        ? 'bg-rose-600'
                        : 'bg-blue-600'
                    }`}
                    style={{ width: `${selectedZone.actualProgress}%` }}
                  />
                </div>
                {selectedZone.delayDays > 0 && (
                  <div className="flex items-center justify-between text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded">
                    <span>Slippage from Contract Baseline:</span>
                    <span className="font-mono font-bold">+{selectedZone.delayDays} Days</span>
                  </div>
                )}
              </div>

              {/* Bottleneck Warning Callout */}
              {selectedZone.bottleneck && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-900">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Critical Workfront Bottleneck</span>
                  </div>
                  <p className="text-xs text-rose-800 leading-relaxed">
                    {selectedZone.bottleneck}
                  </p>
                </div>
              )}

              {/* Contractor & Deployment */}
              <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                <h5 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <HardHat className="w-3.5 h-3.5 text-blue-600" />
                  EPC Execution Particulars
                </h5>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Contractor:</span>
                    <span className="font-medium text-slate-800 text-right truncate max-w-[170px]">{selectedZone.contractor}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Workforce On Site:</span>
                    <span className="font-mono font-bold text-slate-800">{selectedZone.workforce} Personnel</span>
                  </div>

                  <div className="py-1">
                    <span className="text-slate-500 block mb-1">Heavy Machinery Deployed:</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedZone.equipment.map((eq, i) => (
                        <span key={i} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-mono">
                          {eq}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sensor Telemetry */}
              <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                <h5 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                  Structural IoT Sensor Array
                </h5>

                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                    <span className="text-slate-400 block">Displacement</span>
                    <span className="font-bold text-slate-800">{selectedZone.sensorHealth.displacement}</span>
                  </div>
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                    <span className="text-slate-400 block">Temperature</span>
                    <span className="font-bold text-slate-800">{selectedZone.sensorHealth.temperature}</span>
                  </div>
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                    <span className="text-slate-400 block">Vibration RMS</span>
                    <span className="font-bold text-slate-800">{selectedZone.sensorHealth.vibration}</span>
                  </div>
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                    <span className="text-slate-400 block">Structural Load</span>
                    <span className="font-bold text-blue-700">{selectedZone.sensorHealth.stressFactor}</span>
                  </div>
                </div>
              </div>

              {/* Action Deck */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleSimulateInspection}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs rounded-lg transition-colors shadow-2xs cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-blue-200" />
                  <span>Log Telemetric Inspection Audit</span>
                </button>

                <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 font-mono">
                  <span>Last Drone Survey:</span>
                  <span>{selectedZone.lastDroneSurvey}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
