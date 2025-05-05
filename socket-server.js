import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';



dotenv.config();
// Create HTTP server
const httpServer = createServer();

// Create Socket.io server
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Connect to MongoDB
const connectToMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB from Socket.io server');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
};

// Define Room schema for Socket.io server
const roomSchema = new mongoose.Schema({
  name: String,
  description: String,
  createdBy: String,
  creatorName: String,
  isPrivate: Boolean,
  password: String,
  members: [{
    userId: String,
    username: String,
    role: String
  }],
  imageUrl: String,
  color: String
}, {
  timestamps: true
});

// Create Room model
const Room = mongoose.models.Room || mongoose.model('Room', roomSchema);

// Store chat rooms data
const chatRooms = {};

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Handle joining a room
  socket.on('join-room', (data) => {
    const { roomId, username, color } = data;
    
    // Create room if it doesn't exist
    if (!chatRooms[roomId]) {
      chatRooms[roomId] = {
        cursors: {},
        messages: [] // Add messages array to store chat history
      };
    }
    
    // Add user to room
    socket.join(roomId);
    
    // Add cursor to room
    chatRooms[roomId].cursors[socket.id] = {
      id: socket.id,
      username,
      color,
      x: 0,
      y: 0
    };
    
    // Broadcast updated cursors to room
    io.to(roomId).emit('cursor-update', {
      cursors: chatRooms[roomId].cursors
    });
    
    // Send chat history to the newly joined user
    socket.emit('chat-history', {
      messages: chatRooms[roomId].messages
    });
    
    // Notify others that a new user has joined
    socket.to(roomId).emit('user-joined', {
      username,
      timestamp: new Date(),
      id: socket.id
    });
  });
  
  // Handle cursor movement
  socket.on('cursor-move', (data) => {
    const { roomId, x, y } = data;
    
    // Update cursor position
    if (chatRooms[roomId] && chatRooms[roomId].cursors[socket.id]) {
      chatRooms[roomId].cursors[socket.id].x = x;
      chatRooms[roomId].cursors[socket.id].y = y;
      
      // Broadcast updated cursors to room
      io.to(roomId).emit('cursor-update', {
        cursors: chatRooms[roomId].cursors
      });
    }
  });
  
  // Handle new chat messages
  socket.on('send-message', (data) => {
    const { roomId, message, username } = data;
    
    if (chatRooms[roomId]) {
      // Create message object
      const messageObj = {
        id: Date.now().toString(),
        username,
        content: message,
        timestamp: new Date(),
        senderId: socket.id
      };
      
      // Store message in room history
      chatRooms[roomId].messages.push(messageObj);
      
      // Limit history to last 100 messages
      if (chatRooms[roomId].messages.length > 100) {
        chatRooms[roomId].messages.shift();
      }
      
      // Broadcast message to all users in the room
      io.to(roomId).emit('new-message', messageObj);
    }
  });
  
  // Handle room creation
  socket.on('create-room', async (roomData) => {
    try {
      // Broadcast to all clients that a new room was created
      io.emit('room-created', { room: roomData });
    } catch (error) {
      console.error('Error creating room:', error);
      socket.emit('room-error', { message: 'Failed to create room' });
    }
  });
  
  // Handle fetching rooms
  socket.on('fetch-rooms', async () => {
    try {
      // Fetch rooms from MongoDB
      const rooms = await Room.find({})
        .sort({ createdAt: -1 })
        .limit(20)
        .select('-password');
      
      // Send rooms to client
      socket.emit('rooms-list', { rooms });
    } catch (error) {
      console.error('Error fetching rooms:', error);
      socket.emit('room-error', { message: 'Failed to fetch rooms' });
    }
  });
  
  // Handle user disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Remove cursor from all rooms and notify others
    Object.keys(chatRooms).forEach(roomId => {
      if (chatRooms[roomId]?.cursors[socket.id]) {
        const username = chatRooms[roomId].cursors[socket.id].username;
        
        // Remove cursor
        delete chatRooms[roomId].cursors[socket.id];
        
        // Broadcast updated cursors to room
        io.to(roomId).emit('cursor-update', {
          cursors: chatRooms[roomId].cursors
        });
        
        // Notify others that user has left
        io.to(roomId).emit('user-left', {
          username,
          timestamp: new Date(),
          id: socket.id
        });
      }
    });
  });
});

// Connect to MongoDB and start server
connectToMongoDB().then(() => {
  const PORT = process.env.SOCKET_PORT || 3001;
  httpServer.listen(PORT, () => {
    console.log(`Socket.io server running on port ${PORT}`);
  });
});