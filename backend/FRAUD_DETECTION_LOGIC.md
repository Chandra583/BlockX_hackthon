# Fraud Detection Logic - Correct Implementation

## 🎯 Core Principle

**MILEAGE SHOULD ONLY GO UP, NEVER DOWN**

Any decrease in mileage = FRAUD (Odometer tampering/rollback)

## ✅ Valid Scenarios

1. **Normal Driving**
   - Previous: 66,000 km
   - Current: 66,100 km
   - Change: +100 km ✅ VALID
   - Status: VALID

2. **Long Drive**
   - Previous: 66,000 km
   - Current: 66,500 km (over 5 hours)
   - Change: +500 km ✅ VALID
   - Status: VALID

3. **No Change** (parked vehicle)
   - Previous: 66,000 km
   - Current: 66,000 km
   - Change: 0 km ✅ VALID
   - Status: VALID

## ⚠️ Suspicious Scenarios (Check but maybe valid)

1. **Unusually Fast Travel**
   - Previous: 66,000 km
   - Current: 66,500 km (in 1 hour)
   - Change: +500 km in 1 hour (500 km/h average)
   - Status: SUSPICIOUS
   - Action: Flag for review, might be highway driving

2. **Large Jump in Short Time**
   - Previous: 66,000 km
   - Current: 67,500 km (in 12 hours)
   - Change: +1,500 km
   - Status: SUSPICIOUS
   - Action: Could be long-distance highway trip, but verify

## 🚨 FRAUD Scenarios (CRITICAL ALERTS)

### 1. **Odometer Rollback (MAJOR FRAUD)**
   - Previous: 66,000 km
   - Current: 82 km
   - Change: **-65,918 km** ❌ FRAUD!
   - Status: ROLLBACK_DETECTED
   - Severity: HIGH
   - Action: **IMMEDIATE ALERT** - Odometer has been tampered/reset

### 2. **Small Rollback (FRAUD)**
   - Previous: 66,000 km
   - Current: 65,999 km
   - Change: **-1 km** ❌ FRAUD!
   - Status: ROLLBACK_DETECTED
   - Severity: HIGH
   - Action: Even 1 km decrease is impossible - odometer tampering

### 3. **Moderate Rollback (FRAUD)**
   - Previous: 66,000 km
   - Current: 50,000 km
   - Change: **-16,000 km** ❌ FRAUD!
   - Status: ROLLBACK_DETECTED
   - Severity: HIGH
   - Action: Odometer rolled back to increase resale value

## 📊 Detection Thresholds

### Current Implementation (device.controller.ts)

```typescript
// 1. Rollback Detection (ANY decrease is fraud)
if (mileageIncrement < -5) {
  tamperingDetected = true;
  validationStatus = 'ROLLBACK_DETECTED';
  severity = 'HIGH';
}

// 2. Impossible Distance (too fast increase)
else if (timeDiff > 0 && mileageIncrement > (timeDiff * 120)) {
  tamperingDetected = true;
  validationStatus = 'IMPOSSIBLE_DISTANCE';
  severity = 'HIGH';
}

// 3. Large Jump (suspicious but might be valid)
else if (mileageIncrement > 1000 && timeDiff < 24) {
  tamperingDetected = true;
  validationStatus = 'SUDDEN_JUMP';
  severity = 'MEDIUM';
}
```

### Recommended Thresholds

1. **Rollback Detection:** Any decrease > 5 km
   - Allows for minor sensor/rounding errors
   - Any decrease > 5 km = FRAUD

2. **Impossible Speed:** > 120 km/h average
   - Considers highway speed limits
   - Allows for brief high-speed bursts

3. **Suspicious Jump:** > 1000 km in < 24 hours
   - Long-distance trips possible
   - But worth reviewing

## 🔍 Your Specific Case

**Vehicle Registration:**
- Registered Mileage: 66,000 km
- Date: Oct 24, 2025

**OBD Reading:**
- Device: OBD3001
- Reported Mileage: 82 km
- Date: Oct 24, 2025 (same day)

**Analysis:**
- Change: 82 - 66,000 = **-65,918 km**
- This is a **MASSIVE ROLLBACK**
- Status: **ROLLBACK_DETECTED**
- Severity: **CRITICAL**
- Fraud Score: **95%**

**What Likely Happened:**
- Vehicle registered with actual odometer (66,000 km)
- OBD device connected and reading is incorrect (82 km)
- Two possible causes:
  1. OBD device reading wrong PID (getting incorrect data)
  2. Someone actually tampered with odometer

**Correct Alert:**
```
🚨 ODOMETER ROLLBACK DETECTED
Vehicle mileage decreased from 66,000 km to 82 km
This is impossible - odometer has been tampered or device is malfunctioning
Decrease: 65,918 km
Action Required: Investigate immediately
```

## 📝 Important Notes

1. **Mileage can ONLY increase** (or stay same if parked)
2. **ANY decrease = FRAUD** (except minor sensor errors < 5 km)
3. **Increase too fast = Suspicious** (but might be valid)
4. **Rollback detection is MORE important** than impossible distance
5. **Always compare with LAST KNOWN GOOD reading**

## 🎯 Priority Order

1. **ROLLBACK** (decrease) - HIGHEST PRIORITY ⚠️
2. **IMPOSSIBLE_DISTANCE** (too fast increase) - HIGH PRIORITY
3. **SUDDEN_JUMP** (large increase) - MEDIUM PRIORITY
4. **VALID** (normal increase) - NO ALERT

## 🔧 Backend Fix Needed

Check why the backend marked 82 km as "VALID" when previous was 66,000 km.

Possible issues:
1. Not finding previous reading correctly
2. Comparing against wrong value (initial registration vs last OBD reading)
3. Vehicle mileage and OBD mileage in different collections

**Action:** Verify that OBD validation compares against vehicle's currentMileage (66,000) not just previous OBD reading.

