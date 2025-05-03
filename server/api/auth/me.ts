import { defineEventHandler, createError } from 'h3';
import { connectToDatabase } from '~/server/utils/mongodb';
import { User } from '~/server/models/User';
import { getUserFromEvent } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
  try {
    await connectToDatabase();
    
    // Get user ID from token
    const userId = getUserFromEvent(event);
    
    if (!userId) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized'
      });
    }
    
    // Find user by ID
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      throw createError({
        statusCode: 404,
        message: 'User not found'
      });
    }
    
    // Return user data
    return {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImage: user.profileImage,
        createdAt: user.createdAt
      }
    };
  } catch (error) {
    console.error('Get user error:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to get user'
    });
  }
});