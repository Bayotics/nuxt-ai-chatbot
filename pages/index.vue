<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <header class="bg-white shadow-sm p-4">
      <div class="container mx-auto">
        <h1 class="text-2xl font-bold text-emerald-600">AI Chatbot with Live Cursors</h1>
      </div>
    </header>
    
    <main class="flex-1 container mx-auto p-4 flex flex-col">
      <div class="mb-4 flex items-center gap-4">
        <div class="flex-1">
          <label for="username" class="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
          <input
            id="username"
            v-model="username"
            type="text"
            class="w-full px-4 py-2 border rounded-md"
            placeholder="Enter your name"
          />
        </div>
        
        <div class="flex-1">
          <label for="room" class="block text-sm font-medium text-gray-700 mb-1">Room ID</label>
          <input
            id="room"
            v-model="roomId"
            type="text"
            class="w-full px-4 py-2 border rounded-md"
            placeholder="Enter room ID"
          />
        </div>
        
        <button
          @click="joinRoom"
          class="mt-6 px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
        >
          {{ inRoom ? 'Change Room' : 'Join Room' }}
        </button>
      </div>
      
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
          <div class="p-4 border-b">
            <h2 class="text-lg font-semibold">Chat Room: {{ roomId }}</h2>
            <div class="text-sm text-gray-500 mt-1">
              <span>{{ Object.keys(activeUsers).length }} users online</span>
            </div>
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
                    :class="message.senderId === socketId ? 'bg-emerald-50' : 'bg-gray-100'"
                    v-html="message.content"
                  ></div>
                  
                  <button 
                    v-if="!message.isTranslating && !message.showTranslation" 
                    @click="message.showTranslation = true"
                    class="text-sm text-emerald-600 mt-1 hover:underline"
                  >
                    Translate
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
            />
            <div class="flex justify-end mt-2">
              <button
                @click="sendMessage"
                class="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                :disabled="!currentMessage.trim()"
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      </LiveCursor>
      
      <div v-else class="flex-1 flex items-center justify-center">
        <div class="text-center">
          <h2 class="text-2xl font-bold text-gray-700 mb-4">Welcome to AI Chatbot</h2>
          <p class="text-gray-600 mb-6">Enter your name and a room ID to start chatting</p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, onUnmounted } from 'vue';
import LiveCursor from '~/components/LiveCursor.vue';
import RichTextEditor from '~/components/RichTextEditor.vue';
import TranslationService from '~/components/TranslationService.vue';

const username = ref('User' + Math.floor(Math.random() * 1000));
const roomId = ref('room-' + Math.floor(Math.random() * 1000));
const inRoom = ref(false);
const currentMessage = ref('');
const messages = ref([]);
const chatMessagesRef = ref(null);
const liveCursorRef = ref(null);
const socketInstance = ref(null);
const socketId = ref(null);
const activeUsers = ref({});
const systemNotifications = ref([]);

const joinRoom = () => {
  if (username.value.trim() && roomId.value.trim()) {
    inRoom.value = true;
  }
};

const handleSocketReady = (socket) => {
  socketInstance.value = socket;
  socketId.value = socket.id;
  
  // Add current user to active users
  activeUsers.value[socket.id] = {
    username: username.value,
    joinedAt: new Date()
  };
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
    '#FF5733', '#33FF57', '#3357FF', '#F033FF', '#FF33A8',
    '#33FFF5', '#FF9933', '#9933FF', '#FF3366', '#33FF99'
  ];
  
  // Simple hash function to get a consistent index
  const hash = userId.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  
  return colors[hash % colors.length];
};

// Watch for changes in the messages array to scroll to bottom
watch(messages, () => {
  scrollToBottom();
}, { deep: true });

// Clean up when component is unmounted
onUnmounted(() => {
  if (socketInstance.value) {
    socketInstance.value.disconnect();
  }
});
</script>