'use client';

import { clsx } from 'clsx';

interface MatchScoreRingProps {
  score: number;
  size?: number;
  h1bSponsor?: boolean;
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#10B981'; // emerald-500
  if (score >= 60) return '#F59E0B'; // amber-500
  return '#9CA3AF'; // gray-400
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'STRONG MATCH';
  if (score >= 60) return 'GOOD MATCH';
  return 'FAIR MATCH';
}

function getScoreLabelColor(score: number): string {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-gray-500';
}

export default function MatchScoreRing({
  score,
  size = 80,
  h1bSponsor,
}: MatchScoreRingProps) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="-rotate-90"
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold leading-none text-gray-900">
            {score}
          </span>
          <span className="text-[10px] font-medium text-gray-500">%</span>
        </div>
      </div>

      {/* Label */}
      <span
        className={clsx(
          'text-[10px] font-bold uppercase tracking-wider',
          getScoreLabelColor(score)
        )}
      >
        {getScoreLabel(score)}
      </span>

      {/* H1B Badge */}
      {h1bSponsor && (
        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
          H1B Sponsor Likely
        </span>
      )}
    </div>
  );
}
