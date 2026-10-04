import { useEffect, useRef, useState, useCallback } from 'react';
import { Project, Alert, Intervention } from '../types';

export type RealtimeConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'authentication_failed'
  | 'unavailable'
  | 'degraded'
  | 'polling_fallback';

export type RealtimeTransportType = 'websocket' | 'sse' | 'polling' | 'none';

export interface RealtimeEvent<T = any> {
  event_id: string;
  event_type: string;
  timestamp: string;
  sequence_number?: number;
  entity_type: string;
  entity_id: string;
  ministry_id?: number | string;
  source?: string;
  schema_version?: string;
  payload: T;
}

export interface UseRealtimeConnectionOptions {
  userId?: string;
  role?: string;
  ministryId?: number | string;
  ministry?: string;
  isAuthenticated?: boolean;
  onProjectUpdate?: (project: Partial<Project>) => void;
  onProjectCreated?: (project: Project) => void;
  onRiskUpdate?: (projectId: string, riskScore: number, riskLevel: any, metadata?: any) => void;
  onAlertCreated?: (alert: Alert) => void;
  onAlertUpdated?: (alert: Alert) => void;
  onAlertResolved?: (alertId: string) => void;
  onAlertStatusChanged?: (alertId: string, status: string, assignedTo?: string) => void;
  onInterventionCreated?: (intervention: Intervention) => void;
  onInterventionUpdated?: (intervention: Intervention) => void;
  onFreshnessUpdate?: (data: { lastSyncedAt: string; status: string; monitoredProjects?: number; syncHealth?: number; activeAlerts?: number }) => void;
  onSyncProgress?: (data: { status: string; percent?: number; message?: string }) => void;
  onNotification?: (notification: { id: string; title: string; message: string; severity?: string }) => void;
  onEvent?: (event: RealtimeEvent) => void;
}

export function useRealtimeConnection({
  userId = 'u-1',
  role = 'monitoring_officer',
  ministryId,
  ministry,
  isAuthenticated = true,
  onProjectUpdate,
  onProjectCreated,
  onRiskUpdate,
  onAlertCreated,
  onAlertUpdated,
  onAlertResolved,
  onAlertStatusChanged,
  onInterventionCreated,
  onInterventionUpdated,
  onFreshnessUpdate,
  onSyncProgress,
  onNotification,
  onEvent,
}: UseRealtimeConnectionOptions = {}) {
  const [connectionStatus, setConnectionStatus] = useState<RealtimeConnectionState>('connecting');
  const [transport, setTransport] = useState<RealtimeTransportType>('none');
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const [lastEventAt, setLastEventAt] = useState<string | null>(null);
  const [eventCount, setEventCount] = useState<number>(0);
  const [latencyMs, setLatencyMs] = useState<number>(14);

  const wsRef = useRef<WebSocket | null>(null);
  const sseRef = useRef<EventSource | null>(null);
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const probeWsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountedRef = useRef(false);

  // Set for event deduplication
  const processedEventIdsRef = useRef<Set<string>>(new Set());
  // Track highest sequence number to handle out-of-order events
  const lastSequenceRef = useRef<number>(0);

  /**
   * Safe Dispatcher for incoming events with deduplication and sequence sorting
   */
  const handleEvent = useCallback((event: RealtimeEvent) => {
    if (!event || !event.event_id || !event.event_type) return;

    // Deduplication check
    if (processedEventIdsRef.current.has(event.event_id)) {
      return;
    }
    processedEventIdsRef.current.add(event.event_id);
    if (processedEventIdsRef.current.size > 500) {
      const iter = processedEventIdsRef.current.values();
      processedEventIdsRef.current.delete(iter.next().value!);
    }

    // Sequence check (if sequence number is provided)
    if (event.sequence_number && event.sequence_number < lastSequenceRef.current - 10) {
      console.warn(`[Realtime] Stale out-of-order event skipped: seq ${event.sequence_number}, current ${lastSequenceRef.current}`);
      return;
    }
    if (event.sequence_number && event.sequence_number > lastSequenceRef.current) {
      lastSequenceRef.current = event.sequence_number;
    }

    setLastEvent(event);
    setLastEventAt(event.timestamp || new Date().toISOString());
    setEventCount((prev) => prev + 1);
    onEvent?.(event);

    switch (event.event_type) {
      case 'risk.updated':
        if (event.payload?.project_id && typeof event.payload?.risk_score === 'number') {
          onRiskUpdate?.(
            event.payload.project_id,
            event.payload.risk_score,
            event.payload.risk_level,
            event.payload
          );
        }
        break;

      case 'project.created':
        if (event.payload) {
          onProjectCreated?.(event.payload);
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

      case 'alert.updated':
        if (event.payload) {
          onAlertUpdated?.(event.payload);
        }
        break;

      case 'alert.resolved':
        if (event.payload?.alert_id || event.entity_id) {
          onAlertResolved?.(event.payload?.alert_id || event.entity_id);
        }
        break;

      case 'alert.status_changed':
        if (event.payload?.alert_id && event.payload?.status) {
          onAlertStatusChanged?.(event.payload.alert_id, event.payload.status, event.payload.assignedTo);
        }
        break;

      case 'intervention.created':
        if (event.payload) {
          onInterventionCreated?.(event.payload);
        }
        break;

      case 'intervention.updated':
        if (event.payload) {
          onInterventionUpdated?.(event.payload);
        }
        break;

      case 'data.freshness':
      case 'data-quality.updated':
      case 'source.health_changed':
        if (event.payload) {
          onFreshnessUpdate?.(event.payload);
        }
        break;

      case 'sync.started':
      case 'sync.progress':
      case 'sync.completed':
      case 'sync.failed':
        if (event.payload) {
          onSyncProgress?.(event.payload);
        }
        break;

      case 'notification.created':
        if (event.payload) {
          onNotification?.(event.payload);
        }
        break;

      default:
        break;
    }
  }, [
    onEvent,
    onRiskUpdate,
    onProjectCreated,
    onProjectUpdate,
    onAlertCreated,
    onAlertUpdated,
    onAlertResolved,
    onAlertStatusChanged,
    onInterventionCreated,
    onInterventionUpdated,
    onFreshnessUpdate,
    onSyncProgress,
    onNotification,
  ]);

  /**
   * Tier 3: Polling Fallback (when both WebSockets and SSE are blocked by firewalls)
   */
  const startPollingFallback = useCallback(() => {
    if (isUnmountedRef.current) return;
    setConnectionStatus('polling_fallback');
    setTransport('polling');

    const poll = async () => {
      if (isUnmountedRef.current) return;
      try {
        const lastId = lastEvent?.event_id;
        const url = `/api/v1/realtime/poll${lastId ? `?last_event_id=${encodeURIComponent(lastId)}` : ''}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.events)) {
            data.events.forEach((ev: RealtimeEvent) => handleEvent(ev));
          }
        }
      } catch {
        // Safe silence in polling
      }
    };

    poll();
    if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    pollingTimerRef.current = setInterval(poll, 12000); // 12-second gentle polling interval
  }, [handleEvent, lastEvent]);

  /**
   * Tier 2: Server-Sent Events Fallback (SSE)
   */
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
          // Ignore heartbeats
        }
      };

      eventSource.onerror = () => {
        if (isUnmountedRef.current) return;
        eventSource.close();
        console.warn('[Realtime] SSE stream failed. Dropping to Polling Fallback.');
        startPollingFallback();
      };
    } catch {
      startPollingFallback();
    }
  }, [handleEvent, startPollingFallback]);

  /**
   * Tier 1: Primary Full-Duplex WebSocket
   */
  const connectWS = useCallback(async () => {
    if (isUnmountedRef.current || !isAuthenticated) {
      setConnectionStatus('disconnected');
      return;
    }

    try {
      setConnectionStatus((prev) => (prev === 'connected' ? 'reconnecting' : 'connecting'));

      // 1. Fetch short-lived token from backend
      let token = '';
      try {
        const res = await fetch('/api/v1/realtime/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, role, ministryId, ministry }),
        });
        if (res.ok) {
          const data = await res.json();
          token = data.token;
        } else if (res.status === 401 || res.status === 403) {
          setConnectionStatus('authentication_failed');
          return;
        }
      } catch {
        // Fallback to cookie/header auth
      }

      if (isUnmountedRef.current) return;

      // 2. Build WebSocket URL preventing mixed-content errors (wss:// on HTTPS, ws:// on HTTP)
      const isHttps = window.location.protocol === 'https:';
      const wsProtocol = isHttps ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${wsProtocol}//${host}/api/v1/realtime/ws${token ? `?token=${encodeURIComponent(token)}` : ''}`;

      if (wsRef.current) {
        wsRef.current.close();
      }

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      let pingStart = Date.now();

      ws.onopen = () => {
        if (isUnmountedRef.current) return;
        setConnectionStatus('connected');
        setTransport('websocket');
        reconnectAttemptRef.current = 0;

        // Clear fallback polling if active
        if (pollingTimerRef.current) {
          clearInterval(pollingTimerRef.current);
          pollingTimerRef.current = null;
        }
        if (sseRef.current) {
          sseRef.current.close();
          sseRef.current = null;
        }

        // Heartbeat ping/pong every 25 seconds
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            pingStart = Date.now();
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 25000);
      };

      ws.onmessage = (e) => {
        if (isUnmountedRef.current) return;
        try {
          const parsed = JSON.parse(e.data);
          if (parsed.type === 'pong') {
            setLatencyMs(Math.max(1, Date.now() - pingStart));
            return;
          }
          handleEvent(parsed);
        } catch {
          // Malformed message safely ignored
        }
      };

      ws.onerror = () => {
        if (isUnmountedRef.current) return;
        if (transport !== 'sse' && transport !== 'polling') {
          console.warn('[Realtime] WebSocket handshake or connection failed. Activating Server-Sent Events (SSE).');
          connectSSE(token);
        }
      };

      ws.onclose = (event) => {
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        if (isUnmountedRef.current) return;

        // If closed due to policy / auth violation
        if (event.code === 1008 || event.code === 4401) {
          setConnectionStatus('authentication_failed');
          return;
        }

        // Auto-reconnect with exponential backoff and random jitter
        if (transport !== 'sse' && transport !== 'polling') {
          setConnectionStatus('reconnecting');
          const attempt = reconnectAttemptRef.current;
          reconnectAttemptRef.current += 1;

          // Backoff capped at 15s + random jitter between 0 and 500ms
          const delay = Math.min(15000, 1000 * Math.pow(1.5, attempt)) + Math.floor(Math.random() * 500);

          if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = setTimeout(() => {
            if (!isUnmountedRef.current && isAuthenticated) {
              connectWS();
            }
          }, delay);
        }
      };
    } catch {
      if (!isUnmountedRef.current) {
        connectSSE('');
      }
    }
  }, [userId, role, ministryId, ministry, isAuthenticated, transport, connectSSE, handleEvent]);

  // Handle browser visibility changes & network reconnection
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
          connectWS();
        }
      }
    };

    const handleOnline = () => {
      console.log('[Realtime] Network back online. Reconnecting socket bus...');
      connectWS();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('online', handleOnline);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('online', handleOnline);
    };
  }, [connectWS]);

  // Periodic attempt to probe/upgrade back to WebSocket if on SSE or Polling
  useEffect(() => {
    if (transport === 'sse' || transport === 'polling') {
      probeWsTimerRef.current = setInterval(() => {
        if (document.visibilityState === 'visible') {
          connectWS();
        }
      }, 60000); // Probe every 60s
    }

    return () => {
      if (probeWsTimerRef.current) clearInterval(probeWsTimerRef.current);
    };
  }, [transport, connectWS]);

  // Lifecycle initialization & cleanup
  useEffect(() => {
    isUnmountedRef.current = false;
    if (isAuthenticated) {
      connectWS();
    } else {
      setConnectionStatus('disconnected');
    }

    return () => {
      isUnmountedRef.current = true;
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
      if (probeWsTimerRef.current) clearInterval(probeWsTimerRef.current);

      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted');
        wsRef.current = null;
      }
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
    };
  }, [isAuthenticated, connectWS]);

  return {
    connectionStatus,
    transport,
    lastEvent,
    lastEventAt,
    eventCount,
    latencyMs,
    reconnect: connectWS,
  };
}

export const useRealtimeUpdates = useRealtimeConnection;
