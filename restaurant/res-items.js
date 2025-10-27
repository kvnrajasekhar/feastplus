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

  const $productListContainer = $("#product-list");
  const $productModal = $("#productModal");
  const $productModalLabel = $("#productModalLabel");
  const $productModalBody = $("#productModalBody");
  const $addItemBtn = $("#add-item-btn");
  const $editItemModal = $("#editItemModal");
  const $editItemModalBody = $("#editItemModalBody");
  const $saveEditItemBtn = $("#saveEditItem");
  const $cancelEditItemBtn = $("#cancel-button");
  let currentEditItemId = null;
  let fooditem = [];

  const restaurantId = localStorage.getItem("restaurantId");
  const userId = localStorage.getItem("userId");

  function renderProducts(products) {
      console.log("Rendering products:", products);
      if (products.length === 0) {
          console.warn("No products to render.");
          $productListContainer.html(
              "<div class='text-center center-message alert alert-warning'>Your Restaurant has no products!. Add some items.</div>"
          );
          return;
      }
      $productListContainer.empty();
      products.forEach((product) => {
          console.log("Product being rendered:", product);
          const productName = product.foodName ? product.foodName : "No Name";
          const $card = $("<div>").addClass("product-card mb-3 product-list-item");
          $card.html(`
              <img src="${product.imageURL || ""}" alt="${productName}" class="img-fluid">
              <div class="product-info p-3">
                  <h4>${productName}</h4>
                  <div class="product-meta mb-2">
                      ${product.rating ? `<span class="rating">⭐ ${product.rating}</span>` : ""}
                      ${product.foodType ? `<span>${product.foodType}</span>` : ""}
                  </div>
                  <p class="mb-2">${product.description || "No description available."}</p>
                  <div class="product-actions d-flex justify-content-end gap-2">
                      <button class="btn btn-sm btn-success edit-item-btn" data-food-id="${product.foodId}" data-toggle="modal" data-target="#editItemModal">Edit</button>
                      <button class="btn btn-sm btn-danger remove-item-btn" data-food-id="${product.foodId}">Remove</button>
                  </div>
              </div>
          `);
          $productListContainer.append($card);
      });
  }

  function fetchFoodItems() {
    const API_URL = feast.API_URL;
      const apiUrl = `${API_URL}/restaurant/${restaurantId}/food-items`;
      $.ajax({
          url: apiUrl,
          method: "GET",
          dataType: "json",
          success: function (response) {
              console.log("Successfully fetched food items:", response);
              if (response && response.details) {
                  fooditem = response.details;
                  renderProducts(fooditem);
              } else {
                  console.warn("No food items received from the server.");
                  fooditem = [];
                  renderProducts(fooditem);
              }
          },
          error: function (xhr, status, error) {
              console.error("Error fetching food items:", status, error);
              const errmsg = status + "! Error fetching food items. Please try again later.";
              localStorage.setItem("errmsg", errmsg);
              window.location.href = `./layouts/404error.html`;
          },
      });
  }

  fetchFoodItems();

  $productListContainer.on("click", ".edit-item-btn", function (event) {
      const $target = $(event.target);
      currentEditItemId = $target.data("foodId");
      console.log("Editing item with ID:", currentEditItemId);
      populateEditForm(currentEditItemId);
      $editItemModal.modal("show");
  });

  $productListContainer.on("click", ".remove-item-btn", function (event) {
      const $target = $(event.target);
      const productIdToRemove = $target.data("foodId");
      console.log("Deleting item with ID:", productIdToRemove);
      if (
          productIdToRemove &&
          confirm("Are you sure you want to remove this item?")
      ) {
        const API_URL = feast.API_URL;
          $.ajax({
              url: `${API_URL}/restaurant/food-item/${productIdToRemove}`,
              method: "DELETE",
              success: function (response) {
                  if (response && response.message) {
                      alert(response.message);
                  }
                  fooditem = fooditem.filter(
                      (item) => item.foodId !== productIdToRemove
                  );
                  renderProducts(fooditem);
                  console.log("Item removed successfully.");
              },
              error: function (xhr, status, error) {
                  console.error("Error removing item:", status, error);
                  const errmsg =
                      status + "! Error removing item. Please try again later.";
                  localStorage.setItem("errmsg", errmsg);
                  window.location.href = `./layouts/404error.html`;
                  alert("Failed to remove item.");
              },
          });
      }
  });

  $addItemBtn.on("click", function () {
      currentEditItemId = null;
      populateEditForm(null);
      $editItemModal.modal("show");
  });

  $editItemModal.on("show.bs.modal", function (e) {
      const $cancelEditItemBtn = $("#cancel-button");

      $cancelEditItemBtn.on("click", function () {
          $editItemModal.modal("hide");
      });

      $('#close-button').on('click', function () {
          $editItemModal.modal('hide');
      });
      
  });

  function populateEditForm(itemId) {
      const $modalBody = $("#editItemModal").find(".modal-body");
      $modalBody.html(`
          <form id="editForm">
              <div class="form-group">
                  <label for="edit-name">Name</label>
                  <input type="text" class="form-control" id="edit-name" value="" required>
              </div>
              <div class="form-group">
                  <label for="edit-foodType">Category</label>
                  <input type="text" class="form-control" id="edit-foodType" value="">
              </div>
              <div class="form-group">
                  <label for="edit-description">Description</label>
                  <textarea class="form-control" id="edit-description"></textarea>
              </div>
              <div class="form-group">
                  <label for="edit-price">Price</label>
                  <input type="number" class="form-control" id="edit-price" step="0.1" value="">
              </div>
              <div class="form-group">
                  <label for="edit-imageURL">Image URL</label>
                  <input type="text" class="form-control" id="edit-imageURL" value="">
              </div>
              <div class="form-group">
                  <label for="edit-rating">Rating</label>
                  <input type="number" class="form-control" id="edit-rating" min="0" max="5" step="0.1" value="">
              </div>
              <input type="hidden" id="edit-foodId" value="">
              <button type="submit" class="btn add-item-btn mt-3">Save Changes</button>
          </form>
      `);
      const $editForm = $("#editForm");
      $editForm.on("submit", handleEditSubmit);

      if (itemId) {
          const itemToEdit = fooditem.find(
              (item) => item.foodId === itemId
          );
          console.log("Item to edit:", itemToEdit);
          if (itemToEdit) {
              console.log("Item found. Populating form with:", itemToEdit);
              $("#edit-name").val(itemToEdit.foodName);
              $("#edit-foodType").val(itemToEdit.foodType);
              $("#edit-description").val(itemToEdit.description || "");
              $("#edit-price").val(itemToEdit.price || "");
              $("#edit-imageURL").val(itemToEdit.imageURL || "");
              $("#edit-rating").val(itemToEdit.rating || "");
              $("#edit-foodId").val(itemToEdit.foodId || "");
          } else {
              console.error(
                  "Item to edit not found in fooditem array:",
                  itemId,
                  "fooditem array:",
                  fooditem
              );
          }
      } else {
          $("#edit-name").val("");
          $("#edit-foodType").val("");
          $("#edit-description").val("");
          $("#edit-price").val("");
          $("#edit-imageURL").val("");
          $("#edit-rating").val("");
          $("#edit-foodId").val("");
      }
  }

  function handleEditSubmit(event) {
      event.preventDefault();
      console.log("handleEditSubmit called, currentEditItemId:", currentEditItemId);
      const foodId = $("#edit-foodId").val();
      const name = $("#edit-name").val();
      const foodType = $("#edit-foodType").val();
      const description = $("#edit-description").val();
      const price = parseFloat($("#edit-price").val());
      const imageURL = $("#edit-imageURL").val();
      const rating = parseFloat($("#edit-rating").val());

      const foodItemDTO = {
          foodId: foodId,
          foodName: name,
          foodType: foodType,
          description: description,
          price: price,
          imageURL: imageURL,
          rating: rating,
          restaurant: {
              restaurantId: restaurantId,
          },
      };
      const API_URL = feast.API_URL;
      const addItemUrl = `${API_URL}/restaurant/addItem`;
      const updateItemUrl = `${API_URL}/restaurant/food-item/${currentEditItemId}`;
      const method = currentEditItemId ? "PUT" : "POST"; 

      $.ajax({
          url: currentEditItemId ? updateItemUrl : addItemUrl, 
          method: method, // Use the determined method
          contentType: "application/json",
          data: JSON.stringify(foodItemDTO),
          success: function (response) {
              console.log("Success:", response); 
              let updatedItem;
              if (method === "PUT") {
                updatedItem = response.details;
              }
              else{
                updatedItem = response;
              }

              if (method === "PUT") {
                  const indexToUpdate = fooditem.findIndex(
                      (item) => item.foodId === currentEditItemId
                  );
                  if (indexToUpdate !== -1) {
                      fooditem[indexToUpdate] = updatedItem;
                      fetchFoodItems();
                      renderProducts(fooditem);
                  }
              } else {
                  fooditem.push(updatedItem);
                  fetchFoodItems();
                  renderProducts(fooditem);
              }
              $editItemModal.modal("hide");
              currentEditItemId = null;
          },
          error: function (xhr, status, error) {
              console.error("Error:", xhr, status, error);
              const errmsg =
                  status + "! Error " + (method === "PUT" ? "updating" : "adding") + " item. Please try again later.";
              localStorage.setItem("errmsg", errmsg);
              window.location.href = `./layouts/404error.html`;
          },
      });
  }
});
