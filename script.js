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
    const quantityInput = document.getElementById('quantity');

    let products = JSON.parse(localStorage.getItem('products')) || [];
    let produtosJSON = [];

    // Função para focar no campo de código (pequeno timeout para evitar comportamento de alguns leitores)
    function focusIdentifier() {
        setTimeout(() => identifierInput.focus(), 50);
    }

    // Atualiza visibilidade/required do campo quantidade conforme o modo
    function updateModeUI() {
        if (modeSelect.value === 'incremento') {
            quantitySection.style.display = 'none';
            quantityInput.required = false;
        } else {
            quantitySection.style.display = 'block';
            quantityInput.required = true;
        }
        focusIdentifier();
    }

    // Inicializa UI do modo
    updateModeUI();

    // Troca de modo
    modeSelect.addEventListener('change', function () {
        updateModeUI();
    });

    // Carrega produtos.json (se existir)
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
            console.warn('produtos.json não encontrado ou erro ao carregar (tudo bem se não usar).', error);
            produtosJSON = [];
        }
    }

    loadProdutos();

    // Atualiza a tabela HTML a partir do array products
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

    // Função para adicionar/atualizar produto na lista
    form.addEventListener('submit', function (event) {
        event.preventDefault();

        const identifier = String(identifierInput.value || '').trim();
        if (!identifier) {
            alert('Informe o código ou código de barras.');
            focusIdentifier();
            return;
        }

        const mode = modeSelect.value;
        let quantity;

        if (mode === 'incremento') {
            // modo incremento: sempre +1 por leitura
            quantity = 1;
        } else {
            // modo manual: pega o valor do campo quantidade (valida)
            const q = parseInt(quantityInput.value, 10);
            if (Number.isNaN(q)) {
                alert('Quantidade inválida. Informe um número.');
                quantityInput.focus();
                return;
            }
            quantity = q;
            if (quantity < 0) {
                alert('Quantidade inválida!');
                quantityInput.focus();
                return;
            }
        }

        // procura produto existente (comparing trimmed strings)
        const existingProduct = products.find(p => String(p.identifier).trim() === identifier);
        if (existingProduct) {
            existingProduct.quantity = (parseInt(existingProduct.quantity, 10) || 0) + quantity;
        } else {
            products.push({ identifier, quantity });
        }

        // persiste e atualiza UI
        localStorage.setItem('products', JSON.stringify(products));
        updateTable();

        // limpa apenas o identificador e, se estiver em manual, limpa quantidade também
        identifierInput.value = '';
        if (mode === 'manual') quantityInput.value = '';

        focusIdentifier();
    });

    // Mantém foco após clicar em botões principais
    [generateFileButton, clearTableButton, removeLastButton].forEach(btn =>
        btn.addEventListener('click', focusIdentifier)
    );

    // Geração de CSV (mantendo apenas custo)
    generateFileButton.addEventListener('click', function () {
        try {
            if (products.length === 0) {
                alert('Não há produtos para exportar.');
                focusIdentifier();
                return;
            }

            let fileContent = 'Codigo;Descricao;Codigo de Barras;Marca;Quantidade;Pç/Custo;QtdXCusto\n';
            let totalQuantidade = 0, totalCusto = 0, totalGeral = 0;

            products.forEach(product => {
                const identifier = String(product.identifier).trim().toUpperCase();
                const match = produtosJSON.find(item =>
                    item.COD_BARRAS === identifier || item.CODIGO.toUpperCase() === identifier
                );

                if (match) {
                    const custoUnit = parseFloat(String(match.CUSTO_UNIT).replace(',', '.')) || 0;
                    const total = custoUnit * (parseInt(product.quantity, 10) || 0);
                    const custoFormatado = custoUnit.toFixed(2).replace('.', ',');
                    const totalFormatado = total.toFixed(2).replace('.', ',');

                    fileContent += `${match.CODIGO};${match.DESCRICAO};${match.COD_BARRAS};${match.MARCA};${product.quantity};${custoFormatado};${totalFormatado}\n`;

                    totalQuantidade += parseInt(product.quantity, 10) || 0;
                    // soma do custo unitário (se desejar o acumulado por unidade, manteho assim)
                    totalCusto += custoUnit * (parseInt(product.quantity, 10) || 0);
                    totalGeral += total;
                } else {
                    let codigo = '-', barras = '-';
                    const isCodigoBarras = identifier.length >= 8 && /^\d+$/.test(identifier);
                    if (isCodigoBarras) barras = identifier; else codigo = identifier;

                    fileContent += `${codigo};-;${barras};-;${product.quantity};-;-\n`;
                    totalQuantidade += parseInt(product.quantity, 10) || 0;
                }
            });

            // Linha de totais: ajustado totalCusto já considerando quantidade
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
            focusIdentifier();
        }
    });

    // Modal de confirmação para limpar tabela
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

    // Remover último item
    removeLastButton.addEventListener('click', function () {
        if (products.length > 0) {
            products.pop();
            localStorage.setItem('products', JSON.stringify(products));
            updateTable();
        }
        focusIdentifier();
    });

    // Editar um produto ao clicar na tabela (carrega nos campos para regravar)
    tableBody.addEventListener('click', function (event) {
        const row = event.target.closest('tr');
        if (row) {
            const index = parseInt(row.dataset.index, 10);
            if (!Number.isNaN(index)) {
                const product = products[index];
                identifierInput.value = product.identifier;
                quantityInput.value = product.quantity;
                // remove da lista para quando salvar novamente não duplicar
                products.splice(index, 1);
                localStorage.setItem('products', JSON.stringify(products));
                updateTable();
                focusIdentifier();
            }
        }
    });

    // foco inicial
    focusIdentifier();
});
