const signupname = document.querySelector("#signup-name");
const signupemail = document.querySelector("#signup-email");
const signuppassword = document.querySelector("#signup-password");
const confirmpassword = document.querySelector("#signup-confirmpassword");
const signuppassissue = document.querySelector(".signup-passwordissue");
const confirmpassissue = document.querySelector(".confirm-passwordissue");
const loginbtn = document.querySelector(".Login-btn");
const signupbtn = document.querySelector(".signup-btn");

signupbtn.addEventListener("click", async (e) => {
  e.preventDefault();
  if (signuppassword.value != confirmpassword.value) {
    confirmpassissue.style.color = "darkRed";
    confirmpassissue.innerHTML = "password doesn't match";
    return;
  }
  confirmpassissue.innerHTML = "";



  // Backend API call
  try {
    const response = await fetch("http://localhost:5055/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: signupname.value,
        email: signupemail.value,
        password_hash: signuppassword.value,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      alert(data.message); // e.g., "Signup successful"
      //  Store name in localStorage
      localStorage.setItem("userName", signupname.value);
      //  Redirect
      window.location.href = "login.html";
    } else {
      alert(data.message || "Signup failed");
    }

  } catch (error) {
    alert("Something went wrong. Try again later.");
    console.error(error);
  }

});



const loginemail = document.querySelector("#login-email");
const loginpassword = document.querySelector("#login-password");
const loginpassissue = document.querySelector(".loginpassissue");
const loginemailissue = document.querySelector(".loginemailissue");

loginbtn.addEventListener("click", async (e) => {
  e.preventDefault();

  loginemailissue.textContent = "";
  loginpassissue.textContent = "";


  try {
    const response = await fetch("http://localhost:5055/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", 
      body: JSON.stringify({
        email: loginemail.value,
        password_hash: loginpassword.value,
      }),
       
    });

    const data = await response.json();

   if (response.ok) {
 // 1. Store user data
      localStorage.setItem("userName", data.name);

  // In your index.html's JavaScript (or shared JS file):
 window.location.href = "index.html";     // redirect to home page
}  else {
      alert(data.message); // "User not found" ya "Incorrect password"
    }
  } catch (err) {
    console.log(err.message);
    alert("Server error. Please try again later.");
  }
});
window.addEventListener("DOMContentLoaded", () => {
    const userName = localStorage.getItem("userName");
    const userLink = document.getElementsByClassName("user-link");
    const userNameSpan = document.getElementById("user-name-text");

    if (userName && userNameSpan && userLink) {
      userNameSpan.textContent = userName;
      userLink.href = "#"; // Or profile page
    } else {
      // Show default Sign In / Sign Up text
      // if (userNameSpan) userNameSpan.textContent = "Sign In / Sign Up";
      // if (userLink) userLink.href = "signin.html"; // ya signup page
    }
  });

// rsvp API

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

