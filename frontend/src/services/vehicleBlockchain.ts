import apiService from './api';
import { VehicleBlockchainTransaction, BlockchainHistoryResponse, SingleTransactionResponse } from '../types/blockchain';

export class VehicleBlockchainService {
  /**
   * Get all blockchain transactions for a vehicle
   */
  static async getVehicleBlockchainHistory(
    vehicleId: string,
    type?: string
  ): Promise<BlockchainHistoryResponse> {
    const queryParams = type ? `?type=${type}` : '';
    return await apiService.get<BlockchainHistoryResponse>(
      `/vehicles/${vehicleId}/blockchain-history${queryParams}`
    );
  }

  /**
   * Get device installation transaction for a vehicle
   */
  static async getDeviceInstallTransaction(
    vehicleId: string
  ): Promise<SingleTransactionResponse> {
    return await apiService.get<SingleTransactionResponse>(
      `/vehicles/${vehicleId}/blockchain-history/device-install`
    );
  }

  /**
   * Get registration transaction for a vehicle
   */
  static async getRegistrationTransaction(
    vehicleId: string
  ): Promise<SingleTransactionResponse> {
    return await apiService.get<SingleTransactionResponse>(
      `/vehicles/${vehicleId}/blockchain-history/registration`
    );
  }

  /**
   * Get transaction type label
   */
  static getTransactionTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      registration: 'Vehicle Registration',
      device_install: 'Device Installation',
      owner_transfer: 'Owner Transfer',
      mileage_update: 'Mileage Update',
      service_record: 'Service Record'
    };
    return labels[type] || type;
  }

  /**
   * Get transaction type color
   */
  static getTransactionTypeColor(type: string): string {
    const colors: Record<string, string> = {
      registration: 'bg-blue-100 text-blue-800',
      device_install: 'bg-green-100 text-green-800',
      owner_transfer: 'bg-purple-100 text-purple-800',
      mileage_update: 'bg-yellow-100 text-yellow-800',
      service_record: 'bg-orange-100 text-orange-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  }
}

export default VehicleBlockchainService;

