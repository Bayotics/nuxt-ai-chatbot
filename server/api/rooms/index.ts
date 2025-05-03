import { defineEventHandler, readBody, getQuery, createError } from 'h3';
import { connectToDatabase } from '~/server/utils/mongodb';
import { Room } from '~/server/models/Room';
import { getUserFromEvent } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
  // Connect to database
  await connectToDatabase();
  
  // Handle different HTTP methods
  const method = event.node.req.method;
  
  // GET - Fetch rooms
  if (method === 'GET') {
    try {
      const query = getQuery(event);
      const limit = parseInt(query.limit as string) || 20;
      const page = parseInt(query.page as string) || 1;
      const skip = (page - 1) * limit;
      
      // Get rooms with pagination
      const rooms = await Room.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-password'); // Don't return passwords
      
      const total = await Room.countDocuments({});
      
      return {
        rooms,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching rooms:', error);
      throw createError({
        statusCode: 500,
        message: 'Failed to fetch rooms'
      });
    }
  }
  
  // POST - Create new room
  if (method === 'POST') {
    try {
      const userId = getUserFromEvent(event);
      
      if (!userId) {
        throw createError({
          statusCode: 401,
          message: 'Unauthorized'
        });
      }
      
      const body = await readBody(event);
      const { name, description, isPrivate, password, creatorName, color, imageUrl } = body;
      
      if (!name) {
        throw createError({
          statusCode: 400,
          message: 'Room name is required'
        });
      }
      
      // Create new room
      const room = new Room({
        name,
        description,
        createdBy: userId,
        creatorName,
        isPrivate: isPrivate || false,
        password: password || null,
        color: color || '#10b981',
        imageUrl: imageUrl || null,
        members: [{
          userId,
          username: creatorName,
          role: 'admin'
        }]
      });
      
      await room.save();
      
      // Emit socket event for real-time updates
      const socketServer = event.node.req.socket.server?.io;
      if (socketServer) {
        socketServer.emit('room-created', {
          room: {
            _id: room._id,
            name: room.name,
            description: room.description,
            creatorName: room.creatorName,
            isPrivate: room.isPrivate,
            color: room.color,
            imageUrl: room.imageUrl,
            createdAt: room.createdAt,
            updatedAt: room.updatedAt,
            memberCount: 1
          }
        });
      }
      
      return {
        message: 'Room created successfully',
        room
      };
    } catch (error) {
      console.error('Error creating room:', error);
      throw createError({
        statusCode: error.statusCode || 500,
        message: error.message || 'Failed to create room'
      });
    }
  }
  
  // Method not allowed
  throw createError({
    statusCode: 405,
    message: 'Method not allowed'
  });
});