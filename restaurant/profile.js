$(document).ready(function () {
  const API_URL = feast.API_URL;
  const userRole = localStorage.getItem("userRole");
  if (userRole !== "restaurant") {
    localStorage.setItem("errmsg", "Customer is not a restaurant owner.");
    window.location.href = "./layouts/404error.html";
  }
  fetch("./layouts/nav.html")
    .then((response) => response.text())
    .then((navbarHTML) => {
      $("#navbar-container").html(navbarHTML);
      const $logoutLink = $("#logout-link");

      if ($logoutLink.length) {
        $logoutLink.on("click", function (e) {
          e.preventDefault();
          localStorage.removeItem("userId");
          localStorage.removeItem("restaurantId");
          localStorage.removeItem("userRole");
          window.location.replace("../login/login.html");
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
    console.error("userId is missing from the URL.");
    const errmsg = "Missing user information. Please login again.";
    localStorage.setItem("errmsg", errmsg);
    window.location.href = "./layouts/404error.html";
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
  const url = `${API_URL}/customer/profile/${userId}`;

  $.ajax({
    url: url,
    method: "GET",
    success: function (response) {
      console.log("Fetched profile:", response);
      if (response && response.details && response.details.length > 0) {
        displayProfile(response.details[0]);
        populateEditForm(response.details[0]);
      } else {
        console.error("Empty data array:", response);
        const errmsg =
          "No data received from server. Please check the API response.";
        localStorage.setItem("errmsg", errmsg);
        window.location.href = `./layouts/404error.html`;
      }
    },
    error: function (xhr, status, error) {
      console.error("Error fetching profile:", status, error);
      const errmsg = status + "! Error fetching profile ";
      localStorage.setItem("errmsg", errmsg);
      window.location.href = `./layouts/404error.html`;
    },
  });
}
function displayProfile(data) {
  if (data) {
    $("#displayName").text(data.userName);
    $("#displayMobile").text(data.phoneNumber);
    $("#displayEmail").text(data.email);
    $("#displayAddress").text(data.address);
  } else {
    console.error("Invalid data format:", data);
    const errmsg =
      "Invalid data received from server.  Please check the API response.";
    localStorage.setItem("errmsg", errmsg);
    window.location.href = `./layouts/404error.html`;
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
    const errmsg =
      "Invalid data received from server.  Please check the API response.";
    localStorage.setItem("errmsg", errmsg);
    window.location.href = `./layouts/404error.html`;
  }
}

function saveUserProfile(userId) {
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
      alert(response.message);
      const $profileSection = $("#profileSection");  
      const $editProfileSection = $("#editProfileSection"); 
      $editProfileSection.hide();
      $profileSection.show();
      fetchUserProfile(userId);
    },
    error: function (xhr, status, error) {
      console.error("Error updating profile:", xhr.responseText, status, error);
      alert("Failed to update profile. Please check the console for details.");
      const errmsg = status + "! Error updating profile: ";
      localStorage.setItem("errmsg", errmsg);
      window.location.href = `./layouts/404error.html`;
    },
  });
}
