// Vehicle Types
// This file will export all vehicle-related TypeScript types and interfaces

// Vehicle Core Types
export type FuelType = 'gasoline' | 'diesel' | 'electric' | 'hybrid' | 'hydrogen' | 'other';
export type TransmissionType = 'manual' | 'automatic' | 'cvt' | 'semi-automatic';
export type BodyType = 'sedan' | 'suv' | 'truck' | 'coupe' | 'hatchback' | 'wagon' | 'convertible' | 'van' | 'motorcycle' | 'other';
export type VehicleVerificationStatus = 'pending' | 'verified' | 'flagged' | 'rejected' | 'expired';
export type ListingStatus = 'active' | 'sold' | 'pending' | 'inactive' | 'draft' | 'expired';
export type MileageSource = 'owner' | 'service' | 'inspection' | 'government' | 'automated';

// Vehicle Interface (Frontend)
export interface Vehicle {
  id: string;
  vin: string;
  ownerId: string;
  
  // Basic Information
  make: string;
  model: string;
  year: number;
  color: string;
  bodyType: BodyType;
  fuelType: FuelType;
  transmission: TransmissionType;
  engineSize?: string;
  
  // Current Status
  currentMileage: number;
  lastMileageUpdate: string; // ISO date string
  
  // Verification & Trust
  verificationStatus: VehicleVerificationStatus;
  trustScore: number;
  
  // Marketplace Status
  isForSale: boolean;
  listingStatus: ListingStatus;
  
  // Additional Details
  description?: string;
  features: string[];
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  
  // Metadata
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  lastServiceDate?: string; // ISO date string
  nextServiceDue?: string; // ISO date string
  registrationExpiry?: string; // ISO date string
  insuranceExpiry?: string; // ISO date string
}

// Vehicle Registration Form Data
export interface VehicleRegistrationFormData {
  vin: string;
  make: string;
  model: string;
  year: number;
  color: string;
  bodyType: BodyType;
  fuelType: FuelType;
  transmission: TransmissionType;
  currentMileage: number;
  purchaseDate?: string;
  purchasePrice?: number;
  previousOwner?: string;
  description?: string;
  features?: string[];
  condition: 'excellent' | 'good' | 'fair' | 'poor';
}

// Mileage Update Form Data
export interface MileageUpdateFormData {
  newMileage: number;
  location?: string;
  notes?: string;
}

// Vehicle Search Query
export interface VehicleSearchQuery {
  // Basic Filters
  make?: string[];
  model?: string[];
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  mileageMax?: number;
  
  // Advanced Filters
  bodyType?: BodyType[];
  fuelType?: FuelType[];
  transmission?: TransmissionType[];
  color?: string[];
  condition?: string[];
  
  // Location & Distance
  location?: string;
  radius?: number;
  
  // Trust & Verification
  verifiedOnly?: boolean;
  trustScoreMin?: number;
  noAccidents?: boolean;
  
  // Listing Status
  listingStatus?: ListingStatus[];
  
  // Sorting
  sortBy?: 'price' | 'mileage' | 'year' | 'distance' | 'trustScore' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  
  // Pagination
  page?: number;
  limit?: number;
}

// API Response Types
export interface VehicleRegistrationResponse {
  vehicle: Vehicle;
  message: string;
}

export interface VehicleListResponse {
  vehicles: Vehicle[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface MileageUpdateResponse {
  message: string;
  newMileage: number;
  trustScore?: number;
}

// VIN Validation Types
export interface VINValidationResult {
  isValid: boolean;
  vin: string;
  make?: string;
  model?: string;
  year?: number;
  bodyType?: string;
  engineType?: string;
  country?: string;
  manufacturer?: string;
  errors?: string[];
}

// Document Types
export type DocumentType = 
  | 'title'
  | 'registration'
  | 'insurance'
  | 'inspection'
  | 'maintenance'
  | 'service_record'
  | 'repair_receipt'
  | 'warranty'
  | 'other';

export interface VehicleDocument {
  id: string;
  vehicleId: string;
  documentType: DocumentType;
  title: string;
  description?: string;
  filename: string;
  fileUrl: string;
  thumbnailUrl?: string;
  fileSize: number;
  uploadedAt: string;
  verified: boolean;
  tags: string[];
}

export interface DocumentUploadFormData {
  documentType: DocumentType;
  title: string;
  description?: string;
  tags?: string[];
  files: File[];
}

// Export all types
// Additional specific type files will be exported here as they are created
// export * from './vehicle';
// export * from './document'; 