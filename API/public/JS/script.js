const signupname = document.querySelector("#signup-name");
const signupemail = document.querySelector("#signup-email");
const signuppassword = document.querySelector("#signup-password");
const confirmpassword = document.querySelector("#signup-confirmpassword");
const signuppassissue = document.querySelector(".signup-passwordissue");
const confirmpassissue = document.querySelector(".confirm-passwordissue");


document.addEventListener("DOMContentLoaded", () => {
  const loginbtn = document.querySelector(".Login-btn");
  const signupbtn = document.querySelector(".signup-btn");

  // Login logic
  if (loginbtn) {
    loginbtn.addEventListener("click", async (e) => {
      e.preventDefault();

      const loginemail = document.querySelector("#login-email");
      const loginpassword = document.querySelector("#login-password");
      const loginpassissue = document.querySelector(".loginpassissue");
      const loginemailissue = document.querySelector(".loginemailissue");

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
          localStorage.setItem("userEmail", loginemail.value);
          localStorage.setItem("userName", data.name);
          localStorage.setItem("isAdmin", data.isAdmin);

          window.location.href = "/index.html"; // ✅ make sure this path exists
        } else {
          alert(data.message);
        }
      } catch (err) {
        console.log(err.message);
        alert("Server error. Please try again later.");
      }
    });
  }

  // Signup logic
  if (signupbtn) {
    signupbtn.addEventListener("click", async (e) => {
      e.preventDefault();

      const signupname = document.querySelector("#signup-name");
      const signupemail = document.querySelector("#signup-email");
      const signuppassword = document.querySelector("#signup-password");
      const confirmpassword = document.querySelector("#signup-confirmpassword");
      const confirmpassissue = document.querySelector(".confirm-passwordissue");

      if (signuppassword.value !== confirmpassword.value) {
        confirmpassissue.style.color = "darkRed";
        confirmpassissue.textContent = "Password doesn't match";
        return;
      }

      try {
        const response = await fetch("http://localhost:5055/signup", {
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
          alert(data.message);
          localStorage.setItem("userName", signupname.value);
          window.location.href = "login.html";
        } else {
          alert(data.message || "Signup failed");
        }
      } catch (error) {
        console.error(error);
        alert("Something went wrong. Try again later.");
      }
    });
  }
});
// On page load
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

