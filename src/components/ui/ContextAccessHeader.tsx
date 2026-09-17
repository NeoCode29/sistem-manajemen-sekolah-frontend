import React from 'react';
import { Badge, type BadgeVariant } from './Badge';

export interface ContextAccessBadge {
  label: string;
  variant?: BadgeVariant;
  isPulsing?: boolean;
  icon?: React.ReactNode;
}

export interface ContextAccessHeaderProps {
  icon?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badges?: ContextAccessBadge[];
  actions?: React.ReactNode;
  children?: React.ReactNode;
  sticky?: boolean;
  className?: string;
}

export const ContextAccessHeader: React.FC<ContextAccessHeaderProps> = ({
  icon,
  title,
  subtitle,
  badges = [],
  actions,
  children,
  sticky = true,
  className = '',
}) => {
  return (
    <div
      className={`bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200/80 shadow-sm p-4 md:p-5 transition-all ${
        sticky ? 'sticky top-4 z-10' : ''
      } ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          {icon && (
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100/60 shrink-0 mt-0.5 sm:mt-0">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base md:text-lg font-bold text-gray-900 truncate">
                {title}
              </h2>
              {badges.map((b, idx) => (
                <span key={idx} className="inline-flex items-center">
                  <Badge
                    variant={b.variant || 'default'}
                    className={`flex items-center gap-1 text-[11px] font-medium ${
                      b.isPulsing ? 'animate-pulse ring-1 ring-amber-300' : ''
                    }`}
                  >
                    {b.icon}
                    {b.label}
                  </Badge>
                </span>
              ))}
            </div>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center flex-wrap">
            {actions}
          </div>
        )}
      </div>

      {children && (
        <div className="pt-3 mt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {children}
        </div>
      )}
    </div>
  );
};
