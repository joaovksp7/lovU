/* ==========================================================================
   galeria.js — a grade com tudo. Carrega só as miniaturas; a imagem grande
   só é baixada quando o lightbox abre. Reaproveita o mesmo Lightbox do
   calendário — não existe um segundo componente.
   ========================================================================== */
(function () {
  "use strict";

  function montarItem(id, posicao) {
    var botao = document.createElement("button");
    botao.type = "button";
    botao.className = "galeria__item";

    if (Lightbox.ehVideo(id)) {
      // sem ffmpeg na máquina não há quadro do vídeo: entra um card com play
      botao.setAttribute("aria-label", "Abrir o vídeo");
      var card = document.createElement("span");
      card.className = "galeria__video";
      card.innerHTML =
        '<span class="galeria__play" aria-hidden="true">&#9654;</span>' +
        '<span class="galeria__rotulo">Vídeo</span>';
      botao.appendChild(card);
    } else {
      botao.setAttribute("aria-label", "Abrir a foto " + posicao);
      var img = document.createElement("img");
      img.src = Lightbox.thumb(id);
      img.alt = "Foto nossa " + posicao;
      img.loading = "lazy";
      img.decoding = "async";
      botao.appendChild(img);
    }

    botao.addEventListener("click", function () {
      Lightbox.abrir(fotos, posicao - 1, "");
    });

    return botao;
  }

  document.addEventListener("DOMContentLoaded", function () {
    var grade = document.getElementById("galeria");
    if (!grade || typeof fotos === "undefined") return;

    fotos.forEach(function (id, i) {
      grade.appendChild(montarItem(id, i + 1));
    });

    var contagem = document.getElementById("galeriaContagem");
    if (contagem) {
      var qtdVideos = fotos.filter(Lightbox.ehVideo).length;
      var qtdFotos = fotos.length - qtdVideos;
      contagem.textContent = qtdFotos + " momentos guardados" +
        (qtdVideos ? " e " + (qtdVideos === 1 ? "um vídeo" : qtdVideos + " vídeos") : "") + ".";
    }
  });
})();
