import express from 'express';
import { body, validationResult } from 'express-validator';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import User from '../models/User.js';

const router = express.Router();

// Get user's chats
router.get('/', async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const chats = await Chat.find({
      'participants.user': req.user._id
    })
    .populate('participants.user', 'username avatar isOnline lastSeen')
    .populate('lastMessage')
    .populate('creator', 'username avatar')
    .sort({ lastActivity: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(offset));

    res.json({
      success: true,
      data: { chats }
    });

  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new chat (direct or group)
router.post('/', [
  body('participants')
    .isArray({ min: 1 })
    .withMessage('At least one participant is required'),
  body('name')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Chat name cannot exceed 100 characters'),
  body('isGroupChat')
    .optional()
    .isBoolean()
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

    const { participants, name, description, isGroupChat = false, isChannel = false } = req.body;

    // For direct chats, check if chat already exists
    if (!isGroupChat && participants.length === 1) {
      const existingChat = await Chat.findOne({
        isGroupChat: false,
        'participants.user': { $all: [req.user._id, participants[0]] }
      });

      if (existingChat) {
        return res.json({
          success: true,
          data: { chat: existingChat }
        });
      }
    }

    // Validate participants exist
    const validParticipants = await User.find({
      _id: { $in: participants }
    }).select('_id');

    if (validParticipants.length !== participants.length) {
      return res.status(400).json({
        success: false,
        message: 'Some participants not found'
      });
    }

    // Create chat participants array
    const chatParticipants = [
      {
        user: req.user._id,
        role: 'owner',
        joinedAt: new Date()
      },
      ...participants.map(userId => ({
        user: userId,
        role: 'member',
        joinedAt: new Date()
      }))
    ];

    const newChat = new Chat({
      name: isGroupChat ? name : undefined,
      description: description || '',
      isGroupChat,
      isChannel,
      participants: chatParticipants,
      creator: req.user._id,
      lastActivity: new Date()
    });

    const savedChat = await newChat.save();
    const populatedChat = await Chat.findById(savedChat._id)
      .populate('participants.user', 'username avatar isOnline lastSeen')
      .populate('creator', 'username avatar');

    res.status(201).json({
      success: true,
      message: 'Chat created successfully',
      data: { chat: populatedChat }
    });

  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get specific chat
router.get('/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId)
      .populate('participants.user', 'username avatar isOnline lastSeen')
      .populate('creator', 'username avatar')
      .populate('lastMessage');

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Check if user is participant
    if (!chat.isParticipant(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: { chat }
    });

  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update chat details
router.put('/:chatId', [
  body('name')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Chat name cannot exceed 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
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

    const { chatId } = req.params;
    const { name, description, avatar, settings } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Check if user has permission to edit
    if (!chat.isAdmin(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    // Update fields
    if (name !== undefined) chat.name = name;
    if (description !== undefined) chat.description = description;
    if (avatar !== undefined) chat.avatar = avatar;
    if (settings !== undefined) {
      chat.settings = { ...chat.settings, ...settings };
    }

    await chat.save();

    const updatedChat = await Chat.findById(chatId)
      .populate('participants.user', 'username avatar isOnline lastSeen')
      .populate('creator', 'username avatar');

    res.json({
      success: true,
      message: 'Chat updated successfully',
      data: { chat: updatedChat }
    });

  } catch (error) {
    console.error('Update chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Add participants to group chat
router.post('/:chatId/participants', [
  body('participants')
    .isArray({ min: 1 })
    .withMessage('At least one participant is required')
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

    const { chatId } = req.params;
    const { participants } = req.body;

    const chat = await Chat.findById(chatId);
    if (!chat || !chat.isGroupChat) {
      return res.status(404).json({
        success: false,
        message: 'Group chat not found'
      });
    }

    // Check permissions
    const userPermissions = chat.participants.find(p => 
      p.user.toString() === req.user._id.toString()
    )?.permissions;

    if (!chat.isAdmin(req.user._id) && !userPermissions?.canAddMembers) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    // Validate new participants
    const validParticipants = await User.find({
      _id: { $in: participants }
    }).select('_id username');

    const addedParticipants = [];
    for (const user of validParticipants) {
      if (!chat.isParticipant(user._id)) {
        await chat.addParticipant(user._id);
        addedParticipants.push(user);
      }
    }

    res.json({
      success: true,
      message: `${addedParticipants.length} participants added successfully`,
      data: { addedParticipants }
    });

  } catch (error) {
    console.error('Add participants error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Remove participant from group chat
router.delete('/:chatId/participants/:userId', async (req, res) => {
  try {
    const { chatId, userId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat || !chat.isGroupChat) {
      return res.status(404).json({
        success: false,
        message: 'Group chat not found'
      });
    }

    // Check permissions (admin or removing self)
    if (!chat.isAdmin(req.user._id) && userId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    // Cannot remove chat owner
    if (userId === chat.creator.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove chat owner'
      });
    }

    await chat.removeParticipant(userId);

    res.json({
      success: true,
      message: 'Participant removed successfully'
    });

  } catch (error) {
    console.error('Remove participant error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Leave group chat
router.post('/:chatId/leave', async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat || !chat.isGroupChat) {
      return res.status(404).json({
        success: false,
        message: 'Group chat not found'
      });
    }

    if (!chat.isParticipant(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You are not a participant of this chat'
      });
    }

    // If owner is leaving, transfer ownership to another admin or member
    if (chat.creator.toString() === req.user._id.toString()) {
      const otherAdmins = chat.participants.filter(p => 
        p.role === 'admin' && p.user.toString() !== req.user._id.toString()
      );
      
      if (otherAdmins.length > 0) {
        // Transfer to first admin
        chat.creator = otherAdmins[0].user;
        otherAdmins[0].role = 'owner';
      } else {
        // Transfer to first member
        const otherMembers = chat.participants.filter(p => 
          p.user.toString() !== req.user._id.toString()
        );
        
        if (otherMembers.length > 0) {
          chat.creator = otherMembers[0].user;
          otherMembers[0].role = 'owner';
        }
      }
    }

    await chat.removeParticipant(req.user._id);

    res.json({
      success: true,
      message: 'Left group chat successfully'
    });

  } catch (error) {
    console.error('Leave chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete chat
router.delete('/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Only owner can delete group chats
    if (chat.isGroupChat && chat.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only chat owner can delete this chat'
      });
    }

    // For direct chats, any participant can delete (for themselves)
    if (!chat.isGroupChat && !chat.isParticipant(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Delete all messages in the chat
    await Message.deleteMany({ chat: chatId });

    // Delete the chat
    await Chat.findByIdAndDelete(chatId);

    res.json({
      success: true,
      message: 'Chat deleted successfully'
    });

  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;