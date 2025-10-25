import { apiService } from './api';

export interface ValidationStatus {
  id: string;
  mileage: number;
  validationStatus: 'VALID' | 'INVALID' | 'SUSPICIOUS' | 'IMPOSSIBLE_DISTANCE' | 'PENDING';
  tamperingDetected: boolean;
  fraudScore: number;
  recordedAt: string;
}

export interface FraudAlert {
  id: string;
  type: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
  detectedAt: string;
  status: 'active' | 'resolved' | 'investigating';
  details?: {
    expectedValue?: number;
    actualValue?: number;
    reason?: string;
  };
}

export interface OBDValidationData {
  deviceID: string;
  status: 'obd_connected' | 'device_not_connected' | 'error' | 'discovery_mode';
  validationStatus: 'VALID' | 'INVALID' | 'SUSPICIOUS' | 'IMPOSSIBLE_DISTANCE' | 'PENDING';
  lastReading: {
    mileage: number;
    speed: number;
    rpm: number;
    engineTemp: number;
    fuelLevel: number;
    dataQuality: number;
    recordedAt: string;
  } | null;
  tamperingDetected: boolean;
  fraudScore: number;
}

export class TelemetryService {
  /**
   * Get validation status for vehicle telemetry records
   */
  static async getValidationStatus(vehicleId: string): Promise<{ data: ValidationStatus[] }> {
    return await apiService.get(`/vehicles/${vehicleId}/telemetry/validation`);
  }

  /**
   * Get fraud alerts for a vehicle
   */
  static async getFraudAlerts(vehicleId: string): Promise<{ data: FraudAlert[] }> {
    return await apiService.get(`/telemetry/fraud-alerts/${vehicleId}`);
  }

  /**
   * Get latest OBD validation data
   */
  static async getLatestOBDData(vehicleId: string): Promise<{ data: OBDValidationData }> {
    return await apiService.get(`/telemetry/latest-obd/${vehicleId}`);
  }

  /**
   * Get telemetry records with validation status
   */
  static async getTelemetryWithValidation(vehicleId: string, page = 1, limit = 10): Promise<any> {
    return await apiService.get(`/vehicles/${vehicleId}/telemetry?page=${page}&limit=${limit}&includeValidation=true`);
  }
}

export default TelemetryService;

