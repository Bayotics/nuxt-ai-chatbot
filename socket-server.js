import { createServer } from 'http';
import { Server } from 'socket.io';

// Create HTTP server
const httpServer = createServer();

// Create Socket.io server
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Store rooms data
const rooms = {};

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Handle joining a room
  socket.on('join-room', (data) => {
    const { roomId, username, color } = data;
    
    // Create room if it doesn't exist
    if (!rooms[roomId]) {
      rooms[roomId] = {
        cursors: {},
        messages: [] // Add messages array to store chat history
      };
    }
    
    // Add user to room
    socket.join(roomId);
    
    // Add cursor to room
    rooms[roomId].cursors[socket.id] = {
      id: socket.id,
      username,
      color,
      x: 0,
      y: 0
    };
    
    // Broadcast updated cursors to room
    io.to(roomId).emit('cursor-update', {
      cursors: rooms[roomId].cursors
    });
    
    // Send chat history to the newly joined user
    socket.emit('chat-history', {
      messages: rooms[roomId].messages
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
    if (rooms[roomId] && rooms[roomId].cursors[socket.id]) {
      rooms[roomId].cursors[socket.id].x = x;
      rooms[roomId].cursors[socket.id].y = y;
      
      // Broadcast updated cursors to room
      io.to(roomId).emit('cursor-update', {
        cursors: rooms[roomId].cursors
      });
    }
  });
  
  // Handle new chat messages
  socket.on('send-message', (data) => {
    const { roomId, message, username } = data;
    
    if (rooms[roomId]) {
      // Create message object
      const messageObj = {
        id: Date.now().toString(),
        username,
        content: message,
        timestamp: new Date(),
        senderId: socket.id
      };
      
      // Store message in room history
      rooms[roomId].messages.push(messageObj);
      
      // Limit history to last 100 messages
      if (rooms[roomId].messages.length > 100) {
        rooms[roomId].messages.shift();
      }
      
      // Broadcast message to all users in the room
      io.to(roomId).emit('new-message', messageObj);
    }
  });
  
  // Handle user disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Remove cursor from all rooms and notify others
    Object.keys(rooms).forEach(roomId => {
      if (rooms[roomId]?.cursors[socket.id]) {
        const username = rooms[roomId].cursors[socket.id].username;
        
        // Remove cursor
        delete rooms[roomId].cursors[socket.id];
        
        // Broadcast updated cursors to room
        io.to(roomId).emit('cursor-update', {
          cursors: rooms[roomId].cursors
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

// Start server
const PORT = process.env.SOCKET_PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});