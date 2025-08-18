document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('productForm');
    const tableBody = document.querySelector('#productTable tbody');
    const generateFileButton = document.getElementById('generateFile');
    const clearTableButton = document.getElementById('clearTable');
    const removeLastButton = document.getElementById('removeLast');
    const confirmationModal = document.getElementById('confirmationModal');
    const confirmClearButton = document.getElementById('confirmClearTable');
    const cancelClearButton = document.getElementById('cancelClearTable');

    // Modal de edição
    const editModal = document.getElementById('editModal');
    const confirmEditButton = document.getElementById('confirmEdit');
    const cancelEditButton = document.getElementById('cancelEdit');
    const editMessage = document.getElementById('editMessage');

    let editIndex = null;
    let products = JSON.parse(localStorage.getItem('products')) || [];
    let produtosJSON = [];

    // Carrega produtos JSON (com preços, descrições etc)
    async function loadProdutos() {
        try {
            const response = await fetch('produtos.json');
            if (!response.ok) throw new Error('Erro ao carregar JSON');
            const jsonData = await response.json();
            produtosJSON = jsonData.map(item => ({
                ...item,
                "Código de Barras": String(item["Código de Barras"]).trim(),
                "CÓDIGO": String(item["CÓDIGO"]).trim()
            }));
        } catch (error) {
            console.error('Erro ao carregar JSON:', error);
        }
    }
    loadProdutos();

    // Atualiza tabela
    function updateTable() {
        tableBody.innerHTML = '';
        products.forEach((product, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${product.identifier}</td><td>${product.quantity}</td>`;
            row.dataset.index = index;
            tableBody.appendChild(row);
        });
    }
    updateTable();

    // Adiciona produto
   form.addEventListener('submit', function (event) {
    event.preventDefault();

    const identifier = document.getElementById('identifier').value.trim();
    const quantity = parseInt(document.getElementById('quantity').value);

    if (!identifier || isNaN(quantity) || quantity <= 0) {
        alert("Preencha código e quantidade corretamente!");
        return;
    }

    // Se estiver editando, substitui o item
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



    // Gerar CSV
    generateFileButton.addEventListener('click', function () {
        try {
            let fileContent = 'Codigo;Descricao;Codigo de Barras;Quantidade;Marca;Preco;Total\n';

            products.forEach(product => {
                const identifier = product.identifier;

                const matchingProduct = produtosJSON.find(item =>
                    item["Código de Barras"] === identifier || item["CÓDIGO"] === identifier
                );

                if (matchingProduct) {
                    const preco = Number(matchingProduct["PREÇO"]) || 0;
                    const total = preco * product.quantity;

                    fileContent += `${matchingProduct["CÓDIGO"]};${matchingProduct["DESCRIÇÃO"]};${matchingProduct["Código de Barras"]};${product.quantity};${matchingProduct["MARCA"]};${preco};${total}\n`;
                } else {
                    let codigo = '-';
                    let barras = '-';
                    const isCodigoBarras = identifier.length >= 8 && /^\d+$/.test(identifier);
                    if (isCodigoBarras) {
                        barras = identifier;
                    } else {
                        codigo = identifier;
                    }
                    fileContent += `${codigo};-;${barras};${product.quantity};-;-;-\n`;
                }
            });

            const blob = new Blob([fileContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'produtos.csv';
            link.click();
        } catch (error) {
            console.error('Erro ao gerar CSV:', error);
            alert('Erro ao gerar o arquivo CSV.');
        }
    });

    // Limpar tabela (modal)
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

    // Remover último
    removeLastButton.addEventListener('click', function () {
        if (products.length > 0) {
            products.pop();
            localStorage.setItem('products', JSON.stringify(products));
            updateTable();
        }
    });

    // Clique na tabela → abre modal de edição
    tableBody.addEventListener('click', function (event) {
        const row = event.target.closest('tr');
