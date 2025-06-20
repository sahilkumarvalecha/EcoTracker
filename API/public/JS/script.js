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
        const response = await fetch("/login", {
          method: 'POST',
          credentials: 'include', // Required for cookies
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: loginemail.value.trim(),
            password_hash: loginpassword.value.trim(),
          }),
        });

        const data = await response.json();

        if (response.ok) {
          localStorage.setItem("userEmail", data.user.email);
          localStorage.setItem("userName", data.user.name);
          localStorage.setItem("isAdmin", data.user.isAdmin);
          localStorage.setItem("user_id", data.user.id);
          window.location.href = "index.html";
        }
        else {
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

      console.log("signup clicked");

      const signupname = document.querySelector("#signup-name");
      const signupemail = document.querySelector("#signup-email");
      const signuppassword = document.querySelector("#signup-password");
      const confirmpassword = document.querySelector("#signup-confirmpassword");
      const confirmpassissue = document.querySelector(".confirm-passwordissue");

      confirmpassissue.textContent = "";

      if (signuppassword.value !== confirmpassword.value) {
        confirmpassissue.style.color = "darkRed";
        confirmpassissue.textContent = "Password doesn't match";
        return;
      }

      try {
        const response = await fetch("/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: signupname.value.trim(),
            email: signupemail.value.trim(),
            password: signuppassword.value.trim(),
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



// events js


