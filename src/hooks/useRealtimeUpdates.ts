import { useEffect, useRef, useState, useCallback } from 'react';
import { Project, Alert, Intervention } from '../types';

export interface RealtimeEvent<T = any> {
  event_id: string;
  event_type: 
    | 'dashboard.updated'
    | 'project.updated'
    | 'risk.updated'
    | 'alert.created'
    | 'alert.status_changed'
    | 'intervention.updated'
    | 'sync.progress'
    | 'data.freshness'
    | 'notification.created';
  timestamp: string;
  entity_type: string;
  entity_id: string;
  ministry_id?: number | string;
  payload: T;
}

export interface UseRealtimeUpdatesOptions {
  userId?: string;
  role?: string;
  onProjectUpdate?: (project: Partial<Project>) => void;
  onRiskUpdate?: (projectId: string, riskScore: number, riskLevel: any) => void;
  onAlertCreated?: (alert: Alert) => void;
  onAlertStatusChanged?: (alertId: string, status: string, assignedTo?: string) => void;
  onInterventionUpdated?: (intervention: Intervention) => void;
  onFreshnessUpdate?: (data: { lastSyncedAt: string; status: string }) => void;
}

export function useRealtimeUpdates({
  userId = 'u-1',
  role = 'monitoring_officer',
  onProjectUpdate,
  onRiskUpdate,
  onAlertCreated,
  onAlertStatusChanged,
  onInterventionUpdated,
  onFreshnessUpdate,
}: UseRealtimeUpdatesOptions) {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'reconnecting' | 'fallback_sse' | 'disconnected'>('connecting');
  const [transport, setTransport] = useState<'ws' | 'sse' | 'none'>('none');
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const sseRef = useRef<EventSource | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountedRef = useRef(false);

  // Process incoming structured real-time events
  const handleEvent = useCallback((event: RealtimeEvent) => {
    if (!event || !event.event_type) return;
    setLastEvent(event);

    switch (event.event_type) {
      case 'risk.updated':
        if (event.payload?.project_id && typeof event.payload?.risk_score === 'number') {
          onRiskUpdate?.(event.payload.project_id, event.payload.risk_score, event.payload.risk_level);
        }
        break;

      case 'project.updated':
        if (event.payload) {
          onProjectUpdate?.(event.payload);
        }
        break;

      case 'alert.created':
        if (event.payload) {
          onAlertCreated?.(event.payload);
        }
        break;

      case 'alert.status_changed':
        if (event.payload?.alert_id && event.payload?.status) {
          onAlertStatusChanged?.(event.payload.alert_id, event.payload.status, event.payload.assignedTo);
        }
        break;

      case 'intervention.updated':
        if (event.payload) {
          onInterventionUpdated?.(event.payload);
        }
        break;

      case 'data.freshness':
        if (event.payload) {
          onFreshnessUpdate?.(event.payload);
        }
        break;

      default:
        break;
    }
  }, [onProjectUpdate, onRiskUpdate, onAlertCreated, onAlertStatusChanged, onInterventionUpdated, onFreshnessUpdate]);

  // Connect via Server-Sent Events as reliable fallback
  const connectSSE = useCallback((token: string) => {
    if (isUnmountedRef.current) return;

    try {
      if (sseRef.current) {
        sseRef.current.close();
      }

      const sseUrl = `/api/v1/realtime/events?token=${encodeURIComponent(token)}`;
      const eventSource = new EventSource(sseUrl);
      sseRef.current = eventSource;

      eventSource.onopen = () => {
        if (isUnmountedRef.current) return;
        setConnectionStatus('connected');
        setTransport('sse');
        reconnectAttemptRef.current = 0;
      };

      eventSource.onmessage = (e) => {
        if (isUnmountedRef.current) return;
        try {
          const parsed = JSON.parse(e.data);
          handleEvent(parsed);
        } catch {
          // Ignore parse errors or heartbeats
        }
      };

      eventSource.onerror = () => {
        if (isUnmountedRef.current) return;
        eventSource.close();
        setConnectionStatus('disconnected');
        setTransport('none');
      };
    } catch {
      setConnectionStatus('disconnected');
      setTransport('none');
    }
  }, [handleEvent]);

  // Connect via WebSocket
  const connectWS = useCallback(async () => {
    if (isUnmountedRef.current) return;

    try {
      // 1. Fetch short-lived token from backend
      let token = '';
      try {
        const res = await fetch('/api/v1/realtime/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, role }),
        });
        if (res.ok) {
          const data = await res.json();
          token = data.token;
        }
      } catch {
        // Fallback to unauthenticated tokenless connect if backend REST endpoint is unavailable
      }

      if (isUnmountedRef.current) return;

      // 2. Build WebSocket URL preventing mixed-content issues
      const isHttps = window.location.protocol === 'https:';
      const wsProtocol = isHttps ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${wsProtocol}//${host}/api/v1/realtime/ws${token ? `?token=${encodeURIComponent(token)}` : ''}`;

      if (wsRef.current) {
        wsRef.current.close();
      }

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (isUnmountedRef.current) return;
        setConnectionStatus('connected');
        setTransport('ws');
        reconnectAttemptRef.current = 0;

        // Periodic ping to keep socket alive through proxy timeouts
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 25000);
      };

      ws.onmessage = (e) => {
        if (isUnmountedRef.current) return;
        try {
          const parsed = JSON.parse(e.data);
          handleEvent(parsed);
        } catch {
          // Ignore invalid JSON safely
        }
      };

      ws.onerror = () => {
        // Fallback immediately to SSE if WebSocket handshake fails or is blocked by reverse-proxy
        if (!isUnmountedRef.current && transport !== 'sse') {
          console.warn('[Realtime] WebSocket connection failed. Falling back to Server-Sent Events.');
          setConnectionStatus('fallback_sse');
          connectSSE(token);
        }
      };

      ws.onclose = () => {
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        if (isUnmountedRef.current) return;

        // Auto reconnect with exponential backoff and jitter
        if (transport !== 'sse') {
          setConnectionStatus('reconnecting');
          const attempt = reconnectAttemptRef.current;
          reconnectAttemptRef.current += 1;

          // Max retry delay capped at 15s with random jitter to prevent reconnect storms
          const delay = Math.min(15000, 1000 * Math.pow(1.5, attempt)) + Math.floor(Math.random() * 500);
          
          if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = setTimeout(() => {
            if (!isUnmountedRef.current) {
              connectWS();
            }
          }, delay);
        }
      };
    } catch {
      if (!isUnmountedRef.current) {
        setConnectionStatus('fallback_sse');
        connectSSE('');
      }
    }
  }, [userId, role, transport, connectSSE, handleEvent]);

  // Handle browser tab visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
          connectWS();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [connectWS]);

  // Main lifecycle initiation
  useEffect(() => {
    isUnmountedRef.current = false;
    connectWS();

    return () => {
      isUnmountedRef.current = true;
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted');
        wsRef.current = null;
      }
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
    };
  }, [connectWS]);

  return {
    connectionStatus,
    transport,
    lastEvent,
    reconnect: connectWS,
  };
}
