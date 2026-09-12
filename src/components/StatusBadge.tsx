import React from 'react';
import { CheckCircle2, Clock, FastForward, AlertTriangle, AlertOctagon } from 'lucide-react';
import { ProjectStatus } from '../types';

interface StatusBadgeProps {
  status: ProjectStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const config = {
    'On Schedule': {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
    },
    'Delayed': {
      bg: 'bg-amber-50 text-amber-900 border-amber-300',
      icon: Clock,
      iconColor: 'text-amber-700',
    },
    'Ahead of Schedule': {
      bg: 'bg-blue-50 text-blue-800 border-blue-200',
      icon: FastForward,
      iconColor: 'text-blue-600',
    },
    'Completed': {
      bg: 'bg-slate-100 text-slate-800 border-slate-300',
      icon: CheckCircle2,
      iconColor: 'text-slate-600',
    },
    'Stalled / Scrutiny': {
      bg: 'bg-rose-50 text-rose-900 border-rose-300',
      icon: AlertOctagon,
      iconColor: 'text-rose-600',
    },
  }[status] || {
    bg: 'bg-slate-50 text-slate-700 border-slate-200',
    icon: Clock,
    iconColor: 'text-slate-500',
  };

  const Icon = config.icon;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-medium whitespace-nowrap ${config.bg} ${padding}`}
    >
      <Icon className={`w-3.5 h-3.5 ${config.iconColor}`} aria-hidden="true" />
      <span>{status}</span>
    </span>
  );
};
