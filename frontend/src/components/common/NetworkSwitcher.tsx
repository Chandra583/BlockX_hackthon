import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import type { SolanaNetwork } from '../../lib/solana';

interface NetworkSwitcherProps {
  currentNetwork: SolanaNetwork;
  onNetworkChange: (network: SolanaNetwork) => void;
  className?: string;
}

const NETWORKS: { value: SolanaNetwork; label: string; color: string }[] = [
  { value: 'devnet', label: 'Devnet', color: 'bg-yellow-500' },
  { value: 'testnet', label: 'Testnet', color: 'bg-blue-500' },
  { value: 'mainnet', label: 'Mainnet', color: 'bg-green-500' }
];

export const NetworkSwitcher: React.FC<NetworkSwitcherProps> = ({
  currentNetwork,
  onNetworkChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const currentNetworkConfig = NETWORKS.find(n => n.value === currentNetwork);

  return (
    <div className={`relative ${className}`}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg border border-slate-600/50 text-white transition-all duration-200"
        aria-label="Select network"
      >
        <div className={`w-2 h-2 rounded-full ${currentNetworkConfig?.color}`} />
        <span className="text-sm font-medium">{currentNetworkConfig?.label}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          className="absolute right-0 mt-2 w-48 bg-slate-900/95 backdrop-blur-xl rounded-xl border border-slate-700/50 shadow-2xl z-50 overflow-hidden"
        >
          {NETWORKS.map((network) => (
            <motion.button
              key={network.value}
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
              onClick={() => {
                onNetworkChange(network.value);
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-4 py-3 text-left text-gray-300 hover:text-white transition-colors duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${network.color}`} />
                <span className="font-medium">{network.label}</span>
              </div>
              {currentNetwork === network.value && (
                <Check className="w-4 h-4 text-blue-400" />
              )}
            </motion.button>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default NetworkSwitcher;