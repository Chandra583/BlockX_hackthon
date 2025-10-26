import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface GooeyTextProps {
  texts: string[];
  morphTime?: number;
  cooldownTime?: number;
  className?: string;
}

export const GooeyText: React.FC<GooeyTextProps> = ({
  texts,
  morphTime = 1,
  cooldownTime = 0.25,
  className = "",
}) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  // Check for reduced motion preference
  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  React.useEffect(() => {
    if (prefersReducedMotion) return; // Don't animate if reduced motion is preferred
    
    const interval = setInterval(() => {
      setIsAnimating(true);
      
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % texts.length);
        setIsAnimating(false);
      }, morphTime * 1000);
    }, (morphTime + cooldownTime) * 1000);

    return () => clearInterval(interval);
  }, [texts.length, morphTime, cooldownTime, prefersReducedMotion]);

  // If reduced motion is preferred, just show the first text
  if (prefersReducedMotion) {
    return (
      <div className={`inline-block ${className}`}>
        {texts[0]}
      </div>
    );
  }

  return (
    <div className={`relative inline-block ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ 
            opacity: 1, 
            y: 0, 
            scale: 1,
            transition: { duration: morphTime, ease: "easeOut" }
          }}
          exit={{ 
            opacity: 0, 
            y: -20, 
            scale: 0.8,
            transition: { duration: morphTime * 0.5, ease: "easeIn" }
          }}
          className="inline-block"
        >
          {texts[currentIndex]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default GooeyText;
