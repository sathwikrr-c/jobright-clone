'use client';

import dynamic from 'next/dynamic';

const SettingsClient = dynamic(() => import('./ClientPage'), { ssr: false });

export default function SettingsPage() {
  return <SettingsClient />;
}
