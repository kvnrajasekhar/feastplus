$(document).ready(function() {
    const restaurantNameDisplay = $('.restaurant-name-display');
    const storedName = localStorage.getItem('restaurantName');
    if (storedName) {
        restaurantNameDisplay.text(storedName);
    }
});