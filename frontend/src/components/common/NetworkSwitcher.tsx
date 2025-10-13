import React, { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

type SolanaNetwork = 'devnet' | 'testnet' | 'mainnet';

interface NetworkSwitcherProps {
  currentNetwork: SolanaNetwork;
  onNetworkChange: (network: SolanaNetwork) => void;
  className?: string;
}

const getNetworkBadgeColor = (network: SolanaNetwork): string => {
  switch (network) {
    case 'devnet':
      return 'bg-yellow-100 text-yellow-800';
    case 'testnet':
      return 'bg-blue-100 text-blue-800';
    case 'mainnet':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const NetworkSwitcher: React.FC<NetworkSwitcherProps> = ({
  currentNetwork,
  onNetworkChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const networks: { value: SolanaNetwork; label: string }[] = [
    { value: 'devnet', label: 'Devnet' },
    { value: 'testnet', label: 'Testnet' },
    { value: 'mainnet', label: 'Mainnet' }
  ];

  const handleNetworkSelect = (network: SolanaNetwork) => {
    onNetworkChange(network);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-solana-purple focus:ring-offset-2"
        aria-label="Select Solana network"
        aria-expanded={isOpen}
      >
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getNetworkBadgeColor(currentNetwork)}`}>
          {networks.find(n => n.value === currentNetwork)?.label}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50">
          {networks.map((network) => (
            <button
              key={network.value}
              onClick={() => handleNetworkSelect(network.value)}
              className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg transition-colors duration-200"
            >
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getNetworkBadgeColor(network.value)}`}>
                  {network.label}
                </span>
              </div>
              {currentNetwork === network.value && (
                <Check className="w-4 h-4 text-solana-purple" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default NetworkSwitcher;
