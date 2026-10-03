import { useState, useEffect, useCallback } from 'react';
import { speechService, SpeechSettings, CriticalAlertPayload } from '../services/speechSynthesisService';

export function useSpeechAlerts() {
  const [isSupported] = useState<boolean>(() => speechService.isSupported());
  const [settings, setSettings] = useState<SpeechSettings>(() => speechService.getSettings());
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [currentText, setCurrentText] = useState<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    // Subscribe to speech state changes
    const unsubState = speechService.subscribe((speaking, text) => {
      setIsSpeaking(speaking);
      setCurrentText(text);
    });

    // Subscribe to settings changes
    const unsubSettings = speechService.subscribeSettings((newSettings) => {
      setSettings(newSettings);
    });

    // Populate voices
    const updateVoices = () => {
      setAvailableVoices(speechService.getAvailableVoices());
    };
    updateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    return () => {
      unsubState();
      unsubSettings();
    };
  }, []);

  const toggleEnabled = useCallback(() => {
    speechService.saveSettings({ enabled: !settings.enabled });
  }, [settings.enabled]);

  const updateSettings = useCallback((newSettings: Partial<SpeechSettings>) => {
    speechService.saveSettings(newSettings);
  }, []);

  const stopSpeaking = useCallback(() => {
    speechService.stop();
  }, []);

  const testAlert = useCallback(async () => {
    await speechService.testSpeechAlert();
  }, []);

  const announceAlert = useCallback(async (payload: CriticalAlertPayload) => {
    await speechService.announceCriticalAlert(payload);
  }, []);

  return {
    isSupported,
    isEnabled: settings.enabled,
    isSpeaking,
    currentText,
    settings,
    availableVoices,
    toggleEnabled,
    updateSettings,
    stopSpeaking,
    testAlert,
    announceAlert,
  };
}
