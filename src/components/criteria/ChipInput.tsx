'use client';

import { useState, useRef, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';

interface ChipInputProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  required?: boolean;
  placeholder?: string;
  freeText?: boolean;
}

export default function ChipInput({
  label,
  options,
  selected,
  onChange,
  required = false,
  placeholder = 'Type to search...',
  freeText = false,
}: ChipInputProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = options.filter(
    (o) =>
      o.toLowerCase().includes(query.toLowerCase()) && !selected.includes(o)
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addItem = (item: string) => {
    if (!selected.includes(item)) {
      onChange([...selected, item]);
    }
    setQuery('');
    inputRef.current?.focus();
  };

  const removeItem = (item: string) => {
    onChange(selected.filter((s) => s !== item));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      e.preventDefault();
      if (freeText) {
        addItem(query.trim());
      } else if (filtered.length > 0) {
        addItem(filtered[0]);
      }
    }
    if (e.key === 'Backspace' && !query && selected.length > 0) {
      removeItem(selected[selected.length - 1]);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm bg-emerald-100 text-emerald-800"
            >
              {item}
              <button
                type="button"
                onClick={() => removeItem(item)}
                className="hover:text-emerald-600 ml-0.5"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 pr-8"
        />
        <ChevronDown
          size={16}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
      </div>

      {/* Dropdown */}
      {isOpen && (filtered.length > 0 || (freeText && query.trim())) && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {freeText && query.trim() && !options.includes(query.trim()) && (
            <button
              type="button"
              onClick={() => addItem(query.trim())}
              className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 text-emerald-700"
            >
              Add &quot;{query.trim()}&quot;
            </button>
          )}
          {filtered.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => addItem(option)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 text-gray-700"
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
