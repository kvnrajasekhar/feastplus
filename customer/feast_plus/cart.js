$(document).ready(function () {
  const API_URL = feast.API_URL;
    const keyToCheck = 'loggedin';
  const login = localStorage.getItem(keyToCheck) !== null;
  const userRole = localStorage.getItem("userRole");
  if (login && userRole !== "customer") {
    localStorage.setItem("errmsg", "User is not a customer.");
    window.location.href = "../layouts/404error.html";
  }
  const cartItemsContainer = $("#cart-items");
  const emptyCartMessage = $("#empty-cart-message");
  const orderSummary = $("#order-summary");
  let cartDataGlobal = [];

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

  function fetchCartItems() {
    const userId = localStorage.getItem("userId");
    console.log(API_URL);
  

    if (!userId) {
      console.error("userId is missing.");
      const errmsg = "Missing User Information! Please login again .";
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
        renderCartItems(response.details);
      },
      error: function (xhr, status, error) {
        console.error("Error fetching cart items:", error);
        const errmsg =
          "Status Code '" +
          xhr.status +
          "' : Can't fetch your cart! Please login again.";
        localStorage.setItem("errmsg", errmsg);
        window.location.href = `../layouts/404error.html`;
        emptyCartMessage.hide();
        orderSummary.hide();
      },
    });
  }

  function renderCartItems(items) {
    let delivery_fee = 2.99;
    cartItemsContainer.empty();
    let subtotal = 0;
    const browseRestaurantButton = $("#browse-restaurant");
    let cartContainer = $("#cart-container-head");
    let checkoutButton = $("#checkout-link");

    checkoutButton.attr("href", `./checkout.html`);
    if (items && items.length === 0) {
      emptyCartMessage.show();
      orderSummary.hide();
      cartItemsContainer.hide();
      cartContainer.hide();

      const userId = localStorage.getItem("userId");
      if (userId) {
        browseRestaurantButton.attr("href", `../restaurant-menu/resto.html`);
      } else {
        const errmsg =
          "Status Code '" +
          xhr.status +
          "' : Missing User Information! Please login again.";
        localStorage.setItem("errmsg", errmsg);
        window.location.href = `../layouts/404error.html`;
      }
      return;
    }

    if (items && items.length > 0) {
      emptyCartMessage.hide();
      orderSummary.show();
      console.log("Items in cart:", items);

      $.each(items, function (index, item) {
        subtotal += item.foodItem.price * item.quantity;

        const cartItem = $('<div class="cart-item">');
        cartItem.html(`
          <img src="${
            item.foodItem.imageURL || "../products/img/default-food.png"
          }" alt="${item.foodItem.foodName}">
          <div>
            <h5>${item.foodItem.foodName.replace(/_/g, " ")}</h5>
            <p>₹${item.foodItem.price ? item.foodItem.price.toFixed(2) : "N/A"}</p>
          </div>
          <div class="quantity-controls" data-order-id="${item.orderId}">
            <button class="quantity-decrease">-</button>
            <span class="item-quantity">${item.quantity}</span>
            <button class="quantity-increase">+</button>
          </div>
          <strong>₹${(item.foodItem.price * item.quantity).toFixed(2)}</strong>
        `);
        cartItemsContainer.append(cartItem);
      });

      $("#subtotal").text(`₹${subtotal.toFixed(2)}`);
      $("#delivery-fee").text(`₹${delivery_fee.toFixed(2)}`);
      $("#total").text(`₹${(subtotal + 2.99).toFixed(2)}`);

      $(".quantity-increase")
        .off("click")
        .on("click", function () {
          const orderId = $(this)
            .closest(".quantity-controls")
            .data("order-id");
          const userId = localStorage.getItem("userId");
          changeQuantity(orderId, 1, userId);
        });

      $(".quantity-decrease")
        .off("click")
        .on("click", function () {
          const orderId = $(this)
            .closest(".quantity-controls")
            .data("order-id");
          const userId = localStorage.getItem("userId");
          changeQuantity(orderId, -1, userId);
        });
    } else {
      emptyCartMessage.show();
      orderSummary.hide();
    }
  }
  function changeQuantity(orderId, change, userId) {
    console.log(
      "Change quantity for orderId:",
      orderId,
      "Change:",
      change,
      "userId:",
      userId
    );

    const quantityControls = $(
      `.quantity-controls[data-order-id="${orderId}"]`
    );
    const quantitySpan = quantityControls.find(".item-quantity");

    if (!quantitySpan || quantitySpan.length === 0) {
      console.error("Could not find quantity span for orderId:", orderId);
      const errmsg = "There is no quantity found!";
      localStorage.setItem("errmsg", errmsg);
      window.location.href = `../layouts/404error.html`;
      return;
    }

    let currentQuantity = parseInt(quantitySpan.text());
    let newQuantity = currentQuantity + change;
    console.log(
      "Current quantity:",
      currentQuantity,
      "New quantity:",
      newQuantity
    );
    const API_URL = feast.API_URL;
    if (newQuantity >= 1) {
      $.ajax({
        url: `${API_URL}/customer/cart/${orderId}?userId=${userId}`,
        method: "PUT",
        contentType: "application/json",
        data: JSON.stringify({ quantity: String(newQuantity) }),
        success: function (response) {
          console.log("Quantity updated successfully for orderId:", orderId);
          fetchCartItems();
        },
        error: function (xhr, status, error) {
          console.error("Error updating cart item quantity:", error);
          const errmsg =
            "Status Code '" +
            xhr.status +
            "' : Failed to update item quantity. Please try again.";
          localStorage.setItem("errmsg", errmsg);
          window.location.href = `../layouts/404error.html`;
        },
      });
    } else if (newQuantity === 0) {
      $.ajax({
        url: `${API_URL}/customer/item/clear/${orderId}?userId=${userId}`, 
        method: "DELETE",
        success: function (response) {
          console.log("Item removed successfully for orderId:", orderId);
          fetchCartItems(); 
        },
        error: function (xhr, status, error) {
          console.error("Error removing item from cart:", error);
          const errmsg =
            "Status Code '" +
            xhr.status +
            "' : Failed to remove item from cart. Please try again.";
          localStorage.setItem("errmsg", errmsg);
          window.location.href = `../layouts/404error.html`;
        },
      });
    }
  }

  fetchCartItems();
});
