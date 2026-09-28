import React from 'react';

interface SamvaadLogoProps {
  className?: string;
}

export const SamvaadLogo: React.FC<SamvaadLogoProps> = ({ className = "w-12 h-10" }) => {
  return (
    <img
      src="/assets/samvaad_logo.png"
      alt="Samvaad Logo"
      className={`object-contain ${className}`}
    />
  );
};

