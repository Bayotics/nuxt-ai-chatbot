import { defineEventHandler, readBody, createError } from 'h3';
import { connectToDatabase } from '~/server/utils/mongodb';
import { User } from '~/server/models/User';
import { generateToken } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
  try {
    await connectToDatabase();
    
    const body = await readBody(event);
    const { username, password } = body;
    
    // Validate input
    if (!username || !password) {
      throw createError({
        statusCode: 400,
        message: 'Username and password are required'
      });
    }
    
    // Find user by username or email
    const user = await User.findOne({
      $or: [
        { username },
        { email: username } // Allow login with email as well
      ]
    });
    
    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid credentials'
      });
    }
    
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      throw createError({
        statusCode: 401,
        message: 'Invalid credentials'
      });
    }
    
    // Generate JWT token
    const token = generateToken(user._id.toString());
    
    // Return user data and token
    return {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImage: user.profileImage,
        createdAt: user.createdAt
      },
      token
    };
  } catch (error) {
    console.error('Login error:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to login'
    });
  }
});