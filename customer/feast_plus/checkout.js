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
          console.log("before logout", localStorage.getItem("userId"));
          localStorage.removeItem("userId");
          localStorage.removeItem("userRole");
          console.log("after logout", localStorage.getItem("userId"));
          window.location.replace("../../login/login.html");
        });
      } else {
        console.warn("#logout-link not found in loaded navbar!");
      }
    })
    .catch((error) => {
      console.error("Failed to load navbar:", error);
    });

  let totAmount = 0;
  const orderInfoContainer = $("#order-info-container");
  const deliveryFee = 2.99;
  let razorpayInstance = null;

  function fetchCartItems() {
    const userId = localStorage.getItem("userId");
    let cartData;
    if (!userId) {
      console.error("userId is missing from the URL.");
      const errmsg = " Missing User Information! Please login again.";
      localStorage.setItem("errmsg", errmsg);
      window.location.href = `../layouts/404error.html`;
      return;
    }
    $.ajax({
      url: `${API_URL}/customer/cart?userId=${userId}`,
      method: "GET",
      success: function (response) {
        console.log("Cart data fetched :", response);
        cartData = response.details;
        displayCartItems(response.details);
        const userDetails = getUserDetails(userId);
        document.getElementById("rzp-button1").onclick = function (e) {
          e.preventDefault();
          if (totAmount === 0) {
            alert("Your cart is empty. Please add items to your order.");
            return;
          }
          const paymentAmount = Math.round(totAmount * 100);
          console.log("Payment Amount (in paise):", paymentAmount);
          const orderDetails = constructOrderDetails(cartData);

          var options = {
            key: "rzp_test_2JhJlBOrI82g0i",
            amount: paymentAmount,
            currency: "INR",
            name: "Feast+",
            description: "Order Payment",
            image: "./img/logo-dark.png",
            handler: function (response) {
              alert(
                "Payment Successful! Payment ID: " +
                  response.razorpay_payment_id
              );

              sendOrderUpdate(orderDetails);
              const orderId = orderDetails.order.orderId;

              localStorage.setItem("orderId", orderId);

              console.log("re directing Order ID:", orderId);

              window.location.href = `../delivery/delivery.html`;
            },
            prefill: {
              name: userDetails.userName,
              email: userDetails.email,
              contact: userDetails.phoneNumber,
            },
            theme: {
              color: "#ffc107",
            },
          };
          razorpayInstance = new Razorpay(options);
          razorpayInstance.open();
        };
      },
      error: function (xhr, status, error) {
        console.error("Error fetching cart:", status, error);
        const errmsg =
          "Status Code '" + xhr.status + "' : Error fetching cart: " + status;
        localStorage.setItem("errmsg", errmsg);
        window.location.href = `../layouts/404error.html`;
      },
    });
  }

  function displayCartItems(cartItems) {
    let orderItemsHTML =
      '<div class="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-4">';
    totAmount = 0;

    if (cartItems.length === 0) {
      orderItemsHTML +=
        "<p class='text-muted alrt alert-info'>Your cart is empty.</p>";
    } else {
      cartItems.forEach((item) => {
        const itemPrice = item.foodItem.price * item.quantity;
        totAmount += itemPrice;

        orderItemsHTML += `
        <div class="col">
          <div class="card ">
            <div class="ratio ">
              <img src="${
                item.foodItem.imageURL
              }" class="card-img-top object-fit-cover " alt="${
          item.foodItem.foodName
        }">
            </div>
            <div class="card-body">
              <h5 class="card-title">${item.foodItem.foodName}</h5>
              <p class="card-text">Quantity: ${item.quantity}</p>
              <p class="card-text">₹${itemPrice.toFixed(2)}</p>
            </div>
          </div>
        </div>
        `;
      });

      totAmount += deliveryFee;

      orderItemsHTML += `
      </div>
      <div class="mt-3">
        <div class="d-flex justify-content-between">
          <span>Delivery</span>
          <span class="delivery-fee">₹${deliveryFee.toFixed(2)}</span>
        </div>
        <div class="d-flex justify-content-between fw-bold">
          <span>TOTAL</span>
          <span id="finalTotalAmount">₹${totAmount.toFixed(2)}</span>
        </div>
      </div>
      `;
    }
    orderInfoContainer.html(orderItemsHTML);
    console.log("Calculated Total Amount:", totAmount);
  }

  function getUserDetails(userId) {
    const url = `${API_URL}/customer/profile/${userId}`;

    $.ajax({
      url: url,
      method: "GET",
      async: false,
      success: function (response) {
        console.log("Fetched profile:", response);
        if (response && response.details && response.details.length > 0) {
          sessionStorage.setItem(
            "userProfile",
            JSON.stringify(response.details[0])
          );
        } else {
          console.error("Empty data array:", response);
          alert("No data received from server. Please check the API response.");
        }
      },
      error: function (xhr, status, error) {
        console.error("Error fetching profile:", status, error);
        const errmsg =
          "Status Code '" + xhr.status + "' : Error fetching profile: " + status;
        localStorage.setItem("errmsg", errmsg);
        window.location.href = `../layouts/404error.html`;
      },
    });

    const userProfileData = sessionStorage.getItem("userProfile");
    if (userProfileData) {
      return JSON.parse(userProfileData);
    }
  }

  function sendOrderUpdate(orderDetails) {
    $.ajax({
      url: `${API_URL}/customer/order/status`,
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify(orderDetails),
      success: function (response) {
        console.log("Order status updated successfully:", response);
        alert("Order placed successfully!");
        // clearCart(); 
      },
      error: function (xhr, status, error) {
        console.error(
          "Error updating order status:",
          status,
          error,
          xhr.responseText
        );
        const errmsg =
          "Status Code '" +
          xhr.status +
          "' : Error updating order status: " +
          status;
        localStorage.setItem("errmsg", errmsg);
        window.location.href = `../layouts/404error.html`;
      },
    });
  }

  function constructOrderDetails(cartItems) {
    if (!cartItems || cartItems.length === 0) {
      throw new Error("Cart is empty. Cannot construct order details.");
    }
    const firstItem = cartItems[0];
    const userId = localStorage.getItem("userId");
    console.log("got items to update :", cartItems);
    const orderDetails = {
      order: {
        orderId: firstItem.orderId,
        user: { userId: userId },
        totalPrice: totAmount,
        quantity: firstItem.quantity,
        date: firstItem.date,
      },
      restaurant: {
        restaurantId: firstItem.foodItem.restaurant.restaurantId,
      },
      status: "Accepted",
    };
    console.log("Constructed Order Details to send server:", orderDetails);
    return orderDetails;
  }

  
  fetchCartItems();
});
