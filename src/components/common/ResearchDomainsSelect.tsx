import React, { useState } from 'react';
import { X, Check, Search } from 'lucide-react';

export const RESEARCH_DOMAINS = [
  'Artificial Intelligence',
  'Machine Learning',
  'Deep Learning',
  'Generative AI',
  'Natural Language Processing',
  'Computer Vision',
  'Data Science',
  'Big Data Analytics',
  'Cloud Computing',
  'Cybersecurity',
  'Network Security',
  'Blockchain',
  'Internet of Things',
  'Robotics',
  'Human Computer Interaction',
  'Software Engineering',
  'Distributed Systems',
  'Database Management',
  'Operating Systems',
  'Computer Networks',
  'Web Development',
  'Mobile Application Development',
  'Quantum Computing',
  'Information Retrieval',
  'Bioinformatics',
  'Computational Mathematics',
  'Statistics',
  'Wireless Communication',
  'VLSI Design',
  'Embedded Systems',
  'Renewable Energy',
  'Power Systems',
  'Mechanical Design',
  'Manufacturing Technology',
  'Civil Engineering',
  'Structural Engineering',
  'Business Analytics',
  'Finance',
  'Marketing',
  'Entrepreneurship',
  'Management',
  'Other',
] as const;

export type ResearchDomain = (typeof RESEARCH_DOMAINS)[number];

interface ResearchDomainsSelectProps {
  selected: string[];
  onChange: (domains: string[]) => void;
  max?: number;
  label?: string;
  helperText?: string;
}

export const ResearchDomainsSelect: React.FC<ResearchDomainsSelectProps> = ({
  selected = [],
  onChange,
  max = 5,
  label = 'Research Domains & Specializations',
  helperText,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredDomains = RESEARCH_DOMAINS.filter((domain) =>
    domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleDomain = (domain: string) => {
    if (selected.includes(domain)) {
      onChange(selected.filter((d) => d !== domain));
    } else {
      if (max && selected.length >= max) return;
      onChange([...selected, domain]);
    }
  };

  const removeDomain = (domain: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((d) => d !== domain));
  };

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-sm font-semibold text-[#252525]">
            {label}
          </label>
          <span className="text-xs text-[#666666]">
            {selected.length} / {max} selected
          </span>
        </div>
      )}

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-2 bg-[#FFF7F7] border border-[#E7DADA] rounded-lg">
          {selected.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md bg-white text-[#C62828] border border-[#E7DADA] shadow-xs"
            >
              <span>{item}</span>
              <button
                type="button"
                onClick={(e) => removeDomain(item, e)}
                className="text-[#8E1717] hover:text-[#C62828] cursor-pointer"
                aria-label={`Remove ${item}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown Input */}
      <div className="relative">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="w-full min-h-[42px] px-3 py-2 bg-white border border-[#E7DADA] rounded-lg cursor-pointer flex items-center justify-between text-sm hover:border-[#C62828] focus-within:ring-2 focus-within:ring-[#C62828]"
        >
          <span className="text-xs text-[#666666]">
            {selected.length === 0
              ? 'Click to select research domains...'
              : `${selected.length} selected. Click to add/edit...`}
          </span>
          <span className="text-xs text-[#C62828] font-bold">
            {isOpen ? 'Close' : 'Browse'}
          </span>
        </div>

        {isOpen && (
          <div className="absolute z-30 mt-1 w-full bg-white border border-[#E7DADA] rounded-xl shadow-lg p-2 max-h-60 overflow-y-auto">
            <div className="sticky top-0 bg-white pb-2 border-b border-[#E7DADA] flex items-center gap-2 px-1">
              <Search className="w-4 h-4 text-[#666666]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search domains..."
                className="w-full text-xs outline-none bg-transparent"
                autoFocus
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="text-xs text-[#666666] hover:text-[#252525]"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="mt-2 space-y-1">
              {filteredDomains.map((domain) => {
                const isSelected = selected.includes(domain);
                const disabled = !isSelected && selected.length >= max;
                return (
                  <button
                    key={domain}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleDomain(domain)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-[#FFF7F7] text-[#C62828] font-bold'
                        : disabled
                        ? 'opacity-40 cursor-not-allowed text-[#999999]'
                        : 'text-[#252525] hover:bg-[#FFF7F7]'
                    }`}
                  >
                    <span>{domain}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#C62828]" />}
                  </button>
                );
              })}
              {filteredDomains.length === 0 && (
                <p className="p-3 text-center text-xs text-[#666666]">
                  No domains matched your search.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {helperText && <p className="text-xs text-[#666666]">{helperText}</p>}
    </div>
  );
};
