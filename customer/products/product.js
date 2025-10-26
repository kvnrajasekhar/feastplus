$(document).ready(function () {
  const API_URL = feast.API_URL;
  const keyToCheck = 'loggedin';
  const login = localStorage.getItem(keyToCheck) !== null
  const userRole = localStorage.getItem("userRole");
  if (login && userRole !== "customer") {
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

  const productListContainer = $("#product-list");
  const productModal = $("#productModal");
  const productModalLabel = $("#productModalLabel");
  const productModalBody = $("#productModalBody");
  let userCartItems = new Set();
  let cartRestaurantId = null; // Keep this at the top

  const restaurantId = localStorage.getItem("restaurantId");
  console.log("Restaurant ID from local storage:", restaurantId);

  const userId = localStorage.getItem("userId");
  console.log("userId:", userId);

  function fetchUserCart(callback) {
    const userId = localStorage.getItem("userId");
    $.ajax({
      url: `${API_URL}/customer/cart?userId=${userId}`,
      method: "GET",
      dataType: "json",
      data: { userId: userId },
      success: function (response) {
        userCartItems.clear();

        if (response && Array.isArray(response.details)) {
          const cartResponse = response.details;
          console.log("Fetched cart items:", cartResponse);
          if (cartResponse.length > 0) {
            cartRestaurantId =
              cartResponse[0].foodItem.restaurant.restaurantId; 
            cartResponse.forEach((item) => {
              if (item.foodItem && item.foodItem.foodId) {
                userCartItems.add(item.foodItem.foodId);
              }
            });
          }
        }
        console.log("Fetched cart. cartRestaurantId:", cartRestaurantId);
        if (callback) {
          //check
          callback(); 
        }
      },
      error: function (xhr, status, error) {
        console.error("Error fetching user cart:", error);
        if (callback) {
          callback();
        }
      },
    });
  }

  function fetchAndRenderProducts(restaurantId) {
    if (!restaurantId) {
      const errmsg =
        " Missing restaurant information. Please select restaurant.";
      localStorage.setItem("errmsg", errmsg);
      window.location.href = `../layouts/404error.html`;
      return;
    }
    const apiUrl = `${API_URL}/customer/restaurants/${restaurantId}/food-items`;

    $.ajax({
      url: apiUrl,
      method: "GET",
      dataType: "json",
      success: function (response) {
        console.log("Successfully fetched product data:", response.details);

        if (response && Array.isArray(response.details)) {
          renderProducts(response.details);
        } else {
          console.error(
            "Error: Invalid product data format from server.",
            response
          );
          productListContainer.html(
            '<p class="text-center alert alert-danger">Error loading products.</p>'
          );
        }
      },
      error: function (xhr, status, error) {
        console.error("Error fetching product data:", error);
        const errmsg =
          "Status Code '" +
          xhr.status +
          "' : Error fetching product data. Please try again.";
        localStorage.setItem("errmsg", errmsg);
         window.location.replace(`../layouts/404error.html`);

      },
    });
  }

  function renderProducts(products) {
    console.log("Rendering products:", products);
    productListContainer.empty();
    if (products.length === 0) {
      productListContainer.html(
        '<p class="text-center alert alert-warning">No food items available.</p>'
      );
      return;
    }

    const restaurantName = localStorage.getItem("restaurantName");
    $("#restaurant-name").text(restaurantName);
console.log("Restaurant Name:", restaurantName);  
    $.each(products, function (index, product) {
      const card = $('<div class="product-card">');
      const isDisabled = userCartItems.has(product.foodId);
      const buttonText = userCartItems.has(product.foodId)
        ? "Already in Cart"
        : "Add to Cart";
      const isDisabledAttr = isDisabled ? "disabled-btn" : "";

      getResId(product.foodId)
        .then(function (restaurant) {
          console.log(
            "Restaurant ID for food item " + product.foodId + ":",
            restaurant.restaurantId
          ); 
          card.html(`
            <img src="${
              product.imageURL || "../products/img/default-food.jpg"
            }" alt="${product.foodName}">
            <div class="product-info">
              <h4>${product.foodName.replace(/_/g, " ")}</h4>
              <div class="product-meta">
                ${
                  product.rating
                    ? `<span class="rating">⭐ ${product.rating}</span>`
                    : ""
                }
                ${
                  product.description
                    ? `<span>${product.description.substring(0, 50)}...</span>`
                    : ""
                }
              </div>
              <p class="price">₹${
                product.price ? product.price.toFixed(2) : "N/A"
              }</p>
              <button class="add-to-cart-btn product-details-btn ${isDisabledAttr}" data-food-id="${
                product.foodId
              }" data-restaurant-id="${restaurant.restaurantId}" ${
                isDisabled ? "disabled" : ""
              }>${buttonText}</button>
            </div>
          `);
          productListContainer.append(card);

          card
            .find(".add-to-cart-btn:not(:disabled)")
            .on("click", function () {
              const foodId = $(this).data("food-id");
              console.log("foodId:", foodId);
              const clickedRestaurantId = $(this).data("restaurant-id");
              console.log("clickedRestaurantId:", clickedRestaurantId.details);
              const productCard = $(this).closest(".product-card");
              const priceElement = productCard.find(".price");
              let price = null;
              if (priceElement.length > 0) {
                const priceText = priceElement.text().replace("₹", "");
                price = parseFloat(priceText);
                if (isNaN(price)) {
                  console.error(
                    "Error: Could not determine the price of the item."
                  );
                  return;
                }
              } else {
                console.error(
                  "Error: Price information not found for this item."
                );
                return;
              }
              addToOrder(
                foodId,
                clickedRestaurantId,
                this,
                price,
                userId
              );
            });
        })
        .catch(function (error) {
          console.error("Error getting restaurant ID:", error);

          card.html(`
            <img src="${
              product.imageURL || "../products/img/default-food.jpg"
            }" alt="${product.foodName}">
            <div class="product-info">
              <h4>${product.foodName.replace(/_/g, " ")}</h4>
              <div class="product-meta">
                ${
                  product.rating
                    ? `<span class="rating">⭐ ${product.rating}</span>`
                    : ""
                }
                ${
                  product.description
                    ? `<span>${product.description.substring(0, 50)}...</span>`
                    : ""
                }
              </div>
              <p class="price">₹${
                product.price ? product.price.toFixed(2) : "N/A"
              }</p>
              <button class="add-to-cart-btn product-details-btn disabled-btn" disabled>Error</button>
            </div>
          `);
          productListContainer.append(card);
        });
    });
  }

  function addToOrder(
    foodId,
    clickedRestaurantId,
    buttonElement,
    price,
    userId
  ) {
    if (!userId) {
      alert("Please log in to place an order.");
      return;
    }

    console.log(
      "addToOrder: cartRestaurantId:",
      cartRestaurantId,
      "clickedRestaurantId:",
      clickedRestaurantId
    );
    if (cartRestaurantId !== null && cartRestaurantId !== clickedRestaurantId) {
      if (
        confirm(
          "You already have items from another restaurant in your cart. Do you want to remove them and add this item?"
        )
      ) {
        clearCart(userId, () => {

          cartRestaurantId = clickedRestaurantId;
          addItemToOrder(foodId, buttonElement, price, userId);
          fetchUserCart(() => {
        
            fetchAndRenderProducts(restaurantId);
          });
        });
      } else {
        return;
      }
    } else {
      cartRestaurantId = clickedRestaurantId;
      addItemToOrder(foodId, buttonElement, price, userId);
    }
  }

  function addItemToOrder(foodId, buttonElement, totalPrice, userId) {
    const restaurantId = localStorage.getItem("restaurantId");

    $.ajax({
      url: `${API_URL}/customer/order`,
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify({
        user: { userId: userId },
        foodItem: { foodId: foodId },
        quantity: 1,
        totalPrice: totalPrice,
      }),
      success: function (response) {
        console.log("Item added to order:", response);
        alert("Item added to your order!");
        $(buttonElement)
          .prop("disabled", true)
          .addClass("disabled")
          .text("Already in Cart");
        userCartItems.add(foodId);
        fetchUserCart(() => {
          //refresh
          fetchAndRenderProducts(restaurantId);
        });
      },
      error: function (xhr, status, error) {
        console.error("Error adding item to order:", error);
        console.error("Status:", status);
        console.error("XHR Response:", xhr.responseText);
        alert("Failed to add item to order. Please try again.");
        const errmsg =
          "Status Code '" +
          xhr.status +
          "' : Error adding item to order. Please try again.";
        localStorage.setItem("errmsg", errmsg);
        window.location.href = `../layouts/404error.html`;
      },
    });
  }

  function clearCart(userId, callback) {
    $.ajax({
      url: `${API_URL}/customer/cart/clear?userId=${userId}`,
      method: "DELETE",
      success: function (response) {
        console.log("Cart cleared successfully:", response);
        userCartItems.clear();
        cartRestaurantId = null;
        if (callback) {
          callback();
        }
      },
      error: function (xhr, status, error) {
        console.error("Error clearing cart:", error);
        alert("Failed to clear the cart. Please try again.");
        const errmsg = "Status Code '" + xhr.status + "' : Error clearing cart";
        localStorage.setItem("errmsg", errmsg);
        window.location.href = `../layouts/404error.html`;
      },
    });
  }

  function getResId(foodId) {
    return new Promise(function (resolve, reject) {
      $.ajax({
        url: `${API_URL}/customer/food-items/${foodId}/restaurant`,
        method: "GET",
        dataType: "json",
        success: function (response) {
          console.log("Response from getResId:", response);
          if (response && response.details) {
            resolve(response.details);
          } else {
            reject(new Error("Restaurant ID not found in response")); 
          }
        },
        error: function (xhr, status, error) {
          reject(
            new Error(
              "Error fetching restaurant ID: " + xhr.status + " - " + error
            )
          ); 
        },
      });
    });
  }

  fetchUserCart(() => {
    fetchAndRenderProducts(restaurantId); 
  });
});
