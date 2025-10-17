import { apiService } from './api';

// Types for Device API responses
export interface Device {
  _id: string;
  deviceID: string;
  deviceType: string;
  status: string;
  description: string;
  lastSeen: string;
  lastDataReceived: string;
  isOnline: boolean;
  health: {
    bootCount: number;
    batteryVoltage: number;
    lastError?: string;
  };
  configuration: {
    selectedVehicle: number;
    sleepDurationMinutes: number;
    maxRetryAttempts: number;
    enableDataBuffering: boolean;
    enableSSL: boolean;
  };
  registeredAt: string;
  isActive: boolean;
}

export interface DeviceListResponse {
  success: boolean;
  message: string;
  data: {
    devices: Device[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    summary: {
      total: number;
      active: number;
      error: number;
      online: number;
    };
  };
}

export interface DeviceStatusResponse {
  success: boolean;
  message: string;
  data: {
    device: Device;
    latestData: {
      vin: string;
      mileage: number;
      dataQuality: number;
      validationStatus: string;
      tamperingDetected: boolean;
      receivedAt: string;
    } | null;
    statistics: {
      totalReadings: number;
      fraudAlerts: number;
      successRate: string;
    };
    recentTests: Array<{
      testName: string;
      status: string;
      result: string;
      createdAt: string;
      duration: number;
    }>;
  };
}

/**
 * Device Service Class
 * Handles all device-related API calls
 */
export class DeviceService {
  /**
   * List all devices with filters
   */
  static async listDevices(params?: {
    page?: number;
    limit?: number;
    status?: string;
    deviceType?: string;
  }): Promise<DeviceListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const url = `/device/list${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return await apiService.get<DeviceListResponse>(url);
  }

  /**
   * Get device status by ID
   */
  static async getDeviceStatus(deviceId: string): Promise<DeviceStatusResponse> {
    return await apiService.get<DeviceStatusResponse>(`/device/status/${deviceId}`);
  }

  /**
   * Register a new device
   */
  static async registerDevice(data: {
    deviceID: string;
    deviceType?: string;
    description?: string;
    configuration?: any;
  }): Promise<any> {
    return await apiService.post('/device/register', data);
  }
}

// Export the service as default
export default DeviceService;