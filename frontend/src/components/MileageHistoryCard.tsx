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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await VehicleService.getVehicleMileageHistory(vehicleId);
      const history = res?.data?.data?.history || res?.data?.data?.records || res?.data?.records || [];
      const mapped: MileageRecordItem[] = history.map((r: any) => ({
        id: r._id || r.id,
        mileage: r.mileage,
        recordedAt: r.recordedAt || r.createdAt,
        source: r.source,
        verified: r.verified,
        deviceId: r.deviceId
      }));
      setRecords(mapped);

      // If there are no telemetry batches yet, provide a fallback for current mileage display
      if (mapped.length > 0) {
        const latest = mapped[0];
        window.dispatchEvent(new CustomEvent('batches-latest-mileage', { detail: { latestMileage: latest.mileage } }));
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
        <div className="space-y-3">
          {records.slice(0, 5).map((r) => (
            <div key={r.id || r.recordedAt} className="flex items-center justify-between border rounded-md px-3 py-2">
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
      )}
    </motion.div>
  );
};

export default MileageHistoryCard;


