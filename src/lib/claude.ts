import Anthropic from '@anthropic-ai/sdk';
import { Job, TailorResponse } from '@/types';

const MODEL = 'claude-sonnet-4-6';

function getClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

export async function scoreJob(job: Job, resumeText: string): Promise<number> {
  const client = getClient();
  if (!client) {
    return job.matchScore ?? Math.floor(Math.random() * 30) + 65;
  }

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `You are a job matching expert. Score how well this candidate's resume matches the job on a scale of 0-100.

Job Title: ${job.title}
Company: ${job.company}
Description: ${job.description}

Resume:
${resumeText}

Return ONLY a single integer between 0 and 100. No explanation.`,
        },
      ],
    });

    const text =
      response.content[0].type === 'text' ? response.content[0].text.trim() : '';
    const score = parseInt(text, 10);
    if (isNaN(score) || score < 0 || score > 100) return 75;
    return score;
  } catch (error) {
    console.error('Claude scoreJob error:', error);
    return job.matchScore ?? 75;
  }
}

export async function tailorResume(
  jobDescription: string,
  resumeText: string
): Promise<TailorResponse> {
  const fallback: TailorResponse = {
    tailoredResume: resumeText,
    coverLetter:
      'Unable to generate a cover letter at this time. Please ensure your ANTHROPIC_API_KEY is configured.',
    keyChanges: ['API key not configured — original resume returned unchanged.'],
  };

  const client = getClient();
  if (!client) return fallback;

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `You are an expert resume writer. Given a job description and a resume, produce a tailored version of the resume optimized for this specific role, a matching cover letter, and a list of key changes made.

Job Description:
${jobDescription}

Original Resume:
${resumeText}

Respond in JSON with this exact structure (no markdown fences):
{
  "tailoredResume": "...",
  "coverLetter": "...",
  "keyChanges": ["change 1", "change 2", ...]
}`,
        },
      ],
    });

    const text =
      response.content[0].type === 'text' ? response.content[0].text.trim() : '';
    const parsed = JSON.parse(text) as TailorResponse;
    return {
      tailoredResume: parsed.tailoredResume || resumeText,
      coverLetter: parsed.coverLetter || '',
      keyChanges: parsed.keyChanges || [],
    };
  } catch (error) {
    console.error('Claude tailorResume error:', error);
    return fallback;
  }
}

export async function generateFormAnswer(
  question: string,
  jobDescription: string,
  resumeText: string
): Promise<string> {
  const client = getClient();
  if (!client) {
    return '';
  }

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are helping a candidate fill out a job application form. Based on the job description and resume, answer the following application question concisely and professionally.

Job Description:
${jobDescription}

Candidate Resume:
${resumeText}

Application Question:
${question}

Provide a direct, professional answer suitable for an application form field. Do not include any preamble or explanation.`,
        },
      ],
    });

    const text =
      response.content[0].type === 'text' ? response.content[0].text.trim() : '';
    return text;
  } catch (error) {
    console.error('Claude generateFormAnswer error:', error);
    return '';
  }
}

export async function analyzeFormFields(
  pageHtml: string
): Promise<Array<{ selector: string; fieldType: string; value: string }>> {
  const client = getClient();
  if (!client) {
    return [];
  }

  try {
    // Truncate HTML to avoid token limits
    const truncatedHtml = pageHtml.slice(0, 30000);

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `You are an ATS form analysis expert. Analyze the following HTML from a job application page and identify all form fields that need to be filled out.

For each field, provide:
- selector: a CSS selector to target the field (prefer id selectors, fall back to name or unique class)
- fieldType: one of "text", "textarea", "select", "radio", "checkbox", "file"
- value: a reasonable default or empty string if context-dependent

HTML:
${truncatedHtml}

Respond in JSON as an array (no markdown fences):
[{"selector": "...", "fieldType": "...", "value": "..."}, ...]`,
        },
      ],
    });

    const text =
      response.content[0].type === 'text' ? response.content[0].text.trim() : '';
    const parsed = JSON.parse(text) as Array<{
      selector: string;
      fieldType: string;
      value: string;
    }>;
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Claude analyzeFormFields error:', error);
    return [];
  }
}
