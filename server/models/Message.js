import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  content: {
    text: String,
    media: [{
      type: {
        type: String,
        enum: ['image', 'video', 'audio', 'document', 'voice'],
        required: true
      },
      url: {
        type: String,
        required: true
      },
      filename: String,
      size: Number,
      duration: Number, // for audio/video files
      thumbnailUrl: String, // for videos
      dimensions: {
        width: Number,
        height: Number
      }
    }],
    location: {
      latitude: Number,
      longitude: Number,
      address: String
    },
    contact: {
      name: String,
      phone: String,
      email: String
    }
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'video', 'audio', 'document', 'voice', 'location', 'contact', 'system'],
    required: true,
    default: 'text'
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  forwardedFrom: {
    originalSender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    originalChat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat'
    },
    forwardedAt: {
      type: Date,
      default: Date.now
    }
  },
  edited: {
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: Date,
    editHistory: [{
      content: String,
      editedAt: Date
    }]
  },
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
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  deliveredTo: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    deliveredAt: {
      type: Date,
      default: Date.now
    }
  }],
  isPinned: {
    type: Boolean,
    default: false
  },
  pinnedAt: Date,
  pinnedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletedFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  expiresAt: Date, // for disappearing messages
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  systemMessage: {
    type: String,
    enum: [
      'user_added', 'user_removed', 'user_left', 'group_created',
      'group_name_changed', 'group_photo_changed', 'admin_added',
      'admin_removed', 'chat_settings_changed'
    ]
  }
}, {
  timestamps: true
});

// Indexes for better performance
messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ createdAt: -1 });
messageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to mark as read
messageSchema.methods.markAsRead = function(userId) {
  const existingRead = this.readBy.find(r => r.user.toString() === userId.toString());
  if (!existingRead) {
    this.readBy.push({ user: userId, readAt: new Date() });
    this.status = 'read';
  }
  return this.save();
};

// Method to mark as delivered
messageSchema.methods.markAsDelivered = function(userId) {
  const existingDelivered = this.deliveredTo.find(d => d.user.toString() === userId.toString());
  if (!existingDelivered) {
    this.deliveredTo.push({ user: userId, deliveredAt: new Date() });
    if (this.status === 'sent') {
      this.status = 'delivered';
    }
  }
  return this.save();
};

// Method to add reaction
messageSchema.methods.addReaction = function(userId, emoji) {
  const existingReaction = this.reactions.find(r => r.user.toString() === userId.toString() && r.emoji === emoji);
  if (!existingReaction) {
    this.reactions.push({ user: userId, emoji });
  }
  return this.save();
};

// Method to remove reaction
messageSchema.methods.removeReaction = function(userId, emoji) {
  this.reactions = this.reactions.filter(r => 
    !(r.user.toString() === userId.toString() && r.emoji === emoji)
  );
  return this.save();
};

export default mongoose.model('Message', messageSchema);