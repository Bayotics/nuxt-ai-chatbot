<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <!-- Header -->
    <header class="bg-white shadow-sm p-4">
      <div class="container mx-auto flex justify-between items-center">
        <h1 class="text-2xl font-bold text-primary-600">Created by Abdullahi Sho</h1>
        
        <div class="flex items-center space-x-2">
          <button 
            v-if="auth.isAuthenticated.value"
            @click="showCreateRoomModal = true" 
            class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            Create Room
          </button>
          
          <button 
            @click="showAuthModal = !showAuthModal" 
            class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
          >
            {{ auth.isAuthenticated.value ? 'Account' : 'Sign In' }}
          </button>
        </div>
      </div>
    </header>
    
    <main class="flex-1 container mx-auto p-4 flex flex-col">
      <!-- Room List Section -->
      <div v-if="!inRoom" class="mb-8">
        <RoomsList 
          :socketInstance="socketInstance" 
          @select-room="selectRoom"
          @create-room="showCreateRoomModal = true"
          @show-auth="handleShowAuth"
        />
      </div>
      
      <!-- Chat Room Section -->
      <LiveCursor 
        v-if="inRoom" 
        :username="username" 
        :roomId="roomId"
        @socket-ready="handleSocketReady"
        @user-joined="handleUserJoined"
        @user-left="handleUserLeft"
        @new-message="handleNewMessage"
        @chat-history="handleChatHistory"
        ref="liveCursorRef"
      >
        <div class="bg-white rounded-lg shadow-md overflow-hidden flex-1 flex flex-col">
          <div class="p-4 border-b flex justify-between items-center">
            <div>
              <h2 class="text-lg font-semibold">Chat Room: {{ selectedRoom?.name || roomId }} 
                <i class="text-xs text-gray-500">Socket server hosted live on render spins down with inactivity.
                   Could take a while to come back up or manually trigger; <a class="text-blue-600 underline" target="_blank" href="https://socket-server-rix7.onrender.com/">here</a></i></h2>
              <div class="text-sm text-gray-500 mt-1">
                <span>{{ Object.keys(activeUsers).length }} users online</span>
              </div>
            </div>
            
            <button 
              @click="leaveRoom" 
              class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
            >
              Leave Room
            </button>
          </div>
          
          <div class="flex-1 p-4 overflow-y-auto" ref="chatMessagesRef">
            <!-- System messages -->
            <div v-for="(notification, index) in systemNotifications" :key="`notification-${index}`" class="mb-4">
              <div class="text-center text-sm text-gray-500 py-1">
                {{ notification.message }}
              </div>
            </div>
            
            <!-- Chat messages -->
            <div v-for="message in messages" :key="message.id" class="mb-4">
              <div class="flex items-start gap-3">
                <div 
                  class="w-8 h-8 rounded-full flex items-center justify-center text-white"
                  :style="{ backgroundColor: getUserColor(message.senderId) }"
                >
                  {{ message.username.charAt(0).toUpperCase() }}
                </div>
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <span class="font-medium">{{ message.username }}</span>
                    <span class="text-xs text-gray-500">{{ formatTime(message.timestamp) }}</span>
                  </div>
                  <div 
                    class="mt-1 p-3 rounded-lg" 
                    :class="message.senderId === socketId ? 'bg-primary-50' : 'bg-gray-100'"
                    v-html="message.content"
                  ></div>
                  
                  <button 
                    v-if="!message.isTranslating && !message.showTranslation" 
                    @click="message.showTranslation = true"
                    class="text-sm text-primary-600 mt-1 hover:underline"
                  >
                    Translate with AI
                  </button>
                  
                  <div v-if="message.showTranslation" class="mt-2">
                    <TranslationService 
                      :text="message.content" 
                      @translated="handleTranslated($event, message.id)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="p-4 border-t">
            <RichTextEditor 
              v-model="currentMessage" 
              @submit="sendMessage"
              ref="editorRef"
            />
            <div class="flex justify-end mt-2">
              <button
                @click="sendMessage"
                class="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                :disabled="!currentMessage.trim()"
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      </LiveCursor>
      
      <div v-else-if="!inRoom && !isLoading" class="flex-1 flex items-center justify-center">
        <div class="text-center">
          <h2 class="text-2xl font-bold text-gray-700 mb-4">Welcome to AI Chatbot</h2>
          <p class="text-gray-600 mb-6">Select a room to join or create your own!</p>
        </div>
      </div>
      
      <div v-else-if="isLoading" class="flex-1 flex items-center justify-center">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    </main>
    
    <!-- Auth Modal -->
    <div v-if="showAuthModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold">
            {{ pendingRoom ? 'Sign in to join room' : 'Account' }}
          </h2>
          <button @click="cancelAuth" class="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <!-- Show room info if trying to join a specific room -->
        <div v-if="pendingRoom" class="mb-4 p-3 bg-gray-50 rounded-md">
          <div class="flex items-center gap-3">
            <div 
              class="w-10 h-10 rounded-md flex items-center justify-center text-white"
              :style="{ backgroundColor: pendingRoom.color || '#10b981' }"
            >
              {{ pendingRoom.name.charAt(0).toUpperCase() }}
            </div>
            <div>
              <h3 class="font-medium">{{ pendingRoom.name }}</h3>
              <p class="text-sm text-gray-500">
                {{ pendingRoom.description || 'No description' }}
              </p>
            </div>
          </div>
        </div>
        
        <AuthSignIn 
          @signed-in="handleSignedIn" 
          @signed-out="handleSignedOut" 
        />
      </div>
    </div>
    
    <!-- Create Room Modal -->
    <div v-if="showCreateRoomModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold">Create New Room</h2>
          <button @click="showCreateRoomModal = false" class="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <CreateRoomForm 
          @created="handleRoomCreated" 
          @cancel="showCreateRoomModal = false" 
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, onUnmounted } from 'vue';
import { useAuth } from '~/composables/useAuth';
import LiveCursor from '~/components/LiveCursor.vue';
import RichTextEditor from '~/components/RichTextEditor.vue';
import TranslationService from '~/components/TranslationService.vue';
import RoomsList from '~/components/RoomsList.vue';
import CreateRoomForm from '~/components/CreateRoomForm.vue';
import AuthSignIn from '~/components/AuthSignIn.vue';
import { io } from 'socket.io-client';

// Use auth composable
const auth = useAuth();

const username = ref('User' + Math.floor(Math.random() * 1000));
const roomId = ref('');
const inRoom = ref(false);
const currentMessage = ref('');
const messages = ref([]);
const chatMessagesRef = ref(null);
const liveCursorRef = ref(null);
const editorRef = ref(null);
const socketInstance = ref(null);
const socketId = ref(null);
const activeUsers = ref({});
const systemNotifications = ref([]);
const isLoading = ref(true);
const showAuthModal = ref(false);
const showCreateRoomModal = ref(false);
const selectedRoom = ref(null);
const pendingRoom = ref(null); // Store room that user wants to join after auth

// Initialize socket connection ref
const socketUrl = process.env.NUXT_ENV_SOCKET_URL || 'https://socket-server-rix7.onrender.com';
const socket = ref(null);

// Initialize isAuthenticated ref to false
const isAuthenticated = ref(false);

// Set username from auth if available
watch(() => auth.user.value, (newUser) => {
  if (newUser) {
    username.value = newUser.firstName || newUser.username || username.value;
  }
}, { immediate: true });

// Watch for authentication state changes
watch(() => auth.isAuthenticated.value, (isAuthenticatedValue) => {
  isAuthenticated.value = isAuthenticatedValue;
  // If user just authenticated and there's a pending room, join it
  if (isAuthenticatedValue && pendingRoom.value) {
    selectRoom(pendingRoom.value);
    pendingRoom.value = null;
  }
});

const selectRoom = (room) => {
  // Check if user is authenticated
  if (!isAuthenticated.value) {
    // Store the room to join after authentication
    pendingRoom.value = room;
    showAuthModal.value = true;
    return;
  }
  
  selectedRoom.value = room;
  roomId.value = room._id;
  inRoom.value = true;
};

const leaveRoom = () => {
  inRoom.value = false;
  roomId.value = '';
  selectedRoom.value = null;
  messages.value = [];
  systemNotifications.value = [];
  activeUsers.value = {};
};

// Handle showing auth modal when trying to join a room
const handleShowAuth = (room) => {
  pendingRoom.value = room;
  showAuthModal.value = true;
};

// Cancel auth and clear pending room
const cancelAuth = () => {
  showAuthModal.value = false;
  pendingRoom.value = null;
};

const handleSocketReady = (socket) => {
  socketInstance.value = socket;
  socketId.value = socket.id;
  
  // Add current user to active users
  activeUsers.value[socket.id] = {
    username: username.value,
    joinedAt: new Date()
  };
  
  isLoading.value = false;
};

const handleUserJoined = (data) => {
  // Add user to active users
  activeUsers.value[data.id] = {
    username: data.username,
    joinedAt: new Date(data.timestamp)
  };
  
  // Add system notification
  systemNotifications.value.push({
    type: 'join',
    message: `${data.username} joined the room`,
    timestamp: new Date(data.timestamp)
  });
  
  scrollToBottom();
};

const handleUserLeft = (data) => {
  // Remove user from active users
  if (activeUsers.value[data.id]) {
    delete activeUsers.value[data.id];
  }
  
  // Add system notification
  systemNotifications.value.push({
    type: 'leave',
    message: `${data.username} left the room`,
    timestamp: new Date(data.timestamp)
  });
  
  scrollToBottom();
};

const handleNewMessage = (messageData) => {
  // Add message to messages array
  const message = {
    ...messageData,
    timestamp: new Date(messageData.timestamp),
    showTranslation: false,
    isTranslating: false
  };
  
  messages.value.push(message);
  scrollToBottom();
};

const handleChatHistory = (data) => {
  // Process chat history
  const processedMessages = data.messages.map(msg => ({
    ...msg,
    timestamp: new Date(msg.timestamp),
    showTranslation: false,
    isTranslating: false
  }));
  
  messages.value = processedMessages;
  scrollToBottom();
};

const sendMessage = () => {
  if (!currentMessage.value.trim() || !inRoom.value || !socketInstance.value) return;
  
  // Emit message to server
  socketInstance.value.emit('send-message', {
    roomId: roomId.value,
    message: currentMessage.value,
    username: username.value
  });
  
  // Clear input
  currentMessage.value = '';
  
  // Focus editor
  if (editorRef.value) {
    editorRef.value.focus();
  }
};

const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const handleTranslated = (translationData, messageId) => {
  const messageIndex = messages.value.findIndex(msg => msg.id === messageId);
  if (messageIndex !== -1) {
    messages.value[messageIndex].translatedContent = translationData.translatedText;
    messages.value[messageIndex].translatedLanguage = translationData.language;
  }
};

const scrollToBottom = () => {
  nextTick(() => {
    if (chatMessagesRef.value) {
      chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight;
    }
  });
};

const getUserColor = (userId) => {
  // Generate a consistent color based on user ID
  const colors = [
    '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
    '#ef4444', '#6366f1', '#14b8a6', '#f97316', '#84cc16'
  ];
  
  if (!userId) return colors[0];
  
  // Simple hash function to get a consistent index
  const hash = userId.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  
  return colors[hash % colors.length];
};

const handleSignedIn = () => {
  showAuthModal.value = false;
  
  // Update username if available
  if (auth.user.value) {
    username.value = auth.user.value.firstName || auth.user.value.username || username.value;
  }
  
  // If there's a pending room, join it
  if (pendingRoom.value) {
    selectRoom(pendingRoom.value);
    pendingRoom.value = null;
  }
};

const handleSignedOut = () => {
  showAuthModal.value = false;
  pendingRoom.value = null;
  
  // If in a room, leave it
  if (inRoom.value) {
    leaveRoom();
  }
};

const handleRoomCreated = (room) => {
  showCreateRoomModal.value = false;
  selectRoom(room);
};

// Initialize socket connection
onMounted(() => {
  // Initialize socket connection
  console.log('Connecting to socket server at:', socketUrl);
  
  try {
    socket.value = io(socketUrl);
      
    socket.value.on('connect', () => {
      console.log('Connected to socket server with ID:', socket.value.id);
      isLoading.value = false;
    });
    
    socket.value.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      isLoading.value = false;
    });

    socketInstance.value = socket.value;
  } catch (error) {
    console.error('Failed to initialize socket connection:', error);
    isLoading.value = false;
  }
});

// Clean up when component is unmounted
onUnmounted(() => {
  if (socket.value) {
    socket.value.disconnect();
  }
});
</script>

<style>
/* Global styles */
body {
  font-family: 'Inter', sans-serif;
  color: #333;
  background-color: #f9fafb;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

/* Primary color variables */
:root {
  --primary-50: #ecfdf5;
  --primary-100: #d1fae5;
  --primary-200: #a7f3d0;
  --primary-300: #6ee7b7;
  --primary-400: #34d399;
  --primary-500: #10b981;
  --primary-600: #059669;
  --primary-700: #047857;
  --primary-800: #065f46;
  --primary-900: #064e3b;
}
</style>