import express from 'express';
import { body, validationResult } from 'express-validator';
import Chat from '../models/Chat.js';

const router = express.Router();

// Create call model for call history
const CallSchema = {
  participants: [{
    user: { type: 'ObjectId', ref: 'User', required: true },
    joinedAt: { type: 'Date' },
    leftAt: { type: 'Date' },
    status: { type: 'String', enum: ['joined', 'left', 'rejected', 'missed'], default: 'joined' }
  }],
  initiator: { type: 'ObjectId', ref: 'User', required: true },
  chat: { type: 'ObjectId', ref: 'Chat' },
  callType: { type: 'String', enum: ['audio', 'video'], required: true },
  status: { type: 'String', enum: ['ongoing', 'ended', 'missed', 'rejected'], default: 'ongoing' },
  startTime: { type: 'Date', default: Date.now },
  endTime: { type: 'Date' },
  duration: { type: 'Number' }, // in seconds
  createdAt: { type: 'Date', default: Date.now },
  updatedAt: { type: 'Date', default: Date.now }
};

// For now, we'll store call history in memory or a simple array
// In a production app, you'd want a proper Call model
let callHistory = [];

// Get call history
router.get('/history', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    // Filter calls where user is participant
    const userCalls = callHistory.filter(call => 
      call.participants.some(p => p.user.toString() === req.user._id.toString()) ||
      call.initiator.toString() === req.user._id.toString()
    )
    .sort((a, b) => b.startTime - a.startTime)
    .slice(offset, offset + limit);

    res.json({
      success: true,
      data: { calls: userCalls }
    });

  } catch (error) {
    console.error('Get call history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Start call
router.post('/start', [
  body('participantIds')
    .isArray({ min: 1 })
    .withMessage('At least one participant is required'),
  body('callType')
    .isIn(['audio', 'video'])
    .withMessage('Call type must be audio or video'),
  body('chatId')
    .optional()
    .isMongoId()
    .withMessage('Valid chat ID required')
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

    const { participantIds, callType, chatId } = req.body;

    // Validate participants exist and are contacts
    const validParticipants = participantIds.filter(id => 
      id !== req.user._id.toString()
    );

    if (validParticipants.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid participants found'
      });
    }

    // If chatId provided, validate user is participant
    let chat = null;
    if (chatId) {
      chat = await Chat.findById(chatId);
      if (!chat || !chat.isParticipant(req.user._id)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to chat'
        });
      }
    }

    // Create call record
    const callRecord = {
      _id: `call_${Date.now()}_${req.user._id}`,
      participants: validParticipants.map(id => ({
        user: id,
        status: 'joined',
        joinedAt: new Date()
      })),
      initiator: req.user._id,
      chat: chatId || null,
      callType,
      status: 'ongoing',
      startTime: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    callHistory.push(callRecord);

    res.status(201).json({
      success: true,
      message: 'Call started successfully',
      data: { 
        callId: callRecord._id,
        call: callRecord 
      }
    });

  } catch (error) {
    console.error('Start call error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// End call
router.post('/:callId/end', async (req, res) => {
  try {
    const { callId } = req.params;

    const callIndex = callHistory.findIndex(call => call._id === callId);
    if (callIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Call not found'
      });
    }

    const call = callHistory[callIndex];

    // Check if user is participant or initiator
    const isParticipant = call.participants.some(p => 
      p.user.toString() === req.user._id.toString()
    ) || call.initiator.toString() === req.user._id.toString();

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update call record
    call.status = 'ended';
    call.endTime = new Date();
    call.duration = Math.floor((call.endTime - call.startTime) / 1000);
    call.updatedAt = new Date();

    // Update participant status
    const participant = call.participants.find(p => 
      p.user.toString() === req.user._id.toString()
    );
    if (participant) {
      participant.leftAt = new Date();
      participant.status = 'left';
    }

    callHistory[callIndex] = call;

    res.json({
      success: true,
      message: 'Call ended successfully',
      data: { call }
    });

  } catch (error) {
    console.error('End call error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Join call
router.post('/:callId/join', async (req, res) => {
  try {
    const { callId } = req.params;

    const callIndex = callHistory.findIndex(call => call._id === callId);
    if (callIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Call not found'
      });
    }

    const call = callHistory[callIndex];

    // Check if call is still ongoing
    if (call.status !== 'ongoing') {
      return res.status(400).json({
        success: false,
        message: 'Call is not active'
      });
    }

    // Check if user is invited participant
    const participant = call.participants.find(p => 
      p.user.toString() === req.user._id.toString()
    );

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'You are not invited to this call'
      });
    }

    // Update participant status
    participant.joinedAt = new Date();
    participant.status = 'joined';
    call.updatedAt = new Date();

    callHistory[callIndex] = call;

    res.json({
      success: true,
      message: 'Joined call successfully',
      data: { call }
    });

  } catch (error) {
    console.error('Join call error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Reject call
router.post('/:callId/reject', async (req, res) => {
  try {
    const { callId } = req.params;

    const callIndex = callHistory.findIndex(call => call._id === callId);
    if (callIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Call not found'
      });
    }

    const call = callHistory[callIndex];

    // Check if user is invited participant
    const participant = call.participants.find(p => 
      p.user.toString() === req.user._id.toString()
    );

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update participant status
    participant.status = 'rejected';
    participant.leftAt = new Date();
    call.updatedAt = new Date();

    // If all participants rejected, mark call as rejected
    const allRejected = call.participants.every(p => p.status === 'rejected');
    if (allRejected) {
      call.status = 'rejected';
      call.endTime = new Date();
      call.duration = 0;
    }

    callHistory[callIndex] = call;

    res.json({
      success: true,
      message: 'Call rejected successfully',
      data: { call }
    });

  } catch (error) {
    console.error('Reject call error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get active calls for user
router.get('/active', async (req, res) => {
  try {
    const activeCalls = callHistory.filter(call => 
      call.status === 'ongoing' &&
      (call.participants.some(p => p.user.toString() === req.user._id.toString()) ||
       call.initiator.toString() === req.user._id.toString())
    );

    res.json({
      success: true,
      data: { calls: activeCalls }
    });

  } catch (error) {
    console.error('Get active calls error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get call details
router.get('/:callId', async (req, res) => {
  try {
    const { callId } = req.params;

    const call = callHistory.find(call => call._id === callId);
    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Call not found'
      });
    }

    // Check if user is participant or initiator
    const isParticipant = call.participants.some(p => 
      p.user.toString() === req.user._id.toString()
    ) || call.initiator.toString() === req.user._id.toString();

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: { call }
    });

  } catch (error) {
    console.error('Get call details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;