import { Document } from 'mongoose';

// Base User Types
export type UserRole = 
  | 'admin'
  | 'owner' 
  | 'buyer'
  | 'service'
  | 'insurance'
  | 'government';

export type AccountStatus = 
  | 'active'
  | 'pending'
  | 'suspended'
  | 'locked'
  | 'deactivated';

export type VerificationStatus = 
  | 'unverified'
  | 'pending'
  | 'verified'
  | 'rejected';

// Base User Interface
export interface IUser extends Document {
  // Basic Information
  _id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  dateOfBirth?: Date;
  
  // Role & Status
  role: UserRole;
  accountStatus: AccountStatus;
  verificationStatus: VerificationStatus;
  
  // Profile
  profileImage?: string;
  address?: IAddress;
  
  // Security
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  
  // Account Security
  loginAttempts: number;
  lockoutUntil?: Date;
  lastLogin?: Date;
  passwordChangedAt?: Date;
  
  // Preferences
  notifications: INotificationPreferences;
  privacy: IPrivacySettings;
  
  // Role-specific data
  roleData: IAdminData | IOwnerData | IBuyerData | IServiceData | IInsuranceData | IGovernmentData;
  
  // Blockchain Wallet (added for Phase 5)
  blockchainWallet?: IBlockchainWallet;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastActivity?: Date;
  
  // Virtual fields
  fullName: string;
  isLocked: boolean;
  
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateEmailVerificationToken(): string;
  generatePasswordResetToken(): string;
  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
}

// Address Interface
export interface IAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

// Notification Preferences
export interface INotificationPreferences {
  email: {
    security: boolean;
    marketing: boolean;
    updates: boolean;
    fraud: boolean;
  };
  sms: {
    security: boolean;
    alerts: boolean;
    reminders: boolean;
  };
  push: {
    enabled: boolean;
    fraud: boolean;
    transactions: boolean;
    updates: boolean;
  };
}

// Privacy Settings
export interface IPrivacySettings {
  profileVisibility: 'public' | 'private' | 'contacts';
  showActivity: boolean;
  allowDataSharing: boolean;
  analyticsOptOut: boolean;
}

// Blockchain Wallet Interface (Phase 5)
export interface IBlockchainWallet {
  walletAddress: string;
  encryptedPrivateKey: string;
  blockchain: 'solana';
  network: 'devnet' | 'mainnet';
  balance: number;
  isActive: boolean;
  createdAt: Date;
  lastUsed?: Date;
}

// Role-Specific Data Interfaces

// 🔴 ADMIN DATA
export interface IAdminData {
  adminLevel: 'super' | 'senior' | 'junior';
  permissions: string[];
  departments: string[];
  accessLevel: number;
  lastAuditAction?: Date;
  investigationsConducted: number;
  fraudCasesResolved: number;
}

// 🟣 OWNER DATA  
export interface IOwnerData {
  licenseNumber?: string;
  licenseExpiry?: Date;
  vehiclesOwned: string[]; // Vehicle IDs
  devicesRegistered: string[]; // Device IDs
  totalMileageRecorded: number;
  fraudAlertsReceived: number;
  verificationLevel: 'basic' | 'enhanced' | 'premium';
  trackingConsent: boolean;
}

// 🟢 BUYER DATA
export interface IBuyerData {
  buyerType: 'individual' | 'dealer' | 'fleet';
  verificationDocument?: string;
  purchaseHistory: string[]; // Transaction IDs
  savedSearches: string[];
  watchlist: string[]; // Vehicle IDs
  creditScore?: number;
  financingPreapproved: boolean;
  maxBudget?: number;
}

// 🟠 SERVICE DATA
export interface IServiceData {
  businessName: string;
  businessType: 'dealer' | 'mechanic' | 'inspection' | 'towing';
  licenseNumber: string;
  licenseExpiry: Date;
  serviceCategories: string[];
  certificationsHeld: string[];
  serviceRadius: number; // in miles
  servicesCompleted: number;
  averageRating: number;
  isAuthorizedDealer: boolean;
}

// 🔵 INSURANCE DATA
export interface IInsuranceData {
  companyName: string;
  licenseNumber: string;
  licenseExpiry: Date;
  coverageTypes: string[];
  riskModels: string[];
  policiesIssued: number;
  claimsProcessed: number;
  fraudCasesReported: number;
  apiIntegrationLevel: 'basic' | 'advanced' | 'enterprise';
}

// 🟡 GOVERNMENT DATA
export interface IGovernmentData {
  agencyName: string;
  agencyType: 'federal' | 'state' | 'local';
  jurisdiction: string;
  departmentCode: string;
  clearanceLevel: 'public' | 'confidential' | 'secret';
  accessScope: string[];
  reportingRequirements: string[];
  complianceMonitoring: boolean;
}

// User Creation Input Types
export interface ICreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phoneNumber?: string;
  address?: IAddress;
  roleData: IAdminData | IOwnerData | IBuyerData | IServiceData | IInsuranceData | IGovernmentData;
}

// User Update Input Types
export interface IUpdateUserInput {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: IAddress;
  notifications?: INotificationPreferences;
  privacy?: IPrivacySettings;
  roleData?: Partial<IAdminData | IOwnerData | IBuyerData | IServiceData | IInsuranceData | IGovernmentData>;
}

// User Query Types
export interface IUserQuery {
  role?: UserRole;
  accountStatus?: AccountStatus;
  verificationStatus?: VerificationStatus;
  emailVerified?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  lastActivityAfter?: Date;
  search?: string;
}

// User Statistics
export interface IUserStats {
  totalUsers: number;
  activeUsers: number;
  pendingVerification: number;
  lockedAccounts: number;
  roleDistribution: Record<UserRole, number>;
  registrationTrends: {
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
} 