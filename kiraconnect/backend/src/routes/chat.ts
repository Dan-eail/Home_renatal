import { Router, Response } from 'express';
import Message from '../models/Message';
import { protect, AuthRequest } from '../middleware/auth';

const router = Router();

// Build deterministic roomId from two user IDs + propertyId
export const buildRoomId = (uid1: string, uid2: string, propertyId: string) => {
  const sorted = [uid1, uid2].sort().join('_');
  return `${sorted}_${propertyId}`;
};

// GET /api/chat/rooms — get all chat rooms the user is part of
router.get('/rooms', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id.toString();

    // Find all unique roomIds where this user sent or received
    const rooms = await Message.aggregate([
      { $match: { $or: [{ sender: req.user!._id }, { receiver: req.user!._id }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$roomId',
          lastMessage: { $first: '$$ROOT' },
          unread: {
            $sum: {
              $cond: [{ $and: [{ $eq: ['$read', false] }, { $ne: ['$sender', req.user!._id] }] }, 1, 0],
            },
          },
        },
      },
      { $sort: { 'lastMessage.createdAt': -1 } },
    ]);

    // Populate sender/receiver/property
    const populated = await Message.populate(rooms.map((r) => r.lastMessage), [
      { path: 'sender', select: 'name avatar' },
      { path: 'receiver', select: 'name avatar' },
      { path: 'property', select: 'title location images' },
    ]);

    const result = rooms.map((r, i) => ({
      roomId: r._id,
      unread: r.unread,
      lastMessage: populated[i],
    }));

    res.json({ success: true, rooms: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch rooms' });
  }
});

// GET /api/chat/:roomId — get message history for a room
router.get('/:roomId', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { roomId } = req.params;

    const messages = await Message.find({ roomId })
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar')
      .sort('createdAt')
      .limit(100);

    // Mark all messages in this room as read for this user
    await Message.updateMany(
      { roomId, receiver: req.user!._id, read: false },
      { read: true }
    );

    res.json({ success: true, messages });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
});

// POST /api/chat/send — send a message (also saved to DB via this route)
router.post('/send', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  const { receiverId, propertyId, content } = req.body;

  if (!receiverId || !propertyId || !content?.trim()) {
    res.status(400).json({ success: false, message: 'receiverId, propertyId and content required' });
    return;
  }

  try {
    const roomId = buildRoomId(req.user!._id.toString(), receiverId, propertyId);

    const message = await Message.create({
      roomId,
      sender: req.user!._id,
      receiver: receiverId,
      property: propertyId,
      content: content.trim(),
    });

    const populated = await message.populate([
      { path: 'sender', select: 'name avatar' },
      { path: 'receiver', select: 'name avatar' },
      { path: 'property', select: 'title' },
    ]);

    res.status(201).json({ success: true, message: populated });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

// GET /api/chat/unread/count
router.get('/unread/count', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const count = await Message.countDocuments({ receiver: req.user!._id, read: false });
    res.json({ success: true, count });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to get unread count' });
  }
});

export default router;
