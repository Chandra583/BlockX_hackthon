import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, ExternalLink, RefreshCw, Wallet } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { SolanaNetwork } from '../../lib/solana';
import { WalletService } from '../../services/wallet';
import { solanaHelper, formatSolBalance } from '../../lib/solana';
import NetworkSwitcher from '../common/NetworkSwitcher';

interface BalanceCardProps {
  walletAddress: string;
  className?: string;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  walletAddress,
  className = ''
}) => {
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [network, setNetwork] = useState<SolanaNetwork>('devnet');
  const [copied, setCopied] = useState(false);

  const fetchBalance = async () => {
    if (!walletAddress) return;
    
    setIsLoading(true);
    try {
      const response = await WalletService.getBalance(walletAddress);
      setBalance(response.balanceSol);
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
      setCopied(true);
      toast.success('Address copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
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
      className={`bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Solana Wallet</h3>
            <p className="text-sm text-gray-400">{truncatedAddress}</p>
          </div>
        </div>
        
        <NetworkSwitcher
          currentNetwork={network}
          onNetworkChange={handleNetworkChange}
        />
      </div>

      {/* Balance Section */}
      <div className="relative mb-6">
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-6 border border-blue-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-2">Balance</p>
              <div className="flex items-center space-x-2">
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
                    <span className="text-2xl font-bold text-white">Loading...</span>
                  </div>
                ) : (
                  <span className="text-3xl font-bold text-white">
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
              className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              aria-label="Refresh balance"
            >
              <RefreshCw className={`w-5 h-5 text-white ${isLoading ? 'animate-spin' : ''}`} />
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
          className="flex-1 flex items-center justify-center space-x-2 bg-slate-800/50 hover:bg-slate-700/50 px-4 py-3 rounded-xl font-medium text-gray-300 hover:text-white transition-all duration-200 border border-slate-600/50"
          aria-label="Copy wallet address"
        >
          <Copy className="w-4 h-4" />
          <span>{copied ? 'Copied!' : 'Copy Address'}</span>
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={openExplorer}
          className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 border border-blue-500/30 text-blue-400 hover:text-blue-300 px-4 py-3 rounded-xl font-medium transition-all duration-200"
          aria-label="View on Solana Explorer"
        >
          <ExternalLink className="w-4 h-4" />
          <span>View on Explorer</span>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default BalanceCard;
