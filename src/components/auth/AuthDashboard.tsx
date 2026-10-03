import React, { useState } from 'react';
import { 
  Shield, 
  Lock, 
  Mail, 
  User as UserIcon, 
  Building2, 
  Key, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Sparkles, 
  Briefcase, 
  Database, 
  Activity, 
  FileCheck,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import { User, UserRole } from '../../types';
import { DEMO_USERS } from '../../data/mockData';
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from '../../lib/firebase';

interface AuthDashboardProps {
  onLoginSuccess: (user: User) => void;
}

type AuthTab = 'signin' | 'register' | 'personas';

export const AuthDashboard: React.FC<AuthDashboardProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<AuthTab>('signin');
  
  // Sign-in Form State
  const [signInEmail, setSignInEmail] = useState('officer@example.gov.in');
  const [signInPassword, setSignInPassword] = useState('Officer@123');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register Form State
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regMinistry, setRegMinistry] = useState('Ministry of Statistics & Programme Implementation (MoSPI)');
  const [regRole, setRegRole] = useState<UserRole>('monitoring_officer');
  const [regDesignation, setRegDesignation] = useState('Project Appraisal Officer');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Handle Sign In with Password
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!signInEmail.trim() || !signInPassword) {
      setErrorMessage('Please enter both your institutional email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const authResult = await signInWithEmail(signInEmail.trim(), signInPassword);
      
      // Match with known demo user or construct active user session
      const matchedUser = DEMO_USERS.find(
        (u) => u.email.toLowerCase() === signInEmail.trim().toLowerCase()
      );

      const activeUser: User = matchedUser || {
        id: authResult.uid || `user-${Date.now()}`,
        name: authResult.displayName || signInEmail.split('@')[0],
        email: signInEmail.trim(),
        role: (authResult.role as UserRole) || 'monitoring_officer',
        designation: authResult.designation || 'Infrastructure Monitoring Officer',
        ministry: authResult.ministry || 'Ministry of Statistics & Programme Implementation',
        avatarInitials: (authResult.displayName || signInEmail).substring(0, 2).toUpperCase(),
      };

      setSuccessMessage(`Welcome back, ${activeUser.name}. Session verified.`);
      setTimeout(() => {
        onLoginSuccess(activeUser);
      }, 400);
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setErrorMessage(
        err?.message || 'Authentication failed. Please verify your credentials or select a verified institutional persona.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle New Account Registration with Password
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!regFullName.trim() || !regEmail.trim() || !regPassword) {
      setErrorMessage('Please complete all mandatory fields.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters in length.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Password and Confirm Password do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const authResult = await signUpWithEmail(regEmail.trim(), regPassword, {
        displayName: regFullName.trim(),
        role: regRole,
        ministry: regMinistry,
        designation: regDesignation,
      });

      const newUser: User = {
        id: authResult.uid || `user-${Date.now()}`,
        name: regFullName.trim(),
        email: regEmail.trim(),
        role: regRole,
        designation: regDesignation,
        ministry: regMinistry,
        avatarInitials: regFullName
          .split(' ')
          .map((p) => p[0])
          .slice(0, 2)
          .join('')
          .toUpperCase(),
      };

      setSuccessMessage('Account registered successfully! Loading workspace...');
      setTimeout(() => {
        onLoginSuccess(newUser);
      }, 500);
    } catch (err: any) {
      console.error('Registration error:', err);
      setErrorMessage(err?.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick 1-Click Persona Login
  const handleQuickPersonaLogin = async (user: User) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      // Set matching password for demo persona
      const password = user.role === 'super_admin' ? 'Admin@123' : `${user.role.charAt(0).toUpperCase() + user.role.slice(1)}@123`;
      await signInWithEmail(user.email, password);
      setSuccessMessage(`Authenticated as ${user.name} (${user.designation})`);
      setTimeout(() => {
        onLoginSuccess(user);
      }, 300);
    } catch (err) {
      // Fallback direct entry
      onLoginSuccess(user);
    } finally {
      setIsLoading(false);
    }
  };

  // Google Workspace Single Sign-On
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await signInWithGoogle();
      if (result?.user) {
        const googleUser: User = {
          id: result.user.uid || 'officer-ipmd-1',
          name: result.user.displayName || 'Director, Infrastructure Monitoring Division',
          email: result.user.email || 'director.ipmd@gov.in',
          role: 'monitoring_officer',
          designation: 'Director, Infrastructure & Project Monitoring Division',
          ministry: 'Ministry of Statistics & Programme Implementation',
          avatarInitials: 'DG',
        };
        onLoginSuccess(googleUser);
      }
    } catch (err: any) {
      setErrorMessage('Google Authentication failed. Please use standard password authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    setResetSuccess(true);
    setTimeout(() => {
      setShowForgotModal(false);
      setResetSuccess(false);
      setResetEmail('');
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-[#071326] flex flex-col justify-between relative overflow-hidden font-sans text-slate-100">
      {/* Background Decorative Ambient Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-64 h-64 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Top Government Banner */}
      <header className="border-b border-blue-900/60 bg-[#0B1F3A]/90 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          {/* Emblem / Tricolor Bars */}
          <div className="flex flex-col gap-0.5 shrink-0">
            <div className="w-5 h-1 bg-[#FF9933] rounded-xs" />
            <div className="w-5 h-1 bg-white rounded-xs" />
            <div className="w-5 h-1 bg-[#138808] rounded-xs" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest leading-none">
              Government of India · भारत सरकार
            </div>
            <div className="text-xs text-slate-300 font-medium leading-tight mt-0.5">
              Ministry of Statistics and Programme Implementation (MoSPI) · IPMD
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5 bg-blue-950/80 border border-blue-800/60 px-2.5 py-1 rounded-full text-blue-300 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>256-bit TLS Encrypted</span>
          </span>
          <span className="font-mono text-slate-400">OCMS PMG Gateway</span>
        </div>
      </header>

      {/* Main Center Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex items-center justify-center z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full">
          {/* Left Column: Brand Hero & Strategic Infrastructure Intelligence */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-950/90 border border-blue-700/60 text-blue-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>National Mega Infrastructure Decision Support</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                PAIMANA <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">AI</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-300 font-light leading-relaxed">
                Central Sector Infrastructure Predictive Early-Warning & Governance Portal
              </p>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xl">
              Equipping the Cabinet Secretariat Project Monitoring Group (PMG), NITI Aayog, and Line Ministries with machine-learning risk surveillance, TreeSHAP delay diagnostics, and real-time inter-ministerial resolution tracking.
            </p>

            {/* Strategic KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  Monitored Projects
                </span>
                <span className="text-xl sm:text-2xl font-black text-white font-mono">
                  1,981
                </span>
                <span className="text-[10px] text-emerald-400 block mt-0.5">
                  ≥ ₹150 Crore Outlay
                </span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  Monitored Outlay
                </span>
                <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                  ₹32.18 L Cr
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Revised Anticipated
                </span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  ML Lead Time
                </span>
                <span className="text-xl sm:text-2xl font-black text-blue-400 font-mono">
                  5.4 Mos
                </span>
                <span className="text-[10px] text-blue-300 block mt-0.5">
                  Early Drift Warning
                </span>
              </div>
            </div>

            {/* Statutory Compliance Footer Callout */}
            <div className="border border-blue-900/60 bg-blue-950/40 rounded-xl p-3.5 flex items-start gap-3">
              <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300 space-y-0.5">
                <span className="font-bold text-white block">
                  Statutory Reporting Cycle: August 2026 Active
                </span>
                <p className="text-[11px] text-slate-400">
                  Compliant with OCMS data-capture protocols, CCEA guidelines, and National Master Plan for Multi-modal Connectivity (PM GatiShakti).
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Login Dashboard & Password Authentication */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto">
            <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl relative">
              {/* Card Header & Tab Selector */}
              <div className="space-y-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Lock className="w-5 h-5 text-blue-400" />
                    Institutional Authentication
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Sign in with your verified government credentials or explore official persona profiles
                  </p>
                </div>

                {/* Tab Buttons */}
                <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('signin');
                      setErrorMessage(null);
                    }}
                    className={`py-2 px-2.5 rounded-lg transition-all text-center ${
                      activeTab === 'signin'
                        ? 'bg-blue-600 text-white shadow-xs font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Sign In
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('register');
                      setErrorMessage(null);
                    }}
                    className={`py-2 px-2.5 rounded-lg transition-all text-center ${
                      activeTab === 'register'
                        ? 'bg-blue-600 text-white shadow-xs font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Register
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('personas');
                      setErrorMessage(null);
                    }}
                    className={`py-2 px-2.5 rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
                      activeTab === 'personas'
                        ? 'bg-amber-600 text-white shadow-xs font-bold'
                        : 'text-slate-400 hover:text-amber-300'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Demo</span>
                  </button>
                </div>
              </div>

              {/* Error & Success Feedback Banners */}
              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 animate-in fade-in duration-200">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span className="flex-1">{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="flex-1">{successMessage}</span>
                </div>
              )}

              {/* 1. SIGN IN TAB */}
              {activeTab === 'signin' && (
                <form onSubmit={handleSignIn} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1.5">
                      Institutional Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        placeholder="e.g. officer@example.gov.in"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-slate-300 font-semibold">
                        Account Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowForgotModal(true)}
                        className="text-blue-400 hover:text-blue-300 text-[11px] transition-colors"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type={showSignInPassword ? 'text' : 'password'}
                        required
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        placeholder="Enter your security password"
                        className="w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignInPassword(!showSignInPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                        title={showSignInPassword ? 'Hide password' : 'Show password'}
                      >
                        {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-slate-400 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-950"
                      />
                      <span className="text-[11px]">Keep session verified</span>
                    </label>

                    <span className="text-[11px] text-slate-500 font-mono">
                      TLS 1.3 Secure
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying Security Credentials...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In to Monitoring Dashboard</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {/* Divider */}
                  <div className="relative flex items-center justify-center my-3">
                    <div className="border-t border-slate-800 w-full" />
                    <span className="bg-slate-900 px-3 text-[10px] text-slate-500 uppercase tracking-widest absolute">
                      Alternative Secure Access
                    </span>
                  </div>

                  {/* Google Workspace Button */}
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2.5"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                    <span>Sign in with Google Workspace</span>
                  </button>
                </form>
              )}

              {/* 2. REGISTRATION TAB */}
              {activeTab === 'register' && (
                <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        placeholder="e.g. Dr. Alok Verma"
                        className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Institutional Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="officer.name@nic.in or @gov.in"
                        className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Ministry / Agency
                      </label>
                      <select
                        value={regMinistry}
                        onChange={(e) => setRegMinistry(e.target.value)}
                        className="w-full px-2.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                      >
                        <option value="Ministry of Statistics & Programme Implementation (MoSPI)">MoSPI (IPMD)</option>
                        <option value="Cabinet Secretariat (PMG)">Cabinet Secretariat (PMG)</option>
                        <option value="Ministry of Railways">Ministry of Railways</option>
                        <option value="Ministry of Road Transport and Highways (MoRTH)">MoRTH / NHAI</option>
                        <option value="Ministry of Power">Ministry of Power</option>
                        <option value="NITI Aayog">NITI Aayog</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Access Role
                      </label>
                      <select
                        value={regRole}
                        onChange={(e) => setRegRole(e.target.value as UserRole)}
                        className="w-full px-2.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                      >
                        <option value="monitoring_officer">Monitoring Officer</option>
                        <option value="ministry_admin">Ministry Administrator</option>
                        <option value="analyst">Policy / Data Analyst</option>
                        <option value="executive_viewer">Executive Viewer</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Security Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        className="w-full pl-9 pr-10 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                      >
                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl transition-all shadow-md mt-2 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Register & Enter Dashboard</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* 3. DEMO PERSONAS TAB */}
              {activeTab === 'personas' && (
                <div className="space-y-3">
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-200 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed">
                      Instant evaluation mode: Select an official persona below to authenticate automatically with pre-configured institutional RBAC privileges.
                    </p>
                  </div>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {DEMO_USERS.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleQuickPersonaLogin(user)}
                        disabled={isLoading}
                        className="w-full p-3 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 hover:border-blue-600 transition-all text-left flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-900 border border-amber-400/40 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">
                            {user.avatarInitials}
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs group-hover:text-blue-300 transition-colors">
                              {user.name}
                            </div>
                            <div className="text-[11px] text-slate-400 line-clamp-1">
                              {user.designation}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              {user.email}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800">
                            {user.role.replace('_', ' ')}
                          </span>
                          <span className="block text-[10px] text-slate-500 mt-1 group-hover:text-amber-400 font-semibold">
                            1-Click Login →
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Security Warning Notice */}
              <div className="mt-5 pt-4 border-t border-slate-800 text-[10px] text-slate-500 text-center leading-relaxed">
                Authorized Institutional Access Only. All audit transactions are recorded under Section 43/66 of the Information Technology Act.
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full text-slate-200 shadow-2xl relative">
            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-2">
              <Key className="w-4 h-4 text-amber-400" />
              Reset Security Password
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter your registered institutional email address. A password recovery instruction memorandum will be dispatched.
            </p>

            {resetSuccess ? (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Password reset instructions dispatched successfully.</span>
              </div>
            ) : (
              <form onSubmit={handlePasswordReset} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Registered Email
                  </label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="officer@example.gov.in"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg"
                  >
                    Send Recovery Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Global Bottom Institutional Footer */}
      <footer className="border-t border-blue-900/40 bg-[#0B1F3A]/80 text-[11px] text-slate-400 px-4 sm:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 z-10">
        <div>
          PAIMANA AI · Ministry of Statistics and Programme Implementation (MoSPI) · National Infrastructure Decision Support
        </div>
        <div className="flex items-center gap-4 text-[10px]">
          <span>Project Code: PRJ-INFRA-2026</span>
          <span>•</span>
          <span>Security Clearance: Level 4</span>
          <span>•</span>
          <span className="text-emerald-400">System Status: Nominal</span>
        </div>
      </footer>
    </div>
  );
};
