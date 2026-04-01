'use client';

import { useState, useEffect, useCallback } from 'react';
import { Job, TabType } from '@/types';
import JobList from '@/components/jobs/JobList';
import FilterBar from '@/components/jobs/FilterBar';
import RightPanel from '@/components/layout/RightPanel';

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [likedJobs, setLikedJobs] = useState<Job[]>([]);
  const [appliedCount, setAppliedCount] = useState(0);
  const [tab, setTab] = useState<TabType>('recommended');
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('United States');
  const [activeFilters, setActiveFilters] = useState<Array<{ key: string; label: string }>>([
    { key: 'pm', label: 'Product Manager' },
    { key: 'entry', label: 'Entry Level' },
    { key: 'ft', label: 'Full-time' },
  ]);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: query || 'Product Manager',
        location,
      });
      const res = await fetch(`/api/jobs?${params}`);
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [query, location]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

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

  const handleRemoveFilter = (key: string) => {
    setActiveFilters((prev) => prev.filter((f) => f.key !== key));
  };

  const displayJobs = tab === 'liked' ? likedJobs : jobs;

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
        <FilterBar
          activeFilters={activeFilters}
          onRemoveFilter={handleRemoveFilter}
          onClearAll={() => setActiveFilters([])}
        />

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
