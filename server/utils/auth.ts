import jwt from 'jsonwebtoken';
import { H3Event } from 'h3';

// Get JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key-change-this';

// Generate JWT token
export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: '7d' // Token expires in 7 days
  });
}

// Verify JWT token
export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch (error) {
    return null;
  }
}

// Get user ID from request
export function getUserFromEvent(event: H3Event): string | null {
  try {
    // Get authorization header
    const authHeader = getRequestHeader(event, 'authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    
    return payload?.userId || null;
  } catch (error) {
    return null;
  }
}

// Get request header helper
function getRequestHeader(event: H3Event, name: string): string | undefined {
  const headers = event.node.req.headers;
  const header = headers[name.toLowerCase()];
  
  return Array.isArray(header) ? header[0] : header;
}