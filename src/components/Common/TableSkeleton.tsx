import React from 'react';

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ rows = 5, columns = 5 }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="animate-pulse">
          {Array.from({ length: columns }).map((_, c) => (
            <td key={c} className="px-6 py-4">
              <div className="h-6 bg-slate-100 rounded-md w-full"></div>
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};
