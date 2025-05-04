<template>
  <div class="rooms-list">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">Chat Rooms</h2>
      
      <!-- Create Room Button - Only visible when authenticated -->
      <button 
        v-if="auth.isAuthenticated.value"
        @click="$emit('create-room')" 
        class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-primary-700 transition-colors cursor-pointer"
      >
        Create Room
      </button>
      <!-- Sign in prompt for unauthenticated users -->
      <!-- <button 
        v-else
        @click="$emit('show-auth')" 
        class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
      >
        Sign in to create
      </button> -->
      <p v-else ></p>
    </div>
    
    <div v-if="isLoading" class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
    </div>
    
    <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
      <p>{{ error }}</p>
      <button 
        @click="fetchRooms" 
        class="text-sm text-red-700 underline mt-2"
      >
        Try again
      </button>
    </div>
    
    <div v-else-if="rooms.length === 0" class="text-center py-8">
      <p class="text-gray-600 mb-4">No rooms available. Create one to get started!</p>
      
      <!-- Create Room Button when no rooms exist -->
      <button 
        v-if="auth.isAuthenticated.value"
        @click="$emit('create-room')" 
        class="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
      >
        Create New Room
      </button>
      
      <p v-else class="text-sm text-gray-500 mt-4">
        Sign in to create a room
      </p>
    </div>
    
    <div v-else class="grid gap-4 md:grid-cols-2">
      <div 
        v-for="room in rooms" 
        :key="room._id" 
        class="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer relative"
        @click="handleRoomClick(room)"
      >
        <!-- Lock icon for unauthenticated users -->
        <div 
          v-if="!auth.isAuthenticated.value" 
          class="absolute top-2 right-2 text-gray-400"
          title="Sign in to join"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        
        <div class="flex items-center gap-3">
          <div 
            class="w-10 h-10 rounded-md flex items-center justify-center text-white"
            :style="{ backgroundColor: room.color || '#10b981' }"
          >
            {{ room.name.charAt(0).toUpperCase() }}
          </div>
          
          <div class="flex-1">
            <h3 class="font-medium">{{ room.name }}</h3>
            <p class="text-sm text-gray-500 truncate">
              {{ room.description || 'No description' }}
            </p>
          </div>
          
          <div v-if="room.isPrivate" class="text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>
        
        <div class="flex justify-between items-center mt-3 text-xs text-gray-500">
          <span>Created by {{ room.creatorName || 'Anonymous' }}</span>
          <span>{{ formatDate(room.createdAt) }}</span>
        </div>
        
        <!-- Sign in prompt for unauthenticated users -->
        <div 
          v-if="!auth.isAuthenticated.value" 
          class="mt-3 pt-3 border-t border-gray-100 text-center"
        >
          <span class="text-sm text-primary-600">Sign in to join this room</span>
        </div>
      </div>
    </div>
    
    <div v-if="rooms.length > 0 && !isLoading" class="mt-4 flex justify-center">
      <button 
        v-if="hasMoreRooms" 
        @click="loadMoreRooms" 
        class="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors text-sm"
        :disabled="isLoadingMore"
      >
        <span v-if="isLoadingMore">Loading...</span>
        <span v-else>Load More</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useAuth } from '~/composables/useAuth';

const props = defineProps({
  socketInstance: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['select-room', 'create-room', 'show-auth']);

const auth = useAuth();

const rooms = ref([]);
const isLoading = ref(true);
const isLoadingMore = ref(false);
const error = ref(null);
const page = ref(1);
const limit = ref(10);
const hasMoreRooms = ref(false);
const total = ref(0);

// Listen for socket events
const roomCreated = ref(false);
const roomUpdated = ref(false);
const roomDeleted = ref(false);

// Handle room click - check authentication first
const handleRoomClick = (room) => {
  if (!auth.isAuthenticated.value) {
    // Emit event to show auth modal
    emit('show-auth', room);
  } else {
    // User is authenticated, proceed to select room
    emit('select-room', room);
  }
};

// Fetch rooms from API
const fetchRooms = async (loadMore = false) => {
  if (loadMore) {
    isLoadingMore.value = true;
  } else {
    isLoading.value = true;
  }
  
  error.value = null;
  
  try {
    const response = await fetch(`/api/rooms?page=${page.value}&limit=${limit.value}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch rooms');
    }
    
    const data = await response.json();
    
    if (loadMore) {
      rooms.value = [...rooms.value, ...data.rooms];
    } else {
      rooms.value = data.rooms;
    }
    
    total.value = data.pagination.total;
    hasMoreRooms.value = page.value < data.pagination.pages;
  } catch (err) {
    console.error('Error fetching rooms:', err);
    error.value = err.message || 'Failed to fetch rooms';
  } finally {
    isLoading.value = false;
    isLoadingMore.value = false;
  }
};

// Load more rooms
const loadMoreRooms = () => {
  page.value++;
  fetchRooms(true);
};

// Format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

// Listen for socket events
const setupSocketListeners = () => {
  if (!props.socketInstance) return;
  
  // Listen for room created event
  props.socketInstance.on('room-created', (data) => {
    rooms.value.unshift(data.room);
    total.value++;
    roomCreated.value = !roomCreated.value;
  });
  
  // Listen for room updated event
  props.socketInstance.on('room-updated', (data) => {
    const index = rooms.value.findIndex(room => room._id === data.room._id);
    if (index !== -1) {
      rooms.value[index] = data.room;
      roomUpdated.value = !roomUpdated.value;
    }
  });
  
  // Listen for room deleted event
  props.socketInstance.on('room-deleted', (data) => {
    const index = rooms.value.findIndex(room => room._id === data.roomId);
    if (index !== -1) {
      rooms.value.splice(index, 1);
      total.value--;
      roomDeleted.value = !roomDeleted.value;
    }
  });
};

// Watch for socket instance changes
watch(() => props.socketInstance, (newSocket) => {
  if (newSocket) {
    setupSocketListeners();
  }
});

// Initialize
onMounted(() => {
  fetchRooms();
  
  if (props.socketInstance) {
    setupSocketListeners();
  }
});
</script>