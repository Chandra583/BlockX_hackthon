# Fraud Detection UI Integration Guide

## 📊 Components Created

### 1. **FraudAlertCard** (`src/components/vehicle/FraudAlertCard.tsx`)
Displays recent fraud alerts with severity levels and details.

### 2. **OBDDataValidationCard** (`src/components/vehicle/OBDDataValidationCard.tsx`)
Shows real-time OBD data validation status with telemetry readings.

### 3. **EnhancedMileageHistoryTable** (`src/components/vehicle/EnhancedMileageHistoryTable.tsx`)
Enhanced mileage history table with validation status column.

### 4. **TelemetryService** (`src/services/telemetry.ts`)
Service layer for fetching validation and fraud data.

## 🔧 Integration Steps

### Step 1: Add to VehicleDetails.tsx

```typescript
// Add imports at the top
import { FraudAlertCard } from '../../components/vehicle/FraudAlertCard';
import { OBDDataValidationCard } from '../../components/vehicle/OBDDataValidationCard';
import { EnhancedMileageHistoryTable } from '../../components/vehicle/EnhancedMileageHistoryTable';
import TelemetryService from '../../services/telemetry';

// Add state variables
const [fraudAlerts, setFraudAlerts] = useState([]);
const [obdValidationData, setObdValidationData] = useState(null);
const [telemetryRecords, setTelemetryRecords] = useState([]);
const [loading, setLoading] = useState(false);

// Add fetch function
const fetchFraudDetectionData = async () => {
  try {
    setLoading(true);
    const [alerts, obdData, telemetry] = await Promise.all([
      TelemetryService.getFraudAlerts(vehicleId),
      TelemetryService.getLatestOBDData(vehicleId),
      TelemetryService.getTelemetryWithValidation(vehicleId, 1, 10)
    ]);

    setFraudAlerts(alerts.data || []);
    setObdValidationData(obdData.data || null);
    setTelemetryRecords(telemetry.data?.records || []);
  } catch (error) {
    console.error('Failed to fetch fraud detection data:', error);
  } finally {
    setLoading(false);
  }
};

// Call in useEffect
useEffect(() => {
  if (vehicleId) {
    fetchFraudDetectionData();
  }
}, [vehicleId]);
```

### Step 2: Add Components to JSX

Add this section after the vehicle info cards:

```typescript
{/* Fraud Detection Section */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
  {/* Fraud Alerts */}
  <FraudAlertCard alerts={fraudAlerts} loading={loading} />
  
  {/* OBD Data Validation */}
  <OBDDataValidationCard validationData={obdValidationData} loading={loading} />
</div>

{/* Enhanced Mileage History with Validation */}
<div className="mt-6">
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">
      Mileage History with Validation Status
    </h3>
    <EnhancedMileageHistoryTable 
      records={telemetryRecords}
      onCopyHash={(hash) => {
        navigator.clipboard.writeText(hash);
        toast.success('Hash copied to clipboard!');
      }}
    />
  </div>
</div>
```

## 🎨 Visual Indicators

### Validation Status Badges:
- ✅ **Valid** (Green) - Data passed all validation checks
- ❌ **Invalid** (Red) - Data failed validation checks
- ⚠️ **Suspicious** (Yellow) - Data flagged for review
- 🚫 **Impossible Distance** (Red) - Physically impossible distance change
- ⏳ **Pending** (Gray) - Validation not yet complete

### Fraud Alert Severity:
- 🔴 **High** (Red) - Critical fraud detected
- 🟡 **Medium** (Yellow) - Suspicious activity
- 🔵 **Low** (Blue) - Minor anomaly

## 📡 Real-time Updates (Optional)

Add socket listener for real-time fraud alerts:

```typescript
useEffect(() => {
  if (!socket || !vehicleId) return;

  const handleFraudAlert = (data: { alert: any }) => {
    setFraudAlerts(prev => [data.alert, ...prev]);
    toast.error(`New fraud alert: ${data.alert.message}`);
  };

  socket.on(`fraud_alert_${vehicleId}`, handleFraudAlert);

  return () => {
    socket.off(`fraud_alert_${vehicleId}`, handleFraudAlert);
  };
}, [socket, vehicleId]);
```

## 🔌 Backend API Endpoints Required

The components expect these endpoints to exist:

1. `GET /api/vehicles/:vehicleId/fraud-alerts`
2. `GET /api/vehicles/:vehicleId/telemetry/latest`
3. `GET /api/vehicles/:vehicleId/telemetry?includeValidation=true`
4. `GET /api/vehicles/:vehicleId/telemetry/validation`

## 📝 Sample Data Format

### Fraud Alert:
```json
{
  "id": "alert_123",
  "type": "IMPOSSIBLE_DISTANCE",
  "severity": "high",
  "message": "Distance increase of 57 km in 0.1 hours detected",
  "detectedAt": "2025-10-24T20:15:34Z",
  "status": "active",
  "details": {
    "expectedValue": 25,
    "actualValue": 82,
    "reason": "Physically impossible speed"
  }
}
```

### OBD Validation Data:
```json
{
  "deviceID": "OBD3211",
  "status": "obd_connected",
  "validationStatus": "INVALID",
  "lastReading": {
    "mileage": 82,
    "speed": 70,
    "rpm": 2500,
    "engineTemp": 88,
    "fuelLevel": 55,
    "dataQuality": 99,
    "recordedAt": "2025-10-24T20:15:34Z"
  },
  "tamperingDetected": true,
  "fraudScore": 85
}
```

## 🎯 Features

- ✅ Real-time fraud detection display
- ✅ Validation status for each mileage record
- ✅ Visual indicators (badges, icons, colors)
- ✅ Detailed fraud alert information
- ✅ Latest OBD data with validation
- ✅ Blockchain verification links
- ✅ Copy hash functionality
- ✅ Responsive design
- ✅ Smooth animations
- ✅ Loading states

## 🚀 Next Steps

1. Implement the backend API endpoints
2. Test with real fraud detection data
3. Add socket.io for real-time updates
4. Add admin actions for fraud alerts (resolve, investigate)
5. Add export functionality for fraud reports
6. Add fraud statistics dashboard

