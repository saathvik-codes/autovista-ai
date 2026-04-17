import React from 'react';

export default function AutoVistaLogo({ className = 'h-10', dark = true }) {
  return (
    <svg className={className} viewBox="0 0 520 160" xmlns="http://www.w3.org/2000/svg" fill="none">
      <defs>
        <linearGradient id="mainGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#06b6d4"/>
          <stop offset="100%" stopColor="#3b82f6"/>
        </linearGradient>
        <linearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#22d3ee"/>
          <stop offset="100%" stopColor="#60a5fa"/>
        </linearGradient>
      </defs>
      <path d="M60 95 Q120 30 240 50 Q320 60 420 95" stroke="url(#mainGradient)" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <path d="M70 105 Q200 120 410 105" stroke="url(#glowGradient)" strokeWidth="2" opacity="0.6" fill="none"/>
      <circle cx="150" cy="100" r="7" fill="#3b82f6"/>
      <circle cx="350" cy="100" r="7" fill="#3b82f6"/>
      <text x="60" y="140" fontFamily="Outfit, Poppins, Inter, sans-serif" fontSize="42" fontWeight="600" fill={dark ? 'white' : '#111827'}>
        Auto<tspan fill="url(#mainGradient)">Vista</tspan>
      </text>
      <text x="62" y="155" fontFamily="Outfit, Inter, sans-serif" fontSize="13" fill="#94a3b8" letterSpacing="1">
        INTELLIGENT CAR DISCOVERY
      </text>
    </svg>
  );
}
