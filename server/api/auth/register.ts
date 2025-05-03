import { defineEventHandler, readBody, createError } from 'h3';
import { connectToDatabase } from '~/server/utils/mongodb';
import { User } from '~/server/models/User';
import { generateToken } from '~/server/utils/auth';

export default defineEventHandler(async (event) => {
  try {
    await connectToDatabase();
    
    const body = await readBody(event);
    const { username, email, password, firstName, lastName } = body;
    
    // Validate input
    if (!username || !email || !password) {
      throw createError({
        statusCode: 400,
        message: 'Username, email, and password are required'
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });
    
    if (existingUser) {
      throw createError({
        statusCode: 400,
        message: 'User with this email or username already exists'
      });
    }
    
    // Create new user
    const user = new User({
      username,
      email,
      password,
      firstName: firstName || '',
      lastName: lastName || ''
    });
    
    await user.save();
    
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
    console.error('Registration error:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to register user'
    });
  }
});