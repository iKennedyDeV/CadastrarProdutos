document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('productForm');
    const tableBody = document.querySelector('#productTable tbody');
    const generateFileButton = document.getElementById('generateFile');
    const clearTableButton = document.getElementById('clearTable');
    const removeLastButton = document.getElementById('removeLast');
    const confirmationModal = document.getElementById('confirmationModal');
    const confirmClearButton = document.getElementById('confirmClearTable');
    const cancelClearButton = document.getElementById('cancelClearTable');

    let products = JSON.parse(localStorage.getItem('products')) || [];
    let produtosJSON = [];

    // Função para carregar o arquivo JSON
    async function loadProdutos() {
        try {
            const response = await fetch('produtos.json');
            if (!response.ok) {
                throw new Error('Erro ao carregar o arquivo JSON');
            }
            produtosJSON = await response.json();
        } catch (error) {
            console.error('Erro ao carregar os dados do JSON:', error);
        }
    }

    // Chama a função de carregamento do JSON
    loadProdutos();

    // Atualiza a tabela com os dados armazenados
    function updateTable() {
        tableBody.innerHTML = '';
        products.forEach((product, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.barcode}</td>
                <td>${product.quantity}</td>
            `;
            row.dataset.index = index;
            tableBody.appendChild(row);
        });
    }

    // Atualiza a tabela na inicialização
    updateTable();

    // Adiciona ou atualiza um produto na lista
    form.addEventListener('submit', function (event) {
        event.preventDefault();

        const barcode = String(document.getElementById('barcode').value).trim();
        const quantity = parseInt(document.getElementById('quantity').value, 10);

        if (!barcode || isNaN(quantity) || quantity <= 0) {
            alert('Por favor, insira um código de barras válido e uma quantidade positiva.');
            return;
        }

        const existingProduct = products.find(product => product.barcode === barcode);
        if (existingProduct) {
            existingProduct.quantity += quantity;
        } else {
            products.push({ barcode, quantity });
        }

        localStorage.setItem('products', JSON.stringify(products));
        updateTable();
        form.reset();
    });

    // Gera o arquivo CSV com os dados da tabela e do JSON
    generateFileButton.addEventListener('click', function () {
        try {
            let fileContent = 'Código Copafer,Detalhe,Código de Barras,Quantidade,Fora de Linha\n';
            products.forEach(product => {
                const matchingProduct = produtosJSON.find(item => item["Código de Barras"] === product.barcode);
                if (matchingProduct) {
                    fileContent += `${matchingProduct["CÓDIGO"]},${matchingProduct["DESCRIÇÃO"]},${product.barcode},${product.quantity},${matchingProduct["DESCRIÇÃOSITUAÇÃO"]}\n`;
                } else {
                    fileContent += ` - , - ,${product.barcode},${product.quantity}, - \n`;
                }
            });

            const blob = new Blob([fileContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'produtos.csv';
            link.click();
        } catch (error) {
            console.error('Erro ao gerar o arquivo CSV:', error);
            alert('Ocorreu um erro ao gerar o arquivo CSV. Verifique o console para mais informações.');
        }
    });

    // Limpa a tabela e o localStorage
    clearTableButton.addEventListener('click', function () {
        confirmationModal.style.display = 'block';
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

    removeLastButton.addEventListener('click', function () {
        if (products.length > 0) {
            products.pop();
            localStorage.setItem('products', JSON.stringify(products));
            updateTable();
        }
    });

    tableBody.addEventListener('click', function (event) {
        const row = event.target.closest('tr');
        if (row) {
            const index = row.dataset.index;
            const product = products[index];

            document.getElementById('barcode').value = product.barcode;
            document.getElementById('quantity').value = product.quantity;

            products.splice(index, 1);
            localStorage.setItem('products', JSON.stringify(products));
            updateTable();
        }
    });
});
