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
        
        <LiveCursor v-if="inRoom" :username="username" :roomId="roomId">
          <div class="bg-white rounded-lg shadow-md overflow-hidden flex-1 flex flex-col">
            <div class="p-4 border-b">
              <h2 class="text-lg font-semibold">Chat Room: {{ roomId }}</h2>
            </div>
            
            <div class="flex-1 p-4 overflow-y-auto" ref="chatMessagesRef">
              <div v-for="(message, index) in messages" :key="index" class="mb-4">
                <div class="flex items-start gap-3">
                  <div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    {{ message.username.charAt(0).toUpperCase() }}
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <span class="font-medium">{{ message.username }}</span>
                      <span class="text-xs text-gray-500">{{ formatTime(message.timestamp) }}</span>
                    </div>
                    <div class="mt-1 p-3 bg-gray-100 rounded-lg" v-html="message.content"></div>
                    
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
                        @translated="handleTranslated($event, index)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="p-4 border-t">
              <RichTextEditor v-model="currentMessage" />
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
  import { ref, onMounted, watch } from 'vue';
  import LiveCursor from '~/components/LiveCursor.vue';
  import RichTextEditor from '~/components/RichTextEditor.vue';
  import TranslationService from '~/components/TranslationService.vue';
  
  const username = ref('User' + Math.floor(Math.random() * 1000));
  const roomId = ref('room-' + Math.floor(Math.random() * 1000));
  const inRoom = ref(false);
  const currentMessage = ref('');
  const messages = ref([]);
  const chatMessagesRef = ref(null);
  
  const joinRoom = () => {
    if (username.value.trim() && roomId.value.trim()) {
      inRoom.value = true;
    }
  };
  
  const sendMessage = () => {
    if (!currentMessage.value.trim() || !inRoom.value) return;
    
    // In a real app, you would emit this to the socket server
    messages.value.push({
      username: username.value,
      content: currentMessage.value,
      timestamp: new Date(),
      showTranslation: false,
      isTranslating: false
    });
    
    currentMessage.value = '';
    
    // Scroll to bottom
    setTimeout(() => {
      if (chatMessagesRef.value) {
        chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight;
      }
    }, 100);
  };
  
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const handleTranslated = (translationData, messageIndex) => {
    if (messages.value[messageIndex]) {
      messages.value[messageIndex].translatedContent = translationData.translatedText;
      messages.value[messageIndex].translatedLanguage = translationData.language;
    }
  };
  
  // For demo purposes, add some sample messages
  onMounted(() => {
    // Sample messages would be added here in a real application
  });
  
  // Watch for changes in the messages array to scroll to bottom
  watch(messages, () => {
    setTimeout(() => {
      if (chatMessagesRef.value) {
        chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight;
      }
    }, 100);
  }, { deep: true });
  </script>