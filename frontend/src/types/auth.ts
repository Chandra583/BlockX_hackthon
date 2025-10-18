export interface ExtendedRegisterFormData extends RegisterFormData {
  licenseNumber?: string;
  businessType?: 'dealer' | 'mechanic' | 'inspection' | 'towing';
}

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// Role-specific data interfaces
export interface AdminData {
  adminLevel: 'super' | 'senior' | 'junior';
  permissions: string[];
  departments: string[];
  accessLevel: number;
  investigationsConducted: number;
  fraudCasesResolved: number;
}

export interface OwnerData {
  licenseNumber?: string;
  licenseExpiry?: Date;
  vehiclesOwned: string[];
  devicesRegistered: string[];
  totalMileageRecorded: number;
  fraudAlertsReceived: number;
  verificationLevel: 'basic' | 'enhanced' | 'premium';
  trackingConsent: boolean;
}

export interface BuyerData {
  buyerType: 'individual' | 'dealer' | 'fleet';
  verificationDocument?: string;
  purchaseHistory: string[];
  savedSearches: string[];
  watchlist: string[];
  creditScore?: number;
  financingPreapproved: boolean;
  maxBudget?: number;
}

export interface ServiceData {
  businessName: string;
  businessType: 'dealer' | 'mechanic' | 'inspection' | 'towing';
  licenseNumber: string;
  licenseExpiry: Date;
  serviceCategories: string[];
  certificationsHeld: string[];
  serviceRadius: number;
  servicesCompleted: number;
  averageRating: number;
  isAuthorizedDealer: boolean;
}

export interface InsuranceData {
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

export interface GovernmentData {
  agencyName: string;
  agencyType: 'federal' | 'state' | 'local';
  jurisdiction: string;
  departmentCode: string;
  clearanceLevel: 'public' | 'confidential' | 'secret';
  accessScope: string[];
  reportingRequirements: string[];
  complianceMonitoring: boolean;
}

export type RoleSpecificData = AdminData | OwnerData | BuyerData | ServiceData | InsuranceData | GovernmentData;

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'owner' | 'buyer' | 'service' | 'insurance' | 'government';
  phoneNumber?: string;
  organization?: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  roleSpecificData?: RoleSpecificData;
}

// Backend API Response Structure
export interface BackendAuthResponse {
  status: 'success' | 'error';
  message: string;
  data: {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      fullName: string;
      role: 'admin' | 'owner' | 'buyer' | 'service' | 'insurance' | 'government';
      accountStatus: string;
      verificationStatus: string;
      emailVerified: boolean;
      phoneVerified: boolean;
      twoFactorEnabled: boolean;
      lastLogin?: string;
      createdAt: string;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
      tokenType: 'Bearer';
    };
    message: string;
  };
  timestamp: string;
}

// Frontend AuthResponse (what the Redux store expects)
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    role: 'admin' | 'owner' | 'buyer' | 'service' | 'insurance' | 'government';
    firstName: string;
    lastName: string;
    isActive: boolean;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
  };
  token: string;
  refreshToken: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
}

export const USER_ROLES = {
  ADMIN: 'admin',
  OWNER: 'owner',
  BUYER: 'buyer',
  SERVICE: 'service',
  INSURANCE: 'insurance',
  GOVERNMENT: 'government',
} as const;

export const ROLE_LABELS = {
  [USER_ROLES.ADMIN]: 'System Administrator',
  [USER_ROLES.OWNER]: 'Vehicle Owner',
  [USER_ROLES.BUYER]: 'Vehicle Buyer',
  [USER_ROLES.SERVICE]: 'Service Provider',
  [USER_ROLES.INSURANCE]: 'Insurance Provider',
  [USER_ROLES.GOVERNMENT]: 'Government Official',
} as const;

// Utility function to generate default role-specific data
export const generateDefaultRoleData = (role: string, organization?: string): RoleSpecificData => {
  switch (role) {
    case USER_ROLES.ADMIN:
      return {
        adminLevel: 'junior',
        permissions: [],
        departments: [],
        accessLevel: 1,
        investigationsConducted: 0,
        fraudCasesResolved: 0,
      } as AdminData;

    case USER_ROLES.OWNER:
      return {
        vehiclesOwned: [],
        devicesRegistered: [],
        totalMileageRecorded: 0,
        fraudAlertsReceived: 0,
        verificationLevel: 'basic',
        trackingConsent: true,
      } as OwnerData;

    case USER_ROLES.BUYER:
      return {
        buyerType: 'individual',
        purchaseHistory: [],
        savedSearches: [],
        watchlist: [],
        financingPreapproved: false,
      } as BuyerData;

    case USER_ROLES.SERVICE:
      return {
        businessName: organization || '',
        businessType: 'mechanic',
        licenseNumber: '',  // Will be filled during registration
        licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        serviceCategories: [],
        certificationsHeld: [],
        serviceRadius: 50,
        servicesCompleted: 0,
        averageRating: 0,
        isAuthorizedDealer: false,
      } as ServiceData;

    case USER_ROLES.INSURANCE:
      return {
        companyName: organization || 'Insurance Company',
        licenseNumber: '',
        licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        coverageTypes: [],
        riskModels: [],
        policiesIssued: 0,
        claimsProcessed: 0,
        fraudCasesReported: 0,
        apiIntegrationLevel: 'basic',
      } as InsuranceData;

    case USER_ROLES.GOVERNMENT:
      return {
        agencyName: organization || 'Government Agency',
        agencyType: 'local',
        jurisdiction: '',
        departmentCode: '',
        clearanceLevel: 'public',
        accessScope: [],
        reportingRequirements: [],
        complianceMonitoring: false,
      } as GovernmentData;

    default:
      // Default to buyer data
      return {
        buyerType: 'individual',
        purchaseHistory: [],
        savedSearches: [],
        watchlist: [],
        financingPreapproved: false,
      } as BuyerData;
  }
}; 