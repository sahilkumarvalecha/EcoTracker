// auth.js - Centralized authentication functions

let authCheckInProgress = false;

// Check authentication status
export async function checkAuthStatus() {
  if (authCheckInProgress) return true;
  authCheckInProgress = true;
  
  try {
    const response = await fetch('/api/check-auth', {
      credentials: 'include' // Important for cookies
    });
    
    if (!response.ok) {
      throw new Error('Not authenticated');
    }
    
    const data = await response.json();
    return data.isAuthenticated;
  } catch (error) {
    console.error('Auth check failed:', error);
    return false;
  } finally {
    authCheckInProgress = false;
  }
}

// Redirect if not authenticated
export async function ensureAuthenticated() {
  // Skip check if we're on login page
  if (window.location.pathname.includes('login.html')) {
    return true;
  }

  const isAuthenticated = await checkAuthStatus();
  
  if (!isAuthenticated) {
    // Clear client-side auth data
    localStorage.removeItem("authToken");
    
    // Store current path for redirect after login
    sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
    
    window.location.href = '/WEB/login.html';
    return false;
  }
  
  return true;
}