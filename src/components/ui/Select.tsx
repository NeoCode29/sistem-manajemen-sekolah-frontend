import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: SelectOption[];
  icon?: React.ReactNode;
  wrapperClassName?: string;
}

export const Select: React.FC<SelectProps> = ({
  options,
  children,
  className = '',
  wrapperClassName = '',
  icon,
  disabled,
  ...props
}) => {
  return (
    <div className={`relative inline-block ${wrapperClassName}`}>
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
          {icon}
        </div>
      )}
      <select
        disabled={disabled}
        className={`
          appearance-none w-full bg-gray-50 border border-gray-200 text-gray-700
          text-xs sm:text-sm font-medium rounded-xl py-2
          ${icon ? 'pl-9' : 'pl-3.5'} pr-10
          hover:bg-gray-100/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
          transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      >
        {options
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
        <ChevronDown className="w-4 h-4" />
      </div>
    </div>
  );
};
