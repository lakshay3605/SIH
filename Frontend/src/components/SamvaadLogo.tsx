import React from 'react';

interface SamvaadLogoProps {
  className?: string;
}

export const SamvaadLogo: React.FC<SamvaadLogoProps> = ({ className = "w-12 h-10" }) => {
  return (
    <svg viewBox="0 0 100 80" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Center Leaf */}
      <path d="M50 70 C50 40 45 15 50 8 C55 15 67 35 63 55 C59 68 50 70 50 70 Z" fill="#0C5A3E" />
      <path d="M50 68 L50 14 M50 32 L56 26 M50 44 L58 37 M50 56 L55 50" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
      {/* Left Leaf */}
      <path d="M48 70 C30 55 16 42 12 28 C26 26 40 40 46 64 C48 68 48 70 48 70 Z" fill="#0C5A3E" />
      <path d="M46 66 C35 52 26 42 16 33 M24 40 L30 46 M32 50 L38 56" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
      {/* Right Leaf */}
      <path d="M52 70 C70 55 84 42 88 28 C74 26 60 40 54 64 C52 68 52 70 52 70 Z" fill="#0C5A3E" />
      <path d="M54 66 C65 52 74 42 84 33 M76 40 L70 46 M68 50 L62 56" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
      {/* Stem */}
      <path d="M50 70 L50 78" stroke="#0C5A3E" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
};
