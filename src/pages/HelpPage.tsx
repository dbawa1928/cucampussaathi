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
      <section className="pt-14 pb-16 bg-[#F6F8FC] border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="primary" size="md" className="mb-4">
            Knowledge Base
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#17233B] tracking-tight max-w-3xl mx-auto">
            Help Center & FAQs
          </h1>
          <p className="mt-4 text-base sm:text-lg text-[#64748B] max-w-2xl mx-auto leading-relaxed">
            Find answers to common questions about skill passports, project matching, document tutoring, and faculty consultations.
          </p>

          {/* Search Input Box */}
          <div className="mt-8 max-w-2xl mx-auto relative">
            <Search className="w-5 h-5 text-[#94A3B8] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              id="faq-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by topic, e.g. 'Skill Passport', 'Booking', 'RAG'..."
              className="w-full pl-12 pr-10 py-3.5 rounded-xl bg-white border border-[#CBD5E1] text-sm text-[#17233B] placeholder:text-[#94A3B8] shadow-xs focus:outline-none focus:border-[#3157D5] focus:ring-2 focus:ring-[#3157D5]/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#17233B] p-1 rounded-full cursor-pointer"
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
                    ? 'bg-[#3157D5] text-white shadow-xs'
                    : 'bg-white text-[#64748B] border border-[#E2E8F0] hover:bg-[#F6F8FC] hover:text-[#17233B]'
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
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#E2E8F0]">
            <span className="text-sm font-semibold text-[#17233B]">
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
                className="text-xs font-semibold text-[#3157D5] hover:underline cursor-pointer"
              >
                Reset filters
              </button>
            )}
          </div>

          {filteredItems.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-[#E2E8F0] rounded-2xl bg-[#F6F8FC]">
              <div className="w-12 h-12 rounded-full bg-white text-[#94A3B8] flex items-center justify-center mx-auto mb-3 border border-[#E2E8F0]">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#17233B]">
                No matching questions found
              </h3>
              <p className="mt-1 text-sm text-[#64748B] max-w-sm mx-auto">
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
          <div className="mt-16 p-8 rounded-2xl bg-[#F6F8FC] border border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
            <div>
              <h3 className="text-lg font-bold text-[#17233B]">
                Can't find the answer you need?
              </h3>
              <p className="text-sm text-[#64748B] mt-1">
                Reach out to our campus platform coordinators for assistance.
              </p>
            </div>
            <Button
              to="/contact"
              variant="primary"
              size="md"
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
              className="shrink-0"
            >
              Contact Support
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};
