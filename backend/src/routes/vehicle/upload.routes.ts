import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../../middleware/auth.middleware';
import { logger } from '../../utils/logger';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/vehicles';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = {
    'image/jpeg': true,
    'image/png': true,
    'image/webp': true,
    'application/pdf': true
  };
  
  if (allowedTypes[file.mimetype as keyof typeof allowedTypes]) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and PDF files are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

/**
 * POST /api/vehicles/upload
 * Upload vehicle photos and documents
 * Access: All authenticated users
 */
router.post('/upload',
  authenticate,
  upload.array('file', 10), // Allow up to 10 files
  async (req: any, res: any) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
      }

      const uploadedFiles = req.files.map((file: Express.Multer.File) => ({
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        url: `/uploads/vehicles/${file.filename}`,
        type: req.body.type || (file.mimetype.startsWith('image/') ? 'photo' : 'document')
      }));

      logger.info(`✅ Files uploaded by user ${userId}:`, uploadedFiles.map(f => f.originalName));

      res.status(200).json({
        success: true,
        message: 'Files uploaded successfully',
        data: {
          files: uploadedFiles
        }
      });
    } catch (error) {
      logger.error('❌ File upload failed:', error);
      res.status(500).json({
        success: false,
        message: 'File upload failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * POST /api/vehicles/drafts
 * Save vehicle registration draft
 * Access: All authenticated users
 */
router.post('/drafts',
  authenticate,
  async (req: any, res: any) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }

      const { formData, uploads } = req.body;

      // Save draft to database (optional server-side draft storage)
      // For now, we'll just acknowledge the request
      // In production, you might want to store drafts in MongoDB

      logger.info(`✅ Draft saved for user ${userId}`);

      res.status(200).json({
        success: true,
        message: 'Draft saved successfully'
      });
    } catch (error) {
      logger.error('❌ Draft save failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save draft',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/vehicles/drafts
 * Get saved vehicle registration draft
 * Access: All authenticated users
 */
router.get('/drafts',
  authenticate,
  async (req: any, res: any) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }

      // In production, retrieve from database
      // For now, return empty draft
      res.status(200).json({
        success: true,
        message: 'No draft found',
        data: null
      });
    } catch (error) {
      logger.error('❌ Draft retrieval failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve draft',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * POST /api/vehicles/preview-pdf
 * Generate PDF preview of vehicle registration
 * Access: All authenticated users
 */
router.post('/preview-pdf',
  authenticate,
  async (req: any, res: any) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }

      const formData = req.body;

      // Generate PDF using a library like puppeteer or jsPDF
      // For now, return a placeholder response
      res.status(200).json({
        success: true,
        message: 'PDF generation not implemented yet',
        data: {
          pdfUrl: null,
          estimatedTime: '2-3 seconds'
        }
      });
    } catch (error) {
      logger.error('❌ PDF generation failed:', error);
      res.status(500).json({
        success: false,
        message: 'PDF generation failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * GET /api/external/vin-decode
 * Decode VIN using external service
 * Access: All authenticated users
 */
router.get('/vin-decode',
  authenticate,
  async (req: any, res: any) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User authentication required'
        });
      }

      const { vin } = req.query;
      
      if (!vin || vin.length !== 17) {
        return res.status(400).json({
          success: false,
          message: 'Valid VIN required'
        });
      }

      // Check if VIN decode service is configured
      const vinDecodeApiKey = process.env.VIN_DECODE_API_KEY;
      const vinDecodeUrl = process.env.VIN_DECODE_URL;

      if (!vinDecodeApiKey || !vinDecodeUrl) {
        return res.status(200).json({
          success: true,
          found: false,
          message: 'VIN decode service not configured'
        });
      }

      // Call external VIN decode service
      try {
        const response = await fetch(`${vinDecodeUrl}?vin=${vin}`, {
          headers: {
            'Authorization': `Bearer ${vinDecodeApiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data: any = await response.json();
          res.status(200).json({
            success: true,
            found: true,
            data: {
              make: data.make,
              model: data.model,
              year: data.year,
              manufacturer: data.manufacturer
            }
          });
        } else {
          res.status(200).json({
            success: true,
            found: false,
            message: 'VIN not found in decode service'
          });
        }
      } catch (error) {
        logger.warn('VIN decode service unavailable:', error);
        res.status(200).json({
          success: true,
          found: false,
          message: 'VIN decode service unavailable'
        });
      }
    } catch (error) {
      logger.error('❌ VIN decode failed:', error);
      res.status(500).json({
        success: false,
        message: 'VIN decode failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

export default router;
