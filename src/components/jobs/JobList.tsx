'use client';

import { Inbox, Heart, CheckCircle } from 'lucide-react';
import type { Job, TabType } from '@/types';
import JobCard from './JobCard';

interface JobListProps {
  jobs: Job[];
  tab: TabType;
  onLike?: (jobId: string) => void;
  onDismiss?: (jobId: string) => void;
  onApply?: (jobId: string) => void;
  applicationStatuses?: Record<string, string>;
}

const emptyStates: Record<TabType, { icon: typeof Inbox; title: string; description: string }> = {
  recommended: {
    icon: Inbox,
    title: 'No recommended jobs yet',
    description: 'Update your profile and filters to get personalized recommendations.',
  },
  liked: {
    icon: Heart,
    title: 'No liked jobs yet',
    description: 'Like jobs from the Recommended tab to save them here.',
  },
  applied: {
    icon: CheckCircle,
    title: 'No applications yet',
    description: 'Apply to jobs to track your application status here.',
  },
};

export default function JobList({
  jobs,
  tab,
  onLike,
  onDismiss,
  onApply,
  applicationStatuses,
}: JobListProps) {
  if (jobs.length === 0) {
    const empty = emptyStates[tab];
    const Icon = empty.icon;
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 rounded-full bg-gray-100 p-4">
          <Icon size={32} className="text-gray-400" />
        </div>
        <h3 className="text-base font-semibold text-gray-700">{empty.title}</h3>
        <p className="mt-1 max-w-sm text-sm text-gray-500">{empty.description}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Apply All for liked tab */}
      {tab === 'liked' && jobs.length > 0 && (
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {jobs.length} saved {jobs.length === 1 ? 'job' : 'jobs'}
          </p>
          <button
            onClick={() => jobs.forEach((j) => onApply?.(j.id))}
            className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-600"
          >
            Apply All ({jobs.length})
          </button>
        </div>
      )}

      <div className="space-y-4">
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            tab={tab}
            onLike={onLike}
            onDismiss={onDismiss}
            onApply={onApply}
            applicationStatus={applicationStatuses?.[job.id]}
          />
        ))}
      </div>
    </div>
  );
}
