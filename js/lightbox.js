/* ==========================================================================
   lightbox.js — UM único componente, usado pelo calendário e pela galeria.
   Não duplique isto: se precisar de outro lugar, chame Lightbox.abrir().

   API:
     Lightbox.abrir(listaDeIds, indice, legenda)
     Lightbox.caminho(id)  -> caminho da mídia grande
     Lightbox.thumb(id)    -> caminho da miniatura
     Lightbox.ehVideo(id)
   ========================================================================== */
var Lightbox = (function () {
  "use strict";

  var PASTA = "assets/fotos/";

  var itens = [];        // ids da sequência aberta
  var indice = 0;
  var legendaAtual = "";
  var origem = null;     // elemento que abriu, para devolver o foco
  var el = {};

  function ehVideo(id) {
    return id.indexOf("video-") === 0;
  }

  function caminho(id) {
    return PASTA + id + (ehVideo(id) ? ".mp4" : ".jpg");
  }

  function thumb(id) {
    // vídeo não tem miniatura gerada (não há ffmpeg na máquina)
    return ehVideo(id) ? "" : PASTA + "thumbs/" + id + ".jpg";
  }

  function pegarElementos() {
    if (el.caixa) return;
    el.caixa    = document.getElementById("lightbox");
    el.midia    = document.getElementById("lbMidia");
    el.legenda  = document.getElementById("lbLegenda");
    el.posicao  = document.getElementById("lbPosicao");
    el.fechar   = document.getElementById("lbFechar");
    el.anterior = document.getElementById("lbAnterior");
    el.proximo  = document.getElementById("lbProximo");
  }

  function desenhar() {
    var id = itens[indice];

    // trocar o nó (em vez de só o src) garante que o vídeo anterior pare
    el.midia.innerHTML = "";

    var midia;
    if (ehVideo(id)) {
      midia = document.createElement("video");
      midia.src = caminho(id);
      midia.controls = true;
      midia.playsInline = true;
      midia.preload = "metadata";
    } else {
      midia = document.createElement("img");
      midia.src = caminho(id);
      midia.alt = legendaAtual || "Uma foto nossa";
    }
    el.midia.appendChild(midia);

    el.legenda.textContent = legendaAtual;
    el.posicao.textContent = itens.length > 1 ? (indice + 1) + " / " + itens.length : "";

    var varios = itens.length > 1;
    el.anterior.hidden = !varios;
    el.proximo.hidden = !varios;
  }

  function ir(passo) {
    if (itens.length < 2) return;
    indice = (indice + passo + itens.length) % itens.length;  // circular
    desenhar();
  }

  function aoTeclar(evento) {
    if (evento.key === "Escape") fechar();
    else if (evento.key === "ArrowLeft") ir(-1);
    else if (evento.key === "ArrowRight") ir(1);
  }

  function abrir(lista, comeco, legenda) {
    if (!lista || !lista.length) return;
    pegarElementos();

    itens = lista.slice();
    indice = comeco || 0;
    legendaAtual = legenda || "";
    origem = document.activeElement;

    desenhar();
    el.caixa.hidden = false;
    document.body.classList.add("travado");
    document.addEventListener("keydown", aoTeclar);
    el.fechar.focus();
  }

  function fechar() {
    if (!el.caixa || el.caixa.hidden) return;

    el.caixa.hidden = true;
    el.midia.innerHTML = "";           // para o vídeo, se houver
    document.body.classList.remove("travado");
    document.removeEventListener("keydown", aoTeclar);

    if (origem && origem.focus) origem.focus();
    origem = null;
  }

  document.addEventListener("DOMContentLoaded", function () {
    pegarElementos();
    if (!el.caixa) return;

    el.fechar.addEventListener("click", fechar);
    el.anterior.addEventListener("click", function () { ir(-1); });
    el.proximo.addEventListener("click", function () { ir(1); });

    // clicar no fundo fecha; clicar na foto, não
    el.caixa.addEventListener("click", function (evento) {
      if (evento.target === el.caixa) fechar();
    });
  });

  return {
    abrir: abrir,
    fechar: fechar,
    caminho: caminho,
    thumb: thumb,
    ehVideo: ehVideo
  };
})();
