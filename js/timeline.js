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

   Marco cujo `foto` é um vídeo toca sozinho, em loop e sem som (autoplay só
   existe mudo). Quem pediu `prefers-reduced-motion` recebe o vídeo parado,
   esperando o play dela.
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

  function menosMovimento() {
    return !!(window.matchMedia &&
              window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  /* ------------------------------------------------------------------------
     Clicar na foto do marco abre o DIA INTEIRO, não só aquela foto.

     A ponte entre a timeline e o calendário é a data: os dois falam a mesma
     chave AAAA-MM-DD. Datar mais fotos em `fotosPorDia` engorda o marco
     sozinho — nada aqui precisa saber quantas são.
     ------------------------------------------------------------------------ */

  /* Todas as fotos do dia do marco. Dia ainda não datado devolve só a foto do
     próprio marco; e ela nunca fica de fora, mesmo que alguém esqueça de
     listá-la no dia lá no momentos.js. */
  function fotosDoDia(marco) {
    var doDia = (typeof fotosPorDia !== "undefined" && fotosPorDia[marco.data]) || [];
    var lista = doDia.slice();
    if (lista.indexOf(marco.foto) === -1) lista.unshift(marco.foto);
    return lista;
  }

  function legendaDe(marco) {
    return (typeof frasesPorDia !== "undefined" && frasesPorDia[marco.data]) ||
           marco.titulo ||
           porExtenso(marco.data);
  }

  /* abre onde ela tocou, não na primeira do dia — daí as setas para os lados */
  function abrirDia(marco) {
    var lista = fotosDoDia(marco);
    Lightbox.abrir(lista, lista.indexOf(marco.foto), legendaDe(marco));
  }

  function rotuloDe(marco) {
    var quantas = fotosDoDia(marco).length;
    return quantas > 1
      ? "Ver as " + quantas + " fotos de " + porExtenso(marco.data)
      : "Ver a foto de " + porExtenso(marco.data);
  }

  function ehAtalho(evento) {
    return evento.key === "Enter" || evento.key === " " || evento.key === "Spacebar";
  }

  /* O elemento vira botão sem TROCAR de tag: embrulhar a foto num <button>
     mudaria o alinhamento dos marcos — o zigue-zague da timeline vive num
     `margin-left: auto` na própria .marco__foto, e o wrapper ficaria no meio. */
  function vestirDeBotao(elemento, marco) {
    elemento.classList.add("marco__lupa");
    elemento.setAttribute("role", "button");
    elemento.setAttribute("tabindex", "0");
    elemento.setAttribute("aria-label", rotuloDe(marco));

    elemento.addEventListener("keydown", function (evento) {
      if (!ehAtalho(evento)) return;
      evento.preventDefault();          // senão o Espaço rolaria a página
      abrirDia(marco);
    });
  }

  function ligarLupa(elemento, marco) {
    vestirDeBotao(elemento, marco);
    elemento.addEventListener("click", function () { abrirDia(marco); });
  }

  /* O cartão cromático segue o dedo para mexer no brilho. Se qualquer clique
     abrisse o lightbox, arrastar para ver o efeito abriria junto. Aqui só vale
     o toque parado: andou mais que ARRASTO entre apertar e soltar, era arrasto. */
  var ARRASTO = 10;   // px

  function ligarLupaCroma(elemento, marco) {
    vestirDeBotao(elemento, marco);

    var x0 = 0, y0 = 0, apertado = false;

    elemento.addEventListener("pointerdown", function (evento) {
      apertado = true;
      x0 = evento.clientX;
      y0 = evento.clientY;
    });

    elemento.addEventListener("pointerup", function (evento) {
      if (!apertado) return;
      apertado = false;
      var dx = evento.clientX - x0;
      var dy = evento.clientY - y0;
      if (dx * dx + dy * dy <= ARRASTO * ARRASTO) abrirDia(marco);
    });

    ["pointercancel", "pointerleave"].forEach(function (nome) {
      elemento.addEventListener(nome, function () { apertado = false; });
    });
  }

  /* a foto do marco: miniatura de sempre, ou o cartão cromático no destaque */
  function montarFoto(marco, li) {
    /* Vídeo não passa nem por um caminho nem pelo outro: não tem miniatura
       gerada (Lightbox.thumb devolve "") e não pode virar textura de WebGL.
       Toca ali mesmo, sozinho e em loop, com os controles do navegador.

       E é o único que NÃO abre o dia ao ser tocado: o toque aqui é do play e
       do pause. Roubá-lo deixaria o vídeo sem como parar. */
    if (Lightbox.ehVideo(marco.foto)) {
      var video = document.createElement("video");
      video.className = "marco__foto marco__video";
      video.src = Lightbox.caminho(marco.foto);
      video.controls = true;
      video.playsInline = true;
      video.loop = true;
      /* `muted` é o preço do autoplay: navegador nenhum toca vídeo com som
         fora de um gesto. Os arquivos vão sem faixa de áudio, então não se
         perde nada — e a trilha continua sendo a única voz da página. */
      video.muted = true;

      if (menosMovimento()) {
        video.preload = "metadata";   // só o primeiro quadro até ela dar play
      } else {
        video.autoplay = true;        // o navegador só começa quando ele aparece
      }

      li.appendChild(video);
      return;
    }

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
      ligarLupaCroma(caixa, marco);
      return;
    }

    var img = document.createElement("img");
    img.className = "marco__foto";
    img.src = Lightbox.thumb(marco.foto);
    img.alt = marco.titulo;
    img.loading = "lazy";
    li.appendChild(img);
    ligarLupa(img, marco);
  }

  /* ------------------------------------------------------------------------
     Um pedaço da descrição entre *asteriscos* sai em destaque — dourado e em
     negrito (.marco__enfase no CSS). É o único enfeite que o texto aceita, e
     ele mora no data/momentos.js junto com a frase, não aqui.

     Cada pedaço vira um nó de texto ou um <strong> de verdade; nada de
     innerHTML, então um asterisco solto ou um "<" na frase continuam sendo
     só caracteres. Descrição sem asterisco nenhum sai idêntica ao que era.
     ------------------------------------------------------------------------ */
  function montarDescricao(texto) {
    var p = document.createElement("p");
    p.className = "marco__descricao";

    /* split com grupo de captura: os índices ímpares são o que veio entre os
       asteriscos. Asterisco sem par não casa e volta como texto comum. */
    texto.split(/\*([^*]+)\*/).forEach(function (pedaco, i) {
      if (!pedaco) return;
      if (i % 2 === 0) {
        p.appendChild(document.createTextNode(pedaco));
        return;
      }
      var forte = document.createElement("strong");
      forte.className = "marco__enfase";
      forte.textContent = pedaco;
      p.appendChild(forte);
    });

    return p;
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
      li.appendChild(montarDescricao(marco.descricao));
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
