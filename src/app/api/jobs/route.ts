import { NextRequest, NextResponse } from 'next/server';
import { searchJobs } from '@/lib/jsearch';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || 'Software Engineer';
  const location = searchParams.get('location') || 'United States';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const datePosted = searchParams.get('datePosted') || undefined;

  try {
    const jobs = await searchJobs(query, location, page, datePosted);
    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Jobs API error:', error);
    return NextResponse.json({ jobs: [], error: 'Failed to fetch jobs' }, { status: 500 });
  }
}
