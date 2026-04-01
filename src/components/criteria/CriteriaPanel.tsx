'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import CriteriaNav from '@/components/criteria/CriteriaNav';
import BasicCriteria from '@/components/criteria/BasicCriteria';
import CompensationCriteria from '@/components/criteria/CompensationCriteria';
import InterestsCriteria from '@/components/criteria/InterestsCriteria';
import CompanyCriteria from '@/components/criteria/CompanyCriteria';
import { Criteria } from '@/types';

const DEFAULT_CRITERIA: Criteria = {
  jobFunctions: [],
  excludedTitles: [],
  jobTypes: [],
  workModels: [],
  locations: ['United States'],
  experienceLevels: [],
  minExperienceYears: undefined,
  datePosted: undefined,
  minSalaryUsd: undefined,
  h1bSponsorship: false,
  excludeSecurityClearance: false,
  excludeUsCitizenOnly: false,
  industries: [],
  excludedIndustries: [],
  skills: [],
  excludedSkills: [],
  roleTypes: [],
  targetCompanies: [],
  companyStages: [],
  excludeStaffingAgency: false,
  excludedCompanies: [],
};

interface CriteriaPanelProps {
  initialCriteria?: Criteria;
  onSave: (criteria: Criteria) => void;
  onClose?: () => void;
}

export default function CriteriaPanel({
  initialCriteria,
  onSave,
  onClose,
}: CriteriaPanelProps) {
  const [criteria, setCriteria] = useState<Criteria>(initialCriteria ?? DEFAULT_CRITERIA);
  const [activeSection, setActiveSection] = useState(0);

  const handleDelete = () => {
    setCriteria(DEFAULT_CRITERIA);
  };

  // Build summary text
  const buildSummary = () => {
    const parts: string[] = [];
    if (criteria.jobFunctions.length > 0) {
      const first = criteria.jobFunctions[0];
      const rest = criteria.jobFunctions.length - 1;
      parts.push(rest > 0 ? `${first} + ${rest} roles` : first);
    }
    if (criteria.locations.length > 0 && criteria.locations[0]) {
      parts.push(`Within ${criteria.locations[0]}`);
    }
    return parts.join(', ') || 'No criteria set';
  };

  // Build active filter chips
  const buildActiveFilters = (): { label: string; onRemove: () => void }[] => {
    const filters: { label: string; onRemove: () => void }[] = [];

    criteria.jobFunctions.forEach((jf) => {
      filters.push({
        label: jf,
        onRemove: () =>
          setCriteria((c) => ({
            ...c,
            jobFunctions: c.jobFunctions.filter((v) => v !== jf),
          })),
      });
    });

    criteria.jobTypes.forEach((jt) => {
      filters.push({
        label: jt,
        onRemove: () =>
          setCriteria((c) => ({
            ...c,
            jobTypes: c.jobTypes.filter((v) => v !== jt),
          })),
      });
    });

    criteria.workModels.forEach((wm) => {
      filters.push({
        label: wm,
        onRemove: () =>
          setCriteria((c) => ({
            ...c,
            workModels: c.workModels.filter((v) => v !== wm),
          })),
      });
    });

    criteria.industries.forEach((ind) => {
      filters.push({
        label: ind,
        onRemove: () =>
          setCriteria((c) => ({
            ...c,
            industries: c.industries.filter((v) => v !== ind),
          })),
      });
    });

    criteria.skills.forEach((sk) => {
      filters.push({
        label: sk,
        onRemove: () =>
          setCriteria((c) => ({
            ...c,
            skills: c.skills.filter((v) => v !== sk),
          })),
      });
    });

    return filters;
  };

  const activeFilters = buildActiveFilters();

  const sectionContent = () => {
    switch (activeSection) {
      case 0:
        return <BasicCriteria criteria={criteria} onChange={setCriteria} />;
      case 1:
        return <CompensationCriteria criteria={criteria} onChange={setCriteria} />;
      case 2:
        return <InterestsCriteria criteria={criteria} onChange={setCriteria} />;
      case 3:
        return <CompanyCriteria criteria={criteria} onChange={setCriteria} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Top bar */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Job Criteria</h2>
            <p className="text-sm text-gray-500 mt-0.5">{buildSummary()}</p>
          </div>
          <div className="flex items-center gap-3">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            )}
            <button
              type="button"
              onClick={() => onSave(criteria)}
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Confirm
            </button>
          </div>
        </div>

        {/* Active filter chips */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
            {activeFilters.slice(0, 20).map((f, idx) => (
              <span
                key={`${f.label}-${idx}`}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-emerald-100 text-emerald-800"
              >
                {f.label}
                <button
                  type="button"
                  onClick={f.onRemove}
                  className="hover:text-emerald-600"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            {activeFilters.length > 20 && (
              <span className="text-xs text-gray-500 py-1">
                +{activeFilters.length - 20} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main content: nav + section */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left nav */}
        <div className="w-64 flex-shrink-0 border-r border-gray-200 py-4 overflow-y-auto">
          <CriteriaNav
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            onDelete={handleDelete}
          />
        </div>

        {/* Right content */}
        <div className="flex-1 overflow-y-auto p-6">{sectionContent()}</div>
      </div>
    </div>
  );
}
