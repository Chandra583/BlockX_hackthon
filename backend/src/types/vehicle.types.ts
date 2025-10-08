import { ObjectId } from './index';

// Document Types
export type DocumentType = 
  | 'title'
  | 'registration'
  | 'insurance'
  | 'inspection'
  | 'maintenance'
  | 'accident'
  | 'warranty'
  | 'photo'
  | 'receipt'
  | 'other';

// Document Status
export type DocumentStatus = 
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'archived';

// Access Levels
export type AccessLevel = 
  | 'private'
  | 'owner_only'
  | 'public'
  | 'restricted';

// Vehicle Related Types
export type VehicleCondition = 
  | 'excellent'
  | 'good'
  | 'fair'
  | 'poor'
  | 'salvage';

export type VehicleStatus = 
  | 'active'
  | 'sold'
  | 'maintenance'
  | 'inactive'
  | 'flagged';

export type FuelType = 
  | 'gasoline'
  | 'diesel'
  | 'electric'
  | 'hybrid'
  | 'natural_gas'
  | 'other';

export type TransmissionType = 
  | 'manual'
  | 'automatic'
  | 'cvt'
  | 'semi_automatic';

export type DriveType = 
  | 'fwd'
  | 'rwd'
  | 'awd'
  | '4wd';

// Mileage Source Types
export type MileageSource = 
  | 'odometer'
  | 'service_record'
  | 'inspection'
  | 'auction'
  | 'dealer'
  | 'owner'
  | 'other';

export type VerificationStatus = 
  | 'pending'
  | 'verified'
  | 'rejected'
  | 'suspicious';

// Fraud Alert Types
export type FraudType = 
  | 'odometer_rollback'
  | 'mileage_inconsistency'
  | 'duplicate_vin'
  | 'stolen_vehicle'
  | 'flood_damage'
  | 'accident_concealment'
  | 'title_washing'
  | 'other';

export type AlertSeverity = 
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

// Location Types
export interface Location {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

// Service Record Types
export interface ServiceRecord {
  serviceType: string;
  description: string;
  mileage: number;
  serviceDate: Date;
  cost?: number;
  servicedBy: string;
  location?: Location;
  warrantyInfo?: string;
  nextServiceDue?: Date;
  nextServiceMileage?: number;
}

// Accident Record Types
export interface AccidentRecord {
  accidentDate: Date;
  description: string;
  severity: 'minor' | 'moderate' | 'major' | 'total_loss';
  mileage: number;
  cost?: number;
  insuranceClaim?: string;
  repairShop?: string;
  location?: Location;
  policeReport?: string;
}

// Mileage Record Types
export interface MileageRecord {
  mileage: number;
  recordedDate: Date;
  source: MileageSource;
  recordedBy: string;
  location?: Location;
  verified: boolean;
  notes?: string;
}

// Fraud Alert Types
export interface FraudAlert {
  type: FraudType;
  severity: AlertSeverity;
  description: string;
  detectedDate: Date;
  detectedBy: string;
  resolved: boolean;
  resolvedDate?: Date;
  resolvedBy?: string;
  resolutionNotes?: string;
}

// Trust Score Components
export interface TrustScoreComponents {
  mileageConsistency: number;
  documentVerification: number;
  serviceHistory: number;
  ownershipHistory: number;
  accidentHistory: number;
  fraudFlags: number;
}

// Search and Filter Types
export interface VehicleSearchFilters {
  make?: string;
  model?: string;
  year?: number;
  minYear?: number;
  maxYear?: number;
  condition?: VehicleCondition;
  status?: VehicleStatus;
  fuelType?: FuelType;
  transmission?: TransmissionType;
  driveType?: DriveType;
  minMileage?: number;
  maxMileage?: number;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  radius?: number;
  vin?: string;
  ownerEmail?: string;
  trustScoreMin?: number;
  trustScoreMax?: number;
  hasAccidents?: boolean;
  hasServiceHistory?: boolean;
  isVerified?: boolean;
  tags?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  skip?: number;
}

// API Response Types
export interface VehicleSearchResponse {
  vehicles: any[];
  total: number;
  page: number;
  limit: number;
  filters: VehicleSearchFilters;
}

// File Upload Types
export interface FileUploadInfo {
  fieldName: string;
  originalName: string;
  encoding: string;
  mimeType: string;
  buffer: Buffer;
  size: number;
}

// Validation Types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Blockchain Types (for future implementation)
export interface BlockchainRecord {
  transactionHash: string;
  blockNumber: number;
  timestamp: Date;
  gasUsed: number;
  verified: boolean;
}

// Statistics Types
export interface VehicleStatistics {
  totalVehicles: number;
  verifiedVehicles: number;
  flaggedVehicles: number;
  averageTrustScore: number;
  totalDocuments: number;
  recentActivity: number;
  fraudAlerts: number;
  resolvedFraudAlerts: number;
}

// Audit Trail Types
export interface AuditEntry {
  action: string;
  performedBy: string;
  timestamp: Date;
  details: any;
  ipAddress?: string;
  userAgent?: string;
}

// Notification Types
export interface NotificationData {
  type: 'fraud_alert' | 'document_expiry' | 'mileage_update' | 'verification_request' | 'system_alert';
  vehicleId?: string;
  documentId?: string;
  severity?: AlertSeverity;
  message: string;
  actionRequired?: boolean;
  actionUrl?: string;
  expiresAt?: Date;
}

// All types are already exported above as individual exports 