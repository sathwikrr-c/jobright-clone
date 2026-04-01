'use client';

import { Trash2, Info } from 'lucide-react';

interface CriteriaNavProps {
  activeSection: number;
  onSectionChange: (section: number) => void;
  onDelete: () => void;
}

const sections = [
  {
    title: 'Basic Job Criteria',
    subtitle: 'Job Function / Job Type / Work Model...',
  },
  {
    title: 'Compensation & Sponsorship',
    subtitle: 'Annual Salary / H1B Sponsorship',
  },
  {
    title: 'Areas of Interests',
    subtitle: 'Industry / Skill / Role(IC/Manager)...',
  },
  {
    title: 'Company Insights',
    subtitle: 'Company Search / Exclude Staffing Agency...',
  },
];

export default function CriteriaNav({
  activeSection,
  onSectionChange,
  onDelete,
}: CriteriaNavProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Section navigation */}
      <div className="space-y-1">
        {sections.map((section, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSectionChange(idx)}
            className={`w-full text-left px-4 py-3 rounded-r-lg transition-colors border-l-3 ${
              activeSection === idx
                ? 'border-l-emerald-500 bg-emerald-50'
                : 'border-l-transparent hover:bg-gray-50'
            }`}
          >
            <p
              className={`text-sm ${
                activeSection === idx ? 'font-bold text-gray-900' : 'font-medium text-gray-700'
              }`}
            >
              {section.title}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{section.subtitle}</p>
          </button>
        ))}
      </div>

      {/* Info box */}
      <div className="mt-6 mx-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex gap-2">
          <Info size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            Applying for specific companies? Use filters in the{' '}
            <button
              type="button"
              onClick={() => onSectionChange(3)}
              className="font-semibold underline"
            >
              Company Insights
            </button>{' '}
            section to find your target companies.
          </p>
        </div>
      </div>

      {/* Delete button */}
      <div className="mt-auto pt-6 px-4">
        <button
          type="button"
          onClick={onDelete}
          className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 transition-colors"
        >
          <Trash2 size={16} />
          Delete
        </button>
      </div>
    </div>
  );
}
