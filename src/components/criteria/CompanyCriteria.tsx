'use client';

import { HelpCircle } from 'lucide-react';
import { useState } from 'react';
import ChipInput from '@/components/criteria/ChipInput';
import { Criteria, COMPANY_STAGES } from '@/types';

interface CompanyCriteriaProps {
  criteria: Criteria;
  onChange: (criteria: Criteria) => void;
}

export default function CompanyCriteria({ criteria, onChange }: CompanyCriteriaProps) {
  const [companyTooltip, setCompanyTooltip] = useState(false);
  const [staffingTooltip, setStaffingTooltip] = useState(false);
  const [excludeCompanyTooltip, setExcludeCompanyTooltip] = useState(false);

  const update = (partial: Partial<Criteria>) => {
    onChange({ ...criteria, ...partial });
  };

  const toggleStage = (value: string) => {
    if (criteria.companyStages.includes(value)) {
      update({ companyStages: criteria.companyStages.filter((v) => v !== value) });
    } else {
      update({ companyStages: [...criteria.companyStages, value] });
    }
  };

  return (
    <div className="space-y-8">
      {/* Company */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold">Company</label>
            <div className="relative">
              <button
                type="button"
                onMouseEnter={() => setCompanyTooltip(true)}
                onMouseLeave={() => setCompanyTooltip(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <HelpCircle size={14} />
              </button>
              {companyTooltip && (
                <div className="absolute z-50 left-6 top-0 w-52 p-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg">
                  Search for specific target companies you want to work at
                </div>
              )}
            </div>
          </div>
          {criteria.targetCompanies.length > 0 && (
            <button
              type="button"
              onClick={() => update({ targetCompanies: [] })}
              className="text-xs text-emerald-600 hover:text-emerald-700"
            >
              Clear All
            </button>
          )}
        </div>
        <ChipInput
          label="Company"
          options={[]}
          selected={criteria.targetCompanies}
          onChange={(v) => update({ targetCompanies: v })}
          placeholder="Type company name..."
          freeText
        />
      </div>

      {/* Company Stage */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold">Company Stage</label>
          {criteria.companyStages.length > 0 && (
            <button
              type="button"
              onClick={() => update({ companyStages: [] })}
              className="text-xs text-emerald-600 hover:text-emerald-700"
            >
              Clear All
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {COMPANY_STAGES.map((cs) => (
            <button
              key={cs.value}
              type="button"
              onClick={() => toggleStage(cs.value)}
              className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
                criteria.companyStages.includes(cs.value)
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                  : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
            >
              {cs.label}
            </button>
          ))}
        </div>
      </div>

      {/* Exclude Staffing Agency */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={criteria.excludeStaffingAgency}
            onChange={(e) => update({ excludeStaffingAgency: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
          />
          <span className="text-sm text-gray-700">Exclude Staffing Agency</span>
          <div className="relative">
            <button
              type="button"
              onMouseEnter={() => setStaffingTooltip(true)}
              onMouseLeave={() => setStaffingTooltip(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <HelpCircle size={14} />
            </button>
            {staffingTooltip && (
              <div className="absolute z-50 left-6 top-0 w-52 p-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg">
                Filter out job listings from staffing and recruiting agencies
              </div>
            )}
          </div>
        </label>
      </div>

      {/* Exclude Company */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold">Exclude Company</label>
            <div className="relative">
              <button
                type="button"
                onMouseEnter={() => setExcludeCompanyTooltip(true)}
                onMouseLeave={() => setExcludeCompanyTooltip(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <HelpCircle size={14} />
              </button>
              {excludeCompanyTooltip && (
                <div className="absolute z-50 left-6 top-0 w-52 p-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg">
                  Exclude jobs from specific companies
                </div>
              )}
            </div>
          </div>
          {criteria.excludedCompanies.length > 0 && (
            <button
              type="button"
              onClick={() => update({ excludedCompanies: [] })}
              className="text-xs text-emerald-600 hover:text-emerald-700"
            >
              Clear All
            </button>
          )}
        </div>
        <ChipInput
          label="Exclude Company"
          options={[]}
          selected={criteria.excludedCompanies}
          onChange={(v) => update({ excludedCompanies: v })}
          placeholder="Type company name to exclude..."
          freeText
        />
      </div>
    </div>
  );
}
