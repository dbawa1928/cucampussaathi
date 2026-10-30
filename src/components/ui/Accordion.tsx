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
    <div className="border border-[#E2E8F0] rounded-xl overflow-hidden bg-white shadow-xs transition-colors duration-150">
      <button
        type="button"
        id={`accordion-btn-${id}`}
        aria-controls={`accordion-panel-${id}`}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-4 p-5 text-left font-medium text-[#17233B] hover:text-[#3157D5] hover:bg-[#F6F8FC]/60 transition-colors duration-150 focus:outline-none focus-visible:bg-[#EAF1FF]/40 cursor-pointer"
      >
        <span className="flex flex-col sm:flex-row sm:items-center gap-2">
          {category && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#EAF1FF] text-[#3157D5] border border-[#3157D5]/20 self-start sm:self-auto">
              {category}
            </span>
          )}
          <span className="text-base font-semibold leading-snug">{title}</span>
        </span>
        <span
          className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-[#F6F8FC] border border-[#E2E8F0] text-[#64748B] transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#3157D5] bg-[#EAF1FF] border-[#3157D5]/30' : ''
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
          className="px-5 pb-5 pt-1 text-sm text-[#64748B] leading-relaxed border-t border-[#E2E8F0]/50"
        >
          {children}
        </div>
      )}
    </div>
  );
};
