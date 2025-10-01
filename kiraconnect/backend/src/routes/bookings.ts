import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import Booking from '../models/Booking';
import Property from '../models/Property';
import { protect, AuthRequest } from '../middleware/auth';
import { io } from '../server';

const router = Router();

// ─── POST /api/bookings — create booking request ────────────────────────────
router.post(
  '/',
  protect,
  [
    body('propertyId').notEmpty().withMessage('Property ID required'),
    body('viewingDate').isISO8601().withMessage('Valid date required'),
    body('viewingTime').matches(/^\d{2}:\d{2}$/).withMessage('Time format HH:MM'),
    body('message').trim().notEmpty().withMessage('Message required'),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    try {
      const { propertyId, viewingDate, viewingTime, message } = req.body;
      const property = await Property.findById(propertyId);

      if (!property) {
        res.status(404).json({ success: false, message: 'Property not found' });
        return;
      }

      // Check if already booked
      const existing = await Booking.findOne({
        property: propertyId,
        tenant: req.user!._id,
        status: { $in: ['pending', 'confirmed'] },
      });

      if (existing) {
        res.status(400).json({ success: false, message: 'You already have a pending booking for this property' });
        return;
      }

      const booking = await Booking.create({
        property: propertyId,
        tenant: req.user!._id,
        landlord: property.landlord,
        viewingDate,
        viewingTime,
        message,
      });

      // Populate and emit socket event
      const populated = await booking.populate([
        { path: 'tenant', select: 'name phone email avatar' },
        { path: 'property', select: 'title price location' },
      ]);

      const roomId = `booking_${property.landlord.toString()}`;
      io.to(roomId).emit('new_booking', { booking: populated });

      res.status(201).json({ success: true, booking: populated });
    } catch {
      res.status(500).json({ success: false, message: 'Failed to create booking' });
    }
  }
);

// ─── GET /api/bookings — get my bookings ─────────────────────────────────────
router.get('/', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    const query: Record<string, unknown> = {};

    // Tenant: get bookings they created
    if (req.user!.role === 'tenant') {
      query.tenant = req.user!._id;
    }
    // Landlord: get bookings for their properties
    else if (req.user!.role === 'landlord') {
      query.landlord = req.user!._id;
    }

    if (status) query.status = status;

    const bookings = await Booking.find(query)
      .populate([
        { path: 'tenant', select: 'name phone email avatar city' },
        { path: 'landlord', select: 'name phone email avatar' },
        { path: 'property', select: 'title price location images' },
      ])
      .sort('-createdAt');

    res.json({ success: true, bookings });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
});

// ─── GET /api/bookings/:id ──────────────────────────────────────────────────
router.get('/:id', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const booking = await Booking.findById(req.params.id).populate([
      { path: 'tenant', select: 'name phone email avatar city' },
      { path: 'landlord', select: 'name phone email avatar' },
      { path: 'property' },
    ]);

    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    res.json({ success: true, booking });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch booking' });
  }
});

// ─── PUT /api/bookings/:id/confirm ──────────────────────────────────────────
router.put('/:id/confirm', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    if (booking.landlord.toString() !== req.user!._id.toString()) {
      res.status(403).json({ success: false, message: 'Only landlord can confirm' });
      return;
    }

    booking.status = 'confirmed';
    await booking.save();

    const roomId = `booking_${booking.tenant.toString()}`;
    io.to(roomId).emit('booking_confirmed', { booking });

    res.json({ success: true, booking });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to confirm booking' });
  }
});

// ─── PUT /api/bookings/:id/reject ───────────────────────────────────────────
router.put(
  '/:id/reject',
  protect,
  body('landlordNote').optional().trim(),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const booking = await Booking.findById(req.params.id);
      if (!booking) {
        res.status(404).json({ success: false, message: 'Booking not found' });
        return;
      }

      if (booking.landlord.toString() !== req.user!._id.toString()) {
        res.status(403).json({ success: false, message: 'Only landlord can reject' });
        return;
      }

      booking.status = 'rejected';
      if (req.body.landlordNote) booking.landlordNote = req.body.landlordNote;
      await booking.save();

      const roomId = `booking_${booking.tenant.toString()}`;
      io.to(roomId).emit('booking_rejected', { booking });

      res.json({ success: true, booking });
    } catch {
      res.status(500).json({ success: false, message: 'Failed to reject booking' });
    }
  }
);

// ─── PUT /api/bookings/:id/cancel ───────────────────────────────────────────
router.put('/:id/cancel', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      res.status(404).json({ success: false, message: 'Booking not found' });
      return;
    }

    if (booking.tenant.toString() !== req.user!._id.toString()) {
      res.status(403).json({ success: false, message: 'Only tenant can cancel' });
      return;
    }

    booking.status = 'cancelled';
    await booking.save();

    res.json({ success: true, booking });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to cancel booking' });
  }
});

export default router;
