import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `You are Orion, an AI job search assistant. You help job seekers with:
- Understanding job listings and requirements
- Evaluating if they're qualified for roles
- Interview preparation and tips
- Resume optimization advice
- Salary negotiation guidance
- Career strategy

Be concise, actionable, and encouraging. When discussing specific roles, focus on what makes the candidate a good fit and any gaps they should address. Keep responses under 200 words unless the user asks for detail.`;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        response:
          "I'm currently running in demo mode without an API key. In production, I'd use Claude to provide personalized job search advice. For now, here are some general tips: tailor your resume for each application, research the company before interviews, and practice your STAR method answers!",
      });
    }

    const client = new Anthropic({ apiKey });
    const result = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    const textBlock = result.content.find((b) => b.type === 'text');
    return NextResponse.json({ response: textBlock?.text || '' });
  } catch (error) {
    console.error('Orion API error:', error);
    return NextResponse.json(
      { response: 'Sorry, I encountered an error. Please try again.' },
      { status: 500 }
    );
  }
}
