'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Briefcase,
  FileText,
  User,
  Bot,
  Settings,
  MessageSquare,
  MessageCircle,
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const navItems = [
  { href: '/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/resume', label: 'Resume', icon: FileText },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/agent', label: 'Agent', icon: Bot },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const bottomItems = [
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/feedback', label: 'Feedback', icon: MessageCircle },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-56 flex-col bg-gray-900 text-white">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-sm font-bold text-white">
          JB
        </div>
        <span className="text-lg font-semibold tracking-tight">JobBot</span>
      </div>

      {/* Main nav */}
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={twMerge(
                clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                )
              )}
            >
              <item.icon
                size={20}
                className={clsx(isActive ? 'text-emerald-400' : 'text-gray-500')}
              />
              {item.label}
              {isActive && (
                <span className="absolute left-0 h-6 w-0.5 rounded-r bg-emerald-500" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-gray-800 px-3 py-4 space-y-1">
        {bottomItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={twMerge(
                clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'text-emerald-400'
                    : 'text-gray-500 hover:bg-gray-800 hover:text-gray-300'
                )
              )}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
