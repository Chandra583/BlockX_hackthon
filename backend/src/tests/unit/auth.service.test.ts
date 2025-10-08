import { AuthService } from '../../services/core/auth.service';
import { User } from '../../models/core/User.model';
import { setupTestDatabase, teardownTestDatabase, clearDatabase, createTestUser } from '../setup';

describe('Auth Service', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('User Registration', () => {
    const validRegistrationData = {
      email: 'test@veridrive.com',
      password: 'SecurePass123!',
      confirmPassword: 'SecurePass123!',
      firstName: 'John',
      lastName: 'Doe',
      role: 'buyer' as const,
      termsAccepted: true,
      privacyAccepted: true
    };

    test('should register a new user successfully', async () => {
      const registrationData = {
        ...validRegistrationData,
        roleSpecificData: {}
      };
      
      const result = await AuthService.register(registrationData);
      
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(validRegistrationData.email);
      expect(result.user.role).toBe(validRegistrationData.role);
      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
    });

    test('should hash password correctly', async () => {
      const registrationData = {
        ...validRegistrationData,
        roleSpecificData: {}
      };
      
      await AuthService.register(registrationData);
      
      const user = await User.findOne({ email: validRegistrationData.email });
      expect(user).toBeDefined();
      expect(user!.password).not.toBe(validRegistrationData.password);
      expect(user!.password.length).toBeGreaterThan(50); // bcrypt hash length
    });

    test('should reject registration with existing email', async () => {
      const registrationData = {
        ...validRegistrationData,
        roleSpecificData: {}
      };
      
      await AuthService.register(registrationData);
      
      await expect(AuthService.register(registrationData))
        .rejects.toThrow('User already exists with this email');
    });

    test('should reject registration with password mismatch', async () => {
      const invalidData = {
        ...validRegistrationData,
        confirmPassword: 'DifferentPassword123!',
        roleSpecificData: {}
      };
      
      await expect(AuthService.register(invalidData))
        .rejects.toThrow('Passwords do not match');
    });

    test('should reject registration without role-specific data', async () => {
      await expect(AuthService.register(validRegistrationData))
        .rejects.toThrow('Role-specific data is required');
    });

    test('should create role-specific data for each user type', async () => {
      const roles = ['buyer', 'owner', 'service', 'insurance', 'admin', 'government'] as const;
      
      for (const role of roles) {
        const userData = {
          ...validRegistrationData,
          email: `${role}@veridrive.com`,
          role,
          roleSpecificData: {}
        };
        
        const result = await AuthService.register(userData);
        
        expect(result.user.role).toBe(role);
        
        const user = await User.findOne({ email: userData.email });
        expect(user?.roleData).toBeDefined();
      }
    });
  });

  describe('User Login', () => {
    const testUser = createTestUser('buyer');

    beforeEach(async () => {
      // Create test user
      await AuthService.register({
        email: testUser.email,
        password: testUser.password,
        confirmPassword: testUser.password,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        role: testUser.role as any,
        termsAccepted: true,
        privacyAccepted: true
      });
    });

    test('should login with valid credentials', async () => {
      const result = await AuthService.login({
        email: testUser.email,
        password: testUser.password
      });
      
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(testUser.email);
      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBeDefined();
    });

    test('should reject login with invalid email', async () => {
      const result = await AuthService.login({
        email: 'nonexistent@veridrive.com',
        password: testUser.password
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid credentials');
    });

    test('should reject login with invalid password', async () => {
      const result = await AuthService.login({
        email: testUser.email,
        password: 'WrongPassword123!'
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid credentials');
    });

    test('should increment login attempts on failed login', async () => {
      await AuthService.login({
        email: testUser.email,
        password: 'WrongPassword123!'
      });
      
      const user = await User.findOne({ email: testUser.email });
      expect(user?.loginAttempts).toBe(1);
    });

    test('should lock account after max failed attempts', async () => {
      const maxAttempts = 3;
      
      // Make failed login attempts
      for (let i = 0; i < maxAttempts; i++) {
        await AuthService.login({
          email: testUser.email,
          password: 'WrongPassword123!'
        });
      }
      
      const user = await User.findOne({ email: testUser.email });
      expect(user?.isLocked).toBe(true);
    });

    test('should reject login for locked account', async () => {
      // Lock the account
      const user = await User.findOne({ email: testUser.email });
      user!.loginAttempts = 5;
      user!.lockoutUntil = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await user!.save();
      
      const result = await AuthService.login({
        email: testUser.email,
        password: testUser.password
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('locked');
    });

    test('should reset login attempts on successful login', async () => {
      // Set some failed attempts
      const user = await User.findOne({ email: testUser.email });
      user!.loginAttempts = 2;
      await user!.save();
      
      const result = await AuthService.login({
        email: testUser.email,
        password: testUser.password
      });
      
      expect(result.success).toBe(true);
      
      const updatedUser = await User.findOne({ email: testUser.email });
      expect(updatedUser?.loginAttempts).toBe(0);
    });

    test('should update last login timestamp', async () => {
      const beforeLogin = new Date();
      
      await AuthService.login({
        email: testUser.email,
        password: testUser.password
      });
      
      const user = await User.findOne({ email: testUser.email });
      expect(user?.lastLogin).toBeDefined();
      expect(user?.lastLogin!.getTime()).toBeGreaterThanOrEqual(beforeLogin.getTime());
    });
  });

  describe('Password Management', () => {
    const testUser = createTestUser('buyer');

    beforeEach(async () => {
      await AuthService.register({
        email: testUser.email,
        password: testUser.password,
        confirmPassword: testUser.password,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        role: testUser.role as any,
        termsAccepted: true,
        privacyAccepted: true
      });
    });

    test('should change password successfully', async () => {
      const newPassword = 'NewSecurePass123!';
      
      const result = await AuthService.changePassword(testUser.email, {
        currentPassword: testUser.password,
        newPassword,
        confirmPassword: newPassword
      });
      
      expect(result.success).toBe(true);
      
      // Verify new password works
      const loginResult = await AuthService.login({
        email: testUser.email,
        password: newPassword
      });
      
      expect(loginResult.success).toBe(true);
    });

    test('should reject password change with wrong current password', async () => {
      const result = await AuthService.changePassword(testUser.email, {
        currentPassword: 'WrongPassword123!',
        newPassword: 'NewSecurePass123!',
        confirmPassword: 'NewSecurePass123!'
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('current password');
    });

    test('should reject password change with mismatched new passwords', async () => {
      const result = await AuthService.changePassword(testUser.email, {
        currentPassword: testUser.password,
        newPassword: 'NewSecurePass123!',
        confirmPassword: 'DifferentPassword123!'
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('passwords do not match');
    });

    test('should generate password reset token', async () => {
      const result = await AuthService.requestPasswordReset(testUser.email);
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('reset link sent');
    });

    test('should reject password reset for non-existent user', async () => {
      const result = await AuthService.requestPasswordReset('nonexistent@veridrive.com');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('user not found');
    });
  });

  describe('Token Management', () => {
    const testUser = createTestUser('buyer');

    beforeEach(async () => {
      await AuthService.register({
        email: testUser.email,
        password: testUser.password,
        confirmPassword: testUser.password,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        role: testUser.role as any,
        termsAccepted: true,
        privacyAccepted: true
      });
    });

    test('should refresh tokens successfully', async () => {
      const loginResult = await AuthService.login({
        email: testUser.email,
        password: testUser.password
      });
      
      const refreshResult = await AuthService.refreshTokens(loginResult.tokens.refreshToken);
      
      expect(refreshResult.success).toBe(true);
      expect(refreshResult.tokens).toBeDefined();
      expect(refreshResult.tokens.accessToken).toBeDefined();
      expect(refreshResult.tokens.accessToken).not.toBe(loginResult.tokens.accessToken);
    });

    test('should reject invalid refresh token', async () => {
      const result = await AuthService.refreshTokens('invalid.refresh.token');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid refresh token');
    });

    test('should logout user successfully', async () => {
      const loginResult = await AuthService.login({
        email: testUser.email,
        password: testUser.password
      });
      
      const logoutResult = await AuthService.logout(loginResult.tokens.refreshToken);
      
      expect(logoutResult.success).toBe(true);
      
      // Verify refresh token is invalidated
      const refreshResult = await AuthService.refreshTokens(loginResult.tokens.refreshToken);
      expect(refreshResult.success).toBe(false);
    });
  });

  describe('Account Verification', () => {
    const testUser = createTestUser('buyer');

    beforeEach(async () => {
      await AuthService.register({
        email: testUser.email,
        password: testUser.password,
        confirmPassword: testUser.password,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        role: testUser.role as any,
        termsAccepted: true,
        privacyAccepted: true
      });
    });

    test('should send verification email', async () => {
      const result = await AuthService.resendVerificationEmail(testUser.email);
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('verification email sent');
    });

    test('should reject verification email for non-existent user', async () => {
      const result = await AuthService.resendVerificationEmail('nonexistent@veridrive.com');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('user not found');
    });

    test('should verify email successfully', async () => {
      const user = await User.findOne({ email: testUser.email });
      const verificationToken = user!.generateEmailVerificationToken();
      
      const result = await AuthService.verifyEmail(verificationToken);
      
      expect(result.success).toBe(true);
      
      const updatedUser = await User.findOne({ email: testUser.email });
      expect(updatedUser?.emailVerified).toBe(true);
    });

    test('should reject invalid verification token', async () => {
      const result = await AuthService.verifyEmail('invalid.verification.token');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid or expired token');
    });
  });

  describe('Security Features', () => {
    const testUser = createTestUser('buyer');

    beforeEach(async () => {
      await AuthService.register({
        email: testUser.email,
        password: testUser.password,
        confirmPassword: testUser.password,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        role: testUser.role as any,
        termsAccepted: true,
        privacyAccepted: true
      });
    });

    test('should validate user permissions', async () => {
      const user = await User.findOne({ email: testUser.email });
      
      const hasPermission = await AuthService.hasPermission(user!._id.toString(), 'read', 'profile');
      expect(hasPermission).toBe(true);
      
      const hasAdminPermission = await AuthService.hasPermission(user!._id.toString(), 'admin', 'users');
      expect(hasAdminPermission).toBe(false);
    });

    test('should check user role', async () => {
      const user = await User.findOne({ email: testUser.email });
      
      const isBuyer = await AuthService.hasRole(user!._id.toString(), 'buyer');
      expect(isBuyer).toBe(true);
      
      const isAdmin = await AuthService.hasRole(user!._id.toString(), 'admin');
      expect(isAdmin).toBe(false);
    });

    test('should get user by ID', async () => {
      const user = await User.findOne({ email: testUser.email });
      
      const foundUser = await AuthService.getUserById(user!._id.toString());
      
      expect(foundUser).toBeDefined();
      expect(foundUser?.email).toBe(testUser.email);
    });

    test('should get user by email', async () => {
      const foundUser = await AuthService.getUserByEmail(testUser.email);
      
      expect(foundUser).toBeDefined();
      expect(foundUser?.email).toBe(testUser.email);
    });
  });
}); 