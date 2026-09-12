import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Filter, 
  CheckCircle2, 
  ArrowRight, 
  ExternalLink,
  Clock,
  Building2
} from 'lucide-react';
import { Alert } from '../../types';

interface AlertsWorklistViewProps {
  alerts: Alert[];
  onSelectProject: (id: string) => void;
  onResolveAlert: (id: string) => void;
}

export const AlertsWorklistView: React.FC<AlertsWorklistViewProps> = ({
  alerts,
  onSelectProject,
  onResolveAlert,
}) => {
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = alerts.filter((a) => {
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            Early Warning Alerts & Escalation Queue
          </h2>
          <p className="text-xs text-slate-500">
            Real-time triggers generated when cost or schedule drift exceeds statistical variance thresholds
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex items-center gap-2 text-xs">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical Only</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
            No early warning alerts matching the selected filters.
          </div>
        ) : (
          filtered.map((alert) => {
            const isResolved = alert.status === 'resolved';

            return (
              <div
                key={alert.id}
                className={`bg-white rounded-xl border p-4 transition-all shadow-xs ${
                  alert.severity === 'critical'
                    ? 'border-rose-200 hover:border-rose-300'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          alert.severity === 'critical'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : alert.severity === 'high'
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : 'bg-blue-100 text-blue-900 border border-blue-200'
                        }`}
                      >
                        {alert.severity}
                      </span>
                      <span className="text-xs font-mono font-bold text-blue-800">
                        [{alert.projectCode}]
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        {alert.projectName}
                      </span>
                      <span className="text-slate-400 text-xs">•</span>
                      <span className="text-xs text-slate-500 font-mono">
                        Triggered: {alert.createdAt}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 pt-0.5">
                      {alert.title}
                    </h4>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {alert.description}
                    </p>

                    <div className="pt-2 flex items-center gap-4 text-[11px] text-slate-500 font-mono">
                      <span>Condition: <strong>{alert.triggerCondition}</strong></span>
                      <span>Observed Value: <strong className="text-rose-600">{alert.triggerValue}</strong></span>
                      <span>Status: <strong className="uppercase text-slate-800">{alert.status}</strong></span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                    <button
                      onClick={() => onSelectProject(alert.projectId)}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 font-medium text-xs rounded-lg transition-colors flex items-center gap-1"
                    >
                      <span>Open Dossier</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>

                    {!isResolved && (
                      <button
                        onClick={() => onResolveAlert(alert.id)}
                        className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-medium text-xs rounded-lg transition-colors"
                      >
                        Mark Actioned
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
