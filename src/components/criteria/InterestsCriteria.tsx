'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import ChipInput from '@/components/criteria/ChipInput';
import { Criteria, INDUSTRIES, SKILLS } from '@/types';

interface InterestsCriteriaProps {
  criteria: Criteria;
  onChange: (criteria: Criteria) => void;
}

export default function InterestsCriteria({ criteria, onChange }: InterestsCriteriaProps) {
  const [excludedIndustryOpen, setExcludedIndustryOpen] = useState(false);
  const [excludedSkillOpen, setExcludedSkillOpen] = useState(false);

  const update = (partial: Partial<Criteria>) => {
    onChange({ ...criteria, ...partial });
  };

  const toggleRoleType = (value: string) => {
    if (criteria.roleTypes.includes(value)) {
      update({ roleTypes: criteria.roleTypes.filter((v) => v !== value) });
    } else {
      update({ roleTypes: [...criteria.roleTypes, value] });
    }
  };

  return (
    <div className="space-y-8">
      {/* Industry */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold">Industry</label>
          {criteria.industries.length > 0 && (
            <button
              type="button"
              onClick={() => update({ industries: [] })}
              className="text-xs text-emerald-600 hover:text-emerald-700"
            >
              Clear All
            </button>
          )}
        </div>
        <ChipInput
          label="Industry"
          options={[...INDUSTRIES]}
          selected={criteria.industries}
          onChange={(v) => update({ industries: v })}
          placeholder="Search industries..."
        />
      </div>

      {/* Excluded Industry */}
      <div>
        <button
          type="button"
          onClick={() => setExcludedIndustryOpen(!excludedIndustryOpen)}
          className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-gray-900"
        >
          Excluded Industry
          {excludedIndustryOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {excludedIndustryOpen && (
          <div className="mt-2">
            <ChipInput
              label="Excluded Industry"
              options={[...INDUSTRIES]}
              selected={criteria.excludedIndustries}
              onChange={(v) => update({ excludedIndustries: v })}
              placeholder="Search industries to exclude..."
            />
          </div>
        )}
      </div>

      {/* Skill */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold">Skill</label>
          {criteria.skills.length > 0 && (
            <button
              type="button"
              onClick={() => update({ skills: [] })}
              className="text-xs text-emerald-600 hover:text-emerald-700"
            >
              Clear All
            </button>
          )}
        </div>
        <ChipInput
          label="Skill"
          options={[...SKILLS]}
          selected={criteria.skills}
          onChange={(v) => update({ skills: v })}
          placeholder="Search skills..."
        />
      </div>

      {/* Excluded Skill */}
      <div>
        <button
          type="button"
          onClick={() => setExcludedSkillOpen(!excludedSkillOpen)}
          className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-gray-900"
        >
          Excluded Skill
          {excludedSkillOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {excludedSkillOpen && (
          <div className="mt-2">
            <ChipInput
              label="Excluded Skill"
              options={[...SKILLS]}
              selected={criteria.excludedSkills}
              onChange={(v) => update({ excludedSkills: v })}
              placeholder="Search skills to exclude..."
            />
          </div>
        )}
      </div>

      {/* Role Type */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold">Role Type</label>
          {criteria.roleTypes.length > 0 && (
            <button
              type="button"
              onClick={() => update({ roleTypes: [] })}
              className="text-xs text-emerald-600 hover:text-emerald-700"
            >
              Clear All
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {[
            { value: 'IC', label: 'IC' },
            { value: 'Manager', label: 'Manager' },
          ].map((rt) => (
            <button
              key={rt.value}
              type="button"
              onClick={() => toggleRoleType(rt.value)}
              className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
                criteria.roleTypes.includes(rt.value)
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                  : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
            >
              {rt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
