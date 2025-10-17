import React, { useEffect, useState } from 'react';
import { 
  History as HistoryIcon, 
  Search, 
  Filter, 
  Calendar,
  MapPin,
  Clock,
  ExternalLink,
  Download,
  RefreshCw,
  TrendingUp,
  Shield,
  FileText,
  Database
} from 'lucide-react';
import { useAppSelector } from '../../hooks/redux';
import { LoadingSpinner, EmptyState, Badge, Button, Card, Input, Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui';
import { useSocket } from '../../hooks/useSocket';

interface TelemetryRecord {
  id: string;
  vehicleId: string;
  vin: string;
  timestamp: string;
  mileage: number;
  location: {
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    state: string;
  };
  merkleRoot: string;
  solanaTransactionHash?: string;
  arweaveDocumentId?: string;
  deviceId: string;
  verified: boolean;
  blockchainHash?: string;
}

interface TrustScoreChange {
  id: string;
  vehicleId: string;
  vin: string;
  oldScore: number;
  newScore: number;
  change: number;
  reason: string;
  timestamp: string;
  triggeredBy: string;
}

interface Vehicle {
  id: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  color: string;
}

export const History: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [telemetryRecords, setTelemetryRecords] = useState<TelemetryRecord[]>([]);
  const [trustScoreChanges, setTrustScoreChanges] = useState<TrustScoreChange[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVin, setSelectedVin] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [activeTab, setActiveTab] = useState('telemetry');
  const [realtimeUpdates, setRealtimeUpdates] = useState(0);
  
  const socket = useSocket();

  // Load history data
  useEffect(() => {
    const loadHistoryData = async () => {
      try {
        setLoading(true);
        
        // Mock vehicles data
        const mockVehicles: Vehicle[] = [
          {
            id: 'v1',
            vin: '1HGBH41JXMN109186',
            make: 'Honda',
            model: 'Civic',
            year: 2021,
            color: 'Silver'
          },
          {
            id: 'v2',
            vin: '1FTFW1ET5DFC12345',
            make: 'Ford',
            model: 'F-150',
            year: 2020,
            color: 'Black'
          }
        ];

        // Mock telemetry records
        const mockTelemetryRecords: TelemetryRecord[] = [
          {
            id: 't1',
            vehicleId: 'v1',
            vin: '1HGBH41JXMN109186',
            timestamp: '2024-01-20T14:45:00Z',
            mileage: 25000,
            location: {
              latitude: 40.7128,
              longitude: -74.0060,
              address: '123 Main St',
              city: 'New York',
              state: 'NY'
            },
            merkleRoot: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
            solanaTransactionHash: '5KJp7K8Xq9Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9',
            arweaveDocumentId: 'ar://abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567890',
            deviceId: 'DEV-001',
            verified: true,
            blockchainHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
          },
          {
            id: 't2',
            vehicleId: 'v1',
            vin: '1HGBH41JXMN109186',
            timestamp: '2024-01-19T10:30:00Z',
            mileage: 24950,
            location: {
              latitude: 40.7589,
              longitude: -73.9851,
              address: '456 Broadway',
              city: 'New York',
              state: 'NY'
            },
            merkleRoot: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
            solanaTransactionHash: '4JIp6J7Xq8Y1Z2A3B4C5D6E7F8G9H0I1J2K3L4M5N6O7P8Q9R0S1T2U3V4W5X6Y7Z8A9',
            arweaveDocumentId: 'ar://def456ghi789jkl012mno345pqr678stu901vwx234yz567890abc123',
            deviceId: 'DEV-001',
            verified: true,
            blockchainHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
          }
        ];

        // Mock trust score changes
        const mockTrustScoreChanges: TrustScoreChange[] = [
          {
            id: 'ts1',
            vehicleId: 'v1',
            vin: '1HGBH41JXMN109186',
            oldScore: 90,
            newScore: 95,
            change: 5,
            reason: 'Recent service record added',
            timestamp: '2024-01-20T15:00:00Z',
            triggeredBy: 'system'
          },
          {
            id: 'ts2',
            vehicleId: 'v1',
            vin: '1HGBH41JXMN109186',
            oldScore: 85,
            newScore: 90,
            change: 5,
            reason: 'Vehicle verification completed',
            timestamp: '2024-01-18T09:30:00Z',
            triggeredBy: 'admin'
          }
        ];

        setVehicles(mockVehicles);
        setTelemetryRecords(mockTelemetryRecords);
        setTrustScoreChanges(mockTrustScoreChanges);
      } catch (error) {
        console.error('Failed to load history data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHistoryData();
  }, []);

  // Real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleTelemetryBatchIngested = (data: any) => {
      setRealtimeUpdates(prev => prev + 1);
      // Add new telemetry records
      const newRecords: TelemetryRecord[] = data.records.map((record: any) => ({
        id: `realtime-${Date.now()}-${Math.random()}`,
        vehicleId: data.vehicleId,
        vin: data.vin,
        timestamp: record.timestamp,
        mileage: record.mileage,
        location: record.location,
        merkleRoot: record.merkleRoot,
        solanaTransactionHash: record.solanaTransactionHash,
        arweaveDocumentId: record.arweaveDocumentId,
        deviceId: record.deviceId,
        verified: true,
        blockchainHash: record.blockchainHash
      }));
      setTelemetryRecords(prev => [...newRecords, ...prev]);
    };

    const handleTrustScoreChanged = (data: any) => {
      setRealtimeUpdates(prev => prev + 1);
      // Add new trust score change
      const newChange: TrustScoreChange = {
        id: `realtime-${Date.now()}`,
        vehicleId: data.vehicleId,
        vin: data.vin,
        oldScore: data.oldScore,
        newScore: data.newScore,
        change: data.newScore - data.oldScore,
        reason: data.reason,
        timestamp: new Date().toISOString(),
        triggeredBy: data.triggeredBy
      };
      setTrustScoreChanges(prev => [newChange, ...prev]);
    };

    socket.on('telemetry_batch_ingested', handleTelemetryBatchIngested);
    socket.on('trustscore_changed', handleTrustScoreChanged);

    return () => {
      socket.off('telemetry_batch_ingested', handleTelemetryBatchIngested);
      socket.off('trustscore_changed', handleTrustScoreChanged);
    };
  }, [socket]);

  const filteredTelemetryRecords = telemetryRecords.filter(record => {
    const matchesSearch = 
      record.vin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.location.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.location.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesVin = selectedVin === 'all' || record.vin === selectedVin;
    
    const matchesDateRange = 
      (!dateRange.start || new Date(record.timestamp) >= new Date(dateRange.start)) &&
      (!dateRange.end || new Date(record.timestamp) <= new Date(dateRange.end));

    return matchesSearch && matchesVin && matchesDateRange;
  });

  const filteredTrustScoreChanges = trustScoreChanges.filter(change => {
    const matchesVin = selectedVin === 'all' || change.vin === selectedVin;
    
    const matchesDateRange = 
      (!dateRange.start || new Date(change.timestamp) >= new Date(dateRange.start)) &&
      (!dateRange.end || new Date(change.timestamp) <= new Date(dateRange.end));

    return matchesVin && matchesDateRange;
  });

  const handleExportData = () => {
    // Mock export functionality
    const data = {
      telemetryRecords: filteredTelemetryRecords,
      trustScoreChanges: filteredTrustScoreChanges,
      exportDate: new Date().toISOString(),
      filters: {
        vin: selectedVin,
        dateRange,
        searchTerm
      }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veridrive-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading history..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">History & Telemetry</h1>
          <p className="text-gray-600 mt-1">
            View vehicle telemetry data, trust score changes, and blockchain transactions
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {realtimeUpdates > 0 && (
            <div className="flex items-center space-x-2 text-sm text-green-600">
              <RefreshCw className="w-4 h-4" />
              <span>{realtimeUpdates} real-time updates</span>
            </div>
          )}
          <Button onClick={handleExportData} variant="outline" className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export Data</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by VIN, address, or city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle</label>
            <select
              value={selectedVin}
              onChange={(e) => setSelectedVin(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Vehicles</option>
              {vehicles.map(vehicle => (
                <option key={vehicle.id} value={vehicle.vin}>
                  {vehicle.year} {vehicle.make} {vehicle.model} ({vehicle.vin})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="pl-10"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="telemetry">Telemetry Data</TabsTrigger>
          <TabsTrigger value="trustscore">Trust Score History</TabsTrigger>
        </TabsList>

        <TabsContent value="telemetry" className="space-y-6">
          {/* Telemetry Records */}
          {filteredTelemetryRecords.length === 0 ? (
            <EmptyState
              icon={Database}
              title="No telemetry records found"
              description={searchTerm || selectedVin !== 'all' || dateRange.start || dateRange.end
                ? "Try adjusting your search or filter criteria"
                : "No telemetry data has been recorded yet"
              }
            />
          ) : (
            <div className="space-y-4">
              {filteredTelemetryRecords.map((record) => (
                <Card key={record.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-primary-100 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Telemetry Record - {record.vin}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {new Date(record.timestamp).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500">
                          Device: {record.deviceId}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={record.verified ? 'default' : 'outline'}
                        className={record.verified ? 'bg-green-100 text-green-800' : ''}
                      >
                        {record.verified ? 'Verified' : 'Unverified'}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center space-x-2 text-sm">
                      <TrendingUp className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">Mileage:</span>
                      <span className="font-medium">{record.mileage.toLocaleString()} mi</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">Location:</span>
                      <span className="font-medium">{record.location.city}, {record.location.state}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">Time:</span>
                      <span className="font-medium">
                        {new Date(record.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2 text-sm mb-1">
                        <Database className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500">Merkle Root:</span>
                      </div>
                      <code className="text-xs text-gray-700 break-all">
                        {record.merkleRoot.slice(0, 20)}...
                      </code>
                    </div>
                    
                    {record.solanaTransactionHash && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center space-x-2 text-sm mb-1">
                          <ExternalLink className="w-4 h-4 text-blue-600" />
                          <span className="text-gray-500">Solana TX:</span>
                        </div>
                        <code className="text-xs text-blue-700 break-all">
                          {record.solanaTransactionHash.slice(0, 20)}...
                        </code>
                      </div>
                    )}
                    
                    {record.arweaveDocumentId && (
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center space-x-2 text-sm mb-1">
                          <FileText className="w-4 h-4 text-green-600" />
                          <span className="text-gray-500">Arweave Doc:</span>
                        </div>
                        <code className="text-xs text-green-700 break-all">
                          {record.arweaveDocumentId.slice(0, 20)}...
                        </code>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-500">
                      Recorded at {record.location.address}
                    </div>
                    <div className="flex items-center space-x-2">
                      {record.solanaTransactionHash && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`https://explorer.solana.com/tx/${record.solanaTransactionHash}`, '_blank')}
                          className="flex items-center space-x-1"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>View on Solana</span>
                        </Button>
                      )}
                      {record.arweaveDocumentId && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`https://arweave.net/${record.arweaveDocumentId}`, '_blank')}
                          className="flex items-center space-x-1"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>View on Arweave</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="trustscore" className="space-y-6">
          {/* Trust Score Changes */}
          {filteredTrustScoreChanges.length === 0 ? (
            <EmptyState
              icon={Shield}
              title="No trust score changes found"
              description={selectedVin !== 'all' || dateRange.start || dateRange.end
                ? "Try adjusting your filter criteria"
                : "No trust score changes have been recorded yet"
              }
            />
          ) : (
            <div className="space-y-4">
              {filteredTrustScoreChanges.map((change) => (
                <Card key={change.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-primary-100 rounded-lg">
                        <Shield className="w-6 h-6 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Trust Score Change - {change.vin}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {new Date(change.timestamp).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500">
                          Triggered by: {change.triggeredBy}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={change.change > 0 ? 'default' : 'destructive'}
                        className={change.change > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                      >
                        {change.change > 0 ? '+' : ''}{change.change} points
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Previous Score:</span>
                      <span className="font-medium">{change.oldScore}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">New Score:</span>
                      <span className="font-medium">{change.newScore}%</span>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>Reason:</strong> {change.reason}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default History;

