import { NextRequest, NextResponse } from 'next/server';

// In-memory store for demo; in production use Supabase
let applications: Array<{
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  companyPortalUrl: string;
  atsType: string;
  status: string;
  matchScore: number;
  appliedAt: string;
  errorMsg?: string;
}> = [];

export async function GET() {
  return NextResponse.json({ applications });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const application = {
      id: crypto.randomUUID(),
      ...body,
      appliedAt: new Date().toISOString(),
    };
    applications.push(application);
    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    console.error('Applications API error:', error);
    return NextResponse.json({ error: 'Failed to log application' }, { status: 500 });
  }
}
