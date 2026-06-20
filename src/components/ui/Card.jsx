import React from 'react';
import { motion } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

const Card = ({ children, className, hover = true, ...props }) => {
  return (
    <motion.div
      whileHover={hover ? { y: -5 } : {}}
      className={twMerge(
        "bg-[#121212] border border-[#2a2a2a] rounded-[2rem] overflow-hidden transition-all duration-300",
        hover && "hover:border-[#daa520]/30 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default Card;
