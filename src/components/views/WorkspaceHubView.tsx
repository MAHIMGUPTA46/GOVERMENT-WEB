import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Mail, 
  Calendar as CalendarIcon, 
  MessageSquare, 
  Video, 
  FileUp, 
  ExternalLink, 
  Plus, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Send, 
  Trash2, 
  Database,
  Building,
  User as UserIcon,
  Shield,
  Layers,
  Sparkles,
  Search,
  FileSpreadsheet
} from 'lucide-react';
import { Project, User as AppUser, Intervention } from '../../types';
import { GoogleSheetsTab } from './GoogleSheetsTab';
import { 
  auth, 
  googleSignIn, 
  logout, 
  getAccessToken, 
  initAuth 
} from '../../lib/firebase';
import { User as FirebaseUser } from 'firebase/auth';
import { 
  fetchTasks, 
  fetchTaskLists, 
  createGoogleTask, 
  updateGoogleTaskStatus, 
  deleteGoogleTask,
  fetchRecentEmails,
  sendGmailMessage,
  fetchCalendarEvents,
  createCalendarEvent,
  fetchChatSpaces,
  sendChatMessage,
  createGoogleMeetSpace,
  openGooglePicker,
  GoogleTask,
  GoogleTaskList,
  GmailMessageSummary,
  CalendarEvent,
  ChatSpace,
  MeetSpace,
  PickedFile
} from '../../services/workspace';
import { saveWorkspaceAttachment, fetchWorkspaceAttachments, WorkspaceAttachment } from '../../services/firestoreSync';

interface WorkspaceHubViewProps {
  projects: Project[];
  currentUser: AppUser;
  onSelectProject: (id: string) => void;
  interventions: Intervention[];
  onAddIntervention: (intervention: Partial<Intervention>) => void;
  onImportProjects?: (projects: Project[], mode?: 'append' | 'replace') => void;
}

type WorkspaceTab = 'tasks' | 'gmail' | 'calendar' | 'chat' | 'meet' | 'picker' | 'sheets';

export const WorkspaceHubView: React.FC<WorkspaceHubViewProps> = ({
  projects,
  currentUser,
  onSelectProject,
  interventions,
  onAddIntervention,
  onImportProjects,
}) => {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('tasks');
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Data states
  const [tasks, setTasks] = useState<GoogleTask[]>([]);
  const [taskLists, setTaskLists] = useState<GoogleTaskList[]>([]);
  const [selectedTaskListId, setSelectedTaskListId] = useState<string>('@default');
  const [emails, setEmails] = useState<GmailMessageSummary[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [chatSpaces, setChatSpaces] = useState<ChatSpace[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<string>('');
  const [meetSpaces, setMeetSpaces] = useState<MeetSpace[]>([]);
  const [pickedFiles, setPickedFiles] = useState<PickedFile[]>([]);
  const [savedAttachments, setSavedAttachments] = useState<WorkspaceAttachment[]>([]);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals & Inputs
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [selectedProjectForTask, setSelectedProjectForTask] = useState(projects[0]?.projectCode || '');

  // Gmail Compose
  const [emailTo, setEmailTo] = useState('railways.sec@gov.in');
  const [emailSubject, setEmailSubject] = useState('[MoSPI-IPMD] Expedited Statutory Clearance Memo: P-1001');
  const [emailBody, setEmailBody] = useState(
    'Respected Secretary,\n\nReference is invited to Central Sector Infrastructure Project P-1001 (Mumbai-Ahmedabad High Speed Rail Corridor). An urgent inter-ministerial PMG intervention is scheduled to resolve forest diversion clearance in Section 4.\n\nKindly nominate the nodal officer for the upcoming coordination review.\n\nWarm regards,\nInfrastructure & Project Monitoring Division (IPMD)\nMinistry of Statistics and Programme Implementation'
  );

  // Calendar Event
  const [eventSummary, setEventSummary] = useState('[PMG Review] Inter-Ministerial Coordination: Mumbai-Ahmedabad Corridor');
  const [eventLocation, setEventLocation] = useState('Cabinet Secretariat, Rashtrapati Bhavan, New Delhi / Google Meet');
  const [eventStart, setEventStart] = useState('2026-09-15T10:30');
  const [eventEnd, setEventEnd] = useState('2026-09-15T11:30');

  // Chat message
  const [chatMessageText, setChatMessageText] = useState('');

  // Confirmation Dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    onConfirm: () => Promise<void>;
  } | null>(null);

  // Monitor Auth State
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setFirebaseUser(user);
        if (token) setAccessToken(token);
      },
      () => {
        setFirebaseUser(null);
        setAccessToken(null);
      }
    );

    getAccessToken().then((t) => {
      if (t) setAccessToken(t);
    });

    // Load attachments from Firestore
    fetchWorkspaceAttachments().then((items) => {
      setSavedAttachments(items);
    });

    return () => unsubscribe();
  }, []);

  // Fetch tab data when tab or token changes
  useEffect(() => {
    if (!accessToken) return;
    loadCurrentTabData();
  }, [activeTab, accessToken]);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setFirebaseUser(result.user);
        setAccessToken(result.accessToken);
        showNotification('success', `Authenticated as ${result.user.email || 'Government Officer'}`);
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Authentication failed. Please check browser popups.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setFirebaseUser(null);
    setAccessToken(null);
    setTasks([]);
    setEmails([]);
    setEvents([]);
    setChatSpaces([]);
    showNotification('success', 'Logged out from Google Workspace');
  };

  const loadCurrentTabData = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      if (activeTab === 'tasks') {
        const lists = await fetchTaskLists(accessToken);
        setTaskLists(lists);
        const tListId = lists[0]?.id || '@default';
        setSelectedTaskListId(tListId);
        const items = await fetchTasks(accessToken, tListId);
        setTasks(items);
      } else if (activeTab === 'gmail') {
        const msgs = await fetchRecentEmails(accessToken, 8);
        setEmails(msgs);
      } else if (activeTab === 'calendar') {
        const evts = await fetchCalendarEvents(accessToken, 8);
        setEvents(evts);
      } else if (activeTab === 'chat') {
        const spaces = await fetchChatSpaces(accessToken);
        setChatSpaces(spaces);
        if (spaces.length > 0 && !selectedSpace) {
          setSelectedSpace(spaces[0].name);
        }
      }
    } catch (error: any) {
      console.warn('Workspace fetch error:', error);
      // Don't crash UI, display friendly error or fallback
    } finally {
      setIsLoading(false);
    }
  };

  // --- Task Actions ---
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !newTaskTitle.trim()) return;

    try {
      setIsLoading(true);
      const notes = `[Project: ${selectedProjectForTask}] ${newTaskNotes}`;
      const created = await createGoogleTask(accessToken, selectedTaskListId, {
        title: newTaskTitle,
        notes: notes,
        due: newTaskDueDate ? new Date(newTaskDueDate).toISOString() : undefined,
      });
      setTasks((prev) => [created, ...prev]);
      setNewTaskTitle('');
      setNewTaskNotes('');
      setNewTaskDueDate('');
      showNotification('success', `Created Google Task "${created.title}"`);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to create task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTaskStatus = async (task: GoogleTask) => {
    if (!accessToken) return;
    const newStatus = task.status === 'completed' ? 'needsAction' : 'completed';

    // Per workspace guidelines, prompt confirmation when marking complete or deleting
    setConfirmDialog({
      isOpen: true,
      title: newStatus === 'completed' ? 'Complete Task?' : 'Reopen Task?',
      description: `Are you sure you want to mark "${task.title}" as ${newStatus === 'completed' ? 'completed' : 'pending'}?`,
      confirmLabel: 'Confirm',
      onConfirm: async () => {
        try {
          const updated = await updateGoogleTaskStatus(accessToken, selectedTaskListId, task.id, newStatus);
          setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
          showNotification('success', `Task marked as ${newStatus}`);
        } catch (err: any) {
          showNotification('error', err.message || 'Failed to update task');
        }
      },
    });
  };

  const handleDeleteTask = (task: GoogleTask) => {
    if (!accessToken) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Google Task?',
      description: `Are you sure you want to permanently delete task "${task.title}"? This operation modifies your Google Workspace account.`,
      confirmLabel: 'Delete Task',
      onConfirm: async () => {
        try {
          await deleteGoogleTask(accessToken, selectedTaskListId, task.id);
          setTasks((prev) => prev.filter((t) => t.id !== task.id));
          showNotification('success', 'Task deleted successfully');
        } catch (err: any) {
          showNotification('error', err.message || 'Failed to delete task');
        }
      },
    });
  };

  // --- Gmail Actions ---
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !emailTo || !emailSubject || !emailBody) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Dispatch Official Email via Gmail?',
      description: `This action will send an official dispatch from your Google account to "${emailTo}" with subject "${emailSubject}".`,
      confirmLabel: 'Send Dispatch',
      onConfirm: async () => {
        try {
          setIsLoading(true);
          await sendGmailMessage(accessToken, {
            to: emailTo,
            subject: emailSubject,
            body: emailBody,
          });
          showNotification('success', `Email dispatched successfully to ${emailTo}`);
        } catch (err: any) {
          showNotification('error', err.message || 'Failed to send email');
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  // --- Calendar Actions ---
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !eventSummary) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Schedule Calendar Review Event?',
      description: `Add "${eventSummary}" to your Google Calendar for ${new Date(eventStart).toLocaleString()}?`,
      confirmLabel: 'Schedule Event',
      onConfirm: async () => {
        try {
          setIsLoading(true);
          const created = await createCalendarEvent(accessToken, {
            summary: eventSummary,
            location: eventLocation,
            startDateTime: eventStart,
            endDateTime: eventEnd,
          });
          setEvents((prev) => [created, ...prev]);
          showNotification('success', `Scheduled meeting: ${created.summary}`);
        } catch (err: any) {
          showNotification('error', err.message || 'Failed to schedule event');
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  // --- Chat Actions ---
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !selectedSpace || !chatMessageText.trim()) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Post Message to Google Chat Space?',
      description: `Post message to space "${selectedSpace}":\n"${chatMessageText}"`,
      confirmLabel: 'Post to Chat',
      onConfirm: async () => {
        try {
          setIsLoading(true);
          await sendChatMessage(accessToken, selectedSpace, chatMessageText);
          setChatMessageText('');
          showNotification('success', 'Message broadcasted to Google Chat space');
        } catch (err: any) {
          showNotification('error', err.message || 'Failed to post message to Chat');
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  // --- Meet Actions ---
  const handleCreateMeet = async () => {
    if (!accessToken) return;
    try {
      setIsLoading(true);
      const meet = await createGoogleMeetSpace(accessToken);
      setMeetSpaces((prev) => [meet, ...prev]);
      showNotification('success', `Created Google Meet space: ${meet.meetingUri || meet.name}`);
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to create Google Meet space');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Google Picker Actions ---
  const handleOpenPicker = () => {
    if (!accessToken) return;
    openGooglePicker({
      accessToken,
      onPicked: async (file) => {
        setPickedFiles((prev) => [file, ...prev]);
        // Also persist reference to Firestore
        await saveWorkspaceAttachment({
          id: `doc-${Date.now()}`,
          type: 'drive_dpr',
          title: file.name,
          projectId: selectedProjectForTask,
          link: file.url,
          status: 'verified',
        });
        showNotification('success', `Attached Google Drive document: ${file.name}`);
      },
      onCancel: () => {},
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-700 to-indigo-900 text-white flex items-center justify-center font-bold shadow-sm">
            <Building className="w-6 h-6 text-blue-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">
                Inter-Ministerial Workspace & Cloud Services Hub
              </h2>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <Database className="w-3 h-3" />
                Firestore Active
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Secure synchronization with Google Tasks, Gmail, Google Calendar, Google Chat, Google Meet, and Google Drive Picker for IPMD project officers.
            </p>
          </div>
        </div>

        {/* Authentication Controls */}
        <div className="flex items-center gap-3">
          {firebaseUser ? (
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg p-2 px-3">
              {firebaseUser.photoURL ? (
                <img
                  src={firebaseUser.photoURL}
                  alt={firebaseUser.displayName || 'User'}
                  className="w-8 h-8 rounded-full border border-slate-300"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                  {firebaseUser.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div className="text-left">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  {firebaseUser.displayName || 'Government Officer'}
                  <Shield className="w-3 h-3 text-emerald-600" />
                </div>
                <div className="text-[11px] text-slate-500 truncate max-w-[160px]">
                  {firebaseUser.email}
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="ml-2 text-xs text-slate-500 hover:text-rose-600 font-medium px-2 py-1 hover:bg-slate-200 rounded transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              disabled={isAuthenticating}
              className="gsi-material-button inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 text-sm font-semibold text-slate-700 transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
              <span>{isAuthenticating ? 'Connecting...' : 'Sign in with Google'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-lg text-sm flex items-center gap-2 border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {authError && (
        <div className="p-3.5 rounded-lg text-sm bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <span>{authError}</span>
        </div>
      )}

      {/* Service Tabs */}
      <div className="border-b border-slate-200 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2.5 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'tasks'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Google Tasks</span>
          {tasks.length > 0 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
              {tasks.filter((t) => t.status !== 'completed').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('gmail')}
          className={`px-4 py-2.5 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'gmail'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Gmail Memos</span>
          {emails.length > 0 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700">
              {emails.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-4 py-2.5 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'calendar'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          <span>Google Calendar</span>
          {events.length > 0 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700">
              {events.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-2.5 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'chat'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Google Chat</span>
        </button>

        <button
          onClick={() => setActiveTab('meet')}
          className={`px-4 py-2.5 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'meet'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>Google Meet</span>
        </button>

        <button
          onClick={() => setActiveTab('picker')}
          className={`px-4 py-2.5 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'picker'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <FileUp className="w-4 h-4" />
          <span>Google Picker (Drive DPRs)</span>
        </button>

        <button
          onClick={() => setActiveTab('sheets')}
          className={`px-4 py-2.5 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'sheets'
              ? 'border-emerald-700 text-emerald-700'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Google Sheets</span>
          <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase">
            Sync
          </span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
        {/* If user is not logged in */}
        {!firebaseUser && (
          <div className="text-center py-12 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-blue-50 text-blue-700 flex items-center justify-center">
              <Shield className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Official Google Workspace Authorization Required
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Please sign in with your Google account to authorize access to Google Tasks, Gmail, Calendar, Chat, Meet, and Drive documents with explicit permission.
            </p>
            <button
              onClick={handleSignIn}
              disabled={isAuthenticating}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-medium text-sm rounded-lg shadow transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path fill="#fff" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              </svg>
              <span>{isAuthenticating ? 'Connecting...' : 'Authorize Workspace Services'}</span>
            </button>
          </div>
        )}

        {/* 1. Google Tasks View */}
        {firebaseUser && activeTab === 'tasks' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-blue-700" />
                  Google Tasks – Project Action Items
                </h3>
                <p className="text-xs text-slate-500">
                  Track statutory clearances, inter-ministerial resolutions, and contractor deadlines directly synced to your Google Tasks.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={loadCurrentTabData}
                  disabled={isLoading}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  Sync Tasks
                </button>
              </div>
            </div>

            {/* Create New Task Form */}
            <form onSubmit={handleCreateTask} className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Create Google Task from Monitored Project
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Task title (e.g., Convene PMG review for Package 3 forest diversion)"
                    className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
                <div>
                  <select
                    value={selectedProjectForTask}
                    onChange={(e) => setSelectedProjectForTask(e.target.value)}
                    className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.projectCode}>
                        {p.projectCode} – {p.name.substring(0, 30)}...
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <input
                    type="text"
                    value={newTaskNotes}
                    onChange={(e) => setNewTaskNotes(e.target.value)}
                    placeholder="Notes / Action details (assigned authority, required order, etc.)"
                    className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !newTaskTitle.trim()}
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-md flex items-center gap-1.5 whitespace-nowrap transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Task
                  </button>
                </div>
              </div>
            </form>

            {/* Task List items */}
            <div className="space-y-2">
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm border border-dashed border-slate-200 rounded-lg">
                  No tasks found in current list. Create an action item above to sync with Google Tasks.
                </div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-3.5 border rounded-lg flex items-start justify-between gap-3 transition-colors ${
                      task.status === 'completed'
                        ? 'bg-slate-50 border-slate-200 text-slate-400'
                        : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleToggleTaskStatus(task)}
                        className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                          task.status === 'completed'
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 hover:border-blue-600 text-transparent'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 fill-current" />
                      </button>
                      <div>
                        <div
                          className={`text-sm font-semibold ${
                            task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-900'
                          }`}
                        >
                          {task.title}
                        </div>
                        {task.notes && (
                          <div className="text-xs text-slate-500 mt-0.5">{task.notes}</div>
                        )}
                        {task.due && (
                          <div className="text-[11px] text-blue-600 font-mono mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Due: {new Date(task.due).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteTask(task)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                      title="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 2. Gmail View */}
        {firebaseUser && activeTab === 'gmail' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-rose-600" />
                  Gmail – Inter-Ministerial Correspondence & Memos
                </h3>
                <p className="text-xs text-slate-500">
                  Compose formal project escalation advisories and monitor project communications from your inbox.
                </p>
              </div>

              <button
                onClick={loadCurrentTabData}
                disabled={isLoading}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                Check Inbox
              </button>
            </div>

            {/* Compose Form */}
            <form onSubmit={handleSendEmail} className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Compose Statutory Escalation Memo
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">To (Ministry / Department)</label>
                  <input
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Subject</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Memo Text</label>
                <textarea
                  rows={4}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 font-sans"
                  required
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send Official Dispatch via Gmail
                </button>
              </div>
            </form>

            {/* Recent Messages List */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Recent Inbox Communications
              </div>
              {emails.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-sm border border-dashed border-slate-200 rounded-lg">
                  No inbox messages retrieved yet. Click "Check Inbox" to load recent communications.
                </div>
              ) : (
                emails.map((msg) => (
                  <div key={msg.id} className="p-3.5 bg-white border border-slate-200 rounded-lg hover:border-slate-300">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span className="font-semibold text-slate-800">{msg.from}</span>
                      <span>{msg.date}</span>
                    </div>
                    <div className="text-sm font-bold text-slate-900">{msg.subject}</div>
                    <div className="text-xs text-slate-600 mt-1 line-clamp-2">{msg.snippet}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 3. Google Calendar View */}
        {firebaseUser && activeTab === 'calendar' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-blue-600" />
                  Google Calendar – PMG Review Schedules
                </h3>
                <p className="text-xs text-slate-500">
                  Manage cabinet coordination hearings, high-level project reviews, and state authority meetings.
                </p>
              </div>

              <button
                onClick={loadCurrentTabData}
                disabled={isLoading}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                Sync Calendar
              </button>
            </div>

            {/* Schedule Meeting Form */}
            <form onSubmit={handleCreateEvent} className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Schedule PMG Project Review Hearing
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Meeting Title</label>
                  <input
                    type="text"
                    value={eventSummary}
                    onChange={(e) => setEventSummary(e.target.value)}
                    className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Location / Video Link</label>
                  <input
                    type="text"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={eventStart}
                    onChange={(e) => setEventStart(e.target.value)}
                    className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">End Date & Time</label>
                  <input
                    type="datetime-local"
                    value={eventEnd}
                    onChange={(e) => setEventEnd(e.target.value)}
                    className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add to Google Calendar
                </button>
              </div>
            </form>

            {/* Event List */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Upcoming Project Reviews
              </div>
              {events.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-sm border border-dashed border-slate-200 rounded-lg">
                  No upcoming meetings found on your primary calendar.
                </div>
              ) : (
                events.map((evt) => (
                  <div key={evt.id} className="p-3.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-slate-900">{evt.summary}</div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          {evt.start.dateTime
                            ? new Date(evt.start.dateTime).toLocaleString()
                            : evt.start.date}
                        </span>
                        {evt.location && <span>• {evt.location}</span>}
                      </div>
                    </div>
                    {evt.htmlLink && (
                      <a
                        href={evt.htmlLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        Open <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 4. Google Chat View */}
        {firebaseUser && activeTab === 'chat' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-emerald-600" />
                  Google Chat – Inter-Ministerial Spaces
                </h3>
                <p className="text-xs text-slate-500">
                  Broadcast milestone alerts, urgent right-of-way bottlenecks, or review notes directly to connected Google Chat spaces.
                </p>
              </div>

              <button
                onClick={loadCurrentTabData}
                disabled={isLoading}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh Spaces
              </button>
            </div>

            {chatSpaces.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm border border-dashed border-slate-200 rounded-lg space-y-3">
                <p>No Google Chat spaces found for your account, or no joined organization rooms yet.</p>
                <p className="text-xs text-slate-400">
                  (Ensure your Google Workspace organization has Google Chat enabled and at least one Space created)
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Target Space</label>
                  <select
                    value={selectedSpace}
                    onChange={(e) => setSelectedSpace(e.target.value)}
                    className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {chatSpaces.map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.displayName || s.name} ({s.type})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Alert Message</label>
                  <textarea
                    rows={3}
                    value={chatMessageText}
                    onChange={(e) => setChatMessageText(e.target.value)}
                    placeholder="Enter message to broadcast to this space..."
                    className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading || !chatMessageText.trim()}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Post to Space
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* 5. Google Meet View */}
        {firebaseUser && activeTab === 'meet' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Video className="w-5 h-5 text-indigo-600" />
                  Google Meet – Instant PMG Crisis Conferences
                </h3>
                <p className="text-xs text-slate-500">
                  Spin up on-demand virtual meeting rooms to resolve inter-ministerial disputes and critical infrastructure bottlenecks in real-time.
                </p>
              </div>

              <button
                onClick={handleCreateMeet}
                disabled={isLoading}
                className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Convene Instant Crisis Meeting
              </button>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Active Meeting Spaces
              </div>

              {meetSpaces.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm border border-dashed border-slate-200 rounded-lg space-y-2">
                  <Video className="w-8 h-8 text-slate-400 mx-auto" />
                  <div>No meeting spaces spawned in this session.</div>
                  <p className="text-xs text-slate-400">
                    Click "Convene Instant Crisis Meeting" above to generate an authenticated Google Meet space link.
                  </p>
                </div>
              ) : (
                meetSpaces.map((meet, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-lg flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Cabinet Inter-Ministerial Crisis Room #{idx + 1}
                      </div>
                      <div className="text-xs font-mono text-indigo-700 mt-1">
                        {meet.meetingUri || meet.name}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={meet.meetingUri || `https://meet.google.com/${meet.meetingCode || ''}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md flex items-center gap-1 shadow-sm"
                      >
                        Join Room <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 6. Google Picker View */}
        {firebaseUser && activeTab === 'picker' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileUp className="w-5 h-5 text-amber-600" />
                  Google Picker – Drive Detailed Project Reports (DPRs)
                </h3>
                <p className="text-xs text-slate-500">
                  Select and verify official Detailed Project Reports, statutory environmental clearances, and drone surveillance footage directly from Google Drive.
                </p>
              </div>

              <button
                onClick={handleOpenPicker}
                disabled={isLoading}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <FileUp className="w-3.5 h-3.5" />
                Launch Google Drive Picker
              </button>
            </div>

            {/* Picked Documents Grid */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Linked Drive Documents & Clearance Artifacts
              </div>

              {pickedFiles.length === 0 && savedAttachments.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm border border-dashed border-slate-200 rounded-lg space-y-2">
                  <FileUp className="w-8 h-8 text-slate-400 mx-auto" />
                  <div>No documents attached yet.</div>
                  <p className="text-xs text-slate-400">
                    Click "Launch Google Drive Picker" to select files from your Drive and attach them to IPMD project dossiers.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[...pickedFiles, ...savedAttachments.map(a => ({
                    id: a.id,
                    name: a.title,
                    mimeType: 'application/pdf',
                    url: a.link || '#'
                  }))].map((file, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-white border border-slate-200 rounded-lg flex items-start justify-between gap-2 hover:border-blue-400 transition-colors"
                    >
                      <div className="overflow-hidden">
                        <div className="text-xs font-bold text-slate-900 truncate" title={file.name}>
                          {file.name}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 truncate">
                          Type: {file.mimeType}
                        </div>
                      </div>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:text-blue-800 p-1 flex-shrink-0"
                        title="Open file in Drive"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 7: Google Sheets Synchronization & Importer/Exporter */}
        {activeTab === 'sheets' && (
          <GoogleSheetsTab
            projects={projects}
            accessToken={accessToken}
            onSelectProject={onSelectProject}
            onImportProjects={onImportProjects}
            onShowNotification={showNotification}
            onOpenConfirm={(dialog) => setConfirmDialog({ isOpen: true, ...dialog })}
            onTriggerSignIn={handleSignIn}
          />
        )}
      </div>

      {/* Explicit User Confirmation Modal (Required by Google Workspace Security Directive) */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertCircle className="w-6 h-6" />
              <h4 className="text-base font-bold text-slate-900">{confirmDialog.title}</h4>
            </div>
            <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">
              {confirmDialog.description}
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const action = confirmDialog.onConfirm;
                  setConfirmDialog(null);
                  await action();
                }}
                className="px-4 py-2 text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-colors shadow-sm"
              >
                {confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
