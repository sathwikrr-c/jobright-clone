const MAX_DAILY = parseInt(process.env.MAX_DAILY_APPLICATIONS || '20', 10);

// In-memory fallback counter
let localDailyCount = 0;
let localCountDate = new Date().toISOString().split('T')[0];

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function resetIfNewDay(): void {
  const today = getTodayKey();
  if (localCountDate !== today) {
    localDailyCount = 0;
    localCountDate = today;
  }
}

/**
 * Check if we can still apply today (under daily limit).
 */
export async function canApply(): Promise<boolean> {
  const count = await getDailyCount();
  return count < MAX_DAILY;
}

/**
 * Sleep for a random 2-5 minutes between applications.
 */
export async function waitForSlot(): Promise<void> {
  const minWaitMs = 2 * 60 * 1000; // 2 minutes
  const maxWaitMs = 5 * 60 * 1000; // 5 minutes
  const waitMs = Math.floor(Math.random() * (maxWaitMs - minWaitMs + 1)) + minWaitMs;

  console.log(`Rate limiter: waiting ${Math.round(waitMs / 1000)}s before next application`);
  await new Promise((resolve) => setTimeout(resolve, waitMs));
}

/**
 * Get the number of applications submitted today.
 */
export async function getDailyCount(): Promise<number> {
  // Try Supabase first
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    try {
      const { getServiceClient } = await import('@/lib/supabase');
      const supabase = getServiceClient();
      const today = getTodayKey();

      const { count, error } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .gte('applied_at', `${today}T00:00:00.000Z`)
        .lt('applied_at', `${today}T23:59:59.999Z`)
        .in('status', ['applied', 'needs_review']);

      if (!error && count !== null) {
        return count;
      }
    } catch {
      // Fall through to local counter
    }
  }

  // Fallback: local counter
  resetIfNewDay();
  return localDailyCount;
}

/**
 * Increment the daily application counter.
 */
export async function incrementDailyCount(): Promise<void> {
  resetIfNewDay();
  localDailyCount++;
}

/**
 * Get the configured maximum daily applications.
 */
export function getMaxDaily(): number {
  return MAX_DAILY;
}
