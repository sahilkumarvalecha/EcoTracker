// auth.js - Centralized authentication functions

// Check authentication status
async function checkAuthStatus() {
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

// Redirect if not authenticated - ONLY FOR PROTECTED PAGES
async function protectPage() {
  // Skip auth check for login/signup pages
  if (window.location.pathname.includes('login.html') || 
      window.location.pathname.includes('signup.html')) {
    return;
  }

  const isAuthenticated = await checkAuthStatus();
  if (!isAuthenticated) {
    window.location.href = '/WEB/login.html';
  }
}

// Get user info
async function getUserInfo() {
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

// Initialize auth check on page load
document.addEventListener('DOMContentLoaded', async () => {
  // Only run protectPage on protected pages
  if (!window.location.pathname.includes('login.html') && 
      !window.location.pathname.includes('signup.html')) {
    await protectPage();
    
    // Update UI for logged in user
    const userInfo = await getUserInfo();
    if (userInfo) {
      const userNameText = document.getElementById('user-name-text');
      if (userNameText) {
        userNameText.textContent = userInfo.name;
      }
    }
  }
});

// Login handler
document.querySelector('.Login-btn')?.addEventListener('click', async (e) => {
  e.preventDefault();
  const loginemail = document.getElementById('login-email');
  const loginpassword = document.getElementById('login-password');
  const loginpassissue = document.querySelector('.loginpassissue');

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify({
        email: loginemail.value,
        password_hash: loginpassword.value,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      // Store minimal data in localStorage
      localStorage.setItem("userName", data.name);
      localStorage.setItem("isAdmin", data.isAdmin);
      
      // Redirect to home
      window.location.href = "/WEB/index.html";
    } else {
      loginpassissue.textContent = data.message || "Login failed";
      loginpassissue.classList.add("show");
    }
  } catch (err) {
    console.error(err);
    loginpassissue.textContent = "Server error. Please try again later.";
    loginpassissue.classList.add("show");
  }
});

// Signup handler
document.querySelector('.signup-btn')?.addEventListener('click', async (e) => {
  e.preventDefault();
  
  try {
    const response = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: signupname.value,
        email: signupemail.value,
        password_hash: signuppassword.value,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      window.location.href = '/WEB/login.html';
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error(error);
    alert("Something went wrong. Try again later.");
  }
});

// RSVP function
function rsvpEvent(eventId) {
  fetch('http://localhost:5055/rsvp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ event_id: eventId })
  })
    .then(response => response.json())
    .then(data => {
      alert(data.message || data.error);
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Something went wrong!');
    });
}