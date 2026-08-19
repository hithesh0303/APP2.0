import React from 'react';

interface ProgressBarProps {
  value: number;
  max: number;
  colorClass?: string;
  heightClass?: string;
  showLabel?: boolean;
  unit?: string;
  id?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max,
  colorClass = 'bg-emerald-500',
  heightClass = 'h-2.5',
  showLabel = false,
  unit = '',
  id,
}) => {
  const percentage = Math.min(100, Math.max(0, max > 0 ? (value / max) * 100 : 0));

  return (
    <div className="w-full" id={id}>
      {showLabel && (
        <div className="flex justify-between text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
          <span>{value} {unit}</span>
          <span>{max} {unit} ({Math.round(percentage)}%)</span>
        </div>
      )}
      <div className={`w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden ${heightClass}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

interface ProgressRingProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  colorClass?: string;
  label?: string;
  sublabel?: string;
  id?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  max,
  size = 110,
  strokeWidth = 9,
  colorClass = 'text-emerald-500',
  label,
  sublabel,
  id,
}) => {
  const percentage = Math.min(100, Math.max(0, max > 0 ? (value / max) * 100 : 0));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center inline-flex" style={{ width: size, height: size }} id={id}>
      <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="text-neutral-100 dark:text-neutral-800"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={`${colorClass} transition-all duration-700 ease-out`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-1">
        {label && <span className="text-base font-bold text-neutral-900 dark:text-neutral-100 leading-none">{label}</span>}
        {sublabel && <span className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-tight">{sublabel}</span>}
      </div>
    </div>
  );
};
