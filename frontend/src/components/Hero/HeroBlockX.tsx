import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Hyperspeed from './Hyperspeed';
import { getPerformanceAdjustedOptions } from '../../config/hyperspeedConfig.js';
import { styleTokens } from '../../config/styleTokens.js';
import usePrefersReducedMotion from '../../hooks/usePrefersReducedMotion';
import { GooeyText } from '../ui/gooey-text-morphing';

interface HeroBlockXProps {
  className?: string;
}

const HeroBlockX: React.FC<HeroBlockXProps> = ({ className = '' }) => {
  const [isHyperspeedEnabled, setIsHyperspeedEnabled] = useState(true);
  const [shouldShowHyperspeed, setShouldShowHyperspeed] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  // Check localStorage and performance conditions
  useEffect(() => {
    const savedPreference = localStorage.getItem('hyperspeed');
    const hyperspeedDisabled = savedPreference === 'false';
    
    // Check device memory (if available)
    const deviceMemory = (navigator as any).deviceMemory || 4;
    
    // Check if mobile device
    const isMobile = window.innerWidth < parseInt(styleTokens.breakpoints.mobile);
    
    // Check environment variable
    const envDisabled = import.meta.env.VITE_HYPERSPEED === 'off';
    
    // Determine if hyperspeed should be shown
    const shouldShow = !hyperspeedDisabled && 
                     !prefersReducedMotion && 
                     deviceMemory >= 2 && 
                     !isMobile &&
                     !envDisabled;
    
    setIsHyperspeedEnabled(shouldShow);
    setShouldShowHyperspeed(shouldShow);
  }, [prefersReducedMotion]);

  const toggleHyperspeed = () => {
    const newState = !isHyperspeedEnabled;
    setIsHyperspeedEnabled(newState);
    setShouldShowHyperspeed(newState);
    localStorage.setItem('hyperspeed', newState.toString());
  };

  const handleHyperspeedError = (error: Error) => {
    console.error('Hyperspeed animation failed:', error);
    console.log('Telemetry: hyperspeed_failed', { error: error.message });
    
    // Fallback to disabled state
    setShouldShowHyperspeed(false);
    setIsHyperspeedEnabled(false);
  };

  const effectOptions = getPerformanceAdjustedOptions();

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: prefersReducedMotion ? 0 : 0.8, ease: 'easeOut' }
  };

  const staggerChildren = {
    animate: {
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.2
      }
    }
  };

  return (
    <div 
      className={`relative min-h-screen overflow-hidden ${className}`}
      style={{ minHeight: styleTokens.spacing.heroMinHeight }}
    >
      {/* Background Layer */}
      <div className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
        <AnimatePresence>
          {shouldShowHyperspeed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
              className="absolute inset-0"
            >
              <Hyperspeed 
                effectOptions={effectOptions}
                className="w-full h-full"
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Fallback gradient background */}
        {!shouldShowHyperspeed && (
          <div 
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${styleTokens.colors.bgGradientStart} 0%, ${styleTokens.colors.bgGradientEnd} 100%)`
            }}
          />
        )}
        
        {/* Subtle vignette overlay for better text contrast */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.3) 100%)'
          }}
        />
      </div>

      {/* Content Container */}
      <div 
        className="relative z-10 flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8"
        aria-hidden="false"
      >
        <div 
          className="text-center w-full"
          style={{ maxWidth: styleTokens.spacing.containerMaxWidth }}
        >
          {/* Transparent Panel - No Background */}
          <motion.div
            className="relative mx-auto"
            style={{
              padding: 'clamp(3rem, 8vw, 6rem)',
            }}
            variants={staggerChildren}
            initial="initial"
            animate="animate"
          >
            {/* BlockX Brand - Large and Bold */}
            <motion.h1
              className="mb-8 font-black"
              style={{
                fontFamily: styleTokens.typography.fontPrimary,
                fontSize: `clamp(3rem, 8vw, 6rem)`,
                fontWeight: 900,
                lineHeight: '0.9',
                background: `linear-gradient(135deg, ${styleTokens.colors.accent1} 0%, ${styleTokens.colors.accent2} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textTransform: 'uppercase',
                letterSpacing: '-0.02em',
              }}
              variants={fadeInUp}
            >
              BlockX
            </motion.h1>
            
            {/* Main Headline - Gooey Text Morphing */}
            <motion.div
              className="mb-6"
              variants={fadeInUp}
            >
              <div
                className="font-bold"
                style={{
                  fontFamily: styleTokens.typography.fontPrimary,
                  fontSize: `clamp(2rem, 5vw, 3.5rem)`,
                  fontWeight: 700,
                  lineHeight: '1.1',
                  color: styleTokens.colors.textMain,
                }}
              >
                <GooeyText
                  texts={["Elevate Your", "Digital Trust"]}
                  morphTime={1.5}
                  cooldownTime={0.5}
                  className="font-bold"
                />
              </div>
            </motion.div>
            
            {/* Supporting description - 3 lines */}
            <motion.div
              className="mb-12 mx-auto"
              style={{
                fontFamily: styleTokens.typography.fontSecondary,
                fontSize: `clamp(${styleTokens.typography.body.mobile}, 1.5vw, ${styleTokens.typography.body.desktop})`,
                fontWeight: styleTokens.typography.weightLight,
                lineHeight: styleTokens.typography.body.lineHeight,
                color: styleTokens.colors.textMuted,
                maxWidth: '780px',
              }}
              variants={fadeInUp}
            >
              <p className="mb-2">Crafting exceptional vehicle verification experiences through innovative IoT technology.</p>
              <p className="mb-2">Real-time, tamper-proof mileage tracking powered by blockchain infrastructure.</p>
              <p>Stop odometer fraud. Restore value and trust in every resale, fleet audit, and insurance claim.</p>
            </motion.div>
            
            {/* CTA Row */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              variants={fadeInUp}
            >
              {/* Primary CTA - Solid gradient */}
              <motion.button
                className="relative px-8 py-4 font-semibold rounded-xl focus:outline-none transition-all duration-200"
                style={{
                  fontFamily: styleTokens.typography.fontSecondary,
                  fontSize: styleTokens.typography.cta.desktop,
                  fontWeight: styleTokens.typography.cta.fontWeight,
                  lineHeight: styleTokens.typography.cta.lineHeight,
                  background: `linear-gradient(135deg, ${styleTokens.colors.accent1} 0%, ${styleTokens.colors.accent2} 100%)`,
                  color: styleTokens.colors.textMain,
                  borderRadius: '12px',
                  boxShadow: styleTokens.effects.shadowSoft,
                }}
                whileHover={prefersReducedMotion ? {} : { 
                  y: -3,
                  boxShadow: styleTokens.effects.shadowMedium,
                  transition: { duration: 0.2, ease: 'easeInOut' }
                }}
                whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                onClick={() => window.location.href = '/login'}
                aria-label="Get started with BlockX"
                onFocus={(e) => {
                  e.target.style.outline = `2px solid ${styleTokens.colors.focusRing}`;
                  e.target.style.outlineOffset = styleTokens.effects.focusRingOffset;
                }}
                onBlur={(e) => {
                  e.target.style.outline = 'none';
                  e.target.style.outlineOffset = '0';
                }}
              >
                Get Started
              </motion.button>
              
              {/* Secondary CTA - Outline */}
              <motion.button
                className="px-8 py-4 font-semibold rounded-xl border-2 focus:outline-none transition-all duration-200"
                style={{
                  fontFamily: styleTokens.typography.fontSecondary,
                  fontSize: styleTokens.typography.cta.desktop,
                  fontWeight: styleTokens.typography.cta.fontWeight,
                  lineHeight: styleTokens.typography.cta.lineHeight,
                  borderColor: styleTokens.colors.textMain,
                  color: styleTokens.colors.textMain,
                  borderRadius: '12px',
                  backgroundColor: 'transparent',
                }}
                whileHover={prefersReducedMotion ? {} : { 
                  y: -3,
                  backgroundColor: styleTokens.colors.surface,
                  transition: { duration: 0.2, ease: 'easeInOut' }
                }}
                whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                aria-label="Learn more about BlockX"
                onFocus={(e) => {
                  e.target.style.outline = `2px solid ${styleTokens.colors.focusRing}`;
                  e.target.style.outlineOffset = styleTokens.effects.focusRingOffset;
                }}
                onBlur={(e) => {
                  e.target.style.outline = 'none';
                  e.target.style.outlineOffset = '0';
                }}
              >
                Learn More
              </motion.button>
            </motion.div>
            
            {/* Trust Badge */}
            <motion.div
              className="mt-8 flex justify-center"
              variants={fadeInUp}
            >
              <div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                style={{
                  backgroundColor: styleTokens.colors.surface,
                  border: `1px solid ${styleTokens.colors.glassBorder}`,
                }}
              >
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: styleTokens.colors.accent1 }}
                />
                <span 
                  className="text-sm font-medium"
                  style={{ 
                    color: styleTokens.colors.textMuted,
                    fontFamily: styleTokens.typography.fontSecondary,
                  }}
                >
                  TrustScore Verified
                </span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Background Toggle Control */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: prefersReducedMotion ? 0 : 1, duration: prefersReducedMotion ? 0 : 0.3 }}
        onClick={toggleHyperspeed}
        className="absolute top-4 right-4 z-20 px-3 py-2 text-sm font-medium rounded-lg border transition-colors focus:outline-none"
        style={{
          fontFamily: styleTokens.typography.fontSecondary,
          color: styleTokens.colors.textMain,
          backgroundColor: styleTokens.colors.surface,
          borderColor: styleTokens.colors.glassBorder,
          backdropFilter: `blur(${styleTokens.effects.glassBlur})`,
        }}
        aria-label={`Background: ${isHyperspeedEnabled ? 'On' : 'Off'}`}
        onFocus={(e) => {
          e.target.style.outline = `2px solid ${styleTokens.colors.focusRing}`;
          e.target.style.outlineOffset = styleTokens.effects.focusRingOffset;
        }}
        onBlur={(e) => {
          e.target.style.outline = 'none';
          e.target.style.outlineOffset = '0';
        }}
      >
        Background: {isHyperspeedEnabled ? 'On' : 'Off'}
      </motion.button>

      {/* Error Boundary for Hyperspeed */}
      <ErrorBoundary onError={handleHyperspeedError}>
        {shouldShowHyperspeed && (
          <Hyperspeed 
            effectOptions={effectOptions}
            className="absolute inset-0 w-full h-full"
          />
        )}
      </ErrorBoundary>
    </div>
  );
};

// Simple Error Boundary component
interface ErrorBoundaryProps {
  children: React.ReactNode;
  onError: (error: Error) => void;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, { hasError: boolean }> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError(error);
  }

  render() {
    if (this.state.hasError) {
      return null; // Fallback to static background
    }

    return this.props.children;
  }
}

export default HeroBlockX;