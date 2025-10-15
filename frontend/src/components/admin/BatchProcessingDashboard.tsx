import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Database, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Play,
  Pause,
  Eye,
  Download,
  Filter
} from 'lucide-react';

interface BatchStatistics {
  totalBatches: number;
  completedBatches: number;
  submittedBatches: number;
  failedBatches: number;
  totalDataPoints: number;
  totalMileage: number;
  averageBatchSize: number;
  averageTripDistance: number;
}

interface BatchData {
  _id: string;
  batchId: string;
  deviceID: string;
  vehicleId?: {
    vin: string;
    make: string;
    vehicleModel: string;
    year: number;
  };
  batchType: string;
  tripStartTime: string;
  tripEndTime?: string;
  tripStatus: string;
  summary: {
    totalDataPoints: number;
    startMileage: number;
    endMileage: number;
    mileageDifference: number;
    averageSpeed?: number;
    maxSpeed?: number;
  };
  validation: {
    isValid: boolean;
    fraudScore: number;
    anomalies: string[];
  };
  blockchainSubmission?: {
    submitted: boolean;
    submittedAt?: string;
    transactionHash?: string;
    submissionAttempts: number;
    lastError?: string;
  };
}

const BatchProcessingDashboard: React.FC = () => {
  const [statistics, setStatistics] = useState<BatchStatistics | null>(null);
  const [recentBatches, setRecentBatches] = useState<BatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('recent');

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/batch-processing/statistics');
      if (response.ok) {
        const data = await response.json();
        setStatistics(data.data?.statistics || null);
        setRecentBatches(data.data?.recentBatches || []);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processPendingBatches = async () => {
    try {
      setProcessing(true);
      const response = await fetch('/api/admin/batch-processing/trigger-submission', {
        method: 'POST'
      });
      
      if (response.ok) {
        setTimeout(fetchDashboardData, 2000);
      }
    } catch (error) {
      console.error('Failed to process pending batches:', error);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-blue-100 text-blue-800', icon: Activity },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      submitted: { color: 'bg-purple-100 text-purple-800', icon: CheckCircle },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Batch Processing Dashboard</h1>
        <div className="flex space-x-2">
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={processPendingBatches}
            disabled={processing}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center disabled:opacity-50"
          >
            {processing ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            Process Pending
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Batches</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalBatches}</p>
              </div>
              <Database className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {statistics.submittedBatches} submitted to blockchain
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statistics.totalBatches > 0 
                    ? Math.round((statistics.completedBatches / statistics.totalBatches) * 100)
                    : 0}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {statistics.completedBatches} completed successfully
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Data Points</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalDataPoints.toLocaleString()}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-400" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Avg {statistics.averageBatchSize.toFixed(1)} per batch
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Distance</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalMileage.toLocaleString()} km</p>
              </div>
              <Activity className="h-8 w-8 text-purple-400" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Avg {statistics.averageTripDistance.toFixed(1)} km per trip
            </p>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button 
            onClick={() => setActiveTab('recent')}
            className={`border-b-2 py-2 px-1 text-sm font-medium ${
              activeTab === 'recent' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Recent Batches
          </button>
          <button 
            onClick={() => setActiveTab('pending')}
            className={`border-b-2 py-2 px-1 text-sm font-medium ${
              activeTab === 'pending' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Pending Submissions
          </button>
          <button 
            onClick={() => setActiveTab('failed')}
            className={`border-b-2 py-2 px-1 text-sm font-medium ${
              activeTab === 'failed' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Failed Submissions
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {recentBatches.map((batch) => (
          <div key={batch._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold">Batch: {batch.batchId}</h3>
                  {getStatusBadge(batch.tripStatus)}
                  {!batch.validation.isValid && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Validation Failed
                    </span>
                  )}
                </div>
                
                <p className="text-gray-600 mb-2">
                  Device: {batch.deviceID}
                  {batch.vehicleId && (
                    <span> • Vehicle: {batch.vehicleId.year} {batch.vehicleId.make} {batch.vehicleId.vehicleModel}</span>
                  )}
                </p>
                
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Data Points:</span>
                    <p className="font-semibold">{batch.summary.totalDataPoints}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Distance:</span>
                    <p className="font-semibold">{batch.summary.mileageDifference} km</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Avg Speed:</span>
                    <p className="font-semibold">{batch.summary.averageSpeed?.toFixed(1) || 'N/A'} km/h</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Trip Duration:</span>
                    <p className="font-semibold">
                      {batch.tripEndTime ? 
                        Math.round((new Date(batch.tripEndTime).getTime() - new Date(batch.tripStartTime).getTime()) / (1000 * 60))
                        : 'Ongoing'
                      } min
                    </p>
                  </div>
                </div>

                {batch.validation.fraudScore > 0 && (
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      batch.validation.fraudScore > 70 ? 'bg-red-100 text-red-800' :
                      batch.validation.fraudScore > 40 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      Fraud Score: {batch.validation.fraudScore}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <button className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 flex items-center">
                  <Eye className="w-4 h-4 mr-1" />
                  View Details
                </button>
                
                {batch.tripStatus === 'failed' && (
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-sm rounded flex items-center">
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Retry
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {recentBatches.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No batch data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchProcessingDashboard;