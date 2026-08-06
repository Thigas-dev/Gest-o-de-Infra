let dadosRamais = [];

// ========================================================
// CARREGAR DADOS DO BANCO (API)
// ========================================================
async function carregarRamais() {
    try {
        const res = await fetch('http://localhost:8000/api/ramais');
        if (res.ok) {
            dadosRamais = await res.json();
            filtrarRamais(); // Renderiza os cartões na tela
        }
    } catch (e) {
        console.error("Erro ao carregar ramais da API:", e);
    }
}

// ========================================================
// RENDERIZAR OS CARTÕES NA TELA
// ========================================================
function renderizarRamais(dados) {
    const tbody = document.getElementById('gridRamais');
    tbody.innerHTML = ''; // Limpa a tabela antes de desenhar

    dados.forEach(item => {
        const isNaoMapeado = item.Status === "Inativo" || item.PatchPanel === "Não Mapeado" || !item.PatchPanel;
        const classePorta = isNaoMapeado ? "ramal-vazio" : "ramal-porta";

        // Define a cor da etiqueta de status
        const badgeClass = item.Status === 'Ativo'
            ? 'badge badge-ok'
            : item.Status === 'Não Mapeado'
                ? 'badge badge-nao-mapeado'
                : 'badge badge-alert';

        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td>
                <strong style="color: var(--primary); font-size: 1.1rem;">☎️ ${item.NumeroRamal}</strong>
            </td>
            <td>
                <span class="${classePorta}">${item.SipPorta || '<span style="color: #999;">-</span>'}</span>
            </td>
            <td>
                <span class="${classePorta}">${item.PatchPanel || '<span style="color: #999;">-</span>'}</span>
            </td>
            <td>
                ${item.Local || '<span style="color: #999;">-</span>'}
            </td>
            <td>
                <span class="${badgeClass}">${item.Status}</span>
            </td>
            <td>
                <button class="btn-edit" onclick="abrirModalRamal(${item.IdRamal})">Editar</button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

// ========================================================
// SISTEMA DE PESQUISA EM TEMPO REAL
// ========================================================
function filtrarRamais() {
    const input = document.getElementById('searchRamal');
    if (!input) return;

    const textoFiltro = input.value.toLowerCase();

    // Filtra buscando no Número, no Patch Panel ou no Local
    const filtrados = dadosRamais.filter(item => {
        const numero = item.NumeroRamal.toLowerCase();
        const pp = (item.PatchPanel || '').toLowerCase();
        const local = (item.Local || '').toLowerCase();

        return numero.includes(textoFiltro) || pp.includes(textoFiltro) || local.includes(textoFiltro);
    });

    // Ordena do menor para o maior ramal
    const ordenados = filtrados.sort((a, b) => a.NumeroRamal.localeCompare(b.NumeroRamal));
    renderizarRamais(ordenados);
}

// ========================================================
// CONTROLE DO MODAL (ABRIR E FECHAR)
// ========================================================
function abrirModalRamal(id = null) {
    const modal = document.getElementById('modalRamal');
    const form = document.getElementById('formRamal');

    form.reset();
    document.getElementById('ramalId').value = '';
    document.getElementById('sipRamal').value = '';
    document.getElementById('btnExcluirRamal').style.display = 'none';
    document.getElementById('modalTitle').innerText = 'Novo Ramal';

    // Se passou ID, é edição (preenche os campos)
    if (id) {
        const ramal = dadosRamais.find(r => r.IdRamal === id);
        if (ramal) {
            document.getElementById('ramalId').value = ramal.IdRamal;
            document.getElementById('numRamal').value = ramal.NumeroRamal;
            document.getElementById('sipRamal').value = ramal.SipPorta || '';
            document.getElementById('ppRamal').value = ramal.PatchPanel || '';
            document.getElementById('localRamal').value = ramal.Local || '';
            document.getElementById('statusRamal').value = ramal.Status;

            document.getElementById('btnExcluirRamal').style.display = 'inline-block';
            document.getElementById('modalTitle').innerText = 'Editar Ramal';
        }
    }

    modal.classList.add('active');
}

function fecharModalRamal() {
    document.getElementById('modalRamal').classList.remove('active');
}

// ========================================================
// SALVAR DADOS NO BANCO (CREATE / UPDATE)
// ========================================================
async function salvarRamal(event) {
    event.preventDefault();

    const id = document.getElementById('ramalId').value;

    // Captura os valores e envia null se estiver vazio para não quebrar o banco
    const form = {
        NumeroRamal: document.getElementById('numRamal').value,
        SipPorta: document.getElementById('sipRamal').value || null,
        PatchPanel: document.getElementById('ppRamal').value || null,
        Local: document.getElementById('localRamal').value || null,
        Status: document.getElementById('statusRamal').value
    };

    const url = id ? `http://localhost:8000/api/ramais/${id}` : 'http://localhost:8000/api/ramais';
    const method = id ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form)
        });

        if (response.ok) {
            fecharModalRamal();
            carregarRamais(); // Recarrega a tela com os dados atualizados
        } else {
            const erro = await response.json();
            alert('Erro: ' + erro.detail);
        }
    } catch (error) {
        alert('Erro de comunicação com o servidor.');
    }
}

// ========================================================
// EXCLUIR RAMAL (DELETE)
// ========================================================
async function excluirRamal() {
    const id = document.getElementById('ramalId').value;
    if (!id || !confirm('Tem certeza que deseja excluir este ramal permanentemente?')) return;

    try {
        const response = await fetch(`http://localhost:8000/api/ramais/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            fecharModalRamal();
            carregarRamais();
        } else {
            alert('Erro ao excluir o ramal.');
        }
    } catch (error) {
        alert('Erro de comunicação com o servidor.');
    }
}

// Inicia a aplicação buscando os dados
window.onload = () => carregarRamais();