'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import ChipInput from '@/components/criteria/ChipInput';
import {
  Criteria,
  JOB_FUNCTIONS,
  JOB_TYPES,
  WORK_MODELS,
  EXPERIENCE_LEVELS,
  DATE_POSTED_OPTIONS,
} from '@/types';

interface BasicCriteriaProps {
  criteria: Criteria;
  onChange: (criteria: Criteria) => void;
}

export default function BasicCriteria({ criteria, onChange }: BasicCriteriaProps) {
  const [excludedTitleOpen, setExcludedTitleOpen] = useState(false);

  const update = (partial: Partial<Criteria>) => {
    onChange({ ...criteria, ...partial });
  };

  const toggleArrayItem = (field: keyof Criteria, value: string) => {
    const arr = criteria[field] as string[];
    if (arr.includes(value)) {
      update({ [field]: arr.filter((v) => v !== value) });
    } else {
      update({ [field]: [...arr, value] });
    }
  };

  return (
    <div className="space-y-8">
      {/* Job Function */}
      <div>
        <label className="block text-sm font-semibold mb-2">
          Job Function <span className="text-red-500">*</span>
        </label>
        <ChipInput
          label="Job Function"
          options={[...JOB_FUNCTIONS]}
          selected={criteria.jobFunctions}
          onChange={(v) => update({ jobFunctions: v })}
          required
          placeholder="Search job functions..."
        />
      </div>

      {/* Excluded Title */}
      <div>
        <button
          type="button"
          onClick={() => setExcludedTitleOpen(!excludedTitleOpen)}
          className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-gray-900"
        >
          Excluded Title
          {excludedTitleOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {excludedTitleOpen && (
          <div className="mt-2">
            <ChipInput
              label="Excluded Title"
              options={[...JOB_FUNCTIONS]}
              selected={criteria.excludedTitles}
              onChange={(v) => update({ excludedTitles: v })}
              placeholder="Search titles to exclude..."
              freeText
            />
          </div>
        )}
      </div>

      {/* Job Type */}
      <div>
        <label className="block text-sm font-semibold mb-2">Job Type</label>
        <div className="flex flex-wrap gap-2">
          {JOB_TYPES.map((jt) => (
            <button
              key={jt.value}
              type="button"
              onClick={() => toggleArrayItem('jobTypes', jt.value)}
              className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
                criteria.jobTypes.includes(jt.value)
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                  : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
            >
              {jt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Work Model */}
      <div>
        <label className="block text-sm font-semibold mb-2">Work Model</label>
        <div className="flex flex-wrap gap-2">
          {WORK_MODELS.map((wm) => (
            <button
              key={wm.value}
              type="button"
              onClick={() => toggleArrayItem('workModels', wm.value)}
              className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
                criteria.workModels.includes(wm.value)
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                  : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
            >
              {wm.label}
            </button>
          ))}
        </div>
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-semibold mb-2">Location</label>
        <input
          type="text"
          value={criteria.locations[0] || 'United States'}
          onChange={(e) => update({ locations: [e.target.value] })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="Enter location"
        />
      </div>

      {/* Experience Level */}
      <div>
        <label className="block text-sm font-semibold mb-2">Experience Level</label>
        <div className="space-y-2">
          {EXPERIENCE_LEVELS.map((el) => (
            <label key={el.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={criteria.experienceLevels.includes(el.value)}
                onChange={() => toggleArrayItem('experienceLevels', el.value)}
                className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-700">{el.label}</span>
              <Info size={14} className="text-gray-400 ml-auto" />
            </label>
          ))}
        </div>
      </div>

      {/* Required Experience */}
      <div>
        <label className="block text-sm font-semibold mb-2">Required Experience</label>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="minExp"
              checked={criteria.minExperienceYears === undefined}
              onChange={() => update({ minExperienceYears: undefined })}
              className="w-4 h-4 text-emerald-500 focus:ring-emerald-500"
            />
            <span className="text-sm text-gray-700">Any requirements (Open to all)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="minExp"
              checked={criteria.minExperienceYears !== undefined}
              onChange={() => update({ minExperienceYears: 0 })}
              className="w-4 h-4 text-emerald-500 focus:ring-emerald-500"
            />
            <span className="text-sm text-gray-700">Custom</span>
            {criteria.minExperienceYears !== undefined && (
              <input
                type="number"
                min={0}
                max={30}
                value={criteria.minExperienceYears}
                onChange={(e) =>
                  update({ minExperienceYears: parseInt(e.target.value) || 0 })
                }
                className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            )}
          </label>
        </div>
      </div>

      {/* Date Posted */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold">Date Posted</label>
          {criteria.datePosted && (
            <button
              type="button"
              onClick={() => update({ datePosted: undefined })}
              className="text-xs text-emerald-600 hover:text-emerald-700"
            >
              Clear All
            </button>
          )}
        </div>
        <div className="space-y-2">
          {DATE_POSTED_OPTIONS.map((dp) => (
            <label key={dp.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="datePosted"
                checked={criteria.datePosted === dp.value}
                onChange={() => update({ datePosted: dp.value })}
                className="w-4 h-4 text-emerald-500 focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-700">{dp.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
