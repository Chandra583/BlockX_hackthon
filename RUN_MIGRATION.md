# Running the TrustScore Migration

To backfill trustScore for existing vehicles in your database, run the following command:

```bash
cd scripts
node migrate-add-trustscore.js
```

This script will:
1. Connect to your MongoDB database
2. Find all vehicles without a trustScore field
3. Set their trustScore to 100 (default value)
4. Log the progress

## Prerequisites

Make sure you have:
- Node.js installed
- MongoDB running
- Environment variables configured (MONGODB_URI)

## Expected Output

```
Starting trustScore migration...
Found 25 vehicles to update
Updated vehicle 1HGBH41JXMN109186 with trustScore 100
Updated vehicle 2T1BURHE5JC012345 with trustScore 100
...
Migration completed successfully!
```

## Troubleshooting

If you encounter any errors:
1. Check your MongoDB connection string
2. Verify the database is accessible
3. Ensure you have write permissions to the vehicles collection