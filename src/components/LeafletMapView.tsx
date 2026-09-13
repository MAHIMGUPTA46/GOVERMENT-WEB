import React, { useEffect, useRef } from 'react';
import { Project, RiskLevel } from '../types';

interface LeafletMapViewProps {
  projects: Project[];
  activeProject: Project | null;
  onSelectProject: (project: Project) => void;
  onOpenDossier: (projectId: string) => void;
  center?: [number, number];
  zoom?: number;
}

declare global {
  interface Window {
    L: any;
  }
}

export const LeafletMapView: React.FC<LeafletMapViewProps> = ({
  projects,
  activeProject,
  onSelectProject,
  onOpenDossier,
  center = [26.4499, 80.3319], // Default to Kanpur [26.4499, 80.3319] as requested
  zoom = 6,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<{ [id: string]: any }>({});

  const getMarkerColors = (level: RiskLevel) => {
    switch (level) {
      case 'critical':
        return { bg: '#DC2626', border: '#991B1B', text: '#FFFFFF', ring: 'rgba(220, 38, 38, 0.35)' };
      case 'high':
        return { bg: '#EA580C', border: '#C2410C', text: '#FFFFFF', ring: 'rgba(234, 88, 12, 0.35)' };
      case 'moderate':
        return { bg: '#D97706', border: '#B45309', text: '#FFFFFF', ring: 'rgba(217, 119, 6, 0.35)' };
      case 'low':
        return { bg: '#16A34A', border: '#15803D', text: '#FFFFFF', ring: 'rgba(22, 163, 74, 0.35)' };
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const L = window.L;
    if (!L) return;

    if (!mapInstanceRef.current) {
      // Create map instance
      const map = L.map(mapContainerRef.current, {
        center: center,
        zoom: zoom,
        zoomControl: true,
      });

      // OpenStreetMap standard tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      // Map cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers when projects or activeProject change
  useEffect(() => {
    const L = window.L;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    // Clear old markers
    Object.values(markersRef.current).forEach((marker: any) => {
      marker.remove();
    });
    markersRef.current = {};

    projects.forEach((proj) => {
      const isSelected = activeProject?.id === proj.id;
      const colors = getMarkerColors(proj.riskLevel);
      const isKanpur = Math.abs(proj.latitude - 26.4499) < 0.05 && Math.abs(proj.longitude - 80.3319) < 0.05;

      const size = isSelected ? 32 : isKanpur ? 28 : 24;
      const pulseHtml = proj.riskLevel === 'critical' || isKanpur
        ? `<div style="position: absolute; width: ${size + 14}px; height: ${size + 14}px; top: -7px; left: -7px; border-radius: 9999px; background: ${colors.ring}; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
        : '';

      const iconHtml = `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          ${pulseHtml}
          <div style="
            width: ${size}px;
            height: ${size}px;
            border-radius: 9999px;
            background: ${colors.bg};
            border: 2.5px solid ${isSelected ? '#FFFFFF' : colors.border};
            box-shadow: 0 4px 10px rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            color: ${colors.text};
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            font-weight: 800;
            z-index: 2;
            transition: transform 0.15s ease-in-out;
          ">
            ${isKanpur ? '★' : proj.riskLevel === 'critical' ? '!' : '•'}
          </div>
          <div style="
            margin-top: 3px;
            padding: 2px 5px;
            background: rgba(15, 23, 42, 0.92);
            color: #FFFFFF;
            border: 1px solid rgba(51, 65, 85, 0.8);
            border-radius: 4px;
            font-size: 9px;
            font-family: 'JetBrains Mono', monospace;
            font-weight: 700;
            white-space: nowrap;
            box-shadow: 0 2px 4px rgba(0,0,0,0.25);
          ">
            ${proj.projectCode}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: iconHtml,
        iconSize: [size, size + 20],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([proj.latitude, proj.longitude], {
        icon: customIcon,
        zIndexOffset: isSelected ? 1000 : isKanpur ? 500 : 100,
      }).addTo(map);

      // Bind popup with full project metrics
      const popupContent = `
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; padding: 2px; min-width: 220px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-family: 'JetBrains Mono', monospace; font-weight: 800; color: #1D4ED8; font-size: 12px;">[${proj.projectCode}]</span>
            <span style="background: ${colors.bg}; color: #fff; padding: 2px 6px; border-radius: 9999px; font-size: 10px; font-weight: 700; text-transform: uppercase;">${proj.riskLevel}</span>
          </div>
          <h4 style="margin: 0 0 4px 0; font-size: 12px; font-weight: 700; color: #0F172A; line-height: 1.3;">${proj.name}</h4>
          <p style="margin: 0 0 8px 0; font-size: 11px; color: #64748B;">${proj.implementingAgency} · ${proj.state}</p>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; background: #F8FAFC; padding: 6px; border-radius: 6px; border: 1px solid #E2E8F0; font-size: 10px; margin-bottom: 8px;">
            <div>
              <span style="color: #64748B; display: block; font-size: 9px; text-transform: uppercase;">Cost Escalation</span>
              <strong style="color: #DC2626; font-family: 'JetBrains Mono', monospace;">+${proj.costOverrunPct.toFixed(1)}%</strong>
            </div>
            <div>
              <span style="color: #64748B; display: block; font-size: 9px; text-transform: uppercase;">Schedule Delay</span>
              <strong style="color: #B45309; font-family: 'JetBrains Mono', monospace;">${proj.delayMonths} mos</strong>
            </div>
          </div>
          <button
            id="leaflet-dossier-btn-${proj.id}"
            style="width: 100%; padding: 6px; background: #1D4ED8; color: white; border: none; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;"
          >
            Open Project Dossier →
          </button>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('click', () => {
        onSelectProject(proj);
      });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`leaflet-dossier-btn-${proj.id}`);
        if (btn) {
          btn.onclick = () => onOpenDossier(proj.id);
        }
      });

      markersRef.current[proj.id] = marker;
    });
  }, [projects, activeProject]);

  // Center on active project if selected
  useEffect(() => {
    if (activeProject && mapInstanceRef.current) {
      mapInstanceRef.current.setView(
        [activeProject.latitude, activeProject.longitude],
        mapInstanceRef.current.getZoom() < 8 ? 8 : mapInstanceRef.current.getZoom(),
        { animate: true }
      );

      const marker = markersRef.current[activeProject.id];
      if (marker) {
        marker.openPopup();
      }
    }
  }, [activeProject]);

  return (
    <div className="w-full h-full relative">
      <div ref={mapContainerRef} className="w-full h-full z-0" style={{ minHeight: '520px' }} />

      {/* Center on Kanpur quick button */}
      <div className="absolute top-3 right-3 z-1000 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.setView([26.4499, 80.3319], 13, { animate: true });
            }
          }}
          className="px-2.5 py-1.5 bg-white/95 hover:bg-white text-slate-800 text-xs font-semibold rounded-lg shadow-md border border-slate-200 backdrop-blur-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Zoom directly to Kanpur coordinates [26.4499, 80.3319]"
        >
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          <span>Focus Kanpur [26.45°N, 80.33°E]</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.setView([22.5, 79.5], 5, { animate: true });
            }
          }}
          className="px-2.5 py-1.5 bg-white/95 hover:bg-white text-slate-700 text-xs font-medium rounded-lg shadow-md border border-slate-200 backdrop-blur-xs transition-colors cursor-pointer text-center"
        >
          Pan-India Overview
        </button>
      </div>
    </div>
  );
};
