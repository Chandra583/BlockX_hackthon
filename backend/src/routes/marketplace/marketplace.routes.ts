import { Router } from 'express';
import MarketplaceController from '../../controllers/vehicle/marketplace.controller';
import { authenticate, optionalAuth } from '../../middleware/auth.middleware';

const router = Router();

/**
 * @route POST /api/marketplace/list-vehicle
 * @desc List vehicle for sale with automatic history report generation
 * @access Owner only
 */
router.post('/list-vehicle', authenticate, MarketplaceController.listVehicleForSale);

/**
 * @route GET /api/marketplace/vehicle/:vehicleId/history-report
 * @desc Generate vehicle history report
 * @access Public (with optional auth for enhanced data)
 */
router.get('/vehicle/:vehicleId/history-report', optionalAuth, MarketplaceController.generateHistoryReport);

/**
 * @route GET /api/marketplace/listings
 * @desc Get marketplace listings
 * @access Public
 */
router.get('/listings', MarketplaceController.getMarketplaceListings);

/**
 * @route GET /api/marketplace/vehicle/:vehicleId
 * @desc Get vehicle details for marketplace
 * @access Public
 */
router.get('/vehicle/:vehicleId', MarketplaceController.getVehicleDetails);

/**
 * @route PUT /api/marketplace/vehicle/:vehicleId/listing
 * @desc Update vehicle listing
 * @access Owner only
 */
router.put('/vehicle/:vehicleId/listing', authenticate, MarketplaceController.updateVehicleListing);

/**
 * @route DELETE /api/marketplace/vehicle/:vehicleId/listing
 * @desc Remove vehicle from marketplace
 * @access Owner only
 */
router.delete('/vehicle/:vehicleId/listing', authenticate, MarketplaceController.removeVehicleListing);

/**
 * @route GET /api/marketplace/vehicle/:vehicleId/market-analysis
 * @desc Get market analysis for vehicle
 * @access Public
 */
router.get('/vehicle/:vehicleId/market-analysis', MarketplaceController.getMarketAnalysis);

/**
 * @route GET /api/marketplace/search
 * @desc Search marketplace
 * @access Public
 */
router.get('/search', MarketplaceController.searchMarketplace);

/**
 * @route GET /api/marketplace/statistics
 * @desc Get marketplace statistics
 * @access Public
 */
router.get('/statistics', MarketplaceController.getMarketplaceStatistics);

export default router;
