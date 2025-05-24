const signupname = document.querySelector("#signup-name");
const signupemail = document.querySelector("#signup-email");
const signuppassword = document.querySelector("#signup-password");
const confirmpassword = document.querySelector("#signup-confirmpassword");
const signuppassissue = document.querySelector(".signup-passwordissue");
const confirmpassissue = document.querySelector(".confirm-passwordissue");
const loginbtn = document.querySelector(".Login-btn");
const signupbtn = document.querySelector(".signup-btn");

signupbtn.addEventListener("click", async () =>{
    if(signuppassword.value != confirmpassword.value){
        confirmpassissue.style.color = "darkRed";
         confirmpassissue.innerHTML = "password doesn't match";
        return;
    }
    confirmpassissue.innerHTML = "";

     

    // Backend API call
  try {
    const response = await fetch("https://symmetrical-space-waddle-97q97xrvvrv6h7vxg-5055.app.github.dev/signup", {
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
      //  Redirect only on success
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

loginbtn.addEventListener("click", async () => {
  try {
    const response = await fetch("https://symmetrical-space-waddle-97q97xrvvrv6h7vxg-5055.app.github.dev/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: loginemail.value,
        password_hash: loginpassword.value,
      }),
    });

    const data = await response.json();

    if (response.ok) {
  alert(data.message); // "Login successful"
  setTimeout(() => {
    window.location.href = "index.html";
  }, 1000);
    } else if (response.status === 401) {
      loginpassissue.style.color = 'darkRed';
      loginpassissue.innerHTML = "incorrect password";
    } else if (response.status === 404) {
      // Don't redirect, just show alert
      alert("User not found. Please sign up first.");
    } else {
      alert(data.message || "Login failed.");
    }
  } catch (error) {
    console.error(error);
    alert("Something went wrong. Try again later.");
  }
});
  