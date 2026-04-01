'use client';

import { useState } from 'react';
import {
  X,
  ChevronDown,
  SlidersHorizontal,
} from 'lucide-react';
import { clsx } from 'clsx';
import Link from 'next/link';
import {
  EXPERIENCE_LEVELS,
  JOB_TYPES,
  WORK_MODELS,
} from '@/types';

interface FilterChip {
  key: string;
  label: string;
}

interface FilterBarProps {
  activeFilters?: FilterChip[];
  onRemoveFilter?: (key: string) => void;
  onClearAll?: () => void;
}

const dropdownButtons = [
  { label: 'Location' },
  { label: 'Job Function' },
  { label: 'Experience Level' },
  { label: 'Job Type' },
  { label: 'Work Model' },
];

const sortOptions = ['Recommended', 'Most Recent', 'Salary: High to Low'];

export default function FilterBar({
  activeFilters = [],
  onRemoveFilter,
  onClearAll,
}: FilterBarProps) {
  const [sortOpen, setSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState('Recommended');

  return (
    <div className="space-y-3">
      {/* Filter dropdowns row */}
      <div className="flex flex-wrap items-center gap-2">
        {dropdownButtons.map((btn) => (
          <button
            key={btn.label}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
          >
            {btn.label}
            <ChevronDown size={14} className="text-gray-400" />
          </button>
        ))}

        {/* Sort */}
        <div className="relative ml-auto">
          <button
            onClick={() => setSortOpen(!sortOpen)}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:border-gray-300"
          >
            Sort: {sortBy}
            <ChevronDown size={14} className="text-gray-400" />
          </button>
          {sortOpen && (
            <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              {sortOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    setSortBy(opt);
                    setSortOpen(false);
                  }}
                  className={clsx(
                    'block w-full px-3 py-2 text-left text-xs',
                    opt === sortBy
                      ? 'bg-emerald-50 font-medium text-emerald-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* All Filters */}
        <Link
          href="/profile"
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
        >
          <SlidersHorizontal size={14} />
          All Filters
        </Link>
      </div>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
            >
              {chip.label}
              <button
                onClick={() => onRemoveFilter?.(chip.key)}
                className="ml-0.5 text-emerald-400 transition-colors hover:text-emerald-600"
                aria-label={`Remove ${chip.label} filter`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <button
            onClick={onClearAll}
            className="text-xs font-medium text-gray-500 hover:text-gray-700"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
