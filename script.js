document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('productForm');
    const tableBody = document.querySelector('#productTable tbody');
    const generateFileButton = document.getElementById('generateFile');
    const clearTableButton = document.getElementById('clearTable');
    const removeLastButton = document.getElementById('removeLast');
    const confirmationModal = document.getElementById('confirmationModal');
    const confirmClearButton = document.getElementById('confirmClearTable');
    const cancelClearButton = document.getElementById('cancelClearTable');

    const editModal = document.getElementById('editModal');
    const confirmEditButton = document.getElementById('confirmEdit');
    const cancelEditButton = document.getElementById('cancelEdit');
    const editMessage = document.getElementById('editMessage');

    let products = JSON.parse(localStorage.getItem('products')) || [];
    let editIndex = null;

    function updateTable() {
        tableBody.innerHTML = '';
        products.forEach((product, index) => {
            const row = document.createElement('tr');
            row.dataset.index = index;
            row.innerHTML = `<td>${product.identifier}</td><td>${product.quantity}</td>`;
            tableBody.appendChild(row);
        });
    }

    updateTable();

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        const identifier = document.getElementById('identifier').value.trim();
        const quantity = parseInt(document.getElementById('quantity').value);

        if (!identifier || isNaN(quantity) || quantity <= 0) {
            alert("Preencha código e quantidade corretamente!");
            return;
        }

        if (editIndex !== null) {
            products[editIndex] = { identifier, quantity };
            editIndex = null;
        } else {
            products.push({ identifier, quantity });
        }

        localStorage.setItem('products', JSON.stringify(products));
        updateTable();
        form.reset();
    });

    tableBody.addEventListener('click', function (event) {
        const row = event.target.closest('tr');
        if (!row) return;
        editIndex = row.dataset.index;
        const product = products[editIndex];
        editMessage.textContent = `Deseja editar o item:\nCódigo: ${product.identifier}\nQuantidade: ${product.quantity}?`;
        editModal.style.display = 'flex';
    });

    confirmEditButton.addEventListener('click', function () {
        const product = products[editIndex];
        document.getElementById('identifier').value = product.identifier;
        document.getElementById('quantity').value = product.quantity;
        editModal.style.display = 'none';
        products.splice(editIndex, 1);
        localStorage.setItem('products', JSON.stringify(products));
        updateTable();
    });

    cancelEditButton.addEventListener('click', function () {
        editModal.style.display = 'none';
        editIndex = null;
    });

    removeLastButton.addEventListener('click', function () {
        if (products.length > 0) {
            products.pop();
            localStorage.setItem('products', JSON.stringify(products));
            updateTable();
        }
    });

    clearTableButton.addEventListener('click', function () {
        confirmationModal.style.display = 'flex';
    });

    cancelClearButton.addEventListener('click', function () {
        confirmationModal.style.display = 'none';
    });

    confirmClearButton.addEventListener('click', function () {
        products = [];
        localStorage.removeItem('products');
        updateTable();
        confirmationModal.style.display = 'none';
    });

    generateFileButton.addEventListener('click', function () {
        if (products.length === 0) {
            alert("Nenhum produto para gerar CSV!");
            return;
        }
        let fileContent = 'Codigo;Quantidade\n';
        products.forEach(p => {
            fileContent += `${p.identifier};${p.quantity}\n`;
        });
        const blob = new Blob([fileContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'produtos.csv';
        link.click();
    });
});
