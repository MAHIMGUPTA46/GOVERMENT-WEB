// Browser-based Speech Synthesis Service for Critical Infrastructure Alerts
// Provides audio voice notification summaries when critical alerts (e.g. risk score > 80) occur.

export interface SpokenAlertInfo {
  id?: string;
  projectCode?: string;
  projectName?: string;
  title: string;
  riskScore?: number;
  severity?: string;
  description?: string;
}

export interface CriticalAlertPayload {
  alertId?: string;
  projectId?: string;
  projectCode?: string;
  projectName?: string;
  riskScore?: number;
  triggerCondition?: string;
  triggerValue?: string;
  severity?: 'critical' | 'high' | 'medium' | 'low';
  title?: string;
  description?: string;
  recommendedAction?: string;
  timestamp?: string;
}

export interface SpeechSettings {
  enabled: boolean;
  volume: number;
  rate: number;
  pitch: number;
  voiceURI?: string;
  announceOnCriticalThreshold: boolean;
  minRiskScoreThreshold: number;
}

export interface AudioAlertState {
  supported: boolean;
  enabled: boolean;
  isSpeaking: boolean;
  lastSpokenAlert: SpokenAlertInfo | null;
}

const STORAGE_SPEECH_ENABLED_KEY = 'paimana_audio_alerts_enabled';
const STORAGE_SPEECH_SETTINGS_KEY = 'paimana_speech_settings_v1';

const DEFAULT_SETTINGS: SpeechSettings = {
  enabled: true,
  volume: 0.95,
  rate: 1.02,
  pitch: 1.0,
  announceOnCriticalThreshold: true,
  minRiskScoreThreshold: 80,
};

class SpeechSynthesisService {
  private static instance: SpeechSynthesisService;
  private settings: SpeechSettings = { ...DEFAULT_SETTINGS };
  private isSpeaking: boolean = false;
  private currentText: string | null = null;
  private lastSpokenAlert: SpokenAlertInfo | null = null;
  private recentSpokenIds = new Set<string>();
  private stateListeners = new Set<(isSpeaking: boolean, text: string | null) => void>();
  private audioStateListeners = new Set<(state: AudioAlertState) => void>();
  private settingsListeners = new Set<(settings: SpeechSettings) => void>();
  private selectedVoice: SpeechSynthesisVoice | null = null;

  private constructor() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_SPEECH_SETTINGS_KEY);
        if (stored) {
          this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
        } else {
          const enabledLegacy = localStorage.getItem(STORAGE_SPEECH_ENABLED_KEY);
          if (enabledLegacy !== null) {
            this.settings.enabled = enabledLegacy === 'true';
          }
        }
      } catch {
        // Sandboxed storage fallback
      }

      this.initVoices();
    }
  }

  public static getInstance(): SpeechSynthesisService {
    if (!SpeechSynthesisService.instance) {
      SpeechSynthesisService.instance = new SpeechSynthesisService();
    }
    return SpeechSynthesisService.instance;
  }

  private initVoices(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const loadVoices = () => {
      try {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          // If voice was explicitly chosen
          if (this.settings.voiceURI) {
            const matched = voices.find((v) => v.voiceURI === this.settings.voiceURI);
            if (matched) {
              this.selectedVoice = matched;
              return;
            }
          }

          // Prefer clear professional English voices (en-IN, en-GB, en-US)
          const preferred =
            voices.find((v) => v.lang.startsWith('en-IN') && !v.name.includes('Google')) ||
            voices.find((v) => v.lang.startsWith('en-IN')) ||
            voices.find((v) => v.lang.startsWith('en-GB')) ||
            voices.find((v) => v.lang.startsWith('en-US')) ||
            voices.find((v) => v.lang.startsWith('en')) ||
            voices[0];
          this.selectedVoice = preferred || null;
        }
      } catch {
        // Fallback safely
      }
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  public isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      'SpeechSynthesisUtterance' in window
    );
  }

  public isEnabled(): boolean {
    return this.settings.enabled && this.isSupported();
  }

  public getSettings(): SpeechSettings {
    return { ...this.settings };
  }

  public saveSettings(updates: Partial<SpeechSettings>): void {
    this.settings = { ...this.settings, ...updates };
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_SPEECH_SETTINGS_KEY, JSON.stringify(this.settings));
        localStorage.setItem(STORAGE_SPEECH_ENABLED_KEY, String(this.settings.enabled));
      }
    } catch {
      // Ignore
    }
    if (!this.settings.enabled) {
      this.cancel();
    }
    this.initVoices();
    this.notifySettings();
    this.notifyAudioState();
  }

  public setEnabled(enabled: boolean): void {
    this.saveSettings({ enabled });
  }

  public toggleEnabled(): boolean {
    const next = !this.settings.enabled;
    this.saveSettings({ enabled: next });
    return next;
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
    try {
      return window.speechSynthesis.getVoices();
    } catch {
      return [];
    }
  }

  public getState(): AudioAlertState {
    return {
      supported: this.isSupported(),
      enabled: this.settings.enabled,
      isSpeaking: this.isSpeaking,
      lastSpokenAlert: this.lastSpokenAlert,
    };
  }

  public subscribe(
    listener: ((state: AudioAlertState) => void) | ((isSpeaking: boolean, text: string | null) => void)
  ): () => void {
    if (listener.length === 1) {
      const audioListener = listener as (state: AudioAlertState) => void;
      this.audioStateListeners.add(audioListener);
      audioListener(this.getState());
      return () => {
        this.audioStateListeners.delete(audioListener);
      };
    } else {
      const stateListener = listener as (isSpeaking: boolean, text: string | null) => void;
      this.stateListeners.add(stateListener);
      stateListener(this.isSpeaking, this.currentText);
      return () => {
        this.stateListeners.delete(stateListener);
      };
    }
  }

  public subscribeSettings(listener: (settings: SpeechSettings) => void): () => void {
    this.settingsListeners.add(listener);
    listener(this.getSettings());
    return () => {
      this.settingsListeners.delete(listener);
    };
  }

  private notifyAudioState(): void {
    const state = this.getState();
    this.audioStateListeners.forEach((l) => {
      try {
        l(state);
      } catch {
        // Safe
      }
    });
  }

  private notifySpeechState(): void {
    this.stateListeners.forEach((l) => {
      try {
        l(this.isSpeaking, this.currentText);
      } catch {
        // Safe
      }
    });
    this.notifyAudioState();
  }

  private notifySettings(): void {
    const s = this.getSettings();
    this.settingsListeners.forEach((l) => {
      try {
        l(s);
      } catch {
        // Safe
      }
    });
  }

  /**
   * Speak critical infrastructure alert notification
   */
  public speakAlert(alert: SpokenAlertInfo, options?: { force?: boolean }): boolean {
    if (!this.isSupported() || (!this.settings.enabled && !options?.force)) {
      return false;
    }

    // Deduplicate rapid repeat speech for same alert within 30 seconds
    const alertKey = alert.id || `${alert.projectCode || ''}_${alert.title}`;
    if (!options?.force && this.recentSpokenIds.has(alertKey)) {
      return false;
    }

    this.recentSpokenIds.add(alertKey);
    setTimeout(() => {
      this.recentSpokenIds.delete(alertKey);
    }, 30000);

    // Cancel any prior speech to prioritize fresh critical alert
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore
    }

    const projectPart = alert.projectCode
      ? `Project ${alert.projectCode}, ${alert.projectName || ''}.`
      : alert.projectName
      ? `${alert.projectName}.`
      : '';

    const scorePart =
      typeof alert.riskScore === 'number'
        ? `Critical risk score: ${Math.round(alert.riskScore)} out of 100.`
        : 'Critical priority alert.';

    const descPart = alert.description
      ? alert.description.length > 95
        ? alert.description.substring(0, 95) + '...'
        : alert.description
      : 'Immediate inter-ministerial PMG review required.';

    const speechText = `Attention: Critical Infrastructure Alert. ${projectPart} ${alert.title}. ${scorePart} ${descPart}`;

    try {
      const utterance = new SpeechSynthesisUtterance(speechText);
      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }
      utterance.rate = this.settings.rate;
      utterance.pitch = this.settings.pitch;
      utterance.volume = this.settings.volume;

      utterance.onstart = () => {
        this.isSpeaking = true;
        this.currentText = speechText;
        this.lastSpokenAlert = alert;
        this.notifySpeechState();
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.currentText = null;
        this.notifySpeechState();
      };

      utterance.onerror = (e) => {
        console.warn('[SpeechSynthesis] Utterance error:', e);
        this.isSpeaking = false;
        this.currentText = null;
        this.notifySpeechState();
      };

      window.speechSynthesis.speak(utterance);
      return true;
    } catch (err) {
      console.warn('[SpeechSynthesis] Failed to execute speech:', err);
      this.isSpeaking = false;
      this.currentText = null;
      this.notifySpeechState();
      return false;
    }
  }

  public async announceCriticalAlert(payload: CriticalAlertPayload): Promise<boolean> {
    return this.speakAlert({
      id: payload.alertId,
      projectCode: payload.projectCode,
      projectName: payload.projectName,
      title: payload.title || payload.triggerCondition || 'Critical Infrastructure Alert',
      riskScore: payload.riskScore || 85,
      severity: payload.severity || 'critical',
      description: payload.description || payload.recommendedAction || payload.triggerValue,
    });
  }

  public async testSpeechAlert(): Promise<void> {
    this.testAudioSpeech();
  }

  public testAudioSpeech(): void {
    if (!this.isSupported()) return;
    this.speakAlert(
      {
        id: 'test-speech-notification',
        projectCode: 'P-1001',
        projectName: 'Udhampur-Srinagar-Baramulla Rail Link',
        title: 'Seismic Tunneling Delay Flagged by Predictive Model',
        riskScore: 88,
        severity: 'critical',
        description: 'Audio alerts active. MoSPI early warning voice briefing ready.',
      },
      { force: true }
    );
  }

  public stop(): void {
    this.cancel();
  }

  public cancel(): void {
    if (this.isSupported()) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }
      this.isSpeaking = false;
      this.currentText = null;
      this.notifySpeechState();
    }
  }
}

export const speechSynthesisService = SpeechSynthesisService.getInstance();
export const speechService = speechSynthesisService;
