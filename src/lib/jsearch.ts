import { Job } from '@/types';
import { mockJobs } from './mock-data';

const JSEARCH_API_KEY = process.env.JSEARCH_API_KEY || '';
const JSEARCH_HOST = 'jsearch.p.rapidapi.com';
const JSEARCH_URL = 'https://jsearch.p.rapidapi.com/search';

interface JSearchJob {
  job_id: string;
  job_title: string;
  employer_name: string;
  employer_logo: string | null;
  employer_website: string | null;
  job_employment_type: string;
  job_city: string;
  job_state: string;
  job_country: string;
  job_description: string;
  job_apply_link: string;
  job_is_remote: boolean;
  job_posted_at_datetime_utc: string;
  job_min_salary: number | null;
  job_max_salary: number | null;
  job_salary_currency: string | null;
  job_experience_in_place_of_education: boolean;
  job_required_experience?: {
    no_experience_required: boolean;
    required_experience_in_months: number | null;
    experience_mentioned: boolean;
    experience_preferred: boolean;
  };
  job_highlights?: {
    Qualifications?: string[];
    Responsibilities?: string[];
    Benefits?: string[];
  };
  job_naics?: {
    name?: string;
  };
}

interface JSearchResponse {
  status: string;
  request_id: string;
  data: JSearchJob[];
}

function mapEmploymentType(type: string): Job['jobType'] {
  const normalized = type?.toUpperCase() || '';
  if (normalized.includes('FULL')) return 'fulltime';
  if (normalized.includes('PART')) return 'parttime';
  if (normalized.includes('CONTRACT') || normalized.includes('TEMP')) return 'contract';
  if (normalized.includes('INTERN')) return 'internship';
  return 'fulltime';
}

function mapExperienceLevel(experience?: JSearchJob['job_required_experience']): {
  level: Job['experienceLevel'];
  years: string;
} {
  if (!experience || experience.no_experience_required) {
    return { level: 'entry', years: '0-1 years' };
  }
  const months = experience.required_experience_in_months ?? 0;
  const years = Math.round(months / 12);
  if (years <= 1) return { level: 'entry', years: '0-1 years' };
  if (years <= 3) return { level: 'mid', years: '2-3 years' };
  if (years <= 6) return { level: 'senior', years: '4-6 years' };
  if (years <= 10) return { level: 'lead', years: '7-10 years' };
  return { level: 'director', years: '10+ years' };
}

function formatPostedAt(isoDate: string): string {
  const posted = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - posted.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours} hours ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks === 1) return '1 week ago';
  return `${diffWeeks} weeks ago`;
}

function mapJSearchJobToJob(jsJob: JSearchJob): Job {
  const { level, years } = mapExperienceLevel(jsJob.job_required_experience);
  const location = jsJob.job_is_remote
    ? 'Remote, US'
    : [jsJob.job_city, jsJob.job_state].filter(Boolean).join(', ') || 'United States';

  return {
    id: jsJob.job_id,
    title: jsJob.job_title,
    company: jsJob.employer_name,
    companyLogo: jsJob.employer_logo || undefined,
    industry: jsJob.job_naics?.name || 'Information Technology',
    location,
    workModel: jsJob.job_is_remote ? 'remote' : 'onsite',
    jobType: mapEmploymentType(jsJob.job_employment_type),
    experienceLevel: level,
    experienceYears: years,
    salaryMin: jsJob.job_min_salary || undefined,
    salaryMax: jsJob.job_max_salary || undefined,
    description: jsJob.job_description,
    applyUrl: jsJob.job_apply_link,
    companyPortalUrl: jsJob.employer_website || undefined,
    postedAt: formatPostedAt(jsJob.job_posted_at_datetime_utc),
    matchScore: Math.floor(Math.random() * 30) + 65,
  };
}

function mapDatePosted(datePosted?: string): string | undefined {
  switch (datePosted) {
    case '24h':
      return 'today';
    case '3d':
      return '3days';
    case '1w':
      return 'week';
    case '1m':
      return 'month';
    default:
      return undefined;
  }
}

export async function searchJobs(
  query: string,
  location: string,
  page: number = 1,
  datePosted?: string
): Promise<Job[]> {
  if (!JSEARCH_API_KEY) {
    // Fall back to mock data, optionally filtered
    // Support "OR" queries: "Product Manager OR Program Manager"
    const terms = query.toLowerCase().split(/\s+or\s+/i).map((t) => t.trim());
    return mockJobs.filter((job) => {
      const searchable = `${job.title} ${job.company} ${job.description}`.toLowerCase();
      return terms.some((term) => {
        // Split on whitespace and slashes, match if all words appear in searchable text
        const words = term.split(/[\s/]+/).filter(Boolean);
        return words.every((word) => searchable.includes(word));
      });
    });
  }

  const params = new URLSearchParams({
    query: `${query} in ${location}`,
    page: String(page),
    num_pages: '3',
  });

  const mappedDate = mapDatePosted(datePosted);
  if (mappedDate) {
    params.set('date_posted', mappedDate);
  }

  try {
    const response = await fetch(`${JSEARCH_URL}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': JSEARCH_API_KEY,
        'X-RapidAPI-Host': JSEARCH_HOST,
      },
    });

    if (!response.ok) {
      console.error(`JSearch API error: ${response.status} ${response.statusText}`);
      return mockJobs;
    }

    const data: JSearchResponse = await response.json();

    if (!data.data || data.data.length === 0) {
      return mockJobs;
    }

    const apiJobs = data.data.map(mapJSearchJobToJob);
    // Combine API results with mock data for a fuller experience
    const apiJobIds = new Set(apiJobs.map((j) => j.id));
    const extraMockJobs = mockJobs.filter((j) => !apiJobIds.has(j.id));
    return [...apiJobs, ...extraMockJobs];
  } catch (error) {
    console.error('JSearch API request failed:', error);
    return mockJobs;
  }
}
