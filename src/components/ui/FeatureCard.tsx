import React from 'react';
import * as LucideIcons from 'lucide-react';
import { Badge } from './Badge';

export interface FeatureCardProps {
  title: string;
  description: string;
  benefit?: string;
  iconName?: string;
  badge?: string;
  className?: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  benefit,
  iconName = 'Sparkles',
  badge,
  className = '',
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.Sparkles;

  return (
    <div
      className={`group relative flex flex-col justify-between p-6 bg-white rounded-2xl border border-[#E7DADA] shadow-xs hover:shadow-md hover:border-[#C62828]/40 transition-all duration-200 ${className}`}
    >
      <div>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-[#FFF7F7] border border-[#E7DADA] text-[#C62828] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
            <IconComponent className="w-6 h-6" />
          </div>
          {badge && (
            <Badge variant="primary" size="sm">
              {badge}
            </Badge>
          )}
        </div>

        <h3 className="text-lg font-bold text-[#252525] group-hover:text-[#C62828] transition-colors duration-150 mb-2">
          {title}
        </h3>

        <p className="text-sm text-[#666666] leading-relaxed mb-4">
          {description}
        </p>
      </div>

      {benefit && (
        <div className="pt-3 border-t border-[#E7DADA] mt-auto">
          <div className="flex items-start gap-2">
            <span className="text-[#C62828] mt-0.5 shrink-0">
              <LucideIcons.CheckCircle2 className="w-4 h-4 text-[#C62828]" />
            </span>
            <p className="text-xs font-semibold text-[#252525] leading-snug">
              {benefit}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
