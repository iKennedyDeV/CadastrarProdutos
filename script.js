document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('productForm');
    const tableBody = document.querySelector('#productTable tbody');
    const generateFileButton = document.getElementById('generateFile');
    const clearTableButton = document.getElementById('clearTable');
    const removeLastButton = document.getElementById('removeLast');
    const confirmationModal = document.getElementById('confirmationModal');
    const confirmClearButton = document.getElementById('confirmClearTable');
    const cancelClearButton = document.getElementById('cancelClearTable');
    const useValidityCheckbox = document.getElementById('useValidity');
    const validityContainer = document.getElementById('validityContainer');
    const validityInput = document.getElementById('validity');

    let products = JSON.parse(localStorage.getItem('products')) || [];
    let produtosJSON = [];

    useValidityCheckbox.addEventListener('change', function () {
        validityContainer.style.display = this.checked ? 'block' : 'none';
    });

    validityInput.addEventListener('input', function (e) {
        let v = this.value.replace(/\D/g, ''); // Remove não numéricos
        if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
        if (v.length > 5) v = v.slice(0, 5) + '/' + v.slice(5, 9);
        this.value = v;
    });

    async function loadProdutos() {
        try {
            const response = await fetch('produtos.json');
            if (!response.ok) throw new Error('Erro ao carregar o arquivo JSON');
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
            row.innerHTML = `<td>${product.identifier}</td><td>${product.quantity}</td>`;
            row.dataset.index = index;
            tableBody.appendChild(row);
        });
    }

    updateTable();

    form.addEventListener('submit', function (event) {
        event.preventDefault();

        const identifier = String(document.getElementById('identifier').value).trim();
        const quantity = parseInt(document.getElementById('quantity').value, 10);
        let validity = '';

        if (useValidityCheckbox.checked) {
            validity = validityInput.value.trim();
            const isValidDate = /^\d{2}\/\d{2}\/\d{4}$/.test(validity);
            if (!isValidDate) {
                alert('Por favor, insira a validade no formato dd/mm/yyyy.');
                validityInput.focus();
                return;
            }
        }

        const existingProduct = products.find(product => product.identifier === identifier);
        if (existingProduct) {
            existingProduct.quantity += quantity;
            if (useValidityCheckbox.checked) {
                existingProduct.validity = validity;
            }
        } else {
            products.push({ identifier, quantity, validity });
        }

        localStorage.setItem('products', JSON.stringify(products));
        updateTable();
        form.reset();
        validityContainer.style.display = useValidityCheckbox.checked ? 'block' : 'none';
        document.getElementById('identifier').focus();
    });

    generateFileButton.addEventListener('click', function () {
        try {
            let fileContent = 'Codigo;Descricao;Codigo de Barras;Quantidade;';
            const usarValidade = products.some(p => p.validity); // Inclui validade se pelo menos um produto tiver
            if (usarValidade) {
                fileContent += 'Validade;';
            }
            fileContent += 'Marca\n';

            products.forEach(product => {
                const identifier = product.identifier;
                const matchingProduct = produtosJSON.find(item =>
                    item["Código de Barras"] === identifier || item["CÓDIGO"] === identifier
                );

                const validade = usarValidade ? (product.validity || '-') : null;

                if (matchingProduct) {
                    fileContent += `${matchingProduct["CÓDIGO"]};${matchingProduct["DESCRIÇÃO"]};${matchingProduct["Código de Barras"]};${product.quantity};`;
                    if (usarValidade) fileContent += `${validade};`;
                    fileContent += `${matchingProduct["MARCA"]}\n`;
                } else {
                    let codigo = '-', barras = '-';
                    const isCodigoBarras = identifier.length >= 8 && /^\d+$/.test(identifier);
                    if (isCodigoBarras) barras = identifier;
                    else codigo = identifier;

                    fileContent += `${codigo};-;${barras};${product.quantity};`;
                    if (usarValidade) fileContent += `${validade};`;
                    fileContent += `-\n`;
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

    tableBody.addEventListener('click', function (event) {
        const row = event.target.closest('tr');
        if (row) {
            const index = row.dataset.index;
            const product = products[index];

            document.getElementById('identifier').value = product.identifier;
            document.getElementById('quantity').value = product.quantity;
            if (product.validity) {
                useValidityCheckbox.checked = true;
                validityContainer.style.display = 'block';
                validityInput.value = product.validity;
            } else {
                useValidityCheckbox.checked = false;
                validityContainer.style.display = 'none';
                validityInput.value = '';
            }

            products.splice(index, 1);
            localStorage.setItem('products', JSON.stringify(products));
            updateTable();
        }
    });
});