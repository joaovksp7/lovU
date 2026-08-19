/* ==========================================================================
   abertura.js — a primeira seção depois do clique: o recado e o abraço.

   O recado ("Aumenta o volume, mor!") e o vídeo saem do objeto `abertura` em
   data/momentos.js — nada de texto nem de nome de arquivo escrito aqui. Este
   arquivo é só a fiação: pega o conteúdo lá, entrega ao js/scroll-mask.js.

   Mesma divisão do croma-card e do particle-text: o componente é genérico e
   não sabe nada da página; quem sabe é a seção.

   Sem `abertura.video` preenchido, o quadro simplesmente não é montado — a
   seção fica só com o recado, sem buraco nem imagem quebrada.

   O bilhete que passa por cima do vídeo (`abertura.aviso`) também sai de lá:
   aqui é só a fiação, como todo o resto.
   ========================================================================== */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    if (typeof abertura === "undefined") return;

    var recado = document.getElementById("abracoRecado");
    var dica   = document.getElementById("abracoDica");
    var quadro = document.getElementById("abracoQuadro");

    if (recado && abertura.recado) recado.textContent = abertura.recado;

    if (dica) {
      if (abertura.dica) { dica.textContent = abertura.dica; }
      else { dica.hidden = true; }
    }

    if (!quadro || !abertura.video) return;
    if (typeof ScrollMask === "undefined" || typeof Lightbox === "undefined") return;

    /* o caminho sai do Lightbox como em todo o resto do site: é ele que sabe
       que "video-001" mora em assets/fotos/ e termina em .mp4 */
    ScrollMask.montar(quadro, {
      variante: abertura.mascara || "iris",
      src:      Lightbox.caminho(abertura.video),
      alt:      abertura.descricao || "",
      palavra:  abertura.palavra || undefined,   /* só a máscara "type" usa */

      /* o bilhete por cima do vídeo; sem `abertura.aviso` o quadro fica limpo */
      aviso:         abertura.aviso || [],
      avisoSegundos: abertura.avisoSegundos,

      /* Os ajustes desta seção; o resto vem do PADRAO do scroll-mask.js —
         pluma, zoom, veu, colunas e companhia estão todos lá, com os nomes
         da doc.

         No PC o quadro cresce até cobrir a tela inteira (`telaCheia`) e faz o
         caminho de volta antes de a seção sair (`saida`). A pista precisa dar
         conta das três partes, e por isso a `corrida` subiu de 1.2 para 1.8.
         Em frações da pista:
           0    -> 0.5   abre, crescendo até a tela toda
           0.5  -> 0.72  fica parada, aberta, para ela ver o abraço
           0.72 -> 1     fecha e encolhe de volta, e a página segue */
      corrida:   1.8,
      assenta:   0.5,
      saida:     0.72,
      telaCheia: true
    });
  });
})();
