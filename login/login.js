$(document).ready(function () {
  const API_URL = feast.API_URL;
  $(".toggle-password").click(function () {
    $(this).toggleClass("active");
    const input = $($(this).attr("toggle"));
    if (input.attr("type") === "password") {
      input.attr("type", "text");
    } else {
      input.attr("type", "password");
    }
  });
  localStorage.removeItem("restaurantName");
  localStorage.removeItem("restaurantId");
  localStorage.removeItem("foodId");
  localStorage.removeItem("orderId");
  $("#loginForm").submit(function (event) {
    event.preventDefault();
    const email = $("#email").val();
    const password = $("#password").val();

    console.log("Email:", email);
    console.log("Password:", password);

    const data = {
      email: email,
      password: password,
    };

      $.ajax({
      type: "POST",
      url: `${API_URL}/login`,
      contentType: "application/json", 
      data: JSON.stringify(data), 
      dataType: "json", 

      success: function (response) {
        console.log("Login successful:", response);
        const userRole = response.role;
        const userId = response.userId;
        console.log("User Role:", userRole);
        console.log("User ID:", userId);
        localStorage.setItem("loggedin",true)
        localStorage.setItem("userId", userId);
        localStorage.setItem("userRole", userRole); 
        if (userRole === "restaurant") {
          window.location.href = "../restaurant/owner.html"; 
        } else if (userRole === "customer") {
          window.location.href = "../customer/feast_plus/index.html";
        } else {
          console.error("Unknown user role:", userRole);
          alert("Unknown user role. Please contact support.");
          localStorage.setItem("errmsg", "Unknown user role.");
          // window.location.href = "./404error.html"; 
        }
        localStorage.removeItem("errmsg"); 
      },
      error: function (xhr, status, error) {
        console.error("Login error:", xhr, status, error);
        let errorMessage = "An error occurred during login. Please try again later.";
        if (xhr.status === 401) {
          errorMessage = "Invalid credentials. Please check your email and password.";
        } else if (xhr.status === 403) {
          errorMessage = "Forbidden. Please check your access rights.";
        }
        localStorage.setItem("errmsg", "Login failed: " + errorMessage);
        // window.location.href = "./404error.html";
        alert(errorMessage); 
      },
    });
  });
});