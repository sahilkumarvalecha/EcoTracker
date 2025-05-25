// auth.js - Centralized authentication functions

// Check authentication status
export async function checkAuthStatus() {
    try {
      const response = await fetch('/api/check-auth', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Not authenticated');
      }
      
      const data = await response.json();
      return data.isAuthenticated;
    } catch (error) {
      console.error('Auth check failed:', error);
      return false;
    }
  }
  
  // Redirect if not authenticated
  export async function ensureAuthenticated() {
    const isAuthenticated = await checkAuthStatus();
    if (!isAuthenticated) {
      window.location.href = '/WEB/login.html';
      return false;
    }
    return true;
  }
  
  // Get user info
  export async function getUserInfo() {
    try {
      const response = await fetch('/api/user', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to get user info');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get user info:', error);
      return null;
    }
  }