// Conectar ao Broker MQTT (via WebSocket)
const client = mqtt.connect("wss://broker.emqx.io:8084/mqtt");  // Usando WebSocket na porta 8084

// Variáveis para controlar personagens e o ID do próximo personagem
let personagens = JSON.parse(localStorage.getItem("personagens")) || {};
let proximoId = parseInt(localStorage.getItem("proximoId")) || 1;

// Função para salvar dados no localStorage
function salvarLocal() {
  console.log("Salvando personagens no localStorage", personagens);
  localStorage.setItem("personagens", JSON.stringify(personagens));
  localStorage.setItem("proximoId", proximoId);
}

// Função para retornar a classe CSS dependendo da vida
function getVidaClasse(vida) {
  if (vida >= 21) return "vida-verde";
  if (vida >= 11) return "vida-amarelo";
  return "vida-vermelho";
}

// Função para renderizar personagens
function renderPersonagens() {
  const container = document.getElementById("personagemContainer");
  if (!container) return;
  container.innerHTML = "<h2>Personagens</h2>";
  console.log("Renderizando personagens:", personagens);

  // Renderiza cada personagem
  Object.values(personagens).forEach(p => {
    const div = document.createElement("div");
    div.className = "personagem";
    div.innerHTML = `
      <h3>${p.nome}</h3>
      <p>Vida: <span id="vida-${p.id}">${p.vida}</span></p>
      <div class="vida-bar">
        <div class="vida-bar-inner ${getVidaClasse(p.vida)}" style="width: ${(p.vida / 30) * 100}%"></div>
      </div>
      <button onclick="alterarVida('${p.id}', 'incrementar')">+1 Vida</button>
      <button onclick="alterarVida('${p.id}', 'decrementar')">-1 Vida</button>
      <button onclick="deletarPersonagem('${p.id}')">Deletar</button>
    `;
    container.appendChild(div);
  });
}

// Função para alterar a vida dos personagens
function alterarVida(id, acao) {
  const personagem = personagens[id];
  if (!personagem) return;

  // Incrementa ou decrementa a vida dependendo da ação
  if (acao === 'incrementar' && personagem.vida < 30) {
    personagem.vida += 1;
  } else if (acao === 'decrementar' && personagem.vida > 0) {
    personagem.vida -= 1;
  }

  // Atualiza o localStorage e a interface
  salvarLocal();
  renderPersonagens();

  // Publicar a nova vida no tópico MQTT correspondente
  const mensagem = JSON.stringify({ vida: personagem.vida });
  client.publish(`personagem/${id}/vida`, mensagem, { qos: 1 });
}

// Função para adicionar um novo personagem
function adicionarPersonagem() {
  const nome = document.getElementById("novoNome").value;
  const vida = parseInt(document.getElementById("novaVida").value);

  // Validação para garantir que o nome e a vida são válidos
  if (!nome || isNaN(vida) || vida < 0 || vida > 30) {
    alert("Insira um nome e uma vida válida entre 0 e 30.");
    return;
  }

  // Gera um novo ID para o personagem
  const id = `manual-${proximoId++}`;
  personagens[id] = { id, nome, vida };

  // Salva os dados e renderiza novamente
  salvarLocal();
  renderPersonagens();

  // Limpa os campos de input
  document.getElementById("novoNome").value = "";
  document.getElementById("novaVida").value = "";

  // Publicar a vida do novo personagem no MQTT
  const mensagem = JSON.stringify({ vida });
  client.publish(`personagem/${id}/vida`, mensagem, { qos: 1 });
}

// Função para deletar o personagem
function deletarPersonagem(id) {
  if (confirm("Tem certeza de que deseja deletar este personagem?")) {
    delete personagens[id];  // Remove o personagem do objeto
    salvarLocal();  // Atualiza o localStorage
    renderPersonagens();  // Re-renderiza a lista de personagens
  }
}

// Função para configurar e iniciar o temporizador
let timerInterval;
let tempoRestante = 0; // Tempo em segundos

function startTimer() {
  // Pega o tempo inserido pelo usuário em minutos e segundos
  const minutos = parseInt(document.getElementById("tempoMinutos").value) || 0;
  const segundos = parseInt(document.getElementById("tempoSegundos").value) || 0;

  // Converte tudo para segundos
  tempoRestante = minutos * 60 + segundos;

  // Valida se o tempo inserido é válido
  if (tempoRestante <= 0) {
    alert("Por favor, insira um tempo válido.");
    return;
  }

  // Inicia a contagem regressiva
  clearInterval(timerInterval); // Limpa qualquer temporizador existente
  timerInterval = setInterval(() => {
    if (tempoRestante > 0) {
      tempoRestante--;
      const minutos = String(Math.floor(tempoRestante / 60)).padStart(2, "0");
      const segundos = String(tempoRestante % 60).padStart(2, "0");
      document.getElementById("timer").textContent = `${minutos}:${segundos}`;
      
      // Envia o tempo restante via MQTT (opcional)
      const message = JSON.stringify({ tempo: tempoRestante });
      client.publish("temporizador/iniciar", message, { qos: 1 });
    } else {
      // Quando o tempo chegar a zero, para o temporizador
      clearInterval(timerInterval);
      alert("Tempo esgotado!");
      document.getElementById("timer").textContent = "00:00";
    }
  }, 1000);
}

// Função para resetar o temporizador
function resetTimer() {
  // Limpa o temporizador e retorna ao valor inserido pelo usuário
  clearInterval(timerInterval);
  document.getElementById("tempoMinutos").value = "";
  document.getElementById("tempoSegundos").value = "";
  document.getElementById("timer").textContent = "00:00";
}

// Aguardar a conexão do MQTT antes de permitir a publicação
client.on('connect', function () {
  console.log('Conectado ao broker MQTT');
  // Após conectar, inscreve-se no tópico de vida do personagem
  Object.keys(personagens).forEach(id => {
    client.subscribe(`personagem/${id}/vida`, (err) => {
      if (err) {
        console.log(`Erro ao inscrever no tópico 'personagem/${id}/vida'`);
      } else {
        console.log(`Inscrito com sucesso no tópico 'personagem/${id}/vida'`);
      }
    });
  });

  // Publicar mensagem de conexão
  const statusMessage = "Conectado com sucesso ao broker MQTT!";
  client.publish('statusYPA/conexao', statusMessage, { qos: 1 });
});

// Verificação de erro de conexão
client.on('error', function (error) {
  console.log('Erro ao conectar no MQTT', error);
});

// Função para inicializar a renderização de personagens ao carregar a página
window.onload = () => {
  renderPersonagens();
};
