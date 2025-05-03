import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  createdBy: {
    type: String,
    required: true
  },
  creatorName: {
    type: String,
    default: 'Anonymous'
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  password: {
    type: String,
    default: null
  },
  color: {
    type: String,
    default: '#10b981' // Default emerald color
  },
  imageUrl: {
    type: String,
    default: null
  },
  members: [{
    userId: String,
    username: String,
    role: {
      type: String,
      enum: ['admin', 'moderator', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  messages: [{
    senderId: String,
    username: String,
    content: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Create the model if it doesn't exist already
export const Room = mongoose.models.Room || mongoose.model('Room', roomSchema);