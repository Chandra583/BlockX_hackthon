import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import VehicleService from '../services/vehicle';
import type { TelemetryBatchData } from '../services/vehicle';

interface DailyBatchesChartProps {
  vehicleId: string;
}

type ViewMode = 'distance' | 'mileage';
type RangeMode = '7d' | '30d' | '365d';

const SVG_WIDTH = 640;
const SVG_HEIGHT = 260;
const PADDING_LEFT = 40;
const PADDING_RIGHT = 16;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 40;

const DailyBatchesChart: React.FC<DailyBatchesChartProps> = ({ vehicleId }) => {
  const [batches, setBatches] = useState<TelemetryBatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>('distance');
  const [range, setRange] = useState<RangeMode>('7d');

  const fetchBatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await VehicleService.getTelemetryBatches(vehicleId, 365);
      if (response.success) {
        // Sort ascending by recordedAt for left-to-right timeline
        const sorted = [...response.data.batches].sort(
          (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
        );
        setBatches(sorted);
      } else {
        setError(response.message || 'Failed to fetch telemetry batches');
      }
    } catch (err) {
      setError('Failed to load telemetry data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vehicleId) fetchBatches();
  }, [vehicleId]);

  const chartData = useMemo(() => {
    // filter by selected time range
    const now = Date.now();
    const windowMs = range === '7d' ? 7*24*3600*1000 : range === '30d' ? 30*24*3600*1000 : 365*24*3600*1000;
    const windowStart = now - windowMs;
    const filtered = batches.filter(b => new Date(b.recordedAt).getTime() >= windowStart);

    const innerWidth = SVG_WIDTH - PADDING_LEFT - PADDING_RIGHT;
    const innerHeight = SVG_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

    const distances = filtered.map(b => b.distanceDelta);
    const mileages = filtered.map(b => b.lastRecordedMileage);

    const maxDistance = Math.max(10, ...distances);
    const minMileage = mileages.length ? Math.min(...mileages) : 0;
    const maxMileage = mileages.length ? Math.max(...mileages) : 0;

    const xStep = filtered.length > 1 ? innerWidth / (filtered.length - 1) : innerWidth;

    const distanceBars = filtered.map((b, i) => {
      const h = innerHeight * (b.distanceDelta / maxDistance);
      return {
        x: PADDING_LEFT + i * (innerWidth / Math.max(1, filtered.length)),
        y: PADDING_TOP + (innerHeight - h),
        width: Math.max(8, innerWidth / Math.max(12, filtered.length) - 6),
        height: h,
        label: new Date(b.recordedAt).toLocaleDateString(),
        value: b.distanceDelta
      };
    });

    const mileagePoints = filtered.map((b, i) => {
      const denom = Math.max(1, (maxMileage - minMileage));
      const yNorm = denom === 0 ? 0 : (b.lastRecordedMileage - minMileage) / denom;
      return {
        x: PADDING_LEFT + i * xStep,
        y: PADDING_TOP + (innerHeight - yNorm * innerHeight),
        label: new Date(b.recordedAt).toLocaleDateString(),
        value: b.lastRecordedMileage
      };
    });

    const mileagePath = mileagePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    // y-axis ticks (5)
    const makeTicks = (min: number, max: number) => {
      const steps = 4;
      const span = Math.max(1, max - min);
      const step = span / steps;
      return Array.from({ length: steps + 1 }).map((_, i) => Math.round(min + i * step));
    };
    const distanceTicks = makeTicks(0, maxDistance);
    const mileageTicks = makeTicks(minMileage, maxMileage);

    return { innerWidth, innerHeight, distanceBars, mileagePoints, mileagePath, maxDistance, minMileage, maxMileage, distanceTicks, mileageTicks, filtered };
  }, [batches, range]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center text-red-500">
        {error}
      </div>
    );
  }

  if (batches.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center text-gray-500">
        No telemetry batches to display.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Driving Insights</h2>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              onClick={() => setView('distance')}
              className={`px-3 py-1.5 text-sm border ${view === 'distance' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-300'}`}
            >
              Daily Distance
            </button>
            <button
              onClick={() => setView('mileage')}
              className={`px-3 py-1.5 text-sm border -ml-px ${view === 'mileage' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-300'}`}
            >
              Mileage
            </button>
          </div>
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button onClick={() => setRange('7d')} className={`px-3 py-1.5 text-sm border ${range==='7d'?'bg-gray-900 text-white border-gray-900':'bg-white text-gray-700 border-gray-300'}`}>This Week</button>
            <button onClick={() => setRange('30d')} className={`px-3 py-1.5 text-sm border -ml-px ${range==='30d'?'bg-gray-900 text-white border-gray-900':'bg-white text-gray-700 border-gray-300'}`}>This Month</button>
            <button onClick={() => setRange('365d')} className={`px-3 py-1.5 text-sm border -ml-px ${range==='365d'?'bg-gray-900 text-white border-gray-900':'bg-white text-gray-700 border-gray-300'}`}>This Year</button>
          </div>
        </div>
      </div>

      <svg width="100%" viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} preserveAspectRatio="xMidYMid meet">
        {/* Axes */}
        <line x1={PADDING_LEFT} y1={SVG_HEIGHT - PADDING_BOTTOM} x2={SVG_WIDTH - PADDING_RIGHT} y2={SVG_HEIGHT - PADDING_BOTTOM} stroke="#e5e7eb" />
        <line x1={PADDING_LEFT} y1={PADDING_TOP} x2={PADDING_LEFT} y2={SVG_HEIGHT - PADDING_BOTTOM} stroke="#e5e7eb" />
        {/* Y-axis ticks and labels (km) */}
        {(view === 'distance' ? chartData.distanceTicks : chartData.mileageTicks).map((t, idx) => {
          const min = view === 'distance' ? 0 : chartData.minMileage;
          const max = view === 'distance' ? chartData.maxDistance : chartData.maxMileage;
          const ratio = (t - min) / Math.max(1, max - min);
          const y = PADDING_TOP + (chartData.innerHeight - ratio * chartData.innerHeight);
          return (
            <g key={`tick-${idx}`}>
              <line x1={PADDING_LEFT} x2={SVG_WIDTH - PADDING_RIGHT} y1={y} y2={y} stroke="#f3f4f6" />
              <text x={PADDING_LEFT - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#6b7280">{t.toLocaleString()} km</text>
            </g>
          );
        })}

        {view === 'distance' && (
          <g>
            {chartData.distanceBars.map((bar, idx) => (
              <g key={idx}>
                <motion.rect
                  initial={{ height: 0, y: PADDING_TOP + chartData.innerHeight }}
                  animate={{ height: bar.height, y: bar.y }}
                  transition={{ duration: 0.4, delay: idx * 0.03 }}
                  x={bar.x}
                  width={bar.width}
                  fill="#2563eb"
                  rx={4}
                />
                {/* X labels */}
                <text x={bar.x + bar.width / 2} y={SVG_HEIGHT - PADDING_BOTTOM + 16} textAnchor="middle" fontSize="10" fill="#6b7280">
                  {new Date(chartData.filtered[idx].recordedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </text>
              </g>
            ))}
          </g>
        )}

        {view === 'mileage' && (
          <g>
            <path d={chartData.mileagePath} fill="none" stroke="#16a34a" strokeWidth={2} />
            {chartData.mileagePoints.map((p, idx) => (
              <g key={idx}>
                <circle cx={p.x} cy={p.y} r={3} fill="#16a34a" />
                <text x={p.x} y={SVG_HEIGHT - PADDING_BOTTOM + 16} textAnchor="middle" fontSize="10" fill="#6b7280">
                  {new Date(chartData.filtered[idx].recordedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </text>
              </g>
            ))}
          </g>
        )}
      </svg>
    </motion.div>
  );
};

export default DailyBatchesChart;



