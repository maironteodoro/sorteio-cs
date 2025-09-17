let participants = [];
let tickets = [];

document.getElementById('fileInput').addEventListener('change', handleFile);
document.getElementById('startBtn').addEventListener('click', startRoleta);
document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('modal').style.display = 'none';
});

function handleFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        participants = [];

        for (let i = 1; i < json.length; i++) { // ignorando cabeçalho
            const row = json[i];
            const valor = Number(row[1]);
            const nome = row[row.length - 1];
            if (!isNaN(valor) && nome) participants.push({ nome, valor });
        }

        // Preencher roleta inicial com 10 cards aleatórios
        const initialCards = 10;
        const roleta = document.getElementById('roleta');
        roleta.innerHTML = '';
        for (let i = 0; i < initialCards; i++) {
            const randomParticipant = participants[Math.floor(Math.random() * participants.length)];
            const card = document.createElement('div');
            card.classList.add('card');
            card.textContent = randomParticipant.nome;
            roleta.appendChild(card);
        }
    };
    reader.readAsArrayBuffer(file);
}

function startRoleta() {
    const ticketValue = Number(document.getElementById('ticketValue').value);
    if (!ticketValue || participants.length === 0) return alert("Preencha valor do ticket e carregue arquivo.");

    tickets = [];
    participants.forEach(p => {
        const numTickets = Math.floor(p.valor / ticketValue);
        for (let i = 0; i < numTickets; i++) tickets.push(p.nome);
    });

    if (tickets.length === 0) return alert("Nenhum ticket válido.");

    const winner = tickets[Math.floor(Math.random() * tickets.length)];

    generateRoleta(winner);
}

function generateRoleta(winner) {
    const roleta = document.getElementById('roleta');

    // Reiniciar roleta
    roleta.style.transition = 'none';
    roleta.style.transform = 'translateX(0)';
    roleta.innerHTML = '';

    const speed = Number(document.getElementById('speedSelect').value);
    const cardsBeforeWinner = Math.floor(100 * speed);
    const extraAfterWinner = 10;
    const cards = [];

    // Cards aleatórios antes do vencedor
    for (let i = 0; i < cardsBeforeWinner; i++) {
        const randomName = tickets[Math.floor(Math.random() * tickets.length)];
        cards.push(randomName);
    }

    // Card do vencedor
    cards.push(winner);

    // Cards extras após o vencedor
    for (let i = 0; i < extraAfterWinner; i++) {
        const randomName = tickets[Math.floor(Math.random() * tickets.length)];
        cards.push(randomName);
    }

    // Criar elementos da roleta
    cards.forEach(name => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.textContent = name;
        roleta.appendChild(card);
    });

    // Forçar reflow
    void roleta.offsetWidth;

    // Calcular deslocamento para alinhar vencedor
    const containerWidth = roleta.parentElement.offsetWidth;
    const winnerCard = roleta.children[cardsBeforeWinner];
    const winnerCardOffset = winnerCard.offsetLeft;
    const winnerCardWidth = winnerCard.offsetWidth;

    // porcentagem aleatória dentro do card (3% a 98%)
    const randomPercentInsideCard = 0.03 + Math.random() * (0.98 - 0.03);

    const targetScroll = winnerCardOffset + winnerCardWidth * randomPercentInsideCard - containerWidth / 2;

    // Iniciar som da roleta
    const rouletteSound = new Audio('sounds/roletadas.mp3');
    rouletteSound.volume = 0.4;
    rouletteSound.play();
    setTimeout(() => {
        rouletteSound.pause();
        rouletteSound.currentTime = 0;
    }, 5000);

    // Animar a roleta
    roleta.style.transition = `transform 6s cubic-bezier(0.33, 1, 0.68, 1)`;
    roleta.style.transform = `translateX(-${targetScroll}px)`;

    // Ao finalizar a roleta
    setTimeout(() => {
        // Exibir confetti
        const gifDiv = document.createElement('div');
        gifDiv.style.position = 'fixed';
        gifDiv.style.top = 0;
        gifDiv.style.left = 0;
        gifDiv.style.width = '100%';
        gifDiv.style.height = '100%';
        gifDiv.style.backgroundImage = "url('images/confetti.gif')";
        gifDiv.style.backgroundSize = 'cover';
        gifDiv.style.backgroundPosition = 'center';
        gifDiv.style.backgroundRepeat = 'no-repeat';
        gifDiv.style.zIndex = 999;
        document.body.appendChild(gifDiv);

        // Som de confetti
        const confettiSound = new Audio('sounds/confetti.mp3');
        confettiSound.volume = 0.4;
        confettiSound.play();

        // Mostrar modal
        modal.style.zIndex = 1000;
        modal.style.display = 'flex';
        document.getElementById('winnerName').textContent = `🎉 ${winner}! 🎉`;

        setTimeout(() => {
            document.body.removeChild(gifDiv);
        }, 2000);
    }, 6000);
}


// ----------------------
// TWITCH MINI PLAYER
// ----------------------
const twitchChannels = ['soluxyG', 'brenotheodoro'];
const twitchParent = window.location.hostname; // domínio atual
const clientId = 'SEU_CLIENT_ID'; // coloque seu Client ID da Twitch
const token = 'SEU_TOKEN_DE_ACESSO'; // OAuth Token (se necessário)

async function checkTwitchLive(channel) {
    const resp = await fetch(`https://api.twitch.tv/helix/streams?user_login=${channel}`, {
        headers: {
            'Client-ID': clientId,
            'Authorization': `Bearer ${token}`
        }
    });

    if (!resp.ok) return false;
    const data = await resp.json();
    return (data.data && data.data.length > 0);
}

async function updateTwitchPlayer() {
    for (let ch of twitchChannels) {
        const isLive = await checkTwitchLive(ch);
        if (isLive) {
            const iframe = document.getElementById('twitchEmbedFrame');
            iframe.src = `https://player.twitch.tv/?channel=${ch}&parent=${twitchParent}&autoplay=false`;
            document.getElementById('twitchPlayer').style.display = 'block';
            return;
        }
    }
    // Se nenhum estiver online → esconde o player
    document.getElementById('twitchPlayer').style.display = 'none';
}

// Checa na abertura da página e depois a cada 5 minutos
window.addEventListener('load', updateTwitchPlayer);
setInterval(updateTwitchPlayer, 5 * 60 * 1000);
