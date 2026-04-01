'use client';

import dynamic from 'next/dynamic';

const ResumeClient = dynamic(() => import('./ClientPage'), { ssr: false });

export default function ResumePage() {
  return <ResumeClient />;
}
