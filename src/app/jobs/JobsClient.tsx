'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Job, TabType } from '@/types';
import JobList from '@/components/jobs/JobList';
import FilterBar, { JobFilters } from '@/components/jobs/FilterBar';
import RightPanel from '@/components/layout/RightPanel';

export default function JobsClient() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [likedJobs, setLikedJobs] = useState<Job[]>([]);
  const [appliedCount, setAppliedCount] = useState(0);
  const [tab, setTab] = useState<TabType>('recommended');
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [location] = useState('United States');
  const [filters, setFilters] = useState<JobFilters>({
    locations: ['San Francisco, CA', 'Bay Area, CA', 'Los Angeles, CA', 'Seattle, WA', 'New York, NY'],
    jobFunctions: ['Project/Program Manager', 'Technical Project Manager'],
    experienceLevels: ['mid'],
    jobTypes: ['fulltime'],
    workModels: [],
  });

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      // If user typed a search query, use that. Otherwise use all selected job functions.
      const searchQuery =
        query ||
        (filters.jobFunctions.length > 0
          ? filters.jobFunctions.join(' OR ')
          : 'Technical Program Manager');
      // Use selected locations or default
      const searchLocation =
        filters.locations.length > 0
          ? filters.locations.join(', ')
          : location;
      const params = new URLSearchParams({
        q: searchQuery,
        location: searchLocation,
      });
      const res = await fetch(`/api/jobs?${params}`);
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [query, location, filters.jobFunctions, filters.locations]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Apply client-side filters
  // Location and job functions drive the API search query, so only filter by other criteria here
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (filters.experienceLevels.length > 0 && !filters.experienceLevels.includes(job.experienceLevel)) {
        return false;
      }
      if (filters.jobTypes.length > 0 && !filters.jobTypes.includes(job.jobType)) {
        return false;
      }
      if (filters.workModels.length > 0 && !filters.workModels.includes(job.workModel)) {
        return false;
      }
      return true;
    });
  }, [jobs, filters]);

  const handleLike = (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;
    setLikedJobs((prev) => {
      const exists = prev.find((j) => j.id === jobId);
      if (exists) return prev.filter((j) => j.id !== jobId);
      return [...prev, job];
    });
  };

  const handleDismiss = (jobId: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
  };

  const handleApply = (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId) || likedJobs.find((j) => j.id === jobId);
    if (job) {
      window.open(job.applyUrl || job.companyPortalUrl, '_blank');
      setAppliedCount((c) => c + 1);
    }
  };

  // Show filtered jobs for recommended, all liked jobs for liked tab
  const displayJobs = tab === 'liked' ? likedJobs : tab === 'recommended' ? filteredJobs : [];

  return (
    <div className="flex min-h-screen overflow-hidden">
      <div className="flex-1 min-w-0 overflow-y-auto">
        {/* Top navigation tabs */}
        <div className="sticky top-0 bg-white z-10 border-b border-gray-200">
          <div className="flex items-center px-6 pt-4">
            <h1 className="text-2xl font-bold mr-6">JOBS</h1>
            <nav className="flex gap-6">
              <button
                onClick={() => setTab('recommended')}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === 'recommended'
                    ? 'border-emerald-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Recommended
              </button>
              <button
                onClick={() => setTab('liked')}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === 'liked'
                    ? 'border-emerald-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Liked{' '}
                <span className="ml-1 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                  {likedJobs.length}
                </span>
              </button>
              <button
                onClick={() => setTab('applied')}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === 'applied'
                    ? 'border-emerald-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Applied{' '}
                <span className="ml-1 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                  {appliedCount}
                </span>
              </button>
            </nav>
            <div className="ml-auto">
              <input
                type="text"
                placeholder="Search by title or company"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchJobs()}
                className="px-4 py-2 border border-gray-300 rounded-full text-sm w-64 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <FilterBar filters={filters} onFiltersChange={setFilters} />

        {/* Job list */}
        <div className="px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
            </div>
          ) : (
            <JobList
              jobs={displayJobs}
              tab={tab}
              onLike={handleLike}
              onDismiss={handleDismiss}
              onApply={handleApply}
            />
          )}
        </div>
      </div>

      {/* Right panel — hidden below xl */}
      <div className="hidden xl:block w-72 flex-shrink-0 border-l border-gray-200">
        <RightPanel />
      </div>
    </div>
  );
}
