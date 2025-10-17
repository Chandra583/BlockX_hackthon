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
  Filter,
  Edit,
  Trash2,
  BarChart3,
  Users,
  Clock,
  Image as ImageIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  Button, 
  Card, 
  Badge, 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent,
  SearchInput,
  EmptyState,
  PageLoader,
  Modal,
  Input,
  TrustScoreBadge
} from '../ui';
import toast from 'react-hot-toast';

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
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
  const [activeTab, setActiveTab] = useState('browse');
  const [sortBy, setSortBy] = useState('newest');
  const [filterCondition, setFilterCondition] = useState('all');
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
        toast.success('Vehicle listed successfully!');
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
      } else {
        toast.error('Failed to list vehicle');
      }
    } catch (error) {
      console.error('Failed to list vehicle:', error);
      toast.error('Failed to list vehicle');
    }
  };

  const viewVehicleDetails = (listing: MarketplaceListing) => {
    setSelectedListing(listing);
    setShowVehicleModal(true);
  };

  const generateHistoryReport = async (vehicleId: string) => {
    try {
      toast.loading('Generating history report...');
      const response = await fetch(`/api/marketplace/vehicle/${vehicleId}/history-report`);
      if (response.ok) {
        const data = await response.json();
        toast.success('History report generated successfully!');
        console.log('History report:', data);
        // Handle history report display - could open a modal or download
      } else {
        toast.error('Failed to generate history report');
      }
    } catch (error) {
      console.error('Failed to generate history report:', error);
      toast.error('Failed to generate history report');
    }
  };

  // Filter and sort listings
  const filteredListings = marketplaceListings.filter(listing => {
    const matchesSearch = 
      listing.vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.vehicle.vehicleModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.vehicle.year.toString().includes(searchTerm);
    
    const matchesPrice = 
      (!priceRange.min || listing.askingPrice >= parseFloat(priceRange.min)) &&
      (!priceRange.max || listing.askingPrice <= parseFloat(priceRange.max));
    
    const matchesCondition = filterCondition === 'all' || listing.vehicle.condition === filterCondition;
    
    return matchesSearch && matchesPrice && matchesCondition;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.askingPrice - b.askingPrice;
      case 'price-high':
        return b.askingPrice - a.askingPrice;
      case 'mileage-low':
        return a.vehicle.currentMileage - b.vehicle.currentMileage;
      case 'year-new':
        return b.vehicle.year - a.vehicle.year;
      case 'newest':
      default:
        return new Date(b.listedAt).getTime() - new Date(a.listedAt).getTime();
    }
  });

  const getConditionColor = (condition: string) => {
    const conditionConfig = {
      excellent: 'success' as const,
      good: 'info' as const,
      fair: 'warning' as const,
      poor: 'error' as const
    };
    return conditionConfig[condition as keyof typeof conditionConfig] || 'info';
  };

  if (loading) {
    return <PageLoader text="Loading marketplace..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vehicle Marketplace</h1>
          <p className="text-gray-600 mt-1">Buy and sell verified vehicles with blockchain trust</p>
        </div>
        <Button 
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setShowListingModal(true)}
        >
          List Vehicle
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger 
            value="browse" 
            icon={<Search className="w-4 h-4" />}
          >
            Browse ({filteredListings.length})
          </TabsTrigger>
          <TabsTrigger 
            value="my-vehicles" 
            icon={<Car className="w-4 h-4" />}
          >
            My Vehicles ({myVehicles.length})
          </TabsTrigger>
          <TabsTrigger 
            value="my-listings" 
            icon={<BarChart3 className="w-4 h-4" />}
            badge={myVehicles.filter(v => v.isForSale).length > 0 ? 
              <Badge variant="info" size="sm">{myVehicles.filter(v => v.isForSale).length}</Badge> : undefined}
          >
            My Listings
          </TabsTrigger>
        </TabsList>

        {/* Browse Marketplace Tab */}
        <TabsContent value="browse">
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <SearchInput
                  placeholder="Search by make, model, or year..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClear={() => setSearchTerm('')}
                />
              </div>
              
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min Price"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                  className="w-32"
                />
                <Input
                  type="number"
                  placeholder="Max Price"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                  className="w-32"
                />
                <select
                  value={filterCondition}
                  onChange={(e) => setFilterCondition(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Conditions</option>
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="mileage-low">Lowest Mileage</option>
                  <option value="year-new">Newest Year</option>
                </select>
              </div>
            </div>

            {/* Vehicle Grid */}
            {filteredListings.length === 0 ? (
              <EmptyState
                icon={<Car className="w-16 h-16" />}
                title="No vehicles found"
                description="No vehicles match your current search criteria. Try adjusting your filters."
                action={{
                  label: "Clear Filters",
                  onClick: () => {
                    setSearchTerm('');
                    setPriceRange({ min: '', max: '' });
                    setFilterCondition('all');
                    setSortBy('newest');
                  }
                }}
              />
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredListings.map((listing, index) => (
                  <motion.div
                    key={listing.vehicle._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card hover interactive className="h-full">
                      {/* Vehicle Image Placeholder */}
                      <div className="h-48 bg-gray-100 rounded-t-lg flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-gray-400" />
                      </div>
                      
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {listing.vehicle.year} {listing.vehicle.make} {listing.vehicle.vehicleModel}
                            </h3>
                            <p className="text-gray-600">{listing.vehicle.color}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-600">
                              ${listing.askingPrice.toLocaleString()}
                            </p>
                            {listing.negotiable && (
                              <Badge variant="secondary" size="sm">Negotiable</Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center text-sm text-gray-600">
                              <Gauge className="w-4 h-4 mr-1" />
                              {listing.vehicle.currentMileage.toLocaleString()} miles
                            </span>
                            <Badge variant={getConditionColor(listing.vehicle.condition)}>
                              {listing.vehicle.condition.charAt(0).toUpperCase() + listing.vehicle.condition.slice(1)}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between">
                            <TrustScoreBadge score={listing.vehicle.trustScore} icon={<Shield className="w-3 h-3" />} />
                            <Badge variant="secondary" icon={<CheckCircle className="w-3 h-3" />}>
                              Blockchain Verified
                            </Badge>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              icon={<FileText className="w-4 h-4" />}
                              onClick={() => generateHistoryReport(listing.vehicle._id)}
                              fullWidth
                            >
                              History
                            </Button>
                            <Button
                              size="sm"
                              icon={<Eye className="w-4 h-4" />}
                              onClick={() => viewVehicleDetails(listing)}
                              fullWidth
                            >
                              Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* My Vehicles Tab */}
        <TabsContent value="my-vehicles">
          {myVehicles.length === 0 ? (
            <EmptyState
              icon={<Car className="w-16 h-16" />}
              title="No vehicles registered"
              description="You haven't registered any vehicles yet. Register your first vehicle to get started."
              action={{
                label: "Register Vehicle",
                onClick: () => toast.info("Vehicle registration feature coming soon!")
              }}
            />
          ) : (
            <div className="space-y-4">
              {myVehicles.map((vehicle, index) => (
                <motion.div
                  key={vehicle._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card hover className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {vehicle.year} {vehicle.make} {vehicle.vehicleModel}
                          </h3>
                          <Badge variant={getConditionColor(vehicle.condition)}>
                            {vehicle.condition.charAt(0).toUpperCase() + vehicle.condition.slice(1)}
                          </Badge>
                          <TrustScoreBadge score={vehicle.trustScore} icon={<Shield className="w-3 h-3" />} />
                          {vehicle.isForSale && (
                            <Badge variant="success" icon={<DollarSign className="w-3 h-3" />}>
                              Listed for Sale
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-gray-600 mb-3">VIN: {vehicle.vin}</p>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                          <span className="flex items-center gap-1">
                            <Gauge className="w-4 h-4" />
                            {vehicle.currentMileage.toLocaleString()} miles
                          </span>
                          <span className="flex items-center gap-1">
                            <Car className="w-4 h-4" />
                            {vehicle.color}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Registered {new Date(vehicle.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {vehicle.features.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {vehicle.features.slice(0, 3).map((feature, idx) => (
                              <Badge key={idx} variant="secondary" size="sm">
                                {feature}
                              </Badge>
                            ))}
                            {vehicle.features.length > 3 && (
                              <Badge variant="secondary" size="sm">
                                +{vehicle.features.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<FileText className="w-4 h-4" />}
                          onClick={() => generateHistoryReport(vehicle._id)}
                        >
                          History Report
                        </Button>
                        
                        {!vehicle.isForSale && (
                          <Button
                            size="sm"
                            icon={<DollarSign className="w-4 h-4" />}
                            onClick={() => {
                              setSelectedVehicle(vehicle);
                              setShowListingModal(true);
                            }}
                          >
                            List for Sale
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* My Listings Tab */}
        <TabsContent value="my-listings">
          {myVehicles.filter(vehicle => vehicle.isForSale).length === 0 ? (
            <EmptyState
              icon={<BarChart3 className="w-16 h-16" />}
              title="No active listings"
              description="You don't have any vehicles listed for sale. List a vehicle to start selling."
              action={{
                label: "List Vehicle",
                onClick: () => setShowListingModal(true)
              }}
            />
          ) : (
            <div className="space-y-4">
              {myVehicles
                .filter(vehicle => vehicle.isForSale)
                .map((vehicle, index) => (
                  <motion.div
                    key={vehicle._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card hover className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3 mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {vehicle.year} {vehicle.make} {vehicle.vehicleModel}
                            </h3>
                            <Badge 
                              variant={vehicle.listingStatus === 'active' ? 'success' : 
                                      vehicle.listingStatus === 'pending' ? 'warning' : 'secondary'}
                            >
                              {vehicle.listingStatus}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500 block">Views</span>
                              <p className="font-semibold text-gray-900">0</p>
                            </div>
                            <div>
                              <span className="text-gray-500 block">Inquiries</span>
                              <p className="font-semibold text-gray-900">0</p>
                            </div>
                            <div>
                              <span className="text-gray-500 block">Days Listed</span>
                              <p className="font-semibold text-gray-900">
                                {Math.floor((Date.now() - new Date(vehicle.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<Edit className="w-4 h-4" />}
                            onClick={() => toast.info("Edit listing feature coming soon!")}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            icon={<Trash2 className="w-4 h-4" />}
                            onClick={() => toast.info("Remove listing feature coming soon!")}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Vehicle Details Modal */}
      <Modal
        isOpen={showVehicleModal}
        onClose={() => setShowVehicleModal(false)}
        title={selectedListing ? `${selectedListing.vehicle.year} ${selectedListing.vehicle.make} ${selectedListing.vehicle.vehicleModel}` : ''}
        size="lg"
      >
        {selectedListing && (
          <div className="space-y-6">
            {/* Vehicle Image Placeholder */}
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <ImageIcon className="w-16 h-16 text-gray-400" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Vehicle Details</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-500">Make:</span> {selectedListing.vehicle.make}</p>
                  <p><span className="text-gray-500">Model:</span> {selectedListing.vehicle.vehicleModel}</p>
                  <p><span className="text-gray-500">Year:</span> {selectedListing.vehicle.year}</p>
                  <p><span className="text-gray-500">Color:</span> {selectedListing.vehicle.color}</p>
                  <p><span className="text-gray-500">VIN:</span> {selectedListing.vehicle.vin}</p>
                  <p><span className="text-gray-500">Mileage:</span> {selectedListing.vehicle.currentMileage.toLocaleString()} miles</p>
                  <p><span className="text-gray-500">Condition:</span> {selectedListing.vehicle.condition}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Listing Information</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-500">Price:</span> ${selectedListing.askingPrice.toLocaleString()}</p>
                  <p><span className="text-gray-500">Negotiable:</span> {selectedListing.negotiable ? 'Yes' : 'No'}</p>
                  <p><span className="text-gray-500">Trust Score:</span> {selectedListing.vehicle.trustScore}/100</p>
                  <p><span className="text-gray-500">Listed:</span> {new Date(selectedListing.listedAt).toLocaleDateString()}</p>
                  <p><span className="text-gray-500">Owner:</span> {selectedListing.vehicle.owner.firstName} {selectedListing.vehicle.owner.lastName}</p>
                </div>
              </div>
            </div>

            {selectedListing.vehicle.features.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Features</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedListing.vehicle.features.map((feature, index) => (
                    <Badge key={index} variant="secondary">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                icon={<FileText className="w-4 h-4" />}
                onClick={() => generateHistoryReport(selectedListing.vehicle._id)}
                fullWidth
              >
                Generate History Report
              </Button>
              <Button
                icon={<Users className="w-4 h-4" />}
                onClick={() => toast.info("Contact seller feature coming soon!")}
                fullWidth
              >
                Contact Seller
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* List Vehicle Modal */}
      <Modal
        isOpen={showListingModal}
        onClose={() => {
          setShowListingModal(false);
          setSelectedVehicle(null);
        }}
        title="List Vehicle for Sale"
        size="lg"
      >
        {selectedVehicle && (
          <div className="space-y-6">
            <Card variant="filled" className="p-4">
              <h3 className="font-semibold">
                {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.vehicleModel}
              </h3>
              <p className="text-sm text-gray-600">
                VIN: {selectedVehicle.vin} • {selectedVehicle.currentMileage.toLocaleString()} miles
              </p>
            </Card>

            <div className="space-y-4">
              <Input
                label="Asking Price ($)"
                type="number"
                value={listingData.askingPrice}
                onChange={(e) => setListingData(prev => ({ ...prev, askingPrice: e.target.value }))}
                placeholder="Enter asking price"
                fullWidth
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={listingData.description}
                  onChange={(e) => setListingData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your vehicle..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                <select
                  value={listingData.condition}
                  onChange={(e) => setListingData(prev => ({ ...prev, condition: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={listingData.negotiable}
                    onChange={(e) => setListingData(prev => ({ ...prev, negotiable: e.target.checked }))}
                    className="mr-2 rounded"
                  />
                  Price is negotiable
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={listingData.availableForInspection}
                    onChange={(e) => setListingData(prev => ({ ...prev, availableForInspection: e.target.checked }))}
                    className="mr-2 rounded"
                  />
                  Available for inspection
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowListingModal(false);
                  setSelectedVehicle(null);
                }}
                fullWidth
              >
                Cancel
              </Button>
              <Button
                onClick={handleListVehicle}
                disabled={!listingData.askingPrice}
                fullWidth
              >
                List Vehicle
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default VehicleMarketplace;