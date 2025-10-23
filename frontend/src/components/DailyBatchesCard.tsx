import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Calendar, Activity, BarChart2, ExternalLink, Copy, CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react';
import VehicleService from '../services/vehicle';

interface BatchItem {
  id: string;
  recordedAt: string;
  deviceId: string;
  lastRecordedMileage: number;
  distanceDelta: number;
  dataPoints: number;
  segmentsCount?: number;
  solanaTx?: string;
  arweaveTx?: string;
  status?: 'pending' | 'consolidating' | 'anchored' | 'error';
  lastError?: string;
}

export const DailyBatchesCard: React.FC<{ vehicleId: string }> = ({ vehicleId }) => {
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedTx, setCopiedTx] = useState<string | null>(null);
  const [consolidating, setConsolidating] = useState(false);
  const [consolidationError, setConsolidationError] = useState<string | null>(null);
  const [consolidationSuccess, setConsolidationSuccess] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await VehicleService.getTelemetryBatches(vehicleId, 30);
      
      if (!res.success) {
        throw new Error(res.message || 'Failed to load telemetry batches');
      }
      
      const list = res?.data?.data?.batches || res?.data?.batches || [];
      setBatches(list);
      
      // Dispatch summary for other components (VehicleDetails current mileage fallback)
      const totalKm = list.reduce((a,b)=>a+(b.distanceDelta||0),0);
      window.dispatchEvent(new CustomEvent('batches-total-distance', { detail: { totalKm } }));
      const latestMileage = list.length > 0 ? (list[0].lastRecordedMileage || 0) : 0;
      window.dispatchEvent(new CustomEvent('batches-latest-mileage', { detail: { latestMileage } }));
      const latestDeviceId = list.length > 0 ? (list[0].deviceId || null) : null;
      window.dispatchEvent(new CustomEvent('batches-device-id', { detail: { latestDeviceId } }));
    } catch (e: any) {
      console.error('Error loading telemetry batches:', e);
      setError(e.message || 'Failed to load telemetry batches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vehicleId) load();
  }, [vehicleId]);

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'anchored':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'consolidating':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'anchored':
        return 'Anchored';
      case 'consolidating':
        return 'Processing';
      case 'error':
        return 'Error';
      default:
        return 'Pending';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'anchored':
        return 'bg-green-100 text-green-800';
      case 'consolidating':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const copyToClipboard = async (text: string, txType: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTx(txType);
      setTimeout(() => setCopiedTx(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getSolanaExplorerUrl = (txHash: string) => {
    // Vite exposes env via import.meta.env; support both prefixes for compatibility
    const env: any = (import.meta as any)?.env || {};
    const cluster = env.VITE_SOLANA_CLUSTER || env.REACT_APP_SOLANA_CLUSTER || 'devnet';
    return `https://explorer.solana.com/tx/${txHash}?cluster=${cluster}`;
  };

  const getArweaveUrl = (txHash: string) => {
    const env: any = (import.meta as any)?.env || {};
    const gateway = env.VITE_ARWEAVE_GATEWAY || env.REACT_APP_ARWEAVE_GATEWAY || 'https://arweave.net';
    return `${gateway}/${txHash}`;
  };

  const handleManualConsolidation = async () => {
    try {
      setConsolidating(true);
      setConsolidationError(null);
      setConsolidationSuccess(null);
      // Show lightweight toast for testing to indicate nightly job behavior
      setToast({ message: 'Daily Merkle Job started - will run at 2 AM UTC', type: 'info' });
      setTimeout(() => setToast(null), 4000);
      
      const today = new Date().toISOString().split('T')[0];
      const result = await VehicleService.consolidateBatch(vehicleId, today);
      
      if (result.success) {
        // Reload batches to show updated data
        await load();
        const tx = result?.data?.solanaTx ? `${result.data.solanaTx.slice(0, 8)}...` : 'none (test mode)';
        setConsolidationSuccess(`Batch consolidated successfully! Solana TX: ${tx}`);
        console.log('✅ Manual consolidation completed:', result.data);
        
        // Clear success message after 5 seconds
        setTimeout(() => setConsolidationSuccess(null), 5000);
      } else {
        throw new Error(result.message || result.error || 'Consolidation failed');
      }
    } catch (e: any) {
      console.error('❌ Manual consolidation failed:', e);
      setConsolidationError(e.message || 'Failed to consolidate batch');
      setToast({ message: `Consolidation failed: ${e.message || 'Unknown error'}`, type: 'error' });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setConsolidating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
    >
      {/* Simple toast (testing only) */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2 rounded shadow 
            ${toast.type === 'info' ? 'bg-blue-600 text-white' : ''}
            ${toast.type === 'success' ? 'bg-green-600 text-white' : ''}
            ${toast.type === 'error' ? 'bg-red-600 text-white' : ''}`}
        >
          {toast.message}
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Daily Telemetry Batches</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleManualConsolidation}
            disabled={consolidating}
            className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
          >
            {consolidating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> Processing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-1" /> Consolidate Today
              </>
            )}
          </button>
          <button
            onClick={load}
            className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : error ? (
        <div className="text-sm text-red-600 flex items-center">
          <AlertCircle className="w-4 h-4 mr-2" />
          {error}
        </div>
      ) : consolidationError ? (
        <div className="text-sm text-red-600 flex items-center mb-4">
          <AlertCircle className="w-4 h-4 mr-2" />
          Consolidation Error: {consolidationError}
        </div>
      ) : null}

      {consolidationError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
            <span className="text-sm text-red-700">
              Consolidation failed: {consolidationError}
            </span>
          </div>
        </div>
      )}

      {consolidationSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center">
            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
            <span className="text-sm text-green-700">
              {consolidationSuccess}
            </span>
          </div>
        </div>
      )}

      {batches.length === 0 && !loading && !error ? (
        <div className="text-sm text-gray-500 flex items-center">
          <Activity className="w-4 h-4 mr-2"/>No batches yet
        </div>
      ) : !loading && !error ? (
        <div className="space-y-4">
          {/* Summary */}
          <div className="flex items-center justify-between bg-gray-50 rounded-md px-3 py-2">
            <div className="flex items-center text-sm text-gray-700">
              <BarChart2 className="w-4 h-4 mr-2"/>Last {Math.min(batches.length, 10)} days
            </div>
            <div className="text-right text-sm text-gray-700">
              {(() => {
                const total = batches.reduce((a,b)=>a+(b.distanceDelta||0),0);
                const latestMileage = batches.length > 0 ? (batches[0].lastRecordedMileage || 0) : 0;
                const latestDeviceId = batches.length > 0 ? (batches[0].deviceId || '-') : '-';
                const totalText = total > 0 ? `Total Distance: ${total.toLocaleString()} km` : `Total Distance: 0 km • Current Mileage: ${latestMileage.toLocaleString()} km`;
                return (
                  <div>
                    <div>{totalText}</div>
                    <div className="text-xs text-gray-500">Device: {latestDeviceId}</div>
                  </div>
                );
              })()}
            </div>
          </div>

          {batches.map((b) => (
            <div key={b.id} className="border rounded-md px-3 py-3 hover:bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium">
                      {new Date(b.recordedAt).toLocaleDateString()} 
                      <span className="text-gray-400 text-xs ml-2">
                        {new Date(b.recordedAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">Device: {b.deviceId}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{b.distanceDelta.toLocaleString()} km</div>
                  <div className="text-xs text-gray-500">
                    Mileage: {b.lastRecordedMileage.toLocaleString()} km • {b.segmentsCount || b.dataPoints} segments
                  </div>
                </div>
              </div>
              
              {/* Status Badge */}
              <div className="flex items-center justify-between mb-2">
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(b.status)}`}>
                  {getStatusIcon(b.status)}
                  <span className="ml-1">{getStatusText(b.status)}</span>
                </div>
                {b.status === 'error' && b.lastError && (
                  <div className="text-xs text-red-600" title={b.lastError}>
                    <AlertCircle className="w-3 h-3 inline mr-1" />
                    Error
                  </div>
                )}
              </div>

              {/* Transaction Links */}
              {(b.solanaTx || b.arweaveTx) && (
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  {b.solanaTx && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-gray-600">Solana:</span>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                          {b.solanaTx.slice(0, 8)}...{b.solanaTx.slice(-8)}
                        </code>
                        <button
                          onClick={() => copyToClipboard(b.solanaTx!, 'solana')}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {copiedTx === 'solana' ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                      <a
                        href={getSolanaExplorerUrl(b.solanaTx)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                  
                  {b.arweaveTx && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-gray-600">Arweave:</span>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                          {b.arweaveTx.slice(0, 8)}...{b.arweaveTx.slice(-8)}
                        </code>
                        <button
                          onClick={() => copyToClipboard(b.arweaveTx!, 'arweave')}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {copiedTx === 'arweave' ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                      <a
                        href={getArweaveUrl(b.arweaveTx)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : null}
    </motion.div>
  );
};

export default DailyBatchesCard;