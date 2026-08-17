/* ==========================================================================
   calendario.js — um mês por vez. Um dia só acende (e só é clicável) se a
   chave AAAA-MM-DD dele existir em `fotosPorDia` (data/momentos.js).
   Ao clicar, abre o lightbox compartilhado com as fotos do dia.
   ========================================================================== */
(function () {
  "use strict";

  // onde tudo começou — mude aqui se quiser abrir noutro mês
  var ANO_INICIAL = 2025;
  var MES_INICIAL = 9;   // 9 = outubro (mês em JS começa no 0)

  var MESES = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
  ];

  var ano = ANO_INICIAL;
  var mes = MES_INICIAL;
  var elMes, elGrade;

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

    // com foto vira botão (clicável e alcançável pelo teclado); sem foto, não
    var celula = document.createElement(temFoto ? "button" : "span");
    celula.className = "cal__dia";
    celula.textContent = dia;

    var ehHoje = hoje.getFullYear() === ano &&
                 hoje.getMonth() === mes &&
                 hoje.getDate() === dia;
    if (ehHoje) celula.classList.add("cal__dia--hoje");

    if (temFoto) {
      celula.type = "button";
      celula.classList.add("cal__dia--tem-foto");
      celula.setAttribute(
        "aria-label",
        porExtenso(chave) + " — " + doDia.length + (doDia.length === 1 ? " foto" : " fotos")
      );
      celula.addEventListener("click", function () {
        Lightbox.abrir(doDia, 0, porExtenso(chave));
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
    desenhar();
  }

  document.addEventListener("DOMContentLoaded", function () {
    elMes   = document.getElementById("calMes");
    elGrade = document.getElementById("calGrade");
    if (!elGrade) return;

    document.getElementById("calAnterior").addEventListener("click", function () { navegar(-1); });
    document.getElementById("calProximo").addEventListener("click", function () { navegar(1); });

    desenhar();
  });
})();
