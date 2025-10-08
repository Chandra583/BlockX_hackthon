import { ObjectId } from './index';

// Document Core Types
export type DocumentType = 
  | 'title'
  | 'registration'
  | 'insurance'
  | 'inspection'
  | 'maintenance'
  | 'service_record'
  | 'repair_receipt'
  | 'warranty'
  | 'loan_document'
  | 'purchase_agreement'
  | 'bill_of_sale'
  | 'odometer_disclosure'
  | 'lien_release'
  | 'emissions_certificate'
  | 'safety_certificate'
  | 'import_document'
  | 'modification_cert'
  | 'other';

export type DocumentStatus = 'pending' | 'verified' | 'rejected' | 'expired' | 'archived';
export type DocumentVisibility = 'public' | 'private' | 'restricted' | 'owner_only';
export type FileFormat = 'pdf' | 'jpg' | 'jpeg' | 'png' | 'gif' | 'doc' | 'docx' | 'txt' | 'other';

// Document Interface
export interface IVehicleDocument {
  _id: ObjectId;
  vehicleId: ObjectId;
  uploadedBy: ObjectId;
  
  // Document Details
  documentType: DocumentType;
  title: string;
  description?: string;
  
  // File Information
  filename: string;
  originalFilename: string;
  fileUrl: string;
  thumbnailUrl?: string;
  fileSize: number;
  fileFormat: FileFormat;
  mimeType: string;
  
  // Document Properties
  documentNumber?: string;
  issueDate?: Date;
  expirationDate?: Date;
  issuingAuthority?: string;
  
  // Status & Verification
  status: DocumentStatus;
  visibility: DocumentVisibility;
  verified: boolean;
  verifiedBy?: ObjectId;
  verifiedAt?: Date;
  
  // Security
  hash: string;
  digitalSignature?: string;
  encryptionKey?: string;
  
  // Metadata
  tags: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Access Control
  accessPermissions: IDocumentPermission[];
  
  // Version Control
  version: number;
  parentDocumentId?: ObjectId;
  childDocuments?: ObjectId[];
  
  // Audit Trail
  auditLog: IDocumentAuditEntry[];
}

// Document Permission Interface
export interface IDocumentPermission {
  userId: ObjectId;
  permission: 'view' | 'download' | 'edit' | 'delete' | 'share';
  grantedBy: ObjectId;
  grantedAt: Date;
  expiresAt?: Date;
}

// Document Audit Entry Interface
export interface IDocumentAuditEntry {
  _id?: ObjectId;
  action: 'uploaded' | 'viewed' | 'downloaded' | 'edited' | 'deleted' | 'shared' | 'verified' | 'rejected';
  performedBy: ObjectId;
  performedAt: Date;
  ipAddress: string;
  userAgent: string;
  details?: string;
  changes?: any;
}

// Document Upload Request Interface
export interface IDocumentUploadRequest {
  vehicleId: string;
  documentType: DocumentType;
  title: string;
  description?: string;
  visibility: DocumentVisibility;
  documentNumber?: string;
  issueDate?: Date;
  expirationDate?: Date;
  issuingAuthority?: string;
  tags?: string[];
  notes?: string;
}

// Document Upload Response Interface
export interface IDocumentUploadResponse {
  document: IVehicleDocument;
  uploadUrl?: string;
  message: string;
}

// Document Search Query Interface
export interface IDocumentSearchQuery {
  vehicleId?: string;
  documentType?: DocumentType[];
  status?: DocumentStatus[];
  visibility?: DocumentVisibility[];
  uploadedBy?: string;
  verified?: boolean;
  expiringBefore?: Date;
  expiringAfter?: Date;
  createdAfter?: Date;
  createdBefore?: Date;
  tags?: string[];
  search?: string;
  
  // Sorting
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'expirationDate' | 'fileSize';
  sortOrder?: 'asc' | 'desc';
  
  // Pagination
  page?: number;
  limit?: number;
}

// Document Statistics Interface
export interface IDocumentStats {
  totalDocuments: number;
  verifiedDocuments: number;
  pendingDocuments: number;
  expiredDocuments: number;
  expiringDocuments: number;
  documentsByType: { type: DocumentType; count: number }[];
  documentsByStatus: { status: DocumentStatus; count: number }[];
  storageUsed: number;
  averageFileSize: number;
}

// Document Validation Interface
export interface IDocumentValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  requiredFields: string[];
  suggestions: string[];
}

// Document Template Interface
export interface IDocumentTemplate {
  _id: ObjectId;
  templateName: string;
  documentType: DocumentType;
  description: string;
  
  // Template Structure
  requiredFields: ITemplateField[];
  optionalFields: ITemplateField[];
  validationRules: IValidationRule[];
  
  // Template Properties
  isActive: boolean;
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
  
  // Usage Statistics
  usageCount: number;
  lastUsed?: Date;
}

// Template Field Interface
export interface ITemplateField {
  fieldName: string;
  fieldType: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'file' | 'textarea';
  label: string;
  description?: string;
  placeholder?: string;
  required: boolean;
  defaultValue?: any;
  options?: string[];
  validation?: IFieldValidation;
}

// Field Validation Interface
export interface IFieldValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
  fileTypes?: string[];
  maxFileSize?: number;
}

// Validation Rule Interface
export interface IValidationRule {
  ruleName: string;
  condition: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

// Document Bulk Operation Interface
export interface IBulkDocumentOperation {
  operation: 'verify' | 'reject' | 'delete' | 'archive' | 'change_visibility' | 'add_tags' | 'remove_tags';
  documentIds: string[];
  parameters?: any;
  performedBy: ObjectId;
  performedAt: Date;
  results: IBulkOperationResult[];
}

// Bulk Operation Result Interface
export interface IBulkOperationResult {
  documentId: string;
  success: boolean;
  error?: string;
  message?: string;
}

// Document Sharing Interface
export interface IDocumentShare {
  _id: ObjectId;
  documentId: ObjectId;
  sharedBy: ObjectId;
  sharedWith: ObjectId;
  shareType: 'view' | 'download' | 'edit';
  expiresAt?: Date;
  accessCount: number;
  lastAccessed?: Date;
  createdAt: Date;
  message?: string;
  isActive: boolean;
}

// Document Notification Interface
export interface IDocumentNotification {
  _id: ObjectId;
  documentId: ObjectId;
  userId: ObjectId;
  notificationType: 'expiring' | 'expired' | 'verified' | 'rejected' | 'shared' | 'updated';
  message: string;
  sent: boolean;
  sentAt?: Date;
  createdAt: Date;
  scheduledFor?: Date;
  channels: ('email' | 'sms' | 'push' | 'in_app')[];
}

// Document Backup Interface
export interface IDocumentBackup {
  _id: ObjectId;
  documentId: ObjectId;
  backupLocation: string;
  backupType: 'full' | 'incremental' | 'differential';
  backupSize: number;
  backupHash: string;
  encrypted: boolean;
  createdAt: Date;
  expiresAt?: Date;
  verified: boolean;
  verifiedAt?: Date;
}

// Document OCR Result Interface
export interface IDocumentOCRResult {
  documentId: ObjectId;
  extractedText: string;
  confidence: number;
  language: string;
  fields: IExtractedField[];
  processedAt: Date;
  ocrEngine: string;
  processingTime: number;
  errors: string[];
}

// Extracted Field Interface
export interface IExtractedField {
  fieldName: string;
  value: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// Document Compliance Interface
export interface IDocumentCompliance {
  documentId: ObjectId;
  regulationId: string;
  regulationName: string;
  complianceStatus: 'compliant' | 'non_compliant' | 'pending' | 'not_applicable';
  checkedAt: Date;
  checkedBy: ObjectId;
  issues: string[];
  recommendations: string[];
  nextCheckDue?: Date;
}

// Document Integration Interface
export interface IDocumentIntegration {
  _id: ObjectId;
  documentId: ObjectId;
  integrationType: 'blockchain' | 'cloud_storage' | 'external_api' | 'archive_system';
  integrationStatus: 'pending' | 'synced' | 'failed' | 'error';
  externalId?: string;
  externalUrl?: string;
  lastSyncAt?: Date;
  syncAttempts: number;
  errors: string[];
  metadata: any;
}

// Export utility types
export type DocumentRole = 'owner' | 'viewer' | 'editor' | 'admin';
export type DocumentAction = 'upload' | 'view' | 'download' | 'edit' | 'delete' | 'share' | 'verify' | 'reject'; 