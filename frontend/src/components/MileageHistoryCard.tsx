import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { History, Gauge } from 'lucide-react';
import VehicleService from '../services/vehicle';

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
}

const sourceLabel = (s?: string) => {
  if (!s) return 'unknown';
  if (s === 'service' || s === 'service_record') return 'service';
  if (s === 'automated' || s === 'obd_device') return 'OBD device';
  return s;
};

const MileageHistoryCard: React.FC<MileageHistoryCardProps> = ({ vehicleId }) => {
  const [records, setRecords] = useState<MileageRecordItem[]>([]);
  const [summary, setSummary] = useState<{
    totalMileage: number;
    registeredMileage: number;
    serviceVerifiedMileage: number | null;
    lastOBDUpdate: { mileage: number; deviceId: string; recordedAt: string } | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await VehicleService.getVehicleMileageHistory(vehicleId);
      const data = res?.data?.data || res?.data;
      const history = data?.history || data?.records || [];
      const mapped: MileageRecordItem[] = history.map((r: any) => ({
        id: r._id || r.id,
        mileage: r.mileage,
        recordedAt: r.recordedAt || r.createdAt,
        source: r.source,
        verified: r.verified,
        deviceId: r.deviceId
      }));
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

          {/* History List */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-500 uppercase">Recent Updates</div>
            {records.slice(0, 5).map((r) => (
              <div key={r.id || r.recordedAt} className="flex items-center justify-between border rounded-md px-3 py-2 hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <Gauge className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium">{r.mileage.toLocaleString()} km</div>
                    <div className="text-xs text-gray-500">{new Date(r.recordedAt).toLocaleString()} • {sourceLabel(r.source)}</div>
                  </div>
                </div>
                {r.deviceId && <div className="text-xs text-gray-500">Device: {r.deviceId}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default MileageHistoryCard;


