import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Chat from '../models/Chat.js';

// Store active users and their socket connections
const activeUsers = new Map();
const activeCalls = new Map();

export const initializeSocket = (io) => {
  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`🔌 User ${socket.user.username} connected`);

    // Check if user is already connected - just update the record, don't disconnect
    const existingUser = activeUsers.get(socket.userId);
    if (existingUser && existingUser.socketId !== socket.id) {
      console.log(`🔄 User ${socket.user.username} has multiple connections - allowing both`);
      // Don't disconnect - allow multiple connections for now
      // This prevents the reconnection loop
    }

    // Update user online status
    activeUsers.set(socket.userId, {
      socketId: socket.id,
      user: socket.user,
      lastSeen: new Date()
    });

    await User.findByIdAndUpdate(socket.userId, {
      isOnline: true,
      socketId: socket.id,
      lastSeen: new Date()
    });

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);

    // Join user to their chat rooms
    const userChats = await Chat.find({
      'participants.user': socket.userId
    }).select('_id');

    userChats.forEach(chat => {
      socket.join(`chat:${chat._id}`);
    });

    // Broadcast user online status
    socket.broadcast.emit('user_online', {
      userId: socket.userId,
      username: socket.user.username,
      lastSeen: new Date()
    });

    // Handle joining a chat
    socket.on('join_chat', async (chatId) => {
      try {
        const chat = await Chat.findById(chatId);
        if (chat && chat.isParticipant(socket.userId)) {
          socket.join(`chat:${chatId}`);
          console.log(`👥 ${socket.user.username} joined chat ${chatId}`);
        }
      } catch (error) {
        console.error('Join chat error:', error);
      }
    });

    // Handle leaving a chat
    socket.on('leave_chat', (chatId) => {
      socket.leave(`chat:${chatId}`);
      console.log(`👋 ${socket.user.username} left chat ${chatId}`);
    });

    // Handle sending messages
    socket.on('send_message', async (data) => {
      try {
        const { chatId, content, messageType, replyTo } = data;

        const chat = await Chat.findById(chatId);
        if (!chat || !chat.isParticipant(socket.userId)) {
          return socket.emit('error', { message: 'Unauthorized' });
        }

        const newMessage = new Message({
          sender: socket.userId,
          chat: chatId,
          content,
          messageType: messageType || 'text',
          replyTo: replyTo || null
        });

        const savedMessage = await newMessage.save();
        const populatedMessage = await Message.findById(savedMessage._id)
          .populate('sender', 'username avatar')
          .populate('replyTo', 'content sender createdAt')
          .populate('replyTo.sender', 'username avatar');

        // Update chat's last message and activity
        chat.lastMessage = savedMessage._id;
        chat.lastActivity = new Date();
        await chat.save();

        // Emit to all participants in the chat
        io.to(`chat:${chatId}`).emit('new_message', populatedMessage);

        // Send push notifications to offline users
        const offlineParticipants = chat.participants.filter(p => 
          p.user.toString() !== socket.userId && 
          !activeUsers.has(p.user.toString())
        );

        // TODO: Implement push notifications for offline users

        console.log(`📨 Message sent in chat ${chatId}`);
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle message status updates
    socket.on('message_delivered', async (messageId) => {
      try {
        const message = await Message.findById(messageId);
        if (message) {
          await message.markAsDelivered(socket.userId);
          io.to(`chat:${message.chat}`).emit('message_status_updated', {
            messageId,
            status: 'delivered',
            userId: socket.userId
          });
        }
      } catch (error) {
        console.error('Message delivered error:', error);
      }
    });

    socket.on('message_read', async (messageId) => {
      try {
        const message = await Message.findById(messageId);
        if (message) {
          await message.markAsRead(socket.userId);
          io.to(`chat:${message.chat}`).emit('message_status_updated', {
            messageId,
            status: 'read',
            userId: socket.userId
          });
        }
      } catch (error) {
        console.error('Message read error:', error);
      }
    });

    // Handle typing indicators
    socket.on('typing_start', ({ chatId }) => {
      socket.to(`chat:${chatId}`).emit('user_typing', {
        chatId,
        userId: socket.userId,
        username: socket.user.username,
        isTyping: true
      });
    });

    socket.on('typing_stop', ({ chatId }) => {
      socket.to(`chat:${chatId}`).emit('user_typing', {
        chatId,
        userId: socket.userId,
        username: socket.user.username,
        isTyping: false
      });
    });

    // Handle WebRTC signaling for video/audio calls
    socket.on('call_user', async (data) => {
      try {
        const { targetUserId, chatId, callType, offer } = data;
        
        const callId = `call_${Date.now()}_${socket.userId}`;
        activeCalls.set(callId, {
          caller: socket.userId,
          target: targetUserId,
          chatId,
          callType,
          status: 'ringing',
          startTime: new Date()
        });

        // Send call request to target user
        io.to(`user:${targetUserId}`).emit('incoming_call', {
          callId,
          callerId: socket.userId,
          callerName: socket.user.username,
          callerAvatar: socket.user.avatar,
          chatId,
          callType,
          offer
        });

        console.log(`📞 ${callType} call from ${socket.user.username} to ${targetUserId}`);
      } catch (error) {
        console.error('Call user error:', error);
      }
    });

    socket.on('answer_call', ({ callId, answer }) => {
      const call = activeCalls.get(callId);
      if (call) {
        call.status = 'active';
        io.to(`user:${call.caller}`).emit('call_answered', { callId, answer });
        console.log(`✅ Call ${callId} answered`);
      }
    });

    socket.on('reject_call', ({ callId }) => {
      const call = activeCalls.get(callId);
      if (call) {
        io.to(`user:${call.caller}`).emit('call_rejected', { callId });
        activeCalls.delete(callId);
        console.log(`❌ Call ${callId} rejected`);
      }
    });

    socket.on('end_call', ({ callId }) => {
      const call = activeCalls.get(callId);
      if (call) {
        io.to(`user:${call.caller}`).emit('call_ended', { callId });
        io.to(`user:${call.target}`).emit('call_ended', { callId });
        activeCalls.delete(callId);
        console.log(`📴 Call ${callId} ended`);
      }
    });

    // Handle ICE candidates for WebRTC
    socket.on('ice_candidate', ({ callId, candidate, targetUserId }) => {
      io.to(`user:${targetUserId}`).emit('ice_candidate', { callId, candidate });
    });

    // Handle user disconnection
    socket.on('disconnect', async () => {
      console.log(`🔌 User ${socket.user.username} disconnected`);

      // Update user offline status
      activeUsers.delete(socket.userId);
      
      await User.findByIdAndUpdate(socket.userId, {
        isOnline: false,
        lastSeen: new Date(),
        socketId: null
      });

      // Broadcast user offline status
      socket.broadcast.emit('user_offline', {
        userId: socket.userId,
        username: socket.user.username,
        lastSeen: new Date()
      });

      // End any active calls
      for (const [callId, call] of activeCalls) {
        if (call.caller === socket.userId || call.target === socket.userId) {
          io.to(`user:${call.caller}`).emit('call_ended', { callId });
          io.to(`user:${call.target}`).emit('call_ended', { callId });
          activeCalls.delete(callId);
        }
      }
    });
  });

  console.log('🚀 Socket.IO initialized with real-time features!');
};

export { activeUsers, activeCalls };
