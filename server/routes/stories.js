import express from 'express';
import { body, validationResult } from 'express-validator';
import Story from '../models/Story.js';
import User from '../models/User.js';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';

const router = express.Router();

// Configure multer for story uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit for stories
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/ogg'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type for story'), false);
    }
  }
});

// Get stories feed (user's contacts stories)
router.get('/feed', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('contacts.user');
    const contactIds = user.contacts.map(contact => contact.user._id);
    
    // Include user's own stories and contacts' stories
    const userIds = [req.user._id, ...contactIds];

    const stories = await Story.find({
      creator: { $in: userIds },
      expiresAt: { $gt: new Date() },
      isArchived: false,
      $or: [
        { privacy: 'public' },
        { privacy: 'contacts' },
        { 
          privacy: 'custom',
          allowedViewers: req.user._id,
          blockedViewers: { $ne: req.user._id }
        }
      ]
    })
    .populate('creator', 'username avatar')
    .sort({ createdAt: -1 });

    // Group stories by creator
    const storiesByUser = {};
    stories.forEach(story => {
      const creatorId = story.creator._id.toString();
      if (!storiesByUser[creatorId]) {
        storiesByUser[creatorId] = {
          user: story.creator,
          stories: [],
          hasUnviewed: false
        };
      }
      
      const hasViewed = story.viewers.some(v => 
        v.user.toString() === req.user._id.toString()
      );
      
      if (!hasViewed) {
        storiesByUser[creatorId].hasUnviewed = true;
      }
      
      storiesByUser[creatorId].stories.push(story);
    });

    res.json({
      success: true,
      data: { storiesByUser: Object.values(storiesByUser) }
    });

  } catch (error) {
    console.error('Get stories feed error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user's own stories
router.get('/me', async (req, res) => {
  try {
    const stories = await Story.find({
      creator: req.user._id,
      isArchived: false
    })
    .populate('viewers.user', 'username avatar')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { stories }
    });

  } catch (error) {
    console.error('Get my stories error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create text story
router.post('/text', [
  body('content.text')
    .notEmpty()
    .isLength({ max: 500 })
    .withMessage('Story text cannot exceed 500 characters'),
  body('content.backgroundColor')
    .optional()
    .isHexColor()
    .withMessage('Invalid background color'),
  body('privacy')
    .optional()
    .isIn(['public', 'contacts', 'close_friends', 'custom'])
    .withMessage('Invalid privacy setting')
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

    const { 
      content, 
      caption, 
      privacy = 'contacts', 
      allowedViewers = [], 
      blockedViewers = [],
      location,
      music
    } = req.body;

    const newStory = new Story({
      creator: req.user._id,
      content: {
        type: 'text',
        ...content
      },
      caption,
      privacy,
      allowedViewers,
      blockedViewers,
      location,
      music
    });

    const savedStory = await newStory.save();
    const populatedStory = await Story.findById(savedStory._id)
      .populate('creator', 'username avatar');

    res.status(201).json({
      success: true,
      message: 'Story created successfully',
      data: { story: populatedStory }
    });

  } catch (error) {
    console.error('Create text story error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create media story
router.post('/media', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { 
      caption, 
      privacy = 'contacts', 
      allowedViewers = [], 
      blockedViewers = [],
      location,
      music
    } = req.body;

    let processedBuffer = req.file.buffer;
    let thumbnailUrl = null;
    const contentType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';

    // Process images for optimization
    if (contentType === 'image') {
      processedBuffer = await sharp(req.file.buffer)
        .resize(1080, 1920, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .jpeg({ quality: 90 })
        .toBuffer();
    }

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: 'convo-chat/stories',
          public_id: `story_${Date.now()}_${req.user._id}`,
          transformation: contentType === 'image' 
            ? [{ width: 1080, height: 1920, crop: 'limit' }]
            : [{ width: 1080, height: 1920, crop: 'limit', quality: 'auto' }]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(processedBuffer);
    });

    // Generate thumbnail for videos
    if (contentType === 'video') {
      thumbnailUrl = uploadResult.secure_url.replace(/\.[^/.]+$/, ".jpg");
    }

    const newStory = new Story({
      creator: req.user._id,
      content: {
        type: contentType,
        url: uploadResult.secure_url,
        thumbnailUrl: thumbnailUrl
      },
      caption,
      privacy,
      allowedViewers: privacy === 'custom' ? JSON.parse(allowedViewers || '[]') : [],
      blockedViewers: JSON.parse(blockedViewers || '[]'),
      location: location ? JSON.parse(location) : null,
      music: music ? JSON.parse(music) : null
    });

    const savedStory = await newStory.save();
    const populatedStory = await Story.findById(savedStory._id)
      .populate('creator', 'username avatar');

    res.status(201).json({
      success: true,
      message: 'Story created successfully',
      data: { story: populatedStory }
    });

  } catch (error) {
    console.error('Create media story error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// View story (mark as viewed)
router.post('/:storyId/view', async (req, res) => {
  try {
    const { storyId } = req.params;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }

    // Check if user can view story
    if (!story.canView(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await story.markAsViewed(req.user._id);

    res.json({
      success: true,
      message: 'Story viewed successfully'
    });

  } catch (error) {
    console.error('View story error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get story details
router.get('/:storyId', async (req, res) => {
  try {
    const { storyId } = req.params;

    const story = await Story.findById(storyId)
      .populate('creator', 'username avatar')
      .populate('viewers.user', 'username avatar')
      .populate('reactions.user', 'username avatar');

    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }

    // Check if user can view story
    if (!story.canView(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: { story }
    });

  } catch (error) {
    console.error('Get story error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// React to story
router.post('/:storyId/reactions', [
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

    const { storyId } = req.params;
    const { emoji } = req.body;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }

    // Check if user can view story
    if (!story.canView(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await story.addReaction(req.user._id, emoji);

    res.json({
      success: true,
      message: 'Reaction added successfully'
    });

  } catch (error) {
    console.error('React to story error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete story
router.delete('/:storyId', async (req, res) => {
  try {
    const { storyId } = req.params;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }

    // Only creator can delete story
    if (story.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own stories'
      });
    }

    await Story.findByIdAndDelete(storyId);

    res.json({
      success: true,
      message: 'Story deleted successfully'
    });

  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Archive story
router.post('/:storyId/archive', async (req, res) => {
  try {
    const { storyId } = req.params;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({
        success: false,
        message: 'Story not found'
      });
    }

    // Only creator can archive story
    if (story.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only archive your own stories'
      });
    }

    story.isArchived = true;
    await story.save();

    res.json({
      success: true,
      message: 'Story archived successfully'
    });

  } catch (error) {
    console.error('Archive story error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get archived stories
router.get('/me/archived', async (req, res) => {
  try {
    const stories = await Story.find({
      creator: req.user._id,
      isArchived: true
    })
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { stories }
    });

  } catch (error) {
    console.error('Get archived stories error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;