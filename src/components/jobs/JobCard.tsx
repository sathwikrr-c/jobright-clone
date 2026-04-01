'use client';

import {
  MapPin,
  Building2,
  Clock,
  Briefcase,
  DollarSign,
  Users,
  X,
  Heart,
  Sparkles,
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Job, TabType } from '@/types';
import MatchScoreRing from './MatchScoreRing';

interface JobCardProps {
  job: Job;
  tab: TabType;
  onLike?: (jobId: string) => void;
  onDismiss?: (jobId: string) => void;
  onApply?: (jobId: string) => void;
  applicationStatus?: string;
}

const workModelLabels: Record<string, string> = {
  onsite: 'Onsite',
  hybrid: 'Hybrid',
  remote: 'Remote',
};

const jobTypeLabels: Record<string, string> = {
  fulltime: 'Full-time',
  contract: 'Contract',
  parttime: 'Part-time',
  internship: 'Internship',
};

const experienceLevelLabels: Record<string, string> = {
  intern: 'Intern/New Grad',
  entry: 'Entry Level',
  mid: 'Mid Level',
  senior: 'Senior Level',
  lead: 'Lead/Staff',
  director: 'Director+',
};

function formatSalary(min?: number, max?: number): string | null {
  if (!min && !max) return null;
  const fmt = (n: number) =>
    n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${n}`;
  if (min && max) return `${fmt(min)} - ${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  return `Up to ${fmt(max!)}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

function CompanyLogo({ company }: { company: string }) {
  const colors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-rose-500',
    'bg-amber-500',
    'bg-teal-500',
    'bg-indigo-500',
  ];
  const idx =
    company.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) %
    colors.length;
  return (
    <div
      className={clsx(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white',
        colors[idx]
      )}
    >
      {company.charAt(0).toUpperCase()}
    </div>
  );
}

const statusBadgeStyles: Record<string, string> = {
  applied: 'bg-emerald-50 text-emerald-700',
  failed: 'bg-red-50 text-red-700',
  needs_review: 'bg-amber-50 text-amber-700',
  pending: 'bg-gray-100 text-gray-600',
  applying: 'bg-blue-50 text-blue-700',
};

export default function JobCard({
  job,
  tab,
  onLike,
  onDismiss,
  onApply,
  applicationStatus,
}: JobCardProps) {
  const salary = formatSalary(job.salaryMin, job.salaryMax);

  return (
    <div className="group rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md">
      <div className="flex gap-5">
        {/* Left section */}
        <div className="min-w-0 flex-1">
          {/* Company row */}
          <div className="flex items-center gap-3">
            <CompanyLogo company={job.company} />
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900">{job.company}</p>
              <p className="truncate text-xs text-gray-500">{job.industry}</p>
            </div>
          </div>

          {/* Title */}
          <h3 className="mt-3 text-base font-bold text-gray-900">
            {job.title}
          </h3>

          {/* Metadata grid */}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1">
              <MapPin size={13} className="text-gray-400" />
              {job.location}
            </span>
            <span className="inline-flex items-center gap-1">
              <Building2 size={13} className="text-gray-400" />
              {workModelLabels[job.workModel] ?? job.workModel}
            </span>
            <span className="inline-flex items-center gap-1">
              <Briefcase size={13} className="text-gray-400" />
              {jobTypeLabels[job.jobType] ?? job.jobType}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock size={13} className="text-gray-400" />
              {experienceLevelLabels[job.experienceLevel] ?? job.experienceLevel}
            </span>
            {salary && (
              <span className="inline-flex items-center gap-1">
                <DollarSign size={13} className="text-gray-400" />
                {salary}
              </span>
            )}
            {job.experienceYears && (
              <span className="text-gray-400">{job.experienceYears}</span>
            )}
          </div>

          {/* Applicant count */}
          {job.applicantCount != null && (
            <p className="mt-2 inline-flex items-center gap-1 text-xs text-gray-400">
              <Users size={13} />
              {job.applicantCount} applicants
            </p>
          )}
        </div>

        {/* Right section - match score */}
        {job.matchScore != null && (
          <div className="shrink-0">
            <MatchScoreRing
              score={job.matchScore}
              h1bSponsor={job.h1bSponsorship}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            {timeAgo(job.postedAt)}
          </span>
          {job.socialProof && (
            <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-medium text-orange-600">
              {job.socialProof}
            </span>
          )}
        </div>

        {/* Actions depend on tab */}
        <div className="flex items-center gap-2">
          {tab === 'applied' && applicationStatus ? (
            <span
              className={twMerge(
                clsx(
                  'rounded-full px-3 py-1 text-xs font-medium capitalize',
                  statusBadgeStyles[applicationStatus] ?? 'bg-gray-100 text-gray-600'
                )
              )}
            >
              {applicationStatus.replace('_', ' ')}
            </span>
          ) : (
            <>
              {tab === 'recommended' && (
                <>
                  <button
                    onClick={() => onDismiss?.(job.id)}
                    className="rounded-full border border-gray-200 p-2 text-gray-400 transition-colors hover:border-gray-300 hover:text-gray-600"
                    aria-label="Dismiss"
                  >
                    <X size={16} />
                  </button>
                  <button
                    onClick={() => onLike?.(job.id)}
                    className="rounded-full border border-gray-200 p-2 text-gray-400 transition-colors hover:border-rose-300 hover:text-rose-500"
                    aria-label="Like"
                  >
                    <Heart size={16} />
                  </button>
                  <button className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 transition-colors hover:bg-purple-100">
                    <Sparkles size={13} />
                    ASK ORION
                  </button>
                </>
              )}
              {tab === 'liked' && (
                <button
                  onClick={() => onApply?.(job.id)}
                  className="rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-600"
                >
                  Apply Now
                </button>
              )}
              {tab === 'recommended' && (
                <button
                  onClick={() => onApply?.(job.id)}
                  className="rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-600"
                >
                  APPLY WITH AUTOFILL
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
