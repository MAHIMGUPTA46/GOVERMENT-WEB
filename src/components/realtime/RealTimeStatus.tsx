import React, { useState } from 'react';
import {
  Activity,
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  Radio,
  Clock,
  CheckCircle2,
  ChevronDown,
  Layers,
  Database,
  ExternalLink
} from 'lucide-react';
import { RealtimeConnectionState, RealtimeTransportType } from '../../hooks/useRealtimeConnection';

interface RealTimeStatusProps {
  status: RealtimeConnectionState;
  transport?: RealtimeTransportType;
  latencyMs?: number;
  eventCount?: number;
  lastEventAt?: string | null;
  onReconnect?: () => void;
  className?: string;
}

export const RealTimeStatus: React.FC<RealTimeStatusProps> = ({
  status,
  transport = 'none',
  latencyMs = 12,
  eventCount = 0,
  lastEventAt,
  onReconnect,
  className = '',
}) => {
  const [showDetails, setShowDetails] = useState(false);

  // Render proper label and badge colors strictly according to connection state
  const getBadgeConfig = () => {
    switch (status) {
      case 'connected':
        return {
          label: 'Live',
          badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          dotClass: 'bg-emerald-500 animate-pulse',
          icon: <Activity className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />,
          description: `Connected via ${transport === 'websocket' ? 'WebSocket (WSS)' : transport.toUpperCase()}`,
        };
      case 'reconnecting':
        return {
          label: 'Reconnecting',
          badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
          dotClass: 'bg-amber-500 animate-ping',
          icon: <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />,
          description: 'Connection interrupted. Attempting exponential backoff reconnect...',
        };
      case 'polling_fallback':
        return {
          label: 'Polling fallback',
          badgeClass: 'bg-sky-50 text-sky-800 border-sky-300',
          dotClass: 'bg-sky-500',
          icon: <Radio className="w-3.5 h-3.5 text-sky-600" />,
          description: 'WebSockets & SSE restricted by network. Active background polling fallback.',
        };
      case 'authentication_failed':
        return {
          label: 'Session expired',
          badgeClass: 'bg-rose-50 text-rose-800 border-rose-300',
          dotClass: 'bg-rose-500',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />,
          description: 'Real-time token expired or invalid. Please re-authenticate.',
        };
      case 'degraded':
        return {
          label: 'Degraded',
          badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
          dotClass: 'bg-amber-500',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />,
          description: 'Redis or message broker running in local memory fallback mode.',
        };
      case 'unavailable':
      case 'disconnected':
      default:
        return {
          label: 'Real-time unavailable',
          badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
          dotClass: 'bg-slate-400',
          icon: <WifiOff className="w-3.5 h-3.5 text-slate-500" />,
          description: 'Real-time telemetry bus is currently offline.',
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <div className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={() => setShowDetails(!showDetails)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-2xs hover:opacity-90 ${config.badgeClass}`}
        title={`PAIMANA Real-Time Status: ${config.label}`}
      >
        <span className={`w-2 h-2 rounded-full ${config.dotClass}`} />
        <span>{config.label}</span>
        {status === 'connected' && transport === 'websocket' && (
          <span className="text-[10px] font-mono text-emerald-700 opacity-80 hidden sm:inline">
            WS
          </span>
        )}
        <ChevronDown className={`w-3 h-3 text-current transition-transform ${showDetails ? 'rotate-180' : ''}`} />
      </button>

      {/* Interactive Telemetry Dropdown */}
      {showDetails && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDetails(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-4 text-xs space-y-3 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-blue-700" />
                <span className="font-bold text-slate-900">Real-Time Telemetry Bus</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${config.badgeClass}`}>
                {config.label}
              </span>
            </div>

            <p className="text-[11px] text-slate-600 leading-snug">
              {config.description}
            </p>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 space-y-1.5 font-mono text-[11px]">
              <div className="flex items-center justify-between text-slate-600">
                <span className="font-sans">Transport Protocol:</span>
                <span className="font-bold text-slate-900">
                  {transport === 'websocket' ? 'WebSocket (WSS)' : transport === 'sse' ? 'Server-Sent Events (SSE)' : transport === 'polling' ? 'HTTP Polling' : 'Disconnected'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="font-sans">Endpoint:</span>
                <span className="text-blue-700 text-[10px]">
                  {transport === 'websocket' ? '/api/v1/realtime/ws' : transport === 'sse' ? '/api/v1/realtime/events' : '/api/v1/realtime/poll'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="font-sans">Ping Latency:</span>
                <span className="text-emerald-700 font-bold">~{latencyMs}ms</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="font-sans">Events Received:</span>
                <span className="text-slate-900 font-bold">{eventCount} events</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="font-sans">Last Heartbeat:</span>
                <span className="text-slate-700 text-[10px]">
                  {lastEventAt ? new Date(lastEventAt).toLocaleTimeString() : 'Just now'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => {
                  onReconnect?.();
                  setShowDetails(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-medium rounded-lg transition-colors cursor-pointer text-xs"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Force Reconnect</span>
              </button>

              <span className="text-[10px] text-slate-400 font-sans">
                MoSPI IPMD Gateway
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
