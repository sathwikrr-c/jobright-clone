'use client';

import { Pencil, CheckCircle2, Circle } from 'lucide-react';
import { clsx } from 'clsx';

const steps = [
  { label: '1. Customize Your Resume', done: false },
  { label: '2. Enable Autofill Extension', done: false },
];

export default function RightPanel() {
  const completedCount = steps.filter((s) => s.done).length;
  const progressPct = Math.round((completedCount / steps.length) * 100);

  return (
    <aside className="flex h-screen w-72 flex-col gap-5 overflow-y-auto border-l border-gray-200 bg-gray-50 p-5">
      {/* Saved Filters */}
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            Your Saved Filters
          </h3>
          <button
            className="text-gray-400 transition-colors hover:text-emerald-500"
            aria-label="Edit filters"
          >
            <Pencil size={14} />
          </button>
        </div>
        <p className="text-xs leading-relaxed text-gray-600">
          <span className="font-medium text-gray-800">Product Manager</span>
          {' + 13 roles'}
        </p>
        <p className="mt-1 text-xs text-gray-500">Within US</p>
      </section>

      {/* Coaching Progress */}
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-gray-900">
          Complete to Win 1v1 Private Coaching
        </h3>

        {/* Progress bar */}
        <div className="mt-3 flex items-center gap-2">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-xs font-medium text-gray-500">
            {progressPct}%
          </span>
        </div>

        {/* Steps */}
        <ul className="mt-4 space-y-3">
          {steps.map((step) => (
            <li key={step.label} className="flex items-start gap-2">
              {step.done ? (
                <CheckCircle2
                  size={16}
                  className="mt-0.5 shrink-0 text-emerald-500"
                />
              ) : (
                <Circle
                  size={16}
                  className="mt-0.5 shrink-0 text-gray-300"
                />
              )}
              <span
                className={clsx(
                  'text-xs leading-snug',
                  step.done ? 'text-gray-400 line-through' : 'text-gray-700'
                )}
              >
                {step.label}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
