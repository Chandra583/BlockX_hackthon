import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { History, Gauge, ExternalLink, Copy, CheckCircle, TrendingUp, Car, Calendar, Hash, Eye, Clock, ArrowRight, X } from 'lucide-react';
import VehicleService from '../services/vehicle';
import TelemetryService from '../services/telemetry';
import { useNavigate } from 'react-router-dom';
import MileageChart from './Mileage/MileageChart';
import HistoryTable from './Mileage/HistoryTable';
import TrustScoreMini from './Mileage/TrustScoreMini';

interface MileageHistoryCardProps {
  vehicleId: string;
}

interface MileageRecordItem {
  id?: string;
  mileage: number;
  recordedAt: string;
  source?: string;
  verified?: boolean;
  deviceId?: string;
  blockchainHash?: string;
  // FIXED: Add validation fields
  previousMileage?: number;
  newMileage?: number;
  delta?: number;
  flagged?: boolean;
  validationStatus?: 'VALID' | 'INVALID' | 'ROLLBACK_DETECTED' | 'SUSPICIOUS' | 'PENDING';
}

const sourceLabel = (s?: string) => {
  if (!s) return 'unknown';
  if (s === 'service' || s === 'service_record') return 'service';
  if (s === 'automated' || s === 'obd_device') return 'OBD device';
  return s;
};

const MileageHistoryCard: React.FC<MileageHistoryCardProps> = ({ vehicleId }) => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<MileageRecordItem[]>([]);
  const [summary, setSummary] = useState<{
    totalMileage: number;
    registeredMileage: number;
    serviceVerifiedMileage: number | null;
    lastOBDUpdate: { mileage: number; deviceId: string; recordedAt: string } | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [allRecords, setAllRecords] = useState<MileageRecordItem[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to fetch from telemetry API first (with fraud detection data)
      try {
        const telemetryRes = await TelemetryService.getTelemetryHistory(vehicleId, 10, 0);
        if (telemetryRes?.data?.data && telemetryRes.data.data.length > 0) {
          console.log('✅ Using telemetry API data with fraud detection');
          const mapped: MileageRecordItem[] = telemetryRes.data.data.map((r: any) => ({
            id: r.id,
            mileage: r.mileage,
            recordedAt: r.recordedAt,
            source: r.source,
            verified: r.verified,
            deviceId: r.deviceId,
            blockchainHash: r.blockchainHash,
            // FIXED: Add validation fields from telemetry API
            previousMileage: r.previousMileage,
            newMileage: r.newMileage,
            delta: r.delta,
            flagged: r.flagged,
            validationStatus: r.validationStatus
          }));
          setRecords(mapped);
          return;
        }
      } catch (telemetryError) {
        console.log('Telemetry API not available, falling back to vehicle service');
      }
      
      // Fallback to vehicle service
      const res = await VehicleService.getVehicleMileageHistory(vehicleId);
      const data = res?.data?.data || res?.data;
      const history = data?.history || data?.records || [];
      
      // Calculate delta for each record if not provided
      const mapped: MileageRecordItem[] = history.map((r: any, index: number) => {
        let delta = r.delta;
        let previousMileage = r.previousMileage;
        let newMileage = r.newMileage;
        
        // If delta not provided, calculate it
        if (delta === undefined) {
          if (index < history.length - 1) {
            // Compare with next record (chronologically earlier)
            const nextRecord = history[index + 1];
            previousMileage = nextRecord.mileage;
            newMileage = r.mileage;
            delta = r.mileage - nextRecord.mileage;
          } else {
            // First record (most recent), no previous to compare
            delta = 0;
            previousMileage = r.mileage;
            newMileage = r.mileage;
          }
        }
        
        return {
          id: r._id || r.id,
          mileage: r.mileage,
          recordedAt: r.recordedAt || r.createdAt,
          source: r.source,
          verified: r.verified,
          deviceId: r.deviceId,
          blockchainHash: r.blockchainHash,
          // FIXED: Add validation fields with calculated values
          previousMileage,
          newMileage,
          delta,
          flagged: r.flagged || false,
          validationStatus: r.validationStatus || (r.flagged ? 'INVALID' : 'VALID')
        };
      });
      setRecords(mapped);

      // Set summary
      setSummary({
        totalMileage: data?.totalMileage || data?.currentMileage || 0,
        registeredMileage: data?.registeredMileage || 0,
        serviceVerifiedMileage: data?.serviceVerifiedMileage,
        lastOBDUpdate: data?.lastOBDUpdate
      });

      // Provide fallback for current mileage display
      if (data?.totalMileage) {
        window.dispatchEvent(new CustomEvent('batches-latest-mileage', { detail: { latestMileage: data.totalMileage } }));
      }
    } catch (e: any) {
      setError('Failed to load mileage history');
    } finally {
      setLoading(false);
    }
  };

  const loadAllRecords = async () => {
    try {
      setModalLoading(true);
      
      // Try to fetch from telemetry API first (with fraud detection data)
      try {
        const telemetryRes = await TelemetryService.getTelemetryHistory(vehicleId, 100, 0);
        if (telemetryRes?.data?.data && telemetryRes.data.data.length > 0) {
          console.log('✅ Using telemetry API data for full history');
          const mapped: MileageRecordItem[] = telemetryRes.data.data.map((r: any) => ({
            id: r.id,
            mileage: r.mileage,
            recordedAt: r.recordedAt,
            source: r.source,
            verified: r.verified,
            deviceId: r.deviceId,
            blockchainHash: r.blockchainHash,
            // FIXED: Add validation fields from telemetry API
            previousMileage: r.previousMileage,
            newMileage: r.newMileage,
            delta: r.delta,
            flagged: r.flagged,
            validationStatus: r.validationStatus
          }));
          console.log('Mapped records:', mapped); // Debug log
          setAllRecords(mapped);
          return;
        }
      } catch (telemetryError) {
        console.log('Telemetry API not available for full history, falling back to vehicle service');
      }
      
      // Fallback to vehicle service
      const res = await VehicleService.getMileageHistory(vehicleId, 1, 100); // Load up to 100 records
      console.log('API Response:', res); // Debug log
      
      // Handle the response structure correctly
      const data = res?.data || res;
      const history = data?.history || [];
      console.log('History data:', history); // Debug log
      
      // Calculate delta for each record if not provided
      const mapped: MileageRecordItem[] = history.map((r: any, index: number) => {
        let delta = r.delta;
        let previousMileage = r.previousMileage;
        let newMileage = r.newMileage;
        
        // If delta not provided, calculate it
        if (delta === undefined) {
          if (index < history.length - 1) {
            // Compare with next record (chronologically earlier)
            const nextRecord = history[index + 1];
            previousMileage = nextRecord.mileage;
            newMileage = r.mileage;
            delta = r.mileage - nextRecord.mileage;
          } else {
            // First record (most recent), no previous to compare
            delta = 0;
            previousMileage = r.mileage;
            newMileage = r.mileage;
          }
        }
        
        return {
          id: r._id || r.id,
          mileage: r.mileage,
          recordedAt: r.recordedAt || r.createdAt,
          source: r.source,
          verified: r.verified,
          deviceId: r.deviceId,
          blockchainHash: r.blockchainHash,
          // FIXED: Add validation fields with calculated values
          previousMileage,
          newMileage,
          delta,
          flagged: r.flagged || false,
          validationStatus: r.validationStatus || (r.flagged ? 'INVALID' : 'VALID')
        };
      });
      
      console.log('Mapped records:', mapped); // Debug log
      setAllRecords(mapped);
    } catch (e: any) {
      console.error('Failed to load all records:', e);
    } finally {
      setModalLoading(false);
    }
  };

  const handleViewFullHistory = () => {
    setShowModal(true);
    loadAllRecords();
  };

  const handleNavigateToFullHistory = () => {
    navigate(`/vehicles/${vehicleId}/mileage-history`);
  };

  useEffect(() => {
    if (vehicleId) load();
  }, [vehicleId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Mileage History</h2>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : records.length === 0 ? (
        <div className="text-sm text-gray-500 flex items-center"><History className="w-4 h-4 mr-2"/>No mileage records yet</div>
      ) : (
        <div className="space-y-4">
          {/* Summary */}
          {summary && (
            <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-md p-3">
              <div>
                <div className="text-xs text-gray-500">Total Mileage</div>
                <div className="text-lg font-semibold text-gray-900">{summary.totalMileage.toLocaleString()} km</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Registered</div>
                <div className="text-sm font-medium text-gray-700">{summary.registeredMileage.toLocaleString()} km</div>
              </div>
              {summary.serviceVerifiedMileage && (
                <div>
                  <div className="text-xs text-gray-500">Service Verified</div>
                  <div className="text-sm font-medium text-gray-700">{summary.serviceVerifiedMileage.toLocaleString()} km</div>
                </div>
              )}
              {summary.lastOBDUpdate && (
                <div>
                  <div className="text-xs text-gray-500">Last OBD Update</div>
                  <div className="text-sm font-medium text-gray-700">{summary.lastOBDUpdate.mileage.toLocaleString()} km</div>
                  <div className="text-xs text-gray-400">{new Date(summary.lastOBDUpdate.recordedAt).toLocaleDateString()}</div>
                </div>
              )}
            </div>
          )}

          {/* Enhanced Mileage History with Chart and Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-gray-500 uppercase">Recent Updates</div>
              <TrustScoreMini trustScore={85} />
            </div>
            
            {/* Mileage Chart */}
            {console.log('MileageHistoryCard records:', records)}
            <MileageChart 
              history={records.map(record => ({
                _id: record.id || '',
                vehicleId: vehicleId,
                vin: '',
                mileage: record.mileage,
                recordedBy: {
                  _id: '',
                  firstName: '',
                  lastName: '',
                  role: '',
                  fullName: '',
                  isLocked: false,
                  id: ''
                },
                recordedAt: record.recordedAt,
                source: record.source || 'unknown',
                notes: '',
                verified: record.verified || false,
                deviceId: record.deviceId || '',
                createdAt: record.recordedAt,
                updatedAt: record.recordedAt,
                blockchainHash: record.blockchainHash
              }))}
              currentMileage={summary?.totalMileage || 0}
            />
            
            {/* Enhanced History Table */}
            <HistoryTable 
              data={{
                vehicleId: vehicleId,
                vin: '',
                currentMileage: summary?.totalMileage || 0,
                totalMileage: summary?.totalMileage || 0,
                registeredMileage: summary?.registeredMileage || 0,
                serviceVerifiedMileage: summary?.serviceVerifiedMileage || 0,
                lastOBDUpdate: summary?.lastOBDUpdate || { mileage: 0, deviceId: '', recordedAt: '' },
                history: records.map(record => ({
                  _id: record.id || '',
                  vehicleId: vehicleId,
                  vin: '',
                  mileage: record.mileage,
                  recordedBy: {
                    _id: '',
                    firstName: '',
                    lastName: '',
                    role: '',
                    fullName: '',
                    isLocked: false,
                    id: ''
                  },
                  recordedAt: record.recordedAt,
                  source: record.source || 'unknown',
                  notes: '',
                  verified: record.verified || false,
                  deviceId: record.deviceId || '',
                  createdAt: record.recordedAt,
                  updatedAt: record.recordedAt,
                  blockchainHash: record.blockchainHash
                })),
                pagination: {
                  page: 1,
                  limit: 50,
                  total: records.length,
                  pages: 1
                }
              }}
              onRefresh={() => load()}
            />
          </div>

          {/* View Full History Button */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Showing {Math.min(5, records.length)} of {records.length} records
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={handleViewFullHistory}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <History className="w-4 h-4 mr-2" />
                  View in Modal
                </button>
                <button
                  onClick={handleNavigateToFullHistory}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Full History Page
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full History Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowModal(false)}></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Complete Mileage History</h3>
                    <p className="text-sm text-gray-500">Total records: {allRecords.length}</p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {modalLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Loading full history...</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 pb-2 mb-4">
                      <div className="col-span-2">Mileage</div>
                      <div className="col-span-2">Delta</div>
                      <div className="col-span-3">Date & Time</div>
                      <div className="col-span-2">Source</div>
                      <div className="col-span-2">Device</div>
                      <div className="col-span-1">Actions</div>
                    </div>

                    {/* Table Rows */}
                    <div className="max-h-96 overflow-y-auto">
                      {allRecords.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          No mileage history records found.
                        </div>
                      ) : (
                        allRecords.map((r, index) => {
                        const previousRecord = index < allRecords.length - 1 ? allRecords[index + 1] : null;
                        const delta = previousRecord ? r.mileage - previousRecord.mileage : 0;
                        const isPositiveDelta = delta > 0;
                        const isNegativeDelta = delta < 0;
                        const date = new Date(r.recordedAt);
                        const formattedDate = date.toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        });
                        const formattedTime = date.toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit', 
                          second: '2-digit' 
                        });

                        const getSourceIcon = (source?: string) => {
                          switch (source) {
                            case 'automated':
                              return <Car className="w-3 h-3 text-blue-500" />;
                            case 'owner':
                              return <CheckCircle className="w-3 h-3 text-green-500" />;
                            case 'service':
                              return <Eye className="w-3 h-3 text-orange-500" />;
                            default:
                              return <Clock className="w-3 h-3 text-gray-500" />;
                          }
                        };

                        const getSourceColor = (source?: string) => {
                          switch (source) {
                            case 'automated':
                              return 'bg-blue-100 text-blue-800';
                            case 'owner':
                              return 'bg-green-100 text-green-800';
                            case 'service':
                              return 'bg-orange-100 text-orange-800';
                            default:
                              return 'bg-gray-100 text-gray-800';
                          }
                        };

                        const copyToClipboard = async (text: string, hash: string) => {
                          try {
                            await navigator.clipboard.writeText(text);
                            setCopiedHash(hash);
                            setTimeout(() => setCopiedHash(null), 2000);
                          } catch (err) {
                            console.error('Failed to copy:', err);
                          }
                        };

                        const getSolanaExplorerUrl = (txHash: string) => {
                          const cluster = import.meta.env.VITE_SOLANA_CLUSTER || 'devnet';
                          return `https://explorer.solana.com/tx/${txHash}?cluster=${cluster}`;
                        };

                        return (
                          <motion.div
                            key={r.id || r.recordedAt}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.02 }}
                            className="grid grid-cols-12 gap-2 items-center py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                          >
                            {/* Mileage */}
                            <div className="col-span-2">
                              <div className="flex items-center">
                                <div className="text-sm font-semibold text-gray-900">
                                  {r.mileage.toLocaleString()} km
                                </div>
                                {r.verified && (
                                  <CheckCircle className="w-3 h-3 text-green-500 ml-1" />
                                )}
                              </div>
                            </div>

                            {/* Delta */}
                            <div className="col-span-2">
                              {delta !== 0 && (
                                <div className={`flex items-center text-xs ${
                                  isPositiveDelta ? 'text-green-600' : 
                                  isNegativeDelta ? 'text-red-600' : 'text-gray-500'
                                }`}>
                                  <TrendingUp 
                                    className={`w-3 h-3 mr-1 ${
                                      isNegativeDelta ? 'rotate-180' : ''
                                    }`} 
                                  />
                                  <span className="font-medium">
                                    {isPositiveDelta ? '+' : ''}{delta} km
                                  </span>
                                </div>
                              )}
                              {delta === 0 && (
                                <span className="text-gray-400 text-xs">No change</span>
                              )}
                            </div>

                            {/* Date & Time */}
                            <div className="col-span-3">
                              <div className="flex items-center">
                                <Calendar className="w-3 h-3 text-gray-400 mr-1" />
                                <div>
                                  <div className="text-xs font-medium text-gray-900">{formattedDate}</div>
                                  <div className="text-xs text-gray-500">{formattedTime}</div>
                                </div>
                              </div>
                            </div>

                            {/* Source */}
                            <div className="col-span-2">
                              <div className="flex items-center">
                                {getSourceIcon(r.source)}
                                <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${getSourceColor(r.source)}`}>
                                  {sourceLabel(r.source)}
                                </span>
                              </div>
                            </div>

                            {/* Device */}
                            <div className="col-span-2">
                              <div className="flex items-center">
                                <Car className="w-3 h-3 text-gray-400 mr-1" />
                                <span className="text-xs font-mono text-gray-600">
                                  {r.deviceId}
                                </span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="col-span-1">
                  {r.blockchainHash && (
                                <div className="flex items-center space-x-1">
                    <button
                                    onClick={() => copyToClipboard(r.blockchainHash!, r.id || r.recordedAt)}
                                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                                    title="Copy hash"
                                  >
                                    {copiedHash === (r.id || r.recordedAt) ? (
                                      <CheckCircle className="w-3 h-3 text-green-500" />
                                    ) : (
                                      <Copy className="w-3 h-3 text-gray-400" />
                                    )}
                    </button>
                                  <a
                                    href={getSolanaExplorerUrl(r.blockchainHash)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                                    title="View on Explorer"
                                  >
                                    <ExternalLink className="w-3 h-3 text-blue-500" />
                                  </a>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })
                      )}
                    </div>
                  </div>
                  )}
                </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default MileageHistoryCard;


