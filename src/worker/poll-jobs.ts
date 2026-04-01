import { Job, Criteria } from '@/types';
import { searchJobs } from '@/lib/jsearch';

/**
 * Poll JSearch API for new jobs matching the given criteria.
 * Deduplicates against seen_jobs in Supabase.
 * Marks new jobs as seen.
 * Returns array of new Job objects.
 */
export async function pollJobs(criteria: Criteria): Promise<Job[]> {
  const allJobs: Job[] = [];

  // Query JSearch for each job function in criteria
  const location = criteria.locations.length > 0 ? criteria.locations[0] : 'United States';

  for (const jobFunction of criteria.jobFunctions) {
    try {
      console.log(`[PollJobs] Searching for: "${jobFunction}" in "${location}"`);
      const jobs = await searchJobs(jobFunction, location, 1, criteria.datePosted);
      allJobs.push(...jobs);
      console.log(`[PollJobs] Found ${jobs.length} jobs for "${jobFunction}"`);
    } catch (error) {
      console.error(`[PollJobs] Error searching for "${jobFunction}":`, error);
    }

    // Small delay between API calls to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Deduplicate by job ID
  const uniqueJobs = deduplicateJobs(allJobs);
  console.log(`[PollJobs] ${uniqueJobs.length} unique jobs after dedup`);

  // Filter out already-seen jobs
  const newJobs = await filterSeenJobs(uniqueJobs);
  console.log(`[PollJobs] ${newJobs.length} new (unseen) jobs`);

  // Mark new jobs as seen
  await markJobsAsSeen(newJobs);

  return newJobs;
}

function deduplicateJobs(jobs: Job[]): Job[] {
  const seen = new Set<string>();
  return jobs.filter((job) => {
    if (seen.has(job.id)) return false;
    seen.add(job.id);
    return true;
  });
}

async function filterSeenJobs(jobs: Job[]): Promise<Job[]> {
  if (jobs.length === 0) return [];

  // Try Supabase first
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    try {
      const { getServiceClient } = await import('@/lib/supabase');
      const supabase = getServiceClient();

      const jobIds = jobs.map((j) => j.id);

      const { data: seenJobs, error } = await supabase
        .from('seen_jobs')
        .select('job_id')
        .in('job_id', jobIds);

      if (!error && seenJobs) {
        const seenIds = new Set(seenJobs.map((s: { job_id: string }) => s.job_id));
        return jobs.filter((j) => !seenIds.has(j.id));
      }
    } catch (error) {
      console.warn('[PollJobs] Supabase seen_jobs check failed, returning all jobs:', error);
    }
  }

  // Fallback: use local file-based tracking
  try {
    const fs = await import('fs');
    const path = await import('path');
    const seenFile = path.join('/tmp', 'jobright-seen-jobs.json');

    let seenIds: Set<string>;
    if (fs.existsSync(seenFile)) {
      const data = JSON.parse(fs.readFileSync(seenFile, 'utf-8'));
      seenIds = new Set(data);
    } else {
      seenIds = new Set();
    }

    return jobs.filter((j) => !seenIds.has(j.id));
  } catch {
    return jobs;
  }
}

async function markJobsAsSeen(jobs: Job[]): Promise<void> {
  if (jobs.length === 0) return;

  // Try Supabase first
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    try {
      const { getServiceClient } = await import('@/lib/supabase');
      const supabase = getServiceClient();

      const records = jobs.map((j) => ({
        job_id: j.id,
        title: j.title,
        company: j.company,
        seen_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('seen_jobs')
        .upsert(records, { onConflict: 'job_id' });

      if (!error) {
        console.log(`[PollJobs] Marked ${jobs.length} jobs as seen in Supabase`);
        return;
      }
    } catch (error) {
      console.warn('[PollJobs] Supabase mark-seen failed:', error);
    }
  }

  // Fallback: local file
  try {
    const fs = await import('fs');
    const path = await import('path');
    const seenFile = path.join('/tmp', 'jobright-seen-jobs.json');

    let seenIds: string[];
    if (fs.existsSync(seenFile)) {
      seenIds = JSON.parse(fs.readFileSync(seenFile, 'utf-8'));
    } else {
      seenIds = [];
    }

    const newIds = jobs.map((j) => j.id);
    const combined = [...new Set([...seenIds, ...newIds])];

    // Keep only last 10,000 entries to avoid unbounded growth
    const trimmed = combined.slice(-10000);
    fs.writeFileSync(seenFile, JSON.stringify(trimmed), 'utf-8');
    console.log(`[PollJobs] Marked ${jobs.length} jobs as seen locally`);
  } catch (error) {
    console.error('[PollJobs] Failed to save seen jobs:', error);
  }
}
