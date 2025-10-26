$(document).ready(function() {
    const profileForm = $('#profileForm');
    const restaurantNameInput = $('#restaurantName');

    // Load existing restaurant name from localStorage if available
    const storedName = localStorage.getItem('restaurantName');
    if (storedName) {
        restaurantNameInput.val(storedName);
    }

    profileForm.on('submit', function(event) {
        event.preventDefault();
        const newRestaurantName = restaurantNameInput.val();
        localStorage.setItem('restaurantName', newRestaurantName);
        alert('Profile updated successfully!'); // You can replace this with a better UI notification
    });
});