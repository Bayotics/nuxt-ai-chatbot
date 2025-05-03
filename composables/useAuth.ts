import { ref, reactive } from 'vue';

// User type definition
interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  createdAt: string;
}

// Create state with refs
const user = ref<User | null>(null);
const token = ref<string | null>(null);
const isAuthenticated = ref(false);
const isLoading = ref(false);
const error = ref<string | null>(null);

// Initialize auth from localStorage
const initAuth = () => {
  if (process.client) {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    
    console.log('Initializing auth state:', { 
      hasToken: !!storedToken, 
      hasUser: !!storedUser 
    });
    
    if (storedToken && storedUser) {
      token.value = storedToken;
      user.value = JSON.parse(storedUser);
      isAuthenticated.value = true;
      console.log('User authenticated from localStorage');
    } else {
      console.log('No auth data found in localStorage');
    }
  }
};

// Register a new user
const register = async (userData: {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}) => {
  isLoading.value = true;
  error.value = null;
  
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }
    
    // Set auth state
    user.value = data.user;
    token.value = data.token;
    isAuthenticated.value = true;
    
    // Store in localStorage
    if (process.client) {
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
    }
    
    return data;
  } catch (err) {
    error.value = err.message;
    throw err;
  } finally {
    isLoading.value = false;
  }
};

// Login user
const login = async (credentials: { username: string; password: string }) => {
  isLoading.value = true;
  error.value = null;
  
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }
    
    // Set auth state
    user.value = data.user;
    token.value = data.token;
    isAuthenticated.value = true;
    
    // Store in localStorage
    if (process.client) {
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
    }
    
    return data;
  } catch (err) {
    error.value = err.message;
    throw err;
  } finally {
    isLoading.value = false;
  }
};

// Logout user
const logout = () => {
  user.value = null;
  token.value = null;
  isAuthenticated.value = false;
  
  // Remove from localStorage
  if (process.client) {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }
};

// Get current user
const fetchCurrentUser = async () => {
  if (!token.value) {
    isLoading.value = false;
    return null;
  }
  
  isLoading.value = true;
  error.value = null;
  
  try {
    const response = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch user');
    }
    
    // Update user data
    user.value = data.user;
    
    return data.user;
  } catch (err) {
    error.value = err.message;
    
    // If unauthorized, logout
    if (err.message === 'Unauthorized') {
      logout();
    }
    
    throw err;
  } finally {
    isLoading.value = false;
  }
};

// Export composable
export function useAuth() {
  // Initialize on first use if in client
  if (process.client && !user.value && !isAuthenticated.value) {
    initAuth();
  }
  
  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    register,
    login,
    logout,
    fetchCurrentUser,
    initAuth
  };
}