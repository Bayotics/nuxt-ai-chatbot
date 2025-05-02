
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
  
  socket.on('join-room', (data) => {
    const { roomId, username, color } = data;
    
    // Create room if it doesn't exist
    if (!rooms[roomId]) {
      rooms[roomId] = {
        cursors: {}
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
  });
  
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
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Remove cursor from all rooms
    Object.keys(rooms).forEach(roomId => {
      if (rooms[roomId]?.cursors[socket.id]) {
        delete rooms[roomId].cursors[socket.id];
        
        // Broadcast updated cursors to room
        io.to(roomId).emit('cursor-update', {
          cursors: rooms[roomId].cursors
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