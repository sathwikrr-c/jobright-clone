'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Sparkles, Copy, Check } from 'lucide-react';
async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => ('str' in item ? item.str : '')).join(' '));
  }
  return pages.join('\n\n');
}

export default function ResumePage() {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [tailoredResume, setTailoredResume] = useState('');
  const [keyChanges, setKeyChanges] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('resumeText');
    if (saved) setResumeText(saved);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    try {
      let text: string;
      if (file.type === 'application/pdf') {
        text = await extractPdfText(file);
      } else {
        text = await file.text();
      }
      setResumeText(text);
      localStorage.setItem('resumeText', text);
    } catch (err) {
      console.error('Failed to parse file:', err);
      alert('Failed to parse file. Please paste your resume text manually.');
    }
  };

  const handleTailor = async () => {
    if (!resumeText || !jobDescription) return;
    setLoading(true);
    try {
      const res = await fetch('/api/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobDescription }),
      });
      const data = await res.json();
      setTailoredResume(data.tailoredResume || '');
      setKeyChanges(data.keyChanges || []);
    } catch {
      alert('Failed to tailor resume. Check your API key.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(tailoredResume);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveResume = () => {
    localStorage.setItem('resumeText', resumeText);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-6">Resume</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Resume upload/edit */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-500" />
              Your Resume
            </h2>

            {/* Upload area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const file = e.dataTransfer.files[0];
                if (file) {
                  const fakeEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
                  handleFileUpload(fakeEvent);
                }
              }}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-emerald-500 transition-colors mb-4"
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                {fileName ? (
                  <span className="text-emerald-600 font-medium">{fileName}</span>
                ) : (
                  <>Drag & drop your resume PDF, or <span className="text-emerald-500">click to upload</span></>
                )}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Text area */}
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Or paste your resume text
            </label>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              rows={16}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm font-mono"
              placeholder="Paste your resume content here..."
            />
            <button
              onClick={handleSaveResume}
              className="mt-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
            >
              Save Resume
            </button>
          </div>
        </div>

        {/* Right: Tailor for job */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              AI Resume Tailoring
            </h2>

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Paste the job description
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm"
              placeholder="Paste the job description you want to tailor your resume for..."
            />

            <button
              onClick={handleTailor}
              disabled={loading || !resumeText || !jobDescription}
              className="mt-3 w-full px-4 py-2.5 bg-emerald-500 text-white rounded-full font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Tailoring...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Tailor Resume
                </>
              )}
            </button>
          </div>

          {/* Tailored output */}
          {tailoredResume && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Tailored Resume</h3>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              {keyChanges.length > 0 && (
                <div className="mb-4 p-3 bg-emerald-50 rounded-lg">
                  <p className="text-sm font-medium text-emerald-700 mb-2">Key Changes Made:</p>
                  <ul className="text-sm text-emerald-600 space-y-1">
                    {keyChanges.map((change, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">+</span>
                        {change}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <pre className="text-sm font-mono whitespace-pre-wrap text-gray-700 max-h-96 overflow-y-auto">
                {tailoredResume}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
