import React, { useState, useEffect } from 'react';
import { WalletCard } from '../../components/blockchain/WalletCard';
import { EnhancedTransactionHistory } from '../../components/blockchain/EnhancedTransactionHistory';
import { useAppSelector } from '../../hooks/redux';
import { toast } from 'react-hot-toast';
import BlockchainService from '../../services/blockchain';

const WalletPage: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasWallet, setHasWallet] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      fetchWalletInfo();
    }
  }, [user]);

  const fetchWalletInfo = async () => {
    setIsLoading(true);
    try {
      // Check if user has a wallet
      const walletExists = await BlockchainService.hasWallet();
      setHasWallet(walletExists);
      
      if (walletExists) {
        // Get wallet details
        const walletData = await BlockchainService.getWallet();
        if (walletData.success) {
          setWalletAddress(walletData.data.walletAddress);
        }
      }
    } catch (error) {
      console.error('Failed to fetch wallet info:', error);
      toast.error('Failed to load wallet information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWallet = async () => {
    setIsLoading(true);
    try {
      const response = await BlockchainService.createWallet();
      
      if (response.success) {
        toast.success('Wallet created successfully!');
        setWalletAddress(response.data.walletAddress);
        setHasWallet(true);
      } else {
        toast.error(response.message || 'Failed to create wallet');
      }
    } catch (error: any) {
      console.error('Failed to create wallet:', error);
      toast.error(error.message || 'Failed to create wallet');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading wallet information...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Wallet</h1>
        <p className="mt-2 text-gray-600">
          Manage your blockchain wallet and view transaction history
        </p>
      </div>

      {hasWallet && walletAddress ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <WalletCard walletAddress={walletAddress} />
          </div>
          <div className="lg:col-span-2">
            <EnhancedTransactionHistory />
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No Wallet Found</h3>
          <p className="mt-2 text-gray-500">
            You don't have a blockchain wallet yet. Create one to start using the BlockX platform.
          </p>
          <div className="mt-6">
            <button
              onClick={handleCreateWallet}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                'Create Wallet'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletPage;