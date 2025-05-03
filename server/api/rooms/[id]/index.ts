import { defineEventHandler, getRouterParam, createError } from 'h3';
import { connectToDatabase } from '~/server/utils/mongodb';
import { Room } from '~/server/models/Room';

export const GET = defineEventHandler(async (event) => {
  try {
    await connectToDatabase();
    
    const id = getRouterParam(event, 'id');
    
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Room ID is required'
      });
    }
    
    const room = await Room.findById(id).select('-password');
    
    if (!room) {
      throw createError({
        statusCode: 404,
        message: 'Room not found'
      });
    }
    
    return room;
  } catch (error) {
    console.error('Error fetching room:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to fetch room'
    });
  }
});