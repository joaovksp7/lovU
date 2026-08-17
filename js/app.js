/* ==========================================================================
   app.js — a partida: nomes na tela de entrada, o clique que revela a
   página e as animações de aparecer ao rolar.
   Carregado por último, quando as outras seções já se desenharam.

   O clique no "Entrar" também dá a partida na música (js/trilha.js). Isso
   tem que acontecer DENTRO do gesto, senão o Safari do iPhone recusa o áudio.
   ========================================================================== */
(function () {
  "use strict";

  function preencherNomes() {
    if (typeof casal === "undefined") return;

    var titulo = document.getElementById("entradaTitulo");
    var frase  = document.getElementById("entradaFrase");
    var rodape = document.getElementById("rodapeTexto");

    if (titulo) titulo.textContent = casal.nomeA + " & " + casal.nomeB;
    if (frase)  frase.textContent = casal.frase;
    if (rodape) rodape.textContent = "Feito com amor por " + casal.nomeB + "(e claudIA rs), para " + casal.nomeA + ".";

    document.title = casal.nomeA + " & " + casal.nomeB;
  }

  function ligarEntrada() {
    var entrada = document.getElementById("entrada");
    var botao   = document.getElementById("btnEntrar");
    var conteudo = document.getElementById("conteudo");
    if (!entrada || !botao) return;

    document.body.classList.add("travado");

    botao.addEventListener("click", function () {
      // primeiro e sem nada de assíncrono antes: o play precisa sair de
      // dentro do gesto para o navegador do celular aceitar
      if (typeof Trilha !== "undefined") Trilha.iniciar();

      entrada.classList.add("entrada--saindo");
      document.body.classList.remove("travado");
      if (conteudo) conteudo.classList.add("conteudo--visivel");

      // tira do caminho depois do fade, para não bloquear cliques
      window.setTimeout(function () {
        entrada.style.display = "none";
      }, 900);
    });

    botao.focus();
  }

  function ligarRevelacoes() {
    var alvos = document.querySelectorAll("[data-revelar]");

    // sem IntersectionObserver (navegador antigo), mostra tudo de uma vez
    if (!("IntersectionObserver" in window)) {
      alvos.forEach(function (alvo) { alvo.classList.add("revelado"); });
      return;
    }

    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting) return;
        entrada.target.classList.add("revelado");
        observador.unobserve(entrada.target);   // revela uma vez só
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });

    alvos.forEach(function (alvo) { observador.observe(alvo); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    preencherNomes();
    ligarEntrada();
    ligarRevelacoes();
  });
})();
