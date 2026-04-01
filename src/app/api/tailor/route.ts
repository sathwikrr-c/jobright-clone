import { NextRequest, NextResponse } from 'next/server';
import { tailorResume } from '@/lib/claude';

export async function POST(request: NextRequest) {
  try {
    const { jobDescription, resumeText } = await request.json();

    if (!jobDescription || !resumeText) {
      return NextResponse.json(
        { error: 'Both jobDescription and resumeText are required' },
        { status: 400 }
      );
    }

    const result = await tailorResume(jobDescription, resumeText);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Tailor API error:', error);
    return NextResponse.json(
      { error: 'Failed to tailor resume' },
      { status: 500 }
    );
  }
}
