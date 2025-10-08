import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  RefreshCw, 
  Copy, 
  ExternalLink, 
  Plus, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAppSelector } from '../../hooks/redux';
import { BlockchainService } from '../../services/blockchain';

interface WalletData {
  success: boolean;
  message: string;
  data: {
    walletAddress: string;
    balance: number;
    blockchain: string;
    network: string;
  };
}

interface WalletDisplayProps {
  showCreateButton?: boolean;
  onWalletCreated?: (wallet: WalletData) => void;
  className?: string;
}

export const WalletDisplay: React.FC<WalletDisplayProps> = ({
  showCreateButton = true,
  onWalletCreated,
  className = ''
}) => {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showFullAddress, setShowFullAddress] = useState(false);
  const { user } = useAppSelector((state) => state.auth);

  // Fetch wallet data on component mount
  useEffect(() => {
    if (user) {
      fetchWallet();
    }
  }, [user]);

  const fetchWallet = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await BlockchainService.getWallet();
      setWallet(response);
    } catch (err: any) {
      if (err.response?.status === 404) {
        // No wallet found - this is expected for new users
        setWallet(null);
        setError(null);
      } else {
        setError(err.response?.data?.message || 'Failed to fetch wallet information');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const createWallet = async () => {
    setIsCreating(true);
    setError(null);

    try {
      const response = await BlockchainService.createWallet();
      setWallet(response);
      onWalletCreated?.(response);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create wallet');
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    if (showFullAddress) return address;
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const getExplorerUrl = (address: string, network: string) => {
    const baseUrl = 'https://explorer.solana.com/address';
    const cluster = network === 'mainnet' ? '' : `?cluster=${network}`;
    return `${baseUrl}/${address}${cluster}`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Loading wallet...</span>
        </div>
      </div>
    );
  }

  // No wallet state
  if (!wallet) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Wallet className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Blockchain Wallet</h3>
          <p className="text-gray-600 mb-6">
            Create a blockchain wallet to register vehicles and track mileage securely.
          </p>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center text-red-800 text-sm">
                <AlertCircle className="w-4 h-4 mr-2" />
                {error}
              </div>
            </div>
          )}

          {showCreateButton && (
            <button
              onClick={createWallet}
              disabled={isCreating}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Wallet...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Wallet
                </>
              )}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Wallet exists - show wallet information
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full mr-3">
              <Wallet className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Blockchain Wallet</h3>
              <p className="text-sm text-gray-600">Solana {wallet.data.network} network</p>
            </div>
          </div>
          <button
            onClick={fetchWallet}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Refresh wallet"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Wallet Content */}
      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center text-red-800 text-sm">
              <AlertCircle className="w-4 h-4 mr-2" />
              {error}
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Balance */}
          <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Balance</p>
            <p className="text-3xl font-bold text-gray-900">
              {wallet.data.balance.toFixed(4)} <span className="text-lg text-gray-600">SOL</span>
            </p>
            {wallet.data.balance === 0 && (
              <p className="text-xs text-orange-600 mt-2">
                Fund your wallet to register vehicles on blockchain
              </p>
            )}
          </div>

          {/* Wallet Address */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Wallet Address</label>
              <button
                onClick={() => setShowFullAddress(!showFullAddress)}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                {showFullAddress ? (
                  <><EyeOff className="w-3 h-3 inline mr-1" />Hide</>
                ) : (
                  <><Eye className="w-3 h-3 inline mr-1" />Show Full</>
                )}
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex-1 p-3 bg-gray-50 rounded-lg">
                <p className="font-mono text-sm text-gray-900 break-all">
                  {formatAddress(wallet.data.walletAddress)}
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(wallet.data.walletAddress)}
                className="p-3 text-gray-400 hover:text-gray-600 transition-colors"
                title="Copy address"
              >
                {copied ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={getExplorerUrl(wallet.data.walletAddress, wallet.data.network)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View on Explorer
            </a>
            
            {wallet.data.balance === 0 && (
              <a
                href="https://faucet.solana.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Get Free SOL
              </a>
            )}
          </div>

          {/* Wallet Info */}
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Blockchain:</span>
                <p className="font-medium capitalize">{wallet.data.blockchain}</p>
              </div>
              <div>
                <span className="text-gray-500">Network:</span>
                <p className="font-medium capitalize">{wallet.data.network}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-6 py-4 bg-gray-50 rounded-b-lg">
        <div className="flex items-start">
          <AlertCircle className="w-4 h-4 text-blue-600 mr-2 mt-0.5" />
          <div className="text-xs text-gray-600">
            <p className="font-medium mb-1">Secure Custodial Wallet</p>
            <p>Your wallet is securely managed by VERIDRIVE. Private keys are encrypted and stored safely.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletDisplay;
