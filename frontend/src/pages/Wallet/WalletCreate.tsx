import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Wallet, 
  Plus, 
  ArrowRight,
  Shield,
  Key,
  Download,
  Copy,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { Button, Card, Input, Badge } from '../../components/ui';

export const WalletCreate: React.FC = () => {
  const navigate = useNavigate();
  const [walletName, setWalletName] = useState('');
  const [walletCreated, setWalletCreated] = useState(false);
  const [walletData, setWalletData] = useState<{
    address: string;
    privateKey: string;
    mnemonic: string;
  } | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const handleCreateWallet = async () => {
    if (!walletName.trim()) return;

    try {
      // Mock wallet creation - replace with actual API call
      const mockWalletData = {
        address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        privateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
      };

      setWalletData(mockWalletData);
      setWalletCreated(true);
    } catch (error) {
      console.error('Failed to create wallet:', error);
    }
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownload = () => {
    if (!walletData) return;

    const data = {
      walletName,
      address: walletData.address,
      privateKey: walletData.privateKey,
      mnemonic: walletData.mnemonic,
      createdAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${walletName}-wallet.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (walletCreated && walletData) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Wallet Created Successfully!</h1>
          <p className="text-gray-600 mt-2">
            Your new wallet has been created. Please save your credentials securely.
          </p>
        </div>

        {/* Security Warning */}
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">Security Warning</h3>
              <ul className="text-sm text-red-800 space-y-1">
                <li>• Save your private key and mnemonic phrase in a secure location</li>
                <li>• Never share your private key with anyone</li>
                <li>• Consider using a hardware wallet for large amounts</li>
                <li>• This information will not be shown again</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Wallet Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Wallet Address */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Wallet Address</h3>
              <Badge variant="outline" className="text-green-600 border-green-200">
                Public
              </Badge>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <code className="text-sm text-gray-700 break-all">
                  {walletData.address}
                </code>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(walletData.address, 'address')}
                className="w-full"
              >
                {copied === 'address' ? (
                  <CheckCircle className="w-4 h-4 mr-2" />
                ) : (
                  <Copy className="w-4 h-4 mr-2" />
                )}
                {copied === 'address' ? 'Copied!' : 'Copy Address'}
              </Button>
            </div>
          </Card>

          {/* Private Key */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Private Key</h3>
              <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
                Private
              </Badge>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <code className="text-sm text-gray-700 break-all">
                  {showPrivateKey ? walletData.privateKey : '••••••••••••••••••••••••••••••••'}
                </code>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPrivateKey(!showPrivateKey)}
                  className="flex-1"
                >
                  {showPrivateKey ? 'Hide' : 'Show'} Key
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(walletData.privateKey, 'privateKey')}
                  className="flex-1"
                >
                  {copied === 'privateKey' ? (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  ) : (
                    <Copy className="w-4 h-4 mr-2" />
                  )}
                  {copied === 'privateKey' ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Mnemonic Phrase */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Mnemonic Phrase</h3>
            <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
              Private
            </Badge>
          </div>
          <div className="space-y-3">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {walletData.mnemonic.split(' ').map((word, index) => (
                  <div key={index} className="flex items-center space-x-1">
                    <span className="text-xs text-gray-500 w-4">{index + 1}.</span>
                    <span className="text-sm font-medium">{word}</span>
                  </div>
                ))}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy(walletData.mnemonic, 'mnemonic')}
              className="w-full"
            >
              {copied === 'mnemonic' ? (
                <CheckCircle className="w-4 h-4 mr-2" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              {copied === 'mnemonic' ? 'Copied!' : 'Copy Mnemonic'}
            </Button>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={handleDownload}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Download Wallet File</span>
          </Button>
          <Button
            onClick={() => navigate('/wallet/details')}
            className="flex items-center space-x-2"
          >
            <span>View Wallet Details</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
          <Wallet className="w-8 h-8 text-primary-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Create New Wallet</h1>
        <p className="text-gray-600 mt-2">
          Create a new blockchain wallet to manage your vehicle transactions
        </p>
      </div>

      {/* Wallet Creation Form */}
      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wallet Name
            </label>
            <Input
              placeholder="Enter a name for your wallet"
              value={walletName}
              onChange={(e) => setWalletName(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              This name will help you identify your wallet
            </p>
          </div>

          {/* Security Information */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-blue-900 mb-1">Security Information</h3>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Your private key will be generated locally</li>
                  <li>• We never store your private keys</li>
                  <li>• You'll receive a mnemonic phrase for backup</li>
                  <li>• Keep your credentials secure and private</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Key className="w-5 h-5 text-gray-600" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">Secure Generation</h4>
                <p className="text-xs text-gray-500">Cryptographically secure key generation</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Shield className="w-5 h-5 text-gray-600" />
              <div>
                <h4 className="text-sm font-medium text-gray-900">Private & Secure</h4>
                <p className="text-xs text-gray-500">Your keys never leave your device</p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleCreateWallet}
            disabled={!walletName.trim()}
            className="w-full flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Wallet</span>
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default WalletCreate;

