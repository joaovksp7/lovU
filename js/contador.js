/* ==========================================================================
   contador.js — quanto tempo faz, ao vivo.
   Mês em JS começa no 0: 4 = maio.
   A data nasce à meia-noite local, então a contagem de dias não oscila com
   fuso nem com horário de verão.

   O contador de "desde que a gente conversa" saiu por ora — o começo da
   história agora é contado pela timeline e pelo calendário, que sabem de
   mais dias do que uma data só.
   ========================================================================== */
(function () {
  "use strict";

  var INICIO_NAMORO = new Date(2026, 4, 22);   // 22/05/2026  (data principal)

  var elNamoro, elDetalhe, elRelogio;

  /* Conta dias comparando só as datas (sem horas). O Math.round absorve a
     hora que o horário de verão tira ou põe no meio do caminho. */
  function diasEntre(inicio, agora) {
    var a = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
    var b = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    return Math.round((b - a) / 86400000);
  }

  /* Quebra em anos, meses e dias de calendário — não em médias de 30 dias. */
  function detalhar(inicio, agora) {
    var anos  = agora.getFullYear() - inicio.getFullYear();
    var meses = agora.getMonth() - inicio.getMonth();
    var dias  = agora.getDate() - inicio.getDate();

    if (dias < 0) {
      meses -= 1;
      // dia 0 do mês atual = último dia do mês anterior
      dias += new Date(agora.getFullYear(), agora.getMonth(), 0).getDate();
    }
    if (meses < 0) {
      meses += 12;
      anos -= 1;
    }
    return { anos: anos, meses: meses, dias: dias };
  }

  function plural(n, singular, pluralPalavra) {
    return n + " " + (n === 1 ? singular : pluralPalavra);
  }

  function frasear(d) {
    var partes = [];
    if (d.anos)  partes.push(plural(d.anos, "ano", "anos"));
    if (d.meses) partes.push(plural(d.meses, "mês", "meses"));
    if (d.dias)  partes.push(plural(d.dias, "dia", "dias"));

    if (!partes.length) return "hoje é o primeiro dia";
    if (partes.length === 1) return partes[0];
    return partes.slice(0, -1).join(", ") + " e " + partes[partes.length - 1];
  }

  function doisDigitos(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function atualizar() {
    var agora = new Date();

    elNamoro.textContent  = diasEntre(INICIO_NAMORO, agora).toLocaleString("pt-BR");
    elDetalhe.textContent = "ou seja, " + frasear(detalhar(INICIO_NAMORO, agora));

    // como as datas começam à meia-noite, o tempo do dia corrente é o relógio
    elRelogio.textContent =
      "e mais " + agora.getHours() + "h " +
      doisDigitos(agora.getMinutes()) + "min " +
      doisDigitos(agora.getSeconds()) + "s de hoje";
  }

  document.addEventListener("DOMContentLoaded", function () {
    elNamoro  = document.getElementById("diasNamoro");
    elDetalhe = document.getElementById("detalheNamoro");
    elRelogio = document.getElementById("relogioVivo");

    if (!elNamoro) return;

    atualizar();
    setInterval(atualizar, 1000);
  });
})();
