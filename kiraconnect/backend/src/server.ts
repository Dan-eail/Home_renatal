import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth';
import propertyRoutes from './routes/properties';
import bookingRoutes from './routes/bookings';
import adminRoutes from './routes/admin';
import uploadRoutes from './routes/upload';
import chatRoutes, { buildRoomId } from './routes/chat';
import Message from './models/Message';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const httpServer = createServer(app);

export const io = new Server(httpServer, {
  cors: {
    origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'http://127.0.0.1:5173'], credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api', limiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/chat', chatRoutes);
app.get('/api/health', (_req, res) => res.json({ status: 'ok', platform: 'KiraConnect' }));
app.use(errorHandler);

// ─── Socket.io ────────────────────────────────────────────────────────────────
interface OnlineUser { userId: string; socketId: string; }
const onlineUsers: OnlineUser[] = [];
const addUser = (uid: string, sid: string) => { if (!onlineUsers.find(u => u.userId === uid)) onlineUsers.push({ userId: uid, socketId: sid }); };
const removeUser = (sid: string) => { const i = onlineUsers.findIndex(u => u.socketId === sid); if (i !== -1) onlineUsers.splice(i, 1); };
const getUser = (uid: string) => onlineUsers.find(u => u.userId === uid);

io.on('connection', (socket: Socket) => {
  socket.on('user_online', (userId: string) => {
    addUser(userId, socket.id);
    socket.join(`user_${userId}`); // Join a private room for this user
    io.emit('online_users', onlineUsers.map(u => u.userId));
  });

  socket.on('join_room', (roomId: string) => socket.join(roomId));

  socket.on('send_message', async (data: {
    senderId: string; receiverId: string; propertyId: string;
    content: string; senderName: string; senderAvatar?: string;
  }) => {
    const roomId = buildRoomId(data.senderId, data.receiverId, data.propertyId);
    try {
      const msg = await Message.create({
        roomId, sender: data.senderId, receiver: data.receiverId,
        property: data.propertyId, content: data.content,
      });
      
      const populated = await msg.populate([
        { path: 'sender', select: 'name avatar' },
        { path: 'receiver', select: 'name avatar' },
        { path: 'property', select: 'title location images' },
      ]);

      const payload = {
        _id: msg._id,
        roomId,
        content: data.content,
        sender: populated.sender,
        receiver: populated.receiver,
        property: populated.property,
        createdAt: msg.createdAt,
      };

      // Emit to the specific property room AND the receiver's private room
      io.to(roomId).to(`user_${data.receiverId}`).emit('receive_message', payload);
      
      const recv = getUser(data.receiverId);
      if (recv) {
        io.to(recv.socketId).emit('new_message_notification', { 
          from: data.senderName, 
          content: data.content.slice(0, 50), 
          roomId 
        });
      }
    } catch (err) { console.error('Socket msg error:', err); }
  });

  socket.on('typing', (data: { roomId: string; userId: string; isTyping: boolean }) => {
    socket.to(data.roomId).emit('user_typing', data);
  });

  socket.on('mark_read', async (data: { roomId: string; userId: string }) => {
    await Message.updateMany({ roomId: data.roomId, receiver: data.userId, read: false }, { read: true });
    socket.to(data.roomId).emit('messages_read', { roomId: data.roomId });
  });

  socket.on('disconnect', () => {
    removeUser(socket.id);
    io.emit('online_users', onlineUsers.map(u => u.userId));
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kiraconnect')
  .then(() => {
    console.log('✅ MongoDB connected');
    httpServer.listen(PORT, () => console.log(`🚀 KiraConnect API → http://localhost:${PORT}`));
  })
  .catch(err => { console.error('❌ MongoDB:', err); process.exit(1); });

export default app;
