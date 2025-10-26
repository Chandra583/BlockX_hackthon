import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Plus, RefreshCw } from 'lucide-react';
import { useAppSelector } from '../../hooks/redux';
import { toast } from 'react-hot-toast';
import { WalletService } from '../../services/wallet';
import BalanceCard from '../../components/wallet/BalanceCard';
import TransactionItem from '../../components/wallet/TransactionItem';
import EnhancedTransactionHistory from '../../components/blockchain/EnhancedTransactionHistory';
import useSocket from '../../hooks/useSocket';

const WalletPage: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasWallet, setHasWallet] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const { socket } = useSocket();

  useEffect(() => {
    if (user) {
      fetchWalletInfo();
    }
  }, [user]);

  useEffect(() => {
    if (socket && hasWallet) {
      // Listen for new transactions
      socket.on('blockchain_tx_created', (newTx: any) => {
        setTransactions(prev => [newTx, ...prev]);
        toast.success('New transaction detected!');
      });

      socket.on('blockchain_tx_confirmed', (confirmedTx: any) => {
        setTransactions(prev => 
          prev.map(tx => 
            tx.id === confirmedTx.id ? { ...tx, status: 'confirmed' } : tx
          )
        );
      });

      return () => {
        socket.off('blockchain_tx_created');
        socket.off('blockchain_tx_confirmed');
      };
    }
  }, [socket, hasWallet]);

  const fetchWalletInfo = async () => {
    setIsLoading(true);
    try {
      const walletData = await WalletService.getAddress();
      setWalletAddress(walletData.address);
      setHasWallet(true);
    } catch (error: any) {
      console.error('Failed to fetch wallet info:', error);
      // Check if it's a 404 error (no wallet found)
      if (error.response?.status === 404 || error.response?.data?.code === 'WALLET_NOT_FOUND') {
        setHasWallet(false);
      } else {
        // For other errors, show error message
        toast.error('Failed to load wallet information');
        setHasWallet(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWallet = async () => {
    setIsLoading(true);
    try {
      const response = await WalletService.createWallet();
      toast.success('Wallet created successfully!');
      setWalletAddress(response.address);
      setHasWallet(true);
    } catch (error: any) {
      console.error('Failed to create wallet:', error);
      // Check if user already has a wallet
      if (error.response?.status === 409 || error.response?.data?.code === 'WALLET_EXISTS') {
        toast.error('You already have a wallet. Refreshing...');
        // Try to fetch the existing wallet
        setTimeout(() => {
          fetchWalletInfo();
        }, 1000);
      } else {
        toast.error(error.response?.data?.message || 'Failed to create wallet');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <RefreshCw className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-300 text-lg">Loading wallet information...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-black text-white mb-2 gradient-text">Wallet</h1>
          <p className="text-gray-300 text-lg">
            Manage your blockchain wallet and view transaction history
          </p>
        </motion.div>

        {hasWallet && walletAddress ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Balance Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-1"
            >
              <BalanceCard walletAddress={walletAddress} />
            </motion.div>

            {/* Transaction History */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2"
            >
              <EnhancedTransactionHistory />
            </motion.div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center min-h-[60vh]"
          >
            <div className="bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl p-12 text-center max-w-md">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Wallet className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">No Wallet Found</h3>
              <p className="text-gray-300 mb-8">
                You don't have a blockchain wallet yet. Create one to start using the BlockX platform.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCreateWallet}
                disabled={isLoading}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 mr-2" />
                    Create Wallet
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default WalletPage;