document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('productForm');
    const tableBody = document.querySelector('#productTable tbody');
    const generateFileButton = document.getElementById('generateFile');
    const clearTableButton = document.getElementById('clearTable');
    const removeLastButton = document.getElementById('removeLast');
    const confirmationModal = document.getElementById('confirmationModal');
    const confirmClearButton = document.getElementById('confirmClearTable');
    const cancelClearButton = document.getElementById('cancelClearTable');
    const modeSelect = document.getElementById('mode');
    const quantitySection = document.getElementById('quantitySection');
    const identifierInput = document.getElementById('identifier');

    let products = JSON.parse(localStorage.getItem('products')) || [];
    let produtosJSON = [];

    // Mantém foco sempre no campo de código
    function focusIdentifier() {
        setTimeout(() => identifierInput.focus(), 50);
    }

    // Exibir ou ocultar campo de quantidade conforme o modo
    modeSelect.addEventListener('change', function () {
        if (modeSelect.value === 'incremento') {
            quantitySection.style.display = 'none';
        } else {
            quantitySection.style.display = 'block';
        }
        focusIdentifier();
    });

    async function loadProdutos() {
        try {
            const response = await fetch('produtos.json');
            if (!response.ok) throw new Error('Erro ao carregar o arquivo JSON');
            const jsonData = await response.json();

            produtosJSON = jsonData.map(item => ({
                CODIGO: String(item["CODIGO"]).trim(),
                COD_BARRAS: String(item["COD BARRAS"]).trim(),
                DESCRICAO: item["DESCRICAO"] || "",
                FABRICANTE: item["FABRICANTE"] || "",
                MARCA: item["MARCA"] || "",
                CUSTO_UNIT: item["CUSTO UNIT."] || "0"
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
            row.innerHTML = `<td>${product.identifier}</td><td>${product.quantity}</td>`;
            row.dataset.index = index;
            tableBody.appendChild(row);
        });
    }

    updateTable();

    form.addEventListener('submit', function (event) {
        event.preventDefault();

        const identifier = String(identifierInput.value).trim();
        const mode = modeSelect.value;
        let quantity = mode === 'manual'
            ? parseInt(document.getElementById('quantity').value, 10) || 0
            : 1;

        if (quantity < 0) {
            alert('Quantidade inválida!');
            return;
        }

        const existingProduct = products.find(p => p.identifier === identifier);
        if (existingProduct) {
            existingProduct.quantity += quantity;
        } else {
            products.push({ identifier, quantity });
        }

        localStorage.setItem('products', JSON.stringify(products));
        updateTable();
        form.reset();
        focusIdentifier();
    });

    // Mantém foco mesmo ao gerar arquivo ou limpar tabela
    [generateFileButton, clearTableButton, removeLastButton].forEach(btn =>
        btn.addEventListener('click', focusIdentifier)
    );

    // CSV SEM preço de venda
    generateFileButton.addEventListener('click', function () {
        try {
            let fileContent = 'Codigo;Descricao;Codigo de Barras;Marca;Quantidade;Pç/Custo;QtdXCusto\n';
            let totalQuantidade = 0, totalCusto = 0, totalGeral = 0;

            products.forEach(product => {
                const identifier = product.identifier.trim().toUpperCase();
                const match = produtosJSON.find(item =>
                    item.COD_BARRAS === identifier || item.CODIGO.toUpperCase() === identifier
                );

                if (match) {
                    const custoUnit = parseFloat(match.CUSTO_UNIT.toString().replace(',', '.')) || 0;
                    const total = custoUnit * product.quantity;
                    const custoFormatado = custoUnit.toFixed(2).replace('.', ',');
                    const totalFormatado = total.toFixed(2).replace('.', ',');

                    fileContent += `${match.CODIGO};${match.DESCRICAO};${match.COD_BARRAS};${match.MARCA};${product.quantity};${custoFormatado};${totalFormatado}\n`;

                    totalQuantidade += product.quantity;
                    totalCusto += custoUnit;
                    totalGeral += total;
                } else {
                    let codigo = '-', barras = '-';
                    const isCodigoBarras = identifier.length >= 8 && /^\d+$/.test(identifier);
                    if (isCodigoBarras) barras = identifier; else codigo = identifier;

                    fileContent += `${codigo};-;${barras};-;${product.quantity};-;-\n`;
                    totalQuantidade += product.quantity;
                }
            });

            fileContent += `TOTAL;-;-;-;${totalQuantidade};${totalCusto.toFixed(2).replace('.', ',')};${totalGeral.toFixed(2).replace('.', ',')}\n`;

            const blob = new Blob([fileContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'produtos.csv';
            link.click();

            focusIdentifier();
        } catch (error) {
            console.error('Erro ao gerar o arquivo CSV:', error);
            alert('Erro ao gerar o arquivo CSV.');
        }
    });

    clearTableButton.addEventListener('click', () => confirmationModal.style.display = 'block');
    cancelClearButton.addEventListener('click', () => {
        confirmationModal.style.display = 'none';
        focusIdentifier();
    });
    confirmClearButton.addEventListener('click', () => {
        products = [];
        localStorage.removeItem('products');
        updateTable();
        confirmationModal.style.display = 'none';
        focusIdentifier();
    });

    removeLastButton.addEventListener('click', function () {
        if (products.length > 0) {
            products.pop();
            localStorage.setItem('products', JSON.stringify(products));
            updateTable();
        }
        focusIdentifier();
    });

    tableBody.addEventListener('click', function (event) {
        const row = event.target.closest('tr');
        if (row) {
            const index = row.dataset.index;
            const product = products[index];
            identifierInput.value = product.identifier;
            document.getElementById('quantity').value = product.quantity;
            products.splice(index, 1);
            localStorage.setItem('products', JSON.stringify(products));
            updateTable();
            focusIdentifier();
        }
    });

    // Foco inicial
    focusIdentifier();
});
