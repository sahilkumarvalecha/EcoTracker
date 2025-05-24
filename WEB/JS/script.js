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
    const response = await fetch("https://q4rv2d3l-5055.inc1.devtunnels.ms/signup", {
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

