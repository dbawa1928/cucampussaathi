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
      className={`group relative flex flex-col justify-between p-6 bg-white rounded-xl border border-[#E2E8F0] shadow-xs hover:shadow-md hover:border-[#3157D5]/40 transition-all duration-200 ${className}`}
    >
      <div>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-[#EAF1FF] text-[#3157D5] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
            <IconComponent className="w-6 h-6" />
          </div>
          {badge && (
            <Badge variant="primary" size="sm">
              {badge}
            </Badge>
          )}
        </div>

        <h3 className="text-lg font-semibold text-[#17233B] group-hover:text-[#3157D5] transition-colors duration-150 mb-2">
          {title}
        </h3>

        <p className="text-sm text-[#64748B] leading-relaxed mb-4">
          {description}
        </p>
      </div>

      {benefit && (
        <div className="pt-3 border-t border-[#E2E8F0]/70 mt-auto">
          <div className="flex items-start gap-2">
            <span className="text-[#16845B] mt-0.5 shrink-0">
              <LucideIcons.CheckCircle2 className="w-4 h-4" />
            </span>
            <p className="text-xs font-medium text-[#16845B] leading-snug">
              {benefit}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
