import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle } from 'lucide-react';

interface InstallStartModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: number;
    vin: string;
    lastVerifiedMileage?: number;
    currentMileage?: number;
  };
  onSubmit: (data: { deviceId: string; initialMileage: number }) => Promise<{ solanaTx?: string; arweaveTx?: string } | void>;
}

const InstallStartModal: React.FC<InstallStartModalProps> = ({ 
  isOpen, 
  onClose, 
  vehicle,
  onSubmit 
}) => {
  const [deviceId, setDeviceId] = useState('');
  const [initialMileage, setInitialMileage] = useState(
    vehicle.currentMileage !== undefined
      ? vehicle.currentMileage.toString()
      : vehicle.lastVerifiedMileage !== undefined
      ? vehicle.lastVerifiedMileage.toString()
      : ''
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<{ solanaTx?: string; arweaveTx?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      const mileage = parseFloat(initialMileage);
      if (isNaN(mileage)) {
        throw new Error('Please enter a valid mileage number');
      }
      
      const result = await onSubmit({ deviceId, initialMileage: mileage });
      
      setSuccess(true);
      if (result) {
        setResult(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start installation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setDeviceId('');
    setInitialMileage(
      vehicle.currentMileage !== undefined
        ? vehicle.currentMileage.toString()
        : vehicle.lastVerifiedMileage !== undefined
        ? vehicle.lastVerifiedMileage.toString()
        : ''
    );
    setError('');
    setSuccess(false);
    setResult(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Start Installation
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {success && result ? (
            <div className="mb-6">
              <div className="flex items-center justify-center mb-4">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <h4 className="text-lg font-medium text-center text-gray-900 mb-2">
                Installation Started Successfully!
              </h4>
              <p className="text-sm text-gray-500 text-center mb-4">
                The installation has been started and anchored to the blockchain.
              </p>
              
              {result.solanaTx && (
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Solana Transaction
                  </label>
                  <a
                    href={`https://explorer.solana.com/tx/${result.solanaTx}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 break-all"
                  >
                    {result.solanaTx.substring(0, 20)}...{result.solanaTx.substring(result.solanaTx.length - 20)}
                  </a>
                </div>
              )}
              
              {result.arweaveTx && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Arweave Transaction
                  </label>
                  <a
                    href={`https://arweave.net/${result.arweaveTx}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 break-all"
                  >
                    {result.arweaveTx.substring(0, 20)}...{result.arweaveTx.substring(result.arweaveTx.length - 20)}
                  </a>
                </div>
              )}
              
              <div className="mt-6">
                <button
                  onClick={handleClose}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-900">{vehicle.year} {vehicle.make} {vehicle.model}</h4>
                  <p className="text-sm text-gray-500">VIN: {vehicle.vin}</p>
                  {(vehicle.currentMileage !== undefined || vehicle.lastVerifiedMileage !== undefined) && (
                    <p className="text-sm text-gray-500">
                      Admin verified mileage: {(vehicle.currentMileage ?? vehicle.lastVerifiedMileage ?? 0).toLocaleString()}
                    </p>
                  )}
                </div>
                
                {vehicle.lastVerifiedMileage !== undefined && parseFloat(initialMileage) < vehicle.lastVerifiedMileage && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 flex items-start">
                    <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800">Mileage Alert</h4>
                      <p className="text-sm text-yellow-700">
                        The entered mileage ({parseFloat(initialMileage).toLocaleString()}) is less than the last verified mileage ({vehicle.lastVerifiedMileage.toLocaleString()}). 
                        This installation will be flagged for review.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="deviceId" className="block text-sm font-medium text-gray-700 mb-1">
                    Device ID
                  </label>
                  <input
                    type="text"
                    id="deviceId"
                    value={deviceId}
                    onChange={(e) => setDeviceId(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Enter device ID"
                    required
                  />
                </div>

                <div className="mb-6">
                  <label htmlFor="initialMileage" className="block text-sm font-medium text-gray-700 mb-1">
                   Enter miles when install time shoing
                  </label>
                  <input
                    type="number"
                    id="initialMileage"
                    value={initialMileage}
                    onChange={(e) => setInitialMileage(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Enter initial mileage"
                    min="0"
                    required
                  />
                  {(vehicle.currentMileage !== undefined || vehicle.lastVerifiedMileage !== undefined) && (
                    <p className="mt-1 text-sm text-gray-500">
                      Registered mileage: {(vehicle.currentMileage ?? vehicle.lastVerifiedMileage ?? 0).toLocaleString()} miles
                    </p>
                  )}
                </div>

                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 sm:text-sm"
                  >
                    {isLoading ? 'Starting...' : 'Start Installation'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstallStartModal;