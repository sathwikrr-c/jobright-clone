'use client';

import { useState } from 'react';
import { Settings, Key, Globe, Shield, Bell } from 'lucide-react';

export default function SettingsPage() {
  const [autoApplyEnabled, setAutoApplyEnabled] = useState(true);
  const [maxDailyApps, setMaxDailyApps] = useState(20);
  const [minMatchScore, setMinMatchScore] = useState(75);
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Settings className="w-6 h-6" />
        Settings
      </h1>

      <div className="max-w-2xl space-y-6">
        {/* Auto-Apply Settings */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-500" />
            Auto-Apply Configuration
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Enable Auto-Apply</p>
                <p className="text-xs text-gray-500">Automatically apply to matching jobs via GitHub Actions</p>
              </div>
              <button
                onClick={() => setAutoApplyEnabled(!autoApplyEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoApplyEnabled ? 'bg-emerald-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoApplyEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Daily Applications
              </label>
              <input
                type="number"
                value={maxDailyApps}
                onChange={(e) => setMaxDailyApps(parseInt(e.target.value) || 0)}
                min={1}
                max={50}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Recommended: 15-25 per day</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Match Score to Auto-Apply
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  value={minMatchScore}
                  onChange={(e) => setMinMatchScore(parseInt(e.target.value))}
                  min={50}
                  max={100}
                  className="flex-1 accent-emerald-500"
                />
                <span className="text-sm font-medium w-12">{minMatchScore}%</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Only auto-apply to jobs scoring above this threshold</p>
            </div>
          </div>
        </div>

        {/* API Keys */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Key className="w-5 h-5 text-emerald-500" />
            API Keys
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            API keys are configured via environment variables. Set them in your <code className="bg-gray-100 px-1 rounded">.env.local</code> file or GitHub Secrets.
          </p>
          <div className="space-y-3">
            {[
              { name: 'ANTHROPIC_API_KEY', label: 'Claude API', status: process.env.NEXT_PUBLIC_HAS_CLAUDE ? 'configured' : 'not set' },
              { name: 'JSEARCH_API_KEY', label: 'JSearch (RapidAPI)', status: 'check .env.local' },
              { name: 'PROXY_URL', label: 'Residential Proxy', status: 'optional' },
              { name: 'CAPTCHA_API_KEY', label: 'CAPTCHA Solver', status: 'optional' },
            ].map((key) => (
              <div key={key.name} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-700">{key.label}</p>
                  <p className="text-xs text-gray-400 font-mono">{key.name}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500">
                  {key.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Stealth & Safety */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-500" />
            Stealth & Safety
          </h2>
          <div className="space-y-3 text-sm text-gray-600">
            <p>The auto-apply worker includes these anti-detection measures:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-500">
              <li>Browser fingerprint randomization (viewport, UA, timezone)</li>
              <li>Human-like typing with random delays and occasional corrections</li>
              <li>Bezier curve mouse movements</li>
              <li>Rate limiting with random jitter between applications</li>
              <li>Residential proxy rotation (when configured)</li>
              <li>CAPTCHA auto-solving (when configured)</li>
              <li>Cookie persistence for session management</li>
            </ul>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-500" />
            Notifications
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Application Notifications</p>
              <p className="text-xs text-gray-500">Get notified when auto-apply succeeds or fails</p>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notifications ? 'bg-emerald-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
