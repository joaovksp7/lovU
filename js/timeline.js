/* ==========================================================================
   timeline.js — os marcos, alternando lados numa linha central.
   Lê o array `timeline` de data/momentos.js. Para adicionar um marco,
   mexa lá, nunca aqui.
   (O id do elemento é "timelineLista" e não "timeline" para não confundir
   com a constante de mesmo nome que guarda os dados.)
   ========================================================================== */
(function () {
  "use strict";

  var MESES = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
  ];

  /* "2025-10-13" -> "13 de outubro de 2025".
     Quebro a string na mão em vez de usar new Date("2025-10-13"), que o
     navegador leria como UTC e poderia mostrar o dia anterior no Brasil. */
  function porExtenso(chave) {
    var p = chave.split("-");
    var dia = parseInt(p[2], 10);
    var mes = parseInt(p[1], 10) - 1;
    return dia + " de " + MESES[mes] + " de " + p[0];
  }

  function montarMarco(marco) {
    var li = document.createElement("li");
    li.className = "marco";
    li.setAttribute("data-revelar", "");

    var data = document.createElement("span");
    data.className = "marco__data";
    data.textContent = porExtenso(marco.data);
    li.appendChild(data);

    var titulo = document.createElement("h3");
    titulo.className = "marco__titulo";
    titulo.textContent = marco.titulo;
    li.appendChild(titulo);

    var descricao = document.createElement("p");
    descricao.className = "marco__descricao";
    descricao.textContent = marco.descricao;
    li.appendChild(descricao);

    if (marco.foto) {
      var img = document.createElement("img");
      img.className = "marco__foto";
      img.src = Lightbox.thumb(marco.foto);
      img.alt = marco.titulo;
      img.loading = "lazy";
      li.appendChild(img);
    }

    return li;
  }

  document.addEventListener("DOMContentLoaded", function () {
    var lista = document.getElementById("timelineLista");
    if (!lista || typeof timeline === "undefined") return;

    // ordem cronológica, independente de como foram escritos no arquivo
    var marcos = timeline.slice().sort(function (a, b) {
      return a.data < b.data ? -1 : a.data > b.data ? 1 : 0;
    });

    marcos.forEach(function (marco) {
      lista.appendChild(montarMarco(marco));
    });
  });
})();
