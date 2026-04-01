'use client';

import dynamic from 'next/dynamic';

const JobsClient = dynamic(() => import('./JobsClient'), { ssr: false });

export default function JobsPage() {
  return <JobsClient />;
}
