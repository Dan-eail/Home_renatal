import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import Property from '../models/Property';
import { protect, authorize, AuthRequest } from '../middleware/auth';

const router = Router();

// ─── GET /api/properties — public search ──────────────────────────────────────
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      city, subcity, rooms, minPrice, maxPrice, type, furnished,
      tag, search, page = '1', limit = '12', sort = '-createdAt',
    } = req.query as Record<string, string>;

    const query: Record<string, unknown> = { status: 'approved', isAvailable: true };

    if (city) query['location.city'] = { $regex: city, $options: 'i' };
    if (subcity) query['location.subcity'] = { $regex: subcity, $options: 'i' };
    if (rooms) query.rooms = Number(rooms);
    if (type) query.type = type;
    if (furnished !== undefined) query.furnished = furnished === 'true';
    if (tag) query.tags = { $in: [tag] };
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) (query.price as Record<string, number>).$gte = Number(minPrice);
      if (maxPrice) (query.price as Record<string, number>).$lte = Number(maxPrice);
    }
    if (search) query.$text = { $search: search };

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const [properties, total] = await Promise.all([
      Property.find(query)
        .populate('landlord', 'name phone avatar isVerified nationalIdVerified')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      Property.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: properties.length,
      total,
      pages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      properties,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch properties' });
  }
});

// ─── GET /api/properties/:id ──────────────────────────────────────────────────
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('landlord', 'name phone email avatar city isVerified nationalIdVerified createdAt')
      .populate('reviews.user', 'name avatar');

    if (!property) {
      res.status(404).json({ success: false, message: 'Property not found' });
      return;
    }

    // Increment view count
    await Property.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });

    res.json({ success: true, property });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch property' });
  }
});

// ─── POST /api/properties — landlord creates listing ─────────────────────────
router.post(
  '/',
  protect,
  authorize('landlord', 'admin'),
  [
    body('title').trim().notEmpty().withMessage('Title required'),
    body('description').trim().notEmpty().withMessage('Description required'),
    body('type').isIn(['apartment', 'house', 'room', 'studio', 'villa']).withMessage('Invalid type'),
    body('location.city').notEmpty().withMessage('City required'),
    body('location.subcity').notEmpty().withMessage('Subcity required'),
    body('location.kebele').notEmpty().withMessage('Kebele required'),
    body('location.address').notEmpty().withMessage('Address required'),
    body('price').isNumeric().withMessage('Price must be a number'),
    body('rooms').isNumeric().withMessage('Rooms must be a number'),
    body('bathrooms').isNumeric().withMessage('Bathrooms must be a number'),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }
    try {
      // Simple AI price estimate based on city + rooms
      const basePrices: Record<string, number> = {
        'Addis Ababa': 8000,
        'Adama': 4500,
        'Bahir Dar': 4000,
        'Hawassa': 3500,
        'Mekelle': 3000,
      };
      const base = basePrices[req.body.location?.city] || 4000;
      const aiPriceEstimate = base + req.body.rooms * 1500 + (req.body.furnished ? 2000 : 0);

      const property = await Property.create({
        ...req.body,
        landlord: req.user!._id,
        status: 'pending',
        aiPriceEstimate,
      });

      res.status(201).json({ success: true, property });
    } catch {
      res.status(500).json({ success: false, message: 'Failed to create property' });
    }
  }
);

// ─── PUT /api/properties/:id ──────────────────────────────────────────────────
router.put('/:id', protect, authorize('landlord', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      res.status(404).json({ success: false, message: 'Property not found' });
      return;
    }
    if (property.landlord.toString() !== req.user!._id.toString() && req.user!.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Not authorized to edit this property' });
      return;
    }
    // Reset to pending if landlord edits
    if (req.user!.role !== 'admin') req.body.status = 'pending';

    const updated = await Property.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, property: updated });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to update property' });
  }
});

// ─── DELETE /api/properties/:id ───────────────────────────────────────────────
router.delete('/:id', protect, authorize('landlord', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      res.status(404).json({ success: false, message: 'Property not found' });
      return;
    }
    if (property.landlord.toString() !== req.user!._id.toString() && req.user!.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }
    await property.deleteOne();
    res.json({ success: true, message: 'Property deleted' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to delete property' });
  }
});

// ─── GET /api/properties/landlord/my-listings ─────────────────────────────────
router.get('/landlord/my-listings', protect, authorize('landlord', 'admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const properties = await Property.find({ landlord: req.user!._id }).sort('-createdAt');
    res.json({ success: true, properties });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch your listings' });
  }
});

// ─── POST /api/properties/:id/review ──────────────────────────────────────────
router.post(
  '/:id/review',
  protect,
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
    body('comment').trim().notEmpty().withMessage('Comment required'),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }
    try {
      const property = await Property.findById(req.params.id);
      if (!property) {
        res.status(404).json({ success: false, message: 'Property not found' });
        return;
      }
      const alreadyReviewed = property.reviews.find(
        (r) => r.user.toString() === req.user!._id.toString()
      );
      if (alreadyReviewed) {
        res.status(400).json({ success: false, message: 'Already reviewed this property' });
        return;
      }
      property.reviews.push({ user: req.user!._id, rating: req.body.rating, comment: req.body.comment, createdAt: new Date() });
      await property.save();
      res.status(201).json({ success: true, property });
    } catch {
      res.status(500).json({ success: false, message: 'Failed to submit review' });
    }
  }
);

// ─── POST /api/properties/:id/save ────────────────────────────────────────────
router.post('/:id/save', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const propertyId = req.params.id as unknown as import('mongoose').Types.ObjectId;
    const isSaved = user.savedProperties.includes(propertyId);
    const update = isSaved
      ? { $pull: { savedProperties: req.params.id } }
      : { $addToSet: { savedProperties: req.params.id } };
    await (await import('../models/User')).default.findByIdAndUpdate(user._id, update);
    res.json({ success: true, saved: !isSaved });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to save property' });
  }
});

export default router;
