<template>
  <div class="relative w-full h-full">
    <div 
      v-for="cursor in cursors" 
      :key="cursor.id"
      class="absolute pointer-events-none z-50"
      :style="{ left: `${cursor.x}px`, top: `${cursor.y}px` }"
    >
      <div class="flex flex-col items-start">
        <svg height="24" width="24" viewBox="0 0 24 24" class="fill-none">
          <path
            d="M5.75 1.5L16.72 12.47C16.83 12.59 16.9 12.73 16.93 12.89C16.96 13.05 16.94 13.21 16.88 13.36C16.82 13.51 16.72 13.64 16.59 13.73C16.46 13.83 16.31 13.88 16.15 13.89L12.77 14.09L15.18 21.1C15.23 21.25 15.24 21.41 15.2 21.56C15.17 21.71 15.09 21.85 14.98 21.96C14.86 22.07 14.72 22.15 14.56 22.19C14.4 22.22 14.24 22.21 14.09 22.15L9.86 20.4L7.65 23.47C7.55 23.6 7.43 23.71 7.28 23.77C7.13 23.84 6.97 23.87 6.81 23.85C6.65 23.83 6.5 23.77 6.37 23.67C6.24 23.57 6.14 23.44 6.08 23.29L1.5 5.72C1.45 5.57 1.44 5.4 1.48 5.24C1.52 5.08 1.6 4.94 1.71 4.83C1.83 4.71 1.97 4.63 2.13 4.59C2.29 4.55 2.45 4.56 2.6 4.62L5.75 1.5Z"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <span 
          class="text-xs px-2 py-1 rounded-md text-white"
          :style="{ backgroundColor: cursor.color }"
        >
          {{ cursor.username }}
        </span>
      </div>
    </div>
    <slot></slot>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { io } from 'socket.io-client';

const props = defineProps({
  username: {
    type: String,
    default: 'Anonymous'
  },
  roomId: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['socket-ready', 'user-joined', 'user-left', 'new-message', 'chat-history']);

const socket = ref(null);
const cursors = ref({});
const colors = ['#FF5733', '#33FF57', '#3357FF', '#F033FF', '#FF33A8'];
const userColor = colors[Math.floor(Math.random() * colors.length)];
const isConnected = ref(false);

const initializeSocket = () => {
  try {
    // Connect to the standalone Socket.io server
    socket.value = io('https://socket-server-rix7.onrender.com', {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling']
    });
    
    // Handle connection events
    socket.value.on('connect', () => {
      console.log('Socket connected:', socket.value.id);
      isConnected.value = true;
      
      // Join room
      socket.value.emit('join-room', {
        roomId: props.roomId,
        username: props.username,
        color: userColor
      });
      
      // Emit socket-ready event to parent component
      emit('socket-ready', socket.value);
    });
    
    // Listen for cursor updates
    socket.value.on('cursor-update', (data) => {
      cursors.value = data.cursors;
    });
    
    // Listen for user joined events
    socket.value.on('user-joined', (data) => {
      emit('user-joined', data);
    });
    
    // Listen for user left events
    socket.value.on('user-left', (data) => {
      emit('user-left', data);
    });
    
    // Listen for new messages
    socket.value.on('new-message', (data) => {
      emit('new-message', data);
    });
    
    // Listen for chat history
    socket.value.on('chat-history', (data) => {
      emit('chat-history', data);
    });
    
    socket.value.on('disconnect', () => {
      console.log('Socket disconnected');
      isConnected.value = false;
    });
    
    socket.value.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      isConnected.value = false;
    });
  } catch (error) {
    console.error('Error initializing Socket.io:', error);
  }
};

onMounted(() => {
  initializeSocket();
  
  // Track mouse movement
  window.addEventListener('mousemove', handleMouseMove);
});

onUnmounted(() => {
  if (socket.value) {
    socket.value.disconnect();
  }
  window.removeEventListener('mousemove', handleMouseMove);
});

// Watch for roomId changes to rejoin the room
watch(() => props.roomId, (newRoomId, oldRoomId) => {
  if (socket.value && isConnected.value && newRoomId !== oldRoomId) {
    // Join new room
    socket.value.emit('join-room', {
      roomId: newRoomId,
      username: props.username,
      color: userColor
    });
  }
});

// Watch for username changes
watch(() => props.username, (newUsername, oldUsername) => {
  if (socket.value && isConnected.value && newUsername !== oldUsername) {
    // Rejoin room with new username
    socket.value.emit('join-room', {
      roomId: props.roomId,
      username: newUsername,
      color: userColor
    });
  }
});

const handleMouseMove = (e) => {
  if (socket.value && isConnected.value) {
    socket.value.emit('cursor-move', {
      roomId: props.roomId,
      x: e.clientX,
      y: e.clientY
    });
  }
};

// Expose socket to parent component
defineExpose({
  socket
});
</script>