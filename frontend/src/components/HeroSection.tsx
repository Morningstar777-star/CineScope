import React from 'react';
import { motion } from 'framer-motion';

export const HeroSection: React.FC = () => {
  return (
    <div className="relative pt-6 pb-2 text-center select-none overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="font-sans text-4xl sm:text-6xl lg:text-[76px] font-bold tracking-[-0.04em] leading-[0.96] text-white">
          Where <span className="font-serif italic font-normal text-white">cinema</span> meets{' '}
          <span className="font-serif italic font-normal bg-gradient-to-r from-rose-300 via-amber-200 to-rose-400 bg-clip-text text-transparent">
            empirical truth.
          </span>
        </h1>
      </motion.div>
    </div>
  );
};
