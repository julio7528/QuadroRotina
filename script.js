// Evento de rolagem para fixar a barra de progresso na parte inferior
window.addEventListener('scroll', function() {
    const progressContainer = document.getElementById('progressContainer');
    const scrollPosition = window.scrollY || window.pageYOffset;
    
    // Obtém a altura do cabeçalho para usar como ponto de referência
    const headerHeight = document.querySelector('header').offsetHeight;
    
    if (scrollPosition > headerHeight) {
        // Adiciona a classe fixa se o usuário rolar além da altura do cabeçalho
        progressContainer.classList.add('fixed');
    } else {
        // Remove a classe fixa se o usuário rolar para cima
        progressContainer.classList.remove('fixed');
    }
});



// Evento para alternar o tema com o switch
const themeToggleSwitch = document.getElementById('themeSwitch');

// Verifica o estado inicial do tema e ajusta o switch
if (document.body.classList.contains('dark-theme')) {
    themeToggleSwitch.checked = true;
}

themeToggleSwitch.addEventListener('change', function() {
    document.body.classList.toggle('dark-theme');
});


// Evento para o botão de reset
document.getElementById('resetButton').addEventListener('click', function() {
    // Solicita a senha ao usuário
    const senha = prompt('Por favor, insira a senha para resetar os dados:');

    // Verifica se a senha está correta
    if (senha === '123') {
        // Remover o localStorage antigo
        localStorage.removeItem('atividades-segunda');
        localStorage.removeItem('atividades-terca');
        localStorage.removeItem('atividades-quarta');
        localStorage.removeItem('atividades-quinta');
        localStorage.removeItem('atividades-sexta');
        localStorage.removeItem('atividades-sabado');
        localStorage.removeItem('atividades-domingo');

        // Recarregar a página para carregar o novo JSON
        location.reload();
    } else {
        alert('Senha incorreta. Ação cancelada.');
    }
});


// Variável global para armazenar o dia atual
let currentDay = '';

// Event listener para quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {

    // Adiciona eventos aos botões dos dias
    const dayButtons = document.querySelectorAll('.day-button');
    dayButtons.forEach(button => {
        button.addEventListener('click', function() {
            const day = this.getAttribute('data-day');
            currentDay = day;
            loadDayActivities(day);

            // Atualiza a classe 'active' no botão selecionado
            dayButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Evento para o botão de limpar
    const clearButton = document.getElementById('clearButton');
    if (clearButton) {
        clearButton.addEventListener('click', function() {
            if (currentDay) {
                const confirmClear = confirm('Tem certeza de que deseja limpar todos os status?');
                if (confirmClear) {
                    clearStatus();
                }
            } else {
                alert('Por favor, selecione um dia primeiro.');
            }
        });
    }

    // Evento para alternar o tema
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            document.body.classList.toggle('dark-theme');
        });
    }
});

function loadDayActivities(day) {
    // Verifica se já temos atividades armazenadas para o dia no localStorage
    if (!localStorage.getItem(`atividades-${day}`)) {
        // Adiciona um parâmetro de cache busting com a data/hora atual
        const timestamp = new Date().getTime();
        fetch(`${day}.json?cacheBuster=${timestamp}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro HTTP! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                localStorage.setItem(`atividades-${day}`, JSON.stringify(data));
                renderTable(data);
                updateDayTitle(day);
            })
            .catch(error => console.error('Erro ao carregar o arquivo JSON:', error));
    } else {
        // Usa os dados do localStorage se já existirem
        const data = JSON.parse(localStorage.getItem(`atividades-${day}`));
        renderTable(data);
        updateDayTitle(day);
    }
}



// Função para atualizar o título com o dia selecionado
function updateDayTitle(day) {
    const dayTitle = document.getElementById('dayTitle');
    dayTitle.textContent = `Rotina de ${capitalizeFirstLetter(day)}`;
}

// Função auxiliar para capitalizar a primeira letra
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Atualiza o status e salva no localStorage para o dia atual
function updateStatus(radio, status, index) {
    const data = JSON.parse(localStorage.getItem(`atividades-${currentDay}`));
    data[index].status = status;
    localStorage.setItem(`atividades-${currentDay}`, JSON.stringify(data));

    // Atualiza a linha na tabela
    const row = radio.closest('tr');

    // Remove classes anteriores
    row.classList.remove('feito', 'nao-feito');

    // Adiciona a classe correspondente ao status
    if (status === 'feito') {
        row.classList.add('feito');
    } else if (status === 'nao-feito') {
        row.classList.add('nao-feito');
    }

    // Atualiza o progresso
    updateProgress(data);
}

// Limpa o status das atividades do dia atual
function clearStatus() {
    const data = JSON.parse(localStorage.getItem(`atividades-${currentDay}`));
    data.forEach(item => {
        item.status = '';
    });
    localStorage.setItem(`atividades-${currentDay}`, JSON.stringify(data));
    renderTable(data);
}

// Função para renderizar a tabela dinamicamente
function renderTable(data) {
    const tableBody = document.querySelector('table tbody');
    tableBody.innerHTML = '';

    data.forEach((item, index) => {
        const row = document.createElement('tr');

        // Coluna Feito
        const feitoCell = document.createElement('td');
        const feitoRadio = document.createElement('input');
        feitoRadio.type = 'radio';
        feitoRadio.name = `status-${currentDay}-${index}`;
        feitoRadio.classList.add('feito');
        feitoRadio.checked = item.status === 'feito';
        feitoRadio.addEventListener('click', () => {
            updateStatus(feitoRadio, 'feito', index);
        });
        feitoCell.appendChild(feitoRadio);

        // Coluna Não Feito
        const naoFeitoCell = document.createElement('td');
        const naoFeitoRadio = document.createElement('input');
        naoFeitoRadio.type = 'radio';
        naoFeitoRadio.name = `status-${currentDay}-${index}`;
        naoFeitoRadio.classList.add('nao-feito');
        naoFeitoRadio.checked = item.status === 'nao-feito';
        naoFeitoRadio.addEventListener('click', () => {
            updateStatus(naoFeitoRadio, 'nao-feito', index);
        });
        naoFeitoCell.appendChild(naoFeitoRadio);

        // Coluna Horário
        const horarioCell = document.createElement('td');
        horarioCell.textContent = item.horario;

        // Coluna Emoji
        const emojiCell = document.createElement('td');
        emojiCell.classList.add('emoji');
        emojiCell.textContent = item.emoji;

        // Coluna Atividade
        const atividadeCell = document.createElement('td');
        atividadeCell.classList.add('atividade');
        atividadeCell.textContent = item.atividade;

        // Remove classes anteriores
        row.classList.remove('feito', 'nao-feito');

        // Adiciona a classe baseada no status
        if (item.status === 'feito') {
            row.classList.add('feito');
        } else if (item.status === 'nao-feito') {
            row.classList.add('nao-feito');
        }

        // Adiciona as colunas à linha
        row.appendChild(feitoCell);
        row.appendChild(naoFeitoCell);
        row.appendChild(horarioCell);
        row.appendChild(emojiCell);
        row.appendChild(atividadeCell);

        // Adiciona a linha à tabela
        tableBody.appendChild(row);
    });

    // Atualiza o progresso
    updateProgress(data);
}

// Função para atualizar o progresso
function updateProgress(data) {
    const total = data.length;
    const done = data.filter(item => item.status === 'feito').length;
    const percent = Math.round((done / total) * 100);
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    progressBar.value = percent;
    progressText.textContent = `${percent}% concluído`;
}
