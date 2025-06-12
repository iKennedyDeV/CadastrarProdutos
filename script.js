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

    // Função para normalizar códigos
    function normalizeCode(code) {
        return String(code).trim().replace(/^0+/, '').toUpperCase();
    }

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
                codigoNormalizado: normalizeCode(item["CÓDIGO"]),
                barrasNormalizado: normalizeCode(item["Código de Barras"])
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
            row.innerHTML = `
                <td>${product.identifier}</td>
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

            // Validação antecipada (opcional)
            const invalids = products.filter(product => {
                const userCode = normalizeCode(product.identifier);
                return !produtosJSON.find(item =>
                    item.barrasNormalizado === userCode || item.codigoNormalizado === userCode
                );
            });

            if (invalids.length > 0) {
                alert(`Alguns produtos não foram encontrados no JSON:\n${invalids.map(p => p.identifier).join('\n')}`);
            }

            products.forEach(product => {
    const userCode = normalizeCode(product.identifier);

    const matchingProduct = produtosJSON.find(item =>
        item.barrasNormalizado === userCode || item.codigoNormalizado === userCode
    );

    const codigo = matchingProduct ? matchingProduct["CÓDIGO"] : 'NÃO ENCONTRADO';
    const descricao = matchingProduct ? matchingProduct["DESCRIÇÃO"] : 'NÃO ENCONTRADO';
    const barras = matchingProduct ? matchingProduct["Código de Barras"] : 'NÃO ENCONTRADO';
    const marca = matchingProduct ? matchingProduct["MARCA"] : 'NÃO ENCONTRADO';

    fileContent += `${codigo};${descricao};${barras};${product.quantity};${marca}\n`;
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