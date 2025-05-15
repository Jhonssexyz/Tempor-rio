const menuToggle = document.getElementById('menu-toggle');
const menuItems = document.getElementById('menu-items');

menuToggle.addEventListener('click', () => {
    menuItems.classList.toggle('active'); // Alterna a classe 'active' para mostrar/ocultar o menu
});

// Temporizador
let timerInterval;
let remainingTime = 0;

const timerDisplay = document.getElementById('timer');
const startTimer = document.getElementById('start-timer');
const resetTimer = document.getElementById('reset-timer');
const tempoInput = document.getElementById('tempo-input');

startTimer.addEventListener('click', () => {
    // Pega o tempo definido pelo mestre em minutos e converte para segundos
    const tempoDefinido = parseInt(tempoInput.value, 10);

    if (isNaN(tempoDefinido) || tempoDefinido <= 0) {
        alert('Por favor, insira um tempo válido em minutos.');
        return;
    }

    remainingTime = tempoDefinido * 60; // Converte minutos para segundos
    clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        if (remainingTime > 0) {
            remainingTime--;
            const minutes = Math.floor(remainingTime / 60);
            const seconds = remainingTime % 60;
            timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        } else {
            clearInterval(timerInterval);
            alert('O tempo acabou!');
        }
    }, 1000);
});

resetTimer.addEventListener('click', () => {
    clearInterval(timerInterval);
    remainingTime = 0;
    timerDisplay.textContent = '00:00';
    tempoInput.value = ''; // Limpa o campo de entrada
});