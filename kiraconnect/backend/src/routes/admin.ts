import { Router, Request, Response } from 'express';
import Property from '../models/Property';
import User from '../models/User';
import Booking from '../models/Booking';
import { protect, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

// ─── GET /api/admin/dashboard ───────────────────────────────────────────────
router.get('/dashboard', protect, authorize('admin'), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [totalUsers, totalProperties, totalBookings, pendingListings, approvedListings] = await Promise.all([
      User.countDocuments(),
      Property.countDocuments(),
      Booking.countDocuments(),
      Property.countDocuments({ status: 'pending' }),
      Property.countDocuments({ status: 'approved' }),
    ]);

    const recentBookings = await Booking.find().sort('-createdAt').limit(5).populate('tenant property');
    const topListings = await Property.find({ status: 'approved' })
      .sort('-viewCount')
      .limit(5)
      .select('title viewCount price location');

    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    const bookingsByStatus = await Booking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalProperties,
        totalBookings,
        pendingListings,
        approvedListings,
      },
      recentBookings,
      topListings,
      usersByRole,
      bookingsByStatus,
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard' });
  }
});

// ─── GET /api/admin/properties/pending ───────────────────────────────────────
router.get('/properties/pending', protect, authorize('admin'), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const properties = await Property.find({ status: 'pending' })
      .populate('landlord', 'name email phone isVerified')
      .sort('-createdAt');

    res.json({ success: true, properties });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch pending properties' });
  }
});

// ─── PUT /api/admin/properties/:id/approve ──────────────────────────────────
router.put(
  '/properties/:id/approve',
  protect,
  authorize('admin'),
  async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
      const property = await Property.findByIdAndUpdate(
        _req.params.id,
        { status: 'approved' },
        { new: true }
      ).populate('landlord');

      if (!property) {
        res.status(404).json({ success: false, message: 'Property not found' });
        return;
      }

      res.json({ success: true, property, message: 'Property approved' });
    } catch {
      res.status(500).json({ success: false, message: 'Failed to approve property' });
    }
  }
);

// ─── PUT /api/admin/properties/:id/reject ───────────────────────────────────
router.put(
  '/properties/:id/reject',
  protect,
  authorize('admin'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { reason } = req.body;
      const property = await Property.findByIdAndUpdate(
        req.params.id,
        { status: 'rejected' },
        { new: true }
      );

      if (!property) {
        res.status(404).json({ success: false, message: 'Property not found' });
        return;
      }

      res.json({ success: true, property, message: `Property rejected${reason ? `: ${reason}` : ''}` });
    } catch {
      res.status(500).json({ success: false, message: 'Failed to reject property' });
    }
  }
);

// ─── PUT /api/admin/properties/:id/feature ──────────────────────────────────
router.put(
  '/properties/:id/feature',
  protect,
  authorize('admin'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const property = await Property.findById(req.params.id);
      if (!property) {
        res.status(404).json({ success: false, message: 'Property not found' });
        return;
      }

      property.isFeatured = !property.isFeatured;
      await property.save();

      res.json({ success: true, property, message: `Property ${property.isFeatured ? 'featured' : 'unfeatured'}` });
    } catch {
      res.status(500).json({ success: false, message: 'Failed to toggle feature' });
    }
  }
);

// ─── GET /api/admin/users ───────────────────────────────────────────────────
router.get('/users', protect, authorize('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, page = '1', limit = '20' } = req.query as Record<string, string>;
    const query = role ? { role } : {};

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .skip(skip)
        .limit(limitNum)
        .sort('-createdAt'),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      users,
      total,
      pages: Math.ceil(total / limitNum),
      currentPage: pageNum,
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// ─── PUT /api/admin/users/:id/verify ────────────────────────────────────────
router.put(
  '/users/:id/verify',
  protect,
  authorize('admin'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { isVerified: true, nationalIdVerified: true },
        { new: true }
      );

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      res.json({ success: true, user, message: 'User verified' });
    } catch {
      res.status(500).json({ success: false, message: 'Failed to verify user' });
    }
  }
);

// ─── DELETE /api/admin/users/:id ────────────────────────────────────────────
router.delete(
  '/users/:id',
  protect,
  authorize('admin'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = await User.findByIdAndDelete(req.params.id);

      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      res.json({ success: true, message: 'User deleted' });
    } catch {
      res.status(500).json({ success: false, message: 'Failed to delete user' });
    }
  }
);

// ─── GET /api/admin/analytics ───────────────────────────────────────────────
router.get('/analytics', protect, authorize('admin'), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Monthly property growth
    const monthlyProperties = await Property.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Properties by city
    const propertiesByCity = await Property.aggregate([
      { $match: { status: 'approved' } },
      {
        $group: {
          _id: '$location.city',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Average prices by property type
    const avgPriceByType = await Property.aggregate([
      { $match: { status: 'approved' } },
      {
        $group: {
          _id: '$type',
          avgPrice: { $avg: '$price' },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      monthlyProperties,
      propertiesByCity,
      avgPriceByType,
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
});

export default router;
