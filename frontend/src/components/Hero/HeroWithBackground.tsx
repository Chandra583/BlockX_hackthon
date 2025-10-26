import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Hyperspeed from './Hyperspeed';
import { hyperspeedConfig } from '../../config/hyperspeedConfig';
import { Settings, Eye, EyeOff } from 'lucide-react';

interface HeroWithBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

const HeroWithBackground: React.FC<HeroWithBackgroundProps> = ({ 
  children, 
  className = '' 
}) => {
  const [isAnimationEnabled, setIsAnimationEnabled] = useState(true);
  const [shouldUseFallback, setShouldUseFallback] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const prefersReducedMotion = mediaQuery.matches;
    
    // Check device memory (if available)
    const deviceMemory = (navigator as any).deviceMemory;
    const lowMemory = deviceMemory && deviceMemory < 2;
    
    // Check screen size (mobile)
    const isMobile = window.innerWidth < 768;
    
    // Check localStorage setting
    const localStorageSetting = localStorage.getItem('hyperspeed');
    const userDisabled = localStorageSetting === 'false';
    
    // Determine if animation should be disabled
    const shouldDisable = !hyperspeedConfig.enabled || 
                         prefersReducedMotion || 
                         lowMemory || 
                         isMobile || 
                         userDisabled;
    
    setIsAnimationEnabled(!shouldDisable);
    setShouldUseFallback(shouldDisable);
  }, []);

  const toggleAnimation = () => {
    const newState = !isAnimationEnabled;
    setIsAnimationEnabled(newState);
    localStorage.setItem('hyperspeed', newState.toString());
  };

  const handleAnimationError = (error: Error) => {
    console.error('Hyperspeed animation failed:', error);
    console.log('hyperspeed_failed', { error: error.message });
    setShouldUseFallback(true);
    setIsAnimationEnabled(false);
  };

  return (
    <div className={`relative min-h-screen overflow-hidden ${className}`}>
      {/* Animated Background */}
      {isAnimationEnabled && !shouldUseFallback && (
        <div className="hero-bg absolute inset-0 z-0">
          <Hyperspeed 
            effectOptions={hyperspeedConfig.effectOptions}
            className="w-full h-full"
          />
        </div>
      )}
      
      {/* Fallback Background */}
      {(!isAnimationEnabled || shouldUseFallback) && (
        <div 
          className="hero-bg absolute inset-0 z-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
          aria-hidden="true"
        />
      )}
      
      {/* Content Container */}
      <div className="relative z-10 min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto"
          aria-hidden="false"
        >
          {/* Backdrop for better text readability */}
          <div className="backdrop-blur-sm bg-black/20 rounded-2xl p-8 sm:p-12 lg:p-16">
            {children}
          </div>
        </motion.div>
      </div>
      
      {/* Animation Toggle Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        onClick={toggleAnimation}
        className="fixed top-4 right-4 z-20 p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label={`${isAnimationEnabled ? 'Disable' : 'Enable'} background animation`}
        title={`Background: ${isAnimationEnabled ? 'On' : 'Off'}`}
      >
        {isAnimationEnabled ? (
          <Eye className="w-5 h-5" />
        ) : (
          <EyeOff className="w-5 h-5" />
        )}
      </motion.button>
    </div>
  );
};

export default HeroWithBackground;
