import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, RotateCcw, X } from 'lucide-react';

export const SkeletonCard: React.FC<{ rows?: number; className?: string }> = ({ 
  rows = 3, 
  className = '' 
}) => {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3 animate-pulse ${className}`}>
      <div className="flex items-center justify-between">
        <div className="h-4 bg-slate-200 rounded w-1/3" />
        <div className="h-6 w-6 bg-slate-200 rounded-lg" />
      </div>
      <div className="h-8 bg-slate-200 rounded w-1/2" />
      <div className="space-y-2 pt-2 border-t border-slate-100">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="h-3 bg-slate-100 rounded w-full" />
        ))}
      </div>
    </div>
  );
};

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({ 
  rows = 6, 
  cols = 7 
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden animate-pulse">
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
        <div className="h-8 bg-slate-200 rounded w-1/3" />
        <div className="flex gap-2">
          <div className="h-8 bg-slate-200 rounded w-24" />
          <div className="h-8 bg-slate-200 rounded w-24" />
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        <div className="h-10 bg-slate-100 flex items-center px-4 gap-4">
          {Array.from({ length: cols }).map((_, idx) => (
            <div key={idx} className="h-4 bg-slate-200 rounded flex-1" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="h-12 flex items-center px-4 gap-4">
            {Array.from({ length: cols }).map((_, cIdx) => (
              <div 
                key={cIdx} 
                className={`h-3 bg-slate-100 rounded ${cIdx === 1 ? 'flex-2' : 'flex-1'}`} 
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const SkeletonChart: React.FC<{ height?: string; title?: string }> = ({ 
  height = 'h-72',
  title = 'Loading Analytical Chart...'
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1 w-1/2">
          <div className="h-4 bg-slate-200 rounded w-3/4" />
          <div className="h-3 bg-slate-100 rounded w-1/2" />
        </div>
        <div className="h-6 w-20 bg-slate-100 rounded" />
      </div>
      <div className={`w-full ${height} bg-slate-50 border border-slate-100 rounded-lg flex items-end p-6 gap-3`}>
        {Array.from({ length: 8 }).map((_, idx) => (
          <div 
            key={idx} 
            className="flex-1 bg-slate-200 rounded-t" 
            style={{ height: `${25 + ((idx * 17) % 65)}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between items-center text-xs text-slate-400">
        <div className="h-3 bg-slate-100 rounded w-28" />
        <div className="h-3 bg-slate-100 rounded w-36" />
      </div>
    </div>
  );
};

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ElementType;
  actionText?: string;
  onAction?: () => void;
  secondaryText?: string;
  onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = AlertCircle,
  actionText,
  onAction,
  secondaryText,
  onSecondaryAction,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-xs">
      <div className="max-w-md mx-auto space-y-3">
        <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center">
          <Icon className="w-6 h-6" />
        </div>
        <h3 className="text-sm sm:text-base font-bold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-600 leading-relaxed">{description}</p>
        {(actionText || secondaryText) && (
          <div className="pt-2 flex items-center justify-center gap-2 flex-wrap">
            {actionText && onAction && (
              <button
                type="button"
                onClick={onAction}
                className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
              >
                {actionText}
              </button>
            )}
            {secondaryText && onSecondaryAction && (
              <button
                type="button"
                onClick={onSecondaryAction}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
              >
                {secondaryText}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-100"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-5 relative space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${
              isDestructive 
                ? 'bg-rose-50 border-rose-200 text-rose-700' 
                : 'bg-blue-50 border-blue-200 text-blue-700'
            }`}>
              {isDestructive ? <AlertTriangle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            </div>
            <div>
              <h3 id="confirm-dialog-title" className="text-sm font-bold text-slate-900">
                {title}
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">
                Statutory Confirmation Required
              </span>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
          {description}
        </p>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors shadow-xs ${
              isDestructive 
                ? 'bg-rose-700 hover:bg-rose-800 text-white' 
                : 'bg-blue-700 hover:bg-blue-800 text-white'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
