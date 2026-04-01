'use client';

import { useState, useEffect } from 'react';
import CriteriaPanel from '@/components/criteria/CriteriaPanel';
import { Criteria, Profile } from '@/types';

const defaultCriteria: Criteria = {
  jobFunctions: [],
  excludedTitles: [],
  jobTypes: ['fulltime'],
  workModels: [],
  locations: ['United States'],
  experienceLevels: [],
  datePosted: undefined,
  minSalaryUsd: undefined,
  h1bSponsorship: false,
  excludeSecurityClearance: false,
  excludeUsCitizenOnly: false,
  industries: [],
  excludedIndustries: [],
  skills: [],
  excludedSkills: [],
  roleTypes: [],
  targetCompanies: [],
  companyStages: [],
  excludeStaffingAgency: false,
  excludedCompanies: [],
};

const defaultProfile: Profile = {
  fullName: '',
  email: '',
  phone: '',
  linkedinUrl: '',
  location: 'United States',
  resumeText: '',
};

export default function ProfilePageClient() {
  const [criteria, setCriteria] = useState<Criteria>(defaultCriteria);
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [saved, setSaved] = useState(false);
  const [activeView, setActiveView] = useState<'criteria' | 'profile'>('criteria');

  useEffect(() => {
    const savedCriteria = localStorage.getItem('criteria');
    if (savedCriteria) setCriteria(JSON.parse(savedCriteria));
    const savedProfile = localStorage.getItem('profile');
    if (savedProfile) setProfile(JSON.parse(savedProfile));
  }, []);

  const handleSaveCriteria = (updated: Criteria) => {
    setCriteria(updated);
    localStorage.setItem('criteria', JSON.stringify(updated));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveProfile = () => {
    localStorage.setItem('profile', JSON.stringify(profile));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tab switcher */}
      <div className="bg-white border-b border-gray-200 px-6 pt-4">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveView('criteria')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeView === 'criteria'
                ? 'border-emerald-500 text-gray-900'
                : 'border-transparent text-gray-500'
            }`}
          >
            Job Criteria
          </button>
          <button
            onClick={() => setActiveView('profile')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeView === 'profile'
                ? 'border-emerald-500 text-gray-900'
                : 'border-transparent text-gray-500'
            }`}
          >
            Personal Info
          </button>
        </div>
      </div>

      {saved && (
        <div className="fixed top-4 right-4 bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
          Saved successfully!
        </div>
      )}

      {activeView === 'criteria' ? (
        <CriteriaPanel initialCriteria={criteria} onSave={handleSaveCriteria} />
      ) : (
        <div className="max-w-2xl mx-auto p-8">
          <h2 className="text-xl font-bold mb-6">Personal Information</h2>
          <p className="text-sm text-gray-500 mb-6">
            This information is used to auto-fill application forms on company portals.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
              <input
                type="url"
                value={profile.linkedinUrl}
                onChange={(e) => setProfile({ ...profile, linkedinUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="https://linkedin.com/in/johndoe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={profile.location}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="San Francisco, CA"
              />
            </div>
            <button
              onClick={handleSaveProfile}
              className="mt-4 px-6 py-2 bg-emerald-500 text-white rounded-full font-medium hover:bg-emerald-600 transition-colors"
            >
              Save Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
