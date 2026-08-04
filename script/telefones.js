// ========================================================
// DADOS MAIS LIMPOS E PADRONIZADOS
// ========================================================
const dadosRamais = [
    { ramal: "6666", pp: "P1 / PP 01" },
    { ramal: "6603", pp: "P1 / PP 03" },
    { ramal: "6602", pp: "Não Mapeado" },
    { ramal: "6604", pp: "P1 / PP 05" },
    { ramal: "6663", pp: "P1 / PP 06" },
    { ramal: "6649", pp: "P1 / PP 07" },
    { ramal: "6620", pp: "Não Mapeado" },
    { ramal: "6633", pp: "Não Mapeado" },
    { ramal: "6623", pp: "P1 / PP 08" },
    { ramal: "6621", pp: "Não Mapeado" },
    { ramal: "6637", pp: "Não Mapeado" },
    { ramal: "6645", pp: "P1 / PP 10" },
    { ramal: "6624", pp: "Não Mapeado" },
    { ramal: "6642", pp: "Não Mapeado" },
    { ramal: "6644", pp: "Não Mapeado" },
    { ramal: "6626", pp: "Não Mapeado" },
    { ramal: "6648", pp: "P2 / PP 08" },
    { ramal: "6611", pp: "P2 / PP 03" },
    { ramal: "6607", pp: "P2 / PP 12" },
    { ramal: "6673", pp: "P2 / PP 15" },
    { ramal: "6627", pp: "P2 / PP 16" },
    { ramal: "6613", pp: "P2 / PP 17" },
    { ramal: "6646", pp: "P2 / PP 20" },
    { ramal: "6610", pp: "P2 / PP 21" },
    { ramal: "6608", pp: "P2 / PP 22" },
    { ramal: "6609", pp: "P2 / PP 23" },
    { ramal: "6665", pp: "P2 / PP 24" },
    { ramal: "6651", pp: "P2 / PP 04 (5-19)" }
];

// ========================================================
// RENDERIZAR OS CARTÕES NA TELA
// ========================================================
function renderizarRamais(dados) {
    const grid = document.getElementById('gridRamais');
    grid.innerHTML = ''; // Limpa antes de desenhar

    dados.forEach(item => {
        // Verifica se o ramal tem porta mapeada para aplicar o estilo correto
        const classePorta = item.pp === "Não Mapeado" ? "ramal-porta ramal-vazio" : "ramal-porta";

        const card = document.createElement('div');
        card.className = 'ramal-card';
        card.innerHTML = `
            <div class="ramal-numero">📞 ${item.ramal}</div>
            <div class="${classePorta}">${item.pp}</div>
        `;
        grid.appendChild(card);
    });
}

// ========================================================
// SISTEMA DE PESQUISA (FILTRO EM TEMPO REAL)
// ========================================================
function filtrarRamais() {
    const input = document.getElementById('searchRamal').value.toLowerCase();

    // Filtra o array buscando tanto no número do ramal quanto no painel
    const filtrados = dadosRamais.filter(item => {
        return item.ramal.toLowerCase().includes(input) ||
            item.pp.toLowerCase().includes(input);
    });

    renderizarRamais(filtrados);
}

// Quando a página carregar, desenha todos os ramais
window.onload = () => {
    // Ordena do menor para o maior ramal para ficar mais organizado na tela
    const dadosOrdenados = dadosRamais.sort((a, b) => a.ramal.localeCompare(b.ramal));
    renderizarRamais(dadosOrdenados);
};