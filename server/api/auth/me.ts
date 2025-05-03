import jwt from 'jsonwebtoken';
import { connectToDatabase } from '~/server/utils/mongodb';
import { User } from '~/server/models/User';
import { defineEventHandler, getHeader, createError } from 'h3';

export default defineEventHandler(async (event) => {
  try {
    // Get authorization header
    const authHeader = getHeader(event, 'authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createError({
        statusCode: 401,
        message: 'Unauthorized: No token provided'
      });
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return createError({
        statusCode: 401,
        message: 'Unauthorized: Invalid token format'
      });
    }
    
    // Verify token
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      console.error('Token verification error:', error);
      return createError({
        statusCode: 401,
        message: 'Unauthorized: Invalid token'
      });
    }
    
    // Connect to database
    await connectToDatabase();
    
    // Find user
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return createError({
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
    console.error('Error in /api/auth/me:', error);
    return createError({
      statusCode: 500,
      message: 'Server error: ' + (error.message || 'Unknown error')
    });
  }
});