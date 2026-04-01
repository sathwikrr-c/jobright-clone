export interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  industry: string;
  location: string;
  workModel: 'onsite' | 'hybrid' | 'remote';
  jobType: 'fulltime' | 'contract' | 'parttime' | 'internship';
  experienceLevel: 'intern' | 'entry' | 'mid' | 'senior' | 'lead' | 'director';
  experienceYears: string;
  salaryMin?: number;
  salaryMax?: number;
  description: string;
  applyUrl: string;
  companyPortalUrl?: string;
  postedAt: string;
  applicantCount?: number;
  h1bSponsorship?: boolean;
  socialProof?: string;
  matchScore?: number;
  atsType?: string;
}

export interface Criteria {
  id?: string;
  // Basic
  jobFunctions: string[];
  excludedTitles: string[];
  jobTypes: string[];
  workModels: string[];
  locations: string[];
  experienceLevels: string[];
  minExperienceYears?: number;
  datePosted?: string;
  // Compensation & Sponsorship
  minSalaryUsd?: number;
  h1bSponsorship: boolean;
  excludeSecurityClearance: boolean;
  excludeUsCitizenOnly: boolean;
  // Areas of Interest
  industries: string[];
  excludedIndustries: string[];
  skills: string[];
  excludedSkills: string[];
  roleTypes: string[];
  // Company Insights
  targetCompanies: string[];
  companyStages: string[];
  excludeStaffingAgency: boolean;
  excludedCompanies: string[];
}

export interface Profile {
  id?: string;
  fullName: string;
  email: string;
  phone: string;
  linkedinUrl: string;
  location: string;
  resumeText: string;
  resumePdfUrl?: string;
}

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  companyPortalUrl: string;
  atsType: string;
  status: 'applied' | 'failed' | 'needs_review' | 'pending' | 'applying';
  matchScore: number;
  appliedAt: string;
  errorMsg?: string;
  screenshotUrl?: string;
}

export interface TailorRequest {
  jobDescription: string;
  resumeText: string;
}

export interface TailorResponse {
  tailoredResume: string;
  coverLetter: string;
  keyChanges: string[];
}

export type TabType = 'recommended' | 'liked' | 'applied';

export const JOB_FUNCTIONS = [
  'Product Manager',
  'Technical Product Manager',
  'AI Product Manager',
  'Product Manager, B2B/SaaS',
  'Product Manager, Consumer Software',
  'Project/Program Manager',
  'Technical Project Manager',
  'Solutions Architect/Forward Deployed Engineer',
  'Business Strategy Consultant',
  'Chief of Staff',
  'Engineering Manager',
  'Software Architect',
  'Software Engineer',
  'Senior Software Engineer',
  'Full Stack Developer',
  'Frontend Developer',
  'Backend Developer',
  'Data Scientist',
  'Data Engineer',
  'Machine Learning Engineer',
  'DevOps Engineer',
  'Site Reliability Engineer',
  'Cloud Engineer',
  'Security Engineer',
  'QA Engineer',
  'UX Designer',
  'Technical Writer',
] as const;

export const EXPERIENCE_LEVELS = [
  { value: 'intern', label: 'Intern/New Grad' },
  { value: 'entry', label: 'Entry Level' },
  { value: 'mid', label: 'Mid Level' },
  { value: 'senior', label: 'Senior Level' },
  { value: 'lead', label: 'Lead/Staff' },
  { value: 'director', label: 'Director/Executive' },
] as const;

export const JOB_TYPES = [
  { value: 'fulltime', label: 'Full-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'parttime', label: 'Part-time' },
  { value: 'internship', label: 'Internship' },
] as const;

export const WORK_MODELS = [
  { value: 'onsite', label: 'Onsite' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'remote', label: 'Remote anywhere in the US' },
] as const;

export const INDUSTRIES = [
  'Information Technology',
  'Artificial Intelligence (AI)',
  'Finance',
  'Consulting',
  'Software',
  'Healthcare',
  'E-Commerce',
  'Education',
  'Media & Entertainment',
  'Manufacturing',
  'Telecommunications',
  'Real Estate',
  'Energy',
  'Retail',
  'Transportation',
] as const;

export const SKILLS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'C++', 'C#',
  'React', 'Next.js', 'Vue.js', 'Angular', 'Node.js', 'Express',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch',
  'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'Terraform',
  'CI/CD', 'Git', 'Linux', 'GraphQL', 'REST API',
  'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision',
  'Tableau', 'Power BI', 'SQL', 'Spark', 'Kafka',
  'Agile', 'Scrum', 'Product Management', 'Data Analysis',
] as const;

export const COMPANY_STAGES = [
  { value: 'early', label: 'Early Stage' },
  { value: 'growth', label: 'Growth Stage' },
  { value: 'late', label: 'Late Stage' },
  { value: 'public', label: 'Public Company' },
] as const;

export const DATE_POSTED_OPTIONS = [
  { value: '24h', label: 'Past 24 hours' },
  { value: '3d', label: 'Past 3 days' },
  { value: '1w', label: 'Past week' },
  { value: '1m', label: 'Past month' },
] as const;
