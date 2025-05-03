import { defineNuxtPlugin } from '#app';
import { useAuth } from '~/composables/useAuth';

export default defineNuxtPlugin(async () => {
  const auth = useAuth();

  // Only run on client-side
  if (process.client) {
    
    // Check if we have a token but no user data
    if (auth.token.value && !auth.user.value) {
      console.log('Auth plugin: Token found but no user data, fetching user...');
      try {
        await auth.fetchCurrentUser();
        console.log('Auth plugin: User data fetched successfully');
      } catch (error) {
        console.error('Auth plugin: Failed to fetch user data:', error);
      }
    } else if (auth.token.value && auth.user.value) {
      console.log('Auth plugin: User already authenticated');
    } else {
      console.log('Auth plugin: No authentication data found');
    }
  }
});