import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Hyperspeed, { hyperspeedPresets } from '../Hyperspeed';

const BlockXLanding: React.FC = () => {
  const navigate = useNavigate();
  
  const handleGetStarted = () => {
    navigate('/login');
  };
  
  const handleLearnMore = () => {
    // You can add a scroll to features section or open a modal
    console.log('Learn More clicked');
  };
  
  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-black">
      {/* Hyperspeed Background - Full container */}
      <div className="absolute inset-0 w-full h-full z-0">
        <Hyperspeed effectOptions={hyperspeedPresets.one} />
      </div>
      
      {/* Light overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20 z-10"></div>

      {/* Main Content */}
      <div className="relative z-20 text-center px-4 max-w-4xl mx-auto">
        {/* BLOCKX Logo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-6"
        >
          <h1 className="text-8xl md:text-9xl font-black tracking-tight">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              BLOCK
            </span>
            <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent relative">
              X
              {/* Diamond cutout effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-slate-900 rotate-45"></div>
              </div>
            </span>
          </h1>
        </motion.div>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="mb-8"
        >
          <p className="text-2xl md:text-3xl text-gray-300 font-light tracking-wide">
            Digital Trust
          </p>
        </motion.div>

        {/* Service Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="mb-12 space-y-4"
        >
          <p className="text-lg md:text-xl text-white font-medium leading-relaxed">
            Crafting exceptional vehicle verification experiences through innovative IoT technology.
          </p>
          <p className="text-lg md:text-xl text-white font-medium leading-relaxed">
            Real-time, tamper-proof mileage tracking powered by blockchain infrastructure.
          </p>
          <p className="text-lg md:text-xl text-white font-medium leading-relaxed">
            Stop odometer fraud. Restore value and trust in every resale, fleet audit, and insurance claim.
          </p>
        </motion.div>

        {/* Call-to-Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8"
        >
          {/* Primary CTA - Get Started */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGetStarted}
            className="px-8 py-4 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full text-white font-semibold text-lg min-w-[160px] shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-cyan-400/30"
            aria-label="Get started with VERIDRIVE vehicle verification"
          >
            Get Started
          </motion.button>

          {/* Secondary CTA - Learn More */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLearnMore}
            className="px-8 py-4 border-2 border-white rounded-full text-white font-semibold text-lg min-w-[160px] hover:bg-white hover:text-slate-900 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-white/30"
            aria-label="Learn more about VERIDRIVE features"
          >
            Learn More
          </motion.button>
        </motion.div>

        {/* Trust Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
          className="flex justify-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gray-800/50 backdrop-blur-sm rounded-full border border-gray-700/50">
            <div className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-white text-sm font-medium">TrustScore Verified</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BlockXLanding;
