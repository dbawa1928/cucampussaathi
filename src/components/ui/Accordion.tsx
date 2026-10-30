import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface AccordionItemProps {
  id: string;
  title: string;
  children: React.ReactNode;
  isOpenDefault?: boolean;
  category?: string;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({
  id,
  title,
  children,
  isOpenDefault = false,
  category,
}) => {
  const [isOpen, setIsOpen] = useState(isOpenDefault);

  return (
    <div className="border border-[#E7DADA] rounded-2xl overflow-hidden bg-white shadow-xs transition-colors duration-150">
      <button
        type="button"
        id={`accordion-btn-${id}`}
        aria-controls={`accordion-panel-${id}`}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-4 p-5 text-left font-medium text-[#252525] hover:text-[#C62828] hover:bg-[#FFF7F7]/60 transition-colors duration-150 focus:outline-none focus-visible:bg-[#FFF7F7] cursor-pointer"
      >
        <span className="flex flex-col sm:flex-row sm:items-center gap-2">
          {category && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#FFF7F7] text-[#C62828] border border-[#C62828]/20 self-start sm:self-auto">
              {category}
            </span>
          )}
          <span className="text-base font-bold leading-snug">{title}</span>
        </span>
        <span
          className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-[#FFF7F7] border border-[#E7DADA] text-[#666666] transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#C62828] bg-white border-[#C62828]/30 shadow-xs' : ''
          }`}
        >
          <ChevronDown className="w-4 h-4" />
        </span>
      </button>

      {isOpen && (
        <div
          id={`accordion-panel-${id}`}
          role="region"
          aria-labelledby={`accordion-btn-${id}`}
          className="px-5 pb-5 pt-1 text-sm text-[#666666] leading-relaxed border-t border-[#E7DADA]"
        >
          {children}
        </div>
      )}
    </div>
  );
};
