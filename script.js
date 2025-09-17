let tickets = [];
let originalRows = [];
let ticketValue = 1;

const fileInput = document.getElementById('file');
const drawBtn = document.getElementById('draw');
const ticketInput = document.getElementById('ticketValue');
const modal = document.getElementById('modal');
const modalContent = document.getElementById('modalContent');
const strip = document.getElementById('strip');

fileInput.addEventListener('change', handleFile);
ticketInput.addEventListener('change', () => {
  ticketValue = parseInt(ticketInput.value) || 1;
  recalcTickets();
  previewTickets();
});

window.onload = () => modal.style.display = 'none';

async function handleFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  originalRows = rows;
  recalcTickets();
  previewTickets();
}

function recalcTickets() {
  tickets = [];
  originalRows.forEach(r => {
    let nome = "Sem Nome";
    for (const key in r) {
      if (key.toLowerCase().includes("instagram") || key.toLowerCase().includes("twitch")) {
        nome = r[key];
        break;
      }
    }
    const gasto = parseInt(r['Quantos dólares você depositou?'] || 0);
    const qtdTickets = Math.floor(gasto / ticketValue);
    tickets.push({ owner: nome, qtdTickets });
  });
  drawBtn.disabled = tickets.length === 0;
}

// gerar preview com 8 nomes aleatórios
function previewTickets() {
  strip.innerHTML = '';
  if (!tickets.length) return;

  const allTickets = [];
  tickets.forEach(t => {
    for (let i = 0; i < t.qtdTickets; i++) allTickets.push(t.owner);
  });

  const previewItems = [];
  for (let i = 0; i < Math.min(8, allTickets.length); i++) {
    const randomIndex = Math.floor(Math.random() * allTickets.length);
    previewItems.push(allTickets[randomIndex]);
    allTickets.splice(randomIndex,1);
  }

  previewItems.forEach(name => {
    const div = document.createElement('div');
    div.className = 'item';
    div.innerText = name;
    strip.appendChild(div);
  });
}

drawBtn.onclick = () => {
  if (!tickets.length) return;

  // tocar som da roleta por 5s
  const rouletteSound = new Audio('sounds/roletadas.mp3');
  rouletteSound.volume = 0.4
  rouletteSound.play();
  setTimeout(() => {
    rouletteSound.pause();
    rouletteSound.currentTime = 0;
  }, 5000);

  // criar strip completa
  let stripItems = [];
  tickets.forEach(t => {
    for (let i = 0; i < t.qtdTickets; i++) stripItems.push(t.owner);
  });

  stripItems = stripItems.sort(() => Math.random() - 0.5);

  strip.innerHTML = '';
  stripItems.forEach(name => {
    const div = document.createElement('div');
    div.className = 'item';
    div.innerText = name;
    strip.appendChild(div);
  });

  const items = strip.querySelectorAll('.item');
  const boxWidth = document.getElementById('box').offsetWidth;

  // escolher vencedor aleatório
  const winnerIndex = Math.floor(Math.random() * items.length);

  // calcular posição final
  const center = boxWidth / 2;
  const winnerPos = winnerIndex * items[0].offsetWidth + items[0].offsetWidth/2;
  const finalTranslate = center - winnerPos;

  // animação suave com desaceleração
  let current = 0;
  const duration = 5000; // 5s
  const fps = 60;
  const totalFrames = duration / (1000/fps);
  let frame = 0;

  function animate() {
    const progress = frame / totalFrames;
    const ease = 1 - Math.pow(1 - progress, 3);
    const translate = current + (finalTranslate - current) * ease;
    strip.style.transform = `translateX(${translate}px)`;

    frame++;
    if(frame <= totalFrames) requestAnimationFrame(animate)
    else showWinner();
  }

  function showWinner() {
    // criar div para GIF full screen
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
    gifDiv.style.zIndex = 9999;
    document.body.appendChild(gifDiv);

    // tocar som confetti.mp3 no modal
    const confettiSound = new Audio('sounds/confetti.mp3');
    confettiSound.volume = 0.2; // 60% mais baixo
    confettiSound.play();

    // remover GIF após 2 segundos
    setTimeout(() => {
      document.body.removeChild(gifDiv);
    }, 2000);

    // mostrar modal com vencedor
    modal.style.display = 'flex';
    document.getElementById('winnerText').innerText = `🎉 Parabéns ${stripItems[winnerIndex]}! 🎉`;
  }

  animate();
};
