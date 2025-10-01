import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User';
import { protect, AuthRequest } from '../middleware/auth';

const router = Router();

const signToken = (id: string, role: string) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret', {
    expiresIn: (process.env.JWT_EXPIRE || '7d') as any,
  });

// POST /api/auth/register
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('phone').notEmpty().withMessage('Phone is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['tenant', 'landlord']).withMessage('Invalid role'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }
    try {
      const { name, email, phone, password, role } = req.body;
      const existing = await User.findOne({ email });
      if (existing) {
        res.status(400).json({ success: false, message: 'Email already registered' });
        return;
      }
      const user = await User.create({ name, email, phone, password, role: role || 'tenant' });
      const token = signToken(user._id.toString(), user.role);
      res.status(201).json({ success: true, token, user });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Registration failed' });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email }).select('+password');
      if (!user || !(await user.comparePassword(password))) {
        res.status(401).json({ success: false, message: 'Invalid email or password' });
        return;
      }
      const token = signToken(user._id.toString(), user.role);
      res.json({ success: true, token, user });
    } catch {
      res.status(500).json({ success: false, message: 'Login failed' });
    }
  }
);

// GET /api/auth/me
router.get('/me', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({ success: true, user: req.user });
});

// PUT /api/auth/profile
router.put('/profile', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, phone, city, avatar } = req.body;
  try {
    const user = await User.findByIdAndUpdate(
      req.user!._id,
      { name, phone, city, avatar },
      { new: true, runValidators: true }
    );
    res.json({ success: true, user });
  } catch {
    res.status(500).json({ success: false, message: 'Profile update failed' });
  }
});

// PUT /api/auth/change-password
router.put('/change-password', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user!._id).select('+password');
    if (!user || !(await user.comparePassword(currentPassword))) {
      res.status(401).json({ success: false, message: 'Current password incorrect' });
      return;
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password updated' });
  } catch {
    res.status(500).json({ success: false, message: 'Password change failed' });
  }
});

export default router;
