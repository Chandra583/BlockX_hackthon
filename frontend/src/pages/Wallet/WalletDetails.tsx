import React, { useEffect, useState } from 'react';
import { 
  Wallet, 
  Copy,
  ExternalLink,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAppSelector } from '../../hooks/redux';
import { LoadingSpinner, Badge, Button, Card, Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui';

interface WalletBalance {
  total: number;
  available: number;
  locked: number;
  currency: string;
}

interface Transaction {
  id: string;
  hash: string;
  type: 'send' | 'receive' | 'vehicle_registration' | 'device_activation' | 'trust_score_update';
  amount?: number;
  currency?: string;
  from?: string;
  to?: string;
  timestamp: string;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  gasUsed?: number;
  description: string;
}

interface WalletInfo {
  address: string;
  balance: WalletBalance;
  transactions: Transaction[];
  totalTransactions: number;
  firstTransaction?: string;
  lastActivity?: string;
}

export const WalletDetails: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Load wallet information
  useEffect(() => {
    const loadWalletInfo = async () => {
      try {
        setLoading(true);
        
        // Mock data - replace with actual API call
        const mockWalletInfo: WalletInfo = {
          address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
          balance: {
            total: 1250.50,
            available: 1200.00,
            locked: 50.50,
            currency: 'ETH'
          },
          transactions: [
            {
              id: 'tx1',
              hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
              type: 'vehicle_registration',
              amount: 0.1,
              currency: 'ETH',
              from: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
              to: '0xContractAddress1234567890abcdef1234567890abcdef',
              timestamp: '2024-01-20T14:45:00Z',
              status: 'confirmed',
              blockNumber: 12345678,
              gasUsed: 21000,
              description: 'Vehicle registration for VIN: 1HGBH41JXMN109186'
            },
            {
              id: 'tx2',
              hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
              type: 'device_activation',
              amount: 0.05,
              currency: 'ETH',
              from: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
              to: '0xContractAddress1234567890abcdef1234567890abcdef',
              timestamp: '2024-01-19T10:30:00Z',
              status: 'confirmed',
              blockNumber: 12345670,
              gasUsed: 15000,
              description: 'Device activation for DEV-001'
            },
            {
              id: 'tx3',
              hash: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
              type: 'receive',
              amount: 1.5,
              currency: 'ETH',
              from: '0xSenderAddress1234567890abcdef1234567890abcdef',
              to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
              timestamp: '2024-01-18T16:20:00Z',
              status: 'confirmed',
              blockNumber: 12345665,
              gasUsed: 21000,
              description: 'Received payment for vehicle sale'
            }
          ],
          totalTransactions: 3,
          firstTransaction: '2024-01-18T16:20:00Z',
          lastActivity: '2024-01-20T14:45:00Z'
        };

        setWalletInfo(mockWalletInfo);
      } catch (error) {
        console.error('Failed to load wallet info:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWalletInfo();
  }, []);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'send':
        return <ArrowUpRight className="w-4 h-4 text-red-600" />;
      case 'receive':
        return <ArrowDownLeft className="w-4 h-4 text-green-600" />;
      case 'vehicle_registration':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'device_activation':
        return <CheckCircle className="w-4 h-4 text-purple-600" />;
      case 'trust_score_update':
        return <TrendingUp className="w-4 h-4 text-orange-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'send':
        return 'text-red-600 bg-red-50';
      case 'receive':
        return 'text-green-600 bg-green-50';
      case 'vehicle_registration':
        return 'text-blue-600 bg-blue-50';
      case 'device_activation':
        return 'text-purple-600 bg-purple-50';
      case 'trust_score_update':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading wallet details..." />
      </div>
    );
  }

  if (!walletInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Wallet not found</h2>
          <p className="text-gray-600">Unable to load wallet information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Wallet Details</h1>
          <p className="text-gray-600 mt-1">
            Manage your blockchain wallet and view transaction history
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Wallet Address */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Wallet Address</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCopy(walletInfo.address, 'address')}
            className="flex items-center space-x-2"
          >
            {copied === 'address' ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            <span>{copied === 'address' ? 'Copied!' : 'Copy'}</span>
          </Button>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <code className="text-sm text-gray-700 break-all">
            {walletInfo.address}
          </code>
        </div>
      </Card>

      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Total Balance</h3>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {walletInfo.balance.total.toLocaleString()} {walletInfo.balance.currency}
          </div>
          <p className="text-sm text-gray-500">All funds</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Available</h3>
            <CheckCircle className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {walletInfo.balance.available.toLocaleString()} {walletInfo.balance.currency}
          </div>
          <p className="text-sm text-gray-500">Ready to use</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Locked</h3>
            <Clock className="w-5 h-5 text-orange-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {walletInfo.balance.locked.toLocaleString()} {walletInfo.balance.currency}
          </div>
          <p className="text-sm text-gray-500">In transactions</p>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Wallet Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Wallet Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Transactions:</span>
                  <span className="font-medium">{walletInfo.totalTransactions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">First Transaction:</span>
                  <span className="font-medium">
                    {walletInfo.firstTransaction ? 
                      new Date(walletInfo.firstTransaction).toLocaleDateString() : 
                      'N/A'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Activity:</span>
                  <span className="font-medium">
                    {walletInfo.lastActivity ? 
                      new Date(walletInfo.lastActivity).toLocaleDateString() : 
                      'N/A'
                    }
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Security</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Private Key:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-mono">
                      {showPrivateKey ? '0x1234...5678' : '••••••••••••••••'}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPrivateKey(!showPrivateKey)}
                    >
                      {showPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Backup Status:</span>
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Secured
                  </Badge>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          {/* Transaction History */}
          <div className="space-y-4">
            {walletInfo.transactions.map((transaction) => (
              <Card key={transaction.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${getTransactionColor(transaction.type)}`}>
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {transaction.description}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={transaction.status === 'confirmed' ? 'default' : 'outline'}
                      className={transaction.status === 'confirmed' ? 'bg-green-100 text-green-800' : ''}
                    >
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(transaction.status)}
                        <span className="capitalize">{transaction.status}</span>
                      </div>
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {transaction.amount && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Amount:</span>
                      <span className="font-medium">
                        {transaction.amount} {transaction.currency}
                      </span>
                    </div>
                  )}
                  {transaction.blockNumber && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Block:</span>
                      <span className="font-medium">{transaction.blockNumber}</span>
                    </div>
                  )}
                  {transaction.gasUsed && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Gas Used:</span>
                      <span className="font-medium">{transaction.gasUsed.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-gray-50 rounded-lg mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Transaction Hash:</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(transaction.hash, `tx-${transaction.id}`)}
                      className="flex items-center space-x-1"
                    >
                      {copied === `tx-${transaction.id}` ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span className="text-xs">
                        {copied === `tx-${transaction.id}` ? 'Copied!' : 'Copy'}
                      </span>
                    </Button>
                  </div>
                  <code className="text-xs text-gray-700 break-all mt-2 block">
                    {transaction.hash}
                  </code>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    {transaction.from && (
                      <div>
                        <span className="text-gray-500">From:</span>
                        <code className="text-xs ml-1">{transaction.from.slice(0, 10)}...</code>
                      </div>
                    )}
                    {transaction.to && (
                      <div>
                        <span className="text-gray-500">To:</span>
                        <code className="text-xs ml-1">{transaction.to.slice(0, 10)}...</code>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`https://etherscan.io/tx/${transaction.hash}`, '_blank')}
                    className="flex items-center space-x-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>View on Explorer</span>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WalletDetails;

