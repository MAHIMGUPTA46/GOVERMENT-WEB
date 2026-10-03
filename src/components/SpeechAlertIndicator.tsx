import React from 'react';
import { Volume2, VolumeX, Square } from 'lucide-react';
import { useSpeechAlerts } from '../hooks/useSpeechAlerts';

export const SpeechAlertIndicator: React.FC = () => {
  const { isSpeaking, currentText, stopSpeaking, toggleEnabled, isEnabled } = useSpeechAlerts();

  if (!isSpeaking || !currentText) {
    return null;
  }

  return (
    <div className="fixed top-14 right-4 z-50 max-w-sm bg-slate-900/95 text-white border border-rose-500/40 rounded-xl shadow-2xl p-3.5 backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Animated sound wave bars */}
          <div className="flex items-end gap-0.5 h-4 w-4 shrink-0 text-rose-400">
            <span className="w-1 bg-rose-400 rounded-xs animate-[pulse_0.6s_ease-in-out_infinite] h-full"></span>
            <span className="w-1 bg-rose-400 rounded-xs animate-[pulse_0.4s_ease-in-out_infinite_0.1s] h-3"></span>
            <span className="w-1 bg-rose-400 rounded-xs animate-[pulse_0.7s_ease-in-out_infinite_0.2s] h-4"></span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400 bg-rose-500/20 px-1.5 py-0.5 rounded border border-rose-500/30">
                Critical Audio Alert
              </span>
              <span className="text-[10px] text-slate-400">Speaking Announcement</span>
            </div>
            <p className="text-xs text-slate-200 mt-1 line-clamp-2 leading-relaxed font-sans">
              {currentText}
            </p>
          </div>
        </div>

        {/* Stop button */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={stopSpeaking}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Stop audio playback"
            aria-label="Stop audio playback"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </button>
          <button
            type="button"
            onClick={() => {
              stopSpeaking();
              toggleEnabled();
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition-colors"
            title="Mute all speech alerts"
            aria-label="Mute all speech alerts"
          >
            <VolumeX className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
