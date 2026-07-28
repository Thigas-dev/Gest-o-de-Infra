// 1. Busca os dados da API Python e distribui na tela
async function carregarDashboard() {
    try {
        const response = await fetch('http://localhost:8000/api/impressoras');
        if (!response.ok) throw new Error("Erro de comunicação HTTP");
        
        const dadosImpressoras = await response.json();
        
        atualizarEstatisticas(dadosImpressoras);
        renderizarGraficos(dadosImpressoras);
    } catch (error) {
        console.error("Erro ao carregar o dashboard:", error);
    }
}

// 2. Atualiza os cards coloridos lá do topo
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

// 3. Constrói os gráficos da Visão Gerencial
function renderizarGraficos(dados) {
    // Conta quantas impressoras de cada marca existem
    const marcasCount = {};
    // Conta quantos status diferentes existem
    const statusCount = {};

    dados.forEach(item => {
        marcasCount[item.Marca] = (marcasCount[item.Marca] || 0) + 1;
        statusCount[item.Status] = (statusCount[item.Status] || 0) + 1;
    });

    // Usa as mesmas cores do seu CSS para manter o padrão visual
    // Azul (tertiary), Vermelho (primary), Cinza (neutral), e Vermelho Claro (secondary)
    const coresPadrao = ['#00638D', '#D83F3C', '#887270', '#B85C55'];

    // ----------------------------------------------------
    // GRÁFICO 1: Distribuição por Fabricante (Doughnut)
    // ----------------------------------------------------
    new Chart(document.getElementById('chartMarcas'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(marcasCount),
            datasets: [{
                data: Object.values(marcasCount),
                backgroundColor: coresPadrao,
                borderWidth: 0 // Remove a borda para ficar melhor no glassmorphism
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%', // Deixa o anel mais fino e elegante
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });

    // ----------------------------------------------------
    // GRÁFICO 2: Status do Parque (Barras)
    // ----------------------------------------------------
    new Chart(document.getElementById('chartStatus'), {
        type: 'bar',
        data: {
            labels: Object.keys(statusCount),
            datasets: [{
                label: 'Equipamentos',
                data: Object.values(statusCount),
                backgroundColor: ['#00638D', '#887270'], // Azul pra Ok, Cinza pra Reserva
                borderRadius: 8 // Arredonda a ponta da barra
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false } // Esconde a legenda desnecessária
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 } // Não queremos números quebrados (ex: 1.5 impressoras)
                }
            }
        }
    });
}

// Inicializa a renderização quando a página abre
window.onload = () => carregarDashboard();