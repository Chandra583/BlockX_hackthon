import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { VehicleService } from '../../services/vehicle';
import toast from 'react-hot-toast';
import { BlockchainService } from '../../services/blockchain';

const RegisterVehicle: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    vin: '',
    vehicleNumber: '',
    make: '',
    model: '',
    year: '',
    initialMileage: '',
    walletAddress: '',
    color: '',
    bodyType: 'sedan',
    fuelType: 'gasoline',
    transmission: 'automatic',
    engineSize: '',
    condition: 'good',
    description: ''
  });

  // Auto-fill wallet address from user wallet and lock the field
  useEffect(() => {
    const loadWallet = async () => {
      try {
        const wallet = await BlockchainService.getWallet();
        const addr = wallet?.data?.walletAddress || '';
        if (addr) {
          setFormData(prev => ({ ...prev, walletAddress: addr }));
        }
      } catch {
        // no wallet yet; leave empty
      }
    };
    loadWallet();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Validate required fields
      if (!formData.vin || !formData.vehicleNumber || !formData.make || 
          !formData.model || !formData.year || !formData.initialMileage) {
        toast.error('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Confirm immutable mileage logging
      const confirmMsg = `You are about to record the initial/current mileage (${formData.initialMileage} km) on the blockchain for vehicle ${formData.vehicleNumber}. This cannot be reset. Do you want to proceed?`;
      const ok = window.confirm(confirmMsg);
      if (!ok) {
        setLoading(false);
        return;
      }
      
      const registrationData = {
        vin: formData.vin.toUpperCase(),
        vehicleNumber: formData.vehicleNumber.toUpperCase(),
        make: formData.make,
        model: formData.model,
        year: parseInt(formData.year),
        initialMileage: parseInt(formData.initialMileage),
        walletAddress: formData.walletAddress || undefined,
        color: formData.color || undefined,
        bodyType: formData.bodyType || undefined,
        fuelType: formData.fuelType || undefined,
        transmission: formData.transmission || undefined,
        engineSize: formData.engineSize || undefined,
        condition: formData.condition || undefined,
        description: formData.description || undefined
      };
      
      const response = await VehicleService.registerVehicleOnBlockchain(registrationData);
      
      if (response.success) {
        toast.success('Vehicle registered successfully! Awaiting admin verification.');
        navigate('/vehicles');
      } else {
        toast.error(response.message || 'Failed to register vehicle');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.message || 'Failed to register vehicle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Register New Vehicle</h1>
          <p className="text-gray-600">Register your vehicle for blockchain verification</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* VIN */}
              <div className="md:col-span-2">
                <label htmlFor="vin" className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Identification Number (VIN) *
                </label>
                <input
                  type="text"
                  id="vin"
                  name="vin"
                  value={formData.vin}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter 17-character VIN"
                  maxLength={17}
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  17-character unique identifier for your vehicle
                </p>
              </div>

              {/* Vehicle Number */}
              <div className="md:col-span-2">
                <label htmlFor="vehicleNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Registration Number *
                </label>
                <input
                  type="text"
                  id="vehicleNumber"
                  name="vehicleNumber"
                  value={formData.vehicleNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter vehicle registration number"
                  required
                />
              </div>

            {/* Wallet Address */}
            <div className="md:col-span-2">
              <label htmlFor="walletAddress" className="block text-sm font-medium text-gray-700 mb-1">
                Your Wallet Address (Solana)
              </label>
              <input
                type="text"
                id="walletAddress"
                name="walletAddress"
                value={formData.walletAddress}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                placeholder="Paste your wallet address"
                readOnly
              />
              <p className="mt-1 text-xs text-gray-500">
                This is auto-filled from your wallet. Manage it in Wallet section.
              </p>
            </div>

              {/* Make */}
              <div>
                <label htmlFor="make" className="block text-sm font-medium text-gray-700 mb-1">
                  Make *
                </label>
                <input
                  type="text"
                  id="make"
                  name="make"
                  value={formData.make}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Toyota, Ford, Honda"
                  required
                />
              </div>

              {/* Model */}
              <div>
                <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
                  Model *
                </label>
                <input
                  type="text"
                  id="model"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Camry, F-150, Civic"
                  required
                />
              </div>

              {/* Year */}
              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                  Year *
                </label>
                <input
                  type="number"
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., 2023"
                  required
                />
              </div>

              {/* Initial Mileage */}
              <div>
                <label htmlFor="initialMileage" className="block text-sm font-medium text-gray-700 mb-1">
                  Current Mileage *
                </label>
                <input
                  type="number"
                  id="initialMileage"
                  name="initialMileage"
                  value={formData.initialMileage}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., 15000"
                  required
                />
              </div>

              {/* Color */}
              <div>
                <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <input
                  type="text"
                  id="color"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., White, Black, Silver"
                />
              </div>

              {/* Body Type */}
              <div>
                <label htmlFor="bodyType" className="block text-sm font-medium text-gray-700 mb-1">
                  Body Type
                </label>
                <select
                  id="bodyType"
                  name="bodyType"
                  value={formData.bodyType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
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
                <label htmlFor="fuelType" className="block text-sm font-medium text-gray-700 mb-1">
                  Fuel Type
                </label>
                <select
                  id="fuelType"
                  name="fuelType"
                  value={formData.fuelType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
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
                <label htmlFor="transmission" className="block text-sm font-medium text-gray-700 mb-1">
                  Transmission
                </label>
                <select
                  id="transmission"
                  name="transmission"
                  value={formData.transmission}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="automatic">Automatic</option>
                  <option value="manual">Manual</option>
                </select>
              </div>

              {/* Engine Size */}
              <div>
                <label htmlFor="engineSize" className="block text-sm font-medium text-gray-700 mb-1">
                  Engine Size
                </label>
                <input
                  type="text"
                  id="engineSize"
                  name="engineSize"
                  value={formData.engineSize}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., 2.0L, 3.5L"
                />
              </div>

              {/* Condition */}
              <div>
                <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">
                  Condition
                </label>
                <select
                  id="condition"
                  name="condition"
                  value={formData.condition}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Additional details about your vehicle"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/vehicles')}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? 'Registering...' : 'Register Vehicle'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterVehicle;