let dadosConexoes = [];
let conexaoEditandoId = null;

// 1. Busca os dados no Python
async function carregarConexoes() {
    try {
        const response = await fetch('http://localhost:8000/api/conexoes');
        if (!response.ok) throw new Error("Erro de comunicação HTTP");

        dadosConexoes = await response.json();
        
        // Renderiza o Switch e o Patch Panel
        renderizarEquipamentos(dadosConexoes);
    } catch (error) {
        console.error("Erro ao buscar conexões:", error);
    }
}

// 2. Renderiza as portas do Switch e do Patch Panel
function renderizarEquipamentos(dadosDoBanco) {
    const painelSwitch = document.getElementById('switchPortsPanel');
    const painelPP = document.getElementById('patchPanelPorts');

    if (!painelSwitch || !painelPP) return;

    painelSwitch.innerHTML = '';
    painelPP.innerHTML = '';

    // Variável para guardar quais portas do Patch Panel 1 estão em uso
    let portasPPOcupadas = {};

    // ==========================================
    // A. DESENHANDO O SWITCH (24 Portas)
    // ==========================================
    for (let i = 1; i <= 24; i++) {
        // Busca se existe algo conectado nesta porta do switch
        const conexao = dadosDoBanco.find(item => item.PortaSwitch === i);

        let ledClass = '';
        let tooltipTexto = `Porta ${i} Livre`;

        if (conexao) {
            ledClass = conexao.StatusPorta === 'Ativo' ? 'active' : 'warning';
            
            // Monta o texto que aparece ao passar o mouse
            if (conexao.PatchPanel && conexao.PortaPatchPanel) {
                tooltipTexto = `Porta ${i} -> ${conexao.DispositivoConectado} (Via PP ${conexao.PatchPanel}, PT ${conexao.PortaPatchPanel})`;
                
                // Salva que essa porta do PP está sendo usada para acendermos ela depois!
                if (conexao.PatchPanel === 1) { // Assumindo que o PP desenhado é o PP 1
                    portasPPOcupadas[conexao.PortaPatchPanel] = true;
                }
            } else {
                tooltipTexto = `Porta ${i} -> ${conexao.DispositivoConectado} (Conexão Direta)`;
            }
        }

        const portDiv = document.createElement('div');
        portDiv.className = 'rj45-port';
        portDiv.title = tooltipTexto; // Etiqueta nativa ao passar o mouse
        
        // Clique para editar ou criar
        portDiv.onclick = () => {
            if (conexao) {
                abrirEdicao(conexao.IdConexao);
            } else {
                openModal();
                document.getElementById('formSwitchPort').value = i;
            }
        };

        portDiv.innerHTML = `
            <div class="led ${ledClass}"></div>
            <div class="port-number">${i}</div>
        `;

        painelSwitch.appendChild(portDiv);
    }

    // ==========================================
    // B. DESENHANDO O PATCH PANEL (24 Portas)
    // ==========================================
    for (let i = 1; i <= 24; i++) {
        // Verifica se essa porta do PP foi marcada como ocupada no loop do Switch
        const estaOcupada = portasPPOcupadas[i];

        const portDiv = document.createElement('div');
        portDiv.className = 'rj45-port';
        portDiv.style.cursor = 'default'; // Remove a mãozinha (edição é feita pelo switch)
        
        portDiv.title = estaOcupada ? `Porta ${i} em uso pelo Switch` : `Porta ${i} Livre`;

        // Se estiver ocupada, acende um LED Azul escuro/Ciano simulando conexão física
        const estiloLedPP = estaOcupada ? 'background: #00638D; box-shadow: 0 0 8px #00638D;' : '';

        portDiv.innerHTML = `
            <div class="led" style="${estiloLedPP}"></div>
            <div class="port-number">${i}</div>
        `;

        painelPP.appendChild(portDiv);
    }
}

// 3. Controles do Modal
function openModal() {
    document.getElementById('addModal').classList.add('active');
    document.getElementById('btnExcluir').style.display = 'none';
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
    document.getElementById('btnExcluir').style.display = 'inline-block';
    document.getElementById('addModal').classList.add('active');
}

// 4. Salvar/Atualizar no Banco
async function saveEquipamento(event) {
    event.preventDefault();

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
            carregarConexoes(); // Recarrega o rack inteiro
        } else {
            const erro = await response.json();
            alert('Erro ao salvar no banco: ' + erro.detail);
        }
    } catch (error) {
        console.error("Erro na requisição:", error);
    }
}

// 5. Excluir Conexão
async function excluirConexao() {
    if (conexaoEditandoId === null) return;
    const confirmacao = confirm("Deseja realmente excluir este mapeamento de porta?");
    if (!confirmacao) return;

    try {
        const response = await fetch(`http://localhost:8000/api/conexoes/${conexaoEditandoId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            closeModal();
            carregarConexoes();
        } else {
            const erro = await response.json();
            alert('Erro ao excluir: ' + erro.detail);
        }
    } catch (error) {
        console.error("Erro na exclusão:", error);
    }
}

window.onload = () => carregarConexoes();