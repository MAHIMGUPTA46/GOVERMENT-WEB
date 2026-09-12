import React from 'react';
import { 
  LayoutDashboard, 
  FolderKanban, 
  TrendingUp, 
  AlertTriangle, 
  CheckSquare, 
  BarChart3, 
  MapPin, 
  Bot, 
  FileText, 
  ShieldCheck,
  Building,
  Briefcase,
  Layers,
  ChevronRight
} from 'lucide-react';
import { User, Alert, Intervention } from '../types';

export type NavTab = 
  | 'dashboard' 
  | 'projects' 
  | 'analytics' 
  | 'alerts' 
  | 'interventions' 
  | 'workspace'
  | 'benchmarking' 
  | 'map' 
  | 'assistant' 
  | 'reports' 
  | 'admin';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  currentUser: User;
  alerts: Alert[];
  interventions: Intervention[];
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  alerts,
  interventions,
  isOpen,
  onClose,
}) => {
  const activeAlertsCount = alerts.filter((a) => a.status !== 'resolved').length;
  const pendingInterventionsCount = interventions.filter(
    (i) => i.currentStatus !== 'resolved' && i.currentStatus !== 'closed'
  ).length;

  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Executive Dashboard',
      icon: LayoutDashboard,
      description: 'National Portfolio Overview',
    },
    {
      id: 'projects' as NavTab,
      label: 'Monitored Projects',
      icon: FolderKanban,
      description: '1,981 Capital Projects Registry',
    },
    {
      id: 'analytics' as NavTab,
      label: 'Predictive Analytics',
      icon: TrendingUp,
      description: 'ML Risk Engines & SHAP',
    },
    {
      id: 'alerts' as NavTab,
      label: 'Early Warning Alerts',
      icon: AlertTriangle,
      description: 'Cost & Schedule Escalations',
      badge: activeAlertsCount > 0 ? activeAlertsCount : undefined,
      badgeColor: 'bg-rose-600 text-white',
    },
    {
      id: 'interventions' as NavTab,
      label: 'Intervention Worklist',
      icon: CheckSquare,
      description: 'Action Tracking & PMG Matrix',
      badge: pendingInterventionsCount > 0 ? pendingInterventionsCount : undefined,
      badgeColor: 'bg-amber-600 text-white',
    },
    {
      id: 'workspace' as NavTab,
      label: 'Google Workspace & Sheets',
      icon: Briefcase,
      description: 'Sheets Sync, Tasks, Gmail & Drive',
      badgeColor: 'bg-emerald-600 text-white',
    },
    {
      id: 'benchmarking' as NavTab,
      label: 'Sector Benchmarking',
      icon: BarChart3,
      description: 'Cross-Agency Cohort Analysis',
    },
    {
      id: 'map' as NavTab,
      label: 'Geographic Risk Map',
      icon: MapPin,
      description: 'Google Maps Spatial Risk Atlas',
    },
    {
      id: 'assistant' as NavTab,
      label: 'AI Project Intelligence',
      icon: Bot,
      description: 'Evidence-Based RAG Assistant',
      isAi: true,
    },
    {
      id: 'reports' as NavTab,
      label: 'Reports & Dossiers',
      icon: FileText,
      description: 'Parliamentary & CCEA Briefs',
    },
    {
      id: 'admin' as NavTab,
      label: 'Administration & Governance',
      icon: ShieldCheck,
      description: 'Data Quality & RBAC Audit',
      roleRestricted: true,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 sm:w-72 bg-[#0B1F3A] text-slate-200 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static no-print ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
        aria-label="Main Navigation"
      >
        {/* Brand & Division Header in Sidebar */}
        <div className="p-4 border-b border-blue-900/60 bg-[#08172c]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-md">
              P
            </div>
            <div>
              <div className="font-bold text-sm text-white tracking-wide flex items-center gap-1.5">
                PAIMANA <span className="text-amber-400 font-extrabold text-xs">AI</span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium leading-tight">
                IPMD · MoSPI Decision Support
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Items List */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1" aria-label="Sidebar Sections">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Monitoring & Intelligence
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="flex items-center gap-3 truncate text-left">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-white' : item.isAi ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <div className="truncate">
                    <div className="truncate flex items-center gap-1.5">
                      {item.label}
                      {item.isAi && (
                        <span className="text-[9px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-1 py-0.2 rounded font-bold">
                          AI
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* System & Freshness Status Footer */}
        <div className="p-3 border-t border-slate-800 bg-[#08172c] text-slate-400 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Reporting Cycle:</span>
              <span className="font-semibold text-slate-200">Aug 2026</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">ML Engine:</span>
              <span className="font-mono text-emerald-400 font-semibold">XGB v2.4.2</span>
            </div>
            <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800 text-slate-500">
              <span>Next Monthly Sync:</span>
              <span>15 Sep 2026</span>
            </div>
          </div>

          <div className="mt-2 text-center text-[10px] text-slate-500">
            Govt. of India · Strictly Official Use
          </div>
        </div>
      </aside>
    </>
  );
};
