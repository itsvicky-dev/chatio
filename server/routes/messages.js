import express from 'express';
import { body, validationResult } from 'express-validator';
import Message from '../models/Message.js';
import Chat from '../models/Chat.js';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images, videos, audio, and documents
    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/ogg',
      'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Get messages for a chat
router.get('/chat/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { limit = 50, offset = 0, before } = req.query;

    const chat = await Chat.findById(chatId);
    if (!chat || !chat.isParticipant(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const query = { 
      chat: chatId,
      isDeleted: false,
      deletedFor: { $ne: req.user._id }
    };

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .populate('sender', 'username avatar')
      .populate('replyTo', 'content sender createdAt')
      .populate('replyTo.sender', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    res.json({
      success: true,
      data: { messages: messages.reverse() }
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Send text message
router.post('/', [
  body('chatId')
    .isMongoId()
    .withMessage('Valid chat ID is required'),
  body('content.text')
    .optional()
    .isLength({ max: 4000 })
    .withMessage('Message cannot exceed 4000 characters'),
  body('messageType')
    .isIn(['text', 'image', 'video', 'audio', 'document', 'voice', 'location', 'contact'])
    .withMessage('Invalid message type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { chatId, content, messageType = 'text', replyTo } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat || !chat.isParticipant(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check user permissions
    const userParticipant = chat.participants.find(p => 
      p.user.toString() === req.user._id.toString()
    );

    if (!userParticipant.permissions.canSendMessages) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to send messages in this chat'
      });
    }

    const newMessage = new Message({
      sender: req.user._id,
      chat: chatId,
      content,
      messageType,
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

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: { message: populatedMessage }
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Upload and send media message
router.post('/media', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { chatId, caption, messageType, replyTo } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat || !chat.isParticipant(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check media permissions
    const userParticipant = chat.participants.find(p => 
      p.user.toString() === req.user._id.toString()
    );

    if (!userParticipant.permissions.canSendMedia) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to send media in this chat'
      });
    }

    let processedBuffer = req.file.buffer;
    let thumbnailUrl = null;

    // Process images for optimization
    if (req.file.mimetype.startsWith('image/')) {
      processedBuffer = await sharp(req.file.buffer)
        .resize(1920, 1080, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .jpeg({ quality: 85 })
        .toBuffer();
    }

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: 'convo-chat/messages',
          public_id: `${Date.now()}_${req.user._id}`
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(processedBuffer);
    });

    // Generate thumbnail for videos
    if (req.file.mimetype.startsWith('video/')) {
      // This would require additional video processing
      // For now, we'll use Cloudinary's auto thumbnail generation
      thumbnailUrl = uploadResult.secure_url.replace(/\.[^/.]+$/, ".jpg");
    }

    const mediaContent = {
      media: [{
        type: messageType,
        url: uploadResult.secure_url,
        filename: req.file.originalname,
        size: req.file.size,
        thumbnailUrl: thumbnailUrl,
        dimensions: uploadResult.width && uploadResult.height ? {
          width: uploadResult.width,
          height: uploadResult.height
        } : undefined
      }]
    };

    if (caption) {
      mediaContent.text = caption;
    }

    const newMessage = new Message({
      sender: req.user._id,
      chat: chatId,
      content: mediaContent,
      messageType,
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

    res.status(201).json({
      success: true,
      message: 'Media message sent successfully',
      data: { message: populatedMessage }
    });

  } catch (error) {
    console.error('Send media message error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Edit message
router.put('/:messageId', [
  body('content.text')
    .isLength({ max: 4000 })
    .withMessage('Message cannot exceed 4000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { messageId } = req.params;
    const { content } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Only sender can edit message
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own messages'
      });
    }

    // Can only edit text messages
    if (message.messageType !== 'text') {
      return res.status(400).json({
        success: false,
        message: 'Only text messages can be edited'
      });
    }

    // Store edit history
    if (!message.edited.editHistory) {
      message.edited.editHistory = [];
    }
    
    message.edited.editHistory.push({
      content: message.content.text,
      editedAt: new Date()
    });

    // Update message
    message.content.text = content.text;
    message.edited.isEdited = true;
    message.edited.editedAt = new Date();

    await message.save();

    const updatedMessage = await Message.findById(messageId)
      .populate('sender', 'username avatar')
      .populate('replyTo', 'content sender createdAt')
      .populate('replyTo.sender', 'username avatar');

    res.json({
      success: true,
      message: 'Message updated successfully',
      data: { message: updatedMessage }
    });

  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete message
router.delete('/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { deleteForEveryone = false } = req.query;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Only sender can delete message
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages'
      });
    }

    if (deleteForEveryone === 'true') {
      // Delete for everyone (within 24 hours)
      const timeDiff = new Date() - message.createdAt;
      const hoursDiff = timeDiff / (1000 * 60 * 60);

      if (hoursDiff > 24) {
        return res.status(400).json({
          success: false,
          message: 'Messages can only be deleted for everyone within 24 hours'
        });
      }

      message.isDeleted = true;
      message.deletedAt = new Date();
      message.content = { text: 'This message was deleted' };
    } else {
      // Delete for sender only
      if (!message.deletedFor.includes(req.user._id)) {
        message.deletedFor.push(req.user._id);
      }
    }

    await message.save();

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Add reaction to message
router.post('/:messageId/reactions', [
  body('emoji')
    .notEmpty()
    .withMessage('Emoji is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { messageId } = req.params;
    const { emoji } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is participant of the chat
    const chat = await Chat.findById(message.chat);
    if (!chat || !chat.isParticipant(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await message.addReaction(req.user._id, emoji);

    res.json({
      success: true,
      message: 'Reaction added successfully'
    });

  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Remove reaction from message
router.delete('/:messageId/reactions/:emoji', async (req, res) => {
  try {
    const { messageId, emoji } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is participant of the chat
    const chat = await Chat.findById(message.chat);
    if (!chat || !chat.isParticipant(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await message.removeReaction(req.user._id, emoji);

    res.json({
      success: true,
      message: 'Reaction removed successfully'
    });

  } catch (error) {
    console.error('Remove reaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;