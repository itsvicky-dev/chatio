import mongoose from 'mongoose';

const storySchema = new mongoose.Schema({
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: {
      type: String,
      enum: ['image', 'video', 'text'],
      required: true
    },
    url: String, // for image/video stories
    text: String, // for text stories
    backgroundColor: String, // for text stories
    font: String, // for text stories
    thumbnailUrl: String // for video stories
  },
  caption: {
    type: String,
    maxlength: [300, 'Caption cannot exceed 300 characters']
  },
  duration: {
    type: Number,
    default: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
  },
  viewers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  privacy: {
    type: String,
    enum: ['public', 'contacts', 'close_friends', 'custom'],
    default: 'contacts'
  },
  allowedViewers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  blockedViewers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isHighlight: {
    type: Boolean,
    default: false
  },
  highlightCategory: String,
  isArchived: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    required: true
  },
  location: {
    name: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  music: {
    title: String,
    artist: String,
    preview: String
  }
}, {
  timestamps: true
});

// Index for better performance
storySchema.index({ creator: 1, createdAt: -1 });
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Set expiry date before saving
storySchema.pre('save', function(next) {
  if (this.isNew && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + this.duration);
  }
  next();
});

// Method to check if user can view story
storySchema.methods.canView = function(userId) {
  // Creator can always view their own story
  if (this.creator.toString() === userId.toString()) {
    return true;
  }

  // Check if story is expired
  if (this.expiresAt < new Date()) {
    return false;
  }

  // Check privacy settings
  switch (this.privacy) {
    case 'public':
      return true;
    case 'custom':
      return this.allowedViewers.includes(userId) && !this.blockedViewers.includes(userId);
    default:
      return !this.blockedViewers.includes(userId);
  }
};

// Method to mark as viewed
storySchema.methods.markAsViewed = function(userId) {
  const existingView = this.viewers.find(v => v.user.toString() === userId.toString());
  if (!existingView) {
    this.viewers.push({ user: userId, viewedAt: new Date() });
  }
  return this.save();
};

// Method to add reaction
storySchema.methods.addReaction = function(userId, emoji) {
  const existingReaction = this.reactions.find(r => r.user.toString() === userId.toString() && r.emoji === emoji);
  if (!existingReaction) {
    this.reactions.push({ user: userId, emoji });
  }
  return this.save();
};

export default mongoose.model('Story', storySchema);