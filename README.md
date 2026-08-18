# Nosso Namoro

Página de presente para a Amanda Letícia. HTML, CSS e JavaScript puro — sem
framework, sem npm, sem build. Para ver, é só abrir o `index.html` no
navegador (duplo clique funciona).

---

## As duas coisas que você vai querer fazer

Tudo que é conteúdo mora em **`data/momentos.js`**. Você nunca precisa mexer no
código das seções.

### 1. Adicionar fotos novas

1. Deixe a foto com no máximo ~1600px no lado maior e salve em
   `assets/fotos/` como `foto-083.jpg` (siga a numeração).
2. Salve uma miniatura de ~500px em `assets/fotos/thumbs/foto-083.jpg`,
   **com o mesmo nome**. É a miniatura que a galeria carrega — sem ela a foto
   aparece quebrada na grade.
3. Acrescente `"foto-083"` no fim da lista `fotos`.

> **Redimensionar sem sair da máquina:** o `ffmpeg` já está instalado aqui.
> Com a foto original em `assets/fotos/originais/`, os dois arquivos saem de
> dois comandos (o `if` é só para o lado maior valer, seja retrato ou paisagem):
>
> ```sh
> cd assets/fotos
> ffmpeg -i originais/IMG.jpg -vf "scale=w='if(gte(iw,ih),1600,-2)':h='if(gte(iw,ih),-2,1600)':flags=lanczos" -q:v 4 foto-095.jpg
> ffmpeg -i foto-095.jpg      -vf "scale=w='if(gte(iw,ih),500,-2)':h='if(gte(iw,ih),-2,500)':flags=lanczos"   -q:v 4 thumbs/foto-095.jpg
> ```
>
> Se preferir no navegador, o [squoosh.app](https://squoosh.app) faz o mesmo
> sem instalar nada.

Vídeo é igual, com `"video-002"` e o `.mp4` em `assets/fotos/`. Vídeo não
precisa de miniatura: a grade mostra um card com o ícone de play.

### 2. Marcar de que dia é uma foto (é isso que acende o calendário)

No objeto `fotosPorDia`, a chave é a data em `AAAA-MM-DD` e o valor é a lista
de fotos daquele dia:

```js
const fotosPorDia = {
  "2025-10-13": ["foto-001", "foto-045"],
  "2026-05-22": ["foto-002"]
};
```

As fotos continuam todas na galeria de qualquer jeito — datar é opcional, dá
para ir fazendo aos poucos.

> ⚠️ **`2026-05-22` ainda usa uma foto de exemplo** (`foto-002`). As fotos
> vieram do WhatsApp sem data (o EXIF é apagado no envio), então não deu para
> saber de que dia cada uma é. Troque pela certa quando souber.

### 3. Escrever o recado de um dia

O objeto `frasesPorDia` guarda uma frase por data — o que você escreveria no
verso da foto:

```js
const frasesPorDia = {
  "2024-09-18": "Nosso primeiro contato no Viva Unisc.",
  "2024-10-13": "Nossa primeira foto juntos."
};
```

Duas coisas acontecem com essa frase:

- **Se o dia tiver foto** em `fotosPorDia`, ela vira a legenda dentro do
  lightbox, no lugar da data por extenso.
- **Se o dia não tiver foto nenhuma**, ele acende no calendário assim mesmo —
  vazado, sem preenchimento — e ao tocar a frase aparece logo abaixo da grade.
  É como entram os dias de que não sobrou imagem.

Ou seja: um dia acende no calendário se tiver **foto ou frase**.

### 4. Adicionar um marco na timeline

Um objeto novo no array `timeline`:

```js
{
  data: "2026-01-01",
  titulo: "Nosso primeiro réveillon",
  descricao: "Uma frase sobre o dia.",
  foto: "foto-030",         // opcional, pode apagar a linha
  destaque: true,           // opcional, ver abaixo
  corte: true               // opcional, ver abaixo
}
```

A ordem no arquivo não importa — a timeline se ordena sozinha pela data.

**`destaque: true`** troca a miniatura do marco pelo **cartão cromático**
(`js/croma-card.js`): a foto vira textura de um plano 3D desenhado em WebGL,
com câmera em perspectiva. Encostando nele, o cartão gira, cresce e desliza
seguindo o dedo, a foto amplia e as cores se separam em vermelho/verde/azul,
com uns quadradinhos saindo do lugar. Parado, ele fica balançando de leve —
é o que ela vê no celular, onde não existe passar o mouse por cima.

Hoje quem usa é o marco de **31/12/2025**. É para **um marco só**: dois
cartões desses na mesma página tiram o peso um do outro (e dobram o custo
de bateria). Quem pediu menos movimento no sistema recebe um quadro estático.

Os números do efeito ficam em `PADRAO`, no alto do `croma-card.js` — são os
mesmos nomes e valores do painel "Customize" da documentação do React Bits
Pro, então dá para copiar de lá direto. Os mais úteis:

| Ajuste | Padrão | O que faz |
|---|---|---|
| `zoomLevel` | 0.30 | quanto a foto amplia com o dedo em cima |
| `rgbShift` | 0.020 | o quanto as cores se separam |
| `pixelDisplace` | 0 | quadradinhos fora do lugar (o painel usa 0.095; desligado aqui porque picotava a foto) |

**`corte: true`** tira o marco do lado dele e faz ele **atravessar a timeline
inteira**, partindo o caule em dois: a data, o título e a foto ficam no meio,
de ponta a ponta. É a pausa da linha do tempo — o marco em que a história
muda de rumo.

Nesse marco o **título vira texto de partículas** (`js/particle-text.js`):
cada letra é feita de pontinhos que fogem do dedo e voltam ao lugar puxados
por uma mola, acendendo em rosa enquanto estão fora de casa. É a mesma ideia
do "Particle Text" do React Bits Pro, refeita em WebGL puro. A data logo
acima ganha a serifada em itálico, menor que o título de propósito: o título
é o destaque maior.

Também é para **um marco só** — hoje, o de **31/12/2025**, que usa os dois
(`destaque` para a foto virar cartão cromático, `corte` para atravessar).

A fonte, o tamanho e a cor das partículas **não ficam no JS**: elas são lidas
do próprio `<h3>`, ou seja, saem de `.marco--corte .marco__titulo` no
`style.css`. O que o `PADRAO` do `particle-text.js` guarda é só a física:

| Ajuste | Padrão | O que faz |
|---|---|---|
| `passo` | 2 | de quantos em quantos pixels o texto é lido (menor = mais partículas) |
| `tamanhoPonto` | 2.9 | o tamanho de cada partícula |
| `raio` | 86 | até onde o dedo empurra |
| `forca` | 2600 | com que força |
| `mola` | 26 | com que pressa elas voltam ao lugar |
| `flutuacao` | 0.7 | o tremor parado (0 deixa o título imóvel) |

Sem WebGL, o `<h3>` normal continua na tela e nada se perde. Quem pediu menos
movimento no sistema recebe o título já formado e parado.
| `brilhoBorda` | 0 | aro de luz na beirada — desligado; subir para ~0.9 traz de volta |
| `espessuraBorda` | 0.055 | a grossura desse aro, se ligado |
| `corBorda` | `#F2D9A0` | a cor desse aro (o token `--estrela`) |
| `rotationIntensity` | 0.20 | o giro seguindo o ponteiro |
| `scaleIntensity` | 0.10 | o quanto o cartão cresce |
| `positionIntensity` | 0.5 | o quanto ele desliza de lado |
| `hoverDuration` | 3.0 s | a demora do zoom/cor/glitch |
| `interactionDuration` | 0.4 s | a demora do giro e da posição |
| `flutuacao` | 1.0 | o balanço parado (`0` desliga) |

> ⚠️ **O cartão não aparece abrindo o `index.html` por duplo-clique.** Em
> `file://` o navegador proíbe mandar a foto para a placa de vídeo, e a página
> cai sozinha na foto normal, sem efeito. Para ver, rode um servidor na pasta:
>
> ```
> python -m http.server 8000
> ```
>
> e abra `http://localhost:8000`. No site hospedado funciona normalmente — o
> resto da página (música, contador, calendário, galeria) continua abrindo por
> duplo-clique como sempre.

### 5. Trocar as músicas da trilha

A página sorteia **uma** das músicas de `assets/audio/` e deixa tocando em
loop. Para mexer nisso:

1. Salve o MP3 em `assets/audio/` como `musica-004.mp3` (siga a numeração).
2. Acrescente um bloco no array `trilha`:

```js
{ arquivo: "musica-004", titulo: "Nome da música", artista: "Quem canta" }
```

`titulo` e `artista` são o que aparece na faixa. No lugar da capa do álbum a
página põe uma foto nossa sorteada, então não precisa de imagem.

> Cada MP3 pesa 6–10 MB em 320kbps. Só o sorteado é baixado, mas se quiser
> aliviar, um conversor online resolve — 128kbps já é mais que suficiente aqui.

### 6. Trocar o vídeo do abraço (a máscara do topo)

A primeira seção depois do "Entrar" traz o recado grande e, logo abaixo, um
quadro que **abre conforme ela rola** e revela um vídeo. Tudo isso sai do
objeto `abertura`, no topo do `data/momentos.js`:

```js
const abertura = {
  recado: "Aumenta o volume, mor!",
  dica: "role para baixo",
  video: "video-001",
  descricao: "O nosso abraço",
  mascara: "iris",
  palavra: "ABRAÇO"
};
```

Para pôr o vídeo do abraço no lugar:

1. Salve o arquivo como `assets/fotos/video-002.mp4` (siga a numeração).
2. Troque `video: "video-001"` por `video: "video-002"`.
3. Se você quiser ele também na galeria, acrescente `"video-002"` no array `fotos`.

O vídeo toca **mudo**, em loop, e só começa quando a seção entra na tela — a
trilha já está tocando, e dois áudios juntos brigariam. Uma foto serve no lugar
do vídeo também: basta pôr um id `foto-NNN`. Com `video: ""` a seção fica só
com o recado, sem quadro nenhum.

`mascara` escolhe o jeito de revelar. São seis:

| valor | como abre |
|---|---|
| `iris` | um círculo que abre do centro |
| `wipe` | uma varredura reta, na diagonal |
| `curtain` | duas cortinas abrindo do meio para os lados |
| `slats` | faixas horizontais, uma atrás da outra |
| `grid` | uma grade de células florescendo na diagonal |
| `type` | a palavra de `palavra` vira janela e cresce até engolir o quadro |

Para afinar o efeito — a beirada macia, o zoom, o atraso entre as peças,
quantas faixas, quanta rolagem a abertura leva — o painel é o `PADRAO` no topo
de `js/scroll-mask.js`. Os nomes são os mesmos do "Customize" do React Bits, em
português.

**No computador o quadro cobre a tela inteira.** Ele começa do tamanho da seção
e vai crescendo até encostar nas quatro bordas enquanto a máscara abre; depois,
quando ela continua rolando, encolhe e fecha de volta antes de a seção sair. No
celular nada disso acontece — lá o quadro já ocupa quase tudo. Quem manda são
três ajustes, no `ScrollMask.montar` do `js/abertura.js`: `telaCheia` (liga o
crescimento), `saida` (de que ponto da rolagem em diante ele fecha) e `corrida`
(quanta rolagem a seção inteira leva — aumentar `saida` sem aumentar `corrida`
deixa o fechamento apressado).

> `type` desenha a palavra com uma fonte do sistema (Georgia), não com a
> Playfair: SVG embutido em `data:` não baixa fonte do Google Fonts.

---

## Estrutura

```
index.html            as seções, na ordem em que aparecem
css/style.css         todo o visual (paleta nas variáveis do :root)
js/
  lightbox.js         o visualizador de foto/vídeo — usado pelo calendário E pela galeria
  contador.js         os dias juntos
  croma-card.js       o cartão em WebGL do marco em destaque
  particle-text.js    o título de partículas do marco que corta a timeline
  scroll-mask.js      a máscara que abre ao rolar (as seis geometrias)
  abertura.js         a seção do recado e do abraço, no topo
  timeline.js         os marcos
  calendario.js       o mês com os dias destacados
  galeria.js          a grade de fotos
  trilha.js           a faixa de música que abre o conteúdo
  app.js              tela de entrada, nomes e animações de aparecer
data/momentos.js      >>> TODO o conteúdo fica aqui <<<
assets/fotos/         foto-NNN.jpg (grandes) + thumbs/ (miniaturas) + video-NNN.mp4
assets/fotos/originais/   os arquivos do WhatsApp, sem compressão (fora do git)
assets/audio/         musica-NNN.mp3 — a trilha que toca no celular
```

---

## Detalhes que importam

- **Datas sempre em `AAAA-MM-DD`**, em qualquer lugar do projeto.
- **A música começa no clique do "Entrar"**: uma das músicas de `assets/audio/`,
  sorteada, em loop, igual no computador e no celular. O player do Spotify lá
  embaixo é só para ver e abrir a playlist — ele não toca sozinho, e sem
  Premium logado toca prévias de 30 segundos.
- **O volume sai em 30% do original**, para não estourar no fone. Para mudar,
  a constante `VOLUME` no topo de `js/trilha.js` — e só ela.
- **Se o iPhone estiver na chavinha de silencioso, não sai som.** Não há
  código que dê jeito nisso; é só tirar do mudo e apertar o play da barra.
- **O vídeo do abraço, no topo, é mudo e em loop**, e só dá play quando a seção
  entra na tela. Mudo de propósito: a trilha está tocando ao mesmo tempo.
- **A galeria carrega só as miniaturas** (~2 MB no total). A foto grande só é
  baixada quando o lightbox abre. É o que mantém a página leve no celular.
- `assets/fotos/originais/` está no `.gitignore` de propósito: são 53 MB e o
  histórico do git nunca esquece um arquivo grande.
- A página respeita `prefers-reduced-motion` para quem desliga animações no
  sistema.

## Publicar

- **Netlify:** arraste a pasta do projeto em app.netlify.com. Sobe na hora, com
  HTTPS.
- **GitHub Pages:** suba o repositório e ative Pages nas settings.

Em qualquer um dos dois, lembre que `assets/fotos/originais/` não vai junto — e
não precisa mesmo, o site usa as versões comprimidas.
