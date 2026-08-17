/* ==========================================================================
   trilha.js — a música da página, na faixa que abre o conteúdo.

   Uma das músicas de assets/audio/, sorteada, em loop, começando no clique
   do "Entrar" — o app.js chama Trilha.iniciar() de dentro do gesto, porque
   o iPhone só aceita áudio que nasce assim. No lugar da capa do álbum entra
   uma foto nossa, também sorteada.

   O volume fica em 30% do original, e NÃO por `audio.volume`: o Safari do
   iPhone ignora essa propriedade. Quem abaixa o som é um GainNode da Web
   Audio API, que o iOS respeita. Sem Web Audio, cai no `audio.volume`, que
   resolve no computador e no Android.

   O player do Spotify não toca aqui — ele é a seção "A nossa playlist" lá
   embaixo, para ver e abrir. O embed é cross-origin: não dá para dar play
   nele por JS no celular nem para mexer no volume dele em lugar nenhum.

   Nada é baixado antes do clique: o <audio> nasce com preload="none".
   ========================================================================== */
var Trilha = (function () {
  "use strict";

  var PASTA  = "assets/audio/";
  var VOLUME = 0.3;        // 30% do original — é aqui que se mexe se estourar

  var el = {};
  var indice   = 0;
  var iniciada = false;
  var pronta   = false;    // só vira true com a barra inteira ligada
  var contexto = null;     // AudioContext, quando o navegador tiver

  /* ------------------------------ ferramentas ------------------------------ */

  function sorteio(total) {
    return Math.floor(Math.random() * total);
  }

  // uma foto nossa qualquer, no lugar da capa do álbum — vídeo não serve,
  // porque não tem miniatura gerada
  function fotoAleatoria() {
    if (typeof fotos === "undefined" || !fotos.length) return "";

    var soFotos = fotos.filter(function (id) { return !Lightbox.ehVideo(id); });
    if (!soFotos.length) return "";

    return soFotos[sorteio(soFotos.length)];
  }

  function pegarElementos() {
    el.barra    = document.getElementById("trilha");
    el.capa     = document.getElementById("trilhaCapa");
    el.titulo   = document.getElementById("trilhaTitulo");
    el.artista  = document.getElementById("trilhaArtista");
    el.audio    = document.getElementById("trilhaAudio");
    el.anterior = document.getElementById("trilhaAnterior");
    el.tocar    = document.getElementById("trilhaTocar");
    el.proxima  = document.getElementById("trilhaProxima");
  }

  /* -------------------------------- a faixa -------------------------------- */

  function desenharFaixa() {
    var faixa = trilha[indice];

    el.titulo.textContent  = faixa.titulo;
    el.artista.textContent = faixa.artista;

    // capa nova a cada música, para não repetir sempre a mesma foto
    var id = fotoAleatoria();
    if (id) el.capa.src = Lightbox.thumb(id);
  }

  function marcarTocando(sim) {
    el.tocar.textContent = sim ? "❚❚" : "▶";
    el.tocar.setAttribute("aria-label", sim ? "Pausar a música" : "Tocar a música");
  }

  function tocar() {
    var caminho = PASTA + trilha[indice].arquivo + ".mp3";

    // getAttribute e não .src: o .src devolve a URL absoluta e nunca bateria
    if (el.audio.getAttribute("src") !== caminho) el.audio.setAttribute("src", caminho);

    var promessa = el.audio.play();

    // iPhone no silencioso, ou autoplay recusado: não é erro, só volta para o
    // estado de pausado e ela toca no play quando quiser
    if (promessa && promessa.catch) promessa.catch(function () { marcarTocando(false); });
  }

  function alternar() {
    if (el.audio.paused) tocar();
    else el.audio.pause();
  }

  function trocarFaixa(passo) {
    indice = (indice + passo + trilha.length) % trilha.length;   // circular
    desenharFaixa();
    tocar();
  }

  /* -------------------------------- o volume -------------------------------- */

  // Montado DENTRO do clique: no iPhone o AudioContext nasce suspenso e só
  // sai desse estado dentro de um gesto.
  function ligarVolume() {
    var Contexto = window.AudioContext || window.webkitAudioContext;

    // Sobre file:// (duplo clique no index.html) o Chrome trata cada arquivo
    // como origem opaca: o áudio entraria no GainNode e sairia MUDO. Aí o
    // volume tem que vir do elemento mesmo.
    // Sem Web Audio, mesma saída — que o iPhone ignora, mas é melhor que nada
    // nos outros navegadores.
    if (!Contexto || location.protocol === "file:") {
      el.audio.volume = VOLUME;
      return;
    }

    try {
      contexto = new Contexto();

      var fonte = contexto.createMediaElementSource(el.audio);
      var ganho = contexto.createGain();

      // o volume do elemento fica em 1 de propósito: com o áudio passando
      // pelo ganho, os dois se multiplicariam e o som sumiria
      ganho.gain.value = VOLUME;
      fonte.connect(ganho);
      ganho.connect(contexto.destination);

      if (contexto.state === "suspended") contexto.resume();
    } catch (erro) {
      contexto = null;
      el.audio.volume = VOLUME;
    }
  }

  /* --------------------------------- partida -------------------------------- */

  // chamada pelo app.js DENTRO do clique no "Entrar". Nada de assíncrono
  // aqui: no iPhone o play precisa sair de dentro do gesto.
  // `pronta` não é paranoia — esta é a primeira linha do clique, e se ela
  // estourar a tela de entrada nunca sai da frente.
  function iniciar() {
    if (iniciada || !pronta) return;
    iniciada = true;

    ligarVolume();
    tocar();
  }

  document.addEventListener("DOMContentLoaded", function () {
    pegarElementos();
    if (!el.barra || !el.audio) return;

    // sem músicas cadastradas a barra simplesmente não aparece
    if (typeof trilha === "undefined" || !trilha.length) return;

    indice = sorteio(trilha.length);
    el.audio.loop = true;
    desenharFaixa();
    marcarTocando(false);

    el.tocar.addEventListener("click", alternar);
    el.anterior.addEventListener("click", function () { trocarFaixa(-1); });
    el.proxima.addEventListener("click", function () { trocarFaixa(1); });

    el.audio.addEventListener("play",  function () { marcarTocando(true); });
    el.audio.addEventListener("pause", function () { marcarTocando(false); });

    el.barra.hidden = false;
    pronta = true;
  });

  return { iniciar: iniciar };
})();
