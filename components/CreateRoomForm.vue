<template>
    <div class="create-room-form overflow-auto">
      <h2 class="text-xl font-bold mb-4">Create New Room</h2>
      
      <form @submit.prevent="createRoom" class="space-y-4">
        <div>
          <label for="room-name" class="block text-sm font-medium text-gray-700 mb-1">
            Room Name*
          </label>
          <input
            id="room-name"
            v-model="formData.name"
            type="text"
            class="w-full px-4 py-2 border rounded-md"
            placeholder="Enter room name"
            required
          />
        </div>
        
        <div>
          <label for="room-description" class="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="room-description"
            v-model="formData.description"
            class="w-full px-4 py-2 border rounded-md"
            placeholder="Enter room description"
            rows="3"
          ></textarea>
        </div>
        
        <div>
          <label for="room-color" class="block text-sm font-medium text-gray-700 mb-1">
            Room Color
          </label>
          <div class="flex space-x-2">
            <div 
              v-for="color in colors" 
              :key="color"
              class="w-8 h-8 rounded-full cursor-pointer"
              :style="{ backgroundColor: color }"
              :class="{ 'ring-2 ring-offset-2 ring-gray-400': formData.color === color }"
              @click="formData.color = color"
            ></div>
          </div>
        </div>
        
        <div class="flex items-center">
          <input
            id="room-private"
            v-model="formData.isPrivate"
            type="checkbox"
            class="h-4 w-4 text-primary-600 border-gray-300 rounded"
          />
          <label for="room-private" class="ml-2 block text-sm text-gray-700">
            Private Room
          </label>
        </div>
        
        <div v-if="formData.isPrivate">
          <label for="room-password" class="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="room-password"
            v-model="formData.password"
            type="password"
            class="w-full px-4 py-2 border rounded-md"
            placeholder="Enter room password"
          />
        </div>
        
        <div class="flex justify-end space-x-2">
          <button
            type="button"
            @click="$emit('cancel')"
            class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            class="px-6 py-2 bg-gray-600 text-gray-100 hover:bg-primary-700 rounded-md transition-colors cursor-pointer"
            :disabled="isSubmitting"
          >
            <span v-if="isSubmitting">Creating...</span>
            <span v-else>Create Room</span>
          </button>
        </div>
      </form>
    </div>
  </template>
  
  <script setup>
  import { ref, watch } from 'vue';
  import { useAuth } from '~/composables/useAuth';
  
  const emit = defineEmits(['created', 'cancel']);
  
  const auth = useAuth();
  
  const isSubmitting = ref(false);
  const formData = ref({
    name: '',
    description: '',
    isPrivate: false,
    password: '',
    color: '#10b981', // Default emerald color
    imageUrl: null
  });
  
  const colors = [
    '#10b981', // emerald
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#f59e0b', // amber
    '#ef4444', // red
    '#6366f1', // indigo
    '#14b8a6', // teal
    '#f97316', // orange
    '#84cc16'  // lime
  ];
  
  // Use a separate ref to track whether the password field should be shown
  const showPassword = ref(false);
  
  // Use a watch to update the showPassword ref based on formData.isPrivate
  watch(() => formData.isPrivate, (newValue) => {
    showPassword.value = newValue;
  });
  
  const createRoom = async () => {
    if (!auth.isAuthenticated.value) {
      alert('You must be signed in to create a room');
      return;
    }
    
    try {
      isSubmitting.value = true;
      
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token.value}`
        },
        body: JSON.stringify({
          ...formData.value,
          creatorName: auth.user.value?.firstName || auth.user.value?.username || 'Anonymous'
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create room');
      }
      
      const data = await response.json();
      emit('created', data.room);
      
      // Reset form
      formData.value = {
        name: '',
        description: '',
        isPrivate: false,
        password: '',
        color: '#10b981',
        imageUrl: null
      };
    } catch (error) {
      console.error('Error creating room:', error);
      alert(error.message || 'Failed to create room');
    } finally {
      isSubmitting.value = false;
    }
  };
  </script>