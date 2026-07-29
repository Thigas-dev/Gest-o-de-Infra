let dadosConexoes = [];
let conexaoEditandoId = null;
let mostrarCabos = true;

// Cores neon para diferenciar os cabos
const coresCabos = ['#00e5ff', '#ff007f', '#00ff00', '#ffea00', '#9d00ff', '#ff5500', '#0055ff'];

async function carregarConexoes() {
    try {
        const response = await fetch('http://localhost:8000/api/conexoes');
        if (!response.ok) throw new Error("Erro de comunicação HTTP");

        dadosConexoes = await response.json();
        renderizarEquipamentos(dadosConexoes);
    } catch (error) {
        console.error("Erro ao buscar conexões:", error);
    }
}

function renderizarEquipamentos(dadosDoBanco) {
    const painelSwitch = document.getElementById('switchPortsPanel');
    const painelPP = document.getElementById('patchPanelPorts');
    if (!painelSwitch || !painelPP) return;

    painelSwitch.innerHTML = '';
    painelPP.innerHTML = '';

    // O TRUQUE MÁGICO DO GRID AQUI:
    // Switch com 52 portas preenchendo as colunas de cima para baixo (Zigue-Zague)
    painelSwitch.style.gridTemplateColumns = 'repeat(26, 1fr)';
    painelSwitch.style.gridTemplateRows = 'repeat(2, 1fr)';
    painelSwitch.style.gridAutoFlow = 'column';

    // PP com 24 portas preenchendo a linha normal da esquerda pra direita
    painelPP.style.gridTemplateColumns = 'repeat(24, 1fr)';
    painelPP.style.gridTemplateRows = '1fr';
    painelPP.style.gridAutoFlow = 'row';

    let portasPPOcupadas = {};
    const nomeSwitchPrincipal = "USW-LOTE";

    // 1. DESENHANDO O SWITCH (USW-LOTE)
    for (let i = 1; i <= 52; i++) {
        const conexao = dadosDoBanco.find(item => item.NomeSwitch === nomeSwitchPrincipal && item.PortaSwitch === i);
        let ledClass = '';
        let tooltip = `Porta ${i} Livre`;

        if (conexao) {
            ledClass = conexao.StatusPorta === 'Ativo' ? 'active' : 'warning';
            if (conexao) {
                // Mapeamento exato das cores baseado no seu banco de dados
                if (conexao.StatusPorta === 'Fibra/Internet') {
                    ledClass = 'fibra';  // Azul ciano
                } else if (conexao.StatusPorta === 'Ativo') {
                    ledClass = 'active'; // Verde
                } else if (conexao.StatusPorta === 'Inativo/Defeito') {
                    ledClass = 'error';  // Vermelho
                } else {
                    ledClass = 'warning'; // Amarelo (Para qualquer outro status)
                }
            }
        }

            const portDiv = document.createElement('div');

            // LÓGICA DO NÚMERO (Par ou Ímpar)
            // Se o resto da divisão por 2 for diferente de zero, é ímpar (cima). Senão, é par (baixo).
            const posicaoNumero = (i % 2 !== 0) ? 'top-row' : 'bottom-row';
            portDiv.className = `rj45-port ${posicaoNumero}`;

            portDiv.id = `sw-port-${i}`;
            portDiv.title = tooltip;

            portDiv.onmouseenter = () => destacarCabo(conexao ? conexao.IdConexao : null);
            portDiv.onmouseleave = () => removerDestaqueCabos();

            portDiv.onclick = () => {
                if (conexao) {
                    abrirEdicao(conexao.IdConexao);
                } else {
                    openModal();
                    document.getElementById('formSwitchName').value = nomeSwitchPrincipal;
                    document.getElementById('formSwitchPort').value = i;
                    document.getElementById('formSwitchName').readOnly = true;
                    document.getElementById('formSwitchPort').readOnly = true;
                }
            };

            portDiv.innerHTML = `<div class="led ${ledClass}"></div><div class="port-number">${i}</div>`;
            painelSwitch.appendChild(portDiv);
        }

        // 2. DESENHANDO O PATCH PANEL
        for (let i = 1; i <= 24; i++) {
            const idConexao = portasPPOcupadas[i];

            const portDiv = document.createElement('div');
            portDiv.className = 'rj45-port bottom-row'; // PP sempre número embaixo
            portDiv.id = `pp-port-${i}`;
            portDiv.style.cursor = 'default';
            portDiv.title = idConexao ? `Porta ${i} do Patch Panel (Em uso)` : `Porta ${i} Livre`;

            portDiv.onmouseenter = () => destacarCabo(idConexao);
            portDiv.onmouseleave = () => removerDestaqueCabos();

            const estiloLedPP = idConexao ? 'background: #00638D; box-shadow: 0 0 8px #00638D;' : '';
            portDiv.innerHTML = `<div class="led" style="${estiloLedPP}"></div><div class="port-number">${i}</div>`;
            painelPP.appendChild(portDiv);
        }

        setTimeout(desenharCabos, 100);
    }

    // ========================================================
    // O MOTOR DOS CABOS (VETORES)
    // ========================================================
    function desenharCabos() {
        const svg = document.getElementById('camadaCabos');
        const rack = document.querySelector('.rack-container');
        if (!svg || !rack) return;

        svg.innerHTML = ''; // Limpa cabos velhos
        const rackRect = rack.getBoundingClientRect();

        dadosConexoes.forEach((conexao, index) => {
            if (conexao.PatchPanel && conexao.PortaPatchPanel) {
                const portaOrigem = document.getElementById(`sw-port-${conexao.PortaSwitch}`);
                const portaDestino = document.getElementById(`pp-port-${conexao.PortaPatchPanel}`);

                if (portaOrigem && portaDestino) {
                    const r1 = portaOrigem.getBoundingClientRect();
                    const r2 = portaDestino.getBoundingClientRect();

                    // Calcula o X e Y do centro de cada portinha RJ45
                    const startX = r1.left + (r1.width / 2) - rackRect.left;
                    const startY = r1.top + (r1.height / 2) - rackRect.top;
                    const endX = r2.left + (r2.width / 2) - rackRect.left;
                    const endY = r2.top + (r2.height / 2) - rackRect.top;

                    const cor = coresCabos[index % coresCabos.length];

                    // Desenha a curva do cabo (Bézier Curve)
                    const caimento = Math.abs(endY - startY) / 1.5;
                    const pathData = `M ${startX} ${startY} C ${startX} ${startY + caimento}, ${endX} ${endY - caimento}, ${endX} ${endY}`;

                    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                    path.setAttribute("d", pathData);
                    path.setAttribute("class", "cabo-rede");
                    path.setAttribute("stroke", cor);
                    path.id = `cabo-${conexao.IdConexao}`; // ID para manipularmos no Hover

                    svg.appendChild(path);
                }
            }
        });
    }

    function destacarCabo(idConexao) {
        if (!idConexao || !mostrarCabos) return;
        const todosCabos = document.querySelectorAll('.cabo-rede');
        todosCabos.forEach(cabo => {
            if (cabo.id === `cabo-${idConexao}`) {
                cabo.style.opacity = '1';
                cabo.style.strokeWidth = '4px'; // Engrossa o cabo principal
            } else {
                cabo.style.opacity = '0.05'; // Apaga quase totalmente os outros
            }
        });
    }

    function removerDestaqueCabos() {
        const todosCabos = document.querySelectorAll('.cabo-rede');
        todosCabos.forEach(cabo => {
            cabo.style.opacity = '0.6';
            cabo.style.strokeWidth = '2px';
        });
    }

    function toggleCabos() {
        mostrarCabos = !mostrarCabos;
        const svg = document.getElementById('camadaCabos');
        if (svg) svg.style.display = mostrarCabos ? 'block' : 'none';
    }

    // Redesenha os cabos sempre que o usuário redimensionar a janela
    window.addEventListener('resize', desenharCabos);

    // Funções do Modal e Banco de Dados 
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

    async function saveEquipamento(event) {
        event.preventDefault();
        const pp = document.getElementById('formPatchPanel').value;
        const pt = document.getElementById('formPatchPort').value;
        const form = {
            NomeSwitch: document.getElementById('formSwitchName').value,
            PortaSwitch: parseInt(document.getElementById('formSwitchPort').value),
            DispositivoConectado: document.getElementById('formConnectedDevice').value,
            PatchPanel: pp ? parseInt(pp) : null,
            PortaPatchPanel: pt ? parseInt(pt) : null,
            StatusPorta: document.getElementById('formStatus').value
        };
        try {
            let url = 'http://localhost:8000/api/conexoes';
            let method = 'POST';
            if (conexaoEditandoId) { url += `/${conexaoEditandoId}`; method = 'PUT'; }
            const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
            if (r.ok) { closeModal(); carregarConexoes(); }
            else alert('Erro: ' + (await r.json()).detail);
        } catch (e) { alert('Erro de rede.'); }
    }

    async function excluirConexao() {
        if (!conexaoEditandoId) return;
        if (!confirm("Deseja excluir?")) return;
        try {
            const r = await fetch(`http://localhost:8000/api/conexoes/${conexaoEditandoId}`, { method: 'DELETE' });
            if (r.ok) { closeModal(); carregarConexoes(); }
        } catch (e) { alert('Erro de rede.'); }
    }

    window.onload = () => carregarConexoes();