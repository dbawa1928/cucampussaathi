import React from 'react';
import { MapPin } from 'lucide-react';

export const CAMPUS_BLOCKS = [
  'A1', 'A2', 'A3',
  'B1', 'B2', 'B3', 'B4', 'B5',
  'C1', 'C2', 'C3',
  'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8',
  'DD1', 'DD2', 'DD3',
  'SPORTS COMPLEX',
] as const;

export type CampusBlock = (typeof CAMPUS_BLOCKS)[number];

interface CampusBlockSelectProps {
  value?: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export const CampusBlockSelect: React.FC<CampusBlockSelectProps> = ({
  value,
  onChange,
  required = false,
  disabled = false,
  className = '',
  placeholder = 'Select Campus Block',
}) => {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#C62828]">
        <MapPin className="w-4 h-4" />
      </div>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        className="w-full pl-9 pr-8 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E7DADA] bg-white text-[#252525] focus:outline-none focus:ring-2 focus:ring-[#C62828] focus:border-transparent transition-all cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed appearance-none"
      >
        <option value="">{placeholder}</option>
        <optgroup label="Academic Block A">
          <option value="A1">Block A1</option>
          <option value="A2">Block A2</option>
          <option value="A3">Block A3</option>
        </optgroup>
        <optgroup label="Academic Block B">
          <option value="B1">Block B1</option>
          <option value="B2">Block B2</option>
          <option value="B3">Block B3</option>
          <option value="B4">Block B4</option>
          <option value="B5">Block B5</option>
        </optgroup>
        <optgroup label="Academic Block C">
          <option value="C1">Block C1</option>
          <option value="C2">Block C2</option>
          <option value="C3">Block C3</option>
        </optgroup>
        <optgroup label="Academic Block D">
          <option value="D1">Block D1</option>
          <option value="D2">Block D2</option>
          <option value="D3">Block D3</option>
          <option value="D4">Block D4</option>
          <option value="D5">Block D5</option>
          <option value="D6">Block D6</option>
          <option value="D7">Block D7</option>
          <option value="D8">Block D8</option>
        </optgroup>
        <optgroup label="University Extension & Sports">
          <option value="DD1">Block DD1</option>
          <option value="DD2">Block DD2</option>
          <option value="DD3">Block DD3</option>
          <option value="SPORTS COMPLEX">Sports Complex</option>
        </optgroup>
      </select>
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
};
