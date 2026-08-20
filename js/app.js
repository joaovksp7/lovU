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
    var rodape = document.getElementById("rodapeTexto");

    // duas linhas fixas na entrada: o nome dela em cima, "& " + o dele embaixo.
    // Nós de texto e um <br>, não innerHTML — os nomes vêm de dados e não
    // precisam passar por interpretação de HTML.
    if (titulo) {
      titulo.textContent = "";
      titulo.appendChild(document.createTextNode(casal.nomeA));
      titulo.appendChild(document.createElement("br"));
      titulo.appendChild(document.createTextNode("& " + casal.nomeB));
    }
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

    /* O gatilho é o TOPO do elemento cruzando 88% da tela — não uma fatia de
       12% dele. A diferença importa: exigir 12% do próprio elemento quebra
       para qualquer coisa mais alta que a tela, e a seção da timeline passa
       de 9000px. Com 12% ela precisaria mostrar 1100px de uma vez numa tela
       de 900 — impossível, então nunca revelava e ficava invisível para
       sempre. Assim o critério vale igual para um marco de 130px e para a
       timeline inteira. */
    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting) return;
        entrada.target.classList.add("revelado");
        observador.unobserve(entrada.target);   // revela uma vez só
      });
    }, { threshold: 0, rootMargin: "0px 0px -12% 0px" });

    alvos.forEach(function (alvo) { observador.observe(alvo); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    preencherNomes();
    ligarEntrada();
    ligarRevelacoes();
  });
})();
