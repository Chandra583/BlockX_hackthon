import React, { useState } from 'react';
import { FixedMileageHistoryTable } from './FixedMileageHistoryTable';

interface MileageRecord {
  id: string;
  mileage: number;
  recordedAt: string;
  source?: string;
  verified?: boolean;
  deviceId?: string;
  blockchainHash?: string;
  previousMileage?: number;
  newMileage?: number;
  delta?: number;
  flagged?: boolean;
  validationStatus?: 'VALID' | 'INVALID' | 'ROLLBACK_DETECTED' | 'SUSPICIOUS' | 'PENDING';
}

export const MileageHistoryTest: React.FC = () => {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Test data that demonstrates the fixed mileage history
  const testRecords: MileageRecord[] = [
    {
      id: '1',
      mileage: 82,
      recordedAt: '2025-10-24T20:20:00Z',
      source: 'obd_device',
      verified: false,
      deviceId: 'OBD3211',
      blockchainHash: null, // Not anchored due to rollback
      previousMileage: 67000,
      newMileage: 82,
      delta: -65918,
      flagged: true,
      validationStatus: 'ROLLBACK_DETECTED'
    },
    {
      id: '2',
      mileage: 78,
      recordedAt: '2025-10-24T20:18:52Z',
      source: 'obd_device',
      verified: false,
      deviceId: 'OBD3211',
      blockchainHash: 'abc123...',
      previousMileage: 74,
      newMileage: 78,
      delta: 4,
      flagged: false,
      validationStatus: 'VALID'
    },
    {
      id: '3',
      mileage: 82,
      recordedAt: '2025-10-24T20:15:30Z',
      source: 'obd_device',
      verified: false,
      deviceId: 'OBD3211',
      blockchainHash: 'def456...',
      previousMileage: 25,
      newMileage: 82,
      delta: 57,
      flagged: false,
      validationStatus: 'SUSPICIOUS'
    },
    {
      id: '4',
      mileage: 25,
      recordedAt: '2025-10-24T20:12:11Z',
      source: 'obd_device',
      verified: false,
      deviceId: 'OBD3211',
      blockchainHash: 'ghi789...',
      previousMileage: 18,
      newMileage: 25,
      delta: 7,
      flagged: false,
      validationStatus: 'VALID'
    },
    {
      id: '5',
      mileage: 18,
      recordedAt: '2025-10-24T20:08:06Z',
      source: 'service',
      verified: true,
      deviceId: 'OBD3211',
      blockchainHash: 'jkl012...',
      previousMileage: 12,
      newMileage: 18,
      delta: 6,
      flagged: false,
      validationStatus: 'VALID'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Fixed Mileage History - Test Component
          </h1>
          <p className="text-gray-600">
            This component demonstrates the fixed mileage history table with proper validation status display.
          </p>
        </div>

        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Test Scenarios:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-100 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                </div>
                <span><strong>Record 1:</strong> Rollback detected (67000 → 82 km)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                <span><strong>Record 2:</strong> Valid increase (+4 km)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-100 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                </div>
                <span><strong>Record 3:</strong> Suspicious large increase (+57 km)</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                <span><strong>Record 4:</strong> Valid increase (+7 km)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                <span><strong>Record 5:</strong> Service verified (+6 km)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-500 uppercase mb-3">Recent Updates</h3>
          <FixedMileageHistoryTable 
            records={testRecords}
            onCopyHash={(hash) => {
              navigator.clipboard.writeText(hash);
              setCopiedHash(hash);
              setTimeout(() => setCopiedHash(null), 2000);
            }}
            copiedHash={copiedHash}
          />
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Key Features Demonstrated:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✅ <strong>Validation Status Badges:</strong> Red for rollback, yellow for suspicious, green for valid</li>
            <li>✅ <strong>Correct Delta Calculation:</strong> Uses DB delta field, not calculated from previous records</li>
            <li>✅ <strong>Flagged Records:</strong> Show "Not anchored" status for fraud records</li>
            <li>✅ <strong>Blockchain Links:</strong> Only valid records have explorer links</li>
            <li>✅ <strong>Visual Indicators:</strong> Red background for flagged records, proper icons</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MileageHistoryTest;

