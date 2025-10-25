// Phase 1 Models - Authentication & User Management
export { User } from './core/User.model';
export { Notification } from './core/Notification.model';

// ESP32 and Telemetry Models
export { Device } from './core/Device.model';
export { VehicleTelemetry } from './core/VehicleTelemetry.model';
export { TestResult } from './core/TestResult.model';

// Phase 2 Models - Vehicle Management System (Re-enabled for full implementation)
export { default as Vehicle } from './core/Vehicle.model';
export { default as MileageHistory } from './core/MileageHistory.model';
export { default as VehicleDocument } from './core/VehicleDocument.model';
export { TrustEvent } from './core/TrustEvent.model';

// New Models - Batch Processing and Service Providers (temporarily disabled)
// export { default as BatchData } from './core/BatchData.model';
// export { default as ServiceProvider } from './core/ServiceProvider.model';

// Blockchain Models
export { default as Transaction } from './core/Transaction.model';

// Re-export interfaces for TypeScript support
export type { IUser } from '../types/user.types';
export type { INotification } from './core/Notification.model';
export type { IDevice } from './core/Device.model';
export type { IVehicleTelemetry } from './core/VehicleTelemetry.model';
export type { ITestResult } from './core/TestResult.model';
// Phase 2 interfaces re-enabled
export type { IVehicleDocument } from './core/Vehicle.model';
export type { IMileageHistoryDocument } from './core/MileageHistory.model';
export type { IVehicleDocumentDocument } from './core/VehicleDocument.model';
export type { ITrustEvent } from './core/TrustEvent.model';

// New interfaces (temporarily disabled)
// export type { IBatchData } from './core/BatchData.model';
// export type { IServiceProvider } from './core/ServiceProvider.model';

// Blockchain interfaces
export type { ITransactionDocument } from './core/Transaction.model'; 