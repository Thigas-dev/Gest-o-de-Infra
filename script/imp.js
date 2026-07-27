// Dados simulados baseados na planilha (Prontos para serem substituídos via SQL futuramente)
let dadosImpressoras = [
    { id: 1, host: "Imp-AdmBS", ip: "10.0.2.18", modelo: "DCP-L5652DN", marca: "BROTHER", serial: "U64198L7N608948", status: "Na Rede" },
    { id: 2, host: "Imp-AdmEnfermagem", ip: "10.0.2.9", modelo: "DCP-L5652DN", marca: "BROTHER", serial: "U64198L9N303969", status: "Na Rede" },
    { id: 3, host: "Imp-Cons01", ip: "10.0.2.3", modelo: "ES5112", marca: "OKI", serial: "AK7B026659", status: "Na Rede" },
    { id: 4, host: "RESERVA", ip: "0.0.0.0", modelo: "ES5112", marca: "OKI", serial: "AK98018324", status: "Reserva" },
    { id: 5, host: "Scanner-Faturamento", ip: "10.0.2.24", modelo: "ADS-2800W", marca: "BROTHER", serial: "U64278K9G322527", status: "Na Rede" },
    { id: 6, host: "Imp-Triagem-01", ip: "10.0.2.19", modelo: "ES5112", marca: "OKI", serial: "AK8B038135", status: "Na Rede" }
];

// Função que monta o HTML de cada card
function renderCards(data) {
    const grid = document.getElementById('printersGrid');
    
    // Limpa o grid antes de montar os novos cards
    grid.innerHTML = '';

    data.forEach(item => {
        let badgeClass = item.status === 'Na Rede' ? 'badge-ok' : 'badge-alert';

        const card = document.createElement('div');
        card.className = 'printer-card';
        card.innerHTML = `
            <div class="printer-header">
                <div class="printer-title">${item.host}</div>
                <div class="badge ${badgeClass}">${item.status}</div>
            </div>
            <div class="printer-body">
                <div class="info-row">
                    <div class="info-label">IP</div>
                    <div class="info-value">${item.ip}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Serial</div>
                    <div class="info-value">${item.serial}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Modelo</div>
                    <div class="info-value">${item.modelo}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Marca</div>
                    <div class="info-value">${item.marca}</div>
                </div>
            </div>
            <div class="printer-footer">
                <button class="btn-edit">Editar Ativo</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Filtro de pesquisa em tempo real
function filterCards() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    
    const filteredData = dadosImpressoras.filter(item =>
        item.host.toLowerCase().includes(query) ||
        item.ip.toLowerCase().includes(query) ||
        item.modelo.toLowerCase().includes(query) ||
        item.serial.toLowerCase().includes(query)
    );
    
    renderCards(filteredData);
}

// Controles do Modal de Cadastro
function openModal() {
    document.getElementById('addModal').classList.add('active');
}

function closeModal() {
    document.getElementById('addModal').classList.remove('active');
    document.getElementById('addForm').reset();
}

function saveEquipamento(event) {
    event.preventDefault();

    // Captura os valores do formulário
    const novoItem = {
        id: dadosImpressoras.length + 1,
        host: document.getElementById('formHost').value,
        ip: document.getElementById('formIp').value,
        modelo: document.getElementById('formModelo').value,
        marca: document.getElementById('formMarca').value,
        serial: document.getElementById('formSerial').value,
        status: document.getElementById('formStatus').value
    };

    // Adiciona ao array e atualiza a tela
    dadosImpressoras.push(novoItem);
    renderCards(dadosImpressoras);
    
    closeModal();
    setTimeout(() => alert('Registro preparado para inserção no Banco de Dados!'), 100);
}

// Quando a página terminar de carregar, renderiza os dados iniciais
window.onload = () => renderCards(dadosImpressoras);