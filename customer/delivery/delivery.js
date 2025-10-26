$(document).ready(function () {
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

  const orderId = localStorage.getItem("orderId");

  const orderDetailsCard = $("#order-details-card");
  const deliveryPartnerInfo = $("#delivery-partner-info");
  const mapFrame = $("#google-map");
  const mapWrapper = $("#map-wrapper");

  const API_URL = feast.API_URL;

  if (!orderId) {
    const errmsg = "Missing Order Information! Please try again.";
    localStorage.setItem("errmsg", errmsg);
    window.location.href = `../layouts/404error.html`;
    return;
  }

  function fetchOrderStatus(orderId, cartData) {
    console.log(API_URL);
    $.ajax({
      url: `${API_URL}/restaurant/order/${orderId}/status`,
      method: "GET",
      success: function (response) {
        console.log("Order status data:", response);
        updatePage(response.details,cartData);
      },
      error: function (xhr, status, error) {
        console.error("Error fetching order status:", status, error);
        const errmsg = "Error fetching order status: " + status;
        localStorage.setItem("errmsg", errmsg);
        window.location.href = `../layouts/404error.html`;
      },
    });
  }

  function fetchCartItems() {
    const userId = localStorage.getItem("userId");
    const orderId = localStorage.getItem("orderId");

    if (!userId) {
      console.error("userId is missing.");
      const errmsg = "Missing User Information! Please login again.";
      localStorage.setItem("errmsg", errmsg);
      window.location.href = `../layouts/404error.html`;
      return;
    }
    $.ajax({
      url: `${API_URL}/customer/cart?userId=${userId}`,
      method: "GET",
      dataType: "json",
      success: function (response) {
        cartDataGlobal = response.details;
        localStorage.setItem('cartItems', JSON.stringify(response.details));
        console.log("Cart items data:", response.details);
        fetchOrderStatus(orderId,response.details)
      },
      error: function (xhr, status, error) {
        console.error("Error ordered items:", error);
        const errmsg =
          "Status Code '" +
          xhr.status +
          "' : Error fetching ordered items.";
        localStorage.setItem("errmsg", errmsg);
        window.location.href = `../layouts/404error.html`;
        emptyCartMessage.hide();
        orderSummary.hide();
      },
    });
  }



  function updatePage(orderData,cartData) {
    const orderIdDisplay = $("#order-id");
    const customerName = $("#customer-name");
    const deliveryAddress = $("#delivery-address");
    const orderItemsDisplay = $("#order-items"); 
    const orderStatusText = $("#order-status-text");
    const deliveryPartnerName = $("#delivery-partner-name");
    const deliveryPartnerVehicle = $("#delivery-partner-vehicle");
    const deliveryPartnerImage = $("#delivery-partner-image");
    const foodOrderStatus = $("#food-status-text");

    orderIdDisplay.text(orderData.orderDTO.orderId);
    customerName.text(orderData.orderDTO.user.userName);
    deliveryAddress.text(orderData.orderDTO.user.address);
    let itemsString = updatePageItems(cartData); 
    orderItemsDisplay.text(itemsString); 
    foodOrderStatus.text(orderData.status);

    let foodReadinessStatus = orderData.status;
    let orderStatusDisplay = "";
    let partnerInfoDisplay = "none";
    let mapDisplay = "none";
    let eta = "30 minutes";

    switch (foodReadinessStatus) {
      case "Accepted":
        orderStatusDisplay = "Partner Yet to Assign";
        break;
      case "Preparing":
        orderStatusDisplay = "Partner Yet to Assign";
        eta = "20 minutes";
        break;
      case "Cooked":
        orderStatusDisplay = "Partner Assigned";
        partnerInfoDisplay = "block";
        eta = "15 minutes";
        break;
      case "Out for Delivery":
        orderStatusDisplay = "On the way";
        partnerInfoDisplay = "block";
        mapDisplay = "block";
        eta = "10 minutes";
        break;
      case "Delivered":
        orderStatusDisplay = "Delivered";
        partnerInfoDisplay = "block";
        mapDisplay = "block";
        eta = "Delivered";
        break;
      default:
        orderStatusDisplay = "Unknown";
    }
    console.log(
      "foodReadinessStatus:",
      foodReadinessStatus,
      "orderStatusDisplay:",
      orderStatusDisplay
    );
    orderStatusText.text(orderStatusDisplay);
    orderStatusText.addClass(
      foodReadinessStatus.toLowerCase().replace(/ /g, "_")
    );

    if (partnerInfoDisplay === "block") {
      deliveryPartnerInfo.show();
      deliveryPartnerName.text("Alice Johnson");
      deliveryPartnerVehicle.text("Bike (1234-25-BH)");
      deliveryPartnerImage.attr("src", "./delivery-man.gif");
    } else {
      deliveryPartnerInfo.hide();
    }
    if (mapDisplay === "block") {
      mapWrapper.show();
      mapFrame.show();
    } else {
      mapWrapper.hide();
      mapFrame.hide();
    }

    $("#order-eta").text(eta);
  }
  function updatePageItems(orderItemsArray) { 
    let items = "";
console.log("orderItemsArray:", orderItemsArray);
    if (Array.isArray(orderItemsArray)) {
      orderItemsArray.forEach(item => { 
        if (item) { 
          console.log("item:", item);
          items += item.foodItem.foodName + " x " + item.quantity + ", ";
        }
      });
    }

    return items.slice(0, -2); // Remove the trailing ", "
  }

  fetchCartItems(); 
});
