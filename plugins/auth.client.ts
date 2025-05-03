import { defineNuxtPlugin, useNuxtApp } from '#app';
import { useAuth } from '~/composables/useAuth';

export default defineNuxtPlugin(() => {
  const { vueApp } = useNuxtApp();
  const { fetchCurrentUser } = useAuth();

  // Initialize auth state on client-side only
  if (process.client) {
    // Try to fetch current user if authenticated
    try {
      fetchCurrentUser().catch(err => {
        console.error('Failed to fetch current user:', err);
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
    }
  }
});