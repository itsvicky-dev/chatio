import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import Chat from '../models/Chat.js';

const router = express.Router();

// Get current user profile
router.get('/me', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update user profile
router.put('/me', [
  body('username')
    .optional()
    .isLength({ min: 3, max: 20 })
    .matches(/^[a-zA-Z0-9_]+$/),
  body('bio')
    .optional()
    .isLength({ max: 150 })
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

    const updates = {};
    const allowedUpdates = ['username', 'bio', 'avatar', 'status', 'theme', 'privacy', 'notifications'];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Check if username is already taken (if updating username)
    if (updates.username && updates.username !== req.user.username) {
      const existingUser = await User.findOne({ username: updates.username });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken'
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Search users
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 20, offset = 0 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const users = await User.find({
      $and: [
        { _id: { $ne: req.user._id } }, // Exclude current user
        {
          $or: [
            { username: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } }
          ]
        }
      ]
    })
    .select('username email avatar bio isOnline lastSeen')
    .limit(parseInt(limit))
    .skip(parseInt(offset));

    res.json({
      success: true,
      data: { users }
    });

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user by ID
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId)
      .select('username email avatar bio isOnline lastSeen privacy');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check privacy settings
    const userResponse = {
      _id: user._id,
      username: user.username,
      avatar: user.avatar,
      isOnline: user.isOnline
    };

    // Add additional fields based on privacy settings
    if (user.privacy.about === 'everyone' || 
        (user.privacy.about === 'contacts' && user.contacts.some(c => c.user.toString() === req.user._id.toString()))) {
      userResponse.bio = user.bio;
    }

    if (user.privacy.lastSeen === 'everyone' || 
        (user.privacy.lastSeen === 'contacts' && user.contacts.some(c => c.user.toString() === req.user._id.toString()))) {
      userResponse.lastSeen = user.lastSeen;
    }

    res.json({
      success: true,
      data: { user: userResponse }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Add user to contacts
router.post('/contacts/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot add yourself to contacts'
      });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already in contacts
    const isAlreadyContact = req.user.contacts.some(
      contact => contact.user.toString() === userId
    );

    if (isAlreadyContact) {
      return res.status(400).json({
        success: false,
        message: 'User already in contacts'
      });
    }

    // Add to contacts
    req.user.contacts.push({
      user: userId,
      addedAt: new Date()
    });

    await req.user.save();

    res.json({
      success: true,
      message: 'User added to contacts successfully'
    });

  } catch (error) {
    console.error('Add contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Remove user from contacts
router.delete('/contacts/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    req.user.contacts = req.user.contacts.filter(
      contact => contact.user.toString() !== userId
    );

    await req.user.save();

    res.json({
      success: true,
      message: 'User removed from contacts successfully'
    });

  } catch (error) {
    console.error('Remove contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user contacts
router.get('/me/contacts', async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('contacts.user', 'username avatar bio isOnline lastSeen')
      .select('contacts');

    res.json({
      success: true,
      data: { contacts: user.contacts }
    });

  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Block user
router.post('/block/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot block yourself'
      });
    }

    if (!req.user.blockedUsers.includes(userId)) {
      req.user.blockedUsers.push(userId);
      await req.user.save();
    }

    res.json({
      success: true,
      message: 'User blocked successfully'
    });

  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Unblock user
router.delete('/block/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    req.user.blockedUsers = req.user.blockedUsers.filter(
      blockedId => blockedId.toString() !== userId
    );

    await req.user.save();

    res.json({
      success: true,
      message: 'User unblocked successfully'
    });

  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;