import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const Input = React.forwardRef(({ 
  className, 
  type, 
  icon: Icon,
  error,
  label,
  ...props 
}, ref) => {
  return (
    <div className="w-full space-y-2">
      {label && (
        <label className="text-sm font-medium text-[#a3a3a3] ml-1">
          {label}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#404040] group-focus-within:text-[#daa520] transition-colors" />
        )}
        <input
          type={type}
          className={twMerge(
            "w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl py-3.5 px-4 text-white placeholder-[#404040] focus:border-[#daa520] focus:ring-1 focus:ring-[#daa520] outline-none transition-all",
            Icon && "pl-12",
            error && "border-red-500/50 focus:border-red-500 focus:ring-red-500",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-red-500 ml-1 mt-1">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
