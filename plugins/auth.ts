import { defineNuxtPlugin } from '#app';
import { useAuth } from '~/composables/useAuth';

export default defineNuxtPlugin(async (nuxtApp) => {
  const { initAuth, fetchCurrentUser } = useAuth();

  
  // Initialize auth from localStorage
  initAuth();
  
  // Try to fetch current user if token exists
  try {
    await fetchCurrentUser();
  } catch (error) {
    console.error('Failed to fetch current user:', error);
  }
});