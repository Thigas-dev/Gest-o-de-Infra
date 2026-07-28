let dadosConexoes = [];
let conexaoEditandoId = null;

// 1. Busca os dados no Python
async function carregarConexoes() {
    try {
        const response = await fetch('http://localhost:8000/api/conexoes');
        if (!response.ok) throw new Error("Erro de comunicação HTTP");
        
        dadosConexoes = await response.json();
        renderCards(dadosConexoes);
    } catch (error) {
        console.error("Erro ao buscar conexões:", error);
    }
}

// 2. Monta os cards na tela
function renderCards(data) {
    const grid = document.getElementById('switchesGrid');
    if (!grid) return;
    grid.innerHTML = '';

    data.forEach(item => {
        let badgeClass = item.StatusPorta === 'Ativo' ? 'badge-ok' : 'badge-alert';
        
        // Formata a exibição do Patch Panel (mostra "N/A" se for nulo)
        let ppDisplay = item.PatchPanel ? `PP ${item.PatchPanel} / PT ${item.PortaPatchPanel}` : 'Conexão Direta';

        const card = document.createElement('div');
        card.className = 'switch-card';
        card.innerHTML = `
            <div class="switch-header">
                <div class="switch-title">${item.NomeSwitch}</div>
                <div class="badge ${badgeClass}">${item.StatusPorta}</div>
            </div>
            <div class="switch-body">
                <div class="info-row">
                    <div class="info-label">Porta Switch</div>
                    <div class="info-value">Porta ${item.PortaSwitch}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Patch Panel</div>
                    <div class="info-value">${ppDisplay}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Dispositivo</div>
                    <div class="info-value" style="font-weight: bold; color: var(--tertiary);">${item.DispositivoConectado}</div>
                </div>
            </div>
            <div class="switch-footer">
                <button class="btn-edit" onclick="abrirEdicao(${item.IdConexao})">Editar Conexão</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// 3. Filtro de pesquisa
function filterCards() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    
    const filteredData = dadosConexoes.filter(item =>
        item.NomeSwitch.toLowerCase().includes(query) ||
        item.DispositivoConectado.toLowerCase().includes(query) ||
        item.PortaSwitch.toString().includes(query)
    );
    renderCards(filteredData);
}

// 4. Modal 
function openModal() {
    document.getElementById('addModal').classList.add('active');
    conexaoEditandoId = null;
    document.querySelector('.modal-header h3').innerText = 'Mapear Nova Porta';
}

function closeModal() {
    document.getElementById('addModal').classList.remove('active');
    document.getElementById('addForm').reset();
    conexaoEditandoId = null;
}

function abrirEdicao(id) {
    const conexao = dadosConexoes.find(item => item.IdConexao === id);
    if (!conexao) return;

    document.getElementById('formSwitchName').value = conexao.NomeSwitch;
    document.getElementById('formSwitchPort').value = conexao.PortaSwitch;
    document.getElementById('formConnectedDevice').value = conexao.DispositivoConectado;
    document.getElementById('formPatchPanel').value = conexao.PatchPanel || '';
    document.getElementById('formPatchPort').value = conexao.PortaPatchPanel || '';
    document.getElementById('formStatus').value = conexao.StatusPorta;

    conexaoEditandoId = id;
    document.querySelector('.modal-header h3').innerText = 'Editar Conexão';
    document.getElementById('addModal').classList.add('active');
}

// 5. Salvar/Atualizar no Banco
async function saveEquipamento(event) {
    event.preventDefault();

    // Captura os valores e converte para número onde necessário
    const ppValue = document.getElementById('formPatchPanel').value;
    const ptValue = document.getElementById('formPatchPort').value;

    const dadosFormulario = {
        NomeSwitch: document.getElementById('formSwitchName').value,
        PortaSwitch: parseInt(document.getElementById('formSwitchPort').value),
        DispositivoConectado: document.getElementById('formConnectedDevice').value,
        PatchPanel: ppValue ? parseInt(ppValue) : null,
        PortaPatchPanel: ptValue ? parseInt(ptValue) : null,
        StatusPorta: document.getElementById('formStatus').value
    };

    try {
        let url = 'http://localhost:8000/api/conexoes';
        let metodo = 'POST';

        if (conexaoEditandoId !== null) {
            url = `http://localhost:8000/api/conexoes/${conexaoEditandoId}`;
            metodo = 'PUT';
        }

        const response = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosFormulario)
        });

        if (response.ok) {
            closeModal();
            carregarConexoes();
            alert(conexaoEditandoId !== null ? 'Conexão atualizada com sucesso!' : 'Conexão mapeada com sucesso!');
        } else {
            const erro = await response.json();
            alert('Erro ao salvar no banco: ' + erro.detail);
        }
    } catch (error) {
        console.error("Erro na requisição:", error);
        alert('Erro de comunicação com o servidor.');
    }
}

// Inicia
window.onload = () => carregarConexoes();