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
  Filter,
  Zap,
  FileText,
  Calendar,
  Gauge
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  Button, 
  Card, 
  Badge, 
  StatCard, 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent,
  EmptyState,
  PageLoader,
  Modal,
  ConfirmationModal,
  StatusBadge
} from '../ui';
import toast from 'react-hot-toast';

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
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedBatch, setSelectedBatch] = useState<BatchData | null>(null);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

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
    setConfirmationModal({
      isOpen: true,
      title: 'Process Pending Batches',
      message: 'This will submit all pending batches to the blockchain. This action cannot be undone. Are you sure you want to continue?',
      onConfirm: async () => {
        try {
          setProcessing(true);
          const response = await fetch('/api/admin/batch-processing/trigger-submission', {
            method: 'POST'
          });
          
          if (response.ok) {
            toast.success('Batch processing initiated successfully');
            setTimeout(fetchDashboardData, 2000);
          } else {
            toast.error('Failed to initiate batch processing');
          }
        } catch (error) {
          console.error('Failed to process pending batches:', error);
          toast.error('Failed to initiate batch processing');
        } finally {
          setProcessing(false);
          setConfirmationModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const viewBatchDetails = (batch: BatchData) => {
    setSelectedBatch(batch);
    setShowBatchModal(true);
  };

  const retryFailedBatch = async (batchId: string) => {
    try {
      const response = await fetch(`/api/admin/batch-processing/${batchId}/retry`, {
        method: 'POST'
      });
      
      if (response.ok) {
        toast.success('Batch retry initiated');
        fetchDashboardData();
      } else {
        toast.error('Failed to retry batch');
      }
    } catch (error) {
      console.error('Failed to retry batch:', error);
      toast.error('Failed to retry batch');
    }
  };

  // Calculate additional stats
  const pendingBatches = recentBatches.filter(batch => batch.tripStatus === 'active' || !batch.blockchainSubmission?.submitted);
  const failedBatches = recentBatches.filter(batch => batch.tripStatus === 'failed' || batch.validation.fraudScore > 70);
  const successRate = statistics ? (statistics.totalBatches > 0 ? (statistics.completedBatches / statistics.totalBatches) * 100 : 0) : 0;

  if (loading) {
    return <PageLoader text="Loading batch processing data..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Batch Processing Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor and manage vehicle data batch processing</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={fetchDashboardData}
          >
            Refresh
          </Button>
          <Button
            icon={processing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            onClick={processPendingBatches}
            loading={processing}
            disabled={pendingBatches.length === 0}
          >
            Process Pending ({pendingBatches.length})
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger 
            value="overview" 
            icon={<BarChart3 className="w-4 h-4" />}
          >
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="recent" 
            icon={<Clock className="w-4 h-4" />}
          >
            Recent Batches ({recentBatches.length})
          </TabsTrigger>
          <TabsTrigger 
            value="pending" 
            icon={<Activity className="w-4 h-4" />}
            badge={pendingBatches.length > 0 ? <Badge variant="warning" size="sm">{pendingBatches.length}</Badge> : undefined}
          >
            Pending
          </TabsTrigger>
          <TabsTrigger 
            value="failed" 
            icon={<XCircle className="w-4 h-4" />}
            badge={failedBatches.length > 0 ? <Badge variant="error" size="sm">{failedBatches.length}</Badge> : undefined}
          >
            Failed
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Batches"
                value={statistics.totalBatches}
                subtitle={`${statistics.submittedBatches} submitted to blockchain`}
                icon={<Database className="w-6 h-6" />}
                color="blue"
              />
              <StatCard
                title="Success Rate"
                value={`${successRate.toFixed(1)}%`}
                subtitle={`${statistics.completedBatches} completed successfully`}
                icon={<TrendingUp className="w-6 h-6" />}
                color="green"
                trend={{
                  value: successRate > 80 ? 5 : successRate > 60 ? 0 : -5,
                  isPositive: successRate > 80
                }}
              />
              <StatCard
                title="Data Points"
                value={statistics.totalDataPoints.toLocaleString()}
                subtitle={`Avg ${statistics.averageBatchSize.toFixed(1)} per batch`}
                icon={<BarChart3 className="w-6 h-6" />}
                color="purple"
              />
              <StatCard
                title="Total Distance"
                value={`${statistics.totalMileage.toLocaleString()} km`}
                subtitle={`Avg ${statistics.averageTripDistance.toFixed(1)} km per trip`}
                icon={<Gauge className="w-6 h-6" />}
                color="yellow"
              />
            </div>
          )}

          {/* Processing Timeline or Charts could go here */}
          <Card>
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Processing Timeline</h3>
              <p className="text-gray-600">Batch processing timeline and analytics will be displayed here.</p>
            </div>
          </Card>
        </TabsContent>

        {/* Recent Batches Tab */}
        <TabsContent value="recent">
          {recentBatches.length === 0 ? (
            <EmptyState
              icon={<Database className="w-16 h-16" />}
              title="No recent batches"
              description="No batch processing data available at the moment."
            />
          ) : (
            <div className="space-y-4">
              {recentBatches.map((batch, index) => (
                <motion.div
                  key={batch._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card hover className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Batch: {batch.batchId}
                          </h3>
                          <StatusBadge 
                            status={batch.tripStatus as any}
                            icon={batch.tripStatus === 'completed' ? <CheckCircle className="w-3 h-3" /> : 
                                  batch.tripStatus === 'failed' ? <XCircle className="w-3 h-3" /> : 
                                  <Activity className="w-3 h-3" />}
                          />
                          {!batch.validation.isValid && (
                            <Badge variant="error" icon={<AlertTriangle className="w-3 h-3" />}>
                              Validation Failed
                            </Badge>
                          )}
                          {batch.blockchainSubmission?.submitted && (
                            <Badge variant="success" icon={<CheckCircle className="w-3 h-3" />}>
                              Blockchain Submitted
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-gray-600 mb-3">
                          Device: {batch.deviceID}
                          {batch.vehicleId && (
                            <span> • Vehicle: {batch.vehicleId.year} {batch.vehicleId.make} {batch.vehicleId.vehicleModel}</span>
                          )}
                        </p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                          <div>
                            <span className="text-gray-500 block">Data Points</span>
                            <p className="font-semibold text-gray-900">{batch.summary.totalDataPoints}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Distance</span>
                            <p className="font-semibold text-gray-900">{batch.summary.mileageDifference} km</p>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Avg Speed</span>
                            <p className="font-semibold text-gray-900">{batch.summary.averageSpeed?.toFixed(1) || 'N/A'} km/h</p>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Duration</span>
                            <p className="font-semibold text-gray-900">
                              {batch.tripEndTime ? 
                                Math.round((new Date(batch.tripEndTime).getTime() - new Date(batch.tripStartTime).getTime()) / (1000 * 60))
                                : 'Ongoing'
                              } min
                            </p>
                          </div>
                        </div>

                        {batch.validation.fraudScore > 0 && (
                          <div className="mb-2">
                            <Badge 
                              variant={batch.validation.fraudScore > 70 ? 'error' : 
                                      batch.validation.fraudScore > 40 ? 'warning' : 'success'}
                            >
                              Fraud Score: {batch.validation.fraudScore}
                            </Badge>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Eye className="w-4 h-4" />}
                          onClick={() => viewBatchDetails(batch)}
                        >
                          View Details
                        </Button>
                        
                        {batch.tripStatus === 'failed' && (
                          <Button
                            variant="primary"
                            size="sm"
                            icon={<RefreshCw className="w-4 h-4" />}
                            onClick={() => retryFailedBatch(batch._id)}
                          >
                            Retry
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Pending Batches Tab */}
        <TabsContent value="pending">
          {pendingBatches.length === 0 ? (
            <EmptyState
              icon={<CheckCircle className="w-16 h-16" />}
              title="No pending batches"
              description="All batches have been processed successfully."
            />
          ) : (
            <div className="space-y-4">
              {pendingBatches.map((batch, index) => (
                <motion.div
                  key={batch._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card hover className="p-6 border-l-4 border-l-yellow-400">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Batch: {batch.batchId}
                          </h3>
                          <Badge variant="warning" icon={<Clock className="w-3 h-3" />}>
                            Pending Submission
                          </Badge>
                        </div>
                        
                        <p className="text-gray-600 mb-3">
                          Device: {batch.deviceID} • Created: {new Date(batch.tripStartTime).toLocaleDateString()}
                        </p>
                        
                        <div className="text-sm text-gray-600">
                          <p>Data Points: {batch.summary.totalDataPoints} • Distance: {batch.summary.mileageDifference} km</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Eye className="w-4 h-4" />}
                          onClick={() => viewBatchDetails(batch)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Failed Batches Tab */}
        <TabsContent value="failed">
          {failedBatches.length === 0 ? (
            <EmptyState
              icon={<CheckCircle className="w-16 h-16" />}
              title="No failed batches"
              description="All batches have been processed successfully without any failures."
            />
          ) : (
            <div className="space-y-4">
              {failedBatches.map((batch, index) => (
                <motion.div
                  key={batch._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card hover className="p-6 border-l-4 border-l-red-400">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Batch: {batch.batchId}
                          </h3>
                          <Badge variant="error" icon={<XCircle className="w-3 h-3" />}>
                            Failed
                          </Badge>
                          {batch.validation.fraudScore > 70 && (
                            <Badge variant="error" icon={<AlertTriangle className="w-3 h-3" />}>
                              High Fraud Risk
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-gray-600 mb-3">
                          Device: {batch.deviceID} • Failed: {new Date(batch.tripStartTime).toLocaleDateString()}
                        </p>
                        
                        {batch.blockchainSubmission?.lastError && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                            <p className="text-sm text-red-800">
                              <strong>Error:</strong> {batch.blockchainSubmission.lastError}
                            </p>
                          </div>
                        )}
                        
                        <div className="text-sm text-gray-600">
                          <p>Attempts: {batch.blockchainSubmission?.submissionAttempts || 0} • Fraud Score: {batch.validation.fraudScore}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Eye className="w-4 h-4" />}
                          onClick={() => viewBatchDetails(batch)}
                        >
                          View Details
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          icon={<RefreshCw className="w-4 h-4" />}
                          onClick={() => retryFailedBatch(batch._id)}
                        >
                          Retry
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Batch Details Modal */}
      <Modal
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        title={selectedBatch ? `Batch ${selectedBatch.batchId} Details` : ''}
        size="lg"
      >
        {selectedBatch && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Batch Information</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-500">Batch ID:</span> {selectedBatch.batchId}</p>
                  <p><span className="text-gray-500">Device ID:</span> {selectedBatch.deviceID}</p>
                  <p><span className="text-gray-500">Type:</span> {selectedBatch.batchType}</p>
                  <p><span className="text-gray-500">Status:</span> {selectedBatch.tripStatus}</p>
                  <p><span className="text-gray-500">Start Time:</span> {new Date(selectedBatch.tripStartTime).toLocaleString()}</p>
                  {selectedBatch.tripEndTime && (
                    <p><span className="text-gray-500">End Time:</span> {new Date(selectedBatch.tripEndTime).toLocaleString()}</p>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Trip Summary</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-500">Data Points:</span> {selectedBatch.summary.totalDataPoints}</p>
                  <p><span className="text-gray-500">Start Mileage:</span> {selectedBatch.summary.startMileage} km</p>
                  <p><span className="text-gray-500">End Mileage:</span> {selectedBatch.summary.endMileage} km</p>
                  <p><span className="text-gray-500">Distance:</span> {selectedBatch.summary.mileageDifference} km</p>
                  <p><span className="text-gray-500">Average Speed:</span> {selectedBatch.summary.averageSpeed?.toFixed(1) || 'N/A'} km/h</p>
                  <p><span className="text-gray-500">Max Speed:</span> {selectedBatch.summary.maxSpeed?.toFixed(1) || 'N/A'} km/h</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Validation Status</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  {selectedBatch.validation.isValid ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className={`font-medium ${selectedBatch.validation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedBatch.validation.isValid ? 'Valid' : 'Invalid'}
                  </span>
                </div>
                <p className="text-sm text-gray-600">Fraud Score: {selectedBatch.validation.fraudScore}</p>
                {selectedBatch.validation.anomalies.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-700">Anomalies:</p>
                    <ul className="text-sm text-gray-600 list-disc list-inside">
                      {selectedBatch.validation.anomalies.map((anomaly, index) => (
                        <li key={index}>{anomaly}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {selectedBatch.blockchainSubmission && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Blockchain Submission</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-500">Submitted:</span> {selectedBatch.blockchainSubmission.submitted ? 'Yes' : 'No'}</p>
                    {selectedBatch.blockchainSubmission.submittedAt && (
                      <p><span className="text-gray-500">Submitted At:</span> {new Date(selectedBatch.blockchainSubmission.submittedAt).toLocaleString()}</p>
                    )}
                    {selectedBatch.blockchainSubmission.transactionHash && (
                      <p><span className="text-gray-500">Transaction Hash:</span> 
                        <code className="ml-1 text-xs bg-gray-200 px-1 rounded">{selectedBatch.blockchainSubmission.transactionHash}</code>
                      </p>
                    )}
                    <p><span className="text-gray-500">Attempts:</span> {selectedBatch.blockchainSubmission.submissionAttempts}</p>
                    {selectedBatch.blockchainSubmission.lastError && (
                      <p><span className="text-gray-500">Last Error:</span> 
                        <span className="text-red-600 ml-1">{selectedBatch.blockchainSubmission.lastError}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmationModal.onConfirm}
        title={confirmationModal.title}
        message={confirmationModal.message}
        variant="warning"
      />
    </div>
  );
};

export default BatchProcessingDashboard;