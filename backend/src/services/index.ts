// Core Authentication Services
export { AuthService } from './core/auth.service';
export { JWTService } from './core/jwt.service';

// Phase 2 Services - Temporarily disabled for deployment
// export { documentService } from './core/document.service';
// export { VehicleService } from './core/vehicle.service';
// export { MileageService } from './core/mileage.service';
// export { s3Service } from './storage/s3.service';

// Phase 2 Service Types - Temporarily disabled for deployment
// export type {
//   UploadOptions,
//   UploadResult,
//   DownloadOptions,
//   SignedUrlOptions,
//   S3FileInfo
// } from './storage/s3.service';

// export type {
//   DocumentUploadOptions,
//   DocumentSearchOptions,
//   DocumentUpdateOptions,
//   DocumentStats
// } from './core/document.service';

// export type {
//   VehicleRegistrationData,
//   VehicleUpdateData
// } from './core/vehicle.service';

// export type {
//   MileageUpdateData,
//   MileageVerificationData,
//   MileageAnalytics
// } from './core/mileage.service';
 
// Re-export types for convenience
export type { ITokenPair, IAuthResponse, IUserInfo } from '../types/auth.types'; 