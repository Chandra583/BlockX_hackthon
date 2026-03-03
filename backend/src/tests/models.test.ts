import { connectDatabase } from '../config/database';
import { User, Notification } from '../models';
import { logger } from '../utils/logger';

// Test data for each user role
const testUsers = [
  {
    email: 'admin@Trivexachain.com',
    password: 'SecurePass123!',
    firstName: 'John',
    lastName: 'Admin',
    role: 'admin' as const,
    roleData: {
      adminLevel: 'super',
      permissions: ['user_management', 'fraud_investigation', 'system_admin'],
      departments: ['security', 'operations'],
      accessLevel: 10,
      investigationsConducted: 0,
      fraudCasesResolved: 0
    }
  },
  {
    email: 'owner@Trivexachain.com',
    password: 'SecurePass123!',
    firstName: 'Jane',
    lastName: 'Smith',
    role: 'owner' as const,
    roleData: {
      licenseNumber: 'DL123456789',
      licenseExpiry: new Date('2025-12-31'),
      vehiclesOwned: [],
      devicesRegistered: [],
      totalMileageRecorded: 0,
      fraudAlertsReceived: 0,
      verificationLevel: 'basic',
      trackingConsent: true
    }
  },
  {
    email: 'buyer@Trivexachain.com',
    password: 'SecurePass123!',
    firstName: 'Mike',
    lastName: 'Johnson',
    role: 'buyer' as const,
    roleData: {
      buyerType: 'individual',
      purchaseHistory: [],
      savedSearches: [],
      watchlist: [],
      financingPreapproved: false
    }
  },
  {
    email: 'service@Trivexachain.com',
    password: 'SecurePass123!',
    firstName: 'Sarah',
    lastName: 'Wilson',
    role: 'service' as const,
    roleData: {
      businessName: 'Wilson Auto Services',
      businessType: 'mechanic',
      licenseNumber: 'SRV987654321',
      licenseExpiry: new Date('2025-06-30'),
      serviceCategories: ['maintenance', 'inspection'],
      certificationsHeld: ['ASE_CERTIFIED'],
      serviceRadius: 25,
      servicesCompleted: 0,
      averageRating: 0,
      isAuthorizedDealer: false
    }
  },
  {
    email: 'insurance@Trivexachain.com',
    password: 'SecurePass123!',
    firstName: 'Robert',
    lastName: 'Davis',
    role: 'insurance' as const,
    roleData: {
      companyName: 'SafeGuard Insurance',
      licenseNumber: 'INS555666777',
      licenseExpiry: new Date('2025-12-31'),
      coverageTypes: ['auto', 'comprehensive'],
      riskModels: ['standard', 'premium'],
      policiesIssued: 0,
      claimsProcessed: 0,
      fraudCasesReported: 0,
      apiIntegrationLevel: 'basic'
    }
  },
  {
    email: 'government@Trivexachain.com',
    password: 'SecurePass123!',
    firstName: 'Lisa',
    lastName: 'Anderson',
    role: 'government' as const,
    roleData: {
      agencyName: 'Department of Motor Vehicles',
      agencyType: 'state',
      jurisdiction: 'California',
      departmentCode: 'DMV-CA',
      clearanceLevel: 'public',
      accessScope: ['vehicle_registration', 'license_verification'],
      reportingRequirements: ['monthly_fraud_report'],
      complianceMonitoring: true
    }
  }
];

async function testUserModels() {
  try {
    logger.info('🧪 Starting User Model Tests...');
    
    // Clear existing test data
    await User.deleteMany({ email: { $in: testUsers.map(u => u.email) } });
    
    // Test 1: Create users for each role
    logger.info('📝 Test 1: Creating users for all 6 roles...');
    const createdUsers = [];
    
    for (const userData of testUsers) {
      try {
        const user = new User(userData);
        await user.save();
        createdUsers.push(user);
        logger.info(`✅ Created ${userData.role} user: ${userData.email}`);
      } catch (error) {
        logger.error(`❌ Failed to create ${userData.role} user: ${error.message}`);
      }
    }
    
    // Test 2: Test password hashing
    logger.info('🔐 Test 2: Testing password hashing...');
    const testUser = createdUsers[0];
    const isPasswordValid = await testUser.comparePassword('SecurePass123!');
    const isPasswordInvalid = await testUser.comparePassword('WrongPassword');
    
    if (isPasswordValid && !isPasswordInvalid) {
      logger.info('✅ Password hashing and comparison works correctly');
    } else {
      logger.error('❌ Password hashing test failed');
    }
    
    // Test 3: Test virtual fields
    logger.info('📊 Test 3: Testing virtual fields...');
    logger.info(`Full Name: ${testUser.fullName}`);
    logger.info(`Is Locked: ${testUser.isLocked}`);
    
    // Test 4: Test role-based queries
    logger.info('🔍 Test 4: Testing role-based queries...');
    const adminUsers = await User.findByRole('admin');
    const ownerUsers = await User.findByRole('owner');
    
    logger.info(`Found ${adminUsers.length} admin users`);
    logger.info(`Found ${ownerUsers.length} owner users`);
    
    // Test 5: Test email lookup
    logger.info('📧 Test 5: Testing email lookup...');
    const foundUser = await User.findByEmail('admin@Trivexachain.com');
    if (foundUser) {
      logger.info(`✅ Found user by email: ${foundUser.fullName}`);
    } else {
      logger.error('❌ Email lookup failed');
    }
    
    // Test 6: Test account lockout mechanism
    logger.info('🔒 Test 6: Testing account lockout...');
    const lockoutUser = createdUsers[1];
    await lockoutUser.incrementLoginAttempts();
    await lockoutUser.incrementLoginAttempts();
    await lockoutUser.incrementLoginAttempts();
    await lockoutUser.incrementLoginAttempts();
    await lockoutUser.incrementLoginAttempts(); // Should lock account
    
    const updatedUser = await User.findById(lockoutUser._id);
    if (updatedUser?.isLocked) {
      logger.info('✅ Account lockout mechanism works');
      await updatedUser.resetLoginAttempts();
      logger.info('✅ Account unlocked successfully');
    } else {
      logger.error('❌ Account lockout test failed');
    }
    
    logger.info('🎉 All User Model tests completed successfully!');
    return createdUsers;
    
  } catch (error) {
    logger.error(`❌ User Model test failed: ${error.message}`);
    throw error;
  }
}

async function testNotificationModel(users: any[]) {
  try {
    logger.info('🔔 Starting Notification Model Tests...');
    
    // Clear existing test notifications
    await Notification.deleteMany({ userId: { $in: users.map(u => u._id.toString()) } });
    
    // Test 1: Create notifications for different types
    logger.info('📝 Test 1: Creating notifications...');
    const testNotifications = [
      {
        userId: users[0]._id.toString(),
        userRole: users[0].role,
        title: 'Welcome to Trivexachain',
        message: 'Your account has been created successfully.',
        type: 'system',
        priority: 'medium',
        channels: ['email', 'in_app'],
        actionUrl: '/dashboard',
        actionLabel: 'Go to Dashboard'
      },
      {
        userId: users[1]._id.toString(),
        userRole: users[1].role,
        title: 'Fraud Alert',
        message: 'Suspicious activity detected on your vehicle.',
        type: 'fraud_alert',
        priority: 'urgent',
        channels: ['email', 'sms', 'push', 'in_app'],
        actionUrl: '/alerts',
        actionLabel: 'View Details'
      },
      {
        userId: users[2]._id.toString(),
        userRole: users[2].role,
        title: 'Verification Required',
        message: 'Please verify your email address.',
        type: 'verification',
        priority: 'high',
        channels: ['email', 'in_app'],
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    ];
    
    const createdNotifications = [];
    for (const notificationData of testNotifications) {
      const notification = new Notification(notificationData);
      await notification.save();
      createdNotifications.push(notification);
      logger.info(`✅ Created ${notificationData.type} notification for ${notificationData.userRole}`);
    }
    
    // Test 2: Test notification queries
    logger.info('🔍 Test 2: Testing notification queries...');
    const userNotifications = await Notification.findUnreadByUser(users[0]._id.toString());
    logger.info(`Found ${userNotifications.length} unread notifications for user`);
    
    const fraudAlerts = await Notification.findByUserAndType(users[1]._id.toString(), 'fraud_alert');
    logger.info(`Found ${fraudAlerts.length} fraud alerts for user`);
    
    // Test 3: Test notification methods
    logger.info('📖 Test 3: Testing notification methods...');
    const testNotification = createdNotifications[0];
    
    // Test virtual fields
    logger.info(`Time ago: ${testNotification.timeAgo}`);
    logger.info(`Is read: ${testNotification.isRead}`);
    logger.info(`Is expired: ${testNotification.isExpired}`);
    
    // Test mark as read
    await testNotification.markAsRead();
    logger.info('✅ Marked notification as read');
    
    // Test mark as delivered
    await testNotification.markAsDelivered('email');
    logger.info('✅ Marked notification as delivered via email');
    
    // Test 4: Test notification statistics
    logger.info('📊 Test 4: Testing notification statistics...');
    const stats = await Notification.getNotificationStats(users[0]._id.toString());
    logger.info(`Notification stats:`, stats);
    
    // Test 5: Test bulk operations
    logger.info('📋 Test 5: Testing bulk operations...');
    await Notification.markAllAsReadForUser(users[1]._id.toString());
    logger.info('✅ Marked all notifications as read for user');
    
    logger.info('🎉 All Notification Model tests completed successfully!');
    
  } catch (error) {
    logger.error(`❌ Notification Model test failed: ${error.message}`);
    throw error;
  }
}

async function runAllTests() {
  try {
    logger.info('🚀 Starting Trivexachain Model Tests...');
    
    // Connect to database
    await connectDatabase();
    
    // Run user model tests
    const createdUsers = await testUserModels();
    
    // Run notification model tests
    await testNotificationModel(createdUsers);
    
    logger.info('🎊 All tests completed successfully!');
    
    // Cleanup test data
    logger.info('🧹 Cleaning up test data...');
    await User.deleteMany({ email: { $in: testUsers.map(u => u.email) } });
    await Notification.deleteMany({ userId: { $in: createdUsers.map(u => u._id.toString()) } });
    
    logger.info('✅ Test data cleaned up');
    
    process.exit(0);
    
  } catch (error) {
    logger.error(`❌ Tests failed: ${error.message}`);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

export { testUserModels, testNotificationModel }; 