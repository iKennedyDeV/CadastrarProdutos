document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('productForm');
    const tableBody = document.querySelector('#productTable tbody');
    const generateFileButton = document.getElementById('generateFile');
    const clearTableButton = document.getElementById('clearTable');
    const removeLastButton = document.getElementById('removeLast');
    const confirmationModal = document.getElementById('confirmationModal');
    const confirmClearButton = document.getElementById('confirmClearTable');
    const cancelClearButton = document.getElementById('cancelClearTable');
    const validityInput = document.getElementById('validity');

    let products = JSON.parse(localStorage.getItem('products')) || [];
    let produtosJSON = [];

    // Máscara automática para validade MM/AA ou DD/MM/AA
    validityInput.addEventListener('input', function (e) {
        let value = e.target.value.replace(/\D/g, '');

        if (value.length <= 4) {
            // MM/AA
            value = value.slice(0, 2) + (value.length > 2 ? '/' + value.slice(2) : '');
        } else if (value.length <= 6) {
            // DD/MM/AA
            value = value.slice(0, 2) + '/' + value.slice(2, 4) + '/' + value.slice(4);
        }

        e.target.value = value;
    });

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

    loadProdutos();

    function updateTable() {
        tableBody.innerHTML = '';
        products.forEach((product, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${product.identifier}</td><td>${product.quantity}</td><td>${product.validity || '-'}</td>`;
            row.dataset.index = index;
            tableBody.appendChild(row);
        });
    }

    updateTable();

    form.addEventListener('submit', function (event) {
        event.preventDefault();

        const identifier = String(document.getElementById('identifier').value).trim();
        const quantity = parseInt(document.getElementById('quantity').value, 10);
        const validity = document.getElementById('validity').value.trim();

        const isMMYY = /^\d{2}\/\d{2}$/.test(validity);
        const isDDMMYY = /^\d{2}\/\d{2}\/\d{2}$/.test(validity);

        if (validity && !(isMMYY || isDDMMYY)) {
            alert('Formato de validade inválido. Use MM/AA ou DD/MM/AA.');
            return;
        }

        const existingProduct = products.find(product => product.identifier === identifier);

        if (existingProduct) {
            existingProduct.quantity += quantity;
            existingProduct.validity = validity;
        } else {
            products.push({ identifier, quantity, validity });
        }

        localStorage.setItem('products', JSON.stringify(products));
        updateTable();
        form.reset();
        document.getElementById('identifier').focus();
    });

    generateFileButton.addEventListener('click', function () {
        try {
            // Cabeçalho atualizado → inclui "Total"
            let fileContent = 'Codigo;Descricao;Codigo de Barras;Quantidade;Validade;Marca;Preco;Qtd/Valor\n';

            products.forEach(product => {
                const identifier = product.identifier;
                const matchingProduct = produtosJSON.find(item =>
                    item["Código de Barras"] === identifier || item["CÓDIGO"] === identifier
                );

                // Ajusta validade: se for MM/AA → 30/MM/AA
                let validadeFormatada = product.validity || '-';
                if (/^\d{2}\/\d{2}$/.test(validadeFormatada)) {
                    validadeFormatada = '30/' + validadeFormatada;
                }

                if (matchingProduct) {
                    const preco = matchingProduct["PREÇO"] ?? 0;
                    const total = preco * product.quantity;

                    // Formata preço e total em moeda BRL
                    const precoFormatado = preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                    const totalFormatado = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

                    fileContent += `${matchingProduct["CÓDIGO"]};${matchingProduct["DESCRIÇÃO"]};${matchingProduct["Código de Barras"]};${product.quantity};${validadeFormatada};${matchingProduct["MARCA"]};${precoFormatado};${totalFormatado}\n`;
                } else {
                    let codigo = '-';
                    let barras = '-';
                    const isCodigoBarras = identifier.length >= 8 && /^\d+$/.test(identifier);
                    if (isCodigoBarras) {
                        barras = identifier;
                    } else {
                        codigo = identifier;
                    }
                    // Sem preço → Total também fica "-"
                    fileContent += `${codigo};-;${barras};${product.quantity};${validadeFormatada};-;-;-\n`;
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

    tableBody.addEventListener('click', function(event) {
        const row = event.target.closest('tr');
        if (!row) return;

        const index = parseInt(row.dataset.index, 10);
        if (isNaN(index)) return;

        const product = products[index];

        // Coloca os valores atuais no formulário para edição
        document.getElementById('identifier').value = product.identifier;
        document.getElementById('quantity').value = product.quantity;
        document.getElementById('validity').value = product.validity || '';

        // Remove do array para evitar duplicação no submit
        products.splice(index, 1);
        localStorage.setItem('products', JSON.stringify(products));
        updateTable();
    });

});acrescente a coluna que multiplica a quantidade com  o valor do produto 
