import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  name: {
    type: String,
    required: function() {
      return this.isGroupChat;
    },
    trim: true,
    maxlength: [100, 'Chat name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },
  isGroupChat: {
    type: Boolean,
    default: false
  },
  isChannel: {
    type: Boolean,
    default: false
  },
  avatar: {
    type: String,
    default: null
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    permissions: {
      canSendMessages: { type: Boolean, default: true },
      canSendMedia: { type: Boolean, default: true },
      canAddMembers: { type: Boolean, default: false },
      canRemoveMembers: { type: Boolean, default: false },
      canEditInfo: { type: Boolean, default: false }
    }
  }],
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  settings: {
    allowMembersToAddOthers: { type: Boolean, default: true },
    allowMembersToSendMedia: { type: Boolean, default: true },
    muteNotifications: { type: Boolean, default: false },
    disappearingMessages: {
      enabled: { type: Boolean, default: false },
      duration: { type: Number, default: 86400 } // 24 hours in seconds
    }
  },
  pinnedMessages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }],
  inviteLink: {
    code: String,
    isActive: { type: Boolean, default: false },
    expiresAt: Date,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
}, {
  timestamps: true
});

// Indexes for better performance
chatSchema.index({ participants: 1 });
chatSchema.index({ lastActivity: -1 });
chatSchema.index({ isGroupChat: 1 });
chatSchema.index({ creator: 1 });

// Virtual for participant count
chatSchema.virtual('participantCount').get(function() {
  return this.participants.length;
});

// Method to check if user is participant
chatSchema.methods.isParticipant = function(userId) {
  return this.participants.some(p => p.user.toString() === userId.toString());
};

// Method to check if user is admin
chatSchema.methods.isAdmin = function(userId) {
  const participant = this.participants.find(p => p.user.toString() === userId.toString());
  return participant && (participant.role === 'admin' || participant.role === 'owner');
};

// Method to add participant
chatSchema.methods.addParticipant = function(userId, role = 'member') {
  if (!this.isParticipant(userId)) {
    this.participants.push({
      user: userId,
      role: role,
      joinedAt: new Date()
    });
  }
  return this.save();
};

// Method to remove participant
chatSchema.methods.removeParticipant = function(userId) {
  this.participants = this.participants.filter(p => p.user.toString() !== userId.toString());
  return this.save();
};

// Update last activity
chatSchema.methods.updateLastActivity = function() {
  this.lastActivity = new Date();
  return this.save({ validateBeforeSave: false });
};

export default mongoose.model('Chat', chatSchema);