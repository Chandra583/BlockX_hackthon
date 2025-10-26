import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { VehicleService } from '../../services/vehicle';
import { WalletService } from '../../services/wallet';
import toast from 'react-hot-toast';
import { 
  Car, 
  Calendar, 
  Hash, 
  Gauge, 
  AlertCircle, 
  Loader2, 
  CheckCircle,
  ExternalLink,
  Upload,
  Eye,
  Download,
  Save,
  Trash2,
  RefreshCw
} from 'lucide-react';

// Enhanced validation schema
const vehicleRegistrationSchema = z.object({
  vin: z.string()
    .min(17, 'VIN must be exactly 17 characters')
    .max(17, 'VIN must be exactly 17 characters')
    .regex(/^[A-HJ-NPR-Z0-9]{17}$/, 'VIN contains invalid characters (I, O, Q not allowed)'),
  vehicleNumber: z.string()
    .min(1, 'Vehicle number is required')
    .max(20, 'Vehicle number cannot exceed 20 characters')
    .regex(/^[A-Z0-9]{4,20}$/, 'Vehicle number must contain 4-20 alphanumeric characters'),
  make: z.string()
    .min(1, 'Make is required')
    .max(50, 'Make cannot exceed 50 characters'),
  model: z.string()
    .min(1, 'Model is required')
    .max(50, 'Model cannot exceed 50 characters'),
  year: z.number()
    .min(1900, 'Year must be 1900 or later')
    .max(new Date().getFullYear() + 2, 'Year cannot be more than 2 years in the future'),
  initialMileage: z.number()
    .min(0, 'Mileage cannot be negative')
    .max(9999999, 'Mileage seems unrealistic'),
  walletAddress: z.string().optional(),
  color: z.string().min(1, 'Color is required').optional(),
  bodyType: z.enum(['sedan', 'suv', 'truck', 'coupe', 'hatchback', 'wagon', 'convertible', 'van', 'motorcycle', 'other']).optional(),
  fuelType: z.enum(['gasoline', 'diesel', 'electric', 'hybrid', 'hydrogen', 'other']).optional(),
  transmission: z.enum(['manual', 'automatic', 'cvt', 'semi-automatic']).optional(),
  engineSize: z.string().optional(),
  condition: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
});

type VehicleRegistrationFormData = z.infer<typeof vehicleRegistrationSchema>;

interface FileUpload {
  id: string;
  file: File;
  type: 'photo' | 'document';
  preview: string;
  progress: number;
}

interface VINDecodeResult {
  make?: string;
  model?: string;
  year?: number;
  found: boolean;
}

const RegisterVehicle: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingData, setPendingData] = useState<any>(null);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [vinDecodeResult, setVinDecodeResult] = useState<VINDecodeResult | null>(null);
  const [vinValidating, setVinValidating] = useState(false);
  const [uploads, setUploads] = useState<FileUpload[]>([]);
  const [draftExists, setDraftExists] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    setValue,
    reset,
    getValues
  } = useForm<VehicleRegistrationFormData>({
    resolver: zodResolver(vehicleRegistrationSchema),
    defaultValues: {
      vin: '',
      vehicleNumber: '',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      initialMileage: 0,
      color: '',
      bodyType: 'sedan',
      fuelType: 'gasoline',
      transmission: 'automatic',
      engineSize: '',
      condition: 'good',
      description: ''
    },
  });

  const watchedVIN = watch('vin');
  const watchedMileage = watch('initialMileage');

  // Auto-fill wallet address
  useEffect(() => {
    const loadWallet = async () => {
      try {
        const walletData = await WalletService.getAddress();
        console.log('Wallet data:', walletData);
        setWalletAddress(walletData.address);
        setValue('walletAddress', walletData.address);
      } catch (error) {
        console.warn('No wallet found, user can enter manually:', error);
        // Set a placeholder if no wallet is found
        setWalletAddress('No wallet connected');
      }
    };
    loadWallet();
  }, [setValue]);

  // Check for existing draft
  useEffect(() => {
    const savedDraft = localStorage.getItem('vehicle-registration-draft');
    if (savedDraft) {
      setDraftExists(true);
    }
  }, []);

  // Autosave draft every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (isDirty) {
        saveDraft();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isDirty]);

  // VIN validation and decode
  const validateVIN = useCallback(async (vin: string) => {
    if (vin.length !== 17) return;
    
    setVinValidating(true);
    try {
      // Check if VIN decode service exists
      const response = await fetch(`/api/external/vin-decode?vin=${vin}`);
      if (response.ok) {
        const data = await response.json();
        if (data.found) {
          setVinDecodeResult(data);
          // Auto-populate fields
          if (data.make) setValue('make', data.make);
          if (data.model) setValue('model', data.model);
          if (data.year) setValue('year', data.year);
        }
      }
    } catch (error) {
      // VIN decode service not available, continue with manual entry
    } finally {
      setVinValidating(false);
    }
  }, [setValue]);

  // Debounced VIN validation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (watchedVIN && watchedVIN.length === 17) {
        validateVIN(watchedVIN);
      }
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [watchedVIN, validateVIN]);

  // Save draft to localStorage
  const saveDraft = async () => {
    if (!isDirty) return;
    
    setSavingDraft(true);
    try {
      const formData = getValues();
      const draftData = {
        ...formData,
        uploads: uploads.map(u => ({ id: u.id, name: u.file.name, type: u.type })),
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('vehicle-registration-draft', JSON.stringify(draftData));
      setDraftExists(true);
    } catch (error) {
      console.error('Failed to save draft:', error);
    } finally {
      setSavingDraft(false);
    }
  };

  // Restore draft
  const restoreDraft = () => {
    const savedDraft = localStorage.getItem('vehicle-registration-draft');
    if (savedDraft) {
      try {
        const draftData = JSON.parse(savedDraft);
        Object.keys(draftData).forEach(key => {
          if (key !== 'uploads' && key !== 'savedAt') {
            setValue(key as any, draftData[key]);
          }
        });
        toast.success('Draft restored successfully');
        setDraftExists(false);
      } catch (error) {
        toast.error('Failed to restore draft');
      }
    }
  };

  // Discard draft
  const discardDraft = () => {
    localStorage.removeItem('vehicle-registration-draft');
    setDraftExists(false);
    reset();
    setUploads([]);
    toast.success('Draft discarded');
  };

  // File upload handlers
  const handleFileUpload = (files: FileList, type: 'photo' | 'document') => {
    Array.from(files).forEach(file => {
      // Validate file type and size
      const maxSize = type === 'photo' ? 5 * 1024 * 1024 : 10 * 1024 * 1024; // 5MB for photos, 10MB for documents
      if (file.size > maxSize) {
        toast.error(`File ${file.name} is too large. Max size: ${type === 'photo' ? '5MB' : '10MB'}`);
        return;
      }

      const allowedTypes = type === 'photo' 
        ? ['image/jpeg', 'image/png', 'image/webp']
        : ['application/pdf', 'image/jpeg', 'image/png'];
      
      if (!allowedTypes.includes(file.type)) {
        toast.error(`File ${file.name} has invalid type. Allowed: ${allowedTypes.join(', ')}`);
        return;
      }

      const id = Math.random().toString(36).substr(2, 9);
      const preview = URL.createObjectURL(file);
      
      setUploads(prev => [...prev, { id, file, type, preview, progress: 0 }]);
    });
  };

  const removeUpload = (id: string) => {
    setUploads(prev => {
      const upload = prev.find(u => u.id === id);
      if (upload) {
        URL.revokeObjectURL(upload.preview);
      }
      return prev.filter(u => u.id !== id);
    });
  };

  // Form submission
  const onSubmit = async (data: VehicleRegistrationFormData) => {
    setPendingData({ ...data, uploads });
    setShowConfirmation(true);
  };

  const handleConfirmRegistration = async () => {
    if (!pendingData) return;
    
    setLoading(true);
    setShowConfirmation(false);
    
    try {
      // Upload files first
      const uploadedFiles = await Promise.all(
        uploads.map(async (upload) => {
          const formData = new FormData();
          formData.append('file', upload.file);
          formData.append('type', upload.type);
          
          const response = await fetch('/api/vehicles/upload', {
            method: 'POST',
            body: formData
          });
          
          if (!response.ok) throw new Error('Upload failed');
          return response.json();
        })
      );

      // Submit vehicle registration
      const registrationData = {
        ...pendingData,
        walletAddress: walletAddress,
        photos: uploadedFiles.filter(f => f.type === 'photo').map(f => f.url),
        documents: uploadedFiles.filter(f => f.type === 'document').map(f => f.url)
      };

      const response = await VehicleService.registerVehicleOnBlockchain(registrationData);
      
      if (response.success) {
        // Clear draft on successful submission
        localStorage.removeItem('vehicle-registration-draft');
        setDraftExists(false);
        
        toast.success('Vehicle registered successfully! Awaiting admin verification.');
        navigate('/vehicles');
      } else {
        toast.error(response.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Registration failed:', error);
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch('/api/vehicles/preview-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getValues())
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vehicle-registration-${getValues().vin}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        toast.error('Failed to generate PDF');
      }
    } catch (error) {
      toast.error('Failed to generate PDF');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Register New Vehicle</h1>
            <p className="text-gray-600">Register your vehicle for blockchain verification</p>
          </div>

          {/* Draft Management */}
          {draftExists && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Save className="w-5 h-5 text-blue-600" />
                  <span className="text-blue-700">Draft saved automatically</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={restoreDraft}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    Restore Draft
                  </button>
                  <button
                    onClick={discardDraft}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                  >
                    Discard
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Main Form */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <form onSubmit={handleSubmit(onSubmit)} className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* VIN */}
                  <div>
                    <label htmlFor="vin" className="block text-sm font-medium text-gray-700 mb-2">
                      Vehicle Identification Number (VIN) *
                    </label>
                    <div className="relative">
                      <input
                        {...register('vin')}
                        type="text"
                        id="vin"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.vin ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter 17-character VIN"
                        maxLength={17}
                        style={{ textTransform: 'uppercase' }}
                      />
                      {watchedVIN && watchedVIN.length === 17 && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          {vinValidating ? (
                            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                          ) : (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                      )}
                    </div>
                    {errors.vin && (
                      <p className="mt-1 text-sm text-red-600" role="alert">
                        {errors.vin.message}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-gray-500">
                      17-character unique identifier. Do not enter spaces.
                    </p>
                    
                    {/* VIN Decode Result */}
                    {vinDecodeResult?.found && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-800">
                            We found: {vinDecodeResult.make} {vinDecodeResult.model} {vinDecodeResult.year}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Vehicle Number */}
                  <div>
                    <label htmlFor="vehicleNumber" className="block text-sm font-medium text-gray-700 mb-2">
                      Vehicle Registration Number *
                    </label>
                    <input
                      {...register('vehicleNumber')}
                      type="text"
                      id="vehicleNumber"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.vehicleNumber ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter vehicle registration number"
                      style={{ textTransform: 'uppercase' }}
                    />
                    {errors.vehicleNumber && (
                      <p className="mt-1 text-sm text-red-600" role="alert">
                        {errors.vehicleNumber.message}
                      </p>
                    )}
                  </div>

                  {/* Make */}
                  <div>
                    <label htmlFor="make" className="block text-sm font-medium text-gray-700 mb-2">
                      Make *
                    </label>
                    <input
                      {...register('make')}
                      type="text"
                      id="make"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.make ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., Toyota, Ford, Honda"
                    />
                    {errors.make && (
                      <p className="mt-1 text-sm text-red-600" role="alert">
                        {errors.make.message}
                      </p>
                    )}
                  </div>

                  {/* Model */}
                  <div>
                    <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-2">
                      Model *
                    </label>
                    <input
                      {...register('model')}
                      type="text"
                      id="model"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.model ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., Camry, F-150, Civic"
                    />
                    {errors.model && (
                      <p className="mt-1 text-sm text-red-600" role="alert">
                        {errors.model.message}
                      </p>
                    )}
                  </div>

                  {/* Year */}
                  <div>
                    <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
                      Year *
                    </label>
                    <input
                      {...register('year', { valueAsNumber: true })}
                      type="number"
                      id="year"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.year ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., 2023"
                      min="1900"
                      max={new Date().getFullYear() + 2}
                    />
                    {errors.year && (
                      <p className="mt-1 text-sm text-red-600" role="alert">
                        {errors.year.message}
                      </p>
                    )}
                  </div>

                  {/* Current Mileage */}
                  <div>
                    <label htmlFor="initialMileage" className="block text-sm font-medium text-gray-700 mb-2">
                      Current Mileage *
                    </label>
                    <input
                      {...register('initialMileage', { valueAsNumber: true })}
                      type="number"
                      id="initialMileage"
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.initialMileage ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., 15000"
                      min="0"
                    />
                    {errors.initialMileage && (
                      <p className="mt-1 text-sm text-red-600" role="alert">
                        {errors.initialMileage.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Wallet Address */}
                  <div>
                    <label htmlFor="walletAddress" className="block text-sm font-medium text-gray-700 mb-2">
                      Your Wallet Address (Solana) 
                      <span className="text-xs text-green-600 ml-2">(Auto-filled)</span>
                    </label>
                    <input
                      {...register('walletAddress')}
                      type="text"
                      id="walletAddress"
                      className={`w-full px-4 py-3 border rounded-lg font-mono text-sm ${
                        walletAddress && walletAddress !== 'No wallet connected' 
                          ? 'border-green-400 bg-green-100 text-green-900' 
                          : 'border-gray-300 bg-gray-100 text-gray-700'
                      }`}
                      value={walletAddress}
                      readOnly
                      disabled
                      placeholder="Connecting to wallet..."
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      {walletAddress && walletAddress !== 'No wallet connected' 
                        ? 'This is auto-filled from your wallet. Manage it in Wallet section.'
                        : 'Please connect your wallet in the Wallet section to auto-fill this field.'
                      }
                    </p>
                  </div>

                  {/* Color */}
                  <div>
                    <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-2">
                      Color
                    </label>
                    <input
                      {...register('color')}
                      type="text"
                      id="color"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., White, Black, Silver"
                    />
                  </div>

                  {/* Body Type */}
                  <div>
                    <label htmlFor="bodyType" className="block text-sm font-medium text-gray-700 mb-2">
                      Body Type
                    </label>
                    <select
                      {...register('bodyType')}
                      id="bodyType"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                    >
                      <option value="sedan">Sedan</option>
                      <option value="suv">SUV</option>
                      <option value="truck">Truck</option>
                      <option value="coupe">Coupe</option>
                      <option value="hatchback">Hatchback</option>
                      <option value="wagon">Wagon</option>
                      <option value="convertible">Convertible</option>
                      <option value="van">Van</option>
                      <option value="motorcycle">Motorcycle</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Fuel Type */}
                  <div>
                    <label htmlFor="fuelType" className="block text-sm font-medium text-gray-700 mb-2">
                      Fuel Type
                    </label>
                    <select
                      {...register('fuelType')}
                      id="fuelType"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                    >
                      <option value="gasoline">Gasoline</option>
                      <option value="diesel">Diesel</option>
                      <option value="electric">Electric</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="hydrogen">Hydrogen</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Transmission */}
                  <div>
                    <label htmlFor="transmission" className="block text-sm font-medium text-gray-700 mb-2">
                      Transmission
                    </label>
                    <select
                      {...register('transmission')}
                      id="transmission"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                    >
                      <option value="automatic">Automatic</option>
                      <option value="manual">Manual</option>
                      <option value="cvt">CVT</option>
                      <option value="semi-automatic">Semi-Automatic</option>
                    </select>
                  </div>

                  {/* Engine Size */}
                  <div>
                    <label htmlFor="engineSize" className="block text-sm font-medium text-gray-700 mb-2">
                      Engine Size
                    </label>
                    <input
                      {...register('engineSize')}
                      type="text"
                      id="engineSize"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 2.0L, 3.5L"
                    />
                  </div>

                  {/* Condition */}
                  <div>
                    <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-2">
                      Condition
                    </label>
                    <select
                      {...register('condition')}
                      id="condition"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                    >
                      <option value="excellent" className="text-gray-900">Excellent</option>
                      <option value="good" className="text-gray-900">Good</option>
                      <option value="fair" className="text-gray-900">Fair</option>
                      <option value="poor" className="text-gray-900">Poor</option>
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      {...register('description')}
                      id="description"
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Additional details about your vehicle"
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600" role="alert">
                        {errors.description.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* File Upload Section - REMOVED FOR NOW */}

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-between">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handlePreview}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={saveDraft}
                    disabled={savingDraft}
                    className="flex items-center gap-2 px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
                  >
                    {savingDraft ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save Draft
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Car className="w-4 h-4" />
                    )}
                    Register Vehicle
                  </button>
                </div>
              </div>
            </form>
          </div>
        </motion.div>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Vehicle Registration Preview</h2>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <ExternalLink className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Vehicle Information</h3>
                    <div className="space-y-2 text-sm text-gray-700">
                      <div><span className="font-medium text-gray-900">VIN:</span> <span className="text-gray-700">{getValues().vin}</span></div>
                      <div><span className="font-medium text-gray-900">Registration:</span> <span className="text-gray-700">{getValues().vehicleNumber}</span></div>
                      <div><span className="font-medium text-gray-900">Make/Model:</span> <span className="text-gray-700">{getValues().make} {getValues().model}</span></div>
                      <div><span className="font-medium text-gray-900">Year:</span> <span className="text-gray-700">{getValues().year}</span></div>
                      <div><span className="font-medium text-gray-900">Mileage:</span> <span className="text-gray-700">{getValues().initialMileage?.toLocaleString()} km</span></div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Additional Details</h3>
                    <div className="space-y-2 text-sm text-gray-700">
                      <div><span className="font-medium text-gray-900">Color:</span> <span className="text-gray-700">{getValues().color || 'Not specified'}</span></div>
                      <div><span className="font-medium text-gray-900">Body Type:</span> <span className="text-gray-700">{getValues().bodyType}</span></div>
                      <div><span className="font-medium text-gray-900">Fuel Type:</span> <span className="text-gray-700">{getValues().fuelType}</span></div>
                      <div><span className="font-medium text-gray-900">Transmission:</span> <span className="text-gray-700">{getValues().transmission}</span></div>
                      <div><span className="font-medium text-gray-900">Condition:</span> <span className="text-gray-700">{getValues().condition}</span></div>
                    </div>
                  </div>
                </div>
                
                {getValues().description && (
                  <div className="mt-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-sm text-gray-600">{getValues().description}</p>
                  </div>
                )}
                
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setShowPreview(false)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Download PDF
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowConfirmation(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Car className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Confirm Registration</h2>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to register this vehicle? This action will submit your vehicle for admin verification.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmation(false)}
                    className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmRegistration}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Registering...' : 'Confirm Registration'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RegisterVehicle;