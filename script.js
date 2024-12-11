
const produtos = [{
    "CÓDIGO": 98485,
    "DESCRIÇÃO": "* 1 INTER.BIPOLAR SIM.C/PLACA 20A 4X2*BLAN 590 FAM",
    "Código de Barras": 7896039705909,
    "DESCRIÇÃOSITUAÇÃO": "FORA DE LINHA",
    "MARCA": "FAME",
}, {
    "CÓDIGO": 673307,
    "DESCRIÇÃO": "* 1 INTERR.BIPOLAR PARALELO 10A/250V WALMA",
    "Código de Barras": 7897916723214,
    "DESCRIÇÃOSITUAÇÃO": "FORA DE LINHA",
    "MARCA": "WALMA",
}]; 

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('productForm');
    const tableBody = document.querySelector('#productTable tbody');
    const generateFileButton = document.getElementById('generateFile');
    const clearTableButton = document.getElementById('clearTable');
    const removeLastButton = document.getElementById('removeLast');
    const confirmationModal = document.getElementById('confirmationModal');
    const confirmClearButton = document.getElementById('confirmClearTable');
    const cancelClearButton = document.getElementById('cancelClearTable'); 

    // Recupera produtos do localStorage
    let products = JSON.parse(localStorage.getItem('products')) || []; 

    // Atualiza a tabela com os dados armazenados
    function updateTable() {
        tableBody.innerHTML = ''; // Limpa as linhas existentes
        products.forEach((product, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.barcode}</td>
                <td>${product.quantity}</td>
            `;
            row.dataset.index = index; // Adiciona o índice para identificação
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

        // Verifica se o produto já existe pelo código de barras
        const existingProduct = products.find(product => product.barcode === barcode);
        if (existingProduct) {
            // Atualiza a quantidade do produto existente
            existingProduct.quantity += quantity;
        } else {
            // Adiciona um novo produto
            products.push({
                barcode,
                quantity
            });
        } 

        // Atualiza o localStorage e a tabela
        localStorage.setItem('products', JSON.stringify(products));
        updateTable(); 

        // Limpa o formulário
        form.reset();
    }); 

    // Gera o arquivo CSV com os dados da tabela e dados do JSON
    generateFileButton.addEventListener('click', function () {
        try {
            let fileContent = 'Código Copafer,Detalhe,Código de Barras,Quantidade,Fora de Linha\n';
            products.forEach(product => {
                // Encontrar os valores correspondentes no objeto 'produtos'
                const matchingProduct = produtos.find(item => item["Código de Barras"] === product.barcode);
                if (matchingProduct) {
                    fileContent += `${matchingProduct["CÓDIGO"]},${matchingProduct["DESCRIÇÃO"]},${product.barcode},${product.quantity},${matchingProduct["DESCRIÇÃOSITUAÇÃO"]}\n`;
                } else {
                    fileContent += ` - , - ,${product.barcode},${product.quantity},-\n`;
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

    // Fecha o modal sem fazer nada
    cancelClearButton.addEventListener('click', function () {
        confirmationModal.style.display = 'none';
    }); 

    // Limpa a tabela e fecha o modal
    confirmClearButton.addEventListener('click', function () {
        products = [];
        localStorage.removeItem('products');
        updateTable();
        confirmationModal.style.display = 'none';
    }); 

    // Remove o último produto da tabela
    removeLastButton.addEventListener('click', function () {
        if (products.length > 0) {
            products.pop();
            localStorage.setItem('products', JSON.stringify(products));
            updateTable();
        }
    }); 

    // Permite editar uma linha da tabela ao clicar nela
    tableBody.addEventListener('click', function (event) {
        const row = event.target.closest('tr');
        if (row) {
            const index = row.dataset.index; // Obtém o índice da linha clicada
            const product = products[index]; 

            // Preenche o formulário com os dados da linha selecionada
            document.getElementById('barcode').value = product.barcode;
            document.getElementById('quantity').value = product.quantity; 

            // Remove o produto temporariamente para permitir edição
            products.splice(index, 1);
            localStorage.setItem('products', JSON.stringify(products));
            updateTable();
        }
    });
});
