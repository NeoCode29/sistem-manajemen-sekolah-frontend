import React from 'react';
import { Archive } from 'lucide-react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  message: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  message,
  description,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="text-gray-300 mb-4">
        {icon ?? <Archive size={48} />}
      </div>
      <p className="text-gray-600 font-semibold text-base">{message}</p>
      {description && (
        <p className="text-gray-400 text-sm mt-1 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
