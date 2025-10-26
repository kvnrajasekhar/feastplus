$(document).ready(function() {
    const menuTableBody = $('#menuTable tbody');
    const addItemForm = $('#addItemForm');
    const addItemModal = $('#addItemModal');

    let menuItems = loadMenuItems();
    renderMenuItems();

    function loadMenuItems() {
        const storedItems = localStorage.getItem('menuItems');
        return storedItems ? JSON.parse(storedItems) : [
            { id: 1, name: 'Delicious Burger', category: 'Fast Food', price: 8.99 },
            { id: 2, name: 'Spaghetti Carbonara', category: 'Italian', price: 12.50 }
        ];
    }

    function saveMenuItems() {
        localStorage.setItem('menuItems', JSON.stringify(menuItems));
    }

    function renderMenuItems() {
        menuTableBody.empty();
        menuItems.forEach(item => {
            const row = `
                <tr>
                    <td>${item.id}</td>
                    <td>${item.name}</td>
                    <td>${item.category}</td>
                    <td>$${item.price.toFixed(2)}</td>
                    <td>
                        <button class="btn btn-sm btn-primary edit-btn" data-id="${item.id}">Edit</button>
                        <button class="btn btn-sm btn-danger delete-btn" data-id="${item.id}">Delete</button>
                    </td>
                </tr>
            `;
            menuTableBody.append(row);
        });

        // Attach event listeners to the newly created buttons
        attachActionListeners();
    }

    let nextItemId = menuItems.length > 0 ? Math.max(...menuItems.map(item => item.id)) + 1 : 1;

    addItemForm.on('submit', function(event) {
        event.preventDefault();
        const itemName = $('#itemName').val();
        const itemCategory = $('#itemCategory').val();
        const itemPrice = parseFloat($('#itemPrice').val());

        if (itemName && itemCategory && !isNaN(itemPrice)) {
            const newItem = {
                id: nextItemId++,
                name: itemName,
                category: itemCategory,
                price: itemPrice
            };
            menuItems.push(newItem);
            saveMenuItems();
            renderMenuItems();
            addItemModal.modal('hide');
            addItemForm[0].reset(); // Clear the form
        } else {
            alert('Please fill in all fields with valid data.');
        }
    });

    function attachActionListeners() {
        $('.delete-btn').on('click', function() {
            const itemIdToDelete = parseInt($(this).data('id'));
            menuItems = menuItems.filter(item => item.id !== itemIdToDelete);
            saveMenuItems();
            renderMenuItems();
        });

        $('.edit-btn').on('click', function() {
            const itemIdToEdit = parseInt($(this).data('id'));
            const itemToEdit = menuItems.find(item => item.id === itemIdToEdit);
            if (itemToEdit) {
                // For simplicity, we'll just log the item to the console for editing.
                // In a real application, you would populate a modal form for editing.
                console.log('Edit item:', itemToEdit);
                alert('Edit functionality is not fully implemented in this example.');
                // Implement your edit modal and logic here
            }
        });
    }
});