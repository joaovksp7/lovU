/* ==========================================================================
   calendario.js — um mês por vez. Um dia acende (e vira clicável) se a chave
   AAAA-MM-DD dele existir em `fotosPorDia` OU em `frasesPorDia`
   (data/momentos.js).

   Dia com foto  -> abre o lightbox compartilhado, com a frase de legenda.
   Dia só frase  -> escreve o recado no parágrafo abaixo da grade. Nem toda
                    data guardada sobrou foto, e essas merecem estar aqui
                    do mesmo jeito.
   ========================================================================== */
(function () {
  "use strict";

  // onde tudo começou — mude aqui se quiser abrir noutro mês
  var ANO_INICIAL = 2025;
  var MES_INICIAL = 9;   // 9 = outubro (mês em JS começa no 0)

  // o tempo em que a gente não se falou: cada dia daqui vira quadradinho de
  // espinho, e o mês que cabe inteiro aqui dentro fica em preto e branco.
  // Termina em 12/10 porque 13/10/2025 é o dia em que o espinho se quebrou —
  // esse fica aceso, do lado de fora.
  var ESPINHO_INICIO = "2024-10-19";
  var ESPINHO_FIM    = "2025-10-12";

  var MESES = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
  ];

  var ano = ANO_INICIAL;
  var mes = MES_INICIAL;
  var elPainel, elMes, elGrade, elRecado;

  function doisDigitos(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function chaveDe(ano, mes, dia) {
    return ano + "-" + doisDigitos(mes + 1) + "-" + doisDigitos(dia);
  }

  function porExtenso(chave) {
    var p = chave.split("-");
    return parseInt(p[2], 10) + " de " + MESES[parseInt(p[1], 10) - 1] + " de " + p[0];
  }

  /* AAAA-MM-DD é ordenável como texto — dá para comparar direto */
  function noEspinho(chave) {
    return chave >= ESPINHO_INICIO && chave <= ESPINHO_FIM;
  }

  function fraseDe(chave) {
    return (typeof frasesPorDia !== "undefined" && frasesPorDia[chave]) || "";
  }

  /* o recado do dia sem foto — e some sozinho quando ela troca de mês */
  function mostrarRecado(chave, frase) {
    if (!elRecado) return;
    elRecado.innerHTML = "";

    var data = document.createElement("strong");
    data.className = "cal__recado-data";
    data.textContent = porExtenso(chave);
    elRecado.appendChild(data);
    elRecado.appendChild(document.createTextNode(frase));
    elRecado.hidden = false;
  }

  function limparRecado() {
    if (!elRecado) return;
    elRecado.innerHTML = "";
    elRecado.hidden = true;
  }

  function celulaVazia() {
    var vazia = document.createElement("span");
    vazia.className = "cal__dia cal__dia--vazio";
    vazia.setAttribute("aria-hidden", "true");
    return vazia;
  }

  function celulaDia(dia, hoje) {
    var chave = chaveDe(ano, mes, dia);
    var doDia = (typeof fotosPorDia !== "undefined") ? fotosPorDia[chave] : null;
    var temFoto = !!(doDia && doDia.length);
    var frase = fraseDe(chave);

    // com foto ou com frase vira botão (clicável e alcançável pelo teclado)
    var marcado = temFoto || !!frase;
    var celula = document.createElement(marcado ? "button" : "span");
    celula.className = "cal__dia";
    celula.textContent = dia;

    if (noEspinho(chave)) celula.classList.add("cal__dia--espinho");

    var ehHoje = hoje.getFullYear() === ano &&
                 hoje.getMonth() === mes &&
                 hoje.getDate() === dia;
    if (ehHoje) celula.classList.add("cal__dia--hoje");

    if (temFoto) {
      celula.type = "button";
      celula.classList.add("cal__dia--tem-foto");
      celula.setAttribute(
        "aria-label",
        porExtenso(chave) + " — " + doDia.length + (doDia.length === 1 ? " foto" : " fotos") +
        (frase ? ": " + frase : "")
      );
      celula.addEventListener("click", function () {
        limparRecado();   // quem fala agora é a legenda do lightbox
        Lightbox.abrir(doDia, 0, frase || porExtenso(chave));
      });
    } else if (frase) {
      celula.type = "button";
      celula.classList.add("cal__dia--so-frase");
      celula.setAttribute("aria-label", porExtenso(chave) + " — " + frase);
      celula.addEventListener("click", function () {
        mostrarRecado(chave, frase);
      });
    }

    return celula;
  }

  function desenhar() {
    elMes.textContent = MESES[mes] + " de " + ano;
    elGrade.innerHTML = "";

    var primeiroDiaDaSemana = new Date(ano, mes, 1).getDay();     // 0 = domingo
    var diasNoMes = new Date(ano, mes + 1, 0).getDate();          // dia 0 do mês seguinte
    var hoje = new Date();

    // do dia 1 ao último: se as duas pontas caem no espinho, o mês inteiro cai
    if (elPainel) {
      elPainel.classList.toggle(
        "cal--sombrio",
        noEspinho(chaveDe(ano, mes, 1)) && noEspinho(chaveDe(ano, mes, diasNoMes))
      );
    }

    for (var i = 0; i < primeiroDiaDaSemana; i++) {
      elGrade.appendChild(celulaVazia());
    }
    for (var dia = 1; dia <= diasNoMes; dia++) {
      elGrade.appendChild(celulaDia(dia, hoje));
    }
  }

  function navegar(passo) {
    mes += passo;
    if (mes > 11) { mes = 0; ano += 1; }
    if (mes < 0)  { mes = 11; ano -= 1; }
    limparRecado();
    desenhar();
  }

  document.addEventListener("DOMContentLoaded", function () {
    elMes    = document.getElementById("calMes");
    elGrade  = document.getElementById("calGrade");
    elRecado = document.getElementById("calRecado");
    if (!elGrade) return;
    elPainel = elGrade.closest(".cal");

    document.getElementById("calAnterior").addEventListener("click", function () { navegar(-1); });
    document.getElementById("calProximo").addEventListener("click", function () { navegar(1); });

    desenhar();
  });
})();
