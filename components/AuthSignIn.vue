<template>
  <div class="auth-container">
    <div v-if="localLoading" class="flex justify-center items-center h-40">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
    </div>
    
    <div v-else-if="auth.isAuthenticated.value" class="text-center">
      <div class="flex items-center justify-center mb-4">
        <div 
          class="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center"
          :style="{ backgroundColor: getUserColor(auth.user?.value.id) }"
        >
          <span class="text-xl font-bold text-white">
            {{ auth.user?.value.firstName?.charAt(0).toUpperCase() || auth.user?.value.username?.charAt(0) || 'U' }}
          </span>
        </div>
      </div>
      
      <h2 class="text-xl font-bold mb-2">
        Welcome, {{ auth.user?.value.firstName || auth.user?.value.username || 'User' }}!
      </h2>
      
      <div class="text-sm text-gray-600 mb-4">
        <p>{{ auth.user?.email }}</p>
        <p>Account created: {{ formatDate(auth.user?.value.createdAt) }}</p>
      </div>
      
      <div class="flex justify-center space-x-2 mt-4">
        <button 
          @click="handleSignOut" 
          class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
    
    <div v-else>
      <div v-if="showRegister" class="register-form">
        <h2 class="text-xl font-bold mb-4">Create Account</h2>
        
        <form @submit.prevent="handleRegister" class="space-y-4">
          <div>
            <label for="username" class="block text-sm font-medium text-gray-700 mb-1">
              Username*
            </label>
            <input
              id="username"
              v-model="registerForm.username"
              type="text"
              class="w-full px-4 py-2 border rounded-md"
              placeholder="Enter username"
              required
            />
          </div>
          
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
              Email*
            </label>
            <input
              id="email"
              v-model="registerForm.email"
              type="email"
              class="w-full px-4 py-2 border rounded-md"
              placeholder="Enter email"
              required
            />
          </div>
          
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
              Password*
            </label>
            <input
              id="password"
              v-model="registerForm.password"
              type="password"
              class="w-full px-4 py-2 border rounded-md"
              placeholder="Enter password"
              required
            />
          </div>
          
          <div class="flex gap-4">
            <div class="flex-1">
              <label for="firstName" class="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                id="firstName"
                v-model="registerForm.firstName"
                type="text"
                class="w-full px-4 py-2 border rounded-md"
                placeholder="First name"
              />
            </div>
            
            <div class="flex-1">
              <label for="lastName" class="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                id="lastName"
                v-model="registerForm.lastName"
                type="text"
                class="w-full px-4 py-2 border rounded-md"
                placeholder="Last name"
              />
            </div>
          </div>
          
          <div v-if="auth.error" class="text-red-500 text-sm">
            {{ auth.error }}
          </div>
          
          <div class="flex justify-between">
            <button
              type="button"
              @click="showRegister = false"
              class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
            >
              Back to Login
            </button>
            
            <button
              type="submit"
              class="px-6 py-2 bg-primary-600 text-gray-400 hover:bg-primary-700 rounded-md transition-colors"
              :disabled="localLoading"
            >
              <span v-if="localLoading">Creating...</span>
              <span v-else>Create Account</span>
            </button>
          </div>
        </form>
      </div>
      
      <div v-else class="login-form">
        <h2 class="text-xl font-bold mb-4">Sign In</h2>
        
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label for="login-username" class="block text-sm font-medium text-gray-700 mb-1">
              Username or Email
            </label>
            <input
              id="login-username"
              v-model="loginForm.username"
              type="text"
              class="w-full px-4 py-2 border rounded-md"
              placeholder="Enter username or email"
              required
            />
          </div>
          
          <div>
            <label for="login-password" class="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="login-password"
              v-model="loginForm.password"
              type="password"
              class="w-full px-4 py-2 border rounded-md"
              placeholder="Enter password"
              required
            />
          </div>
          
          <div v-if="auth.error" class="text-red-500 text-sm">
            {{ auth.error }}
          </div>
          
          <div class="flex justify-between">
            <button
              type="button"
              @click="showRegister = true"
              class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
            >
              Create Account
            </button>
            
            <button
              type="submit"
              class="px-6 py-2 bg-primary-600 text-gray-400 hover:bg-primary-700 rounded-md transition-colors"
              :disabled="localLoading"
            >
              <span v-if="localLoading">Signing In...</span>
              <span v-else>Sign In</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useAuth } from '~/composables/useAuth';

const emit = defineEmits(['signed-in', 'signed-out']);

const auth = useAuth();
console.log(auth)
console.log(auth?.user.value.username)
const localLoading = ref(false);
const showRegister = ref(false);

const loginForm = ref({
  username: '',
  password: ''
});

const registerForm = ref({
  username: '',
  email: '',
  password: '',
  firstName: '',
  lastName: ''
});

// Format date helper
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

const handleLogin = async () => {
  localLoading.value = true;
  try {
    await auth.login(loginForm.value);
    emit('signed-in');
  } catch (err) {
    console.error('Login error:', err);
  } finally {
    localLoading.value = false;
  }
};

const handleRegister = async () => {
  localLoading.value = true;
  try {
    await auth.register(registerForm.value);
    emit('signed-in');
  } catch (err) {
    console.error('Registration error:', err);
  } finally {
    localLoading.value = false;
  }
};

const handleSignOut = async () => {
  auth.logout();
  emit('signed-out');
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

// Check if we need to fetch user data
onMounted(() => {
  if (auth.isAuthenticated.value && !auth.user.value) {
    localLoading.value = true;
    auth.fetchCurrentUser()
      .catch(err => console.error('Failed to fetch user data:', err))
      .finally(() => {
        localLoading.value = false;
      });
  }
});

// Watch auth loading state to sync with local loading state
watch(() => auth.isLoading.value, (newValue) => {
  if (!newValue) {
    // When auth loading finishes, ensure local loading is also finished
    localLoading.value = false;
  }
});
</script>