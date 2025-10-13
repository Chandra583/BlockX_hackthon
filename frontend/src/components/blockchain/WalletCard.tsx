import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, ExternalLink, RefreshCw, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { solanaHelper, formatSolBalance } from '../../lib/solana';
import { NetworkSwitcher } from '../common/NetworkSwitcher';

type SolanaNetwork = 'devnet' | 'testnet' | 'mainnet';

interface WalletCardProps {
  walletAddress: string;
  className?: string;
}

export const WalletCard: React.FC<WalletCardProps> = ({
  walletAddress,
  className = ''
}) => {
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [network, setNetwork] = useState<SolanaNetwork>('devnet');

  const fetchBalance = async () => {
    if (!walletAddress) return;
    
    setIsLoading(true);
    try {
      const newBalance = await solanaHelper.getBalance(walletAddress);
      setBalance(newBalance);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      toast.error('Failed to fetch wallet balance');
    } finally {
      setIsLoading(false);
    }
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      toast.success('Address copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy address:', error);
      toast.error('Failed to copy address');
    }
  };

  const openExplorer = () => {
    const explorerUrl = solanaHelper.getExplorerUrl(walletAddress, 'address');
    window.open(explorerUrl, '_blank', 'noopener,noreferrer');
  };

  const handleNetworkChange = (newNetwork: SolanaNetwork) => {
    setNetwork(newNetwork);
    solanaHelper.switchNetwork(newNetwork);
    fetchBalance();
  };

  useEffect(() => {
    fetchBalance();
  }, [walletAddress]);

  const truncatedAddress = solanaHelper.truncateAddress(walletAddress);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Solana Wallet
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {truncatedAddress}
            </p>
          </div>
        </div>
        
        <NetworkSwitcher
          currentNetwork={network}
          onNetworkChange={handleNetworkChange}
        />
      </div>

      {/* Balance Section with Gradient */}
      <div className="relative mb-6">
        <div className="bg-solana-gradient rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">Balance</p>
              <div className="flex items-center space-x-2">
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-lg font-semibold">Loading...</span>
                  </div>
                ) : (
                  <span className="text-2xl font-bold">
                    {formatSolBalance(balance)}
                  </span>
                )}
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchBalance}
              disabled={isLoading}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label="Refresh balance"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={copyAddress}
          className="flex-1 flex items-center justify-center space-x-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-4 py-2 rounded-lg font-medium text-gray-700 dark:text-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-solana-purple focus:ring-offset-2"
          aria-label="Copy wallet address"
        >
          <Copy className="w-4 h-4" />
          <span>Copy Address</span>
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={openExplorer}
          className="flex-1 flex items-center justify-center space-x-2 bg-solana-gradient text-white hover:opacity-90 px-4 py-2 rounded-lg font-medium transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-solana-purple focus:ring-offset-2"
          aria-label="View on Solana Explorer"
        >
          <ExternalLink className="w-4 h-4" />
          <span>View on Explorer</span>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default WalletCard;
