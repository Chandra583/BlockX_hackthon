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
        {/* VERIDRIVE Logo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-6 relative"
        >
          <h1 className="text-7xl md:text-8xl font-black tracking-tight">
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent drop-shadow-2xl">
              VERI
            </span>
            <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent drop-shadow-2xl relative">
              DRIVE
              {/* Web3 hexagon effect */}
              {/* <div className="absolute -top-2 -right-2 w-6 h-6 border-2 border-cyan-400 rotate-45 opacity-60"></div> */}
              {/* <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full opacity-80"></div> */}
            </span>
          </h1>
          
          {/* Powered by Solana - Top Right */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 1.2, ease: "easeOut" }}
            className="absolute -top-2 -right-2"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-lg border border-purple-500/30">
              <div className="w-1.5 h-1.5 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
              <span className="text-gray-300 text-xs font-medium tracking-wide">Powered by Solana</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="mb-8"
        >
          <p className="text-2xl md:text-3xl text-gray-300 font-light tracking-wide">
            Reinventing Vehicle Trust with Blockchain
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
            From mileage to ownership—every vehicle detail, verified on-chain.
          </p>
          <p className="text-lg md:text-xl text-white font-medium leading-relaxed">
            Smart contracts, IoT integration, and NFT-based certificates for total transparency.
          </p>
          <p className="text-lg md:text-xl text-white font-medium leading-relaxed">
            Trust what you drive. Verify what you buy.
          </p>
        </motion.div>

        {/* Call-to-Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8"
        >
          {/* Primary CTA - Explore dApp */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGetStarted}
            className="px-8 py-4 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 rounded-full text-white font-semibold text-lg min-w-[160px] shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-emerald-400/30 relative overflow-hidden"
            aria-label="Explore VERIDRIVE dApp"
          >
            <span className="relative z-10">Explore dApp</span>
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-blue-400 opacity-0 hover:opacity-100 transition-opacity duration-200"></div>
          </motion.button>

          {/* Secondary CTA - Learn More */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLearnMore}
            className="px-8 py-4 border-2 border-cyan-400 rounded-full text-cyan-400 font-semibold text-lg min-w-[160px] hover:bg-cyan-400 hover:text-slate-900 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-cyan-400/30 relative overflow-hidden"
            aria-label="Learn more about VERIDRIVE features"
          >
            <span className="relative z-10">Learn More</span>
            <div className="absolute inset-0 bg-cyan-400 opacity-0 hover:opacity-100 transition-opacity duration-200"></div>
          </motion.button>
        </motion.div>

        {/* Web3 Trust Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
          className="flex justify-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gray-800/50 backdrop-blur-sm rounded-full border border-gray-700/50">
            <div className="w-3 h-3 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full animate-pulse"></div>
            <span className="text-white text-sm font-medium">Blockchain Verified</span>
            <div className="w-1 h-1 bg-cyan-400 rounded-full animate-ping"></div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BlockXLanding;
