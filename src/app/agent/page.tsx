'use client';

import dynamic from 'next/dynamic';

const AgentClient = dynamic(() => import('./ClientPage'), { ssr: false });

export default function AgentPage() {
  return <AgentClient />;
}
