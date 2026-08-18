/* ==========================================================================
   particle-text.js — o título feito de partículas.

   Reconstrução do "Particle Text" do React Bits Pro em WebGL puro: o texto é
   desenhado numa tela invisível, cada pixel aceso vira uma partícula, e elas
   fogem do dedo e voltam para o lugar puxadas por uma mola. Sem React, sem
   Three.js, sem npm e sem módulos ES — continua sendo um <script> comum como
   o resto do site.

   A FONTE, O TAMANHO E A COR SAEM DO CSS, não daqui: o efeito lê o estilo já
   calculado do <h3> que ele substitui. Mudar a aparência do título é mexer em
   `.marco--corte .marco__titulo` no style.css, nunca neste arquivo. O que
   `PADRAO` guarda é só a física — densidade, mola, repulsão.

   API:
     ParticleText.montar(elemento)          // o elemento com o texto
     ParticleText.montar(elemento, ajustes)

   O elemento original NÃO é apagado: ele fica escondido no lugar dele,
   continua sendo lido por leitor de tela e volta a aparecer sozinho se o
   WebGL não subir. A <canvas> é decoração, e por isso aria-hidden.

   >>> ATENÇÃO, file:// <<<
   Aqui, ao contrário do cartão cromático, não há imagem de fora: o texto é
   desenhado pelo próprio navegador. Funciona por duplo-clique também.
   ========================================================================== */
var ParticleText = (function () {
  "use strict";

  var PADRAO = {
    /* Densidade: de quantos em quantos pixels DA TELA (não de CSS) o texto é
       lido. Menor = mais partículas, mais bonito e mais caro. Fica em pixel
       de tela de propósito: o traço da Playfair também engorda com a densidade
       do aparelho, então é assim que a letra sai igualmente cheia no celular
       dela e no monitor. Acima de 2 a letra começa a se desmanchar. */
    passo:        2,
    tamanhoPonto: 2.9,    /* diâmetro de cada partícula, em px de tela       */
    teto:         9000,   /* limite de partículas: acima disso o passo cresce */

    /* a física */
    mola:         26.0,   /* força que puxa a partícula de volta ao lugar    */
    amortecimento: 0.86,  /* quanto da velocidade sobra a cada 1/60s         */
    raio:         86.0,   /* alcance do dedo/ponteiro, em px de CSS          */
    forca:        2600.0, /* o empurrão dentro desse raio                    */

    /* o respiro parado: no celular não existe passar o mouse por cima, então
       sem isto o título ficaria imóvel até ela encostar */
    flutuacao:    0.7,

    /* a entrada: as partículas nascem espalhadas e se juntam para formar o
       texto quando o marco aparece na tela */
    espalhar:     1.0,

    /* respiro em volta do texto, em múltiplos do tamanho da fonte — é a folga
       que as partículas têm para fugir sem serem cortadas pela borda */
    folga:        0.42,

    /* de quantas linhas o texto pode ocupar antes de a fonte ter que encolher */
    maxLinhas:    2
  };

  /* A cor da partícula parada é a `color` que o CSS deu ao próprio título; a
     cor de quem está fugindo do dedo sai do token --petala. Nos dois casos a
     paleta continua morando no style.css, nunca aqui. */
  var COR_VIVA = ["--petala", "#E08497"];

  var VS = [
    "attribute vec2  aPos;",
    "attribute float aBrilho;",
    "uniform   vec2  uResolucao;",
    "uniform   float uTamanho;",
    "varying   float vBrilho;",
    "void main() {",
    /* pixels da tela -> o quadrado de -1 a 1 que o WebGL entende */
    "  vec2 c = (aPos / uResolucao) * 2.0 - 1.0;",
    "  gl_Position = vec4(c.x, -c.y, 0.0, 1.0);",
    "  gl_PointSize = uTamanho;",
    "  vBrilho = aBrilho;",
    "}"
  ].join("\n");

  var FS = [
    "precision mediump float;",
    "uniform vec3  uCor;",
    "uniform vec3  uCorViva;",
    "varying float vBrilho;",
    "void main() {",
    /* cada partícula é um quadradinho: aqui ele vira um pontinho redondo de
       beirada macia, senão o título ficaria feito de pixels serrilhados */
    "  vec2 d = gl_PointCoord - 0.5;",
    "  float r = dot(d, d);",
    "  if (r > 0.25) { discard; }",
    "  float a = smoothstep(0.25, 0.03, r);",
    "  vec3 cor = mix(uCor, uCorViva, clamp(vBrilho, 0.0, 1.0));",
    "  gl_FragColor = vec4(cor, a);",
    "}"
  ].join("\n");

  /* ------------------------------ utilidades ------------------------------ */

  function menosMovimento() {
    return !!(window.matchMedia &&
              window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  /* "#F2D9A0" -> [0.949, 0.851, 0.627], que é como o shader lê cor */
  function hexParaRgb(hex) {
    var h = String(hex).trim().replace("#", "");
    if (h.length === 3) { h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; }
    var n = parseInt(h, 16);
    if (isNaN(n)) { return [1, 1, 1]; }
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

  /* "rgb(242, 217, 160)" -> [0.949, 0.851, 0.627] */
  function rgbParaVetor(cor) {
    var m = String(cor).match(/(\d+(?:\.\d+)?)/g);
    if (!m || m.length < 3) { return null; }
    return [m[0] / 255, m[1] / 255, m[2] / 255];
  }

  function token(par) {
    var v = "";
    try {
      v = getComputedStyle(document.documentElement).getPropertyValue(par[0]);
    } catch (e) { v = ""; }
    return hexParaRgb(v || par[1]);
  }

  function compilar(gl, tipo, fonte) {
    var s = gl.createShader(tipo);
    gl.shaderSource(s, fonte);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(s) || "shader nao compilou");
    }
    return s;
  }

  /* ---------------------------- o texto virando ponto ----------------------
     Uma tela 2D invisível recebe o texto na fonte que o CSS mandou; depois os
     pixels são lidos de `passo` em `passo` e cada um aceso vira uma partícula.
     Nada disso aparece: esta tela nunca entra na página. */

  function quebrarEmLinhas(ctx, texto, largura) {
    var palavras = texto.split(/\s+/);
    var linhas = [], atual = "";
    palavras.forEach(function (palavra) {
      var teste = atual ? atual + " " + palavra : palavra;
      /* !atual: uma palavra sozinha maior que a linha fica assim mesmo —
         quem resolve o excesso é o encolhimento da fonte, logo abaixo */
      if (!atual || ctx.measureText(teste).width <= largura) {
        atual = teste;
      } else {
        linhas.push(atual);
        atual = palavra;
      }
    });
    if (atual) { linhas.push(atual); }
    return linhas;
  }

  function maiorLinha(ctx, linhas) {
    var maior = 0;
    linhas.forEach(function (l) {
      maior = Math.max(maior, ctx.measureText(l).width);
    });
    return maior;
  }

  /* a fonte que o CSS deu, só que noutro tamanho */
  function fonteEm(estilo, tamanho) {
    return (estilo.fontStyle || "normal") + " " + (estilo.fontWeight || "400") +
           " " + tamanho + "px " + estilo.fontFamily;
  }

  /* devolve { linhas, tamanho } que cabem na largura pedida */
  function ajustar(ctx, texto, estilo, tamanhoBase, largura, cfg) {
    var tamanho = tamanhoBase;
    var linhas = [];
    /* encolhe de 4% em 4% até caber; 30 voltas chegam a ~30% do tamanho
       original, o que é mais do que qualquer título deste site precisa */
    for (var i = 0; i < 30; i++) {
      ctx.font = fonteEm(estilo, tamanho);
      linhas = quebrarEmLinhas(ctx, texto, largura);
      if (linhas.length <= cfg.maxLinhas && maiorLinha(ctx, linhas) <= largura) {
        break;
      }
      tamanho *= 0.96;
    }
    return { linhas: linhas, tamanho: tamanho };
  }

  /* ------------------------------- o efeito ------------------------------- */

  function montar(alvo, opcoes) {
    if (!alvo || !alvo.textContent || !alvo.textContent.trim()) { return; }
    opcoes = opcoes || {};

    var cfg = {}, chave;
    for (chave in PADRAO) {
      if (Object.prototype.hasOwnProperty.call(PADRAO, chave)) {
        cfg[chave] = (opcoes[chave] !== undefined) ? opcoes[chave] : PADRAO[chave];
      }
    }

    var texto = alvo.textContent.trim();

    var caixa = document.createElement("div");
    caixa.className = "particulas";
    caixa.setAttribute("aria-hidden", "true");

    var tela = document.createElement("canvas");
    tela.className = "particulas__tela";
    caixa.appendChild(tela);

    var gl = null;
    try {
      gl = tela.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: false }) ||
           tela.getContext("experimental-webgl");
    } catch (e) { gl = null; }

    /* sem WebGL não há efeito e nada muda: o <h3> de sempre continua na tela */
    if (!gl) { return; }

    var programa;
    try {
      programa = gl.createProgram();
      gl.attachShader(programa, compilar(gl, gl.VERTEX_SHADER, VS));
      gl.attachShader(programa, compilar(gl, gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(programa);
      if (!gl.getProgramParameter(programa, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(programa) || "programa nao linkou");
      }
    } catch (e) { return; }

    gl.useProgram(programa);

    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    var aPos    = gl.getAttribLocation(programa, "aPos");
    var aBrilho = gl.getAttribLocation(programa, "aBrilho");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 12, 0);
    gl.enableVertexAttribArray(aBrilho);
    gl.vertexAttribPointer(aBrilho, 1, gl.FLOAT, false, 12, 8);

    var u = {};
    ["uResolucao", "uTamanho", "uCor", "uCorViva"].forEach(function (nome) {
      u[nome] = gl.getUniformLocation(programa, nome);
    });

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    var corBase = [1, 1, 1];          /* trocada pela do CSS no amostrar() */
    var corViva = token(COR_VIVA);

    alvo.parentNode.insertBefore(caixa, alvo.nextSibling);

    /* ---- estado ---- */
    var casa = null, pos = null, vel = null, fase = null, dados = null;
    var total = 0;
    var dpr = 1, largura = 0, altura = 0, pontoPx = 0;
    var ponteiro = { x: -1e6, y: -1e6, dentro: false };
    var parado  = menosMovimento();
    var visivel = true;
    var rodando = false;
    var pronto  = false;
    var quadro = 0, ultimo = 0, nascimento = 0;
    var larguraCss = 0;

    /* ---- montar as partículas a partir do texto ---- */
    function amostrar() {
      var estilo = getComputedStyle(alvo);
      /* a largura sai da CAIXA, não do <h3>: uma vez que o efeito subiu, o
         <h3> está escondido e mede 1px — medir nele mataria o redesenho ao
         virar a tela. O estilo (fonte, tamanho, peso) continua vindo dele. */
      var disponivel = caixa.getBoundingClientRect().width;
      if (disponivel < 40) { return false; }

      corBase = rgbParaVetor(estilo.color) || corBase;

      var base = parseFloat(estilo.fontSize) || 32;
      var plano = document.createElement("canvas");
      var ctx = plano.getContext("2d");
      if (!ctx) { return false; }

      var cabe = ajustar(ctx, texto, estilo, base, disponivel, cfg);
      var tamanho = cabe.tamanho;
      var linhas = cabe.linhas;

      var alturaLinha = tamanho * 1.16;
      var folga = tamanho * cfg.folga;
      larguraCss = disponivel;
      var alturaCss = linhas.length * alturaLinha + folga * 2;

      dpr = Math.min(window.devicePixelRatio || 1, 2);
      largura = Math.max(1, Math.round(larguraCss * dpr));
      altura  = Math.max(1, Math.round(alturaCss  * dpr));

      plano.width = largura;
      plano.height = altura;
      ctx = plano.getContext("2d");
      ctx.font = fonteEm(estilo, tamanho * dpr);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fff";   /* só o alfa importa: a cor sai do shader */
      linhas.forEach(function (linha, i) {
        ctx.fillText(linha, largura / 2,
                     (folga + alturaLinha * (i + 0.5)) * dpr);
      });

      var pixels;
      try {
        pixels = ctx.getImageData(0, 0, largura, altura).data;
      } catch (e) { return false; }

      /* o passo cresce até o número de partículas caber no teto — num título
         grande de desktop isso evita subir 30 mil pontos por quadro */
      var passo = Math.max(1, Math.round(cfg.passo));
      var achados;
      for (var tentativa = 0; tentativa < 6; tentativa++) {
        achados = varrer(pixels, passo);
        if (achados.length / 2 <= cfg.teto) { break; }
        passo += 1;
      }

      total = achados.length / 2;
      if (!total) { return false; }

      casa  = new Float32Array(achados);
      pos   = new Float32Array(total * 2);
      vel   = new Float32Array(total * 2);
      fase  = new Float32Array(total * 2);
      dados = new Float32Array(total * 3);

      for (var i = 0; i < total; i++) {
        /* nascem espalhadas pela tela e se juntam formando o texto */
        pos[i * 2]     = casa[i * 2]     + (Math.random() - 0.5) * largura * cfg.espalhar;
        pos[i * 2 + 1] = casa[i * 2 + 1] + (Math.random() - 0.5) * altura * 2.4 * cfg.espalhar;
        fase[i * 2]     = Math.random() * Math.PI * 2;
        fase[i * 2 + 1] = 0.5 + Math.random() * 0.9;
      }

      tela.width = largura;
      tela.height = altura;
      caixa.style.height = alturaCss + "px";
      gl.viewport(0, 0, largura, altura);
      pontoPx = Math.max(1, cfg.tamanhoPonto);

      return true;
    }

    /* lê a tela invisível de `passo` em `passo` e devolve os pixels acesos */
    function varrer(pixels, passo) {
      var achados = [];
      for (var y = 0; y < altura; y += passo) {
        for (var x = 0; x < largura; x += passo) {
          if (pixels[(y * largura + x) * 4 + 3] > 128) {
            achados.push(x, y);
          }
        }
      }
      return achados;
    }

    /* ---- a física, um passo ---- */
    function passoFisica(dt, t) {
      var mola = cfg.mola;
      var amort = Math.pow(cfg.amortecimento, dt * 60);
      var raio = cfg.raio * dpr;
      var raio2 = raio * raio;
      var forca = cfg.forca * dpr;
      var px = ponteiro.x, py = ponteiro.y;
      var temPonteiro = ponteiro.dentro;

      for (var i = 0; i < total; i++) {
        var ix = i * 2, iy = ix + 1;

        /* o respiro parado: a casa de cada partícula oscila um tiquinho, cada
           uma no seu tempo — é o que mantém o título vivo no celular */
        var ondaX = 0, ondaY = 0;
        if (cfg.flutuacao > 0) {
          var f = fase[ix], v = fase[iy];
          /* amplitude em torno de meio pixel: mais do que isso abre buracos
             entre as partículas e a letra começa a se desmanchar parada */
          ondaX = Math.sin(t * 0.7 * v + f) * 0.6 * dpr * cfg.flutuacao;
          ondaY = Math.cos(t * 0.55 * v + f) * 0.8 * dpr * cfg.flutuacao;
        }

        var alvoX = casa[ix] + ondaX;
        var alvoY = casa[iy] + ondaY;

        /* a mola de volta para casa */
        vel[ix] += (alvoX - pos[ix]) * mola * dt;
        vel[iy] += (alvoY - pos[iy]) * mola * dt;

        /* o empurrão do dedo, mais forte quanto mais perto */
        if (temPonteiro) {
          var dx = pos[ix] - px, dy = pos[iy] - py;
          var d2 = dx * dx + dy * dy;
          if (d2 < raio2) {
            var d = Math.sqrt(d2) || 0.001;
            var q = 1 - d / raio;
            var g = (q * q * forca) / d;
            vel[ix] += dx * g * dt;
            vel[iy] += dy * g * dt;
          }
        }

        vel[ix] *= amort;
        vel[iy] *= amort;
        pos[ix] += vel[ix] * dt;
        pos[iy] += vel[iy] * dt;

        /* longe de casa = fugindo: é o que acende a cor quente */
        var ex = pos[ix] - casa[ix], ey = pos[iy] - casa[iy];
        var i3 = i * 3;
        dados[i3]     = pos[ix];
        dados[i3 + 1] = pos[iy];
        dados[i3 + 2] = Math.min(Math.sqrt(ex * ex + ey * ey) / (raio * 0.7), 1);
      }
    }

    /* as partículas já em casa e sem velocidade: o quadro de quem pediu
       menos movimento, e o primeiro quadro antes de a física rodar */
    function assentar() {
      for (var i = 0; i < total; i++) {
        var i3 = i * 3;
        pos[i * 2] = casa[i * 2];
        pos[i * 2 + 1] = casa[i * 2 + 1];
        vel[i * 2] = 0; vel[i * 2 + 1] = 0;
        dados[i3]     = casa[i * 2];
        dados[i3 + 1] = casa[i * 2 + 1];
        dados[i3 + 2] = 0;
      }
    }

    function pintar() {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, dados, gl.DYNAMIC_DRAW);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(u.uResolucao, largura, altura);
      gl.uniform1f(u.uTamanho, pontoPx);
      gl.uniform3f(u.uCor, corBase[0], corBase[1], corBase[2]);
      gl.uniform3f(u.uCorViva, corViva[0], corViva[1], corViva[2]);
      gl.drawArrays(gl.POINTS, 0, total);
    }

    function desenhar(agora) {
      quadro = 0;
      if (!pronto) { rodando = false; return; }

      if (!nascimento) { nascimento = agora; ultimo = agora; }
      var dt = Math.min((agora - ultimo) / 1000, 0.033);
      ultimo = agora;
      var t = (agora - nascimento) / 1000;

      passoFisica(dt, t);
      pintar();

      if (visivel && !parado) {
        quadro = requestAnimationFrame(desenhar);
      } else {
        rodando = false;
      }
    }

    function ligar() {
      if (!pronto || rodando || !visivel) { return; }
      if (parado) { umQuadro(); return; }
      rodando = true;
      ultimo = 0;
      nascimento = 0;
      quadro = requestAnimationFrame(desenhar);
    }

    function parar() {
      rodando = false;
      if (quadro) { cancelAnimationFrame(quadro); }
      quadro = 0;
    }

    /* quem pediu menos movimento leva um quadro só, com o texto já formado */
    function umQuadro() {
      if (!pronto) { return; }
      assentar();
      pintar();
    }

    function aoMover(evento) {
      if (parado) { return; }
      var r = tela.getBoundingClientRect();
      ponteiro.x = (evento.clientX - r.left) * (largura / (r.width || 1));
      ponteiro.y = (evento.clientY - r.top)  * (altura  / (r.height || 1));
      ponteiro.dentro = true;
      ligar();
    }

    function aoSair() { ponteiro.dentro = false; }

    caixa.addEventListener("pointermove", aoMover);
    caixa.addEventListener("pointerdown", aoMover);
    ["pointerleave", "pointerup", "pointercancel"].forEach(function (nome) {
      caixa.addEventListener(nome, aoSair);
    });

    /* fora da tela, nada roda */
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entradas) {
        visivel = entradas[0].isIntersecting;
        if (visivel) { ligar(); } else { parar(); }
      }, { threshold: 0.01 }).observe(caixa);
    }

    /* medir de novo quando a largura muda — a fonte é clamp(), então o texto
       inteiro se refaz. Só na largura: no celular, rolar a página muda a
       altura da janela sozinho e refazer tudo aí seria desperdício. */
    var larguraJanela = window.innerWidth;
    var espera = 0;
    window.addEventListener("resize", function () {
      if (window.innerWidth === larguraJanela) { return; }
      larguraJanela = window.innerWidth;
      clearTimeout(espera);
      espera = setTimeout(function () {
        parar();
        pronto = amostrar();
        if (!pronto) { return; }
        if (parado) { umQuadro(); } else { ligar(); }
      }, 180);
    });

    /* a Playfair vem do Google Fonts: amostrar antes de ela chegar desenharia
       o título na fonte de reserva, com outro desenho de letra */
    function comecar() {
      pronto = amostrar();
      if (!pronto) { return; }
      alvo.classList.add("so-leitor");
      caixa.classList.add("particulas--pronto");
      if (parado) { umQuadro(); return; }
      ligar();
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(comecar, comecar);
    } else {
      comecar();
    }
  }

  return { montar: montar, PADRAO: PADRAO };
})();
