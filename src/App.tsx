import React, { useState } from 'react';
import { 
  PROJECTS_DATA, 
  ALERTS_DATA, 
  INTERVENTIONS_DATA, 
  DEMO_USERS 
} from './data/mockData';
import { Project, User, Alert, Intervention } from './types';
import { TopNav } from './components/TopNav';
import { Sidebar, NavTab } from './components/Sidebar';
import { DataTable } from './components/DataTable';
import { ProjectDetailView } from './components/ProjectDetailView';
import { GeoProjectMap } from './components/GeoProjectMap';
import { AiAssistantView } from './components/AiAssistantView';
import { ExecutiveDashboardView } from './components/views/ExecutiveDashboardView';
import { PredictiveAnalyticsView } from './components/views/PredictiveAnalyticsView';
import { AlertsWorklistView } from './components/views/AlertsWorklistView';
import { InterventionsView } from './components/views/InterventionsView';
import { BenchmarkingView } from './components/views/BenchmarkingView';
import { ReportsView } from './components/views/ReportsView';
import { AdminView } from './components/views/AdminView';
import { WorkspaceHubView } from './components/views/WorkspaceHubView';
import { CsvIngestionModal } from './components/CsvIngestionModal';
import { 
  syncInterventionToFirestore, 
  updateLinkedProjectAndInterventionTx 
} from './services/firestoreSync';
import { runDataQualityCheck } from './utils/dataQualityCheck';

export default function App() {
  // Application State
  const [currentUser, setCurrentUser] = useState<User>(DEMO_USERS[0]);
  const [reportingMonth, setReportingMonth] = useState('August 2026');
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Interactive local copies of data - run DataQualityCheck on initial projects ingestion
  const [projects, setProjects] = useState<Project[]>(() => runDataQualityCheck(PROJECTS_DATA));
  const [alerts, setAlerts] = useState<Alert[]>(ALERTS_DATA);
  const [interventions, setInterventions] = useState<Intervention[]>(INTERVENTIONS_DATA);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState<boolean>(false);
  const [ingestNotification, setIngestNotification] = useState<string | null>(null);

  // Find currently open project if selected
  const activeProject = projects.find((p) => p.id === selectedProjectId);

  // Handlers
  const handleSelectProject = (id: string) => {
    setSelectedProjectId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToList = () => {
    setSelectedProjectId(null);
  };

  const handleResolveAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: 'resolved' as const } : a))
    );
  };

  const handleUpdateInterventionStatus = async (interventionId: string, status: any) => {
    const targetIntervention = interventions.find((i) => i.id === interventionId);

    // Optimistically update intervention status in local UI state
    setInterventions((prev) =>
      prev.map((i) => (i.id === interventionId ? { ...i, currentStatus: status } : i))
    );

    if (targetIntervention) {
      const parentProject = projects.find((p) => p.id === targetIntervention.projectId);
      try {
        const txResult = await updateLinkedProjectAndInterventionTx({
          projectId: targetIntervention.projectId,
          interventionId,
          newInterventionStatus: status,
          projectFallback: parentProject,
        });

        // If the project risk metrics changed atomically, update local state
        if (txResult.updatedRiskScore !== undefined) {
          setProjects((prev) =>
            prev.map((p) =>
              p.id === txResult.projectId
                ? { ...p, riskScore: txResult.updatedRiskScore, riskLevel: txResult.updatedRiskLevel }
                : p
            )
          );
        }
      } catch {
        // Fallback to single document write if offline or unauthenticated
        syncInterventionToFirestore({ ...targetIntervention, currentStatus: status }).catch(() => {});
      }
    }
  };

  const handleAddIntervention = (newIntervention: Partial<Intervention>) => {
    const created: Intervention = {
      id: `int-${Date.now()}`,
      projectId: newIntervention.projectId || 'proj-1',
      projectCode: newIntervention.projectCode || 'P-1001',
      projectName: newIntervention.projectName || 'Infrastructure Project',
      priority: newIntervention.priority || 'P1 - Critical',
      riskDriver: newIntervention.riskDriver || 'Statutory clearance delay',
      recommendedAction: newIntervention.recommendedAction || 'Convene inter-ministerial coordination meeting',
      responsibleAuthority: newIntervention.responsibleAuthority || 'Cabinet Secretariat (PMG)',
      dueDate: newIntervention.dueDate || '2026-11-30',
      currentStatus: 'under_review',
      lastActionTaken: 'Escalation dossier initiated',
      nextReviewDate: '2026-10-15',
      updatedAt: '2026-08-31',
    };

    setInterventions((prev) => [created, ...prev]);
    syncInterventionToFirestore(created).catch(() => {});
  };

  const handleExportCSV = (selectedOnly = false) => {
    const source = selectedOnly
      ? projects.filter((p) => selectedProjectIds.includes(p.id))
      : projects;

    const headers = [
      'Project ID',
      'Name',
      'Ministry',
      'Sector',
      'State',
      'Original Cost (Cr)',
      'Revised Cost (Cr)',
      'Cumulative Exp (Cr)',
      'Cost Overrun (%)',
      'Delay (Months)',
      'Risk Score',
      'Risk Level',
      'Status',
    ];

    const rows = source.map((p) => [
      `"${p.projectCode}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.ministry}"`,
      `"${p.sector}"`,
      `"${p.state}"`,
      p.originalCost,
      p.revisedCost,
      p.cumulativeExpenditure,
      p.costOverrunPct.toFixed(1),
      p.delayMonths,
      p.riskScore,
      p.riskLevel,
      p.projectStatus,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `MoSPI-IPMD-Projects-${reportingMonth.replace(/\s+/g, '-')}.csv`;
    link.click();
  };

  const handleToggleSelectProject = (id: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleIngestProjects = (newProjects: Project[], mode: 'append' | 'upsert') => {
    // Run DataQualityCheck utility on newly ingested project records
    const auditedProjects = runDataQualityCheck(newProjects);
    const flaggedCount = auditedProjects.filter((p) => p.missingMandatoryFields && p.missingMandatoryFields.length > 0).length;

    if (mode === 'append') {
      setProjects((prev) => [...auditedProjects, ...prev]);
    } else {
      setProjects((prev) => {
        const incomingMap = new Map(auditedProjects.map((p) => [p.projectCode, p]));
        const updatedExisting = prev.map((p) => {
          if (incomingMap.has(p.projectCode)) {
            const replacement = incomingMap.get(p.projectCode)!;
            incomingMap.delete(p.projectCode);
            return replacement;
          }
          return p;
        });
        return [...incomingMap.values(), ...updatedExisting];
      });
    }

    const notificationMsg = flaggedCount > 0
      ? `Ingested ${auditedProjects.length} records (${flaggedCount} flagged with missing mandatory fields e.g., 'original_completion_date').`
      : `Successfully ingested ${auditedProjects.length} project records via CSV.`;

    setIngestNotification(notificationMsg);
    setTimeout(() => {
      setIngestNotification(null);
    }, 7000);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex flex-col font-sans text-slate-800">
      {/* Top Banner & Header */}
      <TopNav
        currentUser={currentUser}
        onSelectUser={setCurrentUser}
        reportingMonth={reportingMonth}
        onChangeReportingMonth={setReportingMonth}
        activeAlerts={alerts}
        onOpenAlerts={() => {
          setSelectedProjectId(null);
          setCurrentTab('alerts');
        }}
        onOpenProject={handleSelectProject}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onSearch={setSearchTerm}
        searchTerm={searchTerm}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            setSelectedProjectId(null);
          }}
          currentUser={currentUser}
          alerts={alerts}
          interventions={interventions}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Detail Dossier View (If a project is currently open) */}
          {activeProject ? (
            <ProjectDetailView
              project={activeProject}
              onBack={handleBackToList}
              onAddIntervention={handleAddIntervention}
            />
          ) : (
            <>
              {/* Tab 1: Executive Dashboard */}
              {currentTab === 'dashboard' && (
                <ExecutiveDashboardView
                  projects={projects}
                  alerts={alerts}
                  onSelectProject={handleSelectProject}
                  onNavigateTab={setCurrentTab}
                  reportingMonth={reportingMonth}
                />
              )}

              {/* Tab 2: Project Registry Table */}
              {currentTab === 'projects' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        Central Sector Infrastructure Project Register
                      </h2>
                      <p className="text-xs text-slate-500">
                        Official monthly appraisal register of 1,981 central sector projects (≥ ₹150 Crore)
                      </p>
                    </div>
                  </div>

                  <DataTable
                    projects={projects}
                    onSelectProject={handleSelectProject}
                    onExportCSV={handleExportCSV}
                    onOpenCsvIngest={() => setIsCsvModalOpen(true)}
                    onOpenGoogleSheets={() => setCurrentTab('workspace')}
                    selectedIds={selectedProjectIds}
                    onToggleSelect={handleToggleSelectProject}
                    onSelectAll={setSelectedProjectIds}
                    onClearSelection={() => setSelectedProjectIds([])}
                  />
                </div>
              )}

              {/* Tab 3: Predictive Analytics & SHAP */}
              {currentTab === 'analytics' && (
                <PredictiveAnalyticsView
                  projects={projects}
                  onSelectProject={handleSelectProject}
                />
              )}

              {/* Tab 4: Early Warning Alerts Worklist */}
              {currentTab === 'alerts' && (
                <AlertsWorklistView
                  alerts={alerts}
                  onSelectProject={handleSelectProject}
                  onResolveAlert={handleResolveAlert}
                />
              )}

              {/* Tab 5: Interventions Matrix */}
              {currentTab === 'interventions' && (
                <InterventionsView
                  interventions={interventions}
                  onSelectProject={handleSelectProject}
                  onUpdateStatus={handleUpdateInterventionStatus}
                />
              )}

              {/* Tab: Google Workspace & Cloud Hub */}
              {currentTab === 'workspace' && (
                <WorkspaceHubView
                  projects={projects}
                  currentUser={currentUser}
                  onSelectProject={handleSelectProject}
                  interventions={interventions}
                  onAddIntervention={handleAddIntervention}
                  onImportProjects={(imported, mode) => handleIngestProjects(imported, mode === 'replace' ? 'upsert' : 'append')}
                />
              )}

              {/* Tab 6: Sector Benchmarking */}
              {currentTab === 'benchmarking' && <BenchmarkingView />}

              {/* Tab 7: Geographic Risk Map */}
              {currentTab === 'map' && (
                <GeoProjectMap
                  projects={projects}
                  onSelectProject={handleSelectProject}
                />
              )}

              {/* Tab 8: AI Intelligence Assistant */}
              {currentTab === 'assistant' && (
                <AiAssistantView
                  projects={projects}
                  onSelectProject={handleSelectProject}
                  reportingMonth={reportingMonth}
                />
              )}

              {/* Tab 9: Executive Reports & PQ Briefs */}
              {currentTab === 'reports' && (
                <ReportsView
                  projects={projects}
                  reportingMonth={reportingMonth}
                />
              )}

              {/* Tab 10: Administration & Governance */}
              {currentTab === 'admin' && (
                <AdminView onOpenCsvIngest={() => setIsCsvModalOpen(true)} />
              )}
            </>
          )}
        </main>
      </div>

      {/* CSV Ingestion Modal */}
      <CsvIngestionModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onIngestProjects={handleIngestProjects}
        existingProjectsCount={projects.length}
      />

      {/* Ingestion Toast Notification */}
      {ingestNotification && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-800 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200 border border-emerald-700">
          <span>{ingestNotification}</span>
          <button 
            onClick={() => setIngestNotification(null)} 
            className="text-emerald-200 hover:text-white font-bold p-0.5"
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
