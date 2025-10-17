import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Car, 
  ArrowLeft, 
  Shield, 
  Smartphone, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit,
  History,
  TrendingUp,
  MapPin,
  Calendar,
  Wrench,
  FileText,
  ExternalLink
} from 'lucide-react';
import { useAppSelector } from '../../hooks/redux';
import { LoadingSpinner, Badge, Button, Card, Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui';
import { useSocket } from '../../hooks/useSocket';

interface VehicleDetails {
  id: string;
  vin: string;
  vehicleNumber: string;
  make: string;
  model: string;
  year: number;
  color: string;
  bodyType: string;
  fuelType: string;
  transmission: string;
  engineSize: string;
  currentMileage: number;
  lastMileageUpdate: string;
  trustScore: number;
  verificationStatus: string;
  condition: string;
  features: string[];
  description: string;
  hasDevice: boolean;
  deviceStatus?: 'active' | 'inactive' | 'pending';
  deviceId?: string;
  isForSale: boolean;
  listingStatus: string;
  blockchainHash?: string;
  blockchainAddress?: string;
  createdAt: string;
  updatedAt: string;
}

interface TrustScoreHistory {
  id: string;
  score: number;
  change: number;
  reason: string;
  timestamp: string;
}

interface MileageRecord {
  id: string;
  mileage: number;
  recordedBy: string;
  recordedAt: string;
  source: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  verified: boolean;
  blockchainHash?: string;
}

export const VehicleDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [vehicle, setVehicle] = useState<VehicleDetails | null>(null);
  const [trustScoreHistory, setTrustScoreHistory] = useState<TrustScoreHistory[]>([]);
  const [mileageHistory, setMileageHistory] = useState<MileageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  const socket = useSocket();

  // Load vehicle details
  useEffect(() => {
    const loadVehicleDetails = async () => {
      if (!id) return;

      try {
        setLoading(true);
        
        // Mock data - replace with actual API call
        const mockVehicle: VehicleDetails = {
          id,
          vin: '1HGBH41JXMN109186',
          vehicleNumber: 'ABC123',
          make: 'Honda',
          model: 'Civic',
          year: 2021,
          color: 'Silver',
          bodyType: 'sedan',
          fuelType: 'gasoline',
          transmission: 'automatic',
          engineSize: '1.5L',
          currentMileage: 25000,
          lastMileageUpdate: '2024-01-20T14:45:00Z',
          trustScore: 95,
          verificationStatus: 'verified',
          condition: 'excellent',
          features: ['Bluetooth', 'Backup Camera', 'Lane Assist', 'Cruise Control'],
          description: 'Well-maintained Honda Civic with low mileage and excellent condition.',
          hasDevice: true,
          deviceStatus: 'active',
          deviceId: 'DEV-001',
          isForSale: false,
          listingStatus: 'not_listed',
          blockchainHash: '0x1234567890abcdef',
          blockchainAddress: '0xabcdef1234567890',
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-20T14:45:00Z'
        };

        const mockTrustScoreHistory: TrustScoreHistory[] = [
          {
            id: '1',
            score: 95,
            change: +5,
            reason: 'Recent service record added',
            timestamp: '2024-01-20T14:45:00Z'
          },
          {
            id: '2',
            score: 90,
            change: +10,
            reason: 'Vehicle verification completed',
            timestamp: '2024-01-18T09:30:00Z'
          },
          {
            id: '3',
            score: 80,
            change: 0,
            reason: 'Initial trust score',
            timestamp: '2024-01-15T10:30:00Z'
          }
        ];

        const mockMileageHistory: MileageRecord[] = [
          {
            id: '1',
            mileage: 25000,
            recordedBy: 'Device',
            recordedAt: '2024-01-20T14:45:00Z',
            source: 'automated',
            location: {
              latitude: 40.7128,
              longitude: -74.0060,
              accuracy: 5
            },
            verified: true,
            blockchainHash: '0xabcdef1234567890'
          },
          {
            id: '2',
            mileage: 24500,
            recordedBy: 'Owner',
            recordedAt: '2024-01-15T10:30:00Z',
            source: 'owner',
            verified: false
          }
        ];

        setVehicle(mockVehicle);
        setTrustScoreHistory(mockTrustScoreHistory);
        setMileageHistory(mockMileageHistory);
      } catch (error) {
        console.error('Failed to load vehicle details:', error);
      } finally {
        setLoading(false);
      }
    };

    loadVehicleDetails();
  }, [id]);

  // Real-time updates
  useEffect(() => {
    if (!socket || !vehicle) return;

    const handleTrustScoreChanged = (data: any) => {
      if (data.vehicleId === vehicle.id) {
        setVehicle(prev => prev ? { ...prev, trustScore: data.newScore } : null);
        
        // Add to trust score history
        const newHistoryItem: TrustScoreHistory = {
          id: `realtime-${Date.now()}`,
          score: data.newScore,
          change: data.newScore - data.oldScore,
          reason: data.reason,
          timestamp: new Date().toISOString()
        };
        setTrustScoreHistory(prev => [newHistoryItem, ...prev]);
      }
    };

    const handleDeviceActivated = (data: any) => {
      if (data.vehicleId === vehicle.id) {
        setVehicle(prev => prev ? {
          ...prev,
          hasDevice: true,
          deviceStatus: 'active',
          deviceId: data.deviceId
        } : null);
      }
    };

    socket.on('trustscore_changed', handleTrustScoreChanged);
    socket.on('device_activated', handleDeviceActivated);

    return () => {
      socket.off('trustscore_changed', handleTrustScoreChanged);
      socket.off('device_activated', handleDeviceActivated);
    };
  }, [socket, vehicle]);

  const getTrustScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'flagged':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const handleRequestInstall = () => {
    navigate(`/devices?vehicle=${vehicle?.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading vehicle details..." />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Vehicle not found</h2>
          <p className="text-gray-600 mb-4">The vehicle you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={() => navigate('/vehicles')}>
            Back to Vehicles
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate('/vehicles')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h1>
            <p className="text-gray-600">{vehicle.vin}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {!vehicle.hasDevice && (
            <Button onClick={handleRequestInstall} className="flex items-center space-x-2">
              <Smartphone className="w-4 h-4" />
              <span>Request Install</span>
            </Button>
          )}
          <Button variant="outline" className="flex items-center space-x-2">
            <Edit className="w-4 h-4" />
            <span>Edit</span>
          </Button>
        </div>
      </div>

      {/* Trust Score Display */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-primary-100 rounded-lg">
              <Shield className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Trust Score</h2>
              <p className="text-sm text-gray-500">Vehicle reliability and authenticity score</p>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-lg border ${getTrustScoreColor(vehicle.trustScore)}`}>
            <span className="text-2xl font-bold">{vehicle.trustScore}%</span>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              vehicle.trustScore >= 90 ? 'bg-green-500' :
              vehicle.trustScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${vehicle.trustScore}%` }}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span>Excellent (90-100)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full" />
            <span>Good (70-89)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <span>Poor (0-69)</span>
          </div>
        </div>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trustscore">Trust Score</TabsTrigger>
          <TabsTrigger value="mileage">Mileage</TabsTrigger>
          <TabsTrigger value="blockchain">Blockchain</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vehicle Information */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Vehicle Number:</span>
                  <span className="font-medium">{vehicle.vehicleNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Color:</span>
                  <span className="font-medium">{vehicle.color}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Body Type:</span>
                  <span className="font-medium capitalize">{vehicle.bodyType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Fuel Type:</span>
                  <span className="font-medium capitalize">{vehicle.fuelType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Transmission:</span>
                  <span className="font-medium capitalize">{vehicle.transmission}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Engine Size:</span>
                  <span className="font-medium">{vehicle.engineSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Condition:</span>
                  <span className="font-medium capitalize">{vehicle.condition}</span>
                </div>
              </div>
            </Card>

            {/* Device Status */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Device Installed:</span>
                  <div className="flex items-center space-x-2">
                    {vehicle.hasDevice ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    )}
                    <span className="font-medium">
                      {vehicle.hasDevice ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
                
                {vehicle.hasDevice && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Device ID:</span>
                      <span className="font-medium">{vehicle.deviceId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      <Badge 
                        variant={vehicle.deviceStatus === 'active' ? 'default' : 'outline'}
                        className={vehicle.deviceStatus === 'active' ? 'bg-green-100 text-green-800' : ''}
                      >
                        {vehicle.deviceStatus}
                      </Badge>
                    </div>
                  </>
                )}
                
                {!vehicle.hasDevice && (
                  <div className="mt-4">
                    <Button onClick={handleRequestInstall} className="w-full">
                      <Smartphone className="w-4 h-4 mr-2" />
                      Request Device Installation
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Features */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Features</h3>
            <div className="flex flex-wrap gap-2">
              {vehicle.features.map((feature, index) => (
                <Badge key={index} variant="outline">
                  {feature}
                </Badge>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="trustscore" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Trust Score History</h3>
            <div className="space-y-4">
              {trustScoreHistory.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      entry.change > 0 ? 'bg-green-100 text-green-800' :
                      entry.change < 0 ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {entry.change > 0 ? '+' : ''}{entry.change}
                    </div>
                    <div>
                      <p className="font-medium">{entry.score}%</p>
                      <p className="text-sm text-gray-500">{entry.reason}</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="mileage" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Mileage History</h3>
            <div className="space-y-4">
              {mileageHistory.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <TrendingUp className="w-4 h-4 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium">{record.mileage.toLocaleString()} miles</p>
                      <p className="text-sm text-gray-500">
                        Recorded by {record.recordedBy} • {record.source}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {new Date(record.recordedAt).toLocaleDateString()}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      {record.verified && (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                      {record.blockchainHash && (
                        <ExternalLink className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="blockchain" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Blockchain Information</h3>
            <div className="space-y-4">
              {vehicle.blockchainHash && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Transaction Hash:</span>
                  <div className="flex items-center space-x-2">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {vehicle.blockchainHash.slice(0, 10)}...
                    </code>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
              {vehicle.blockchainAddress && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Contract Address:</span>
                  <div className="flex items-center space-x-2">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {vehicle.blockchainAddress.slice(0, 10)}...
                    </code>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VehicleDetails;

