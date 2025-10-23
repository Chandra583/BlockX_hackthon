# Telemetry Batch Anchoring Migration Notes

## Overview

This document outlines the migration from the existing telemetry system to the new batch anchoring system. The migration is designed to be backwards compatible and safe.

## What Changed

### Database Schema Changes
- **TelemetryBatch Model**: Enhanced with new fields for blockchain anchoring
- **New Fields Added**:
  - `date`: ISO date string (YYYY-MM-DD)
  - `segments`: Array of telemetry segments
  - `totalDistance`: Total distance for the day
  - `segmentsCount`: Number of segments
  - `merkleRoot`: Merkle tree root hash
  - `arweaveTx`: Arweave transaction hash
  - `solanaTx`: Solana transaction hash
  - `status`: Batch processing status
  - `lastError`: Error message if processing failed

### API Changes
- **Enhanced Endpoints**: Existing endpoints now return additional blockchain data
- **New Endpoints**: Added manual consolidation endpoint
- **Backwards Compatible**: All existing API calls continue to work

### Frontend Changes
- **Enhanced UI**: Daily Batches component now shows transaction hashes and status
- **New Features**: Copy transaction hashes, open explorer links
- **Status Indicators**: Visual status badges for batch processing

## Migration Steps

### 1. Database Migration
```bash
# Run the migration script
node scripts/migrate-telemetry-to-batch.js
```

### 2. Environment Setup
```bash
# Update .env with new variables
cp .env.example .env
# Edit .env with your blockchain keys
```

### 3. Service Restart
```bash
# Restart backend services
npm run dev
```

### 4. Verification
```bash
# Check migration results
curl http://localhost:3000/api/vehicles/{vehicleId}/telemetry-batches
```

## Backwards Compatibility

### Existing Data
- **Telemetry Records**: All existing telemetry records are preserved
- **Vehicle Data**: No changes to vehicle records
- **Device Data**: No changes to device records
- **User Data**: No changes to user records

### API Compatibility
- **GET /api/vehicles/:id/telemetry-batches**: Enhanced with new fields, backwards compatible
- **POST /api/device/status**: No changes, continues to work as before
- **All other endpoints**: No changes

### Frontend Compatibility
- **Existing Components**: Continue to work without changes
- **New Features**: Added as enhancements, not replacements
- **Data Display**: Enhanced with new information, existing data still shown

## Rollback Plan

If issues occur, you can rollback by:

### 1. Database Rollback
```bash
# Remove new batch records (optional)
db.telemetrybatches.deleteMany({})

# Revert to previous schema (if needed)
# This would require restoring from backup
```

### 2. Code Rollback
```bash
# Revert to previous commit
git revert <commit-hash>

# Or checkout previous version
git checkout <previous-tag>
```

### 3. Service Rollback
```bash
# Restart with previous version
npm run start
```

## Testing After Migration

### 1. Verify Data Integrity
```bash
# Check that all vehicles have batch records
curl http://localhost:3000/api/vehicles/{vehicleId}/telemetry-batches
```

### 2. Test New Features
```bash
# Test manual consolidation
curl -X POST http://localhost:3000/api/vehicles/{vehicleId}/consolidate-batch \
  -H "Content-Type: application/json" \
  -d '{"date": "2025-01-15"}'
```

### 3. Check Frontend
- Navigate to vehicle details page
- Verify transaction hashes are displayed
- Test copy and explorer link functionality

## Performance Impact

### Database
- **New Indexes**: Added for performance, minimal impact
- **Storage**: Slight increase due to new fields
- **Queries**: Optimized with proper indexing

### API Response Times
- **Enhanced Endpoints**: Slightly slower due to additional data
- **New Endpoints**: Normal response times
- **Overall Impact**: Minimal (< 100ms increase)

### Frontend
- **New Components**: Minimal impact on load times
- **Enhanced Display**: Slightly more data to render
- **Overall Impact**: Negligible

## Monitoring

### Key Metrics to Watch
1. **Batch Processing Success Rate**: Should be > 95%
2. **Blockchain Transaction Success**: Monitor Solana/Arweave failures
3. **Database Performance**: Watch for slow queries
4. **API Response Times**: Monitor for degradation

### Alerts to Set Up
1. **Batch Processing Failures**: Alert if > 10% failure rate
2. **Blockchain Failures**: Alert on consecutive failures
3. **Database Errors**: Alert on connection issues
4. **API Errors**: Alert on 5xx errors

## Troubleshooting

### Common Issues

#### 1. Migration Script Fails
```bash
# Check database connection
mongosh --eval "db.adminCommand('ping')"

# Check environment variables
echo $MONGODB_URI
```

#### 2. Blockchain Integration Fails
```bash
# Check Solana RPC
curl https://api.devnet.solana.com -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'

# Check Arweave gateway
curl https://arweave.net/health
```

#### 3. Frontend Display Issues
```bash
# Check API responses
curl http://localhost:3000/api/vehicles/{vehicleId}/telemetry-batches

# Check browser console for errors
```

### Recovery Procedures

#### 1. Partial Migration Failure
- Re-run migration script (idempotent)
- Check logs for specific errors
- Fix issues and retry

#### 2. Blockchain Integration Issues
- Check environment variables
- Verify wallet funding
- Test with manual consolidation

#### 3. Frontend Issues
- Clear browser cache
- Check API connectivity
- Verify environment variables

## Support

### Documentation
- **API Docs**: http://localhost:3000/api/docs
- **System Docs**: `backend/docs/batch-anchoring.md`
- **Migration Guide**: This document

### Logs
- **Application Logs**: `backend/logs/`
- **Error Logs**: `backend/logs/error-*.log`
- **Combined Logs**: `backend/logs/combined-*.log`

### Monitoring
- **Health Check**: http://localhost:3000/api/health
- **Batch Status**: http://localhost:3000/api/admin/batch-processing/status
- **Database Status**: Check MongoDB connection

## Next Steps

After successful migration:

1. **Monitor System**: Watch for errors and performance issues
2. **Test Features**: Verify all new functionality works
3. **User Training**: Update user documentation
4. **Performance Tuning**: Optimize based on usage patterns
5. **Feature Enhancements**: Plan future improvements

## Contact

For issues or questions:
- **Technical Issues**: Check logs and documentation first
- **Migration Problems**: Review this document and migration script
- **Feature Requests**: Create issue in project repository
