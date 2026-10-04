import React, { useState, useEffect } from 'react';
import { speechSynthesisService, AudioAlertState } from '../services/speechSynthesisService';
import { 
  Bell, 
  Search, 
  ChevronDown, 
  Info, 
  Menu, 
  X, 
  ShieldAlert, 
  Calendar,
  Building2,
  UserCheck,
  Printer,
  Volume2,
  VolumeX,
  Sparkles,
  LogOut
} from 'lucide-react';
import { User, Alert } from '../types';
import { DEMO_USERS } from '../data/mockData';
import { RealTimeStatus } from './realtime/RealTimeStatus';
import { RealtimeConnectionState, RealtimeTransportType } from '../hooks/useRealtimeConnection';

interface TopNavProps {
  currentUser: User;
  onSelectUser: (user: User) => void;
  reportingMonth: string;
  onChangeReportingMonth: (month: string) => void;
  activeAlerts: Alert[];
  onOpenAlerts: () => void;
  onOpenProject: (projectId: string) => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onSearch: (term: string) => void;
  searchTerm: string;
  onOpenGoogleWorkspace?: () => void;
  onTriggerGoogleSignIn?: () => Promise<void>;
  onSignOut?: () => void;
  isGoogleConnected?: boolean;
  realtimeStatus?: RealtimeConnectionState;
  realtimeTransport?: RealtimeTransportType;
  realtimeLatencyMs?: number;
  realtimeEventCount?: number;
  realtimeLastEventAt?: string | null;
  onRealtimeReconnect?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentUser,
  onSelectUser,
  reportingMonth,
  onChangeReportingMonth,
  activeAlerts,
  onOpenAlerts,
  sidebarOpen,
  onToggleSidebar,
  onSearch,
  searchTerm,
  onOpenGoogleWorkspace,
  onTriggerGoogleSignIn,
  onSignOut,
  isGoogleConnected = false,
  realtimeStatus = 'connected',
  realtimeTransport = 'websocket',
  realtimeLatencyMs = 12,
  realtimeEventCount = 0,
  realtimeLastEventAt = null,
  onRealtimeReconnect,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSigningInGoogle, setIsSigningInGoogle] = useState(false);
  const [audioState, setAudioState] = useState<AudioAlertState>(() => speechSynthesisService.getState());

  useEffect(() => {
    const unsub = speechSynthesisService.subscribe(setAudioState);
    return () => unsub();
  }, []);

  const handleGoogleAction = async () => {
    if (isGoogleConnected) {
      onOpenGoogleWorkspace?.();
    } else if (onTriggerGoogleSignIn) {
      setIsSigningInGoogle(true);
      try {
        await onTriggerGoogleSignIn();
      } finally {
        setIsSigningInGoogle(false);
      }
    } else {
      onOpenGoogleWorkspace?.();
    }
  };

  const criticalCount = activeAlerts.filter((a) => a.severity === 'critical' && a.status !== 'resolved').length;
  const highCount = activeAlerts.filter((a) => a.severity === 'high' && a.status !== 'resolved').length;

  return (
    <>
      {/* Official Government of India Header Banner */}
      <div className="bg-[#0b1f3a] text-slate-100 text-xs py-1.5 px-4 sm:px-6 flex items-center justify-between border-b border-blue-900/60 no-print">
        <div className="flex items-center gap-3">
          {/* Emblem / National Flag Motif */}
          <div className="flex items-center gap-1.5 font-medium tracking-wide">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-400/30"></span>
            <span className="uppercase text-[11px] font-semibold text-slate-200">
              Government of India
            </span>
          </div>
          <span className="text-slate-500 hidden md:inline">|</span>
          <span className="text-slate-300 hidden md:inline truncate max-w-md">
            Ministry of Statistics and Programme Implementation (MoSPI) · IPMD
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          {/* Synthetic Data Indicator with details trigger */}
          <button
            onClick={() => setShowDisclaimerModal(true)}
            className="flex items-center gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 px-2.5 py-0.5 rounded border border-amber-500/30 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
            title="Click to view data provenance and governance notice"
            aria-label="Demonstration and Synthetic Data Notice"
          >
            <Info className="w-3 h-3 text-amber-400" />
            <span className="font-medium">Synthetic/Demo Dataset</span>
          </button>

          <span className="text-slate-400 hidden sm:inline">
            Status: <strong className="text-emerald-400 font-semibold">Active Monitoring</strong>
          </span>
        </div>
      </div>

      {/* Main Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs no-print">
        <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          {/* Mobile menu toggle & Brand identity */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              aria-label={sidebarOpen ? "Close sidebar menu" : "Open sidebar menu"}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-700 to-[#0b1f3a] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                P
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-none">
                    PAIMANA <span className="text-blue-700 font-extrabold">AI</span>
                  </h1>
                  <span className="text-[10px] uppercase font-bold tracking-widest bg-blue-50 text-blue-800 border border-blue-200 px-1.5 py-0.5 rounded">
                    IPMD
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight hidden sm:block">
                  Predictive Infrastructure Monitoring & Early Warning System
                </p>
              </div>
            </div>
          </div>

          {/* Search Bar & Reporting Month Filter */}
          <div className="flex items-center gap-2 sm:gap-4 flex-1 max-w-xl justify-end">
            <div className="relative hidden md:block w-full max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search projects, IDs, ministries..."
                value={searchTerm}
                onChange={(e) => onSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                aria-label="Search infrastructure projects"
              />
            </div>

            {/* Reporting Month Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select
                value={reportingMonth}
                onChange={(e) => onChangeReportingMonth(e.target.value)}
                className="bg-transparent text-slate-800 font-medium text-xs focus:outline-none cursor-pointer pr-1"
                aria-label="Select reporting month cycle"
              >
                <option value="August 2026">August 2026 (Flash Report)</option>
                <option value="July 2026">July 2026</option>
                <option value="June 2026">June 2026</option>
                <option value="May 2026">May 2026</option>
              </select>
            </div>

            {/* Notification Center */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg relative transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600"
                aria-label={`Open notifications: ${criticalCount} critical, ${highCount} high risk`}
              >
                <Bell className="w-4 h-4" />
                {criticalCount + highCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {criticalCount + highCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                  <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                      <span className="text-xs font-bold text-slate-900">
                        Early Warning Alerts
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setShowNotifications(false);
                        onOpenAlerts();
                      }}
                      className="text-xs font-medium text-blue-700 hover:underline"
                    >
                      View All ({activeAlerts.length})
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {activeAlerts.slice(0, 4).map((alert) => (
                      <div
                        key={alert.id}
                        className="p-3 hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => {
                          setShowNotifications(false);
                          onOpenAlerts();
                        }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            alert.severity === 'critical' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {alert.severity}
                          </span>
                          <span className="text-[10px] text-slate-400">{alert.createdAt}</span>
                        </div>
                        <h4 className="text-xs font-semibold text-slate-900 line-clamp-1">
                          {alert.title}
                        </h4>
                        <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                          {alert.projectName} · {alert.triggerValue}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Browser Speech Synthesis Audio Notification Toggle */}
            <div className="relative flex items-center">
              <button
                type="button"
                onClick={() => speechSynthesisService.toggleEnabled()}
                className={`p-2 rounded-lg border text-xs transition-all relative flex items-center gap-1.5 ${
                  audioState.enabled
                    ? 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 shadow-2xs'
                }`}
                title={
                  audioState.enabled
                    ? 'Voice Alerts: ACTIVE (Spoken summary for critical alerts risk > 80). Click to mute.'
                    : 'Voice Alerts: MUTED. Click to enable browser speech notifications.'
                }
                aria-label="Toggle voice alert audio notifications"
              >
                {audioState.enabled ? (
                  <Volume2 className="w-4 h-4 text-blue-700" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-400" />
                )}
                {audioState.isSpeaking && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                )}
                <span className="hidden xl:inline font-medium text-[11px]">
                  {audioState.enabled ? (audioState.isSpeaking ? 'Speaking...' : 'Voice Alert') : 'Muted'}
                </span>
              </button>

              {/* Quick Audio Test Button */}
              {audioState.enabled && (
                <button
                  type="button"
                  onClick={() => speechSynthesisService.testAudioSpeech()}
                  className="hidden 2xl:flex items-center gap-1 ml-1 px-1.5 py-1 text-[10px] font-semibold text-slate-500 hover:text-blue-700 hover:bg-slate-100 rounded transition-colors"
                  title="Test browser speech synthesis audio"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Test Voice</span>
                </button>
              )}
            </div>

            {/* Central Real-Time Connection & Health Status Indicator */}
            <RealTimeStatus
              status={realtimeStatus}
              transport={realtimeTransport}
              latencyMs={realtimeLatencyMs}
              eventCount={realtimeEventCount}
              lastEventAt={realtimeLastEventAt}
              onReconnect={onRealtimeReconnect}
            />

            {/* Google Workspace Connection Pill / Action */}
            <button
              type="button"
              onClick={handleGoogleAction}
              disabled={isSigningInGoogle}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                isGoogleConnected
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs'
              }`}
              title={
                isGoogleConnected
                  ? 'Google Workspace Connected (Official MoSPI Division Session) – Click to open Google Sheets & Hub'
                  : 'Connect Google Workspace & Sheets'
              }
            >
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              <span className="hidden md:inline">
                {isSigningInGoogle ? 'Connecting...' : isGoogleConnected ? 'Workspace Active' : 'Connect Google'}
              </span>
              {isGoogleConnected && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              )}
            </button>

            {/* Print Page Utility */}
            <button
              onClick={() => window.print()}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg hidden sm:block transition-colors"
              title="Print / Save Executive PDF Brief"
              aria-label="Print or save executive PDF brief"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* User Persona Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-left focus:outline-none focus:ring-2 focus:ring-blue-600"
                aria-haspopup="true"
                aria-expanded={showUserMenu}
              >
                <div className="w-6 h-6 rounded-full bg-blue-900 text-amber-400 font-bold text-[10px] flex items-center justify-center border border-amber-400/40 shrink-0">
                  {currentUser.avatarInitials}
                </div>
                <div className="hidden xl:block text-left">
                  <div className="text-xs font-bold text-slate-800 leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-500 capitalize">
                    {currentUser.role.replace('_', ' ')}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                  <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
                    <div className="text-xs font-bold text-slate-900">
                      Switch Active Role / User
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Demonstrates Role-Based Access Control (RBAC)
                    </div>
                  </div>

                  {DEMO_USERS.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        onSelectUser(user);
                        setShowUserMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-blue-50/70 transition-colors ${
                        user.id === currentUser.id ? 'bg-blue-50/90 font-semibold' : ''
                      }`}
                    >
                      <div>
                        <div className="text-xs text-slate-900 font-medium">{user.name}</div>
                        <div className="text-[10px] text-slate-500">{user.designation}</div>
                        <div className="text-[9px] uppercase font-bold text-blue-700 tracking-wider">
                          {user.role.replace('_', ' ')}
                        </div>
                      </div>
                      {user.id === currentUser.id && (
                        <UserCheck className="w-4 h-4 text-blue-700 shrink-0" />
                      )}
                    </button>
                  ))}

                  {/* Sign Out / Lock Session Action */}
                  {onSignOut && (
                    <div className="border-t border-slate-100 p-2 bg-slate-50">
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          onSignOut();
                        }}
                        className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-rose-700 hover:text-rose-800 hover:bg-rose-50 transition-colors flex items-center justify-center gap-2 border border-rose-200"
                        title="Lock session and return to Login Dashboard"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Log Out & Lock Session</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Synthetic Data Disclaimer Modal */}
      {showDisclaimerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 relative">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Data Governance & Synthetic Data Notice
                  </h3>
                  <p className="text-xs text-slate-500">
                    MoSPI IPMD Decision Support Demonstration Protocol
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDisclaimerModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                <strong>1. Demonstration Architecture:</strong> This platform is seeded with realistic synthetic project data modeled directly upon published statistical reports of the Infrastructure & Project Monitoring Division (IPMD), Ministry of Statistics and Programme Implementation (MoSPI).
              </p>
              <p>
                <strong>2. Decision-Support Role:</strong> Predictive risk scores, cost overrun forecasts, and time delay estimates are generated by machine-learning models (e.g. XGBoost ensemble) to serve as early warning decision-support indicators. They do not constitute official statutory audit determinations or Cabinet determinations.
              </p>
              <p>
                <strong>3. Real-Time Data Adaptation:</strong> In production deployments, this interface connects directly to the Central Project Monitoring System (OCMS / IPMD API Gateway) under NIC secure data transmission standards.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowDisclaimerModal(false)}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-medium text-xs rounded-lg transition-colors"
              >
                I Understand & Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
