/* ==========================================================================
   scroll-mask.js — a máscara que abre ao rolar.

   Reconstrução do "Scroll Mask" do React Bits Pro em CSS puro: a mídia fica
   presa na tela (`position: sticky`) enquanto a página rola por uma pista, e
   o quanto já foi rolado vira uma máscara (`mask-image`) que abre em cima
   dela. Sem React, sem Tailwind, sem npm e sem módulos ES — continua sendo um
   <script> comum como o resto do site.

   Seis geometrias, as mesmas seis da documentação oficial:
     iris     — um círculo que abre do centro (ou de onde origemX/Y mandar)
     wipe     — uma varredura reta, no ângulo que `angulo` pedir
     curtain  — duas cortinas abrindo do meio para os lados
     slats    — faixas horizontais, cada uma entrando com o seu atraso
     grid     — uma grade de células que floresce na diagonal
     type     — uma palavra vira janela e cresce até engolir o quadro

   Os valores de PADRAO são os mesmos do painel "Customize" da documentação,
   só com os nomes em português. Mexer neles é o único jeito de mudar o efeito.

   API:
     ScrollMask.montar(elemento, { src, alt, variante, ...ajustes })

   O que NÃO veio da versão React: `children` / `revealContent` (conteúdo
   escrito por cima da mídia). Aqui o recado mora fora do quadro, na seção.

   >>> ATENÇÃO, file:// <<<
   Ao contrário do croma-card, aqui não há WebGL nem textura indo para a placa
   de vídeo: a máscara é CSS e o vídeo é uma tag comum. Funciona por
   duplo-clique também.
   ========================================================================== */
var ScrollMask = (function () {
  "use strict";

  /* os padrões do painel oficial — mesma ordem, mesmos números */
  var PADRAO = {
    variante:  "iris",        /* iris | wipe | curtain | slats | grid | type   */
    src:       "",            /* caminho da mídia (.jpg/.webp ou .mp4)        */
    alt:       "",
    palavra:   "SCROLL",      /* só o variante "type" usa                     */
    corrida:   1.7,           /* scrollLength: a pista, em alturas de tela    */
    assenta:   0.84,          /* settle: em que fração da pista já abriu tudo */
    suavidade: 0.14,          /* smooth: o quanto a máscara arrasta o scroll  */
    pluma:     14,            /* feather: a beirada macia, em %               */
    atraso:    0.55,          /* stagger: o espalhamento entre as peças       */
    colunas:   9,             /* columns: faixas do slats, colunas do grid    */
    origemX:   50,            /* de onde a abertura nasce, em %               */
    origemY:   50,
    angulo:    108,           /* angle: a direção do wipe, em graus           */
    zoom:      1.14,          /* a mídia começa ampliada e assenta em 1       */
    encaixe:   "cover",       /* fit: o object-fit da mídia                   */
    raio:      18,            /* o canto arredondado do quadro, em px         */
    veu:       0,             /* overlay: um véu escuro por cima, 0 a 1       */
    fundo:     "transparent", /* background: a cor atrás da mídia             */
    calmo:     false,         /* calm: sem arrasto, a máscara cola no scroll  */

    /* --------------------------- fora do painel oficial ------------------- */

    /* o quanto a palavra do "type" cresce até o fim. Precisa ser grande — é
       ela que tem de engolir o quadro inteiro. */
    tetoTipo:  30,

    /* De que fração da pista em diante a revelação faz o caminho de VOLTA: a
       máscara fecha e o quadro encolhe, e a seção sai de cena com a mesma
       animação com que entrou. 0 desliga — o quadro fica aberto até o fim.
       Só faz sentido acima de `assenta`: entre os dois é que ela vê tudo. */
    saida:     0,

    /* No desktop, o quadro deixa de ser uma caixa da largura da seção e cresce
       até cobrir a tela inteira, junto com a máscara. Aqui isso só acende a
       classe e escreve `--expansao`; quem faz a conta — e quem decide que o
       celular fica de fora — é o CSS, no bloco 4C. */
    telaCheia: false
  };

  /* Uma grade de colunas × linhas vira uma camada de máscara POR CÉLULA, e
     cada camada é um degradê que o navegador recalcula a cada quadro. Este é
     o teto que segura a conta no celular dela. */
  var TETO_CELULAS = 36;

  function limitar(v, min, max) {
    return v < min ? min : v > max ? max : v;
  }

  function juntar(base, extra) {
    var saida = {}, chave;
    for (chave in base) {
      if (Object.prototype.hasOwnProperty.call(base, chave)) saida[chave] = base[chave];
    }
    if (!extra) return saida;
    for (chave in extra) {
      if (Object.prototype.hasOwnProperty.call(extra, chave) && extra[chave] !== undefined) {
        saida[chave] = extra[chave];
      }
    }
    return saida;
  }

  function ehVideo(src) {
    return /\.(mp4|webm|mov)(\?|$)/i.test(src);
  }

  function menosMovimento() {
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  /* Cada peça (uma faixa do slats, uma célula do grid) tem a sua própria linha
     do tempo dentro da linha do tempo geral: espera a sua vez e corre o que
     sobrou. `fracao` é a posição dela na fila, de 0 a 1. */
  function progressoDaPeca(p, fracao, atraso) {
    var espera  = atraso * fracao;
    var duracao = Math.max(0.05, 1 - atraso);
    return limitar((p - espera) / duracao, 0, 1);
  }

  /* posição de uma peça no eixo, em % — a mesma conta do background-position:
     0% cola no começo, 100% cola no fim */
  function posicaoDaPeca(i, total) {
    return total > 1 ? (i / (total - 1)) * 100 : 50;
  }

  function escaparXml(texto) {
    return String(texto)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  /* ---------------------------- AS SEIS MÁSCARAS ---------------------------
     Cada uma devolve o mesmo pacote — imagem, tamanho, posição, repetição —
     que é o que vai para as quatro propriedades mask-* da mídia. Branco opaco
     é o que aparece; transparente é o que continua escondido. */

  function umaCamada(imagem) {
    return { imagem: imagem, tamanho: "100% 100%", posicao: "0% 0%", repeticao: "no-repeat" };
  }

  function mascaraIris(p, o) {
    /* farthest-corner faz 100% ser exatamente o canto mais distante, então o
       círculo fecha o quadro inteiro sem eu ter de adivinhar o raio */
    var fora  = p * (100 + o.pluma);
    var cheio = Math.max(0, fora - o.pluma);
    return umaCamada(
      "radial-gradient(circle farthest-corner at " + o.origemX + "% " + o.origemY + "%," +
      " #fff 0, #fff " + cheio.toFixed(2) + "%, transparent " + fora.toFixed(2) + "%)"
    );
  }

  function mascaraWipe(p, o) {
    var fora  = p * (100 + o.pluma);
    var cheio = Math.max(0, fora - o.pluma);
    return umaCamada(
      "linear-gradient(" + o.angulo + "deg," +
      " #fff 0, #fff " + cheio.toFixed(2) + "%, transparent " + fora.toFixed(2) + "%)"
    );
  }

  function mascaraCortina(p, o) {
    /* uma faixa central que engorda para os dois lados; `semi` é meia
       abertura, e passa dos 50% no fim para a pluma sair da tela */
    var semi  = p * (50 + o.pluma);
    var cheio = Math.max(0, semi - o.pluma);
    return umaCamada(
      "linear-gradient(90deg," +
      " transparent " + (50 - semi).toFixed(2) + "%," +
      " #fff " + (50 - cheio).toFixed(2) + "%," +
      " #fff " + (50 + cheio).toFixed(2) + "%," +
      " transparent " + (50 + semi).toFixed(2) + "%)"
    );
  }

  function mascaraRipas(p, o) {
    /* uma camada por faixa: cada camada é uma fatia horizontal do quadro, e
       dentro dela um wipe que entra pela esquerda no tempo dela */
    var n = Math.max(1, Math.round(o.colunas));
    var imagens = [], tamanhos = [], posicoes = [];

    for (var i = 0; i < n; i++) {
      var pi    = progressoDaPeca(p, posicaoDaPeca(i, n) / 100, o.atraso);
      var fora  = pi * (100 + o.pluma);
      var cheio = Math.max(0, fora - o.pluma);

      imagens.push("linear-gradient(90deg, #fff 0, #fff " + cheio.toFixed(2) + "%, transparent " + fora.toFixed(2) + "%)");
      tamanhos.push("100% " + (100 / n).toFixed(4) + "%");
      posicoes.push("0% " + posicaoDaPeca(i, n).toFixed(4) + "%");
    }

    return {
      imagem: imagens.join(", "),
      tamanho: tamanhos.join(", "),
      posicao: posicoes.join(", "),
      repeticao: "no-repeat"
    };
  }

  function linhasDaGrade(colunas) {
    var linhas = Math.max(2, Math.round(colunas * 0.6));
    while (colunas * linhas > TETO_CELULAS && linhas > 2) { linhas--; }
    return linhas;
  }

  function mascaraGrade(p, o) {
    /* uma camada por célula, cada uma com o seu irisinho. A fila segue a
       diagonal — o canto de cima à esquerda primeiro — e por isso a grade
       floresce em vez de piscar tudo junto. */
    var colunas = Math.max(1, Math.round(o.colunas));
    var linhas  = linhasDaGrade(colunas);
    var ultima  = ((colunas - 1) + (linhas - 1)) || 1;
    var imagens = [], tamanhos = [], posicoes = [];

    for (var l = 0; l < linhas; l++) {
      for (var c = 0; c < colunas; c++) {
        var pi    = progressoDaPeca(p, (c + l) / ultima, o.atraso);
        var fora  = pi * (100 + o.pluma);
        var cheio = Math.max(0, fora - o.pluma);

        imagens.push(
          "radial-gradient(circle farthest-corner at 50% 50%," +
          " #fff 0, #fff " + cheio.toFixed(2) + "%, transparent " + fora.toFixed(2) + "%)"
        );
        tamanhos.push((100 / colunas).toFixed(4) + "% " + (100 / linhas).toFixed(4) + "%");
        posicoes.push(posicaoDaPeca(c, colunas).toFixed(4) + "% " + posicaoDaPeca(l, linhas).toFixed(4) + "%");
      }
    }

    return {
      imagem: imagens.join(", "),
      tamanho: tamanhos.join(", "),
      posicao: posicoes.join(", "),
      repeticao: "no-repeat"
    };
  }

  function mascaraTipo(p, o) {
    /* A palavra é um SVG embutido, e o zoom é o mask-size crescendo: as letras
       começam pequenas, como janelinhas, e vão engolindo o quadro.

       O retângulo cheio do fim mora DENTRO do mesmo SVG de propósito — assim
       é uma camada de máscara só. Somar duas camadas dependeria de
       mask-composite, que cada navegador escreve de um jeito diferente.

       A fonte tem de ser de sistema: SVG dentro de `data:` não baixa a
       Playfair do Google Fonts. Georgia é a mesma reserva do --serif. */
    var fim = limitar((p - 0.78) / 0.22, 0, 1);
    var svg =
      "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid meet'>" +
        "<rect width='100' height='100' fill='#fff' opacity='" + fim.toFixed(3) + "'/>" +
        "<text x='50' y='50' text-anchor='middle' dominant-baseline='central'" +
        " font-family='Georgia, serif' font-weight='700' font-size='30'" +
        " textLength='88' lengthAdjust='spacingAndGlyphs' fill='#fff'>" +
        escaparXml(o.palavra) +
        "</text>" +
      "</svg>";

    /* p ao quadrado: começa devagar, para dar tempo de ler a palavra, e só
       depois abre de vez */
    var escala = 100 * (1 + p * p * (o.tetoTipo - 1));

    return {
      imagem: "url(\"data:image/svg+xml," + encodeURIComponent(svg) + "\")",
      tamanho: escala.toFixed(2) + "% " + escala.toFixed(2) + "%",
      posicao: o.origemX + "% " + o.origemY + "%",
      repeticao: "no-repeat"
    };
  }

  var MASCARAS = {
    iris:    mascaraIris,
    wipe:    mascaraWipe,
    curtain: mascaraCortina,
    slats:   mascaraRipas,
    grid:    mascaraGrade,
    type:    mascaraTipo
  };

  /* as quatro propriedades, nas duas grafias: o Safari do iPhone só aprendeu
     `mask-image` sem prefixo no 15.4, e o celular é o alvo aqui */
  function porMascara(el, pacote) {
    el.style.setProperty("-webkit-mask-image", pacote.imagem);
    el.style.setProperty("mask-image", pacote.imagem);
    el.style.setProperty("-webkit-mask-size", pacote.tamanho);
    el.style.setProperty("mask-size", pacote.tamanho);
    el.style.setProperty("-webkit-mask-position", pacote.posicao);
    el.style.setProperty("mask-position", pacote.posicao);
    el.style.setProperty("-webkit-mask-repeat", pacote.repeticao);
    el.style.setProperty("mask-repeat", pacote.repeticao);
  }

  function tirarMascara(el) {
    el.style.setProperty("-webkit-mask-image", "none");
    el.style.setProperty("mask-image", "none");
  }

  /* ------------------------------- A MONTAGEM ------------------------------ */

  function montar(alvo, ajustes) {
    if (!alvo) return null;

    var o = juntar(PADRAO, ajustes);
    var desenhar = MASCARAS[o.variante] || MASCARAS.iris;
    var parado = menosMovimento();

    /* pista (rola) > palco (fica preso) > quadro (recorta) > máscara > mídia */
    var pista = document.createElement("div");
    pista.className = "smask";
    pista.style.setProperty("--corrida", String(o.corrida));
    if (o.telaCheia) pista.classList.add("smask--tela-cheia");

    var palco = document.createElement("div");
    palco.className = "smask__palco";

    var quadro = document.createElement("div");
    quadro.className = "smask__quadro";
    /* variável em vez de border-radius direto: na tela cheia o CSS precisa
       derreter o canto até 0, e um inline ganharia da folha de estilo */
    quadro.style.setProperty("--smask-raio", o.raio + "px");
    quadro.style.background = o.fundo;

    var mascara = document.createElement("div");
    mascara.className = "smask__mascara";

    var video = ehVideo(o.src);
    var midia;

    if (video) {
      /* muted + playsinline: sem os dois o celular recusa dar play sozinho.
         E o som fica mudo de propósito — a trilha já está tocando, dois
         áudios ao mesmo tempo brigariam. */
      midia = document.createElement("video");
      midia.muted = true;
      midia.defaultMuted = true;
      midia.loop = true;
      midia.setAttribute("muted", "");
      midia.setAttribute("playsinline", "");
      midia.setAttribute("webkit-playsinline", "");
      midia.preload = "metadata";
    } else {
      midia = document.createElement("img");
      midia.loading = "lazy";
      midia.decoding = "async";
    }

    midia.className = "smask__midia";
    midia.src = o.src;
    midia.style.objectFit = o.encaixe;

    if (video) {
      if (o.alt) midia.setAttribute("aria-label", o.alt);
    } else {
      midia.alt = o.alt || "";
    }

    mascara.appendChild(midia);

    /* o véu entra DENTRO da máscara, não no quadro: fora dela ele apareceria
       como um retângulo escuro por cima da página antes de a mídia surgir */
    if (o.veu > 0) {
      var veu = document.createElement("div");
      veu.className = "smask__veu";
      veu.style.opacity = String(limitar(o.veu, 0, 1));
      mascara.appendChild(veu);
    }

    quadro.appendChild(mascara);
    palco.appendChild(quadro);
    pista.appendChild(palco);

    /* Sem sticky não há pista que preste: a mídia rolaria embora antes de
       abrir. Quem pede menos movimento cai no mesmo caminho — quadro parado,
       máscara já aberta. */
    if (parado || !(window.CSS && CSS.supports && CSS.supports("position", "sticky"))) {
      pista.classList.add("smask--parado");
    }

    alvo.appendChild(pista);

    /* ------------------------------ o movimento --------------------------- */

    var atual = 0;         /* o progresso amortecido: o que a máscara mostra */
    var anterior = -1;     /* o último desenhado, para não redesenhar à toa  */
    var visivel = false;
    var rodando = false;

    /* o quanto da pista já passou: 0 quando o topo dela encosta no topo da
       tela, 1 quando o pé dela encosta no pé */
    function progressoBruto() {
      var caixa = pista.getBoundingClientRect();
      var vao   = window.innerHeight || document.documentElement.clientHeight;
      var total = caixa.height - vao;
      if (total <= 0) return caixa.top <= 0 ? 1 : 0;
      return limitar(-caixa.top / total, 0, 1);
    }

    /* `assenta` é onde a revelação termina: dali em diante ela já vê a mídia
       inteira, parada. `saida` é o contrário — de lá até o pé da pista o
       progresso desanda de volta a 0, e a mesma máscara que abriu fecha, com o
       quadro encolhendo junto. Entre os dois fica o descanso, tudo à vista. */
    function progressoAlvo() {
      var bruto = progressoBruto();
      var abre  = limitar(bruto / Math.max(0.05, o.assenta), 0, 1);
      if (!(o.saida > 0)) return abre;

      var fecha = limitar((bruto - o.saida) / Math.max(0.05, 1 - o.saida), 0, 1);
      return abre * (1 - fecha);
    }

    function cuidarDoVideo(p) {
      if (!video) return;
      if (visivel && p > 0.02) {
        if (midia.paused) {
          var talvez = midia.play();
          if (talvez && talvez.catch) { talvez.catch(function () {}); }
        }
      } else if (!midia.paused) {
        midia.pause();
      }
    }

    function aplicar(p) {
      /* redesenhar um punhado de degradês por quadro é o caro daqui; se o
         progresso praticamente não mexeu, não há o que redesenhar */
      if (anterior >= 0 && Math.abs(p - anterior) < 0.0015) return;
      anterior = p;

      if (p >= 0.999) { tirarMascara(mascara); }
      else { porMascara(mascara, desenhar(p, o)); }

      var escala = 1 + (o.zoom - 1) * (1 - p);
      midia.style.transform = "scale(" + escala.toFixed(4) + ")";

      /* o mesmo progresso que abre a máscara é o que o CSS usa para crescer o
         quadro até a tela toda — e para encolhê-lo de volta na saída */
      if (o.telaCheia) pista.style.setProperty("--expansao", p.toFixed(4));
    }

    function laco() {
      if (!visivel) { rodando = false; return; }

      var destino = progressoAlvo();
      if (o.calmo) {
        atual = destino;
      } else {
        atual += (destino - atual) * limitar(o.suavidade, 0.01, 1);
        if (Math.abs(destino - atual) < 0.0005) atual = destino;
      }

      aplicar(atual);
      cuidarDoVideo(atual);
      window.requestAnimationFrame(laco);
    }

    function acordar() {
      if (rodando) return;
      rodando = true;
      window.requestAnimationFrame(laco);
    }

    if (parado) {
      /* máscara aberta e pronto: nada de laço, nada de rAF girando à toa */
      aplicar(1);
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entradas) {
          visivel = entradas[0].isIntersecting;
          cuidarDoVideo(1);
        }, { threshold: 0.15 }).observe(pista);
      } else {
        visivel = true;
        cuidarDoVideo(1);
      }
      return { elemento: pista, midia: midia };
    }

    /* o laço só gira enquanto a pista está à vista — fora dela é bateria
       queimada à toa no celular dela */
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entradas) {
        visivel = entradas[0].isIntersecting;
        if (visivel) { acordar(); } else { cuidarDoVideo(0); }
      }, { rootMargin: "20% 0px 20% 0px" }).observe(pista);
    } else {
      visivel = true;
      acordar();
    }

    /* o primeiro quadro sai já no lugar certo: se ela recarregar a página no
       meio da pista, a máscara não pisca fechada */
    atual = progressoAlvo();
    aplicar(atual);

    return { elemento: pista, midia: midia };
  }

  return { montar: montar, PADRAO: PADRAO };
})();
