'use client';

import dynamic from 'next/dynamic';

const ProfileClient = dynamic(() => import('./ClientPage'), { ssr: false });

export default function ProfilePage() {
  return <ProfileClient />;
}
