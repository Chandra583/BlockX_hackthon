import React, { useState, useEffect } from 'react';
import { X, Search, Car, Smartphone, Check } from 'lucide-react';
import { InstallationService } from '../../services/installation';
import { VehicleService } from '../../services/vehicle';

interface NewInstallationRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentUserId: string;
}

interface Vehicle {
  id: string;
  registration: string;
  vin: string;
  make: string;
  model: string;
  year: number;
}

const NewInstallationRequestModal: React.FC<NewInstallationRequestModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentUserId
}) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Step 1: Vehicle selection (no owner selection needed)
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [vehicleSearch, setVehicleSearch] = useState('');
  
  // Step 2: Device details
  const [deviceId, setDeviceId] = useState('');
  
  // Step 3: Notes
  const [notes, setNotes] = useState('');

  // Fetch vehicles for current user when modal opens
  useEffect(() => {
    if (isOpen && currentUserId) {
      fetchOwnerVehicles(currentUserId);
    }
  }, [isOpen, currentUserId]);

  // Filter vehicles based on search
  useEffect(() => {
    if (vehicleSearch) {
      const filtered = vehicles.filter(vehicle => 
        vehicle.registration.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
        vehicle.vin.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
        `${vehicle.year} ${vehicle.make} ${vehicle.model}`.toLowerCase().includes(vehicleSearch.toLowerCase())
      );
      setFilteredVehicles(filtered);
    } else {
      setFilteredVehicles(vehicles);
    }
  }, [vehicleSearch, vehicles]);

  const fetchOwnerVehicles = async (ownerId: string) => {
    try {
      setLoading(true);
      // Only fetch if we have a valid ownerId
      if (ownerId) {
        const response = await InstallationService.getOwnerVehicles(ownerId);
        setVehicles(response.data.vehicles);
        setFilteredVehicles(response.data.vehicles);
      }
    } catch (err) {
      setError('Failed to fetch vehicles');
      console.error('Error fetching vehicles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async () => {
    if (!selectedVehicle) {
      setError('Please select a vehicle');
      return;
    }

    try {
      setLoading(true);
      await InstallationService.createInstallationRequest({
        ownerId: currentUserId,
        vehicleId: selectedVehicle,
        notes
      });
      
      // Clear form fields after successful submission
      setSelectedVehicle('');
      setDeviceId('');
      setNotes('');
      setVehicleSearch('');
      
      onSuccess();
      onClose();
    } catch (err) {
      setError('Failed to create installation request');
      console.error('Error creating request:', err);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  if (!isOpen || !currentUserId) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">New Installation Request</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step >= num ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {num}
                </div>
                {num < 3 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step > num ? 'bg-primary-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Vehicle</span>
            <span>Device</span>
            <span>Notes</span>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Step 1: Vehicle Selection */}
          {step === 1 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Select Vehicle</h3>
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Search by registration, VIN, or make/model..."
                    value={vehicleSearch}
                    onChange={(e) => setVehicleSearch(e.target.value)}
                  />
                </div>
                
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : (
                  <div className="border rounded-lg max-h-60 overflow-y-auto">
                    {filteredVehicles.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No vehicles found
                      </div>
                    ) : (
                      filteredVehicles.map((vehicle) => (
                        <div
                          key={vehicle.id}
                          className={`flex items-center p-4 cursor-pointer hover:bg-gray-50 ${
                            selectedVehicle === vehicle.id ? 'bg-primary-50 border-l-4 border-primary-500' : ''
                          }`}
                          onClick={() => setSelectedVehicle(vehicle.id)}
                        >
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Car className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="ml-4 flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {vehicle.year} {vehicle.make} {vehicle.model}
                            </div>
                            <div className="text-sm text-gray-500">
                              Reg: {vehicle.registration} | VIN: {vehicle.vin}
                            </div>
                          </div>
                          {selectedVehicle === vehicle.id && (
                            <div className="text-primary-600">
                              <Check className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Device Details */}
          {step === 2 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Device Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Device ID (Optional)
                  </label>
                  <input
                    type="text"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter device ID or scan QR code"
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Leave blank to assign later. Device must be available.
                  </p>
                </div>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Smartphone className="mx-auto h-12 w-12 text-gray-400" />
                  <button
                    type="button"
                    className="mt-2 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Scan QR Code
                  </button>
                  <p className="mt-2 text-sm text-gray-500">
                    Scan the device QR code to auto-fill device information
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Notes */}
          {step === 3 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Notes</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Installation Notes
                  </label>
                  <textarea
                    rows={4}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Any special instructions or notes for the installation..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 mb-1">Summary</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Vehicle: {vehicles.find(v => v.id === selectedVehicle)?.year} {vehicles.find(v => v.id === selectedVehicle)?.make} {vehicles.find(v => v.id === selectedVehicle)?.model}</li>
                    <li>• Device ID: {deviceId || 'To be assigned'}</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between px-6 py-4 border-t bg-gray-50">
          <button
            type="button"
            onClick={prevStep}
            disabled={step === 1}
            className={`px-4 py-2 rounded-lg ${
              step === 1 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Back
          </button>
          
          {step < 3 ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={step === 1 && !selectedVehicle}
              className={`px-4 py-2 rounded-lg ${
                step === 1 && !selectedVehicle
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCreateRequest}
              disabled={loading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Request'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewInstallationRequestModal;