
// Dados simulados baseados na planilha (V1 sem conexão real com banco AINDA)
// No futuro, isso será substituído por: fetch('/api/impressoras').then(...)
let dadosImpressoras = [
    { id: 1, host: "Imp-AdmBS", ip: "10.0.2.18", modelo: "DCP-L5652DN", marca: "BROTHER", status: "Na Rede" },
    { id: 2, host: "Imp-AdmEnfermagem", ip: "10.0.2.9", modelo: "DCP-L5652DN", marca: "BROTHER", status: "Na Rede" },
    { id: 3, host: "Imp-Cons01", ip: "10.0.2.3", modelo: "ES5112", marca: "OKI", status: "Na Rede" },
    { id: 4, host: "RESERVA", ip: "0.0.0.0", modelo: "ES5112", marca: "OKI", status: "Reserva" },
    { id: 5, host: "Scanner-Faturamento", ip: "10.0.2.24", modelo: "ADS-2800W", marca: "BROTHER", status: "Na Rede" },
    { id: 6, host: "Imp-Triagem-01", ip: "10.0.2.19", modelo: "ES5112", marca: "OKI", status: "Na Rede" }
];

function renderTable(data) {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    let countNaRede = 0;
    let countReserva = 0;

    data.forEach(item => {
        // Lógica de status
        let badgeClass = item.status === 'Na Rede' ? 'badge-ok' : 'badge-alert';

        if (item.status === 'Na Rede') countNaRede++;
        if (item.status === 'Reserva') countReserva++;

        const tr = document.createElement('tr');
        tr.innerHTML = `
                    <td style="font-weight: 600;">${item.host}</td>
                    <td>${item.ip}</td>
                    <td>${item.modelo}</td>
                    <td>${item.marca}</td>
                    <td><span class="badge ${badgeClass}">${item.status}</span></td>
                    <td>
                        <button style="background:none; border:none; color: var(--tertiary); cursor:pointer; font-weight:600;">Editar</button>
                    </td>
                `;
        tbody.appendChild(tr);
    });

    // Atualiza Dashboard
    document.getElementById('count-na-rede').innerText = countNaRede;
    document.getElementById('count-reserva').innerText = countReserva;
}

function filterTable() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const filteredData = dadosImpressoras.filter(item =>
        item.host.toLowerCase().includes(query) ||
        item.ip.toLowerCase().includes(query) ||
        item.modelo.toLowerCase().includes(query)
    );
    renderTable(filteredData);
}

// Funções do Modal
function openModal() {
    document.getElementById('addModal').classList.add('active');
}

function closeModal() {
    document.getElementById('addModal').classList.remove('active');
    document.getElementById('addForm').reset();
}

function saveEquipamento(event) {
    event.preventDefault();
    // Aqui entraria a instrução SQL INSERT ou requisição POST

    const novoItem = {
        id: dadosImpressoras.length + 1,
        host: document.getElementById('formHost').value,
        ip: document.getElementById('formIp').value,
        modelo: document.getElementById('formModelo').value,
        marca: document.getElementById('formMarca').value,
        status: document.getElementById('formStatus').value
    };

    dadosImpressoras.push(novoItem);
    renderTable(dadosImpressoras);
    closeModal();

    // Feedback visual simulando o salvamento no SQL
    setTimeout(() => alert('Registro preparado para inserção no Banco de Dados!'), 100);
}

// Renderiza a tabela inicial
window.onload = () => renderTable(dadosImpressoras);