#!/bin/bash

# TrustScore Cumulative Calculation Bug Fix Verification Script
# This script tests the exact scenario described in the bug report

echo "🔧 TrustScore Cumulative Calculation Bug Fix Verification"
echo "========================================================="

# Configuration
BASE_URL="http://localhost:3000"
VEHICLE_ID="68fd05d50c462a28534d4544"
AUTH_TOKEN="your-auth-token-here" # Replace with actual token

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to make API calls
make_request() {
    local method=$1
    local url=$2
    local data=$3
    local expected_status=$4
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $AUTH_TOKEN" \
            -d "$data" \
            "$url")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method \
            -H "Authorization: Bearer $AUTH_TOKEN" \
            "$url")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ $method $url - Status: $http_code${NC}"
        echo "$body" | jq . 2>/dev/null || echo "$body"
    else
        echo -e "${RED}❌ $method $url - Expected: $expected_status, Got: $http_code${NC}"
        echo "$body"
    fi
    
    echo ""
}

# Test 1: Seed initial TrustScore
echo -e "${YELLOW}Test 1: Seeding initial TrustScore (100)${NC}"
make_request "POST" "$BASE_URL/api/trust/$VEHICLE_ID/seed" '{"score":100}' "200"

# Test 2: Apply first rollback event (-30)
echo -e "${YELLOW}Test 2: First rollback event (-30)${NC}"
make_request "POST" "$BASE_URL/api/telemetry/event" '{
  "vehicleId":"'$VEHICLE_ID'",
  "type":"MILEAGE_ROLLBACK",
  "deltaScore": -30,
  "recordedAt":"2025-10-25T11:45:15Z",
  "source":"fraud-detect",
  "meta": {"prevMileage":65185,"newMileage":50000}
}' "200"

# Test 3: Apply second rollback event (-30)
echo -e "${YELLOW}Test 3: Second rollback event (-30)${NC}"
make_request "POST" "$BASE_URL/api/telemetry/event" '{
  "vehicleId":"'$VEHICLE_ID'",
  "type":"MILEAGE_ROLLBACK",
  "deltaScore": -30,
  "recordedAt":"2025-10-25T11:45:17Z",
  "source":"fraud-detect",
  "meta": {"prevMileage":65185,"newMileage":45000}
}' "200"

# Test 4: Verify final TrustScore should be 40
echo -e "${YELLOW}Test 4: Verifying final TrustScore (should be 40)${NC}"
make_request "GET" "$BASE_URL/api/trust/$VEHICLE_ID/score" "" "200"

# Test 5: Check TrustScore history
echo -e "${YELLOW}Test 5: Checking TrustScore history${NC}"
make_request "GET" "$BASE_URL/api/trust/$VEHICLE_ID/history" "" "200"

# Test 6: Concurrent events test
echo -e "${YELLOW}Test 6: Testing concurrent events${NC}"
echo "Sending two concurrent events..."

# Start both requests in background
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "vehicleId":"'$VEHICLE_ID'",
    "type":"MILEAGE_ROLLBACK",
    "deltaScore": -10,
    "recordedAt":"2025-10-25T11:45:20Z",
    "source":"fraud-detect"
  }' \
  "$BASE_URL/api/telemetry/event" &

curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "vehicleId":"'$VEHICLE_ID'",
    "type":"MILEAGE_ROLLBACK",
    "deltaScore": -5,
    "recordedAt":"2025-10-25T11:45:21Z",
    "source":"fraud-detect"
  }' \
  "$BASE_URL/api/telemetry/event" &

# Wait for both to complete
wait

# Check final score after concurrent events
echo -e "${YELLOW}Final TrustScore after concurrent events (should be 25):${NC}"
make_request "GET" "$BASE_URL/api/trust/$VEHICLE_ID/score" "" "200"

echo -e "${GREEN}🎉 TrustScore verification complete!${NC}"
echo ""
echo "Expected Results:"
echo "- Initial score: 100"
echo "- After first rollback: 70"
echo "- After second rollback: 40"
echo "- After concurrent events: 25"
echo ""
echo "If all tests pass, the cumulative calculation bug is fixed!"
