import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Car, 
  Calendar, 
  Hash, 
  Gauge, 
  AlertCircle, 
  Loader2, 
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { useAppSelector } from '../../hooks/redux';
import { VehicleService } from '../../services/vehicle';

// Validation schema
const vehicleRegistrationSchema = z.object({
  vin: z.string()
    .min(17, 'VIN must be exactly 17 characters')
    .max(17, 'VIN must be exactly 17 characters')
    .regex(/^[A-HJ-NPR-Z0-9]{17}$/, 'VIN contains invalid characters'),
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
  color: z.string().min(1, 'Color is required').optional(),
  bodyType: z.enum(['sedan', 'suv', 'truck', 'coupe', 'hatchback', 'wagon', 'convertible', 'van', 'motorcycle', 'other']).optional(),
  fuelType: z.enum(['gasoline', 'diesel', 'electric', 'hybrid', 'hydrogen', 'other']).optional(),
  transmission: z.enum(['manual', 'automatic', 'cvt', 'semi-automatic']).optional(),
});

type VehicleRegistrationFormData = z.infer<typeof vehicleRegistrationSchema>;

interface VehicleRegistrationFormProps {
  onSuccess?: (result: BlockchainRegistrationResult) => void;
  onCancel?: () => void;
}

interface BlockchainRegistrationResult {
  success: boolean;
  message: string;
  data: {
    vehicleId: string;
    vin: string;
    vehicleNumber: string;
    make: string;
    model: string;
    year: number;
    initialMileage: number;
    transactionHash: string;
    blockchainAddress: string;
    network: string;
    explorerUrl: string;
  };
}

export const VehicleRegistrationForm: React.FC<VehicleRegistrationFormProps> = ({
  onSuccess,
  onCancel
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<BlockchainRegistrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [vehicleNumberValidation, setVehicleNumberValidation] = useState<{
    isValidating: boolean;
    isRegistered: boolean | null;
    message: string;
  }>({ isValidating: false, isRegistered: null, message: '' });
  const { user } = useAppSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
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
    },
  });

  const watchedVIN = watch('vin');
  const watchedVehicleNumber = watch('vehicleNumber');

  // Auto-format VIN to uppercase
  const handleVINChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '');
    setValue('vin', value);
  };

  // Auto-format vehicle number to uppercase and validate
  const handleVehicleNumberChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setValue('vehicleNumber', value);
    
    // Validate vehicle number if it's not empty and has at least 4 characters
    if (value.length >= 4) {
      setVehicleNumberValidation({ isValidating: true, isRegistered: null, message: 'Checking availability...' });
      
      try {
        const validation = await VehicleService.validateVehicleNumber(value);
        setVehicleNumberValidation({
          isValidating: false,
          isRegistered: validation.data.isRegistered,
          message: validation.data.isRegistered 
            ? `❌ Vehicle number ${value} is already registered` 
            : `✅ Vehicle number ${value} is available`
        });
      } catch (error) {
        console.error('Vehicle number validation error:', error);
        setVehicleNumberValidation({
          isValidating: false,
          isRegistered: null,
          message: '⚠️ Could not validate vehicle number'
        });
      }
    } else {
      setVehicleNumberValidation({ isValidating: false, isRegistered: null, message: '' });
    }
  };

  const onSubmit = async (data: VehicleRegistrationFormData) => {
    setIsSubmitting(true);
    setError(null);
    setRegistrationResult(null);

    try {
      // Generate a unique vehicle ID (in production, this might come from backend)
      const vehicleId = `vehicle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const registrationData = {
        vehicleId,
        vin: data.vin,
        vehicleNumber: data.vehicleNumber,
        make: data.make,
        model: data.model,
        year: data.year,
        initialMileage: data.initialMileage,
        color: data.color,
        bodyType: data.bodyType,
        fuelType: data.fuelType,
        transmission: data.transmission,
      };

      console.log('Registering vehicle on blockchain:', registrationData);
      console.log('Form data received:', data);
      console.log('Vehicle number from form:', data.vehicleNumber);
      console.log('Current form values:', { vin: watchedVIN, vehicleNumber: watchedVehicleNumber });

      // Call the blockchain registration API using VehicleService
      const result = await VehicleService.registerVehicleOnBlockchain(registrationData);

      console.log('Vehicle registration successful:', result);
      setRegistrationResult(result);
      onSuccess?.(result);
      
    } catch (error: unknown) {
      console.error('Vehicle registration failed:', error);
      
      if (error && typeof error === 'object' && 'response' in error) {
        const err = error as { response?: { data?: { message?: string } } };
        if (err.response?.data?.message) {
          setError(err.response.data.message);
        } else {
          setError('Failed to register vehicle on blockchain. Please try again.');
        }
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to register vehicle on blockchain. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // If registration was successful, show success state
  if (registrationResult) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Vehicle Registered Successfully!</h2>
          <p className="text-gray-600">Your vehicle has been registered on the blockchain</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Registration Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">VIN:</span>
              <p className="font-mono">{registrationResult.data.vin}</p>
            </div>
            <div>
              <span className="text-gray-500">Vehicle Number:</span>
              <p className="font-mono font-semibold text-green-600">{registrationResult.data.vehicleNumber || 'N/A'}</p>
            </div>
            <div>
              <span className="text-gray-500">Vehicle:</span>
              <p>{registrationResult.data.year} {registrationResult.data.make} {registrationResult.data.model}</p>
            </div>
            <div>
              <span className="text-gray-500">Initial Mileage:</span>
              <p>{registrationResult.data.initialMileage.toLocaleString()} miles</p>
            </div>
            <div>
              <span className="text-gray-500">Network:</span>
              <p className="capitalize">{registrationResult.data.network}</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-3">Blockchain Information</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-blue-700">Transaction Hash:</span>
              <p className="font-mono text-xs break-all">{registrationResult.data.transactionHash}</p>
            </div>
            <div>
              <span className="text-blue-700">Blockchain Address:</span>
              <p className="font-mono text-xs break-all">{registrationResult.data.blockchainAddress}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={registrationResult.data.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View on Solana Explorer
          </a>
          <button
            onClick={() => {
              onCancel?.();
            }}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-primary-100 rounded-full mr-3">
            <Car className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Register Vehicle on Blockchain</h2>
            <p className="text-gray-600">Secure your vehicle's identity with blockchain technology</p>
          </div>
        </div>

        {/* User Info */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-sm text-gray-600">
            Registering as: <span className="font-semibold">{user?.firstName} {user?.lastName}</span>
            <span className="ml-2 px-2 py-1 bg-primary-100 text-primary-800 rounded-full text-xs">
              {user?.role?.toUpperCase()}
            </span>
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* VIN Input */}
        <div>
          <label htmlFor="vin" className="block text-sm font-medium text-gray-700 mb-2">
            Vehicle Identification Number (VIN) *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Hash className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="vin"
              type="text"
              maxLength={17}
              {...register('vin')}
              onChange={handleVINChange}
              className={`input-field pl-10 font-mono ${errors.vin ? 'border-red-500' : ''}`}
              placeholder="Enter 17-character VIN"
              disabled={isSubmitting}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <span className="text-xs text-gray-500">{watchedVIN.length}/17</span>
            </div>
          </div>
          {errors.vin && (
            <p className="mt-2 text-sm text-red-600">{errors.vin.message}</p>
          )}
        </div>

        {/* Vehicle Number Input */}
        <div>
          <label htmlFor="vehicleNumber" className="block text-sm font-medium text-gray-700 mb-2">
            Vehicle Number (Indian Format) *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Car className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="vehicleNumber"
              type="text"
              maxLength={20}
              {...register('vehicleNumber')}
              onChange={handleVehicleNumberChange}
              className={`input-field pl-10 font-mono ${errors.vehicleNumber ? 'border-red-500' : ''}`}
              placeholder="e.g., KA01AB1234"
              disabled={isSubmitting}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <span className="text-xs text-gray-500">{watchedVehicleNumber.length}/20</span>
            </div>
          </div>
          {errors.vehicleNumber && (
            <p className="mt-2 text-sm text-red-600">{errors.vehicleNumber.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Format: State Code + District Code + Series + Number (e.g., KA01AB1234)
          </p>
          {watchedVehicleNumber && (
            <p className="mt-1 text-xs text-green-600">
              ✓ Vehicle Number: {watchedVehicleNumber}
            </p>
          )}
          {vehicleNumberValidation.message && (
            <p className={`mt-1 text-xs ${
              vehicleNumberValidation.isRegistered === true 
                ? 'text-red-600' 
                : vehicleNumberValidation.isRegistered === false 
                ? 'text-green-600' 
                : 'text-yellow-600'
            }`}>
              {vehicleNumberValidation.isValidating ? '⏳ ' : ''}{vehicleNumberValidation.message}
            </p>
          )}
        </div>

        {/* Vehicle Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Make */}
          <div>
            <label htmlFor="make" className="block text-sm font-medium text-gray-700 mb-2">
              Make *
            </label>
            <input
              id="make"
              type="text"
              {...register('make')}
              className={`input-field ${errors.make ? 'border-red-500' : ''}`}
              placeholder="e.g., Honda, Toyota"
              disabled={isSubmitting}
            />
            {errors.make && (
              <p className="mt-2 text-sm text-red-600">{errors.make.message}</p>
            )}
          </div>

          {/* Model */}
          <div>
            <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-2">
              Model *
            </label>
            <input
              id="model"
              type="text"
              {...register('model')}
              className={`input-field ${errors.model ? 'border-red-500' : ''}`}
              placeholder="e.g., Civic, Camry"
              disabled={isSubmitting}
            />
            {errors.model && (
              <p className="mt-2 text-sm text-red-600">{errors.model.message}</p>
            )}
          </div>

          {/* Year */}
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
              Year *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="year"
                type="number"
                {...register('year', { valueAsNumber: true })}
                className={`input-field pl-10 ${errors.year ? 'border-red-500' : ''}`}
                placeholder="2023"
                min={1900}
                max={new Date().getFullYear() + 2}
                disabled={isSubmitting}
              />
            </div>
            {errors.year && (
              <p className="mt-2 text-sm text-red-600">{errors.year.message}</p>
            )}
          </div>

          {/* Initial Mileage */}
          <div>
            <label htmlFor="initialMileage" className="block text-sm font-medium text-gray-700 mb-2">
              Current Mileage *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Gauge className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="initialMileage"
                type="number"
                {...register('initialMileage', { valueAsNumber: true })}
                className={`input-field pl-10 ${errors.initialMileage ? 'border-red-500' : ''}`}
                placeholder="50000"
                min={0}
                max={9999999}
                disabled={isSubmitting}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <span className="text-sm text-gray-500">miles</span>
              </div>
            </div>
            {errors.initialMileage && (
              <p className="mt-2 text-sm text-red-600">{errors.initialMileage.message}</p>
            )}
          </div>
        </div>

        {/* Optional Details */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Details (Optional)</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Color */}
            <div>
              <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <input
                id="color"
                type="text"
                {...register('color')}
                className="input-field"
                placeholder="e.g., Black, White, Red"
                disabled={isSubmitting}
              />
            </div>

            {/* Body Type */}
            <div>
              <label htmlFor="bodyType" className="block text-sm font-medium text-gray-700 mb-2">
                Body Type
              </label>
              <select
                id="bodyType"
                {...register('bodyType')}
                className="input-field"
                disabled={isSubmitting}
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
                id="fuelType"
                {...register('fuelType')}
                className="input-field"
                disabled={isSubmitting}
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
                id="transmission"
                {...register('transmission')}
                className="input-field"
                disabled={isSubmitting}
              >
                <option value="automatic">Automatic</option>
                <option value="manual">Manual</option>
                <option value="cvt">CVT</option>
                <option value="semi-automatic">Semi-Automatic</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Registering on Blockchain...
              </>
            ) : (
              <>
                <Car className="w-5 h-5 mr-2" />
                Register Vehicle
              </>
            )}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Blockchain Registration</p>
            <p>Your vehicle will be registered on the Solana blockchain for permanent, tamper-proof records. This process may take a few moments to complete.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleRegistrationForm;
