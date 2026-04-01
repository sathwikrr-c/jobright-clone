'use client';

import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { Criteria } from '@/types';

interface CompensationCriteriaProps {
  criteria: Criteria;
  onChange: (criteria: Criteria) => void;
}

export default function CompensationCriteria({ criteria, onChange }: CompensationCriteriaProps) {
  const [h1bTooltip, setH1bTooltip] = useState(false);
  const [secTooltip, setSecTooltip] = useState(false);
  const [citizenTooltip, setCitizenTooltip] = useState(false);

  const update = (partial: Partial<Criteria>) => {
    onChange({ ...criteria, ...partial });
  };

  const salaryValue = criteria.minSalaryUsd ?? 0;
  const isAnySalary = !criteria.minSalaryUsd;

  const formatSalary = (val: number) => {
    if (val === 0) return 'Any salary (Open to all)';
    return `$${val.toLocaleString()}`;
  };

  return (
    <div className="space-y-8">
      {/* Minimum Annual Salary */}
      <div>
        <label className="block text-sm font-semibold mb-2">Minimum Annual Salary</label>
        <p className="text-sm text-gray-500 mb-3">{formatSalary(salaryValue)}</p>
        <input
          type="range"
          min={0}
          max={300000}
          step={5000}
          value={salaryValue}
          onChange={(e) => {
            const val = parseInt(e.target.value);
            update({ minSalaryUsd: val === 0 ? undefined : val });
          }}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Any</span>
          <span>$300k+</span>
        </div>
        {!isAnySalary && (
          <div className="mt-2">
            <input
              type="text"
              value={`$${salaryValue.toLocaleString()}`}
              onChange={(e) => {
                const num = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0;
                update({ minSalaryUsd: num === 0 ? undefined : Math.min(num, 300000) });
              }}
              className="w-40 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        )}
      </div>

      {/* H1B Sponsorship */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <label className="text-sm font-semibold">Work Authorization (H1B Sponsorship)</label>
          <div className="relative">
            <button
              type="button"
              onMouseEnter={() => setH1bTooltip(true)}
              onMouseLeave={() => setH1bTooltip(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <HelpCircle size={14} />
            </button>
            {h1bTooltip && (
              <div className="absolute z-50 left-6 top-0 w-64 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-lg">
                <p className="mb-1">
                  <strong>H1B Sponsored:</strong> Company has confirmed H1B sponsorship for this role.
                </p>
                <p>
                  <strong>H1B Sponsor Likely:</strong> Company has historically sponsored H1B visas.
                </p>
              </div>
            )}
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={criteria.h1bSponsorship}
            onChange={(e) => update({ h1bSponsorship: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
          <span className="ml-3 text-sm text-gray-700">
            {criteria.h1bSponsorship ? 'Enabled' : 'Disabled'}
          </span>
        </label>
      </div>

      {/* Exclude Jobs with Limitations */}
      <div>
        <label className="block text-sm font-semibold mb-3">Exclude Jobs with Limitations</label>
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={criteria.excludeSecurityClearance}
              onChange={(e) => update({ excludeSecurityClearance: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
            />
            <span className="text-sm text-gray-700">Security Clearance Required</span>
            <div className="relative ml-1">
              <button
                type="button"
                onMouseEnter={() => setSecTooltip(true)}
                onMouseLeave={() => setSecTooltip(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <HelpCircle size={14} />
              </button>
              {secTooltip && (
                <div className="absolute z-50 left-6 top-0 w-52 p-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg">
                  Exclude jobs that require security clearance
                </div>
              )}
            </div>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={criteria.excludeUsCitizenOnly}
              onChange={(e) => update({ excludeUsCitizenOnly: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
            />
            <span className="text-sm text-gray-700">US Citizen Only</span>
            <div className="relative ml-1">
              <button
                type="button"
                onMouseEnter={() => setCitizenTooltip(true)}
                onMouseLeave={() => setCitizenTooltip(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <HelpCircle size={14} />
              </button>
              {citizenTooltip && (
                <div className="absolute z-50 left-6 top-0 w-52 p-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg">
                  Exclude jobs restricted to US citizens only
                </div>
              )}
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
