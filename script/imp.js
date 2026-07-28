let dadosImpressoras = [];
let impressoraEditandoId = null;

// 1. Busca os dados reais do SQL Server via Python
async function carregarImpressorasDoBanco() {
    try {
        const response = await fetch('http://localhost:8000/api/impressoras');
        if (!response.ok) throw new Error("Erro ao buscar dados");
        
        dadosImpressoras = await response.json();
        renderCards(dadosImpressoras);
    } catch (error) {
        console.error("Erro na comunicação com a API:", error);
        document.getElementById('printersGrid').innerHTML = '<p style="color: red;">Erro ao carregar impressoras do banco.</p>';
    }
}

// 2. Renderiza os cards na tela
function renderCards(data) {
    const grid = document.getElementById('printersGrid');
    if (!grid) return;
    grid.innerHTML = '';

    data.forEach(item => {
        let badgeClass = item.Status === 'Na Rede' ? 'badge-ok' : 'badge-alert';

        const card = document.createElement('div');
        card.className = 'printer-card';
        card.innerHTML = `
            <div class="printer-header">
                <div class="printer-title">${item.Hostname}</div>
                <div class="badge ${badgeClass}">${item.Status}</div>
            </div>
            <div class="printer-body">
                <div class="info-row">
                    <div class="info-label">IP</div>
                    <div class="info-value">${item.IP}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Serial</div>
                    <div class="info-value">${item.Serial}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Modelo</div>
                    <div class="info-value">${item.Modelo}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Marca</div>
                    <div class="info-value">${item.Marca}</div>
                </div>
            </div>
            <div class="printer-footer">
                <button class="btn-edit" onclick="abrirEdicao(${item.ID})">Editar Ativo</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// 3. Filtro de pesquisa
function filterCards() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    const query = searchInput.value.toLowerCase();
    const filteredData = dadosImpressoras.filter(item =>
        (item.Hostname && item.Hostname.toLowerCase().includes(query)) ||
        (item.IP && item.IP.toLowerCase().includes(query)) ||
        (item.Modelo && item.Modelo.toLowerCase().includes(query)) ||
        (item.Serial && item.Serial.toLowerCase().includes(query))
    );
    renderCards(filteredData);
}

// 4. Modal de Cadastro e Edição
function openModal() {
    document.getElementById('addModal').classList.add('active');
    impressoraEditandoId = null;
    document.querySelector('.modal-header h3').innerText = 'Adicionar Equipamento';
}

function closeModal() {
    document.getElementById('addModal').classList.remove('active');
    document.getElementById('addForm').reset();
    impressoraEditandoId = null;
}

function abrirEdicao(id) {
    const impressora = dadosImpressoras.find(item => item.ID === id);
    if (!impressora) return;

    document.getElementById('formHost').value = impressora.Hostname;
    document.getElementById('formIp').value = impressora.IP;
    document.getElementById('formModelo').value = impressora.Modelo;
    document.getElementById('formMarca').value = impressora.Marca;
    document.getElementById('formSerial').value = impressora.Serial;
    document.getElementById('formStatus').value = impressora.Status;

    impressoraEditandoId = id;
    document.querySelector('.modal-header h3').innerText = 'Editar Equipamento';
    document.getElementById('addModal').classList.add('active');
}

// 5. Salvar (POST) ou Atualizar (PUT) no SQL Server
async function saveEquipamento(event) {
    event.preventDefault();

    const dadosFormulario = {
        Hostname: document.getElementById('formHost').value,
        IP: document.getElementById('formIp').value,
        Modelo: document.getElementById('formModelo').value,
        Marca: document.getElementById('formMarca').value,
        Serial: document.getElementById('formSerial').value,
        Status: document.getElementById('formStatus').value
    };

    try {
        let url = 'http://localhost:8000/api/impressoras';
        let metodo = 'POST';

        if (impressoraEditandoId !== null) {
            url = `http://localhost:8000/api/impressoras/${impressoraEditandoId}`;
            metodo = 'PUT';
        }

        const response = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosFormulario)
        });

        if (response.ok) {
            closeModal();
            carregarImpressorasDoBanco();
            alert(impressoraEditandoId !== null ? 'Equipamento atualizado com sucesso!' : 'Equipamento adicionado com sucesso!');
        } else {
            const erro = await response.json();
            alert('Erro ao salvar no banco: ' + erro.detail);
        }
    } catch (error) {
        console.error("Erro na requisição:", error);
        alert('Erro de comunicação com o servidor.');
    }
}

// Carrega tudo ao abrir a página
window.onload = () => carregarImpressorasDoBanco();