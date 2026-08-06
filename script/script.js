// 1. Busca os dados da API Python (Impressoras e Switches) e distribui na tela
async function carregarDashboard() {
    try {
        const [respImpressoras, respConexoes] = await Promise.all([
            fetch('http://localhost:8000/api/impressoras'),
            fetch('http://localhost:8000/api/conexoes')
        ]);

        if (!respImpressoras.ok || !respConexoes.ok) {
            throw new Error("Erro de comunicação HTTP");
        }

        const dadosImpressoras = await respImpressoras.json();
        const dadosConexoes = await respConexoes.json();

        // Dispara as atualizações na tela
        atualizarEstatisticas(dadosImpressoras);
        atualizarEstatisticasRede(dadosConexoes);
        renderizarGraficos(dadosImpressoras);

        // AQUI ESTÁ O SEGREDO QUE FALTAVA:
        renderizarGraficoRacks(dadosConexoes);

    } catch (error) {
        console.error("Erro ao carregar o dashboard:", error);
    }
}

// 2. Atualiza os cards das Impressoras
function atualizarEstatisticas(dados) {
    let countNaRede = 0;
    let countReserva = 0;

    dados.forEach(item => {
        if (item.Status === 'Na Rede') countNaRede++;
        if (item.Status === 'Reserva') countReserva++;
    });

    const elNaRede = document.getElementById('count-na-rede');
    const elReserva = document.getElementById('count-reserva');

    if (elNaRede) elNaRede.innerText = countNaRede;
    if (elReserva) elReserva.innerText = countReserva;
}

// 3. NOVA FUNÇÃO: Atualiza os cards de Rede / Switches
function atualizarEstatisticasRede(dadosConexoes) {
    let countAtivos = 0;
    let countInativos = 0;
    const racksUnicos = new Set();

    dadosConexoes.forEach(conexao => {
        // Salva o nome do switch no "Set" (o Set ignora nomes repetidos automaticamente)
        racksUnicos.add(conexao.NomeSwitch);

        // Conta status
        if (conexao.StatusPorta === 'Ativo' || conexao.StatusPorta === 'Fibra/Internet') {
            countAtivos++;
        } else if (conexao.StatusPorta === 'Inativo/Defeito') {
            countInativos++;
        }
    });

    // Pega os elementos lá do HTML (index.html)
    const elTotalPortas = document.getElementById('dash-portas-mapeadas');
    const elRacks = document.getElementById('dash-switches-fisicos');
    const elPortasAtivas = document.getElementById('dash-portas-ativas');
    const elPortasInativas = document.getElementById('dash-portas-inativas');

    // Joga os valores na tela
    if (elTotalPortas) elTotalPortas.innerText = dadosConexoes.length;
    if (elRacks) elRacks.innerText = racksUnicos.size; // Vai mostrar "6"
    if (elPortasAtivas) elPortasAtivas.innerText = countAtivos;
    if (elPortasInativas) elPortasInativas.innerText = countInativos;
}

// 4. Constrói os gráficos da Visão Gerencial
function renderizarGraficos(dados) {
    // Conta quantas impressoras de cada marca existem
    const marcasCount = {};
    // Conta quantos status diferentes existem
    const statusCount = {};

    dados.forEach(item => {
        marcasCount[item.Marca] = (marcasCount[item.Marca] || 0) + 1;
        statusCount[item.Status] = (statusCount[item.Status] || 0) + 1;
    });

    const coresPadrao = ['#00638D', '#ff7f0e', '#d62728', '#B85C55'];

    // GRÁFICO 1: Distribuição por Fabricante
    new Chart(document.getElementById('chartMarcas'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(marcasCount),
            datasets: [{
                data: Object.values(marcasCount),
                backgroundColor: coresPadrao,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: { legend: { position: 'bottom' } }
        }
    });

    // GRÁFICO 2: Status do Parque
    new Chart(document.getElementById('chartStatus'), {
        type: 'bar',
        data: {
            labels: Object.keys(statusCount),
            datasets: [{
                label: 'Equipamentos',
                data: Object.values(statusCount),
                backgroundColor: ['#008d23', '#f8dd41', '#887270'],
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });
}

// ========================================================
// NOVO GRÁFICO: OCUPAÇÃO POR RACK
// ========================================================
function renderizarGraficoRacks(dadosConexoes) {
    const canvasRack = document.getElementById('chartRacks');
    if (!canvasRack) return;

    // 1. Conta quantas portas estão sendo usadas em cada Rack
    const racksCount = {};
    dadosConexoes.forEach(item => {
        const nome = item.NomeSwitch;
        racksCount[nome] = (racksCount[nome] || 0) + 1;
    });

    // 2. Paleta de Cores Personalizada (uma cor para cada barra)
    const paletaDeCores = [
        '#084594',
        '#2171B5',
        '#4292C6',
        '#6BAED6',
        '#9ECAE1',
        '#C6DBEF'
    ];

    // 3. Monta o gráfico
    new Chart(canvasRack, {
        type: 'bar',
        data: {
            labels: Object.keys(racksCount),
            datasets: [{
                label: 'Portas Mapeadas',
                data: Object.values(racksCount),

                // AQUI: Injetamos a lista de cores em vez de uma cor só
                backgroundColor: paletaDeCores,

                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 5 }
                }
            }
        }
    });
}

// Inicializa a renderização quando a página abre
window.onload = () => carregarDashboard();