import React, { useState, useMemo } from 'react';
import { Search, HelpCircle, X, ArrowRight } from 'lucide-react';

import { FAQ_ITEMS, FAQ_CATEGORIES } from '../data/faqData';
import { AccordionItem } from '../components/ui/Accordion';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const HelpPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredItems = useMemo(() => {
    return FAQ_ITEMS.filter((item) => {
      const matchesCategory =
        selectedCategory === 'All' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="flex flex-col w-full">
      {/* Hero with Search Bar */}
      <section className="pt-14 pb-16 bg-[#FFF7F7] border-b border-[#E7DADA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="primary" size="md" className="mb-4">
            Knowledge Base
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#252525] tracking-tight max-w-3xl mx-auto">
            Help Center & FAQs
          </h1>
          <p className="mt-4 text-base sm:text-lg text-[#666666] max-w-2xl mx-auto leading-relaxed">
            Find answers to common questions about skill passports, project matching, document tutoring, and faculty consultations.
          </p>

          {/* Search Input Box */}
          <div className="mt-8 max-w-2xl mx-auto relative">
            <Search className="w-5 h-5 text-[#8E1717]/50 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              id="faq-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by topic, e.g. 'Skill Passport', 'Booking', 'RAG'..."
              className="w-full pl-12 pr-10 py-3.5 rounded-xl bg-white border border-[#E7DADA] text-sm text-[#252525] placeholder:text-[#999999] shadow-xs focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8E1717]/60 hover:text-[#252525] p-1 rounded-full cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 max-w-4xl mx-auto">
            {FAQ_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#C62828] text-white shadow-xs'
                    : 'bg-white text-[#666666] border border-[#E7DADA] hover:bg-[#FFF7F7] hover:text-[#252525]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Accordion Questions List */}
      <section className="py-16 bg-white min-h-[450px]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#E7DADA]">
            <span className="text-sm font-semibold text-[#252525]">
              Showing {filteredItems.length} {filteredItems.length === 1 ? 'question' : 'questions'}
              {selectedCategory !== 'All' && ` in "${selectedCategory}"`}
            </span>
            {(searchQuery || selectedCategory !== 'All') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                className="text-xs font-semibold text-[#C62828] hover:underline cursor-pointer"
              >
                Reset filters
              </button>
            )}
          </div>

          {filteredItems.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-[#E7DADA] rounded-2xl bg-[#FFF7F7]">
              <div className="w-12 h-12 rounded-full bg-white text-[#C62828] flex items-center justify-center mx-auto mb-3 border border-[#E7DADA]">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#252525]">
                No matching questions found
              </h3>
              <p className="mt-1 text-sm text-[#666666] max-w-sm mx-auto">
                We couldn't find any questions matching "{searchQuery}". Try different search terms or clear your search query.
              </p>
              <div className="mt-5">
                <Button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                  }}
                  variant="outline"
                  size="sm"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredItems.map((faq, index) => (
                <AccordionItem
                  key={faq.id}
                  id={faq.id}
                  title={faq.question}
                  category={selectedCategory === 'All' ? faq.category : undefined}
                  isOpenDefault={index === 0 && !searchQuery}
                >
                  {faq.answer}
                </AccordionItem>
              ))}
            </div>
          )}

          {/* Need More Help Banner */}
          <div className="mt-16 p-8 rounded-2xl bg-[#FFF7F7] border border-[#E7DADA] flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
            <div>
              <h3 className="text-lg font-bold text-[#252525]">
                Can't find the answer you need?
              </h3>
              <p className="text-sm text-[#666666] mt-1">
                Reach out to our campus platform coordinators for assistance.
              </p>
            </div>
            <Button
              to="/contact"
              variant="primary"
              size="md"
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              Contact Support
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};
