import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Activity } from 'lucide-react';

interface MileageRecord {
  _id: string;
  vehicleId: string;
  vin: string;
  mileage: number;
  recordedBy: {
    _id: string;
    firstName: string;
    lastName: string;
    role: string;
    fullName: string;
    isLocked: boolean;
    id: string;
  };
  recordedAt: string;
  source: string;
  notes: string;
  verified: boolean;
  deviceId: string;
  createdAt: string;
  updatedAt: string;
  blockchainHash?: string;
}

interface MileageChartProps {
  history: MileageRecord[];
  currentMileage: number;
  className?: string;
}

interface ChartDataPoint {
  date: string;
  mileage: number;
  relativeTime: string;
  deviceId: string;
  source: string;
  verified: boolean;
  blockchainHash?: string;
}

const MileageChart: React.FC<MileageChartProps> = ({ history, currentMileage, className = '' }) => {
  // Debug logging
  console.log('MileageChart props:', { history, currentMileage, historyLength: history?.length });
  
  // Sort history by date and prepare chart data
  const chartData = useMemo(() => {
    if (!history || history.length === 0) {
      // Create mock data for testing
      const mockData = [
        { mileage: 50000, recordedAt: '2024-01-01T00:00:00Z', source: 'automated', verified: true, deviceId: 'OBD001' },
        { mileage: 55000, recordedAt: '2024-01-15T00:00:00Z', source: 'automated', verified: true, deviceId: 'OBD001' },
        { mileage: 60000, recordedAt: '2024-02-01T00:00:00Z', source: 'automated', verified: true, deviceId: 'OBD001' },
        { mileage: 65200, recordedAt: '2024-02-15T00:00:00Z', source: 'automated', verified: true, deviceId: 'OBD001' },
      ];
      console.log('Using mock data for chart');
      return mockData.map((record, index) => {
        const date = new Date(record.recordedAt);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        return {
          date: date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          mileage: record.mileage,
          relativeTime: `${diffDays}d ago`,
          deviceId: record.deviceId,
          source: record.source,
          verified: record.verified,
          blockchainHash: undefined,
          index
        };
      });
    }

    const sortedHistory = [...history].sort((a, b) => 
      new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
    );

    return sortedHistory.map((record, index) => {
      const date = new Date(record.recordedAt);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diffMs / (1000 * 60));

      let relativeTime = '';
      if (diffDays > 0) {
        relativeTime = `${diffDays}d ago`;
      } else if (diffHours > 0) {
        relativeTime = `${diffHours}h ago`;
      } else if (diffMinutes > 0) {
        relativeTime = `${diffMinutes}m ago`;
      } else {
        relativeTime = 'Just now';
      }

      return {
        date: date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        mileage: record.mileage,
        relativeTime,
        deviceId: record.deviceId,
        source: record.source,
        verified: record.verified,
        blockchainHash: record.blockchainHash,
        index
      };
    });
    
    console.log('Processed chartData:', chartData);
    return chartData;
  }, [history]);

  // Calculate chart bounds
  const minMileage = useMemo(() => {
    if (chartData.length === 0) return 0;
    const min = Math.min(...chartData.map(d => d.mileage));
    return Math.max(0, min * 0.9); // Ensure we don't go below 0
  }, [chartData]);

  const maxMileage = useMemo(() => {
    if (chartData.length === 0) return currentMileage;
    const max = Math.max(...chartData.map(d => d.mileage), currentMileage);
    return max * 1.1; // Add 10% padding at the top
  }, [chartData, currentMileage]);

  // Debug chart bounds
  console.log('Chart bounds:', { minMileage, maxMileage, chartData: chartData.map(d => d.mileage) });

  if (chartData.length === 0) {
    return (
      <div className={`bg-white rounded-xl shadow-lg border border-gray-200 p-8 ${className}`}>
        <div className="text-center">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Mileage Data</h3>
          <p className="text-gray-600">No mileage records available for charting.</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className={`bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <TrendingUp className="w-6 h-6 text-white mr-3" />
            <div>
              <h3 className="text-xl font-bold text-white">travel history Trend</h3>
              <p className="text-blue-100 text-sm">Historical travel km progression</p>
            </div>
          </div>
          <div className="text-right text-white">
            <div className="text-2xl font-bold">{currentMileage.toLocaleString()} km</div>
            <div className="text-blue-100 text-sm">Current</div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6">
        <div className="h-80 w-full">
          {/* Simple SVG Chart Fallback */}
          <svg width="100%" height="100%" viewBox="0 0 800 300" className="border border-gray-200 rounded-lg">
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 30" fill="none" stroke="#E5E7EB" strokeWidth="1"/>
              </pattern>
              <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3"/>
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.05"/>
              </linearGradient>
            </defs>
            
            {/* Background grid */}
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Chart area */}
            <g transform="translate(60, 20)">
              {/* Y-axis labels */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const value = minMileage + (maxMileage - minMileage) * (1 - ratio);
                const displayValue = value >= 1000 ? `${Math.round(value / 1000)}k` : `${Math.round(value)}`;
                return (
                  <g key={i}>
                    <text x="-10" y={ratio * 240} textAnchor="end" fontSize="12" fill="#6B7280" alignmentBaseline="middle">
                      {displayValue}
                    </text>
                    <line x1="0" y1={ratio * 240} x2="720" y2={ratio * 240} stroke="#E5E7EB" strokeWidth="1"/>
                  </g>
                );
              })}
              
              {/* X-axis labels */}
              {chartData.map((point, i) => {
                const x = (i / (chartData.length - 1)) * 720;
                const date = new Date(point.recordedAt || point.date);
                const timeLabel = chartData.length > 1 ? 
                  date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) :
                  date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                return (
                  <text key={i} x={x} y="260" textAnchor="middle" fontSize="10" fill="#6B7280">
                    {timeLabel}
                  </text>
                );
              })}
              
              {/* Area path */}
              {chartData.length > 1 && (
                <path
                  d={`M 0 ${240 - ((chartData[0].mileage - minMileage) / (maxMileage - minMileage)) * 240} ${chartData.map((point, i) => {
                    const x = (i / (chartData.length - 1)) * 720;
                    const y = 240 - ((point.mileage - minMileage) / (maxMileage - minMileage)) * 240;
                    return `L ${x} ${y}`;
                  }).join(' ')} L 720 240 L 0 240 Z`}
                  fill="url(#areaGradient)"
                />
              )}
              
              {/* Line path */}
              {chartData.length > 1 && (
                <path
                  d={`M 0 ${240 - ((chartData[0].mileage - minMileage) / (maxMileage - minMileage)) * 240} ${chartData.map((point, i) => {
                    const x = (i / (chartData.length - 1)) * 720;
                    const y = 240 - ((point.mileage - minMileage) / (maxMileage - minMileage)) * 240;
                    return `L ${x} ${y}`;
                  }).join(' ')}`}
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="3"
                />
              )}
              
              {/* Data points */}
              {chartData.map((point, i) => {
                const x = (i / (chartData.length - 1)) * 720;
                const y = 240 - ((point.mileage - minMileage) / (maxMileage - minMileage)) * 240;
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="4"
                    fill="#3B82F6"
                    stroke="white"
                    strokeWidth="2"
                  />
                );
              })}
            </g>
            
            {/* Title */}
            <text x="400" y="20" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#374151">
              travel history Progression
            </text>
          </svg>
        </div>

        {/* Chart Stats */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600">Total Records</div>
            <div className="text-lg font-semibold text-gray-900">{chartData.length}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600">Verified</div>
            <div className="text-lg font-semibold text-green-600">
              {chartData.filter(d => d.verified).length}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600">Latest</div>
            <div className="text-lg font-semibold text-blue-600">
              {chartData[chartData.length - 1]?.relativeTime || 'N/A'}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MileageChart;
