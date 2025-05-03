import mongoose from 'mongoose';
import { useRuntimeConfig } from '#imports';

let cachedConnection: typeof mongoose | null = null;

const config = useRuntimeConfig();
const mongodbUri = config.mongodbUri;

export async function connectToDatabase() {
  if (cachedConnection) {
    return cachedConnection;
  }

  if (!mongodbUri) {
    throw new Error('MONGODB_URI environment variable is not defined');
  }

  try {
    const connection = await mongoose.connect(mongodbUri);
    console.log('Connected to MongoDB');
    cachedConnection = connection;
    return connection;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}