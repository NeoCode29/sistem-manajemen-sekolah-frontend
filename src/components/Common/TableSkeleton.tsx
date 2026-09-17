import React from 'react';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

const WIDTH_PRESETS = [
  ['w-16', 'w-48', 'w-32', 'w-24', 'w-16'],
  ['w-20', 'w-40', 'w-28', 'w-20', 'w-20'],
  ['w-14', 'w-56', 'w-36', 'w-24', 'w-16'],
  ['w-20', 'w-44', 'w-32', 'w-20', 'w-20'],
  ['w-16', 'w-52', 'w-28', 'w-24', 'w-20'],
];

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 5, columns = 5 }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => {
        const presets = WIDTH_PRESETS[r % WIDTH_PRESETS.length];
        return (
          <tr key={r} className="border-b border-gray-50/80 transition-colors">
            {Array.from({ length: columns }).map((_, c) => {
              const widthClass = presets[c % presets.length] || 'w-28';
              return (
                <td key={c} className="px-6 py-4">
                  <div className={`h-5 rounded-lg skeleton-shimmer ${widthClass}`} />
                </td>
              );
            })}
          </tr>
        );
      })}
    </>
  );
};
