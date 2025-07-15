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

    // Função para carregar o arquivo JSON e normalizar os dados
    async function loadProdutos() {
        try {
            const response = await fetch('produtos.json');
            if (!response.ok) {
                throw new Error('Erro ao carregar o arquivo JSON');
            }
            const jsonData = await response.json();
            produtosJSON = jsonData.map(item => ({
                ...item,
                "Código de Barras": String(item["Código de Barras"]).trim(),
                "CÓDIGO": String(item["CÓDIGO"]).trim()
            }));
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
            row.innerHTML = `<td>${product.identifier}</td><td>${product.quantity}</td>`;
            row.dataset.index = index;
            tableBody.appendChild(row);
        });
    }

    // Atualiza a tabela na inicialização
    updateTable();

    // Adiciona ou atualiza um produto na lista
    form.addEventListener('submit', function (event) {
        event.preventDefault();

        const identifier = String(document.getElementById('identifier').value).trim();
        const quantity = parseInt(document.getElementById('quantity').value, 10);

        const existingProduct = products.find(product => product.identifier === identifier);
        if (existingProduct) {
            existingProduct.quantity += quantity;
        } else {
            products.push({ identifier, quantity });
        }

        localStorage.setItem('products', JSON.stringify(products));
        updateTable();
        form.reset();
        document.getElementById('identifier').focus();
    });

    // Gera o arquivo CSV com os dados da tabela e do JSON
    generateFileButton.addEventListener('click', function () {
        try {
            let fileContent = 'Codigo;Descricao;Codigo de Barras;Quantidade;Marca\n';

            products.forEach(product => {
                const identifier = product.identifier;
                const matchingProduct = produtosJSON.find(item =>
                    item["Código de Barras"] === identifier || item["CÓDIGO"] === identifier
                );

                if (matchingProduct) {
                    fileContent += `${matchingProduct["CÓDIGO"]};${matchingProduct["DESCRIÇÃO"]};${matchingProduct["Código de Barras"]};${product.quantity};${matchingProduct["MARCA"]}\n`;
                } else {
                    // Decide onde colocar o código não encontrado
                    let codigo = '-';
                    let barras = '-';

                    const isCodigoBarras = identifier.length >= 8 && /^\d+$/.test(identifier);
                    if (isCodigoBarras) {
                        barras = identifier;
                    } else {
                        codigo = identifier;
                    }

                    fileContent += `${codigo};-;${barras};${product.quantity};-\n`;
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

    // Remove o último produto da lista
    removeLastButton.addEventListener('click', function () {
        if (products.length > 0) {
            products.pop();
            localStorage.setItem('products', JSON.stringify(products));
            updateTable();
        }
    });

    // Permite editar um produto ao clicar na tabela
    tableBody.addEventListener('click', function (event) {
        const row = event.target.closest('tr');
        if (row) {
            const index = row.dataset.index;
            const product = products[index];

            document.getElementById('identifier').value = product.identifier;
            document.getElementById('quantity').value = product.quantity;

            products.splice(index, 1);
            localStorage.setItem('products', JSON.stringify(products));
            updateTable();
        }
    });
});
