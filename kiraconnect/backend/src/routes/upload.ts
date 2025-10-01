import { Router, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { protect, AuthRequest } from '../middleware/auth';
import { Readable } from 'stream';

const router = Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use memory storage so we can stream to Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Helper: stream buffer to cloudinary
const streamUpload = (buffer: Buffer, folder: string): Promise<{ secure_url: string; public_id: string }> => {
  return new Promise((resolve, reject) => {
    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY === 'your_api_key') {
      console.warn('⚠️ Cloudinary not configured. Using placeholder image fallback.');
      // Return a random placeholder image for testing
      const randomId = Math.floor(Math.random() * 1000);
      resolve({
        secure_url: `https://picsum.photos/seed/${randomId}/1200/800`,
        public_id: `mock_${randomId}`
      });
      return;
    }

    const stream = cloudinary.uploader.upload_stream(
      { folder, transformation: [{ width: 1200, height: 800, crop: 'fill', quality: 'auto' }] },
      (error, result) => {
        if (error || !result) return reject(error || new Error('Upload failed'));
        resolve({ secure_url: result.secure_url, public_id: result.public_id });
      }
    );
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(stream);
  });
};

// POST /api/upload/property — upload up to 5 property images
router.post(
  '/property',
  protect,
  upload.array('images', 5),
  async (req: AuthRequest, res: Response): Promise<void> => {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ success: false, message: 'No images provided' });
      return;
    }
    try {
      const uploads = await Promise.all(
        files.map((file) => streamUpload(file.buffer, 'kiraconnect/properties'))
      );
      res.json({ success: true, urls: uploads.map((u) => u.secure_url) });
    } catch (err) {
      console.error('Cloudinary upload error:', err);
      res.status(500).json({ success: false, message: 'Image upload failed' });
    }
  }
);

// POST /api/upload/avatar — upload user avatar
router.post(
  '/avatar',
  protect,
  upload.single('avatar'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, message: 'No image provided' });
      return;
    }
    try {
      const result = await streamUpload(file.buffer, 'kiraconnect/avatars');
      res.json({ success: true, url: result.secure_url });
    } catch {
      res.status(500).json({ success: false, message: 'Avatar upload failed' });
    }
  }
);

export default router;
