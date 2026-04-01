import { Job } from '@/types';
import { detectAtsType } from './apply';

export interface PortalResult {
  portalUrl: string;
  atsType: string;
}

// Known ATS domain patterns
const ATS_DOMAINS = [
  { pattern: /greenhouse\.io|boards\.greenhouse|grnh\.se/i, type: 'greenhouse' },
  { pattern: /lever\.co|jobs\.lever/i, type: 'lever' },
  { pattern: /myworkday\.com|workday\.com|myworkdayjobs/i, type: 'workday' },
  { pattern: /ashbyhq\.com|jobs\.ashby/i, type: 'ashby' },
  { pattern: /icims\.com/i, type: 'icims' },
  { pattern: /taleo\.net/i, type: 'taleo' },
  { pattern: /smartrecruiters\.com/i, type: 'smartrecruiters' },
  { pattern: /bamboohr\.com/i, type: 'bamboohr' },
  { pattern: /jazz\.co|applytojob\.com/i, type: 'jazz' },
  { pattern: /recruitee\.com/i, type: 'recruitee' },
  { pattern: /breezy\.hr/i, type: 'breezy' },
  { pattern: /jobvite\.com/i, type: 'jobvite' },
];

// Job board domains (not company portals)
const JOB_BOARD_DOMAINS = [
  /linkedin\.com/i,
  /indeed\.com/i,
  /glassdoor\.com/i,
  /ziprecruiter\.com/i,
  /monster\.com/i,
  /careerbuilder\.com/i,
  /dice\.com/i,
  /angel\.co|wellfound\.com/i,
  /simplyhired\.com/i,
  /hired\.com/i,
];

/**
 * From a job's applyUrl, try to extract the direct company careers portal URL.
 * Returns { portalUrl, atsType } or null if no portal found.
 */
export async function findPortalUrl(job: Job): Promise<PortalResult | null> {
  const applyUrl = job.applyUrl;
  if (!applyUrl) return null;

  // Check if applyUrl already points to a known ATS / company portal
  const directAts = checkDirectAtsUrl(applyUrl);
  if (directAts) {
    return directAts;
  }

  // Check if it's a company website (not a job board)
  if (!isJobBoardUrl(applyUrl)) {
    const atsType = detectAtsType(applyUrl);
    return { portalUrl: applyUrl, atsType };
  }

  // If it's a LinkedIn apply URL, try to extract the company website link
  if (/linkedin\.com/i.test(applyUrl)) {
    const linkedinResult = await extractLinkedInPortal(applyUrl);
    if (linkedinResult) return linkedinResult;
  }

  // If job has a companyPortalUrl, use that
  if (job.companyPortalUrl) {
    const atsType = detectAtsType(job.companyPortalUrl);
    return { portalUrl: job.companyPortalUrl, atsType };
  }

  // Try to follow redirects on the apply URL to find the final destination
  const redirectResult = await followRedirects(applyUrl);
  if (redirectResult) {
    const directAtsRedirect = checkDirectAtsUrl(redirectResult);
    if (directAtsRedirect) return directAtsRedirect;

    if (!isJobBoardUrl(redirectResult)) {
      const atsType = detectAtsType(redirectResult);
      return { portalUrl: redirectResult, atsType };
    }
  }

  return null;
}

function checkDirectAtsUrl(url: string): PortalResult | null {
  for (const { pattern, type } of ATS_DOMAINS) {
    if (pattern.test(url)) {
      return { portalUrl: url, atsType: type };
    }
  }
  return null;
}

function isJobBoardUrl(url: string): boolean {
  return JOB_BOARD_DOMAINS.some((pattern) => pattern.test(url));
}

async function extractLinkedInPortal(linkedinUrl: string): Promise<PortalResult | null> {
  // LinkedIn job URLs sometimes encode the company apply URL
  // Format: https://www.linkedin.com/jobs/view/JOBID/?...
  // The actual company URL is usually available via the "Apply on company website" button
  // which we can't easily access without logging in.

  // Try to extract from URL parameters
  try {
    const url = new URL(linkedinUrl);
    const externalApplyUrl =
      url.searchParams.get('externalApplyLink') ||
      url.searchParams.get('url') ||
      url.searchParams.get('redirect');

    if (externalApplyUrl) {
      const decoded = decodeURIComponent(externalApplyUrl);
      const atsType = detectAtsType(decoded);
      return { portalUrl: decoded, atsType };
    }
  } catch {
    // Invalid URL
  }

  // Try following the LinkedIn apply redirect
  try {
    const response = await fetch(linkedinUrl, {
      method: 'HEAD',
      redirect: 'manual',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
    });

    const redirectUrl = response.headers.get('location');
    if (redirectUrl && !isJobBoardUrl(redirectUrl)) {
      const atsType = detectAtsType(redirectUrl);
      return { portalUrl: redirectUrl, atsType };
    }
  } catch {
    // Network error
  }

  return null;
}

async function followRedirects(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(10000),
    });

    const finalUrl = response.url;
    if (finalUrl !== url) {
      return finalUrl;
    }
  } catch {
    // Network error or timeout
  }

  return null;
}
