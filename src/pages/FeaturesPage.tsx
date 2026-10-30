import React, { useState } from 'react';
import { FEATURE_CATEGORIES } from '../data/featuresData';
import { FeatureCard } from '../components/ui/FeatureCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

export const FeaturesPage: React.FC = () => {
  const { user } = useAuth();
  const ctaUrl = user ? (user.role === 'ADMIN' ? '/admin' : '/dashboard') : '/register';
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredCategories =
    selectedCategory === 'all'
      ? FEATURE_CATEGORIES
      : FEATURE_CATEGORIES.filter((cat) => cat.id === selectedCategory);

  return (
    <div className="flex flex-col w-full">
      {/* Hero Header */}
      <section className="pt-14 pb-16 bg-[#FFF7F7] border-b border-[#E7DADA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="primary" size="md" className="mb-4">
            Platform Capabilities
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#252525] tracking-tight max-w-3xl mx-auto">
            Features & Services
          </h1>
          <p className="mt-4 text-base sm:text-lg text-[#666666] max-w-2xl mx-auto leading-relaxed">
            Explore the comprehensive suite of AI learning tools, matchmaking engines, and faculty connectivity features built for our university.
          </p>

          {/* Category Filter Pills */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#C62828] text-white shadow-xs'
                  : 'bg-white text-[#666666] border border-[#E7DADA] hover:bg-[#FFF7F7] hover:text-[#252525]'
              }`}
            >
              All Features (20)
            </button>
            {FEATURE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#C62828] text-white shadow-xs'
                    : 'bg-white text-[#666666] border border-[#E7DADA] hover:bg-[#FFF7F7] hover:text-[#252525]'
                }`}
              >
                {cat.title} ({cat.features.length})
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Grid Sections */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
          {filteredCategories.map((category) => (
            <div key={category.id} id={category.id} className="scroll-mt-24">
              <div className="mb-8">
                <span className="text-xs font-bold text-[#C62828] uppercase tracking-wider">
                  Category Showcase
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#252525] tracking-tight mt-1">
                  {category.title}
                </h2>
                <p className="text-sm sm:text-base text-[#666666] mt-1.5 max-w-2xl">
                  {category.subtitle}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.features.map((feature) => (
                  <FeatureCard
                    key={feature.id}
                    title={feature.title}
                    description={feature.description}
                    benefit={feature.benefit}
                    iconName={feature.iconName}
                    badge={feature.badge}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 bg-[#FFF7F7] border-t border-[#E7DADA]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl font-bold text-[#252525]">
            Ready to experience these features firsthand?
          </h3>
          <p className="mt-2 text-sm text-[#666666]">
            Sign up now with your campus ID to explore our interactive modules.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button to={ctaUrl} variant="primary" size="md">
              {user ? 'Go to Dashboard' : 'Get Started Free'}
            </Button>
            <Button to="/how-it-works" variant="outline" size="md">
              Learn How It Works
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};
