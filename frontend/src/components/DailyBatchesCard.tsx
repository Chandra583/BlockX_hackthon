import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Calendar, Activity, BarChart2 } from 'lucide-react';
import VehicleService from '../services/vehicle';

interface BatchItem {
  id: string;
  recordedAt: string;
  deviceId: string;
  lastRecordedMileage: number;
  distanceDelta: number;
  dataPoints: number;
}

export const DailyBatchesCard: React.FC<{ vehicleId: string }> = ({ vehicleId }) => {
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await VehicleService.getTelemetryBatches(vehicleId, 30);
      const list = res?.data?.data?.batches || res?.data?.batches || [];
      setBatches(list);
      // Dispatch total distance for other components (e.g., VehicleDetails current mileage note)
      const totalKm = list.reduce((a,b)=>a+(b.distanceDelta||0),0);
      const evt = new CustomEvent('batches-total-distance', { detail: { totalKm } });
      window.dispatchEvent(evt);
    } catch (e: any) {
      setError('Failed to load telemetry batches');
    } finally {
      setLoading(false);
    }
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
        <h2 className="text-lg font-semibold text-gray-900">Daily Telemetry Batches</h2>
        <button
          onClick={load}
          className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
        >
          <RefreshCw className="w-4 h-4 mr-1" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : batches.length === 0 ? (
        <div className="text-sm text-gray-500 flex items-center"><Activity className="w-4 h-4 mr-2"/>No batches yet</div>
      ) : (
        <div className="space-y-4">
          {/* Summary */}
          <div className="flex items-center justify-between bg-gray-50 rounded-md px-3 py-2">
            <div className="flex items-center text-sm text-gray-700"><BarChart2 className="w-4 h-4 mr-2"/>Last {Math.min(batches.length, 10)} days</div>
            <div className="text-right text-sm text-gray-700">
              Total Distance: {batches.reduce((a,b)=>a+(b.distanceDelta||0),0).toLocaleString()} km
            </div>
          </div>

          {batches.map((b) => (
            <div key={b.id} className="flex items-center justify-between border rounded-md px-3 py-2 hover:bg-gray-50">
              <div className="flex items-center space-x-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-sm font-medium">{new Date(b.recordedAt).toLocaleDateString()} <span className="text-gray-400 text-xs">{new Date(b.recordedAt).toLocaleTimeString()}</span></div>
                  <div className="text-xs text-gray-500">Device: {b.deviceId}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">{b.distanceDelta.toLocaleString()} km</div>
                <div className="text-xs text-gray-500">Mileage: {b.lastRecordedMileage.toLocaleString()} km • {b.dataPoints} pts</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default DailyBatchesCard;


