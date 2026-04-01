import { Job, Profile } from '@/types';
import { applyGreenhouse } from './greenhouse';
import { applyLever } from './lever';
import { applyWorkday } from './workday';
import { applyAshby } from './ashby';
import { applyGeneric } from './generic';

export interface ApplyResult {
  success: boolean;
  screenshotPath?: string;
  error?: string;
}

const ATS_PATTERNS: Array<{ type: string; patterns: RegExp[] }> = [
  {
    type: 'greenhouse',
    patterns: [
      /greenhouse\.io/i,
      /boards\.greenhouse/i,
      /grnh\.se/i,
    ],
  },
  {
    type: 'lever',
    patterns: [
      /lever\.co/i,
      /jobs\.lever/i,
    ],
  },
  {
    type: 'workday',
    patterns: [
      /myworkday\.com/i,
      /workday\.com/i,
      /wd\d+\.myworkdayjobs/i,
    ],
  },
  {
    type: 'ashby',
    patterns: [
      /ashbyhq\.com/i,
      /jobs\.ashby/i,
    ],
  },
  {
    type: 'icims',
    patterns: [
      /icims\.com/i,
      /jobs-.*\.icims/i,
    ],
  },
  {
    type: 'taleo',
    patterns: [
      /taleo\.net/i,
      /oracle.*cloud.*jobs/i,
    ],
  },
  {
    type: 'smartrecruiters',
    patterns: [
      /smartrecruiters\.com/i,
      /jobs\.smartrecruiters/i,
    ],
  },
  {
    type: 'bamboohr',
    patterns: [
      /bamboohr\.com/i,
    ],
  },
  {
    type: 'jazz',
    patterns: [
      /jazz\.co/i,
      /applytojob\.com/i,
    ],
  },
  {
    type: 'recruitee',
    patterns: [
      /recruitee\.com/i,
    ],
  },
];

/**
 * Detect the ATS type from a URL.
 */
export function detectAtsType(url: string): string {
  for (const { type, patterns } of ATS_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(url)) {
        return type;
      }
    }
  }
  return 'generic';
}

/**
 * Route to the correct ATS handler and apply to the job.
 */
export async function applyToJob(
  job: Job,
  profile: Profile,
  portalUrl: string,
  atsType: string
): Promise<ApplyResult> {
  console.log(`[Apply] Applying to ${job.title} at ${job.company} via ${atsType}`);
  console.log(`[Apply] Portal URL: ${portalUrl}`);

  switch (atsType) {
    case 'greenhouse':
      return applyGreenhouse(job, profile, portalUrl);
    case 'lever':
      return applyLever(job, profile, portalUrl);
    case 'workday':
      return applyWorkday(job, profile, portalUrl);
    case 'ashby':
      return applyAshby(job, profile, portalUrl);
    default:
      // All other ATS types fall through to generic handler
      console.log(`[Apply] Using generic handler for ATS type: ${atsType}`);
      return applyGeneric(job, profile, portalUrl);
  }
}
