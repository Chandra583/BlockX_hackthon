import mongoose, { Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { 
  IUser, 
  UserRole, 
  AccountStatus, 
  VerificationStatus,
  IAddress,
  INotificationPreferences,
  IPrivacySettings,
  IBlockchainWallet,
  IAdminData,
  IOwnerData,
  IBuyerData,
  IServiceData,
  IInsuranceData,
  IGovernmentData
} from '../../types/user.types';

// Address Schema
const AddressSchema = new Schema<IAddress>({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true, default: 'United States' },
  coordinates: {
    latitude: { type: Number },
    longitude: { type: Number }
  }
}, { _id: false });

// Notification Preferences Schema
const NotificationPreferencesSchema = new Schema<INotificationPreferences>({
  email: {
    security: { type: Boolean, default: true },
    marketing: { type: Boolean, default: false },
    updates: { type: Boolean, default: true },
    fraud: { type: Boolean, default: true }
  },
  sms: {
    security: { type: Boolean, default: true },
    alerts: { type: Boolean, default: true },
    reminders: { type: Boolean, default: false }
  },
  push: {
    enabled: { type: Boolean, default: true },
    fraud: { type: Boolean, default: true },
    transactions: { type: Boolean, default: true },
    updates: { type: Boolean, default: false }
  }
}, { _id: false });

// Privacy Settings Schema
const PrivacySettingsSchema = new Schema<IPrivacySettings>({
  profileVisibility: { 
    type: String, 
    enum: ['public', 'private', 'contacts'], 
    default: 'private' 
  },
  showActivity: { type: Boolean, default: false },
  allowDataSharing: { type: Boolean, default: false },
  analyticsOptOut: { type: Boolean, default: false }
}, { _id: false });

// Blockchain Wallet Schema (Phase 5)
const BlockchainWalletSchema = new Schema<IBlockchainWallet>({
  walletAddress: { type: String, required: true },
  encryptedPrivateKey: { type: String, required: true, select: false }, // Don't include in queries by default
  blockchain: { type: String, enum: ['solana'], default: 'solana' },
  network: { type: String, enum: ['devnet', 'mainnet'], default: 'devnet' },
  balance: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  lastUsed: { type: Date }
}, { 
  _id: false,
  timestamps: true
});

// Role-specific Data Schemas
const AdminDataSchema = new Schema<IAdminData>({
  adminLevel: { 
    type: String, 
    enum: ['super', 'senior', 'junior'], 
    required: true 
  },
  permissions: [{ type: String }],
  departments: [{ type: String }],
  accessLevel: { type: Number, min: 1, max: 10, default: 1 },
  lastAuditAction: { type: Date },
  investigationsConducted: { type: Number, default: 0 },
  fraudCasesResolved: { type: Number, default: 0 }
}, { _id: false });

const OwnerDataSchema = new Schema<IOwnerData>({
  licenseNumber: { type: String },
  licenseExpiry: { type: Date },
  vehiclesOwned: [{ type: String }],
  devicesRegistered: [{ type: String }],
  totalMileageRecorded: { type: Number, default: 0 },
  fraudAlertsReceived: { type: Number, default: 0 },
  verificationLevel: { 
    type: String, 
    enum: ['basic', 'enhanced', 'premium'], 
    default: 'basic' 
  },
  trackingConsent: { type: Boolean, required: true }
}, { _id: false });

const BuyerDataSchema = new Schema<IBuyerData>({
  buyerType: { 
    type: String, 
    enum: ['individual', 'dealer', 'fleet'], 
    required: true 
  },
  verificationDocument: { type: String },
  purchaseHistory: [{ type: String }],
  savedSearches: [{ type: String }],
  watchlist: [{ type: String }],
  creditScore: { type: Number, min: 300, max: 850 },
  financingPreapproved: { type: Boolean, default: false },
  maxBudget: { type: Number }
}, { _id: false });

const ServiceDataSchema = new Schema<IServiceData>({
  businessName: { type: String, required: true },
  businessType: { 
    type: String, 
    enum: ['dealer', 'mechanic', 'inspection', 'towing'], 
    required: true 
  },
  licenseNumber: { type: String, required: true },
  licenseExpiry: { type: Date, required: true },
  serviceCategories: [{ type: String }],
  certificationsHeld: [{ type: String }],
  serviceRadius: { type: Number, default: 50 },
  servicesCompleted: { type: Number, default: 0 },
  averageRating: { type: Number, min: 0, max: 5, default: 0 },
  isAuthorizedDealer: { type: Boolean, default: false }
}, { _id: false });

const InsuranceDataSchema = new Schema<IInsuranceData>({
  companyName: { type: String, required: true },
  licenseNumber: { type: String, required: true },
  licenseExpiry: { type: Date, required: true },
  coverageTypes: [{ type: String }],
  riskModels: [{ type: String }],
  policiesIssued: { type: Number, default: 0 },
  claimsProcessed: { type: Number, default: 0 },
  fraudCasesReported: { type: Number, default: 0 },
  apiIntegrationLevel: { 
    type: String, 
    enum: ['basic', 'advanced', 'enterprise'], 
    default: 'basic' 
  }
}, { _id: false });

const GovernmentDataSchema = new Schema<IGovernmentData>({
  agencyName: { type: String, required: true },
  agencyType: { 
    type: String, 
    enum: ['federal', 'state', 'local'], 
    required: true 
  },
  jurisdiction: { type: String, required: true },
  departmentCode: { type: String, required: true },
  clearanceLevel: { 
    type: String, 
    enum: ['public', 'confidential', 'secret'], 
    default: 'public' 
  },
  accessScope: [{ type: String }],
  reportingRequirements: [{ type: String }],
  complianceMonitoring: { type: Boolean, default: true }
}, { _id: false });

// Main User Schema
const UserSchema = new Schema<IUser>({
  // Basic Information
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: { 
    type: String, 
    required: true, 
    minlength: 8,
    select: false // Don't include password in queries by default
  },
  firstName: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: 50
  },
  lastName: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: 50
  },
  phoneNumber: { 
    type: String, 
    trim: true,
    match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
  },
  dateOfBirth: { type: Date },
  
  // Role & Status
  role: { 
    type: String, 
    enum: ['admin', 'owner', 'buyer', 'service', 'insurance', 'government'], 
    required: true 
  },
  accountStatus: { 
    type: String, 
    enum: ['active', 'pending', 'suspended', 'locked', 'deactivated'], 
    default: 'pending' 
  },
  verificationStatus: { 
    type: String, 
    enum: ['unverified', 'pending', 'verified', 'rejected'], 
    default: 'unverified' 
  },
  
  // Profile
  profileImage: { type: String },
  address: AddressSchema,
  
  // Security
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String, select: false },
  
  // Account Security
  loginAttempts: { type: Number, default: 0 },
  lockoutUntil: { type: Date },
  lastLogin: { type: Date },
  passwordChangedAt: { type: Date, default: Date.now },
  
  // Preferences
  notifications: { 
    type: NotificationPreferencesSchema, 
    default: () => ({}) 
  },
  privacy: { 
    type: PrivacySettingsSchema, 
    default: () => ({}) 
  },
  
  // Blockchain Wallet (Phase 5)
  blockchainWallet: { type: BlockchainWalletSchema },
  
  // Role-specific data (using discriminator pattern)
  roleData: { type: Schema.Types.Mixed, required: true },
  
  // Metadata
  lastActivity: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.twoFactorSecret;
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes for performance (email index removed due to unique: true)
UserSchema.index({ role: 1 });
UserSchema.index({ accountStatus: 1 });
UserSchema.index({ verificationStatus: 1 });
UserSchema.index({ 'roleData.licenseNumber': 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ lastActivity: -1 });

// Virtual fields
UserSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

UserSchema.virtual('isLocked').get(function() {
  return !!(this.lockoutUntil && this.lockoutUntil > new Date());
});

// Pre-save middleware
UserSchema.pre('save', async function(next) {
  const user = this as IUser;
  
  // Hash password if modified
  if (user.isModified('password')) {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
    user.password = await bcrypt.hash(user.password, saltRounds);
    user.passwordChangedAt = new Date();
  }
  
  // Validate role-specific data
  if (user.isModified('roleData') || user.isNew) {
    validateRoleData(user.role, user.roleData);
  }
  
  // Update last activity
  if (user.isModified() && !user.isNew) {
    user.lastActivity = new Date();
  }
  
  next();
});

// Instance Methods
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  const user = this as IUser;
  return bcrypt.compare(candidatePassword, user.password);
};

UserSchema.methods.generateEmailVerificationToken = function(): string {
  return crypto.randomBytes(32).toString('hex');
};

UserSchema.methods.generatePasswordResetToken = function(): string {
  return crypto.randomBytes(32).toString('hex');
};

UserSchema.methods.incrementLoginAttempts = async function(): Promise<void> {
  const user = this as IUser;
  const maxAttempts = parseInt(process.env.ACCOUNT_LOCKOUT_ATTEMPTS || '5', 10);
  const lockoutDuration = parseInt(process.env.ACCOUNT_LOCKOUT_DURATION || '1800000', 10); // 30 minutes
  
  // If we have a previous lock that has expired, restart at 1
  if (user.lockoutUntil && user.lockoutUntil < new Date()) {
    await user.updateOne({
      $unset: { lockoutUntil: 1 },
      $set: { loginAttempts: 1 }
    });
    return;
  }
  
  const updates: any = { $inc: { loginAttempts: 1 } };
  
  // If we have reached max attempts and it's not locked yet, lock it
  if (user.loginAttempts + 1 >= maxAttempts && !user.isLocked) {
    updates.$set = { lockoutUntil: new Date(Date.now() + lockoutDuration) };
  }
  
  await user.updateOne(updates);
};

UserSchema.methods.resetLoginAttempts = async function(): Promise<void> {
  const user = this as IUser;
  await user.updateOne({
    $unset: { loginAttempts: 1, lockoutUntil: 1 }
  });
};

// Static Methods
UserSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

UserSchema.statics.findByRole = function(role: UserRole) {
  return this.find({ role });
};

// Role data validation function
function validateRoleData(role: UserRole, roleData: any): void {
  switch (role) {
    case 'admin':
      if (!roleData.adminLevel || !['super', 'senior', 'junior'].includes(roleData.adminLevel)) {
        throw new Error('Admin level is required and must be super, senior, or junior');
      }
      break;
    case 'owner':
      if (typeof roleData.trackingConsent !== 'boolean') {
        throw new Error('Tracking consent is required for vehicle owners');
      }
      break;
    case 'buyer':
      if (!roleData.buyerType || !['individual', 'dealer', 'fleet'].includes(roleData.buyerType)) {
        throw new Error('Buyer type is required and must be individual, dealer, or fleet');
      }
      break;
    case 'service':
      if (!roleData.businessName || !roleData.licenseNumber || !roleData.businessType) {
        throw new Error('Business name, license number, and business type are required for service providers');
      }
      break;
    case 'insurance':
      if (!roleData.companyName || !roleData.licenseNumber) {
        throw new Error('Company name and license number are required for insurance providers');
      }
      break;
    case 'government':
      if (!roleData.agencyName || !roleData.agencyType || !roleData.jurisdiction) {
        throw new Error('Agency name, type, and jurisdiction are required for government users');
      }
      break;
  }
}

// Create and export the model
export const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema); 