/* ==========================================================================
   croma-card.js — o cartão cromático do marco em destaque.

   Reconstrução do "Chroma Card" do React Bits Pro em WebGL puro: a foto é uma
   textura num plano 3D, com câmera em perspectiva, e o shader faz aberração
   cromática, deslocamento de pixels e zoom. Sem React, sem Three.js, sem npm
   e sem módulos ES — continua sendo um <script> comum como o resto do site.

   Os valores de PADRAO são os mesmos do painel "Customize" da documentação
   oficial. Mexer neles é o único jeito de mudar a intensidade do efeito.

   API:
     CromaCard.montar(elemento, { src, alt, ...ajustes })

   >>> ATENÇÃO, file:// <<<
   O navegador trata imagem aberta por duplo-clique como se fosse de outro
   domínio e proíbe mandá-la para a placa de vídeo. Nesse caso o WebGL é
   abortado e entra a foto normal no lugar, sem efeito nenhum. Para ver o
   cartão é preciso servir a pasta (python -m http.server) ou o site no ar.
   ========================================================================== */
var CromaCard = (function () {
  "use strict";

  /* os padrões do painel oficial — mesma ordem, mesmos números */
  var PADRAO = {
    imageAspectRatio:    0.67,   /* proporção da foto (largura / altura)       */
    cardWidth:           5.0,    /* largura do cartão, em unidades de mundo    */
    cardHeight:          6.0,    /* altura do cartão                           */
    borderRadius:        30,     /* canto arredondado, em px do cartão         */
    opacity:             1.00,
    fov:                 60,     /* abertura da câmera, em graus               */
    cameraZ:             7.0,    /* distância da câmera até o cartão           */
    zoomLevel:           0.30,   /* quanto a foto amplia com o dedo em cima    */
    rgbShift:            0.020,  /* aberração cromática                        */
    /* O painel oficial vem com 0.095 aqui, e é ele que pica a foto em
       quadradinhos deslocados. Desligado a pedido — voltar a 0.095 traz
       o glitch de volta exatamente como era. */
    pixelDisplace:       0.0,    /* deslocamento em blocos (0 = desligado)     */
    hoverDuration:       3.0,    /* segundos: a onda lenta (zoom, cor, glitch) */
    rotationIntensity:   0.20,   /* radianos de giro seguindo o ponteiro       */
    scaleIntensity:      0.10,   /* quanto o cartão cresce                     */
    positionIntensity:   0.5,    /* quanto o cartão desliza de lado            */
    interactionDuration: 0.4,    /* segundos: a onda rápida (giro, posição)    */

    /* fora do painel: um aro de luz na beirada. Desligado — a foto se destaca
       melhor sozinha, sem moldura. Subir brilhoBorda traz o aro de volta. */
    espessuraBorda:      0.055,  /* em unidades de mundo (~5px do cartão)      */
    corBorda:            "#F2D9A0",
    brilhoBorda:         0.0,    /* 0 apaga o aro                              */

    /* fora do painel: o balanço parado. No celular não existe passar o mouse
       por cima, então sem isto o cartão ficaria imóvel até ela encostar. */
    flutuacao:           1.0
  };

  /* 1 unidade de mundo = 100px do cartão. É o que converte o borderRadius
     do painel (30px) para o tamanho do plano 3D (0.30). */
  var PX_POR_UNIDADE = 100;

  var VS = [
    "attribute vec2 aPos;",
    "attribute vec2 aUv;",
    "uniform mat4 uProj;",
    "uniform mat4 uModelView;",
    "varying vec2 vUv;",
    "void main() {",
    "  vUv = aUv;",
    "  gl_Position = uProj * uModelView * vec4(aPos, 0.0, 1.0);",
    "}"
  ].join("\n");

  var FS = [
    "precision highp float;",
    "varying vec2 vUv;",
    "uniform sampler2D uTex;",
    "uniform vec2  uCard;",
    "uniform float uRazaoImg;",
    "uniform float uRaio;",
    "uniform float uPixel;",
    "uniform float uOpacidade;",
    "uniform float uZoom;",
    "uniform float uRgb;",
    "uniform float uDesloc;",
    "uniform vec2  uDir;",
    "uniform float uTempo;",
    "uniform float uEspBorda;",
    "uniform vec3  uCorBorda;",
    "uniform float uBrilhoBorda;",

    "float acaso(vec2 p) {",
    "  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);",
    "}",

    "void main() {",
    /* 1. a foto cobre o cartão sem deformar — o mesmo corte do
          object-fit: cover que o resto do site usa nas miniaturas */
    "  float razaoCartao = uCard.x / uCard.y;",
    "  vec2 uv = vUv - 0.5;",
    "  float r = uRazaoImg / razaoCartao;",
    "  if (r < 1.0) { uv.y *= r; } else { uv.x /= r; }",

    /* 2. o zoom, sempre a partir do centro */
    "  uv /= (1.0 + uZoom);",
    "  uv += 0.5;",

    /* 3. o deslocamento por blocos: alguns quadradinhos saem do lugar e
          trocam de sorteio algumas vezes por segundo */
    "  if (uDesloc > 0.0001) {",
    "    vec2 blocos = vec2(22.0, 26.0);",
    "    vec2 cela = floor(uv * blocos) + floor(uTempo * 7.0) * 13.0;",
    "    float sorteio = acaso(cela);",
    "    vec2 fuga = vec2(acaso(cela + 1.3), acaso(cela + 7.7)) - 0.5;",
    "    uv += fuga * uDesloc * step(0.62, sorteio);",
    "  }",

    /* 4. a aberração cromática: os três canais lidos de lugares um pouco
          diferentes. Parte é radial, como numa lente de verdade (mais forte
          na beirada), e parte segue para onde o ponteiro puxa. */
    "  vec2 desvio = (uv - 0.5) * uRgb * 2.0 + uDir * uRgb;",
    "  float cr = texture2D(uTex, clamp(uv + desvio, 0.0, 1.0)).r;",
    "  float cg = texture2D(uTex, clamp(uv,          0.0, 1.0)).g;",
    "  float cb = texture2D(uTex, clamp(uv - desvio, 0.0, 1.0)).b;",
    "  vec3 cor = vec3(cr, cg, cb);",

    /* 5. o canto arredondado, recortado pela distância até a moldura */
    "  vec2 p = (vUv - 0.5) * uCard;",
    "  vec2 q = abs(p) - (uCard * 0.5 - uRaio);",
    "  float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRaio;",
    "  float suave = max(uPixel, 0.0001);",
    "  float mascara = 1.0 - smoothstep(-suave, suave, d);",

    /* 6. o aro: a mesma máscara, e uma segunda encolhida para dentro pela
          espessura da borda. O que sobra entre as duas é a beirada. */
    "  float miolo = 1.0 - smoothstep(-suave, suave, d + uEspBorda);",
    "  float aro = clamp(mascara - miolo, 0.0, 1.0);",
    "  cor = mix(cor, uCorBorda, aro * uBrilhoBorda);",

    "  gl_FragColor = vec4(cor, mascara * uOpacidade);",
    "}"
  ].join("\n");

  /* ------------------------------ matrizes ------------------------------
     Só o que a cena precisa. Coluna a coluna, que é como o WebGL lê. */

  function multiplicar(a, b) {
    var m = new Float32Array(16), i, j, k, s;
    for (i = 0; i < 4; i++) {
      for (j = 0; j < 4; j++) {
        s = 0;
        for (k = 0; k < 4; k++) { s += a[k * 4 + j] * b[i * 4 + k]; }
        m[i * 4 + j] = s;
      }
    }
    return m;
  }

  function perspectiva(fovGraus, razao, perto, longe) {
    var f = 1 / Math.tan((fovGraus * Math.PI / 180) / 2);
    var d = perto - longe;
    return new Float32Array([
      f / razao, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (longe + perto) / d, -1,
      0, 0, (2 * longe * perto) / d, 0
    ]);
  }

  function transladar(x, y, z) {
    return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]);
  }

  function girarX(a) {
    var c = Math.cos(a), s = Math.sin(a);
    return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]);
  }

  function girarY(a) {
    var c = Math.cos(a), s = Math.sin(a);
    return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]);
  }

  function escalar(e) {
    return new Float32Array([e, 0, 0, 0, 0, e, 0, 0, 0, 0, e, 0, 0, 0, 0, 1]);
  }

  /* ------------------------------ utilidades ------------------------------ */

  function menosMovimento() {
    return !!(window.matchMedia &&
              window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  /* aproximação exponencial: chega a ~95% do alvo no tempo pedido, e não
     depende da taxa de quadros do aparelho */
  function aproximar(atual, alvo, duracao, dt) {
    if (duracao <= 0) return alvo;
    return atual + (alvo - atual) * (1 - Math.exp(-dt * 3 / duracao));
  }

  /* "#F2D9A0" -> [0.949, 0.851, 0.627], que é como o shader lê cor */
  function hexParaRgb(hex) {
    var h = String(hex).replace("#", "");
    if (h.length === 3) { h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; }
    var n = parseInt(h, 16);
    if (isNaN(n)) { return [1, 1, 1]; }
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }

  /* A foto vai para uma tela quadrada de 1024 antes de virar textura.

     Motivo: o WebGL só gera os níveis reduzidos da imagem (os mipmaps) quando
     a textura tem medidas em potência de dois, e a foto é 1067x1600. Sem
     mipmap, uma imagem grande espremida numa tela pequena serrilha e cintila
     a cada quadro — é o que dá a impressão de foto "picotada" quando o cartão
     se mexe. Com eles, a placa de vídeo escolhe sozinha o tamanho certo.

     Esticar para o quadrado não deforma nada: o shader mapeia a UV pela
     PROPORÇÃO real da foto (uRazaoImg), não pelo número de pixels do buffer. */
  var LADO_TEXTURA = 1024;

  function paraPotenciaDeDois(imagem) {
    var tela = document.createElement("canvas");
    tela.width = LADO_TEXTURA;
    tela.height = LADO_TEXTURA;
    tela.getContext("2d").drawImage(imagem, 0, 0, LADO_TEXTURA, LADO_TEXTURA);
    return tela;
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

  /* o plano B de sempre: a foto como qualquer outra do site */
  function fotoSimples(elemento, opcoes) {
    var img = document.createElement("img");
    img.className = "marco__foto";
    /* sem o efeito não há por que baixar a imagem grande: a miniatura basta */
    img.src = opcoes.reserva || opcoes.src;
    img.alt = opcoes.alt || "";
    img.loading = "lazy";
    elemento.innerHTML = "";
    elemento.appendChild(img);
    elemento.classList.add("croma--sem-webgl");
  }

  /* ------------------------------- o cartão ------------------------------- */

  function montar(elemento, opcoes) {
    if (!elemento || !opcoes || !opcoes.src) { return; }

    var cfg = {}, chave;
    for (chave in PADRAO) {
      if (Object.prototype.hasOwnProperty.call(PADRAO, chave)) {
        cfg[chave] = (opcoes[chave] !== undefined) ? opcoes[chave] : PADRAO[chave];
      }
    }

    var corBorda = hexParaRgb(cfg.corBorda);

    var tela = document.createElement("canvas");
    tela.className = "croma__tela";
    tela.setAttribute("role", "img");
    tela.setAttribute("aria-label", opcoes.alt || "");

    var gl = null;
    try {
      gl = tela.getContext("webgl", {
        alpha: true,
        antialias: true,
        premultipliedAlpha: false
      }) || tela.getContext("experimental-webgl");
    } catch (e) { gl = null; }

    if (!gl) { fotoSimples(elemento, opcoes); return; }

    var programa;
    try {
      programa = gl.createProgram();
      gl.attachShader(programa, compilar(gl, gl.VERTEX_SHADER, VS));
      gl.attachShader(programa, compilar(gl, gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(programa);
      if (!gl.getProgramParameter(programa, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(programa) || "programa nao linkou");
      }
    } catch (e) { fotoSimples(elemento, opcoes); return; }

    gl.useProgram(programa);

    /* o plano: dois triângulos, nas medidas do cartão */
    var lx = cfg.cardWidth / 2, ly = cfg.cardHeight / 2;
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -lx, -ly, 0, 0,
       lx, -ly, 1, 0,
      -lx,  ly, 0, 1,
       lx,  ly, 1, 1
    ]), gl.STATIC_DRAW);

    var aPos = gl.getAttribLocation(programa, "aPos");
    var aUv  = gl.getAttribLocation(programa, "aUv");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(aUv);
    gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 16, 8);

    var u = {};
    ["uProj", "uModelView", "uTex", "uCard", "uRazaoImg", "uRaio", "uPixel",
     "uOpacidade", "uZoom", "uRgb", "uDesloc", "uDir", "uTempo",
     "uEspBorda", "uCorBorda", "uBrilhoBorda"
    ].forEach(function (nome) { u[nome] = gl.getUniformLocation(programa, nome); });

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    elemento.innerHTML = "";
    elemento.appendChild(tela);

    /* ---- estado: cada valor tem um alvo e um atual ---- */
    var alvo    = { hover: 0, mx: 0, my: 0 };
    var atual   = { hover: 0, mx: 0, my: 0 };
    var parado  = menosMovimento();
    var visivel = true;
    var rodando = false;
    var pronta  = false;
    var quadro  = 0;
    var ultimo  = 0;
    var nascimento = 0;
    var largura = 0, altura = 0;

    var textura = gl.createTexture();
    var foto = new Image();

    foto.onload = function () {
      gl.bindTexture(gl.TEXTURE_2D, textura);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE,
                      paraPotenciaDeDois(foto));
      } catch (e) {
        /* é aqui que o file:// morre: o navegador recusa mandar para a placa
           de vídeo uma imagem aberta por duplo-clique. Cai para a foto normal. */
        parar();
        fotoSimples(elemento, opcoes);
        return;
      }
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.generateMipmap(gl.TEXTURE_2D);
      pronta = true;
      elemento.classList.add("croma--pronto");
      ligar();
    };

    foto.onerror = function () { fotoSimples(elemento, opcoes); };
    foto.src = opcoes.src;

    function medir() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var caixa = elemento.getBoundingClientRect();
      var w = Math.max(1, Math.round(caixa.width  * dpr));
      var h = Math.max(1, Math.round(caixa.height * dpr));
      if (w === largura && h === altura) { return; }
      largura = w; altura = h;
      tela.width = w; tela.height = h;
      gl.viewport(0, 0, w, h);
    }

    function aoMover(evento) {
      if (parado) { return; }
      var caixa = elemento.getBoundingClientRect();
      alvo.mx = ((evento.clientX - caixa.left) / caixa.width)  * 2 - 1;
      alvo.my = ((evento.clientY - caixa.top)  / caixa.height) * 2 - 1;
      alvo.hover = 1;
      ligar();
    }

    function aoSair() {
      alvo.hover = 0;
      alvo.mx = 0;
      alvo.my = 0;
    }

    elemento.addEventListener("pointermove", aoMover);
    elemento.addEventListener("pointerdown", aoMover);
    ["pointerleave", "pointerup", "pointercancel"].forEach(function (nome) {
      elemento.addEventListener(nome, aoSair);
    });

    function desenhar(agora) {
      quadro = 0;

      /* a foto ainda não chegou: solta o laço em vez de segurá-lo ligado,
         senão o ligar() do onload acharia que já estava rodando e o cartão
         nunca começaria a desenhar */
      if (!pronta) { rodando = false; return; }

      if (!nascimento) { nascimento = agora; ultimo = agora; }
      var dt = Math.min((agora - ultimo) / 1000, 0.05);
      ultimo = agora;
      var t = (agora - nascimento) / 1000;

      medir();

      atual.hover = aproximar(atual.hover, alvo.hover, cfg.hoverDuration, dt);
      atual.mx    = aproximar(atual.mx,    alvo.mx,    cfg.interactionDuration, dt);
      atual.my    = aproximar(atual.my,    alvo.my,    cfg.interactionDuration, dt);

      /* o balanço parado entrega o lugar ao ponteiro conforme ela encosta */
      var solto = (1 - Math.min(atual.hover * 2, 1)) * cfg.flutuacao;
      var balancoX = Math.sin(t * 0.62) * 0.030 * solto;
      var balancoY = Math.sin(t * 0.47 + 1.7) * 0.055 * solto;
      var derivaX  = Math.sin(t * 0.33 + 0.6) * 0.110 * solto;
      var derivaY  = Math.sin(t * 0.51) * 0.070 * solto;

      var giroY  = atual.mx * cfg.rotationIntensity + balancoY;
      var giroX  = -atual.my * cfg.rotationIntensity + balancoX;
      var px     = atual.mx * cfg.positionIntensity + derivaX;
      var py     = -atual.my * cfg.positionIntensity + derivaY;
      var escala = 1 + atual.hover * cfg.scaleIntensity;

      var proj = perspectiva(cfg.fov, largura / altura, 0.1, 100);
      var modelo = multiplicar(transladar(px, py, 0),
                   multiplicar(girarY(giroY),
                   multiplicar(girarX(giroX), escalar(escala))));
      var modelView = multiplicar(transladar(0, 0, -cfg.cameraZ), modelo);

      /* quanto vale um pixel de tela lá no plano do cartão — é o que deixa
         o canto arredondado liso em vez de serrilhado */
      var alturaVisivel = 2 * cfg.cameraZ * Math.tan((cfg.fov * Math.PI / 180) / 2);

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniformMatrix4fv(u.uProj, false, proj);
      gl.uniformMatrix4fv(u.uModelView, false, modelView);
      gl.uniform2f(u.uCard, cfg.cardWidth, cfg.cardHeight);
      gl.uniform1f(u.uRazaoImg, cfg.imageAspectRatio);
      gl.uniform1f(u.uRaio, cfg.borderRadius / PX_POR_UNIDADE);
      gl.uniform1f(u.uPixel, alturaVisivel / altura);
      gl.uniform1f(u.uOpacidade, cfg.opacity);
      gl.uniform1f(u.uZoom, atual.hover * cfg.zoomLevel);
      gl.uniform1f(u.uRgb, atual.hover * cfg.rgbShift);
      gl.uniform1f(u.uDesloc, atual.hover * cfg.pixelDisplace);
      gl.uniform2f(u.uDir, atual.mx, -atual.my);
      gl.uniform1f(u.uTempo, t);
      gl.uniform1f(u.uEspBorda, cfg.espessuraBorda);
      gl.uniform3f(u.uCorBorda, corBorda[0], corBorda[1], corBorda[2]);
      gl.uniform1f(u.uBrilhoBorda, cfg.brilhoBorda);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textura);
      gl.uniform1i(u.uTex, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      /* dorme quando não há mais nada acontecendo: cartão parado não precisa
         gastar bateria do celular dela */
      var mexendo = cfg.flutuacao > 0 ||
                    atual.hover > 0.002 ||
                    Math.abs(atual.mx) > 0.002 ||
                    Math.abs(atual.my) > 0.002;
      if (visivel && !parado && mexendo) {
        quadro = requestAnimationFrame(desenhar);
      } else {
        rodando = false;
      }
    }

    function ligar() {
      if (!pronta || rodando || !visivel) { return; }
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

    /* quem pediu menos movimento leva um quadro só, parado e sem efeito */
    function umQuadro() {
      if (!pronta) { return; }
      atual.hover = 0; atual.mx = 0; atual.my = 0;
      var salvo = cfg.flutuacao;
      cfg.flutuacao = 0;
      rodando = false;
      desenhar(performance.now());
      cfg.flutuacao = salvo;
      parar();
    }

    /* fora da tela, nada roda */
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entradas) {
        visivel = entradas[0].isIntersecting;
        if (visivel) { ligar(); } else { parar(); }
      }, { threshold: 0.01 }).observe(elemento);
    }

    window.addEventListener("resize", function () {
      largura = 0;
      if (parado) { umQuadro(); } else { ligar(); }
    });
  }

  return { montar: montar, PADRAO: PADRAO };
})();
