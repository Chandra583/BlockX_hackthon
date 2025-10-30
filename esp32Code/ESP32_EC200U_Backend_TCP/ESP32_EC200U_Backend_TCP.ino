// Enhanced Vehicle Telematics System - BlockX Integration
// Updated for BlockX Backend: block-x-two.vercel.app
// API Endpoint: /api/device/status
// Last Updated: January 2025
// Fixed watchdog timer issues
// Ready for production use
//
// ==================== REQUIRED LIBRARIES ====================
// Install these libraries via Arduino IDE Library Manager:
// 1. ESP32 Board Package (Tools → Board → Boards Manager → "ESP32 by Espressif Systems")
// 2. ArduinoJson by Benoit Blanchon (Sketch → Include Library → Manage Libraries)
// 3. ELMduino by PowerBroker2 (Sketch → Include Library → Manage Libraries)
// 4. WiFi and Preferences are built into ESP32 board package
// 5. SPIFFS is built into ESP32 board package
// 6. esp_sleep.h is built into ESP32 board package

#include <esp_sleep.h>
#include <WiFi.h>
#include <ELMduino.h>
#include <SPIFFS.h>
#include <ArduinoJson.h>
#include <Preferences.h>

// ==================== CONFIGURATION ====================
struct Config {
  // Network settings - Updated for BlockX Vercel Backend
  char serverHost[100] = "veridrive-x-hackthon.vercel.app";
  char apnName[50] = "airtelgprs.com";
  char veepeakSSID[32] = "WiFi_OBDII";
  char veepeakPassword[64] = "";
  
  // Timing settings
  uint32_t sleepDurationMinutes = 2;
  uint32_t maxRetryAttempts = 3;
  uint32_t httpTimeoutMs = 15000;
  uint32_t obdTimeoutMs = 10000;
  
  // Power management (informational only)
  float lowBatteryThreshold = 3.3;
  uint32_t emergencySleepHours = 12;
  
  // Data retention
  uint32_t maxStoredRecords = 50;
  bool enableDataBuffering = true;
  
  // Security
  bool enableSSL = true;
 
  char deviceId[32] = "OBD3001";  // OBD Device ID for installation mapping
  
  // ========== VEHICLE SELECTION SYSTEM ==========
  // CHANGE THIS NUMBER TO SELECT YOUR VEHICLE:
  // 1 = Hyundai i20 Sport Plus (2019-2023) - FIXED VERSION
  // 2 = Maruti Vitara Brezza (2016-2023)
  // 3 = Manual PID Setup (configure your own PIDs below)
  // 4 = Auto-Discovered PID & Scale (Run Discovery Mode 99 first to calibrate)
  // 99 = Discovery Mode (scan and find PIDs automatically)

  
  uint8_t selectedVehicle = 99;  // <-- FORCE DISCOVERY MODE TO FIND WORKING PIDs
  
  // ========== FIXED HYUNDAI i20 CONFIGURATION ==========
  // Hyundai i20 Sport Plus 2020 - Corrected UDS implementation
  struct HyundaiConfig {
    const char* odometerCommand = "22 F1 90";  // UDS Mode 22, PID F190
    float scaleFactor = 0.1;                   // 0.1 km per bit
    uint16_t responseTimeout = 5000;           // 5 second timeout
    const char* expectedResponse = "62 F1 90"; // UDS positive response
  };
  
  // ========== MANUAL PID SETUP ==========
  // Use when selectedVehicle = 3 for other vehicles
  // Enter your own PID numbers in HEX format (e.g., 0x201C)
  uint16_t manualPrimaryPID = 0xA6;     // Enter your primary PID here
  uint16_t manualSecondaryPID = 0x201C; // Enter your secondary PID here  
  uint16_t manualTertiaryPID = 0x22A6;  // Enter your tertiary PID here
  char manualVehicleName[50] = "Custom Vehicle"; // Enter vehicle name
  
  // ========== YOUR VEHICLE CONFIGURATIONS ==========
  // Hyundai i20 Sport Plus - Optimized PID sequence
  uint16_t hyundai_i20_primary = 0x201C;   // Hyundai-specific odometer
  uint16_t hyundai_i20_secondary = 0x22A6; // Alternative Hyundai PID
  uint16_t hyundai_i20_tertiary = 0xA6;    // Standard fallback
  
  // Maruti Vitara Brezza - Optimized PID sequence  
  uint16_t maruti_brezza_primary = 0x22A6;   // Maruti/Suzuki-specific
  uint16_t maruti_brezza_secondary = 0xA6;   // Standard PID
  uint16_t maruti_brezza_tertiary = 0x201C;  // Alternative PID
  
  // System PIDs (don't change these)
  uint16_t primaryOdometerPID = 0xA6;
  uint16_t secondaryOdometerPID = 0x201C;
  uint16_t tertiaryOdometerPID = 0x22A6;

  // For Auto-Discovered Mode (4) - populated from Preferences
  char discoveredOdoPID_String[10]; 
  float discoveredOdoScale;
};

Config config;
Preferences preferences;

// ==================== HARDWARE PINS ====================
#define SerialAT Serial1
#define SerialMon Serial
#define RXD1 40
#define TXD1 41
#define powerPin 42
#define batteryPin A0
#define ledPin 2
#define WAKEUP_PIN GPIO_NUM_33

// ==================== GLOBAL VARIABLES ====================
String responseBuffer = "";
WiFiClient elmClient;
ELM327 myELM327;

// ==================== FUNCTION DECLARATIONS ====================
void sendAT(const char* cmd, int timeout = 2000);

// Enhanced OBD data structure
struct VehicleData {
  String deviceID;
  String vin;
  float mileage;
  float rpm;
  float speed;
  float engineTemp;
  float fuelLevel;
  float batteryVoltage;
  uint32_t timestamp;
  uint16_t diagnosticCodes;
  String location;
  uint8_t dataQuality;
  String odometerPID;
  
  // Anti-tampering and validation fields
  float lastKnownMileage;
  uint32_t lastReadingTime;
  float mileageIncrement;
  bool tamperingDetected;
  String validationStatus;
  float alternateOdometerReading;
  String alternateOdometerPID;
};

// Structure to hold discovered PID values during scan
struct DiscoveredValue {
  String pid;
  float value;
  String rawResponse;
};

// Network information structure
struct NetworkInfo {
  String operatorName;
  String signalStrength;
  String simInfo;
  String apnInfo;
  String networkTime;
  String ipAddress;
  bool isConnected;
};

NetworkInfo networkInfo;

// ==================== UTILITY FUNCTIONS ====================

// Enhanced logging with levels
enum LogLevel { LOG_ERROR, LOG_WARN, LOG_INFO, LOG_DEBUG };

void logMessage(LogLevel level, const String& message) {
  String prefix;
  switch(level) {
    case LOG_ERROR: prefix = "❌ ERROR: "; break;
    case LOG_WARN:  prefix = "⚠️  WARN:  "; break;
    case LOG_INFO:  prefix = "ℹ️  INFO:  "; break;
    case LOG_DEBUG: prefix = "🐛 DEBUG: "; break;
  }
  
  SerialMon.println(prefix + message);
  
  // Store critical errors in preferences for debugging
  if (level == LOG_ERROR) {
    String errorLog = preferences.getString("lastError", "");
    errorLog = String(millis()) + ": " + message + "|" + errorLog;
    if (errorLog.length() > 500) errorLog = errorLog.substring(0, 500);
    preferences.putString("lastError", errorLog);
  }
}

// Configure PIDs based on selected vehicle
void configureVehiclePIDs() {
  switch(config.selectedVehicle) {
    case 1: // Hyundai i20 Sport Plus
      config.primaryOdometerPID = config.hyundai_i20_primary;     // 0x201C
      config.secondaryOdometerPID = config.hyundai_i20_secondary; // 0x22A6g
      config.tertiaryOdometerPID = config.hyundai_i20_tertiary;   // 0xA6
      logMessage(LOG_INFO, "🚗 Vehicle: Hyundai i20 Sport Plus (2019-2023)");
      logMessage(LOG_INFO, "🔧 Optimized for Hyundai OBD-II system");
      break;
      
    case 2: // Maruti Vitara Brezza
      config.primaryOdometerPID = config.maruti_brezza_primary;     // 0x22A6
      config.secondaryOdometerPID = config.maruti_brezza_secondary; // 0xA6
      config.tertiaryOdometerPID = config.maruti_brezza_tertiary;   // 0x201C
      logMessage(LOG_INFO, "🚗 Vehicle: Maruti Vitara Brezza (2016-2023)");
      logMessage(LOG_INFO, "🔧 Optimized for Maruti/Suzuki OBD-II system");
      break;
      
    case 3: // Manual PID Setup
      config.primaryOdometerPID = config.manualPrimaryPID;
      config.secondaryOdometerPID = config.manualSecondaryPID;
      config.tertiaryOdometerPID = config.manualTertiaryPID;
      logMessage(LOG_INFO, "🚗 Vehicle: " + String(config.manualVehicleName));
      logMessage(LOG_INFO, "🔧 Using Manual PID Configuration");
      break;
      
    case 4: // Auto-Discovered PID & Scale
      preferences.begin("discovered_config", true); // Open read-only
      strlcpy(config.discoveredOdoPID_String, preferences.getString("discOdoPID", "N/A").c_str(), sizeof(config.discoveredOdoPID_String));
      config.discoveredOdoScale = preferences.getFloat("discOdoScale", 1.0);
      preferences.end();
      logMessage(LOG_INFO, "🚗 Vehicle: Auto-Discovered PID & Scale Mode");
      if (String(config.discoveredOdoPID_String) != "N/A" && String(config.discoveredOdoPID_String) != "") {
        logMessage(LOG_INFO, "   Using Discovered PID: " + String(config.discoveredOdoPID_String) + " with Scale: " + String(config.discoveredOdoScale));
      } else {
        logMessage(LOG_WARN, "   No discovered PID/Scale found in Preferences. Auto-Discovered Mode may not work.");
        // Fallback to default PIDs, but without a specific scale, this might not be ideal.
        // Consider if a default behavior for mode 4 without saved data is needed, e.g., run discovery or use vehicle 1 settings.
        // For now, it will attempt to use "N/A" as PID which will likely fail in fetchEnhancedOBDData.
        config.primaryOdometerPID = config.hyundai_i20_primary; // Example fallback
        config.secondaryOdometerPID = config.hyundai_i20_secondary;
        config.tertiaryOdometerPID = config.hyundai_i20_tertiary;
        logMessage(LOG_WARN, "   Falling back to Hyundai i20 PIDs for Mode 4 due to missing discovered data.");
      }
      break;
      
    case 99: // Discovery Mode
      config.primaryOdometerPID = 0xA6;
      config.secondaryOdometerPID = 0x201C;
      config.tertiaryOdometerPID = 0x22A6;
      logMessage(LOG_INFO, "🔍 Vehicle: Discovery Mode - Will scan for PIDs");
      logMessage(LOG_WARN, "⚠️  Discovery mode will take longer to complete");
      break;
      
    default: // Invalid selection, use Hyundai as default
      config.selectedVehicle = 1;
      config.primaryOdometerPID = config.hyundai_i20_primary;
      config.secondaryOdometerPID = config.hyundai_i20_secondary;
      config.tertiaryOdometerPID = config.hyundai_i20_tertiary;
      logMessage(LOG_WARN, "⚠️  Invalid vehicle selection! Using Hyundai i20 as default");
      break;
  }
  
  logMessage(LOG_INFO, "📋 PIDs configured - Primary: 0x" + String(config.primaryOdometerPID, HEX) + 
                       ", Secondary: 0x" + String(config.secondaryOdometerPID, HEX) + 
                       ", Tertiary: 0x" + String(config.tertiaryOdometerPID, HEX));
}

  // Load configuration from preferences
void loadConfiguration() {
  preferences.begin("vehicle_config", false);
  
  // Load with defaults
  strlcpy(config.serverHost, preferences.getString("serverHost", config.serverHost).c_str(), sizeof(config.serverHost));
  strlcpy(config.apnName, preferences.getString("apnName", config.apnName).c_str(), sizeof(config.apnName));
  strlcpy(config.deviceId, preferences.getString("deviceId", config.deviceId).c_str(), sizeof(config.deviceId));
  config.sleepDurationMinutes = preferences.getUInt("sleepDuration", config.sleepDurationMinutes);
  config.maxRetryAttempts = preferences.getUInt("maxRetries", config.maxRetryAttempts);
  
  // Configure vehicle-specific PIDs
  configureVehiclePIDs();
  
  logMessage(LOG_INFO, "Configuration loaded");
  logMessage(LOG_INFO, "OBD Device ID: " + String(config.deviceId));
}

// Save configuration to preferences
void saveConfiguration() {
  preferences.putString("serverHost", config.serverHost);
  preferences.putString("apnName", config.apnName);
  preferences.putString("deviceId", config.deviceId);
  preferences.putUInt("sleepDuration", config.sleepDurationMinutes);
  preferences.putUInt("maxRetries", config.maxRetryAttempts);
  preferences.end();
}

// Enhanced battery monitoring (informational only)
float getBatteryVoltage() {
  const int numReadings = 10;
  float total = 0;
  
  for (int i = 0; i < numReadings; i++) {
    total += analogRead(batteryPin);
    delay(10);
  }
  
  float average = total / numReadings;
  float voltage = (average * 3.3 / 4095.0) * 2.0;
  
  return voltage;
}

// Enhanced LED status indication
void setStatusLED(bool state, int blinkCount = 0) {
  if (blinkCount > 0) {
    for (int i = 0; i < blinkCount; i++) {
      digitalWrite(ledPin, HIGH);
      delay(200);
      digitalWrite(ledPin, LOW);
      delay(200);
    }
  } else {
    digitalWrite(ledPin, state);
  }
}

// ==================== ENHANCED OBD FUNCTIONS ====================

// Scaling factor for odometer correction (adjust as needed for modes 1,2,3)
const float ODOMETER_SCALING_FACTOR = 1.044; // General scaling factor, discovery mode now picks better PIDs

// Odometer validation ranges
const float MIN_PLAUSIBLE_ODOMETER = 0.0;       // Minimum realistic odometer value
const float MAX_PLAUSIBLE_ODOMETER = 999999.0;  // Maximum realistic odometer value  
const float MIN_REASONABLE_ODOMETER = 1000.0;   // Minimum for used car (filter out clearly wrong values)

// Helper function to convert PID to string and query safely
float queryPIDSafe(uint16_t pidHex) {
  char pidStr[10];
  sprintf(pidStr, "%04X", pidHex);
  myELM327.queryPID(pidStr);
  delay(100);
  return myELM327.findResponse();
}

// Validate if a value is a plausible odometer reading
bool isPlausibleOdometer(float value) {
  return (value >= MIN_PLAUSIBLE_ODOMETER && value <= MAX_PLAUSIBLE_ODOMETER);
}

// Validate if a value is a reasonable odometer reading (excludes very low values)
bool isReasonableOdometer(float value) {
  return (value >= MIN_REASONABLE_ODOMETER && value <= MAX_PLAUSIBLE_ODOMETER);
}

// Anti-tampering validation function
bool validateOdometerReading(VehicleData &data) {
  logMessage(LOG_INFO, "🔍 Validating odometer reading for tampering...");
  
  // Load previous readings from preferences
  preferences.begin("odometer_history", true);
  float lastMileage = preferences.getFloat("lastMileage", 0);
  uint32_t lastTimestamp = preferences.getULong("lastTimestamp", 0);
  float totalDistanceLogged = preferences.getFloat("totalDistance", 0);
  uint32_t totalReadings = preferences.getULong("totalReadings", 0);
  preferences.end();
  
  data.lastKnownMileage = lastMileage;
  data.lastReadingTime = lastTimestamp;
  data.tamperingDetected = false;
  data.validationStatus = "VALID";
  
  // Calculate time difference in hours
  uint32_t timeDiffMs = data.timestamp - lastTimestamp;
  float timeDiffHours = timeDiffMs / (1000.0 * 60.0 * 60.0);
  
  if (lastMileage > 0 && timeDiffHours > 0) {
    data.mileageIncrement = data.mileage - lastMileage;
    
    logMessage(LOG_INFO, "📊 Previous reading: " + String(lastMileage, 2) + " km");
    logMessage(LOG_INFO, "📊 Current reading: " + String(data.mileage, 2) + " km");
    logMessage(LOG_INFO, "📊 Increment: " + String(data.mileageIncrement, 2) + " km");
    logMessage(LOG_INFO, "📊 Time diff: " + String(timeDiffHours, 2) + " hours");
    
    // TAMPERING DETECTION RULES
    
    // 1. Odometer went backwards (rollback)
    if (data.mileageIncrement < -5) { // Allow small variations
      data.tamperingDetected = true;
      data.validationStatus = "ROLLBACK_DETECTED";
      logMessage(LOG_ERROR, "🚨 TAMPERING: Odometer went backwards by " + String(abs(data.mileageIncrement), 2) + " km!");
    }
    
    // 2. Impossible distance increase (too much driving)
    else if (data.mileageIncrement > (timeDiffHours * 120)) { // Max 120 km/h average
      data.tamperingDetected = true;
      data.validationStatus = "IMPOSSIBLE_DISTANCE";
      logMessage(LOG_ERROR, "🚨 TAMPERING: Impossible distance increase - " + String(data.mileageIncrement, 2) + " km in " + String(timeDiffHours, 2) + " hours!");
    }
    
    // 3. Sudden large jump (possible digital tampering)
    else if (data.mileageIncrement > 1000 && timeDiffHours < 24) {
      data.tamperingDetected = true;
      data.validationStatus = "SUDDEN_JUMP";
      logMessage(LOG_WARN, "⚠️ SUSPICIOUS: Large odometer jump - " + String(data.mileageIncrement, 2) + " km in " + String(timeDiffHours, 2) + " hours");
    }
    
    // 4. Zero increment over long time (odometer stuck/disconnected)
    else if (data.mileageIncrement == 0 && timeDiffHours > 168) { // 1 week
      data.tamperingDetected = true;
      data.validationStatus = "ODOMETER_STUCK";
      logMessage(LOG_WARN, "⚠️ SUSPICIOUS: Odometer unchanged for " + String(timeDiffHours/24, 1) + " days");
    }
    
    // 5. Calculate average speed and flag unrealistic patterns
    else {
      float avgSpeed = data.mileageIncrement / timeDiffHours;
      if (avgSpeed > 80) { // Average speed > 80 km/h for extended period
        data.validationStatus = "HIGH_SPEED_PATTERN";
        logMessage(LOG_WARN, "⚠️ UNUSUAL: High average speed " + String(avgSpeed, 1) + " km/h over " + String(timeDiffHours, 1) + " hours");
      } else {
        logMessage(LOG_INFO, "✅ Normal driving pattern: " + String(avgSpeed, 1) + " km/h average");
      }
    }
  } else {
    data.mileageIncrement = 0;
    data.validationStatus = "FIRST_READING";
    logMessage(LOG_INFO, "📝 First odometer reading recorded");
  }
  
  // Save current reading to history
  preferences.begin("odometer_history", false);
  preferences.putFloat("lastMileage", data.mileage);
  preferences.putULong("lastTimestamp", data.timestamp);
  preferences.putFloat("totalDistance", totalDistanceLogged + (data.mileageIncrement > 0 ? data.mileageIncrement : 0));
  preferences.putULong("totalReadings", totalReadings + 1);
  preferences.end();
  
  return !data.tamperingDetected;
}

// Get multiple odometer readings for cross-validation
bool getMultipleOdometerReadings(VehicleData &data, WiFiClient &client) {
  logMessage(LOG_INFO, "🔍 Cross-validating with multiple PIDs...");
  
  // List of common odometer PIDs to try
  String odometerPIDs[] = {"0101", "0102", "0115", "0116", "0131", "2102", "2103", "2104", "2105", "2106", "2107", "2110", "22A6", "201C"};
  int numPIDs = sizeof(odometerPIDs) / sizeof(odometerPIDs[0]);
  
  float readings[14]; // Max 14 PIDs
  String validPIDs[14];
  int validCount = 0;
  
  auto getOBDValue = [&](const String& pid, const String& description) -> float {
    while (client.available()) { client.read(); }
    delay(20);
    client.println(pid);
    
    unsigned long start = millis();
    String response = "";
    unsigned long timeoutWindow = 2000UL;
    
    while (millis() - start < timeoutWindow) {
      if (client.available()) {
        char c = client.read();
        response += c;
        if (response.indexOf(">") >= 0) break;
      }
      delay(10);
    }
    
    // Parse response (simplified for validation)
    String clean = response;
    clean.replace(" ", ""); clean.replace("\r", ""); clean.replace("\n", ""); clean.replace(">", "");
    clean.replace("SEARCHING...", ""); clean.replace("NODATA", ""); clean.replace("STOPPED", "");
    
    if (clean.length() == 0 || clean.indexOf("NODATA") >= 0) return 0.0;
    
    // Extract numeric values from common response patterns
    if (clean.length() >= 8 && (clean.startsWith("7E8") || clean.startsWith("7E0"))) {
      String lastBytes = clean.substring(clean.length() - 4);
      if (lastBytes.length() >= 4) {
        float val = (strtol(lastBytes.substring(0, 2).c_str(), NULL, 16) * 256) + strtol(lastBytes.substring(2, 4).c_str(), NULL, 16);
        if (val > 1000 && val < 999999) return val;
      }
    }
    return 0.0;
  };
  
  // Read all PIDs quickly
  for (int i = 0; i < numPIDs; i++) {
    float value = getOBDValue(odometerPIDs[i], "Validation PID " + odometerPIDs[i]);
    if (value > 1000 && value < 999999) { // Reasonable range
      readings[validCount] = value;
      validPIDs[validCount] = odometerPIDs[i];
      validCount++;
      logMessage(LOG_INFO, "  ✓ PID " + odometerPIDs[i] + ": " + String(value, 0) + " km");
    }
  }
  
  if (validCount >= 2) {
    // Find the most consistent readings (within 5% of each other)
    float primaryReading = data.mileage;
    int matchingCount = 0;
    float tolerance = primaryReading * 0.05; // 5% tolerance
    
    for (int i = 0; i < validCount; i++) {
      if (abs(readings[i] - primaryReading) <= tolerance) {
        matchingCount++;
        logMessage(LOG_INFO, "  ✅ PID " + validPIDs[i] + " matches primary (" + String(readings[i], 0) + " vs " + String(primaryReading, 0) + ")");
      } else {
        logMessage(LOG_WARN, "  ⚠️ PID " + validPIDs[i] + " differs (" + String(readings[i], 0) + " vs " + String(primaryReading, 0) + ")");
      }
    }
    
    // Store alternative reading for comparison
    if (validCount > 1) {
      data.alternateOdometerReading = readings[1]; // Second reading
      data.alternateOdometerPID = validPIDs[1];
    }
    
    // Validation result
    if (matchingCount >= (validCount / 2)) {
      logMessage(LOG_INFO, "✅ Cross-validation PASSED: " + String(matchingCount) + "/" + String(validCount) + " PIDs match");
      return true;
    } else {
      logMessage(LOG_WARN, "⚠️ Cross-validation QUESTIONABLE: Only " + String(matchingCount) + "/" + String(validCount) + " PIDs match");
      data.validationStatus += "_INCONSISTENT_PIDS";
      return false;
    }
  } else {
    logMessage(LOG_WARN, "⚠️ Insufficient PIDs for cross-validation (found " + String(validCount) + ")");
    return true; // Don't fail if we can't cross-validate
  }
}

// Manual ELM327 initialization with custom timeouts
bool initializeELM327Manual(WiFiClient &client, const String &host, int port) {
  logMessage(LOG_INFO, "🔧 Manual ELM327 initialization...");
  
  if (!client.connect(host.c_str(), port)) {
    logMessage(LOG_ERROR, "Failed to connect to " + host + ":" + String(port));
    return false;
  }
  
  logMessage(LOG_INFO, "✅ TCP connected to " + host + ":" + String(port));
  
  // Send basic AT commands with longer delays
  String commands[] = {
    "ATZ",      // Reset
    "ATE0",     // Echo off
    "ATL0",     // Linefeeds off
    "ATS0",     // Spaces off
    "ATH1",     // Headers on
    "ATCAF1",   // CAN auto formatting on
    "ATAL",     // Allow long messages
    "ATCFC1",   // Enable CAN flow control
    "ATAT1",    // Adaptive timing on
    "ATST64",   // Timeout tweak
    "ATSP6",    // ISO 15765-4 (CAN 11bit 500k)
    "ATSH7DF",  // Use functional addressing first
    "0100"      // Test command
  };
  
  int numCommands = sizeof(commands) / sizeof(commands[0]);
  for (int i = 0; i < numCommands; i++) {
    logMessage(LOG_INFO, "Sending: " + commands[i]);
    client.println(commands[i]);
    
    // Wait for response with longer timeout
    unsigned long start = millis();
    String response = "";
    
    while (millis() - start < 3000) {  // 3 second timeout
      if (client.available()) {
        char c = client.read();
        response += c;
        if (response.indexOf(">") >= 0 || response.indexOf("OK") >= 0) {
          break;
        }
      }
      delay(10);
    }
    
    logMessage(LOG_INFO, "Response: " + response);
    
    if (response.length() == 0) {
      logMessage(LOG_WARN, "No response to: " + commands[i]);
    }
    
    delay(500);  // Wait between commands
  }
  
  return true;
}

// Function to fetch the Vehicle Identification Number (VIN)
String fetchVIN(WiFiClient &client) {
  logMessage(LOG_INFO, "Requesting VIN (Mode 09 PID 02)...");
  
  // Send a simple command first to ensure active communication
  client.println("0100"); 
  delay(200); // Short delay after test command
  // Clear any response from 0100 before sending 0902
  unsigned long clearStart = millis();
  while(client.available() && (millis() - clearStart < 1000)) {
    client.read();
  }

  client.println("0902");

  String rawResponse = "";
  String vin = "";
  unsigned long startTime = millis();
  bool endOfMessage = false;
  int linesProcessed = 0;

  // Wait for response, typically multi-line, ends with '>' or timeout
  while (millis() - startTime < 7000 && !endOfMessage) { // Increased timeout to 7 seconds
    if (client.available()) {
      char c = client.read();
      rawResponse += c;
      if (c == '>') {
        endOfMessage = true;
      }
    } else {
      yield(); // Allow other tasks to run, important for network stability
    }
  }

  logMessage(LOG_DEBUG, "Raw VIN response: " + rawResponse);

  // Process the raw response to extract VIN
  // Expected format: Lines starting with "49 02 0X" (X is sequence number)
  // followed by ASCII hex codes for VIN characters.
  // Example: 49 02 01 31 4B 34 ... (first line of VIN)
  //          49 02 02 4D 4A 31 ... (second line)

  // Clean up the raw response a bit
  rawResponse.replace("\r", "\n"); // Normalize line endings
  rawResponse.replace(" ", "");    // Remove all spaces to simplify parsing hex pairs

  int currentPos = 0;
  while (currentPos < rawResponse.length()) {
    int nlPos = rawResponse.indexOf('\n', currentPos);
    if (nlPos == -1) nlPos = rawResponse.length();
    
    String line = rawResponse.substring(currentPos, nlPos);
    currentPos = nlPos + 1;

    // Look for lines that contain the VIN data (e.g., starting with 490201, 490202, etc.)
    // The actual VIN characters start after this header.
    // 490201 (7 chars), 490202 (7 chars), etc. or 4902 (ISO 15765-4 frame contains 4902 and then VIN bytes)
    // A common response for VIN from ELM327 might be like:
    // 7E8 0A 49 02 01 56 49 4E... (CAN response, data starts after 01)
    // Or directly: 49020156494E...

    String dataPrefix = "";
    if (line.startsWith("490201")) dataPrefix = "490201";
    else if (line.startsWith("490202")) dataPrefix = "490202";
    else if (line.startsWith("490203")) dataPrefix = "490203";
    // Add more if VIN is longer than 3 lines, though unlikely for standard 17-char VIN
    // Also, sometimes the response is on one line: 011
    // NO DATA
    // 4902014D48354B4D344B
    // 49020239373831303735
    // 490203333231

    // A more direct approach for ELM327: It often strips headers and gives only the data bytes.
    // Or it can come within a CAN frame like 7Ex (e.g. 7E8, 7E9, 7EA)
    // 7E8 10 14 49 02 01 31 47 31 
    // 4A 46 36 45 35 34 4B 4D 
    // 32 31 33 33 39 30

    // Try to find "4902" and then look for the VIN characters
    int vinHeaderPos = line.indexOf("4902");
    if (vinHeaderPos != -1) {
        String potentialVinData = line.substring(vinHeaderPos + 4); // Skip "4902"
        // The next byte is often a sequence/frame indicator (e.g., 01, 02, 03, or part of a length byte)
        // Let's assume it might be followed by the VIN bytes if sequence number is small (e.g. < 0A)
        // For now, a simplified parser: just take hex pairs after "4902"
        // If the line starts with 7Ex (CAN frame), data is further in.
        // Example: 7E81014490201[VIN_PART_HEX]
        int dataStartOffset = 0;
        if (line.startsWith("7E")) { // Check if it's a CAN response frame
            // Typical format: 7Ex LL DD 49 02 SQ [VIN_HEX ...]
            // LL = Length (e.g., 10 14 for 20 bytes payload)
            // DD = Data Bytes (e.g. 14)
            // SQ = Sequence (e.g. 01)
            // Find 4902 then skip one more byte for SQ before VIN hex data
            int actualDataStartPos = line.indexOf("4902");
            if (actualDataStartPos != -1 && actualDataStartPos + 4 + 2 <= line.length()) { // 4 for "4902", 2 for SQ byte
                potentialVinData = line.substring(actualDataStartPos + 4 + 2);
            } else {
                potentialVinData = ""; // Not a valid CAN frame for VIN data
            }
        } else if (potentialVinData.length() > 2 && (potentialVinData.startsWith("01") || potentialVinData.startsWith("02") || potentialVinData.startsWith("03"))){
            potentialVinData = potentialVinData.substring(2); // Skip sequence byte like 01, 02, 03
        }

        for (int i = 0; i < potentialVinData.length() - 1; i += 2) {
            String hexPair = potentialVinData.substring(i, i + 2);
            // Ensure it's a valid hex pair
            if (isxdigit(hexPair.charAt(0)) && isxdigit(hexPair.charAt(1))) {
                char chr = (char)strtol(hexPair.c_str(), NULL, 16);
                // Filter out non-printable or control characters, VINs are typically alphanumeric
                if (isGraph(chr) && vin.length() < 17) { // Standard VIN is 17 chars
                    vin += chr;
                }
            }
        }
        linesProcessed++;
    }
  }

  if (vin.length() > 0) {
    logMessage(LOG_INFO, "Successfully fetched VIN: " + vin);
  } else {
    logMessage(LOG_WARN, "Failed to fetch or parse VIN. Raw: " + rawResponse);
  }
  return vin;
}

// Function to save all discovered PID scan results to a JSON file on SPIFFS
bool saveFullScanResultsToSPIFFS(const DiscoveredValue allValues[], int count) {
  if (count == 0) {
    logMessage(LOG_INFO, "No scan results to save.");
    return false;
  }

  if (!SPIFFS.begin(true)) {
    logMessage(LOG_ERROR, "SPIFFS Mount Failed for saving scan results");
    return false;
  }

  DynamicJsonDocument doc(ESP.getMaxAllocHeap() / 2); // Allocate a generous portion of heap for JSON, adjust if needed
  JsonArray resultsArray = doc.to<JsonArray>();

  for (int i = 0; i < count; i++) {
    JsonObject pidResult = resultsArray.createNestedObject();
    pidResult["pid"] = allValues[i].pid;
    pidResult["rawValue"] = allValues[i].value; // This is the numeric value, could be 0 if not parsed
    pidResult["rawResponseHex"] = allValues[i].rawResponse; // This is the full hex string
  }

  String filename = "/scanlog_" + String(millis()) + ".json";
  File file = SPIFFS.open(filename, FILE_WRITE);
  if (!file) {
    logMessage(LOG_ERROR, "Failed to create scan log file: " + filename);
    SPIFFS.end();
    return false;
  }

  size_t bytesWritten = serializeJson(doc, file);
  file.close();
  SPIFFS.end();

  if (bytesWritten > 0) {
    logMessage(LOG_INFO, "Full scan results saved to: " + filename + " (" + String(bytesWritten) + " bytes)");
    return true;
  } else {
    logMessage(LOG_ERROR, "Failed to write scan results to file: " + filename);
    return false;
  }
}

// Enhanced OBD data collection with manual initialization
bool fetchEnhancedOBDData(VehicleData &data) {
  logMessage(LOG_INFO, "Starting enhanced OBD data collection");
  
  // Initialize with device info
  data.deviceID = config.deviceID;
  data.timestamp = millis();
  data.batteryVoltage = getBatteryVoltage();
  data.dataQuality = 0;
  data.odometerPID = "N/A"; // Initialize odometerPID
  
  // Test basic TCP connection first - use gateway IP from network info
  logMessage(LOG_INFO, "🔍 Testing TCP connection to OBD device...");
  WiFiClient testClient;
  String gatewayIP = WiFi.gatewayIP().toString();
  
  logMessage(LOG_INFO, "Trying gateway IP: " + gatewayIP);
  
  String workingHost = "";
  int workingPort = 0;
  
  if (testClient.connect(gatewayIP.c_str(), 35000)) {
    logMessage(LOG_INFO, "✅ TCP connection successful to " + gatewayIP + ":35000");
    workingHost = gatewayIP;
    workingPort = 35000;
    testClient.stop();
  } else if (testClient.connect(gatewayIP.c_str(), 23)) {
    logMessage(LOG_INFO, "✅ TCP connection successful to " + gatewayIP + ":23");
    workingHost = gatewayIP;
    workingPort = 23;
    testClient.stop();
  } else if (testClient.connect("192.168.0.12", 35000)) {
    logMessage(LOG_INFO, "✅ TCP connection successful to 192.168.0.12:35000");
    workingHost = "192.168.0.12";
    workingPort = 35000;
    testClient.stop();
  } else if (testClient.connect("192.168.0.1", 35000)) {
    logMessage(LOG_INFO, "✅ TCP connection successful to 192.168.0.1:35000");
    workingHost = "192.168.0.1";
    workingPort = 35000;
    testClient.stop();
  } else {
    logMessage(LOG_ERROR, "❌ No TCP connection possible to any OBD address");
    return false;
  }
  
  if (initializeELM327Manual(elmClient, workingHost, workingPort)) {
    logMessage(LOG_INFO, "✅ Manual ELM327 initialization successful");
  } else {
    logMessage(LOG_ERROR, "❌ Manual ELM327 initialization failed");
    if (!myELM327.begin(elmClient, workingHost.c_str(), workingPort)) {
      logMessage(LOG_ERROR, "Failed to connect to ELM327 with library");
      return false;
    } else {
      logMessage(LOG_INFO, "✅ Connected to ELM327 with library");
    }
  }
  
  int successCount = 0;
  int totalAttempts = 0;
  
  auto getOBDValue = [&](const String& pid, const String& description) -> float {
    logMessage(LOG_INFO, "Requesting " + description + " (PID: " + pid + ")");
    // Clear any residual data before sending
    while (elmClient.available()) { elmClient.read(); }
    delay(20);
    elmClient.println(pid);
    
    unsigned long start = millis();
    String response = "";
    
    unsigned long timeoutWindow = pid.startsWith("22") ? 5000UL : 3000UL;
    while (millis() - start < timeoutWindow) {
      if (elmClient.available()) {
        char c = elmClient.read();
        response += c;
        if (response.indexOf(">") >= 0) {
          break;
        }
      }
      delay(10);
    }
    
    logMessage(LOG_INFO, description + " response: " + response);
    // Clean up and handle SEARCHING/STOPPED properly
    String clean = response;
    clean.replace(" ", "");
    clean.replace("\r", "");
    clean.replace("\n", "");
    clean.replace(">", "");
    clean.replace("SEARCHING...", "");
    clean.replace("SEARCHING", "");
    clean.replace("NODATA", "");
    clean.replace("NO DATA", "");
    clean.replace("STOPPED", "");
    
    // If nothing meaningful remains, treat as no data
    if (clean.length() == 0) {
      logMessage(LOG_DEBUG, description + " - Empty response after cleanup");
      return 0.0;
    }
    
    if (clean.indexOf("NODATA") >= 0 || clean.indexOf("STOPPED") >= 0) {
      logMessage(LOG_DEBUG, description + " - No data available");
      return 0.0;
    }
    if (clean == "OK") {
      logMessage(LOG_DEBUG, description + " - Vehicle may be off (OK response)");
      return 0.0;
    }
    // Handle UDS Mode 22 responses (expect "62" + PID)
    if (pid.startsWith("22")) {
      String udsKey = "62" + pid.substring(2);
      int udsPos = clean.indexOf(udsKey);
      if (udsPos >= 0) {
        String dataBytes = clean.substring(udsPos + udsKey.length());
        // Try 4-byte big-endian first
        if (dataBytes.length() >= 8) {
          unsigned long A = strtoul(dataBytes.substring(0, 2).c_str(), NULL, 16);
          unsigned long B = strtoul(dataBytes.substring(2, 4).c_str(), NULL, 16);
          unsigned long C = strtoul(dataBytes.substring(4, 6).c_str(), NULL, 16);
          unsigned long D = strtoul(dataBytes.substring(6, 8).c_str(), NULL, 16);
          unsigned long value = (A << 24) | (B << 16) | (C << 8) | D;
          return (float)value;
        }
        // Fallback to 3-byte big-endian
        if (dataBytes.length() >= 6) {
          unsigned long A = strtoul(dataBytes.substring(0, 2).c_str(), NULL, 16);
          unsigned long B = strtoul(dataBytes.substring(2, 4).c_str(), NULL, 16);
          unsigned long C = strtoul(dataBytes.substring(4, 6).c_str(), NULL, 16);
          unsigned long value = (A << 16) | (B << 8) | C;
          return (float)value;
        }
      }
      
      // Check for UDS negative response (7F XX YY format)
      if (clean.indexOf("7F22") >= 0) {
        int nrcPos = clean.indexOf("7F22");
        if (nrcPos >= 0 && clean.length() > nrcPos + 5) {
          String nrcCode = clean.substring(nrcPos + 4, nrcPos + 6);
          logMessage(LOG_WARN, "UDS Negative Response for " + pid + " - NRC: 0x" + nrcCode + 
                    (nrcCode == "11" ? " (Service Not Supported)" : 
                     nrcCode == "31" ? " (Request Out Of Range)" :
                     nrcCode == "33" ? " (Security Access Denied)" : " (Unknown)"));
        }
        return 0.0;
      }
    }

    if (clean.length() >= 6) {
      String expectedResponse = "41" + pid.substring(2);
      if (clean.indexOf(expectedResponse) >= 0) {
        int dataStartIdx = clean.indexOf(expectedResponse) + expectedResponse.length();
        String dataBytes = clean.substring(dataStartIdx);
        logMessage(LOG_DEBUG, "Data bytes: " + dataBytes);
        if (pid == "010C" && dataBytes.length() >= 4) { // RPM
          return ((strtol(dataBytes.substring(0, 2).c_str(), NULL, 16) * 256) + strtol(dataBytes.substring(2, 4).c_str(), NULL, 16)) / 4.0;
        } else if (pid == "010D" && dataBytes.length() >= 2) { // Speed
          return strtol(dataBytes.substring(0, 2).c_str(), NULL, 16);
        } else if (pid == "0105" && dataBytes.length() >= 2) { // Engine temp
          return strtol(dataBytes.substring(0, 2).c_str(), NULL, 16) - 40;
        } else if (pid == "012F" && dataBytes.length() >= 2) { // Fuel level
          return (strtol(dataBytes.substring(0, 2).c_str(), NULL, 16) * 100.0) / 255.0;
        } else if (pid == "0131" && dataBytes.length() >= 4) { // Distance
          return (strtol(dataBytes.substring(0, 2).c_str(), NULL, 16) * 256) + strtol(dataBytes.substring(2, 4).c_str(), NULL, 16);
        }
        return 1.0; // Generic success
      }
    }
    if (clean.length() >= 8 && (clean.startsWith("7E8") || clean.startsWith("7E0") || clean.startsWith("7DF"))) {
      logMessage(LOG_INFO, "Manufacturer-specific response detected: " + clean);
      String cleanResponse = clean;
      if (pid == "0131" && clean.indexOf("7E8044131") >= 0) {
        int dataStartIdx = clean.indexOf("7E8044131") + 9;
        String dataBytes = clean.substring(dataStartIdx);
        if (dataBytes.length() >= 4) {
          float dist = (strtol(dataBytes.substring(0, 2).c_str(), NULL, 16) * 256) + strtol(dataBytes.substring(2, 4).c_str(), NULL, 16);
          logMessage(LOG_INFO, "Parsed distance: " + String(dist) + " km (0x" + dataBytes.substring(0, 4) + ")");
          return dist;
        }
      }
      if (cleanResponse.length() >= 12) {
        if (cleanResponse.length() >= 16) {
          String odoBytes = cleanResponse.substring(cleanResponse.length() - 8, cleanResponse.length() - 2);
          if (odoBytes.length() >= 6) {
            float odo = (strtol(odoBytes.substring(0, 2).c_str(), NULL, 16) * 65536) + (strtol(odoBytes.substring(2, 4).c_str(), NULL, 16) * 256) + strtol(odoBytes.substring(4, 6).c_str(), NULL, 16);
            if (odo > 1000 && odo < 999999) {
              logMessage(LOG_INFO, "Parsed 3-byte odometer: " + String(odo) + " km (0x" + odoBytes + ")");
              return odo;
            }
          }
        }
        String lastBytes = cleanResponse.substring(cleanResponse.length() - 4);
        if (lastBytes.length() >= 4) {
          float val = (strtol(lastBytes.substring(0, 2).c_str(), NULL, 16) * 256) + strtol(lastBytes.substring(2, 4).c_str(), NULL, 16);
          logMessage(LOG_INFO, "Extracted 2-byte value: " + String(val) + " (0x" + lastBytes + ")");
          if (val > 1000 && val < 999999) return val;
          else if (val > 0) return val;
        }
      }
      return 1.0; // Generic success
    }
    return 0.0;
  };
  
  // Check vehicle readiness first
  logMessage(LOG_INFO, "🚗 Checking vehicle readiness...");
  bool vehicleReady = false;
  
  // Test basic communication
  float testRpm = getOBDValue("010C", "RPM");
  if (testRpm > 0) {
    vehicleReady = true;
    logMessage(LOG_INFO, "✅ Vehicle is responsive (RPM: " + String(testRpm) + ")");
  } else {
    logMessage(LOG_WARN, "⚠️ Vehicle may be OFF or not ready - continuing with discovery anyway");
  }
  
  totalAttempts++; data.rpm = testRpm; if (data.rpm > 0) successCount++;
  totalAttempts++; data.speed = getOBDValue("010D", "Speed"); if (data.speed > 0) successCount++;
  totalAttempts++; data.engineTemp = getOBDValue("0105", "Engine Temperature"); if (data.engineTemp > 0) successCount++;
  totalAttempts++; data.fuelLevel = getOBDValue("012F", "Fuel Level"); if (data.fuelLevel > 0) successCount++;

  totalAttempts++; // For odometer reading attempt
  
  // ===== INTELLIGENT ODOMETER READING STRATEGY =====
  bool odometerFound = false;
  
  if (config.selectedVehicle == 4) { 
    // AUTO-DISCOVERED MODE: Use previously saved PID and scale
    logMessage(LOG_INFO, "🚗 AUTO-DISCOVERED MODE: Using saved PID and Scale.");
    if (String(config.discoveredOdoPID_String) != "N/A" && String(config.discoveredOdoPID_String) != "") {
      logMessage(LOG_INFO, "   Attempting to read PID: " + String(config.discoveredOdoPID_String) + " with Stored Scale: " + String(config.discoveredOdoScale, 4));
      float rawValue = getOBDValue(String(config.discoveredOdoPID_String), "Discovered Odometer");
      if (rawValue > 0.1 && isPlausibleOdometer(rawValue * config.discoveredOdoScale)) {
        data.mileage = rawValue * config.discoveredOdoScale;
        data.odometerPID = String(config.discoveredOdoPID_String);
        odometerFound = true;
        logMessage(LOG_INFO, "   ✅ Raw: " + String(rawValue, 2) + " -> Scaled: " + String(data.mileage, 2) + " km");
      } else {
        logMessage(LOG_WARN, "   ❌ Failed to read valid data from discovered PID");
      }
    } else {
      logMessage(LOG_ERROR, "   ❌ No discovered PID saved for Auto-Discovered Mode");
    }
  }
  
  if (!odometerFound && (config.selectedVehicle == 1 || config.selectedVehicle == 2 || config.selectedVehicle == 3)) {
    // PRE-CONFIGURED VEHICLE MODES: Try known PIDs in priority order
    logMessage(LOG_INFO, "🚗 PRE-CONFIGURED MODE: Trying vehicle-specific PIDs");
    
    // Try Hyundai UDS odometer first if headers/UDS are supported
    {
      auto tryUdsWithHeader = [&](const char* header) -> float {
        // Set request header
        String setHdr = String("ATSH") + header;
        while (elmClient.available()) { elmClient.read(); }
        elmClient.println(setHdr);
        unsigned long t0 = millis();
        while (millis() - t0 < 500) { if (elmClient.available()) elmClient.read(); }
        // Compute response filter = reqID + 0x8
        unsigned long reqId = strtoul(header, NULL, 16);
        unsigned long respId = reqId + 0x8;
        char respHex[8];
        sprintf(respHex, "%03lX", respId);
        String setCra = String("ATCRA") + respHex;
        elmClient.println(setCra);
        t0 = millis();
        while (millis() - t0 < 500) { if (elmClient.available()) elmClient.read(); }
        // Query UDS
        float raw = getOBDValue("22F190", "UDS Odometer");
        // Clear filter (best-effort)
        elmClient.println("ATCRA000");
        t0 = millis();
        while (millis() - t0 < 200) { if (elmClient.available()) elmClient.read(); }
        return raw;
      };
      const char* headersToTry[] = {"7E0", "7E1", "7E2", "7E4", "7E6"};
      for (int hi = 0; hi < 5 && !odometerFound; ++hi) {
        logMessage(LOG_INFO, "   Trying UDS PID: 22F190 with header ATSH" + String(headersToTry[hi]));
        float udsRaw = tryUdsWithHeader(headersToTry[hi]);
        if (udsRaw > 0.1f) {
          float udsScaled = udsRaw * 0.1f; // 0.1 km per bit for F190
          if (isReasonableOdometer(udsScaled)) {
            data.mileage = udsScaled;
            data.odometerPID = "22F190";
            odometerFound = true;
            preferences.begin("working_config", false);
            preferences.putString("workingPID", String("22F190"));
            preferences.putFloat("workingScale", 0.1f);
            preferences.end();
            logMessage(LOG_INFO, "   ✅ UDS PID WORKS! Raw: " + String(udsRaw, 2) + " -> Scaled: " + String(data.mileage, 2) + " km");
            break;
          } else {
            logMessage(LOG_WARN, "   ⚠️ UDS PID returned unreasonable value: " + String(udsScaled, 2) + " km");
          }
        } else {
          logMessage(LOG_DEBUG, "   ❌ UDS 22F190 with ATSH" + String(headersToTry[hi]) + ": No valid response");
        }
      }
    }
    
    if (odometerFound) {
      // Skip legacy PID attempts if UDS succeeded
    } else {
      // Try additional common Hyundai/Kia UDS DIDs for odometer on multiple ECUs
      const char* udsDidCandidates[] = {"22F187", "22F186", "22B002", "22B004"};
      const float scaleCandidates[] = {1.0f, 0.1f, 0.01f};
      const char* headersToTry[] = {"7E0", "7E1", "7E2", "7E4", "7E6"};
      for (int hi = 0; hi < 5 && !odometerFound; ++hi) {
        const char* hdr = headersToTry[hi];
        // Reuse tryUdsWithHeader by temporarily binding the DID
        auto tryUdsDidWithHeader = [&](const char* did, const char* header) -> float {
          String setHdr = String("ATSH") + header;
          while (elmClient.available()) { elmClient.read(); }
          elmClient.println(setHdr);
          unsigned long t0 = millis();
          while (millis() - t0 < 300) { if (elmClient.available()) elmClient.read(); }
          unsigned long reqId = strtoul(header, NULL, 16);
          unsigned long respId = reqId + 0x8;
          char respHex[8];
          sprintf(respHex, "%03lX", respId);
          String setCra = String("ATCRA") + respHex;
          elmClient.println(setCra);
          t0 = millis();
          while (millis() - t0 < 300) { if (elmClient.available()) elmClient.read(); }
          float raw = getOBDValue(String(did), String("UDS Odometer ") + did);
          elmClient.println("ATCRA000");
          t0 = millis();
          while (millis() - t0 < 150) { if (elmClient.available()) elmClient.read(); }
          return raw;
        };
        for (int di = 0; di < 4 && !odometerFound; ++di) {
          const char* did = udsDidCandidates[di];
          logMessage(LOG_INFO, "   Trying UDS DID " + String(did) + " with ATSH" + String(hdr));
          float raw = tryUdsDidWithHeader(did, hdr);
          if (raw > 0.1f) {
            for (int si = 0; si < 3 && !odometerFound; ++si) {
              float scaled = raw * scaleCandidates[si];
              if (isReasonableOdometer(scaled)) {
                data.mileage = scaled;
                data.odometerPID = String(did);
                odometerFound = true;
                preferences.begin("working_config", false);
                preferences.putString("workingPID", data.odometerPID);
                preferences.putFloat("workingScale", scaleCandidates[si]);
                preferences.end();
                logMessage(LOG_INFO, "   ✅ UDS DID " + String(did) + " WORKS! Raw: " + String(raw, 2) + " -> Scaled: " + String(scaled, 2) + " km (scale=" + String(scaleCandidates[si], 3) + ")");
              }
            }
          }
        }
      }
    
    uint16_t pidsToTry[] = {config.primaryOdometerPID, config.secondaryOdometerPID, config.tertiaryOdometerPID};
    String pidNames[] = {"Primary", "Secondary", "Tertiary"};
    
    for (int i = 0; i < 3; ++i) {
      if (pidsToTry[i] == 0) continue;
      
      char pidStrHex[10]; 
      sprintf(pidStrHex, "%04X", pidsToTry[i]);
      logMessage(LOG_INFO, "   Trying " + String(pidNames[i]) + " PID: 0x" + String(pidStrHex));
      
      float rawValue = getOBDValue(String(pidStrHex), String(pidNames[i]) + " Odometer");
      
      if (rawValue > 0.1) {
        float scaledValue = rawValue * ODOMETER_SCALING_FACTOR;
        if (isReasonableOdometer(scaledValue)) {
          data.mileage = scaledValue;
          data.odometerPID = String(pidStrHex);
          odometerFound = true;
          
          // Save this working PID for future use
          preferences.begin("working_config", false);
          preferences.putString("workingPID", String(pidStrHex));
          preferences.putFloat("workingScale", ODOMETER_SCALING_FACTOR);
          preferences.end();
          
          logMessage(LOG_INFO, "   ✅ " + String(pidNames[i]) + " PID WORKS! Raw: " + String(rawValue, 2) + " -> Scaled: " + String(data.mileage, 2) + " km");
          break;
        } else {
          logMessage(LOG_WARN, "   ⚠️ " + String(pidNames[i]) + " PID returned unreasonable value: " + String(scaledValue, 2) + " km");
        }
      } else {
        logMessage(LOG_DEBUG, "   ❌ " + String(pidNames[i]) + " PID: No valid response");
      }
    }
    }
  }
  
  if (!odometerFound && config.selectedVehicle == 99) {
    // DISCOVERY MODE: Intelligent PID scanning without hardcoded target
    logMessage(LOG_INFO, "🔍 DISCOVERY MODE: Intelligent PID scanning for odometer");
    logMessage(LOG_INFO, "📊 Looking for PIDs returning plausible odometer values (1000- km)");
    
    static DiscoveredValue allValues[200];
    int discoveredCount = 0;
    
    static const String allPIDs[] = {
      "0100", "0101", "0102", "0103", "0104", "0105", "0106", "0107", "0108", "0109", "010A", "010B", "010C", "010D", "010E", "010F", 
      "0110", "0111", "0112", "0113", "0114", "0115", "0116", "0117", "0118", "0119", "011A", "011B", "011C", "011D", "011E", "011F", 
      "0120", "0121", "0122", "0123", "0124", "0125", "0126", "0127", "0128", "0129", "012A", "012B", "012C", "012D", "012E", "012F", 
      "0130", "0131", "0132", "0133", "0134", "0135", "0136", "0137", "0138", "0139", "013A", "013B", "013C", "013D", "013E", "013F", 
      "0140", "0141", "0142", "0143", "0144", "0145", "0146", "0147", "0148", "0149", "014A", "014B", "014C", "014D", "014E", "014F", 
      "0900", "0901", "0902", "0903", "0904", "0905", "0906", "0907", "0908", "0909", "090A", "090B", "090C", "090D", "090E", "090F", 
      "2100", "2101", "2102", "2103", "2104", "2105", "2106", "2107", "2110", "2111", "2112", "2113", "2114", "2115", "2116", "2117", 
      "211C", "211D", "211E", "211F", "21A6", "21A7", "21A8", "21A9", "2200", "2201", "2202", "2203", "2204", "2205", "2206", "2207", 
      "2208", "2209", "220A", "220B", "220C", "220D", "220E", "220F", "2210", "2211", "2212", "2213", "2214", "2215", "2216", "2217", 
      "2218", "2219", "221A", "221B", "221C", "221D", "221E", "221F", "2220", "2221", "2222", "2223", "2224", "2225", "2226", "2227", 
      "22A0", "22A1", "22A2", "22A3", "22A4", "22A5", "22A6", "22A7", "22A8", "22A9", "22AA", "22AB", "22AC", "22AD", "22AE", "22AF", 
      "22F0", "22F1", "22F2", "22F3", "22F4", "22F5", "22F6", "22F7", "22F190", "22F191", "22F192", "22F193", "22F194", "22F195", 
      "201C", "201D", "201E", "201F", "00A6", "00A7", "00A8", "00A9"
    };
    
    int totalPIDs = sizeof(allPIDs) / sizeof(allPIDs[0]);
    logMessage(LOG_INFO, "📊 Starting intelligent scan of " + String(totalPIDs) + " PIDs...");
    
    for (int i = 0; i < totalPIDs; i++) {
      String pid = allPIDs[i];
      if (i % 20 == 0) logMessage(LOG_INFO, "📈 Progress: " + String(i) + "/" + String(totalPIDs) + " PIDs scanned");
      
      elmClient.println(pid);
      delay(300);
      String response = "";
      unsigned long start = millis();
      
      while (millis() - start < 1500) {
        if (elmClient.available()) {
          char c = elmClient.read(); 
          response += c;
          if (response.indexOf(">") >= 0) break;
        }
      }
      
      if (response.length() > 0 && response.indexOf("NO DATA") < 0 && response.indexOf("STOPPED") < 0) {
        String clean = response;
        clean.replace(">", ""); clean.replace(" ", ""); clean.replace("\r", ""); clean.replace("\n", ""); clean.toUpperCase();
        
        if (clean.length() > 10) {
          // Parse potential odometer values from response
          bool foundValidValue = false;
          
          // Check CAN responses (7E8, 7E0, etc.)
          if (clean.indexOf("7E8") >= 0) {
            int dataStart = clean.indexOf("7E8") + 7; // Skip frame header
            if (clean.length() > dataStart + 4) {
              // Check different byte combinations for odometer values
              for (int j = 0; j <= min(16, (int)(clean.length() - dataStart - 4)); j += 2) {
                if (dataStart + j + 4 <= clean.length()) {
                  String bytes = clean.substring(dataStart + j, dataStart + j + 4);
                  unsigned long val = strtoul(bytes.c_str(), NULL, 16);
                  if (isReasonableOdometer(val)) {
                    logMessage(LOG_INFO, "  🎯 Found reasonable odometer: " + String(val) + " km (PID: " + pid + ", bytes: 0x" + bytes + ")");
                    if (discoveredCount < 200) { 
                      allValues[discoveredCount] = {pid, (float)val, clean}; 
                      discoveredCount++; 
                      foundValidValue = true; 
                    }
                  }
                }
                // Also check 3-byte values
                if (dataStart + j + 6 <= clean.length()) {
                  String bytes = clean.substring(dataStart + j, dataStart + j + 6);
                  unsigned long val = strtoul(bytes.c_str(), NULL, 16);
                  if (isReasonableOdometer(val)) {
                    logMessage(LOG_INFO, "  🎯 Found reasonable odometer (3-byte): " + String(val) + " km (PID: " + pid + ", bytes: 0x" + bytes + ")");
                    if (discoveredCount < 200) { 
                      allValues[discoveredCount] = {pid, (float)val, clean}; 
                      discoveredCount++; 
                      foundValidValue = true; 
                    }
                  }
                }
              }
            }
          }
          
          // Check Mode 22 responses (starts with 62)
          if (clean.indexOf("62") >= 0) {
            int dataStart = clean.indexOf("62") + 6; // Skip mode 22 header
            if (clean.length() > dataStart + 4) {
              for (int j = 0; j <= min(16, (int)(clean.length() - dataStart - 4)); j += 2) {
                if (dataStart + j + 4 <= clean.length()) {
                  String bytes = clean.substring(dataStart + j, dataStart + j + 4);
                  unsigned long val = strtoul(bytes.c_str(), NULL, 16);
                  if (isReasonableOdometer(val)) {
                    logMessage(LOG_INFO, "  🎯 Found reasonable Mode 22 odometer: " + String(val) + " km (PID: " + pid + ", bytes: 0x" + bytes + ")");
                    if (discoveredCount < 200) { 
                      allValues[discoveredCount] = {pid, (float)val, clean}; 
                      discoveredCount++; 
                      foundValidValue = true; 
                    }
                  }
                }
              }
            }
          }
          
          // Save all responses for analysis even if no valid odometer found
          if (!foundValidValue && discoveredCount < 200) {
            allValues[discoveredCount] = {pid, 0, clean};
            discoveredCount++;
          }
        }
      }
      delay(100);
    }
    
    logMessage(LOG_INFO, "\n📊 ===== DISCOVERY SCAN COMPLETE =====");
    logMessage(LOG_INFO, "Scanned " + String(totalPIDs) + " PIDs");
    logMessage(LOG_INFO, "Found " + String(discoveredCount) + " responses with data");
    
    // Find the best odometer candidate - prefer values in realistic range (50k-100k km)
    float bestOdometerValue = 0;
    String bestOdometerPID = "";
    int validCandidates = 0;
    float bestScore = 999999; // Lower score is better
    
    logMessage(LOG_INFO, "\n🔍 Analyzing odometer candidates:");
    for (int i = 0; i < discoveredCount; i++) {
      if (allValues[i].value > 0.1 && isReasonableOdometer(allValues[i].value)) {
        validCandidates++;
        // Calculate score based on how close to expected range (50k-100k km for most used cars)
        float score = 0;
        if (allValues[i].value >= 50000 && allValues[i].value <= 100000) {
          score = 0; // Perfect range
        } else if (allValues[i].value >= 30000 && allValues[i].value <= 150000) {
          score = abs(allValues[i].value - 75000); // Prefer values closer to 75k average
        } else {
          score = abs(allValues[i].value - 75000) * 2; // Penalize values outside typical range
        }
        
        logMessage(LOG_INFO, "  Candidate " + String(validCandidates) + ": PID " + allValues[i].pid + " = " + String(allValues[i].value, 2) + " km (Score: " + String(score, 1) + ")");
        
        // Choose the value with the best score (most realistic)
        if (score < bestScore) {
          bestScore = score;
          bestOdometerValue = allValues[i].value;
          bestOdometerPID = allValues[i].pid;
          logMessage(LOG_INFO, "    ⭐ New best candidate! Score: " + String(bestScore, 1));
        }
      }
    }
    
    if (bestOdometerPID != "" && bestOdometerValue > 0) {
      // Use the best candidate directly (should be close to actual odometer)
      data.mileage = bestOdometerValue;
      data.odometerPID = bestOdometerPID;
      odometerFound = true;
      
      // Save discovered PID for future use
      preferences.begin("discovered_config", false);
      preferences.putString("discOdoPID", bestOdometerPID);
      preferences.putFloat("discOdoScale", 1.0); // No scaling needed for best candidate
      preferences.putFloat("discLastDash", bestOdometerValue);
      preferences.end();
      
      logMessage(LOG_INFO, "\n🎉 DISCOVERY SUCCESS!");
      logMessage(LOG_INFO, "   Best PID: " + bestOdometerPID + " = " + String(bestOdometerValue, 2) + " km (Score: " + String(bestScore, 1) + ")");
      logMessage(LOG_INFO, "   Selected based on realistic odometer range for used cars");
      logMessage(LOG_INFO, "   Saved for Auto-Discovered Mode (selectedVehicle = 4)");
    } else {
      logMessage(LOG_WARN, "\n❌ DISCOVERY: No reasonable odometer PIDs found");
      logMessage(LOG_INFO, "   Consider checking vehicle connection or trying different PID ranges");
    }
    
    // Save full scan results for analysis
    saveFullScanResultsToSPIFFS(allValues, discoveredCount);
  }
  
  // Final odometer status and validation
  if (odometerFound) {
    successCount++;
    logMessage(LOG_INFO, "✅ ODOMETER READ SUCCESSFULLY: " + String(data.mileage, 2) + " km (PID: " + data.odometerPID + ")");
    
    // Cross-validate with multiple PIDs
    logMessage(LOG_INFO, "\n🔍 ===== ANTI-TAMPERING VALIDATION =====");
    getMultipleOdometerReadings(data, elmClient);
    
    // Validate against historical data
    bool isValid = validateOdometerReading(data);
    
    if (data.tamperingDetected) {
      logMessage(LOG_ERROR, "🚨 TAMPERING DETECTED: " + data.validationStatus);
      logMessage(LOG_ERROR, "🚨 Current: " + String(data.mileage, 2) + " km, Previous: " + String(data.lastKnownMileage, 2) + " km");
    } else {
      logMessage(LOG_INFO, "✅ Validation status: " + data.validationStatus);
      if (data.mileageIncrement > 0) {
        logMessage(LOG_INFO, "🚗 Distance driven: " + String(data.mileageIncrement, 2) + " km");
      }
    }
  } else {
    data.mileage = 0; 
    data.odometerPID = "N/A_AllMethodsFailed";
    data.validationStatus = "READ_FAILED";
    logMessage(LOG_ERROR, "❌ ODOMETER READ FAILED: All methods exhausted");
  }
  
  // Common final steps for fetchEnhancedOBDData, now correctly within the function scope
  if (totalAttempts > 0) { 
    data.dataQuality = (successCount * 100) / totalAttempts;
  } else {
    data.dataQuality = 0; // Avoid division by zero if no attempts were made (e.g. early exit)
  }
  
  String fetchedVin = fetchVIN(elmClient); 
  if (fetchedVin.length() == 17) { 
    data.vin = fetchedVin;
  } else {
    logMessage(LOG_WARN, "Fetched VIN is not 17 characters, using placeholder. VIN: " + fetchedVin);
    data.vin = "VIN_" + String(data.timestamp); 
  }
  
  logMessage(LOG_INFO, "OBD data collection completed. Quality: " + String(data.dataQuality) + "%");
  return successCount > 0;
} // This is the CORRECT closing brace for fetchEnhancedOBDData

// ==================== ENHANCED CELLULAR FUNCTIONS ====================

// Retry mechanism with exponential backoff
bool executeWithRetry(bool (*operation)(), const String& operationName, int maxRetries = 3) {
  for (int attempt = 1; attempt <= maxRetries; attempt++) {
    logMessage(LOG_INFO, operationName + " - Attempt " + String(attempt) + "/" + String(maxRetries));
    
    if (operation()) {
      return true;
    }
    
    if (attempt < maxRetries) {
      int delayMs = 1000 * (1 << (attempt - 1));
      logMessage(LOG_INFO, "Retrying in " + String(delayMs) + "ms");
      delay(delayMs);
    }
  }
  
  logMessage(LOG_ERROR, operationName + " failed after " + String(maxRetries) + " attempts");
  return false;
}

// Test modem communication
bool testModemComm() {
  sendAT("AT");
  return responseBuffer.indexOf("OK") >= 0;
}

// Enhanced modem initialization
bool initializeModem() {
  logMessage(LOG_INFO, "Initializing cellular modem");
  
  // Power cycle modem
  digitalWrite(powerPin, HIGH);
  delay(1000);
  digitalWrite(powerPin, LOW);
  delay(3000);
  
  SerialAT.begin(115200, SERIAL_8N1, RXD1, TXD1);
  delay(3000);
  
  // Test modem communication with retry
  return executeWithRetry(testModemComm, "Modem Communication Test");
}

// Helper function to wait for specific response
bool waitForResponse(const String& expected, unsigned long timeoutMs) {
  String response = "";
  unsigned long start = millis();
  
  while (millis() - start < timeoutMs) {
    if (SerialAT.available()) {
      char c = SerialAT.read();
      response += c;
      if (response.indexOf(expected) >= 0) {
        return true;
      }
    }
    yield();
  }
  
  return false;
}

// Parse HTTP status code from response
int parseHttpStatus(const String& response) {
  int httpPostPos = response.indexOf("+QHTTPPOST:");
  if (httpPostPos >= 0) {
    String restOfResponse = response.substring(httpPostPos);
    int commaPos = restOfResponse.indexOf(',');
    if (commaPos > 0) {
      int secondCommaPos = restOfResponse.indexOf(',', commaPos + 1);
      if (secondCommaPos > 0) {
        String statusStr = restOfResponse.substring(commaPos + 1, secondCommaPos);
        statusStr.trim();
        return statusStr.toInt();
      }
    }
  }
  return 0;
}

// HTTP POST function - Simplified for ngrok (no SSL needed)
bool sendHttpPostEnhanced(const String& payload) {
  // Try up to 3 times
  for (int attempt = 1; attempt <= 3; attempt++) {
    logMessage(LOG_INFO, "HTTP POST attempt " + String(attempt) + " of 3");
    
    // Reset HTTP context
    sendAT("AT+QHTTPSTOP", 1000);
    delay(500);
    
    // Configure HTTP session
    sendAT("AT+QHTTPCFG=\"contextid\",1");
    sendAT("AT+QHTTPCFG=\"responseheader\",1");
    sendAT("AT+QHTTPCFG=\"contenttype\",1");  // 1 = application/json
    // Remove SSL config - ngrok handles HTTPS automatically
    
    // Build URL - Updated for BlockX API endpoint
    // DEBUGGING: Use simple-status endpoint to bypass database operations
    // Change "/api/device/status" to "/api/device/simple-status" for testing
    String url = "https://" + String(config.serverHost) + "/api/device/simple-status";
    // String url = "https://" + String(config.serverHost) + "/api/device/status";
    String urlCmd = "AT+QHTTPURL=" + String(url.length()) + ",80";
    
    // Clear serial buffer before sending URL command
    while (SerialAT.available()) {
      SerialAT.read();
    }
    
    // Send URL command and wait for CONNECT
    logMessage(LOG_INFO, ">> " + urlCmd);
    SerialAT.println(urlCmd);
    
    // Simple detection for CONNECT
    String response = "";
    unsigned long start = millis();
    bool connectFound = false;
    
    while (millis() - start < 5000 && !connectFound) {
      if (SerialAT.available()) {
        char c = SerialAT.read();
        SerialMon.write(c);
        response += c;
        
        if (response.indexOf("CONNECT") >= 0) {
          connectFound = true;
          break;
        }
      }
    }
    
    if (!connectFound) {
      logMessage(LOG_WARN, "❌ No CONNECT prompt for URL - Attempt " + String(attempt));
      continue;
    }
    
    // Send the URL
    logMessage(LOG_INFO, "✅ Sending URL: " + url);
    SerialAT.print(url);
    delay(1000);
    
    // Clear any response data
    while (SerialAT.available()) {
      SerialMon.write(SerialAT.read());
    }
    
    // Send HTTP POST with payload directly
    logMessage(LOG_INFO, "Sending POST request...");
    String postCmd = "AT+QHTTPPOST=" + String(payload.length()) + ",80,80";
    
    // Clear buffer again
    while (SerialAT.available()) {
      SerialAT.read();
    }
    
    logMessage(LOG_INFO, ">> " + postCmd);
    SerialAT.println(postCmd);
    
    // Wait for second CONNECT prompt
    response = "";
    start = millis();
    connectFound = false;
    
    while (millis() - start < 5000 && !connectFound) {
      if (SerialAT.available()) {
        char c = SerialAT.read();
        SerialMon.write(c);
        response += c;
        
        if (response.indexOf("CONNECT") >= 0) {
          connectFound = true;
          break;
        }
      }
    }
    
    if (!connectFound) {
      logMessage(LOG_WARN, "❌ No CONNECT prompt for POST - Attempt " + String(attempt));
      continue;
    }
    
    // SEND JSON PAYLOAD
    logMessage(LOG_INFO, "➡️ Sending JSON payload (" + String(payload.length()) + " bytes)");
    logMessage(LOG_INFO, "🔤 Payload content: " + payload);
    SerialAT.print(payload);
    
    // Wait for data to be sent
    delay(1000);
    
    // Wait for POST result
    response = "";
    start = millis();
    bool statusFound = false;
    while (millis() - start < 15000 && !statusFound) { // Increased timeout
      if (SerialAT.available()) {
        char c = SerialAT.read();
        SerialMon.write(c);
        response += c;
        
        // Look for HTTP response
        if (response.indexOf("+QHTTPPOST:") >= 0) {
          statusFound = true;
          delay(500); // Wait for complete response
          while (SerialAT.available()) {
            c = SerialAT.read();
            SerialMon.write(c);
            response += c;
          }
        }
      }
    }
    
    // Parse HTTP status code
    int httpPostPos = response.indexOf("+QHTTPPOST:");
    if (httpPostPos >= 0) {
      String restOfResponse = response.substring(httpPostPos);
      
      // Extract status: "+QHTTPPOST: 0,200,15"
      int commaPos = restOfResponse.indexOf(',');
      if (commaPos > 0) {
        int secondCommaPos = restOfResponse.indexOf(',', commaPos + 1);
        if (secondCommaPos > 0) {
          String statusStr = restOfResponse.substring(commaPos + 1, secondCommaPos);
          statusStr.trim();
          int statusCode = statusStr.toInt();
          
          logMessage(LOG_INFO, "🌐 HTTP Status: " + String(statusCode));
          
          if (statusCode >= 200 && statusCode < 300) {
            logMessage(LOG_INFO, "✅ SUCCESS! Data sent to server (Status: " + String(statusCode) + ")");
            
            // Try to read server response
            sendAT("AT+QHTTPREAD=80", 5000);
            sendAT("AT+QHTTPSTOP", 1000);
            return true;
          } else {
            logMessage(LOG_ERROR, "❌ Server error (Status: " + String(statusCode) + ")");
          }
        }
      }
      
      logMessage(LOG_DEBUG, "Raw response: " + restOfResponse);
    } else {
      logMessage(LOG_ERROR, "❌ No HTTP POST response found");
      logMessage(LOG_DEBUG, "Full response: " + response);
    }
    
    // Read any response for debugging
    sendAT("AT+QHTTPREAD=80", 3000);
    sendAT("AT+QHTTPSTOP", 1000);
    
    // Wait before retry
    if (attempt < 3) {
      logMessage(LOG_INFO, "⏳ Waiting 2 seconds before retry...");
      delay(2000);
    }
  }
  
  logMessage(LOG_ERROR, "❌ All HTTP POST attempts failed");
  return false;
}

// ==================== DATA MANAGEMENT ====================

// Save connection status to memory
bool saveConnectionStatus(bool veepeakConnected) {
  if (!SPIFFS.begin(true)) {
    logMessage(LOG_ERROR, "SPIFFS Mount Failed");
    return false;
  }
  
  // Create connection status JSON
  DynamicJsonDocument doc(512);
  doc["deviceID"] = config.deviceID;
  doc["status"] = veepeakConnected ? "connected" : "veepeak_failed";
  doc["veepeakConnected"] = veepeakConnected;
  doc["timestamp"] = millis();
  doc["batteryVoltage"] = getBatteryVoltage();
  doc["bootCount"] = preferences.getUInt("bootCount", 0);
  doc["dataSource"] = "connection_status";
  
  if (!veepeakConnected) {
    doc["errorMessage"] = "Failed to connect to Veepeak WiFi network";
    doc["troubleshooting"] = "Check Veepeak device power and WiFi broadcast";
  }
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  // Save connection status file
  String filename = "/connection_" + String(millis()) + ".json";
  File file = SPIFFS.open(filename, FILE_WRITE);
  if (!file) {
    logMessage(LOG_ERROR, "Failed to create connection file: " + filename);
    return false;
  }
  
  file.println(jsonString);
  file.close();
  
  logMessage(LOG_INFO, "Connection status saved: " + filename);
  return true;
}

// Save network information to memory
bool saveNetworkInfo(const NetworkInfo &netInfo) {
  if (!SPIFFS.begin(true)) {
    logMessage(LOG_ERROR, "SPIFFS Mount Failed");
    return false;
  }
  
  // Create network info JSON
  DynamicJsonDocument doc(512);
  doc["deviceID"] = config.deviceID;
  doc["operator"] = netInfo.operatorName;
  doc["signal"] = netInfo.signalStrength;
  doc["sim"] = netInfo.simInfo;
  doc["apn"] = config.apnName;
  doc["networkTime"] = netInfo.networkTime;
  doc["ipAddress"] = netInfo.ipAddress;
  doc["isConnected"] = netInfo.isConnected;
  doc["timestamp"] = millis();
  doc["dataSource"] = "network_diagnostics";
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  // Save network info file
  String filename = "/network_" + String(millis()) + ".json";
  File file = SPIFFS.open(filename, FILE_WRITE);
  if (!file) {
    logMessage(LOG_ERROR, "Failed to create network file: " + filename);
    return false;
  }
  
  file.println(jsonString);
  file.close();
  
  logMessage(LOG_INFO, "Network info saved: " + filename);
  return true;
}

// Enhanced data storage with JSON format
bool saveVehicleDataToMemory(const VehicleData &data) {
  if (!SPIFFS.begin(true)) {
    logMessage(LOG_ERROR, "SPIFFS Mount Failed");
    return false;
  }
  
  // Create JSON document with enhanced anti-tampering fields
  DynamicJsonDocument doc(1536); // Increased size for additional fields
  doc["deviceID"] = data.deviceID;
  doc["vin"] = data.vin;
  doc["mileage"] = data.mileage;
  doc["rpm"] = data.rpm;
  doc["speed"] = data.speed;
  doc["engineTemp"] = data.engineTemp;
  doc["fuelLevel"] = data.fuelLevel;
  doc["batteryVoltage"] = data.batteryVoltage;
  doc["timestamp"] = data.timestamp;
  doc["dataQuality"] = data.dataQuality;
  doc["odometerPID"] = data.odometerPID;
  doc["dataSource"] = "veepeak_obd";
  
  // Anti-tampering and validation fields
  doc["lastKnownMileage"] = data.lastKnownMileage;
  doc["mileageIncrement"] = data.mileageIncrement;
  doc["tamperingDetected"] = data.tamperingDetected;
  doc["validationStatus"] = data.validationStatus;
  doc["alternateOdometerReading"] = data.alternateOdometerReading;
  doc["alternateOdometerPID"] = data.alternateOdometerPID;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  // Save to timestamped file for buffering
  String filename = "/data_" + String(data.timestamp) + ".json";
  File file = SPIFFS.open(filename, FILE_WRITE);
  if (!file) {
    logMessage(LOG_ERROR, "Failed to create data file: " + filename);
    return false;
  }
  
  file.println(jsonString);
  file.close();
  
  logMessage(LOG_INFO, "Vehicle data saved: " + filename);
  
  return true;
}

// Get all pending data files for upload (data, connection, network)
int getPendingDataFiles(String files[], int maxFiles) {
  if (!SPIFFS.begin(true)) {
    logMessage(LOG_ERROR, "SPIFFS Mount Failed in getPendingDataFiles");
    return 0;
  }
  
  File root = SPIFFS.open("/");
  if (!root) {
    logMessage(LOG_ERROR, "Failed to open root directory");
    return 0;
  }
  
  int count = 0;
  File file = root.openNextFile();
  
  while (file && count < maxFiles) {
    String filename = String(file.name());
    logMessage(LOG_DEBUG, "Checking file: " + filename);
    
    if (filename.startsWith("/data_") || 
        filename.startsWith("/connection_") || 
        filename.startsWith("/network_")) {
      files[count] = filename;
      count++;
      logMessage(LOG_DEBUG, "Added file to transmission list: " + filename);
    }
    
    file.close();
    file = root.openNextFile();
  }
  
  root.close();
  logMessage(LOG_INFO, "Found " + String(count) + " files for transmission");
  return count;
}

// ==================== SYSTEM DIAGNOSTICS ====================

// Comprehensive system health check
void performSystemDiagnostics() {
  logMessage(LOG_INFO, "=== SYSTEM DIAGNOSTICS ===");
  
  // Memory diagnostics
  logMessage(LOG_INFO, "Free heap: " + String(ESP.getFreeHeap()) + " bytes");
  logMessage(LOG_INFO, "Largest free block: " + String(ESP.getMaxAllocHeap()) + " bytes");
  
  // SPIFFS diagnostics
  if (SPIFFS.begin(true)) {
    logMessage(LOG_INFO, "SPIFFS total: " + String(SPIFFS.totalBytes()) + " bytes");
    logMessage(LOG_INFO, "SPIFFS used: " + String(SPIFFS.usedBytes()) + " bytes");
  }
  
  // Battery diagnostics (informational only)
  float battVoltage = getBatteryVoltage();
  logMessage(LOG_INFO, "🔋 Battery voltage: " + String(battVoltage) + "V");
  
  // Boot diagnostics
  logMessage(LOG_INFO, "Boot count: " + String(preferences.getUInt("bootCount", 0)));
  logMessage(LOG_INFO, "Last error: " + preferences.getString("lastError", "None"));
}

// ==================== MAIN FUNCTIONS ====================

void sendAT(const char* cmd, int timeout) {
  SerialMon.print(">> ");
  SerialMon.println(cmd);
  SerialAT.println(cmd);
  responseBuffer = "";

  unsigned long start = millis();
  while (millis() - start < timeout) {
    if (SerialAT.available()) {
      char c = SerialAT.read();
      SerialMon.write(c);
      responseBuffer += c;
    }
    yield();
  }
}

void print_wakeup_reason() {
  esp_sleep_wakeup_cause_t wakeup_reason = esp_sleep_get_wakeup_cause();
  
  switch(wakeup_reason) {
    case ESP_SLEEP_WAKEUP_TIMER:
      logMessage(LOG_INFO, "Wakeup: Timer");
      break;
    case ESP_SLEEP_WAKEUP_EXT0:
      logMessage(LOG_INFO, "Wakeup: External signal (RTC_IO)");
      break;
    case ESP_SLEEP_WAKEUP_EXT1:
      logMessage(LOG_INFO, "Wakeup: External signal (RTC_CNTL)");
      break;
    case ESP_SLEEP_WAKEUP_TOUCHPAD:
      logMessage(LOG_INFO, "Wakeup: Touchpad");
      break;
    case ESP_SLEEP_WAKEUP_ULP:
      logMessage(LOG_INFO, "Wakeup: ULP program");
      break;
    default:
      logMessage(LOG_INFO, "Wakeup: Power on or reset");
      break;
  }
}

bool connectToVeepeak() {
  logMessage(LOG_INFO, "🔌 Connecting to WiFi_OBDII...");
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(config.veepeakSSID, config.veepeakPassword);
  
  unsigned long start = millis();
  int attempts = 0;
  const int maxAttempts = 30; // 15 seconds total
  
  while (WiFi.status() != WL_CONNECTED && attempts < maxAttempts) {
    delay(500);
    yield(); // Feed watchdog and allow other tasks
    SerialMon.print(".");
    attempts++;
    
    // Reset WiFi if taking too long
    if (attempts > 20) {
      logMessage(LOG_WARN, "WiFi connection slow, resetting...");
      WiFi.disconnect();
      delay(1000);
      WiFi.begin(config.veepeakSSID, config.veepeakPassword);
      attempts = 0; // Reset counter
    }
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    logMessage(LOG_INFO, "✅ Connected to WiFi_OBDII! IP: " + WiFi.localIP().toString());
    logMessage(LOG_INFO, "Gateway IP: " + WiFi.gatewayIP().toString());
    logMessage(LOG_INFO, "DNS IP: " + WiFi.dnsIP().toString());
    return true;
  } else {
    logMessage(LOG_ERROR, "❌ Failed to connect to WiFi_OBDII");
    return false;
  }
} 

void disconnectFromVeepeak() {
  WiFi.disconnect(true);
  WiFi.mode(WIFI_OFF);
  delay(1000);
  logMessage(LOG_INFO, "📴 Disconnected from WiFi_OBDII");
}

void updateNetworkInfo() {
  logMessage(LOG_INFO, "📡 Updating network information...");
  
  // Get operator information
  sendAT("AT+COPS?", 2000);
  if (responseBuffer.indexOf("+COPS:") >= 0) {
    // Parse operator name from response like: +COPS: 0,0,"IND airtel",7
    int startQuote = responseBuffer.indexOf('"');
    if (startQuote >= 0) {
      int endQuote = responseBuffer.indexOf('"', startQuote + 1);
      if (endQuote > startQuote) {
        networkInfo.operatorName = responseBuffer.substring(startQuote + 1, endQuote);
      }
    }
  }
  
  // Get signal strength
  sendAT("AT+CSQ", 2000);
  if (responseBuffer.indexOf("+CSQ:") >= 0) {
    // Parse signal strength from response like: +CSQ: 27,99
    int colonPos = responseBuffer.indexOf(':');
    if (colonPos >= 0) {
      int commaPos = responseBuffer.indexOf(',', colonPos);
      if (commaPos > colonPos) {
        String signalStr = responseBuffer.substring(colonPos + 1, commaPos);
        signalStr.trim();
        int signalValue = signalStr.toInt();
        networkInfo.signalStrength = String(signalValue) + " (" + String((signalValue * 100) / 31) + "%)";
      }
    }
  }
  
  // Get SIM information
  sendAT("AT+CIMI", 2000);
  if (responseBuffer.indexOf("404") >= 0 || responseBuffer.indexOf("405") >= 0) {  
    // Extract IMSI number
    String imsi = responseBuffer;
    imsi.replace("AT+CIMI", "");
    imsi.replace("OK", "");
    imsi.replace("\r", "");
    imsi.replace("\n", "");
    imsi.trim();
    if (imsi.length() >= 10) {
      networkInfo.simInfo = imsi;
    }
  }
  
  // Get IP address
  sendAT("AT+QIACT?", 2000);
  if (responseBuffer.indexOf("+QIACT:") >= 0) {
    // Parse IP from response
    int lastComma = responseBuffer.lastIndexOf(',');
    if (lastComma >= 0) {
      int quoteStart = responseBuffer.indexOf('"', lastComma);
      int quoteEnd = responseBuffer.indexOf('"', quoteStart + 1);
      if (quoteStart >= 0 && quoteEnd > quoteStart) {
        networkInfo.ipAddress = responseBuffer.substring(quoteStart + 1, quoteEnd);
      }
    }
  }
  
  networkInfo.isConnected = true;
  networkInfo.networkTime = String(millis());
  
  logMessage(LOG_INFO, "✅ Network info - Operator: " + networkInfo.operatorName + 
                       ", Signal: " + networkInfo.signalStrength + 
                       ", SIM: " + networkInfo.simInfo.substring(0, 8) + "...");
  
  // Save network information to file
  saveNetworkInfo(networkInfo);
}

// Enhanced deep sleep with proper cleanup
void enterDeepSleepSafely(uint32_t sleepMinutes) {
  logMessage(LOG_INFO, "🔧 Preparing for safe deep sleep...");
  
  // 1. Disconnect WiFi and disable radio
  WiFi.disconnect(true);
  WiFi.mode(WIFI_OFF);
  delay(100);
  
  // 2. Close all SPIFFS operations
  SPIFFS.end();
  
  // 3. Close preferences
  preferences.end();
  
  // 4. Disable Bluetooth (if enabled)
  btStop();
  
  // 5. Power down cellular modem properly
  sendAT("AT+QPOWD=1", 5000);
  delay(2000);
  
  // 6. Configure sleep parameters for minimum power (compatible with all ESP32 versions)
  esp_sleep_pd_config(ESP_PD_DOMAIN_RTC_PERIPH, ESP_PD_OPTION_OFF);
  
  // Use version-compatible power domain constants
  #ifdef ESP_PD_DOMAIN_RTC_SLOW_MEM
    esp_sleep_pd_config(ESP_PD_DOMAIN_RTC_SLOW_MEM, ESP_PD_OPTION_OFF);
  #endif
  
  #ifdef ESP_PD_DOMAIN_RTC_FAST_MEM
    esp_sleep_pd_config(ESP_PD_DOMAIN_RTC_FAST_MEM, ESP_PD_OPTION_OFF);
  #endif
  
  // 7. Isolate GPIO pins to prevent current leakage
  gpio_hold_en(GPIO_NUM_2);   // LED pin
  gpio_hold_en(GPIO_NUM_42);  // Power pin
  gpio_deep_sleep_hold_en();
  
  // 8. Set wakeup timer
  uint64_t sleepDurationUs = sleepMinutes * 60 * 1000000ULL;
  esp_sleep_enable_timer_wakeup(sleepDurationUs);
  
  logMessage(LOG_INFO, "💤 Entering deep sleep for " + String(sleepMinutes) + " minutes");
  SerialMon.flush();
  
  // 9. Enter deep sleep
  esp_deep_sleep_start();
}

void setup() {
  SerialMon.begin(115200);
  delay(2000);
  
  // Initialize hardware
  pinMode(powerPin, OUTPUT);
  pinMode(ledPin, OUTPUT);
  setStatusLED(true, 3); // 3 blinks to indicate startup
  
  logMessage(LOG_INFO, "🚗 Enhanced Vehicle Telematics System Starting");
  
  // Load configuration and increment boot count
  loadConfiguration();
  uint32_t bootCount = preferences.getUInt("bootCount", 0) + 1;
  preferences.putUInt("bootCount", bootCount);
  
  print_wakeup_reason();
  performSystemDiagnostics();
  
  // PHASE 1: OBD Data Collection
  logMessage(LOG_INFO, "\n==== PHASE 1: OBD DATA COLLECTION ====");
  setStatusLED(true, 1);
  
  bool obdSuccess = false;
  bool veepeakConnected = false;
  String deviceStatus = "";
  
  // Try to connect to Veepeak
  if (connectToVeepeak()) {
    veepeakConnected = true;
    VehicleData vehicleData;
    if (fetchEnhancedOBDData(vehicleData)) {
      obdSuccess = true;
      logMessage(LOG_INFO, "✅ OBD data collected successfully");
      
      // Create successful OBD data message with proper JSON formatting
      deviceStatus = "{";
      // Send ONLY one identifier: deviceID set to OBD device id
      deviceStatus += "\"deviceID\":\"" + String(config.deviceId) + "\",";
      deviceStatus += "\"status\":\"obd_connected\",";
      deviceStatus += "\"message\":\"Veepeak OBD data collected successfully\",";
      
      // Ensure VIN is properly formatted (remove any quotes or special chars)
      String cleanVin = vehicleData.vin;
      cleanVin.replace("\"", "");
      cleanVin.replace("\\", "");
      if (cleanVin.length() == 0) cleanVin = "UNKNOWN_VIN";
      deviceStatus += "\"vin\":\"" + cleanVin + "\",";
      
      deviceStatus += "\"mileage\":" + String(vehicleData.mileage, 2) + ",";
      deviceStatus += "\"rpm\":" + String(vehicleData.rpm, 0) + ",";
      deviceStatus += "\"speed\":" + String(vehicleData.speed, 1) + ",";
      deviceStatus += "\"engineTemp\":" + String(vehicleData.engineTemp, 1) + ",";
      deviceStatus += "\"fuelLevel\":" + String(vehicleData.fuelLevel, 1) + ",";
      deviceStatus += "\"batteryVoltage\":" + String(vehicleData.batteryVoltage, 2) + ",";
      deviceStatus += "\"dataQuality\":" + String(vehicleData.dataQuality) + ",";
      
      // Clean odometerPID
      String cleanPID = vehicleData.odometerPID;
      cleanPID.replace("\"", "");
      cleanPID.replace("\\", "");
      if (cleanPID.length() == 0) cleanPID = "N/A";
      deviceStatus += "\"odometerPID\":\"" + cleanPID + "\",";
      
      deviceStatus += "\"bootCount\":" + String(bootCount) + ",";
      deviceStatus += "\"timestamp\":" + String(millis()) + ",";
      deviceStatus += "\"dataSource\":\"veepeak_obd\",";
      deviceStatus += "\"veepeakConnected\":true";
      deviceStatus += "}";
      
      // Debug: Print JSON payload
      logMessage(LOG_INFO, "📋 JSON Payload (SUCCESS): " + deviceStatus);
      logMessage(LOG_INFO, "📏 Payload length: " + String(deviceStatus.length()) + " bytes");
    }
    disconnectFromVeepeak();
  }
  
  // If OBD failed, create device not connected message
  if (!obdSuccess) {
    logMessage(LOG_WARN, veepeakConnected ? "OBD data collection failed" : "Failed to connect to Veepeak WiFi");
    
    deviceStatus = "{";
    // Send ONLY one identifier: deviceID set to OBD device id
    deviceStatus += "\"deviceID\":\"" + String(config.deviceId) + "\",";
    deviceStatus += "\"status\":\"device_not_connected\",";
    deviceStatus += "\"message\":\"" + String(veepeakConnected ? "OBD data collection failed" : "Veepeak WiFi connection failed") + "\",";
    deviceStatus += "\"veepeakConnected\":" + String(veepeakConnected ? "true" : "false") + ",";
    deviceStatus += "\"batteryVoltage\":" + String(getBatteryVoltage(), 2) + ",";
    deviceStatus += "\"bootCount\":" + String(bootCount) + ",";
    deviceStatus += "\"timestamp\":" + String(millis()) + ",";
    deviceStatus += "\"dataSource\":\"device_status\"";
    deviceStatus += "}";
    
    // Debug: Print JSON payload
    logMessage(LOG_INFO, "📋 JSON Payload (ERROR): " + deviceStatus);
    logMessage(LOG_INFO, "📏 Payload length: " + String(deviceStatus.length()) + " bytes");
  } 
  
  // PHASE 2: Cellular Communication
  logMessage(LOG_INFO, "\n==== PHASE 2: CELLULAR COMMUNICATION ====");
  setStatusLED(true, 2);
  
  if (initializeModem()) {
    // Configure and connect to cellular network
    sendAT("ATE0");
    sendAT(("AT+QICSGP=1,1,\"" + String(config.apnName) + "\",\"\",\"\",1").c_str());
    sendAT("AT+QIACT=1", 6000);
    
    // PHASE 3: Send Device Status
    logMessage(LOG_INFO, "\n==== PHASE 3: SENDING DEVICE STATUS ====");
    setStatusLED(true, 3);
    
    // Validate JSON before sending
    if (deviceStatus.length() < 50) {
      logMessage(LOG_ERROR, "❌ Device status JSON too short: " + String(deviceStatus.length()) + " bytes");
      logMessage(LOG_ERROR, "❌ JSON content: " + deviceStatus);
    } else {
      logMessage(LOG_INFO, "📤 Sending device status (" + String(deviceStatus.length()) + " bytes): " + deviceStatus);
      
      if (sendHttpPostEnhanced(deviceStatus)) {
        logMessage(LOG_INFO, "✅ Device status sent successfully");
      } else {
        logMessage(LOG_ERROR, "❌ Failed to send device status");
        logMessage(LOG_INFO, "🔄 Retrying with simplified payload...");
        
        // Create minimal payload for retry
        String minimalPayload = "{";
        minimalPayload += "\"deviceID\":\"" + String(config.deviceID) + "\",";
        minimalPayload += "\"status\":\"error\",";
        minimalPayload += "\"message\":\"HTTP transmission failed\",";
        minimalPayload += "\"timestamp\":" + String(millis()) + ",";
        minimalPayload += "\"dataSource\":\"device_error\"";
        minimalPayload += "}";
        
        logMessage(LOG_INFO, "🔄 Minimal payload: " + minimalPayload);
        sendHttpPostEnhanced(minimalPayload);
      }
    }
    
    // Graceful modem shutdown
    sendAT("AT+QPOWD=1");
  } else {
    logMessage(LOG_ERROR, "Cellular modem initialization failed");
  }
  
  // PHASE 4: Sleep Management
  logMessage(LOG_INFO, "\n==== PHASE 4: SLEEP MANAGEMENT ====");
  setStatusLED(false);
  
  enterDeepSleepSafely(config.sleepDurationMinutes);
}

void loop() {
  // Should never reach here due to deep sleep
} 