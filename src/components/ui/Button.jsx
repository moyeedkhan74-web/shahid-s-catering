import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const Button = React.forwardRef(({ 
  className, 
  variant = 'primary', 
  size = 'md', 
  isLoading, 
  children, 
  ...props 
}, ref) => {
  
  const variants = {
    primary: 'bg-[#daa520] text-black hover:bg-[#f5c542] shadow-[0_4px_14px_0_rgba(218,165,32,0.39)]',
    secondary: 'bg-[#1a1a1a] text-[#e5e5e5] border border-[#333] hover:border-[#daa520]',
    outline: 'bg-transparent border border-[#daa520] text-[#daa520] hover:bg-[#daa520] hover:text-black',
    ghost: 'bg-transparent text-[#a3a3a3] hover:text-[#e5e5e5] hover:bg-[#1a1a1a]'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg font-semibold',
  };

  return (
    <motion.button
      ref={ref}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={twMerge(
        'relative inline-flex items-center justify-center rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={isLoading}
      {...props}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-inherit">
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <span className={clsx('transition-opacity', isLoading ? 'opacity-0' : 'opacity-100')}>
        {children}
      </span>
    </motion.button>
  );
});

Button.displayName = 'Button';

export default Button;
