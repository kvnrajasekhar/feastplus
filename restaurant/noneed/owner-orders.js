$(document).ready(function() {
    const ordersTable = $('#ordersTable tbody');

    // Function to update the status badge
    function updateStatusBadge(orderId, newStatus) {
        const statusBadge = $(`[data-order-status="${orderId}"] span`);
        statusBadge.removeClass('bg-primary bg-warning bg-info bg-success');
        statusBadge.text(newStatus);
        switch (newStatus) {
            case 'New':
                statusBadge.addClass('bg-primary');
                break;
            case 'Preparing':
                statusBadge.addClass('bg-warning');
                break;
            case 'Delivered':
                statusBadge.addClass('bg-info');
                break;
            case 'Accepted':
                statusBadge.addClass('bg-success');
                statusBadge.text('Preparing'); // For the 'Accept' button, we'll set it to 'Preparing' initially
                break;
            default:
                statusBadge.addClass('bg-secondary');
                break;
        }
    }

    // Event listener for the status update buttons
    ordersTable.on('click', '.status-btn', function() {
        const orderId = $(this).data('order-id');
        const newStatus = $(this).data('status');

        // In a real application, you would send an AJAX request to the server
        // to update the order status in the database.

        updateStatusBadge(orderId, newStatus);

        // Optionally, you can disable other buttons for the same order
        // or provide visual feedback.
    });

    // In a real application, you would likely load the orders dynamically
    // from a server using an AJAX request when the page loads.
    // For this example, the orders are hardcoded in the HTML.
});