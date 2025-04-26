import React from 'react';

interface LogoProps {
  size?: string;
}

export function Logo({ size = "w-48 h-48" }: LogoProps) {
  return (
    <div className="rounded-full bg-white p-8">
      <img 
        src='supertip.jpg'
        alt="Logo" 
        className={`${size} rounded-full`}
      />
    </div>
  );
}