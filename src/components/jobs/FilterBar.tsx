'use client';

import { useState, useRef, useEffect } from 'react';
import {
  X,
  ChevronDown,
  SlidersHorizontal,
  Check,
} from 'lucide-react';
import { clsx } from 'clsx';
import Link from 'next/link';
import {
  EXPERIENCE_LEVELS,
  JOB_TYPES,
  WORK_MODELS,
  JOB_FUNCTIONS,
} from '@/types';

export interface JobFilters {
  locations: string[];
  jobFunctions: string[];
  experienceLevels: string[];
  jobTypes: string[];
  workModels: string[];
}

interface FilterBarProps {
  filters: JobFilters;
  onFiltersChange: (filters: JobFilters) => void;
}

const LOCATIONS = [
  'United States',
  'San Francisco, CA',
  'New York, NY',
  'Seattle, WA',
  'Austin, TX',
  'Los Angeles, CA',
  'Chicago, IL',
  'Boston, MA',
  'Denver, CO',
  'Remote',
];

function FilterDropdown({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const count = selected.length;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={clsx(
          'inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
          count > 0
            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
        )}
      >
        {label}
        {count > 0 && (
          <span className="ml-0.5 rounded-full bg-emerald-500 px-1.5 text-[10px] font-bold text-white">
            {count}
          </span>
        )}
        <ChevronDown size={14} className={clsx('transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-64 max-h-72 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {options.map((opt) => {
            const isSelected = selected.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => toggle(opt.value)}
                className={clsx(
                  'flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors',
                  isSelected ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <span
                  className={clsx(
                    'flex h-4 w-4 items-center justify-center rounded border',
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : 'border-gray-300'
                  )}
                >
                  {isSelected && <Check size={10} />}
                </span>
                {opt.label}
              </button>
            );
          })}
          {selected.length > 0 && (
            <button
              onClick={() => onChange([])}
              className="w-full border-t border-gray-100 px-3 py-2 text-left text-xs font-medium text-red-500 hover:bg-red-50"
            >
              Clear {label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const sortOptions = ['Recommended', 'Most Recent', 'Salary: High to Low'];

export default function FilterBar({ filters, onFiltersChange }: FilterBarProps) {
  const [sortOpen, setSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState('Recommended');
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const locationOptions = LOCATIONS.map((l) => ({ value: l, label: l }));
  const jobFunctionOptions = JOB_FUNCTIONS.map((f) => ({ value: f, label: f }));

  // Build active chips from all filters
  const chips: { key: string; filterKey: keyof JobFilters; value: string; label: string }[] = [];

  filters.locations.forEach((v) => {
    chips.push({ key: `loc-${v}`, filterKey: 'locations', value: v, label: v });
  });
  filters.jobFunctions.forEach((v) => {
    chips.push({ key: `fn-${v}`, filterKey: 'jobFunctions', value: v, label: v });
  });
  filters.experienceLevels.forEach((v) => {
    const opt = EXPERIENCE_LEVELS.find((e) => e.value === v);
    chips.push({ key: `exp-${v}`, filterKey: 'experienceLevels', value: v, label: opt?.label || v });
  });
  filters.jobTypes.forEach((v) => {
    const opt = JOB_TYPES.find((j) => j.value === v);
    chips.push({ key: `type-${v}`, filterKey: 'jobTypes', value: v, label: opt?.label || v });
  });
  filters.workModels.forEach((v) => {
    const opt = WORK_MODELS.find((w) => w.value === v);
    chips.push({ key: `wm-${v}`, filterKey: 'workModels', value: v, label: opt?.label || v });
  });

  const removeChip = (filterKey: keyof JobFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [filterKey]: filters[filterKey].filter((v) => v !== value),
    });
  };

  const clearAll = () => {
    onFiltersChange({
      locations: [],
      jobFunctions: [],
      experienceLevels: [],
      jobTypes: [],
      workModels: [],
    });
  };

  return (
    <div className="space-y-3 px-6 pt-4">
      {/* Filter dropdowns row */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterDropdown
          label="Location"
          options={locationOptions}
          selected={filters.locations}
          onChange={(v) => onFiltersChange({ ...filters, locations: v })}
        />
        <FilterDropdown
          label="Job Function"
          options={jobFunctionOptions}
          selected={filters.jobFunctions}
          onChange={(v) => onFiltersChange({ ...filters, jobFunctions: v })}
        />
        <FilterDropdown
          label="Experience Level"
          options={EXPERIENCE_LEVELS.map((e) => ({ value: e.value, label: e.label }))}
          selected={filters.experienceLevels}
          onChange={(v) => onFiltersChange({ ...filters, experienceLevels: v })}
        />
        <FilterDropdown
          label="Job Type"
          options={JOB_TYPES.map((j) => ({ value: j.value, label: j.label }))}
          selected={filters.jobTypes}
          onChange={(v) => onFiltersChange({ ...filters, jobTypes: v })}
        />
        <FilterDropdown
          label="Work Model"
          options={WORK_MODELS.map((w) => ({ value: w.value, label: w.label }))}
          selected={filters.workModels}
          onChange={(v) => onFiltersChange({ ...filters, workModels: v })}
        />

        {/* Sort */}
        <div ref={sortRef} className="relative ml-auto">
          <button
            onClick={() => setSortOpen(!sortOpen)}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:border-gray-300"
          >
            Sort: {sortBy}
            <ChevronDown size={14} className={clsx('transition-transform', sortOpen && 'rotate-180')} />
          </button>
          {sortOpen && (
            <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
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
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
            >
              {chip.label}
              <button
                onClick={() => removeChip(chip.filterKey, chip.value)}
                className="ml-0.5 text-emerald-400 transition-colors hover:text-emerald-600"
                aria-label={`Remove ${chip.label} filter`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <button
            onClick={clearAll}
            className="text-xs font-medium text-gray-500 hover:text-gray-700"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
