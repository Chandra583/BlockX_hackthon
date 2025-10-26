# 🚗 Vehicle API Usage Examples

## **API Endpoints Reference**

### **1. Vehicle Management**

#### **Get User Vehicles**
```bash
curl -X GET "http://localhost:3000/api/vehicles" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "vehicles": [
      {
        "id": "vehicle-1",
        "vin": "1HGCM82633A123456",
        "vehicleNumber": "KA09JS1221",
        "make": "Honda",
        "model": "Civic",
        "year": 2023,
        "currentMileage": 15000,
        "trustScore": 85,
        "verificationStatus": "verified",
        "createdAt": "2023-01-01T00:00:00Z"
      }
    ]
  }
}
```

#### **Get Vehicle by ID**
```bash
curl -X GET "http://localhost:3000/api/vehicles/vehicle-1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### **Delete Vehicle**
```bash
curl -X DELETE "http://localhost:3000/api/vehicles/vehicle-1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **2. Telemetry & OBD Data**

#### **Get Latest OBD Data**
```bash
curl -X GET "http://localhost:3000/api/telemetry/latest-obd/vehicle-1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "vehicleId": "vehicle-1",
    "deviceId": "OBD30233",
    "timestamp": "2023-12-01T10:00:00Z",
    "mileage": 15000,
    "speed": 65,
    "engineRPM": 2500,
    "fuelLevel": 75,
    "status": "connected"
  }
}
```

#### **Get Fraud Alerts**
```bash
curl -X GET "http://localhost:3000/api/telemetry/fraud-alerts/vehicle-1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": "alert-1",
        "type": "mileage_rollback",
        "severity": "high",
        "description": "Mileage decreased by 5000 km",
        "detectedAt": "2023-12-01T09:00:00Z",
        "status": "active"
      }
    ]
  }
}
```

#### **Get Telemetry History**
```bash
curl -X GET "http://localhost:3000/api/telemetry/history/vehicle-1?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **3. Trust Score Management**

#### **Get Vehicle Trust Score**
```bash
curl -X GET "http://localhost:3000/api/trust/vehicle-1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "vehicleId": "vehicle-1",
    "currentScore": 85,
    "averageScore": 82,
    "totalEvents": 15,
    "positiveEvents": 12,
    "negativeEvents": 3,
    "lastUpdated": "2023-12-01T10:00:00Z"
  }
}
```

#### **Get Trust Score History**
```bash
curl -X GET "http://localhost:3000/api/trust/vehicle-1/history" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "id": "event-1",
        "type": "mileage_update",
        "impact": 5,
        "description": "Regular mileage update",
        "timestamp": "2023-12-01T10:00:00Z",
        "metadata": {
          "previousMileage": 14500,
          "newMileage": 15000,
          "delta": 500
        }
      }
    ]
  }
}
```

### **4. Installation Management**

#### **Get Installation Request Summary**
```bash
curl -X GET "http://localhost:3000/api/installation-requests/summary" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "vehicle-1": {
      "id": "request-1",
      "status": "completed",
      "deviceId": "OBD30233",
      "assignedAt": "2023-11-15T10:00:00Z",
      "completedAt": "2023-11-20T14:30:00Z"
    }
  }
}
```

### **5. Socket Events**

#### **Connect to Socket**
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});

// Join user room
socket.emit('join_user', 'user-id');

// Join vehicle room
socket.emit('join_vehicle', 'vehicle-id');
```

#### **Listen for Events**
```javascript
// Vehicle updates
socket.on('vehicle_updated', (updatedVehicle) => {
  console.log('Vehicle updated:', updatedVehicle);
  // Update UI with new vehicle data
});

// Telemetry updates
socket.on('telemetry_updated', (data) => {
  console.log('Telemetry updated:', data);
  // Update last OBD timestamp
});

// Fraud alerts
socket.on('fraud_alert', (alert) => {
  console.log('Fraud detected:', alert);
  // Show fraud notification
});

// Trust score changes
socket.on('trust_score_updated', (data) => {
  console.log('Trust score updated:', data);
  // Update trust score display
});
```

## **Frontend Service Usage**

### **1. VehicleService Usage**
```typescript
import { VehicleService } from '../services/vehicle';

// Get user vehicles
const vehicles = await VehicleService.getUserVehicles({
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc'
});

// Get specific vehicle
const vehicle = await VehicleService.getVehicleById('vehicle-1');

// Delete vehicle
await VehicleService.deleteVehicle('vehicle-1');
```

### **2. TelemetryService Usage**
```typescript
import { TelemetryService } from '../services/telemetry';

// Get latest OBD data
const obdData = await TelemetryService.getLatestOBDData('vehicle-1');

// Get fraud alerts
const fraudAlerts = await TelemetryService.getFraudAlerts('vehicle-1');

// Get telemetry with validation
const telemetry = await TelemetryService.getTelemetryWithValidation('vehicle-1', 1, 10);
```

### **3. TrustService Usage**
```typescript
import { TrustService } from '../services/trust';

// Get vehicle trust score
const trustScore = await TrustService.getVehicleTrustScore('vehicle-1');

// Get trust score history
const history = await TrustService.getTrustScoreHistory('vehicle-1');
```

## **Error Handling**

### **1. API Error Responses**
```json
{
  "success": false,
  "error": {
    "code": "VEHICLE_NOT_FOUND",
    "message": "Vehicle with ID vehicle-1 not found",
    "statusCode": 404
  }
}
```

### **2. Frontend Error Handling**
```typescript
try {
  const vehicles = await VehicleService.getUserVehicles();
  setVehicles(vehicles.data.vehicles);
} catch (error: any) {
  if (error.response?.status === 404) {
    setVehicles([]);
  } else {
    toast.error('Failed to load vehicles');
    console.error('API Error:', error);
  }
}
```

## **Performance Optimization**

### **1. Debounced Search**
```typescript
import { useDebounce } from '../hooks/useDebounce';

const [searchTerm, setSearchTerm] = useState('');
const debouncedSearchTerm = useDebounce(searchTerm, 300);

useEffect(() => {
  if (debouncedSearchTerm) {
    // Perform search
    searchVehicles(debouncedSearchTerm);
  }
}, [debouncedSearchTerm]);
```

### **2. Memoized Filtering**
```typescript
const filteredVehicles = useMemo(() => {
  return vehicles.filter(vehicle => {
    // Apply filters
    return matchesSearch(vehicle) && matchesFilters(vehicle);
  });
}, [vehicles, searchTerm, filters]);
```

### **3. Lazy Loading**
```typescript
const VehicleDetails = lazy(() => import('../pages/Vehicles/VehicleDetails'));

// In route
<Route 
  path="/vehicles/:id" 
  element={
    <Suspense fallback={<LoadingSpinner />}>
      <VehicleDetails />
    </Suspense>
  } 
/>
```

## **Testing API Integration**

### **1. Mock API Responses**
```typescript
// __mocks__/services/vehicle.ts
export const VehicleService = {
  getUserVehicles: jest.fn().mockResolvedValue({
    data: { vehicles: mockVehicles }
  }),
  getVehicleById: jest.fn().mockResolvedValue({
    data: mockVehicle
  })
};
```

### **2. Test API Calls**
```typescript
import { VehicleService } from '../services/vehicle';

describe('VehicleList', () => {
  it('fetches vehicles on mount', async () => {
    render(<VehicleList />);
    
    await waitFor(() => {
      expect(VehicleService.getUserVehicles).toHaveBeenCalled();
    });
  });
});
```

## **Real-time Updates**

### **1. Socket Connection**
```typescript
import useSocket from '../hooks/useSocket';

const { socket } = useSocket();

useEffect(() => {
  if (socket) {
    socket.on('vehicle_updated', (updatedVehicle) => {
      setVehicles(prev => 
        prev.map(v => v.id === updatedVehicle.id ? { ...v, ...updatedVehicle } : v)
      );
    });
    
    return () => {
      socket.off('vehicle_updated');
    };
  }
}, [socket]);
```

### **2. Optimistic Updates**
```typescript
const handleDeleteVehicle = async (vehicleId: string) => {
  // Optimistic update
  setVehicles(prev => prev.filter(v => v.id !== vehicleId));
  
  try {
    await VehicleService.deleteVehicle(vehicleId);
    toast.success('Vehicle deleted successfully');
  } catch (error) {
    // Rollback on error
    setVehicles(prev => [...prev, deletedVehicle]);
    toast.error('Failed to delete vehicle');
  }
};
```

## **Security Considerations**

### **1. Authentication**
```typescript
// Add to all API calls
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
```

### **2. Input Validation**
```typescript
const validateVehicleData = (data: any) => {
  if (!data.vin || data.vin.length !== 17) {
    throw new Error('Invalid VIN');
  }
  if (!data.make || !data.model) {
    throw new Error('Make and model are required');
  }
  return data;
};
```

### **3. Rate Limiting**
```typescript
// Implement client-side rate limiting
const rateLimiter = {
  requests: 0,
  lastReset: Date.now(),
  
  canMakeRequest() {
    const now = Date.now();
    if (now - this.lastReset > 60000) { // 1 minute
      this.requests = 0;
      this.lastReset = now;
    }
    return this.requests < 100; // 100 requests per minute
  }
};
```

---

**Note**: All API endpoints require authentication via JWT token in the Authorization header.  
**Base URL**: `http://localhost:3000/api` (adjust for your environment)  
**Rate Limits**: 100 requests per 15 minutes per user
