let dadosConexoes = [];
let conexaoEditandoId = null;
let mostrarCabos = true;
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
    let portasPPOcupadas = {};

    // 1. DESENHAR SWITCH
    function desenharSwitchFisico(idHTML, nomeSwitch, totalPortas) {
        const painel = document.getElementById(idHTML);
        if (!painel) return;

        painel.innerHTML = '';
        const colunas = Math.ceil(totalPortas / 2);
        painel.style.gridTemplateColumns = `repeat(${colunas}, 1fr)`;
        painel.style.gridTemplateRows = 'repeat(2, 1fr)';
        painel.style.gridAutoFlow = 'column';

        for (let i = 1; i <= totalPortas; i++) {
            const conexao = dadosDoBanco.find(item => item.NomeSwitch === nomeSwitch && item.PortaSwitch === i);
            let ledClass = '';
            let tooltip = `Porta ${i} Livre`;

            if (conexao) {
                if (conexao.StatusPorta === 'Fibra/Internet') ledClass = 'fibra';
                else if (conexao.StatusPorta === 'Ativo') ledClass = 'active';
                else if (conexao.StatusPorta === 'Inativo/Defeito') ledClass = 'error';
                else ledClass = 'warning';

                if (conexao.PatchPanel && conexao.PortaPatchPanel) {
                    tooltip = `Porta ${i} -> PP ${conexao.PatchPanel} (PT ${conexao.PortaPatchPanel}) -> ${conexao.DispositivoConectado}`;

                    // NOVO: Amarra o Patch Panel ao nome do Switch (Ex: USW-LOTE-1)
                    const chavePP = `${nomeSwitch}-${conexao.PatchPanel}`;
                    if (!portasPPOcupadas[chavePP]) portasPPOcupadas[chavePP] = {};
                    portasPPOcupadas[chavePP][conexao.PortaPatchPanel] = conexao.IdConexao;
                } else {
                    tooltip = `Porta ${i} -> Conexão Direta -> ${conexao.DispositivoConectado}`;
                }
            }

            const portDiv = document.createElement('div');
            const posicaoNumero = (i % 2 !== 0) ? 'top-row' : 'bottom-row';
            portDiv.className = `rj45-port ${posicaoNumero}`;
            portDiv.id = `sw-port-${nomeSwitch}-${i}`;
            portDiv.title = tooltip;

            portDiv.onmouseenter = () => destacarCabo(conexao ? conexao.IdConexao : null);
            portDiv.onmouseleave = () => removerDestaqueCabos();

            portDiv.onclick = () => {
                if (conexao) {
                    abrirEdicao(conexao.IdConexao);
                } else {
                    openModal();
                    document.getElementById('formSwitchName').value = nomeSwitch;
                    document.getElementById('formSwitchPort').value = i;
                    document.getElementById('formSwitchName').readOnly = true;
                    document.getElementById('formSwitchPort').readOnly = true;
                }
            };

            portDiv.innerHTML = `<div class="led ${ledClass}"></div><div class="port-number">${i}</div>`;
            painel.appendChild(portDiv);
        }
    }

    // 2. DESENHAR PATCH PANEL
    // NOVO: Agora a função pede para qual Switch esse Patch Panel pertence
    function desenharPatchPanel(idHTML, nomeSwitchVinculado, numPP) {
        const painel = document.getElementById(idHTML);
        if (!painel) return;

        painel.innerHTML = '';
        painel.style.gridTemplateColumns = 'repeat(24, 1fr)';
        painel.style.gridTemplateRows = '1fr';
        painel.style.gridAutoFlow = 'row';

        const chavePP = `${nomeSwitchVinculado}-${numPP}`;

        for (let i = 1; i <= 24; i++) {
            const idConexao = (portasPPOcupadas[chavePP] && portasPPOcupadas[chavePP][i]) ? portasPPOcupadas[chavePP][i] : null;

            const portDiv = document.createElement('div');
            portDiv.className = 'rj45-port bottom-row';

            // NOVO: O ID da porta do PP agora inclui o Switch (Ex: pp-port-USW-LOTE-1-24)
            portDiv.id = `pp-port-${nomeSwitchVinculado}-${numPP}-${i}`;
            portDiv.style.cursor = 'default';
            portDiv.title = idConexao ? `Porta ${i} do Patch Panel (Em uso)` : `Porta ${i} Livre`;

            portDiv.onmouseenter = () => destacarCabo(idConexao);
            portDiv.onmouseleave = () => removerDestaqueCabos();

            const estiloLedPP = idConexao ? 'background: #00638D; box-shadow: 0 0 8px #00638D;' : '';
            portDiv.innerHTML = `<div class="led" style="${estiloLedPP}"></div><div class="port-number">${i}</div>`;
            painel.appendChild(portDiv);
        }
    }

    // ==========================================
    // 3. EXECUTANDO A RENDERIZAÇÃO
    // ==========================================

    // RACK 01 - LOTE
    desenharSwitchFisico('switchPortsPanel1', 'USW-LOTE', 52);
    desenharPatchPanel('patchPanelPorts1', 'USW-LOTE', 1);

    // RACK 02 - ONCOLOGIA 
    desenharSwitchFisico('switchPortsPanel2', 'USW-CENTROONCOLOGIA', 52);
    desenharPatchPanel('patchPanelOnco1', 'USW-CENTROONCOLOGIA', 1);// Passando 1 aqui porque é o PP 1 da Oncologia
    desenharPatchPanel('patchPanelOnco2', 'USW-CENTROONCOLOGIA', 2);// Passando 2 aqui porque é o PP 2 da Oncologia
    desenharPatchPanel('patchPanelOnco3', 'USW-CENTROONCOLOGIA', 3);
    desenharPatchPanel('patchPanelOnco4', 'USW-CENTROONCOLOGIA', 4);

    // RACK 03 - BANCO DE SANGUE
    desenharSwitchFisico('switchPortsPanel3', 'USW-BANCODESANGUE', 52);
    desenharPatchPanel('patchPanelBS1', 'USW-BANCODESANGUE', 1);
    desenharPatchPanel('patchPanelBS2', 'USW-BANCODESANGUE', 2);
    desenharPatchPanel('patchPanelBS3', 'USW-BANCODESANGUE', 3);
    desenharPatchPanel('patchPanelBS4', 'USW-BANCODESANGUE', 4);

    // RACK 04 - MATRIZ 01
    desenharSwitchFisico('switchPortsPanel4', 'USW-MATRIZ01', 52);
    desenharPatchPanel('patchPanelMZ1', 'USW-MATRIZ01', 1);
    desenharPatchPanel('patchPanelMZ2', 'USW-MATRIZ01', 2);
    desenharPatchPanel('patchPanelMZ3', 'USW-MATRIZ01', 3);
    desenharPatchPanel('patchPanelMZ4', 'USW-MATRIZ01', 4);
    desenharPatchPanel('patchPanelMZ5', 'USW-MATRIZ01', 5);
    desenharPatchPanel('patchPanelMZ6', 'USW-MATRIZ01', 6);

    // RACK 05 - MATRIZ 02
    desenharSwitchFisico('switchPortsPanel5', 'USW-MATRIZ02', 52);
    desenharPatchPanel('patchPanelMZ2-1', 'USW-MATRIZ02', 1);
    desenharPatchPanel('patchPanelMZ2-2', 'USW-MATRIZ02', 2);
    desenharPatchPanel('patchPanelMZ2-3', 'USW-MATRIZ02', 3);
    desenharPatchPanel('patchPanelMZ2-4', 'USW-MATRIZ02', 4);
    desenharPatchPanel('patchPanelMZ2-5', 'USW-MATRIZ02', 5);
    desenharPatchPanel('patchPanelMZ2-6', 'USW-MATRIZ02', 6);

    // RACK 06 - ADMINISTRATIVO
    desenharSwitchFisico('switchPortsPanel6', 'USW-ADMINISTRATIVO', 52);
    desenharPatchPanel('patchPanelADM-1', 'USW-ADMINISTRATIVO', 1);
    desenharPatchPanel('patchPanelADM-2', 'USW-ADMINISTRATIVO', 2);

    setTimeout(desenharCabos, 100);
}

// ========================================================
// O MOTOR DOS CABOS (BLINDADO VIA JAVASCRIPT)
// ========================================================
function desenharCabos() {
    const todosSVGs = document.querySelectorAll('.camada-cabos');

    todosSVGs.forEach(svg => {
        svg.innerHTML = '';
        const rackContainer = svg.closest('.rack-container');
        if (rackContainer) {
            svg.style.position = 'absolute';
            svg.style.top = '0';
            svg.style.left = '0';
            svg.style.width = rackContainer.scrollWidth + 'px';
            svg.style.height = rackContainer.scrollHeight + 'px';
            svg.style.pointerEvents = 'none';
            svg.style.zIndex = '10';
            svg.style.display = mostrarCabos ? 'block' : 'none';
        }
    });

    if (!mostrarCabos) return;

    dadosConexoes.forEach((conexao, index) => {
        if (conexao.PatchPanel && conexao.PortaPatchPanel) {
            const portaOrigem = document.getElementById(`sw-port-${conexao.NomeSwitch}-${conexao.PortaSwitch}`);
            const portaDestino = document.getElementById(`pp-port-${conexao.NomeSwitch}-${conexao.PatchPanel}-${conexao.PortaPatchPanel}`);

            if (portaOrigem && portaDestino && portaOrigem.offsetWidth > 0) {
                const rackWrapper = portaOrigem.closest('.rack-wrapper');
                const rackOculto = rackWrapper ? window.getComputedStyle(rackWrapper).display === 'none' : false;

                if (!rackOculto) {
                    const rackContainer = portaOrigem.closest('.rack-container');
                    const svg = rackContainer.querySelector('.camada-cabos');

                    if (svg) {
                        const svgRect = svg.getBoundingClientRect();
                        const r1 = portaOrigem.getBoundingClientRect();
                        const r2 = portaDestino.getBoundingClientRect();

                        const startX = (r1.left - svgRect.left) + (r1.width / 2);
                        const startY = (r1.top - svgRect.top) + (r1.height / 2);
                        const endX = (r2.left - svgRect.left) + (r2.width / 2);
                        const endY = (r2.top - svgRect.top) + (r2.height / 2);

                        const cor = coresCabos[index % coresCabos.length];
                        const caimento = Math.abs(endY - startY) / 1.5;

                        const pathData = `M ${startX} ${startY} C ${startX} ${startY + caimento}, ${endX} ${endY - caimento}, ${endX} ${endY}`;

                        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                        path.setAttribute("d", pathData);
                        path.setAttribute("class", "cabo-rede");
                        path.id = `cabo-${conexao.IdConexao}`;

                        path.style.stroke = cor;
                        path.style.fill = 'none';
                        path.style.strokeWidth = '2px';

                        // OTIMIZAÇÃO: Opacidade super baixa e animação DESLIGADA por padrão
                        path.style.opacity = '0.05';
                        path.style.transition = 'opacity 0.3s ease, stroke-width 0.3s ease';
                        path.style.strokeDasharray = '8 4';
                        path.style.animation = 'none';

                        svg.appendChild(path);
                    }
                }
            }
        }
    });
}

function destacarCabo(idConexao) {
    if (!idConexao || !mostrarCabos) return;
    const todosCabos = document.querySelectorAll('.cabo-rede');

    todosCabos.forEach(cabo => {
        if (cabo.id === `cabo-${idConexao}`) {
            // Destaca e liga a animação apenas neste cabo
            cabo.style.opacity = '1';
            cabo.style.strokeWidth = '4px';
            cabo.style.animation = 'fluxoDados 30s linear infinite';
        } else {
            // Oculta ainda mais os outros para dar foco
            cabo.style.opacity = '0.02';
            cabo.style.animation = 'none';
        }
    });
}

function removerDestaqueCabos() {
    const todosCabos = document.querySelectorAll('.cabo-rede');

    todosCabos.forEach(cabo => {
        // Retorna tudo ao estado de repouso (sem pesar o navegador)
        cabo.style.opacity = '0.05';
        cabo.style.strokeWidth = '2px';
        cabo.style.animation = 'none';
    });
}

// Botão Exibir Cabos: Voltou a ser instantâneo via CSS
function toggleCabos() {
    mostrarCabos = !mostrarCabos;
    const todosSVGs = document.querySelectorAll('.camada-cabos');
    todosSVGs.forEach(svg => {
        svg.style.display = mostrarCabos ? 'block' : 'none';
    });
}

window.addEventListener('resize', desenharCabos);

// ========================================================
// CONTROLES DO MODAL (Mantido igual)
// ========================================================
function openModal() {
    document.getElementById('addModal').classList.add('active');
    document.getElementById('btnExcluir').style.display = 'none';
    conexaoEditandoId = null;
    document.querySelector('.modal-header h3').innerText = 'Mapear Nova Porta';
    document.getElementById('formSwitchName').readOnly = false;
    document.getElementById('formSwitchPort').readOnly = false;
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

    document.getElementById('formSwitchName').readOnly = true;
    document.getElementById('formSwitchPort').readOnly = true;

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

// ========================================================
// SISTEMA DE ABAS (FILTRO DE RACKS)
// ========================================================
function filtrarRack(idRack, event) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');

    const racks = document.querySelectorAll('.rack-wrapper');
    racks.forEach(rack => {
        if (idRack === 'todos' || rack.id === idRack) {
            rack.style.display = 'block';
        } else {
            rack.style.display = 'none';
        }
    });

    setTimeout(desenharCabos, 150);
}