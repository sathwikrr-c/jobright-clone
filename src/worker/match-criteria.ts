import { Job, Criteria } from '@/types';

/**
 * Filter jobs against user criteria.
 * Returns only jobs that pass ALL matching criteria.
 */
export function matchCriteria(jobs: Job[], criteria: Criteria): Job[] {
  return jobs.filter((job) => {
    // Location filter
    if (criteria.locations.length > 0 && !matchesLocation(job, criteria.locations)) {
      return false;
    }

    // Job type filter
    if (criteria.jobTypes.length > 0 && !criteria.jobTypes.includes(job.jobType)) {
      return false;
    }

    // Work model filter
    if (criteria.workModels.length > 0 && !criteria.workModels.includes(job.workModel)) {
      return false;
    }

    // Experience level filter
    if (
      criteria.experienceLevels.length > 0 &&
      !criteria.experienceLevels.includes(job.experienceLevel)
    ) {
      return false;
    }

    // Salary range filter
    if (criteria.minSalaryUsd && !meetsSalaryRequirement(job, criteria.minSalaryUsd)) {
      return false;
    }

    // Excluded titles filter
    if (criteria.excludedTitles.length > 0 && matchesExcludedTitle(job, criteria.excludedTitles)) {
      return false;
    }

    // Excluded companies filter
    if (
      criteria.excludedCompanies.length > 0 &&
      matchesExcludedCompany(job, criteria.excludedCompanies)
    ) {
      return false;
    }

    // Excluded industries filter
    if (
      criteria.excludedIndustries.length > 0 &&
      matchesExcludedIndustry(job, criteria.excludedIndustries)
    ) {
      return false;
    }

    // H1B sponsorship filter
    if (criteria.h1bSponsorship && !job.h1bSponsorship) {
      return false;
    }

    // Security clearance exclusion
    if (criteria.excludeSecurityClearance && requiresSecurityClearance(job)) {
      return false;
    }

    // US citizen only exclusion
    if (criteria.excludeUsCitizenOnly && requiresUsCitizenship(job)) {
      return false;
    }

    // Staffing agency exclusion
    if (criteria.excludeStaffingAgency && isStaffingAgency(job)) {
      return false;
    }

    // Target companies filter (inclusive - if set, only include these)
    if (
      criteria.targetCompanies.length > 0 &&
      !matchesTargetCompany(job, criteria.targetCompanies)
    ) {
      return false;
    }

    // Industries filter (inclusive)
    if (criteria.industries.length > 0 && !matchesIndustry(job, criteria.industries)) {
      return false;
    }

    return true;
  });
}

function matchesLocation(job: Job, locations: string[]): boolean {
  const jobLocation = job.location.toLowerCase();

  for (const loc of locations) {
    const criteria = loc.toLowerCase();

    // "Remote" matches remote jobs
    if (criteria.includes('remote') && job.workModel === 'remote') return true;

    // City/state matching
    if (jobLocation.includes(criteria)) return true;

    // State abbreviation matching
    const stateAbbreviations: Record<string, string> = {
      'ca': 'california', 'ny': 'new york', 'tx': 'texas',
      'wa': 'washington', 'il': 'illinois', 'ma': 'massachusetts',
      'co': 'colorado', 'ga': 'georgia', 'fl': 'florida',
      'pa': 'pennsylvania', 'oh': 'ohio', 'nc': 'north carolina',
      'va': 'virginia', 'nj': 'new jersey', 'az': 'arizona',
      'or': 'oregon', 'mn': 'minnesota', 'wi': 'wisconsin',
      'md': 'maryland', 'ct': 'connecticut', 'dc': 'district of columbia',
    };

    const abbr = criteria.replace(/,?\s*us[a]?$/i, '').trim();
    if (stateAbbreviations[abbr] && jobLocation.includes(stateAbbreviations[abbr])) {
      return true;
    }
  }

  return false;
}

function meetsSalaryRequirement(job: Job, minSalary: number): boolean {
  // If no salary info, don't filter out (benefit of the doubt)
  if (!job.salaryMax && !job.salaryMin) return true;

  // If max salary is specified and above minimum, it passes
  if (job.salaryMax && job.salaryMax >= minSalary) return true;

  // If only min salary is specified
  if (job.salaryMin && job.salaryMin >= minSalary) return true;

  return false;
}

function matchesExcludedTitle(job: Job, excludedTitles: string[]): boolean {
  const titleLower = job.title.toLowerCase();
  return excludedTitles.some((excluded) => titleLower.includes(excluded.toLowerCase()));
}

function matchesExcludedCompany(job: Job, excludedCompanies: string[]): boolean {
  const companyLower = job.company.toLowerCase();
  return excludedCompanies.some((excluded) => companyLower.includes(excluded.toLowerCase()));
}

function matchesExcludedIndustry(job: Job, excludedIndustries: string[]): boolean {
  const industryLower = job.industry.toLowerCase();
  return excludedIndustries.some((excluded) => industryLower.includes(excluded.toLowerCase()));
}

function matchesTargetCompany(job: Job, targetCompanies: string[]): boolean {
  const companyLower = job.company.toLowerCase();
  return targetCompanies.some((target) => companyLower.includes(target.toLowerCase()));
}

function matchesIndustry(job: Job, industries: string[]): boolean {
  const industryLower = job.industry.toLowerCase();
  return industries.some((ind) => industryLower.includes(ind.toLowerCase()));
}

function requiresSecurityClearance(job: Job): boolean {
  const desc = job.description.toLowerCase();
  return (
    desc.includes('security clearance') ||
    desc.includes('secret clearance') ||
    desc.includes('top secret') ||
    desc.includes('ts/sci') ||
    desc.includes('polygraph')
  );
}

function requiresUsCitizenship(job: Job): boolean {
  const desc = job.description.toLowerCase();
  return (
    desc.includes('u.s. citizen') ||
    desc.includes('us citizen') ||
    desc.includes('united states citizen') ||
    desc.includes('must be a citizen') ||
    desc.includes('citizenship required')
  );
}

const STAFFING_AGENCIES = [
  'robert half', 'randstad', 'adecco', 'manpower', 'kelly services',
  'hays', 'staffing', 'tek systems', 'teksystems', 'insight global',
  'kforce', 'apex systems', 'modis', 'collabera', 'cybercoders',
  'dice', 'hired', 'toptal',
];

function isStaffingAgency(job: Job): boolean {
  const companyLower = job.company.toLowerCase();
  return STAFFING_AGENCIES.some((agency) => companyLower.includes(agency));
}
