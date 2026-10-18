import React from 'react';

export const AtmosphereBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none -z-10 select-none">
      {/* Layer 0: Obsidian Base */}
      <div className="absolute inset-0 bg-[#06080c]" />

      {/* Layer 1: High-Definition Atmospheric Video Atmosphere */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-20 filter saturate-150 contrast-125"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260325_120549_0cd82c36-56b3-4dd9-b190-069cfc3a623f.mp4"
      />

      {/* Layer 2: Dual Gaussian Glow Orbs with Physics Blend */}
      <div 
        className="absolute -top-[15%] -left-[10%] w-[700px] h-[700px] rounded-full bg-rose-600/15 blur-[140px] mix-blend-screen animate-pulseSlow" 
      />
      <div 
        className="absolute top-[35%] -right-[15%] w-[620px] h-[620px] rounded-full bg-cyan-600/10 blur-[130px] mix-blend-screen animate-pulseSlow" 
        style={{ animationDelay: '2s' }}
      />
      <div 
        className="absolute -bottom-[20%] left-[20%] w-[800px] h-[600px] rounded-full bg-purple-700/10 blur-[150px] mix-blend-screen" 
      />

      {/* Layer 3: Contrast Gradient Vignette Fade */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#06080c]/90 via-transparent to-[#06080c]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#06080c]/70 via-transparent to-[#06080c]/70" />

      {/* Layer 4: Vertical and Horizontal Hairline Micro-Grid */}
      <div className="absolute inset-0 hairline-grid opacity-30" />
    </div>
  );
};
