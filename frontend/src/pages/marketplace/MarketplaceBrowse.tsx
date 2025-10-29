import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppSelector } from '../../hooks/redux';
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Car,
  DollarSign,
  Calendar,
  TrendingUp,
  RefreshCw,
  Plus,
  Grid3X3,
  List,
  SlidersHorizontal,
  X,
  ChevronDown,
  Star,
  Eye,
  Heart,
  Share2,
  Gauge,
  Shield
} from 'lucide-react';
import { MarketplaceCard } from '../../components/marketplace/MarketplaceCard';
import { ViewReportModal } from '../../components/marketplace/ViewReportModal';
import { RequestBuyModal } from '../../components/marketplace/RequestBuyModal';
import { MarketplaceAPI } from '../../api/marketplace';
import { formatPrice } from '../../utils/formatCurrency';
import type { MarketplaceListing, MarketplaceSearchParams } from '../../api/marketplace';
import toast from 'react-hot-toast';

const MarketplaceBrowse: React.FC = () => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Search and filters
  const [searchParams, setSearchParams] = useState<MarketplaceSearchParams>({
    page: 1,
    limit: 12,
    sort: 'newest'
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [yearRange, setYearRange] = useState({ min: '', max: '' });
  
  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reportVehicleId, setReportVehicleId] = useState<string | null>(null);

  // Available options for filters
  const [availableMakes, setAvailableMakes] = useState<string[]>([]);
  const [statistics, setStatistics] = useState<any>(null);

  useEffect(() => {
    fetchListings();
    fetchStatistics();
  }, [searchParams]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        ...searchParams,
        q: searchTerm || undefined,
        minPrice: priceRange.min ? parseFloat(priceRange.min) : undefined,
        maxPrice: priceRange.max ? parseFloat(priceRange.max) : undefined,
        make: selectedMake || undefined,
        condition: selectedCondition || undefined,
        yearMin: yearRange.min ? parseInt(yearRange.min) : undefined,
        yearMax: yearRange.max ? parseInt(yearRange.max) : undefined
      };

      const response = await MarketplaceAPI.getListings(params);
      setListings(response.data.listings);
      setTotalCount(response.data.total);
      setCurrentPage(response.data.page);
      setTotalPages(response.data.totalPages);
      
      // Extract unique makes for filter
      const makes = [...new Set(response.data.listings.map(l => l.vehicle.make))];
      setAvailableMakes(makes);
    } catch (error: any) {
      console.error('Failed to fetch listings:', error);
      setError(error.message || 'Failed to fetch marketplace listings');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const stats = await MarketplaceAPI.getStatistics();
      setStatistics(stats.data);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  const handleSearch = () => {
    setSearchParams(prev => ({ ...prev, page: 1 }));
    fetchListings();
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setPriceRange({ min: '', max: '' });
    setSelectedMake('');
    setSelectedCondition('');
    setYearRange({ min: '', max: '' });
    setSearchParams({ page: 1, limit: 12, sort: 'newest' });
  };

  const handleSortChange = (sort: MarketplaceSearchParams['sort']) => {
    setSearchParams(prev => ({ ...prev, sort, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setSearchParams(prev => ({ ...prev, page }));
  };

  const handleViewReport = (vehicleId: string) => {
    setReportVehicleId(vehicleId);
    setShowReportModal(true);
  };

  const handleViewDetails = (listing: MarketplaceListing) => {
    setSelectedListing(listing);
    setShowRequestModal(true);
  };

  const handleRequestToBuy = (listing: MarketplaceListing) => {
    if (!isAuthenticated) {
      toast.error('Please login to request a purchase');
      return;
    }
    
    // Check if user is trying to buy their own vehicle
    if (user?.id === listing.vehicle.owner.id) {
      toast.error('You cannot purchase your own vehicle');
      return;
    }
    
    setSelectedListing(listing);
    setShowRequestModal(true);
  };

  const sortOptions = [
    { value: 'newest', label: 'Newest First', icon: Calendar },
    { value: 'price-low', label: 'Price: Low to High', icon: SortAsc },
    { value: 'price-high', label: 'Price: High to Low', icon: SortDesc },
    { value: 'mileage-low', label: 'Lowest Mileage', icon: TrendingUp },
    { value: 'year-new', label: 'Newest Year', icon: Calendar }
  ];

  const conditionOptions = [
    { value: '', label: 'All Conditions' },
    { value: 'excellent', label: 'Excellent' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'poor', label: 'Poor' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Vehicle Marketplace
              </h1>
              <p className="text-slate-300 text-lg">
                Discover verified vehicles with blockchain trust
              </p>
              {statistics && (
                <div className="flex items-center space-x-6 mt-4 text-sm text-slate-400">
                  <span className="flex items-center space-x-2">
                    <Car className="w-4 h-4" />
                    <span>{statistics.totalListings || totalCount} vehicles</span>
                  </span>
                  <span className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>{statistics.averagePrice ? formatPrice(statistics.averagePrice) : 'N/A'} avg</span>
                  </span>
                  <span className="flex items-center space-x-2">
                    <Star className="w-4 h-4" />
                    <span>{statistics.averageTrustScore || 'N/A'} avg TrustScore</span>
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-xl transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filters</span>
              </motion.button>
              
              <div className="flex items-center bg-slate-700/50 rounded-xl p-1">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <List className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          {/* Main Search Bar */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by make, model, VIN, or year..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors"
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSearch}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-blue-500/25 flex items-center space-x-2"
                >
                  <Search className="w-4 h-4" />
                  <span>Search</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={fetchListings}
                  className="px-4 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-xl transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            {/* Advanced Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-6 pt-6 border-t border-slate-700/50"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Price Range */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Price Range
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          placeholder="Min"
                          value={priceRange.min}
                          onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                          className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors"
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          value={priceRange.max}
                          onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                          className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Make Filter */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Make
                      </label>
                      <select
                        value={selectedMake}
                        onChange={(e) => setSelectedMake(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors"
                      >
                        <option value="">All Makes</option>
                        {availableMakes.map(make => (
                          <option key={make} value={make}>{make}</option>
                        ))}
                      </select>
                    </div>

                    {/* Condition Filter */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Condition
                      </label>
                      <select
                        value={selectedCondition}
                        onChange={(e) => setSelectedCondition(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors"
                      >
                        {conditionOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Year Range */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Year Range
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          placeholder="Min"
                          value={yearRange.min}
                          onChange={(e) => setYearRange(prev => ({ ...prev, min: e.target.value }))}
                          className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors"
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          value={yearRange.max}
                          onChange={(e) => setYearRange(prev => ({ ...prev, max: e.target.value }))}
                          className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleClearFilters}
                      className="px-4 py-2 text-slate-400 hover:text-white transition-colors flex items-center space-x-2"
                    >
                      <X className="w-4 h-4" />
                      <span>Clear Filters</span>
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSearch}
                      className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-green-500/25"
                    >
                      Apply Filters
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Sort Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <span className="text-slate-300 font-medium">Sort by:</span>
              <div className="flex flex-wrap gap-2">
                {sortOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <motion.button
                      key={option.value}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSortChange(option.value as MarketplaceSearchParams['sort'])}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                        searchParams.sort === option.value
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                          : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{option.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
            
            <div className="text-sm text-slate-400">
              Showing {listings.length} of {totalCount} vehicles
            </div>
          </div>
        </motion.div>

        {/* Results */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-slate-800/30 rounded-2xl p-6 animate-pulse">
                  <div className="h-48 bg-slate-700/50 rounded-xl mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-slate-700/50 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-700/50 rounded w-1/2"></div>
                    <div className="h-3 bg-slate-700/50 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Error Loading Listings</h3>
              <p className="text-slate-400 mb-4">{error}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={fetchListings}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
              >
                Try Again
              </motion.button>
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Car className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Vehicles Found</h3>
              <p className="text-slate-400 mb-4">
                No vehicles match your current search criteria. Try adjusting your filters.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClearFilters}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-green-500/25"
              >
                Clear Filters
              </motion.button>
            </div>
          ) : (
            <>
              {/* Grid View */}
              {viewMode === 'grid' && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {listings.map((listing, index) => (
                    <MarketplaceCard
                      key={listing.id}
                      listing={listing}
                      index={index}
                      onViewDetails={handleViewDetails}
                      onViewReport={handleViewReport}
                      onRequestToBuy={handleRequestToBuy}
                      showBuyButton={isAuthenticated}
                    />
                  ))}
                </div>
              )}

              {/* List View */}
              {viewMode === 'list' && (
                <div className="space-y-4">
                  {listings.map((listing, index) => (
                    <motion.div
                      key={listing.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden hover:border-slate-600/50 transition-all duration-300"
                    >
                      <div className="flex flex-col lg:flex-row">
                        {/* Image */}
                        <div className="w-full lg:w-64 h-48 lg:h-auto bg-gradient-to-br from-slate-700/30 to-slate-800/30 flex items-center justify-center">
                          <Car className="w-12 h-12 text-slate-400" />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 p-6">
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-white mb-2">
                                {listing.vehicle.year} {listing.vehicle.make} {listing.vehicle.model}
                              </h3>
                              <div className="flex items-center space-x-4 text-sm text-slate-300 mb-3">
                                <span className="flex items-center space-x-1">
                                  <Gauge className="w-4 h-4" />
                                  <span>{listing.vehicle.currentMileage.toLocaleString()} km</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Shield className="w-4 h-4" />
                                  <span>TrustScore: {listing.vehicle.trustScore}/100</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>Listed {new Date(listing.listedAt).toLocaleDateString()}</span>
                                </span>
                              </div>
                              <p className="text-slate-400 text-sm mb-4">
                                {listing.description || 'No description provided'}
                              </p>
                            </div>
                            
                            <div className="flex flex-col items-end space-y-3">
                              <div className="text-right">
                                <div className="text-2xl font-bold text-green-400">
                                  {formatPrice(listing.price)}
                                </div>
                                {listing.negotiable && (
                                  <div className="text-xs text-slate-400">Negotiable</div>
                                )}
                              </div>
                              
                              <div className="flex space-x-2">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleViewReport(listing.vehicle.id)}
                                  className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-xl font-medium transition-colors flex items-center space-x-2"
                                >
                                  <Shield className="w-4 h-4" />
                                  <span>Report</span>
                                </motion.button>
                                
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleViewDetails(listing)}
                                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-blue-500/25 flex items-center space-x-2"
                                >
                                  <Eye className="w-4 h-4" />
                                  <span>View Details</span>
                                </motion.button>

                                {isAuthenticated && (
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleRequestToBuy(listing)}
                                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-green-500/25 flex items-center space-x-2"
                                  >
                                    <DollarSign className="w-4 h-4" />
                                    <span>Request to Buy</span>
                                  </motion.button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center justify-center space-x-2 mt-8"
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </motion.button>
                  
                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    const isCurrentPage = page === currentPage;
                    
                    return (
                      <motion.button
                        key={page}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handlePageChange(page)}
                        className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                          isCurrentPage
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:text-white'
                        }`}
                      >
                        {page}
                      </motion.button>
                    );
                  })}
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </motion.button>
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      </div>

      {/* Modals */}
      <ViewReportModal
        isOpen={showReportModal}
        onClose={() => {
          setShowReportModal(false);
          setReportVehicleId(null);
        }}
        vehicleId={reportVehicleId || ''}
        onRequestToBuy={(vehicleId) => {
          // Find the listing by vehicle ID and call handleRequestToBuy
          const listing = listings.find(l => l.vehicle.id === vehicleId);
          if (listing) {
            handleRequestToBuy(listing);
          }
        }}
      />

      <RequestBuyModal
        isOpen={showRequestModal}
        onClose={() => {
          setShowRequestModal(false);
          setSelectedListing(null);
        }}
        listing={selectedListing!}
        onSuccess={() => {
          setShowRequestModal(false);
          setSelectedListing(null);
          fetchListings(); // Refresh listings to update inquiry count
        }}
      />
    </div>
  );
};

export default MarketplaceBrowse;
