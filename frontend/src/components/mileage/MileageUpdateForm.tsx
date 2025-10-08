import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Gauge, 
  MapPin, 
  User, 
  AlertCircle, 
  Loader2, 
  CheckCircle,
  ExternalLink,
  Smartphone,
  Car
} from 'lucide-react';
import { useAppSelector } from '../../hooks/redux';
import { VehicleService } from '../../services/vehicle';

// Validation schema
const mileageUpdateSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle selection is required'),
  mileage: z.number()
    .min(0, 'Mileage cannot be negative')
    .max(9999999, 'Mileage seems unrealistic'),
  location: z.string().min(1, 'Location is required').max(200, 'Location too long'),
  source: z.enum(['manual', 'obd_device', 'service_record', 'inspection'], {
    required_error: 'Source is required'
  }),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
});

type MileageUpdateFormData = z.infer<typeof mileageUpdateSchema>;

interface MileageUpdateFormProps {
  vehicleId?: string; // Pre-selected vehicle ID
  onSuccess?: (result: any) => void;
  onCancel?: () => void;
  className?: string;
}

interface MileageUpdateResult {
  success: boolean;
  message: string;
  data: {
    vehicleId: string;
    vin: string;
    previousMileage: number;
    newMileage: number;
    transactionHash: string;
    blockchainAddress: string;
    network: string;
    explorerUrl: string;
    location: string;
    source: string;
  };
}

// Mock vehicle data - in real app, this would come from API
const mockVehicles = [
  { id: '1', name: '2023 Honda Civic - ABC123', vin: '1HGCM82633A123456' },
  { id: '2', name: '2022 Toyota Camry - XYZ789', vin: '4T1C11AK5MU123456' },
  { id: '3', name: '2021 Ford F-150 - DEF456', vin: '1FTFW1ET5MFA12345' },
];

export const MileageUpdateForm: React.FC<MileageUpdateFormProps> = ({
  vehicleId,
  onSuccess,
  onCancel,
  className = ''
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updateResult, setUpdateResult] = useState<MileageUpdateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAppSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<MileageUpdateFormData>({
    resolver: zodResolver(mileageUpdateSchema),
    defaultValues: {
      vehicleId: vehicleId || '',
      mileage: 0,
      location: '',
      source: 'manual',
      notes: '',
    },
  });

  const watchedVehicleId = watch('vehicleId');

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setValue('location', `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        },
        (error) => {
          console.error('Error getting location:', error);
          setValue('location', 'Location unavailable');
        }
      );
    } else {
      setValue('location', 'Geolocation not supported');
    }
  };

  const onSubmit = async (data: MileageUpdateFormData) => {
    setIsSubmitting(true);
    setError(null);
    setUpdateResult(null);

    try {
      const updateData = {
        vehicleId: data.vehicleId,
        mileage: data.mileage,
        location: data.location,
        source: data.source,
        notes: data.notes || undefined,
      };

      console.log('Recording mileage on blockchain:', updateData);

      // Call the blockchain mileage recording API using VehicleService
      const result = await VehicleService.recordMileageOnBlockchain(updateData);

      console.log('Mileage update successful:', result);
      setUpdateResult(result);
      onSuccess?.(result);
      
    } catch (err: any) {
      console.error('Mileage update failed:', err);
      
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to record mileage on blockchain. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'obd_device':
        return <Smartphone className="w-4 h-4" />;
      case 'service_record':
        return <User className="w-4 h-4" />;
      case 'inspection':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Gauge className="w-4 h-4" />;
    }
  };

  const getSourceDescription = (source: string) => {
    switch (source) {
      case 'manual':
        return 'Manually entered by vehicle owner';
      case 'obd_device':
        return 'Automatically recorded by OBD device';
      case 'service_record':
        return 'Recorded during professional service';
      case 'inspection':
        return 'Recorded during official inspection';
      default:
        return '';
    }
  };

  // If update was successful, show success state
  if (updateResult) {
    return (
      <div className={`max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg ${className}`}>
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Mileage Updated Successfully!</h2>
          <p className="text-gray-600">Your mileage has been recorded on the blockchain</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Update Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Vehicle VIN:</span>
              <p className="font-mono">{updateResult.data.vin}</p>
            </div>
            <div>
              <span className="text-gray-500">Previous Mileage:</span>
              <p>{updateResult.data.previousMileage.toLocaleString()} miles</p>
            </div>
            <div>
              <span className="text-gray-500">New Mileage:</span>
              <p className="font-semibold text-green-600">{updateResult.data.newMileage.toLocaleString()} miles</p>
            </div>
            <div>
              <span className="text-gray-500">Location:</span>
              <p>{updateResult.data.location}</p>
            </div>
            <div>
              <span className="text-gray-500">Source:</span>
              <p className="capitalize">{updateResult.data.source.replace('_', ' ')}</p>
            </div>
            <div>
              <span className="text-gray-500">Network:</span>
              <p className="capitalize">{updateResult.data.network}</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-3">Blockchain Information</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-blue-700">Transaction Hash:</span>
              <p className="font-mono text-xs break-all">{updateResult.data.transactionHash}</p>
            </div>
            <div>
              <span className="text-blue-700">Blockchain Address:</span>
              <p className="font-mono text-xs break-all">{updateResult.data.blockchainAddress}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={updateResult.data.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View on Solana Explorer
          </a>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg ${className}`}>
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full mr-3">
            <Gauge className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Update Vehicle Mileage</h2>
            <p className="text-gray-600">Record new mileage on the blockchain</p>
          </div>
        </div>

        {/* User Info */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-sm text-gray-600">
            Recording as: <span className="font-semibold">{user?.firstName} {user?.lastName}</span>
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
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
        {/* Vehicle Selection */}
        <div>
          <label htmlFor="vehicleId" className="block text-sm font-medium text-gray-700 mb-2">
            Select Vehicle *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Car className="h-5 w-5 text-gray-400" />
            </div>
            <select
              id="vehicleId"
              {...register('vehicleId')}
              className={`input-field pl-10 ${errors.vehicleId ? 'border-red-500' : ''}`}
              disabled={isSubmitting || !!vehicleId} // Disable if pre-selected
            >
              <option value="">Select a vehicle...</option>
              {mockVehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.name}
                </option>
              ))}
            </select>
          </div>
          {errors.vehicleId && (
            <p className="mt-2 text-sm text-red-600">{errors.vehicleId.message}</p>
          )}
        </div>

        {/* Mileage Input */}
        <div>
          <label htmlFor="mileage" className="block text-sm font-medium text-gray-700 mb-2">
            Current Mileage *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Gauge className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="mileage"
              type="number"
              {...register('mileage', { valueAsNumber: true })}
              className={`input-field pl-10 ${errors.mileage ? 'border-red-500' : ''}`}
              placeholder="Enter current mileage"
              min={0}
              max={9999999}
              disabled={isSubmitting}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <span className="text-sm text-gray-500">miles</span>
            </div>
          </div>
          {errors.mileage && (
            <p className="mt-2 text-sm text-red-600">{errors.mileage.message}</p>
          )}
        </div>

        {/* Location Input */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
            Location *
          </label>
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="location"
                type="text"
                {...register('location')}
                className={`input-field pl-10 ${errors.location ? 'border-red-500' : ''}`}
                placeholder="Enter location or coordinates"
                disabled={isSubmitting}
              />
            </div>
            <button
              type="button"
              onClick={getCurrentLocation}
              className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              disabled={isSubmitting}
              title="Get current location"
            >
              <MapPin className="w-4 h-4" />
            </button>
          </div>
          {errors.location && (
            <p className="mt-2 text-sm text-red-600">{errors.location.message}</p>
          )}
        </div>

        {/* Source Selection */}
        <div>
          <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-2">
            Mileage Source *
          </label>
          <div className="space-y-3">
            {[
              { value: 'manual', label: 'Manual Entry' },
              { value: 'obd_device', label: 'OBD Device' },
              { value: 'service_record', label: 'Service Record' },
              { value: 'inspection', label: 'Official Inspection' },
            ].map((option) => (
              <label key={option.value} className="flex items-start">
                <input
                  type="radio"
                  {...register('source')}
                  value={option.value}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 mt-1"
                  disabled={isSubmitting}
                />
                <div className="ml-3">
                  <div className="flex items-center">
                    {getSourceIcon(option.value)}
                    <span className="ml-2 text-sm font-medium text-gray-900">{option.label}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{getSourceDescription(option.value)}</p>
                </div>
              </label>
            ))}
          </div>
          {errors.source && (
            <p className="mt-2 text-sm text-red-600">{errors.source.message}</p>
          )}
        </div>

        {/* Notes (Optional) */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            {...register('notes')}
            rows={3}
            className="input-field"
            placeholder="Add any additional notes about this mileage update..."
            disabled={isSubmitting}
          />
          {errors.notes && (
            <p className="mt-2 text-sm text-red-600">{errors.notes.message}</p>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
          <button
            type="submit"
            disabled={isSubmitting || !watchedVehicleId}
            className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Recording on Blockchain...
              </>
            ) : (
              <>
                <Gauge className="w-5 h-5 mr-2" />
                Record Mileage
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
            <p className="font-medium mb-1">Blockchain Recording</p>
            <p>Your mileage update will be permanently recorded on the Solana blockchain for tamper-proof verification. This process may take a few moments to complete.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MileageUpdateForm;
