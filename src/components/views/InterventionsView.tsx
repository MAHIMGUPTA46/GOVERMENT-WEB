import React, { useState } from 'react';
import { 
  CheckSquare, 
  Plus, 
  ExternalLink, 
  Building2, 
  Calendar, 
  Clock, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Intervention } from '../../types';

interface InterventionsViewProps {
  interventions: Intervention[];
  onSelectProject: (id: string) => void;
  onUpdateStatus: (id: string, status: Intervention['currentStatus']) => void;
}

export const InterventionsView: React.FC<InterventionsViewProps> = ({
  interventions,
  onSelectProject,
  onUpdateStatus,
}) => {
  const [activeTab, setActiveTab] = useState('all');

  const filtered = interventions.filter((item) => {
    if (activeTab === 'all') return true;
    return item.currentStatus === activeTab;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-blue-700" />
            Inter-Ministerial Project Monitoring Group (PMG) Worklist
          </h2>
          <p className="text-xs text-slate-500">
            Cabinet Secretariat fast-track dispute resolution and statutory clearance tracking matrix
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs overflow-x-auto">
          {[
            { id: 'all', label: 'All Actions' },
            { id: 'under_review', label: 'Under Review' },
            { id: 'action_initiated', label: 'Action Initiated' },
            { id: 'awaiting_update', label: 'Awaiting Update' },
            { id: 'resolved', label: 'Resolved' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-blue-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Interventions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold bg-blue-50 text-blue-800 border border-blue-200 px-1.5 py-0.5 rounded">
                      {item.priority}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Due: {item.dueDate}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {item.riskDriver}
                  </h3>
                </div>

                <select
                  value={item.currentStatus}
                  onChange={(e) => onUpdateStatus(item.id, e.target.value as Intervention['currentStatus'])}
                  className="text-[10px] uppercase font-bold bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 shrink-0"
                >
                  <option value="under_review">Under Review</option>
                  <option value="action_initiated">Action Initiated</option>
                  <option value="awaiting_update">Awaiting Update</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div className="text-xs text-blue-800 font-medium">
                Project: {item.projectName} ({item.projectCode})
              </div>

              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <strong className="text-slate-800 block mb-0.5">Recommended Action:</strong>
                {item.recommendedAction}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-500">
                Auth: <strong>{item.responsibleAuthority.split(',')[0]}</strong>
              </span>

              <button
                onClick={() => onSelectProject(item.projectId)}
                className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1"
              >
                <span>View Dossier</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
