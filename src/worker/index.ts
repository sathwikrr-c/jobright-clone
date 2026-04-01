import { Criteria, Profile, Application } from '@/types';
import { pollJobs } from './poll-jobs';
import { matchCriteria } from './match-criteria';
import { findPortalUrl } from './find-portal';
import { applyToJob, detectAtsType } from './apply';
import { canApply, waitForSlot, incrementDailyCount, getDailyCount, getMaxDaily } from './utils/rate-limiter';

/**
 * Main worker orchestrator entry point.
 * Designed to run in GitHub Actions every 5 minutes.
 *
 * Flow:
 *   1. Load criteria and profile (Supabase -> env vars -> local JSON)
 *   2. Add random jitter at start (0-120s)
 *   3. Poll JSearch for new jobs
 *   4. Match against user criteria
 *   5. For each match: find portal URL -> apply
 *   6. Log results to console and Supabase applications table
 */
async function main(): Promise<void> {
  console.log('=== Jobright Worker Starting ===');
  console.log(`Time: ${new Date().toISOString()}`);

  // Random jitter at start (0-120 seconds)
  const jitterMs = Math.floor(Math.random() * 120 * 1000);
  console.log(`Jitter: waiting ${Math.round(jitterMs / 1000)}s...`);
  await new Promise((resolve) => setTimeout(resolve, jitterMs));

  // Load criteria and profile
  const criteria = await loadCriteria();
  const profile = await loadProfile();

  if (!criteria) {
    console.error('No criteria found. Set up criteria in the dashboard or provide CRITERIA_JSON env var.');
    process.exit(1);
  }

  if (!profile) {
    console.error('No profile found. Set up profile in the dashboard or provide PROFILE_JSON env var.');
    process.exit(1);
  }

  console.log(`Criteria: ${criteria.jobFunctions.length} job functions, ${criteria.locations.length} locations`);
  console.log(`Profile: ${profile.fullName} (${profile.email})`);

  // Check rate limits
  const dailyCount = await getDailyCount();
  const maxDaily = getMaxDaily();
  console.log(`Daily applications: ${dailyCount}/${maxDaily}`);

  if (!(await canApply())) {
    console.log('Daily application limit reached. Exiting.');
    return;
  }

  // Step 1: Poll for new jobs
  console.log('\n--- Polling for new jobs ---');
  const newJobs = await pollJobs(criteria);
  console.log(`Found ${newJobs.length} new jobs`);

  if (newJobs.length === 0) {
    console.log('No new jobs found. Exiting.');
    return;
  }

  // Step 2: Match against criteria
  console.log('\n--- Matching against criteria ---');
  const matchedJobs = matchCriteria(newJobs, criteria);
  console.log(`${matchedJobs.length} jobs match criteria`);

  if (matchedJobs.length === 0) {
    console.log('No jobs match criteria. Exiting.');
    return;
  }

  // Step 3: For each match, find portal and apply
  console.log('\n--- Processing matched jobs ---');
  const results: Application[] = [];

  for (const job of matchedJobs) {
    // Check rate limit before each application
    if (!(await canApply())) {
      console.log('Daily limit reached. Stopping.');
      break;
    }

    console.log(`\nProcessing: "${job.title}" at ${job.company}`);

    // Find the company portal URL
    const portal = await findPortalUrl(job);
    if (!portal) {
      console.log(`  No portal URL found, skipping.`);
      continue;
    }

    console.log(`  Portal: ${portal.portalUrl} (${portal.atsType})`);

    // Apply
    try {
      const result = await applyToJob(job, profile, portal.portalUrl, portal.atsType);

      const application: Application = {
        id: `app-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        companyPortalUrl: portal.portalUrl,
        atsType: portal.atsType,
        status: result.success
          ? portal.atsType === 'generic'
            ? 'needs_review'
            : 'applied'
          : 'failed',
        matchScore: job.matchScore ?? 0,
        appliedAt: new Date().toISOString(),
        errorMsg: result.error,
        screenshotUrl: result.screenshotPath,
      };

      results.push(application);
      await logApplication(application);
      await incrementDailyCount();

      console.log(`  Result: ${application.status}${result.error ? ` - ${result.error}` : ''}`);

      // Wait between applications
      if (matchedJobs.indexOf(job) < matchedJobs.length - 1) {
        await waitForSlot();
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`  Error applying to ${job.title}:`, errorMsg);

      const application: Application = {
        id: `app-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        companyPortalUrl: portal.portalUrl,
        atsType: portal.atsType,
        status: 'failed',
        matchScore: job.matchScore ?? 0,
        appliedAt: new Date().toISOString(),
        errorMsg,
      };

      results.push(application);
      await logApplication(application);
    }
  }

  // Summary
  console.log('\n=== Worker Summary ===');
  console.log(`Total matched: ${matchedJobs.length}`);
  console.log(`Applied: ${results.filter((r) => r.status === 'applied').length}`);
  console.log(`Needs review: ${results.filter((r) => r.status === 'needs_review').length}`);
  console.log(`Failed: ${results.filter((r) => r.status === 'failed').length}`);
  console.log('=== Worker Complete ===');
}

async function loadCriteria(): Promise<Criteria | null> {
  // Try Supabase first
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    try {
      const { getServiceClient } = await import('@/lib/supabase');
      const supabase = getServiceClient();

      const { data, error } = await supabase
        .from('criteria')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        console.log('Loaded criteria from Supabase');
        return data as Criteria;
      }
    } catch {
      // Fall through
    }
  }

  // Try env var
  if (process.env.CRITERIA_JSON) {
    try {
      const criteria = JSON.parse(process.env.CRITERIA_JSON) as Criteria;
      console.log('Loaded criteria from CRITERIA_JSON env var');
      return criteria;
    } catch (error) {
      console.error('Failed to parse CRITERIA_JSON:', error);
    }
  }

  // Try local file
  try {
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.join(process.cwd(), 'criteria.json');
    if (fs.existsSync(filePath)) {
      const criteria = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Criteria;
      console.log('Loaded criteria from local criteria.json');
      return criteria;
    }
  } catch {
    // Fall through
  }

  return null;
}

async function loadProfile(): Promise<Profile | null> {
  // Try Supabase first
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    try {
      const { getServiceClient } = await import('@/lib/supabase');
      const supabase = getServiceClient();

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        console.log('Loaded profile from Supabase');
        return data as Profile;
      }
    } catch {
      // Fall through
    }
  }

  // Try env var
  if (process.env.PROFILE_JSON) {
    try {
      const profile = JSON.parse(process.env.PROFILE_JSON) as Profile;
      console.log('Loaded profile from PROFILE_JSON env var');
      return profile;
    } catch (error) {
      console.error('Failed to parse PROFILE_JSON:', error);
    }
  }

  // Try local file
  try {
    const fs = await import('fs');
    const path = await import('path');
    const filePath = path.join(process.cwd(), 'profile.json');
    if (fs.existsSync(filePath)) {
      const profile = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Profile;
      console.log('Loaded profile from local profile.json');
      return profile;
    }
  } catch {
    // Fall through
  }

  return null;
}

async function logApplication(application: Application): Promise<void> {
  // Log to Supabase
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    try {
      const { getServiceClient } = await import('@/lib/supabase');
      const supabase = getServiceClient();

      const { error } = await supabase.from('applications').insert({
        id: application.id,
        job_id: application.jobId,
        job_title: application.jobTitle,
        company: application.company,
        company_portal_url: application.companyPortalUrl,
        ats_type: application.atsType,
        status: application.status,
        match_score: application.matchScore,
        applied_at: application.appliedAt,
        error_msg: application.errorMsg,
        screenshot_url: application.screenshotUrl,
      });

      if (error) {
        console.warn('Failed to log application to Supabase:', error);
      }
    } catch {
      // Fall through to console-only logging
    }
  }

  // Always log to console
  console.log(
    `[Application] ${application.status.toUpperCase()} | ` +
      `${application.jobTitle} @ ${application.company} | ` +
      `ATS: ${application.atsType} | ` +
      `Score: ${application.matchScore}`
  );
}

// Run the worker
main().catch((error) => {
  console.error('Worker failed:', error);
  process.exit(1);
});
