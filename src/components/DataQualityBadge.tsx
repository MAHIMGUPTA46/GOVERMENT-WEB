import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, HelpCircle } from 'lucide-react';
import { formatMissingFieldName } from '../utils/dataQualityCheck';

interface DataQualityBadgeProps {
  score?: number;
  missingMandatoryFields?: string[];
  issues?: string[];
  size?: 'xs' | 'sm' | 'md';
  showScoreOnlyIfClean?: boolean;
  className?: string;
}

export const DataQualityBadge: React.FC<DataQualityBadgeProps> = ({
  score = 100,
  missingMandatoryFields = [],
  issues = [],
  size = 'sm',
  showScoreOnlyIfClean = false,
  className = '',
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const hasMissingMandatory = missingMandatoryFields && missingMandatoryFields.length > 0;

  // Sizing definitions
  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5 gap-1',
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2',
  }[size];

  // If there are missing mandatory fields, render the Warning Badge
  if (hasMissingMandatory) {
    const primaryMissing = missingMandatoryFields[0];
    const formattedPrimary = formatMissingFieldName(primaryMissing);
    const extraCount = missingMandatoryFields.length - 1;

    return (
      <div 
        className={`relative inline-flex items-center ${className}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={(e) => e.stopPropagation()}
      >
        <span
          className={`inline-flex items-center font-medium rounded-md border transition-all cursor-help select-none ${sizeClasses} bg-amber-50 text-amber-900 border-amber-300 shadow-2xs hover:bg-amber-100`}
          title={`Data Quality Issue: Missing mandatory fields: ${missingMandatoryFields.map(formatMissingFieldName).join(', ')}`}
          aria-label={`Data Quality Warning: Missing mandatory ${formattedPrimary}`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 animate-pulse" />
          <span className="font-semibold text-amber-950 whitespace-nowrap">
            Missing {primaryMissing === 'original_completion_date' ? 'original_completion_date' : formattedPrimary}
          </span>
          {extraCount > 0 && (
            <span className="bg-amber-200/80 text-amber-900 font-mono font-bold text-[9px] px-1 py-0.2 rounded">
              +{extraCount}
            </span>
          )}
          <span className="ml-1 pl-1 border-l border-amber-300 font-mono text-[10px] font-bold text-amber-800">
            {score}%
          </span>
        </span>

        {/* Hover / Focus Tooltip */}
        {showTooltip && (
          <div className="absolute bottom-full left-0 mb-1.5 z-40 w-72 bg-slate-900 text-white rounded-lg p-3 shadow-xl text-xs space-y-2 pointer-events-none animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Statutory Data Quality Warning</span>
              </div>
              <span className="font-mono text-xs bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
                DQ {score}%
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Missing Mandatory Fields:
              </span>
              <ul className="list-disc pl-4 space-y-0.5 text-amber-200">
                {missingMandatoryFields.map((field, idx) => (
                  <li key={idx} className="font-mono text-[11px]">
                    <strong className="text-white">{field}</strong> ({formatMissingFieldName(field)})
                  </li>
                ))}
              </ul>
            </div>

            {issues && issues.length > 0 && (
              <div className="space-y-0.5 pt-1 border-t border-slate-800 text-[11px] text-slate-300">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Audit Remarks:
                </span>
                <p className="italic text-slate-300 line-clamp-2">{issues[0]}</p>
              </div>
            )}

            <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
              Mandatory under MoSPI IPMD infrastructure project reporting protocols.
            </div>
          </div>
        )}
      </div>
    );
  }

  // If no mandatory fields missing, render Data Quality Score Badge if desired
  const isExcellent = score >= 90;
  const isModerate = score >= 70;

  const colorStyles = isExcellent
    ? 'bg-slate-50 text-slate-700 border-slate-200'
    : isModerate
    ? 'bg-amber-50 text-amber-800 border-amber-200'
    : 'bg-rose-50 text-rose-800 border-rose-200';

  return (
    <div 
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={(e) => e.stopPropagation()}
    >
      <span
        className={`inline-flex items-center font-medium rounded-md border ${sizeClasses} ${colorStyles}`}
        title={`Data Quality Score: ${score}%`}
      >
        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
        <span className="font-mono text-[10px] font-semibold">
          DQ {score}%
        </span>
      </span>

      {showTooltip && (
        <div className="absolute bottom-full left-0 mb-1.5 z-40 w-56 bg-slate-900 text-white rounded-lg p-2.5 shadow-xl text-xs space-y-1 pointer-events-none">
          <div className="flex items-center justify-between">
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> All Mandatory Fields Present
            </span>
          </div>
          <p className="text-[11px] text-slate-300">
            Baseline dates, sanction costs, and statutory metadata validated with {score}% quality score.
          </p>
        </div>
      )}
    </div>
  );
};
