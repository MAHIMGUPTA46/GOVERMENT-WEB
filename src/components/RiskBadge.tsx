import React from 'react';
import { ShieldCheck, AlertTriangle, AlertCircle, AlertOctagon } from 'lucide-react';
import { RiskLevel } from '../types';

interface RiskBadgeProps {
  level: RiskLevel;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showScore?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  score,
  size = 'md',
  showIcon = true,
  showScore = true,
}) => {
  const config = {
    low: {
      label: 'Low Risk',
      range: '0–24',
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      iconBg: 'text-emerald-700',
      icon: ShieldCheck,
    },
    moderate: {
      label: 'Moderate Risk',
      range: '25–49',
      bg: 'bg-amber-50 text-amber-900 border-amber-300',
      iconBg: 'text-amber-700',
      icon: AlertCircle,
    },
    high: {
      label: 'High Risk',
      range: '50–74',
      bg: 'bg-orange-50 text-orange-950 border-orange-300',
      iconBg: 'text-orange-700',
      icon: AlertTriangle,
    },
    critical: {
      label: 'Critical Risk',
      range: '75–100',
      bg: 'bg-rose-50 text-rose-950 border-rose-300 font-semibold',
      iconBg: 'text-rose-700',
      icon: AlertOctagon,
    },
  }[level] || {
    label: 'Unknown',
    range: '-',
    bg: 'bg-slate-100 text-slate-800 border-slate-200',
    iconBg: 'text-slate-600',
    icon: AlertCircle,
  };

  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2',
  }[size];

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-md border font-medium ${config.bg} ${sizeClasses} transition-colors whitespace-nowrap`}
      title={`Risk Level: ${config.label} (${config.range})`}
      aria-label={`Risk Level: ${config.label}, score ${score !== undefined ? score : ''}`}
    >
      {showIcon && <Icon className={`${iconSizes} ${config.iconBg} shrink-0`} aria-hidden="true" />}
      <span>{config.label}</span>
      {showScore && score !== undefined && (
        <span className="font-mono text-xs opacity-90 pl-0.5 font-bold">
          [{score}]
        </span>
      )}
    </span>
  );
};
