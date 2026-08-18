/* ==========================================================================
   timeline.js — os marcos, alternando lados numa linha central.
   Lê o array `timeline` de data/momentos.js. Para adicionar um marco,
   mexa lá, nunca aqui.
   (O id do elemento é "timelineLista" e não "timeline" para não confundir
   com a constante de mesmo nome que guarda os dados.)

   Um marco com `destaque: true` troca a foto comum pelo cartão cromático
   (js/croma-card.js): a mesma imagem, só que como textura num plano 3D com
   shader. O resto do marco — data, título, descrição — não muda.

   Um marco com `corte: true` deixa de ficar de um lado do caule e passa a
   atravessar a timeline inteira, cortando-a em duas (quem faz o corte é o
   CSS: o marco largo não desenha o pedaço de caule que lhe caberia). O
   título dele vira texto de partículas (js/particle-text.js).
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

  /* a foto do marco: miniatura de sempre, ou o cartão cromático no destaque */
  function montarFoto(marco, li) {
    // o cartão precisa da imagem grande — ela vira textura e é ampliada
    if (marco.destaque && typeof CromaCard !== "undefined") {
      var caixa = document.createElement("div");
      caixa.className = "croma";
      li.appendChild(caixa);
      CromaCard.montar(caixa, {
        src: Lightbox.caminho(marco.foto),
        reserva: Lightbox.thumb(marco.foto),
        alt: marco.titulo
      });
      return;
    }

    var img = document.createElement("img");
    img.className = "marco__foto";
    img.src = Lightbox.thumb(marco.foto);
    img.alt = marco.titulo;
    img.loading = "lazy";
    li.appendChild(img);
  }

  function montarMarco(marco) {
    var li = document.createElement("li");
    li.className = "marco";
    li.setAttribute("data-revelar", "");
    if (marco.destaque) { li.classList.add("marco--croma"); }
    if (marco.corte) { li.classList.add("marco--corte"); }

    var data = document.createElement("span");
    data.className = "marco__data";
    data.textContent = porExtenso(marco.data);
    li.appendChild(data);

    var titulo = document.createElement("h3");
    titulo.className = "marco__titulo";
    titulo.textContent = marco.titulo;
    li.appendChild(titulo);

    // sem esta guarda, um marco sem descrição escreveria "undefined" na página
    if (marco.descricao) {
      var descricao = document.createElement("p");
      descricao.className = "marco__descricao";
      descricao.textContent = marco.descricao;
      li.appendChild(descricao);
    }

    if (marco.foto) { montarFoto(marco, li); }

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
      var li = montarMarco(marco);
      lista.appendChild(li);

      /* o texto de partículas só pode ser montado com o marco JÁ na página:
         ele lê a fonte e a largura que o CSS deu ao título, e elemento solto
         não tem nem uma coisa nem outra */
      if (marco.corte && typeof ParticleText !== "undefined") {
        ParticleText.montar(li.querySelector(".marco__titulo"));
      }
    });
  });
})();
