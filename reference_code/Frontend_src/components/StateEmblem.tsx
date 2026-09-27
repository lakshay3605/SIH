import React from 'react';

interface StateEmblemProps {
  className?: string;
}

export const StateEmblem: React.FC<StateEmblemProps> = ({ className = "w-10 h-12" }) => {
  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      <img
        src="/assets/state_emblem.jpg"
        alt="Emblem of India"
        className="w-full h-full object-contain mix-blend-multiply filter contrast-125"
      />
    </div>
  );
};
