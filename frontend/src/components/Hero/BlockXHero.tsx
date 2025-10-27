import React from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Smartphone, 
  Users, 
  CheckCircle, 
  ArrowRight,
  PlayCircle
} from 'lucide-react';

const BlockXHero: React.FC = () => {
  const bulletPoints = [
    {
      icon: Shield,
      text: "Immutable mileage records you can verify instantly"
    },
    {
      icon: Smartphone,
      text: "Seamless OBD-II & smartphone integrations"
    },
    {
      icon: Users,
      text: "Trusted by buyers, insurers, and dealerships"
    }
  ];

  const trustBadges = [
    "Audit Verified",
    "GDPR Compliant", 
    "99.9% Uptime"
  ];

  return (
    <header 
      role="banner"
      className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden"
    >
      {/* Background Waves - Dimmed */}
      <div className="absolute inset-0 opacity-[0.12]">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-cyan-400 to-pink-400 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      {/* Hero Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative w-full max-w-4xl mx-auto"
      >
        <div className="bg-white/6 backdrop-blur-[10px] rounded-2xl p-6 md:p-8 border border-gradient-to-r from-cyan-400 to-purple-500 border-opacity-20 relative overflow-hidden">
          {/* Inner Neon Stroke */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400 to-purple-500 p-[1px]">
            <div className="w-full h-full bg-transparent rounded-2xl"></div>
          </div>
          
          {/* Content */}
          <div className="relative z-10">
            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="text-[clamp(34px,6vw,64px)] font-bold leading-tight mb-6 text-[#EDEFF3]"
            >
              Trust Every Verified Journey
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="text-[clamp(16px,2.2vw,20px)] leading-relaxed mb-8 text-[rgba(237,239,243,0.84)] max-w-2xl"
            >
              Real-time, tamper-proof vehicle mileage verification using IoT + blockchain.
            </motion.p>

            {/* Bullet Points */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="space-y-4 mb-8"
            >
              {bulletPoints.map((point, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    duration: 0.3, 
                    delay: 0.5 + (index * 0.08),
                    ease: "easeOut"
                  }}
                  className="flex items-start gap-4 group"
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 flex items-center justify-center mt-0.5 group-hover:scale-110 transition-transform duration-200">
                    <point.icon className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-[rgba(237,239,243,0.84)] text-lg leading-relaxed">
                    {point.text}
                  </p>
                </motion.div>
              ))}
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.7 }}
              className="flex flex-wrap items-center gap-4 mb-8 text-sm text-[rgba(237,239,243,0.7)]"
            >
              {trustBadges.map((badge, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>{badge}</span>
                  {index < trustBadges.length - 1 && (
                    <span className="text-[rgba(237,239,243,0.4)]">•</span>
                  )}
                </div>
              ))}
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 items-start sm:items-center"
            >
              {/* Primary CTA */}
              <motion.button
                whileHover={{ 
                  scale: 1.03,
                  y: -4,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                }}
                whileTap={{ scale: 0.98 }}
                className="group relative px-8 py-4 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full text-white font-semibold text-lg min-w-[160px] flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-cyan-400/30"
                aria-label="Get your vehicle verified on the blockchain"
              >
                <span>Get Verified</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
              </motion.button>

              {/* Secondary CTA */}
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="group flex items-center gap-2 text-[rgba(237,239,243,0.84)] hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 rounded-lg px-2 py-1"
                aria-label="Learn how the verification process works"
              >
                <PlayCircle className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                <span className="text-lg font-medium">Learn How</span>
              </motion.button>
            </motion.div>

            {/* Footer Note */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 1.0 }}
              className="mt-8 pt-6 border-t border-[rgba(237,239,243,0.2)]"
            >
              <p className="text-sm text-[rgba(237,239,243,0.6)] text-center sm:text-left">
                Version 1.0.0 • Pilot in India & EU
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </header>
  );
};

export default BlockXHero;
