$(document).ready(function () {
  const API_URL = feast.API_URL;
  const userRole = localStorage.getItem("userRole");
  if (userRole !== "customer") {
    localStorage.setItem("errmsg", "User is not a customer.");
    window.location.href = "../layouts/404error.html";
  }
  fetch("../layouts/nav.html")
    .then((response) => response.text())
    .then((navbarHTML) => {
      $("#navbar-container").html(navbarHTML);
      const $logoutLink = $("#logout-link");

      if ($logoutLink.length) {
        $logoutLink.on("click", function (e) {
          e.preventDefault();
          localStorage.removeItem("userId");
          localStorage.removeItem("userRole");
          window.location.replace("../../login/login.html");
        });
      } else {
        console.warn("#logout-link not found in loaded navbar!");
      }
    })
    .catch((error) => {
      console.error("Failed to load navbar:", error);
    });

  const $profileSection = $("#profileSection");
  const $editProfileSection = $("#editProfileSection");
  const $editProfileBtn = $("#editProfileBtn");
  const $saveProfileBtn = $("#saveProfileBtn");

  const userId = localStorage.getItem("userId");

  if (!userId) {
    const errmsg = "Please login to access your profile.";
    localStorage.setItem("errmsg", errmsg);
    window.location.href = `../layouts/404error.html`;
    return;
  }

  fetchUserProfile(userId);

  $editProfileBtn.on("click", function () {
    $profileSection.hide();
    $editProfileSection.show();
  });

  $saveProfileBtn.on("click", function () {
    saveUserProfile(userId);
  });
});

function fetchUserProfile(userId) {
  const API_URL = feast.API_URL;
  const url = `${API_URL}/customer/profile/${userId}`;

  $.ajax({
    url: url,
    method: "GET",
    success: function (response) {
      console.log("Fetched profile:", response);
      if (response && Array.isArray(response.details) && response.details.length > 0) {
        displayProfile(response.details[0]);
        populateEditForm(response.details[0]);
      } else {
        console.error("Empty or invalid data array:", response);
        alert("No user profile data received from the server.");
        const errmsg = "No user profile data received from the server.";
        localStorage.setItem("errmsg", errmsg);
        window.location.href = `../layouts/404error.html`;
      }
    },
    error: function (xhr, status, error) {
      console.error("Error fetching profile:", status, error);
      const errmsg = "Status Code '" + xhr.status + "' : Error fetching profile ";
      localStorage.setItem("errmsg", errmsg);
      window.location.href = `../layouts/404error.html`;
    },
  });
}

function displayProfile(data) {
  if (data && typeof data === "object") {
    $("#displayName").text(data.userName);
    $("#displayMobile").text(data.phoneNumber);
    $("#displayEmail").text(data.email);
    $("#displayAddress").text(data.address);
  } else {
    console.error("Invalid data format:", data);
    const errmsg = "Invalid user profile data received from the server.";
    localStorage.setItem("errmsg", errmsg);
    window.location.href = `../layouts/404error.html`;
  }
}

function populateEditForm(data) {
  if (data && typeof data === "object") {
    $("#editName").val(data.userName);
    $("#editMobile").val(data.phoneNumber);
    $("#editEmail").val(data.email);
    $("#editAddress").val(data.address);
  } else {
    console.error("Invalid data format:", data);
    alert("Invalid user profile data received from the server.");
    const errmsg = "Invalid user profile data received from the server.";
    localStorage.setItem("errmsg", errmsg);
    window.location.href = `../layouts/404error.html`;
  }
}

function saveUserProfile(userId) {
  const API_URL = feast.API_URL;
  const url = `${API_URL}/customer/profile/edit/${userId}`;
  const updatedData = {
    userName: $("#editName").val(),
    phoneNumber: $("#editMobile").val(),
    email: $("#editEmail").val(),
    address: $("#editAddress").val(),
  };
  console.log("Sending data:", updatedData);

  $.ajax({
    url: url,
    method: "PUT",
    contentType: "application/json",
    data: JSON.stringify(updatedData),
    success: function (response) {
      console.log("Profile updated successfully:", response);
      alert("Profile updated successfully!");
      const $profileSection = $("#profileSection");  
      const $editProfileSection = $("#editProfileSection"); 
      $editProfileSection.hide();
      $profileSection.show();
      fetchUserProfile(userId); 
    },
    error: function (xhr, status, error) {
      console.error("Error updating profile:", xhr.responseText, status, error);
      alert("Failed to update profile. Please check the console for details.");
      const errmsg = "Status Code '" + xhr.status + "' : Error updating profile: ";
      localStorage.setItem("errmsg", errmsg);
      window.location.href = `../layouts/404error.html`;
    },
  });
}
