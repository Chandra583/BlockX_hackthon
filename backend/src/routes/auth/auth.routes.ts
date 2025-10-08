import { Router } from 'express';
import { AuthController } from '../../controllers/auth/auth.controller';
import { authenticate, rateLimit } from '../../middleware/auth.middleware';

const router = Router();

// Rate limiting for auth endpoints (increased for development)
const authRateLimit = rateLimit(100, 5 * 60 * 1000); // 100 requests per 5 minutes
const loginRateLimit = rateLimit(50, 5 * 60 * 1000); // 50 login attempts per 5 minutes
const strictRateLimit = rateLimit(25, 5 * 60 * 1000); // 25 requests per 5 minutes

/**
 * @route   GET /api/auth/health
 * @desc    Health check for auth service
 * @access  Public
 */
router.get('/health', AuthController.health);

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 * @body    { email, password, confirmPassword, firstName, lastName, role, phoneNumber?, termsAccepted, privacyAccepted, roleSpecificData }
 */
router.post('/register', authRateLimit, AuthController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 * @body    { email, password, rememberMe?, twoFactorCode? }
 */
router.post('/login', loginRateLimit, AuthController.login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 * @body    { refreshToken }
 */
router.post('/refresh', authRateLimit, AuthController.refresh);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 * @headers Authorization: Bearer <access_token>
 */
router.post('/logout', authenticate, AuthController.logout);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email address
 * @access  Public
 * @body    { token }
 */
router.post('/verify-email', authRateLimit, AuthController.verifyEmail);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend email verification
 * @access  Public
 * @body    { email }
 */
router.post('/resend-verification', strictRateLimit, AuthController.resendVerification);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 * @body    { email }
 */
router.post('/forgot-password', strictRateLimit, AuthController.forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 * @body    { token, newPassword, confirmPassword }
 */
router.post('/reset-password', authRateLimit, AuthController.resetPassword);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change password (requires authentication)
 * @access  Private
 * @headers Authorization: Bearer <access_token>
 * @body    { currentPassword, newPassword, confirmPassword }
 */
router.post('/change-password', authenticate, authRateLimit, AuthController.changePassword);

/**
 * @route   GET /api/auth/profile
 * @desc    Get user profile
 * @access  Private
 * @headers Authorization: Bearer <access_token>
 */
router.get('/profile', authenticate, AuthController.getProfile);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info
 * @access  Private
 * @headers Authorization: Bearer <access_token>
 */
router.get('/me', authenticate, AuthController.getMe);

/**
 * @route   POST /api/auth/validate-token
 * @desc    Validate access token
 * @access  Private
 * @headers Authorization: Bearer <access_token>
 * @body    { token }
 */
router.post('/validate-token', authenticate, AuthController.validateToken);

export default router; 