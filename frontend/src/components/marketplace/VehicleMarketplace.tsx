import React, { useState, useEffect } from 'react';
import { 
  Car, 
  DollarSign, 
  Eye, 
  Heart,
  MapPin,
  Calendar,
  Gauge,
  Shield,
  FileText,
  TrendingUp,
  Star,
  AlertTriangle,
  CheckCircle,
  Plus,
  Search,
  Filter
} from 'lucide-react';

interface Vehicle {
  _id: string;
  vin: string;
  make: string;
  vehicleModel: string;
  year: number;
  color: string;
  currentMileage: number;
  condition: string;
  trustScore: number;
  isForSale: boolean;
  listingStatus: string;
  description?: string;
  features: string[];
  owner: {
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
}

interface MarketplaceListing {
  vehicle: Vehicle;
  askingPrice: number;
  negotiable: boolean;
  listedAt: string;
}

const VehicleMarketplace: React.FC = () => {
  const [myVehicles, setMyVehicles] = useState<Vehicle[]>([]);
  const [marketplaceListings, setMarketplaceListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showListingModal, setShowListingModal] = useState(false);
  const [activeTab, setActiveTab] = useState('browse');
  const [listingData, setListingData] = useState({
    askingPrice: '',
    description: '',
    negotiable: true,
    condition: 'good',
    availableForInspection: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [vehiclesRes, listingsRes] = await Promise.all([
        fetch('/api/vehicles'),
        fetch('/api/marketplace')
      ]);

      if (vehiclesRes.ok) {
        const vehiclesData = await vehiclesRes.json();
        setMyVehicles(vehiclesData.data?.vehicles || []);
      }

      if (listingsRes.ok) {
        const listingsData = await listingsRes.json();
        setMarketplaceListings(listingsData.data?.listings || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleListVehicle = async () => {
    if (!selectedVehicle) return;

    try {
      const response = await fetch('/api/marketplace/list-vehicle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: selectedVehicle._id,
          ...listingData,
          askingPrice: parseFloat(listingData.askingPrice)
        })
      });

      if (response.ok) {
        setShowListingModal(false);
        setSelectedVehicle(null);
        setListingData({
          askingPrice: '',
          description: '',
          negotiable: true,
          condition: 'good',
          availableForInspection: true
        });
        fetchData();
      }
    } catch (error) {
      console.error('Failed to list vehicle:', error);
    }
  };

  const generateHistoryReport = async (vehicleId: string) => {
    try {
      const response = await fetch(`/api/marketplace/vehicle/${vehicleId}/history-report`);
      if (response.ok) {
        const data = await response.json();
        console.log('History report:', data);
        // Handle history report display
      }
    } catch (error) {
      console.error('Failed to generate history report:', error);
    }
  };

  const getConditionBadge = (condition: string) => {
    const conditionConfig = {
      excellent: 'bg-green-100 text-green-800',
      good: 'bg-blue-100 text-blue-800',
      fair: 'bg-yellow-100 text-yellow-800',
      poor: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${conditionConfig[condition as keyof typeof conditionConfig] || conditionConfig.good}`}>
        {condition.charAt(0).toUpperCase() + condition.slice(1)}
      </span>
    );
  };

  const getTrustScoreBadge = (score: number) => {
    let color = 'bg-gray-100 text-gray-800';
    if (score >= 80) color = 'bg-green-100 text-green-800';
    else if (score >= 60) color = 'bg-blue-100 text-blue-800';
    else if (score >= 40) color = 'bg-yellow-100 text-yellow-800';
    else color = 'bg-red-100 text-red-800';

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        <Shield className="w-3 h-3 mr-1" />
        Trust: {score}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Vehicle Marketplace</h1>
        <button 
          onClick={() => setShowListingModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          List Vehicle
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button 
            onClick={() => setActiveTab('browse')}
            className={`border-b-2 py-2 px-1 text-sm font-medium ${
              activeTab === 'browse' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Browse Marketplace
          </button>
          <button 
            onClick={() => setActiveTab('my-vehicles')}
            className={`border-b-2 py-2 px-1 text-sm font-medium ${
              activeTab === 'my-vehicles' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            My Vehicles
          </button>
          <button 
            onClick={() => setActiveTab('my-listings')}
            className={`border-b-2 py-2 px-1 text-sm font-medium ${
              activeTab === 'my-listings' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            My Listings
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'browse' && (
        <div className="space-y-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search vehicles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full max-w-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <input
              type="number"
              placeholder="Min Price"
              value={priceRange.min}
              onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
              className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Max Price"
              value={priceRange.max}
              onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
              className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {marketplaceListings.map((listing) => (
              <div key={listing.vehicle._id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {listing.vehicle.year} {listing.vehicle.make} {listing.vehicle.vehicleModel}
                      </h3>
                      <p className="text-gray-600">{listing.vehicle.color}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        ${listing.askingPrice.toLocaleString()}
                      </p>
                      {listing.negotiable && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Negotiable
                        </span>
                      )}
                    </div>
                  </div>
                
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center text-sm text-gray-600">
                        <Gauge className="w-4 h-4 mr-1" />
                        {listing.vehicle.currentMileage.toLocaleString()} miles
                      </span>
                      {getConditionBadge(listing.vehicle.condition)}
                    </div>

                    <div className="flex items-center justify-between">
                      {getTrustScoreBadge(listing.vehicle.trustScore)}
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Blockchain Verified
                      </span>
                    </div>

                    <div className="flex space-x-2">
                      <button 
                        onClick={() => generateHistoryReport(listing.vehicle._id)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 flex items-center justify-center"
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        History Report
                      </button>
                      <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 text-sm rounded flex items-center justify-center">
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {marketplaceListings.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No vehicles available in the marketplace</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'my-vehicles' && (
        <div className="space-y-4">
          {myVehicles.map((vehicle) => (
            <div key={vehicle._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold">
                      {vehicle.year} {vehicle.make} {vehicle.vehicleModel}
                    </h3>
                    {getConditionBadge(vehicle.condition)}
                    {getTrustScoreBadge(vehicle.trustScore)}
                  </div>
                  
                  <p className="text-gray-600 mb-2">VIN: {vehicle.vin}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                    <span className="flex items-center">
                      <Gauge className="w-4 h-4 mr-1" />
                      {vehicle.currentMileage.toLocaleString()} miles
                    </span>
                    <span className="flex items-center">
                      <Car className="w-4 h-4 mr-1" />
                      {vehicle.color}
                    </span>
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Registered {new Date(vehicle.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {vehicle.features.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {vehicle.features.slice(0, 3).map((feature, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {feature}
                        </span>
                      ))}
                      {vehicle.features.length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          +{vehicle.features.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => generateHistoryReport(vehicle._id)}
                    className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 flex items-center"
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    History Report
                  </button>
                  
                  {!vehicle.isForSale && (
                    <button
                      onClick={() => {
                        setSelectedVehicle(vehicle);
                        setShowListingModal(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-sm rounded flex items-center"
                    >
                      <DollarSign className="w-4 h-4 mr-1" />
                      List for Sale
                    </button>
                  )}
                  
                  {vehicle.isForSale && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Listed for Sale
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {myVehicles.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No vehicles registered</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'my-listings' && (
        <div className="space-y-4">
          {myVehicles
            .filter(vehicle => vehicle.isForSale)
            .map((vehicle) => (
              <div key={vehicle._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold">
                        {vehicle.year} {vehicle.make} {vehicle.vehicleModel}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        vehicle.listingStatus === 'active' ? 'bg-green-100 text-green-800' :
                        vehicle.listingStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {vehicle.listingStatus}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Views:</span>
                        <p className="font-semibold">0</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Inquiries:</span>
                        <p className="font-semibold">0</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Days Listed:</span>
                        <p className="font-semibold">
                          {Math.floor((Date.now() - new Date(vehicle.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50">
                      Edit Listing
                    </button>
                    <button className="px-3 py-1 text-sm border border-red-600 text-red-600 rounded hover:bg-red-50">
                      Remove Listing
                    </button>
                  </div>
                </div>
              </div>
            ))}

          {myVehicles.filter(vehicle => vehicle.isForSale).length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No active listings</p>
            </div>
          )}
        </div>
      )}

      {/* Listing Modal */}
      {showListingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">List Vehicle for Sale</h2>
            
            {selectedVehicle && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold">
                  {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.vehicleModel}
                </h3>
                <p className="text-sm text-gray-600">
                  VIN: {selectedVehicle.vin} • {selectedVehicle.currentMileage.toLocaleString()} miles
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Asking Price ($)</label>
                <input
                  type="number"
                  value={listingData.askingPrice}
                  onChange={(e) => setListingData(prev => ({ ...prev, askingPrice: e.target.value }))}
                  placeholder="Enter asking price"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={listingData.description}
                  onChange={(e) => setListingData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your vehicle..."
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Condition</label>
                <select
                  value={listingData.condition}
                  onChange={(e) => setListingData(prev => ({ ...prev, condition: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={listingData.negotiable}
                    onChange={(e) => setListingData(prev => ({ ...prev, negotiable: e.target.checked }))}
                    className="mr-2"
                  />
                  Price is negotiable
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={listingData.availableForInspection}
                    onChange={(e) => setListingData(prev => ({ ...prev, availableForInspection: e.target.checked }))}
                    className="mr-2"
                  />
                  Available for inspection
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => {
                  setShowListingModal(false);
                  setSelectedVehicle(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleListVehicle}
                disabled={!listingData.askingPrice}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                List Vehicle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleMarketplace;