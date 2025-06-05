document.addEventListener("DOMContentLoaded", function () {
    const userName = localStorage.getItem("userName");
    const userLink = document.getElementById("user-link");
    const userNameSpan = document.getElementById("user-name-text");

    if (userName) {
      userNameSpan.textContent = userName;
      userLink.href = "#"; // or maybe a profile page later
    }
  });