import React from 'react';

export type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'purple' | 'default';

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  success: 'bg-green-100 text-green-700',
  danger:  'bg-red-100 text-red-700',
  warning: 'bg-yellow-100 text-yellow-700',
  info:    'bg-blue-100 text-blue-700',
  purple:  'bg-indigo-100 text-indigo-700',
  default: 'bg-gray-100 text-gray-600',
};

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', children, className = '' }) => {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                  ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
