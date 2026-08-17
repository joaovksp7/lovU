# Plano de Implementação — Landing Page do Nosso Namoro

Landing page romântica de página única, feita em HTML, CSS e JavaScript puro. Sem framework pesado, fácil de hospedar no Netlify ou GitHub Pages.

Datas de referência:
- Começamos a conversar: **13/10/2025**
- Começamos a namorar: **22/05/2026**

---

## Objetivo geral

Uma página que abre com uma tela de entrada (o clique revela o conteúdo), rola para uma sequência de seções: contador de dias, timeline do relacionamento, calendário interativo com fotos por dia e uma galeria geral. Clima romântico, cores quentes, transições suaves.

---

## Estrutura de arquivos

Peça ao Claude Code para montar esta estrutura:

```
lovU/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── lightbox.js        (o visualizador único, usado pelo calendário E pela galeria)
│   ├── contador.js
│   ├── timeline.js
│   ├── calendario.js
│   ├── galeria.js
│   └── app.js             (tela de entrada, nomes, animações — carregado por último)
├── data/
│   └── momentos.js        (TODO o conteúdo)
├── assets/
│   └── fotos/             foto-NNN.jpg + video-NNN.mp4
│       ├── thumbs/        miniaturas de 500px (é o que a grade carrega)
│       └── originais/     arquivos do WhatsApp sem compressão (fora do git)
├── .gitignore
└── README.md
```

As fotos ficam **planas**, sem pasta por data: elas vieram do WhatsApp sem
EXIF, então não há data confiável para organizá-las. A data é um overlay
opcional em `fotosPorDia` (Etapa 4).

---

## Etapa 1 — Estrutura base e tela de entrada

Prompt sugerido para o Claude Code:

> Crie o index.html com uma tela de entrada em tela cheia sobrepondo o conteúdo. Ela deve ter um título com nossos nomes, uma frase curta e um botão em formato de coração escrito "Entrar". Ao clicar, a tela de entrada some com fade-out e o conteúdo aparece. Use HTML e CSS puro.

Pontos de atenção:
- A tela de entrada revela a página **e** dá a partida na música (Etapa 6). A chamada `Trilha.iniciar()` é a primeira coisa do clique e tem que ser síncrona — o iPhone só aceita áudio que nasce de dentro do gesto.
- Guarde a paleta romântica em variáveis CSS (`:root`) para reaproveitar. Sugestão de cores: tons de rosa queimado, bordô suave, dourado claro e um fundo creme ou off-white.
- Fonte: uma serifada elegante para títulos (ex: Playfair Display) e uma sans-serif limpa para o corpo (ex: Inter ou Lato), via Google Fonts.

---

## Etapa 2 — Contador de dias juntos

Prompt sugerido:

> Crie o contador em js/contador.js. Ele deve calcular e mostrar, em tempo real, quanto tempo faz desde duas datas: 13/10/2025 (quando começamos a conversar) e 22/05/2026 (quando começamos a namorar). Mostre em dias para cada uma, e para a data principal mostre também o detalhe em anos, meses e dias. Atualize a contagem sozinha sem precisar recarregar a página.

Lógica:
- Use `new Date(2025, 9, 13)` para 13/10/2025 e `new Date(2026, 4, 22)` para 22/05/2026 (lembre que mês em JS começa no 0).
- Calcule a diferença com `Date.now()` e converta para dias.
- Rode um `setInterval` a cada 1000ms para o contador parecer vivo (útil se quiser mostrar horas, minutos e segundos também).
- Trate o fuso: fixe as datas à meia-noite local para o número de dias não oscilar.

Ideia visual: dois cartões lado a lado, "Conversando há X dias" e "Namorando há Y dias", com um coração pulsando suave em CSS.

---

## Etapa 3 — Timeline do relacionamento

Prompt sugerido:

> Crie uma timeline vertical em HTML e CSS que leia os marcos de um array em data/momentos.js. Cada marco tem data, título, descrição e uma foto opcional. Os itens devem alternar lados (esquerda e direita) numa linha central e aparecer com uma animação de fade ao rolar a página.

Estrutura dos dados em `data/momentos.js`:

```js
const timeline = [
  {
    data: "2025-10-13",
    titulo: "O primeiro oi",
    descricao: "O dia em que tudo começou.",
    foto: "foto-001"          // só o identificador, sem pasta nem extensão
  },
  {
    data: "2026-05-22",
    titulo: "Oficializamos",
    descricao: "O dia em que viramos namorados.",
    foto: "foto-002"
  }
  // adicione os outros marcos aqui
];
```

Ponto de atenção: use IntersectionObserver para disparar a animação quando cada item entra na tela. É leve e não trava a rolagem.

---

## Etapa 4 — Calendário interativo com fotos por dia

Esta é a parte mais elaborada. Peça em partes.

Prompt sugerido:

> Crie um calendário em js/calendario.js que mostre um mês por vez, com botões para navegar entre meses. Os dias que têm fotos registradas em data/momentos.js devem aparecer destacados (por exemplo com um coração ou uma borda dourada). Ao clicar num dia destacado, abra um modal (lightbox) mostrando as fotos daquele dia. Dias sem foto ficam sem destaque e não são clicáveis.

Estrutura dos dados de fotos em `data/momentos.js` (além da timeline):

```js
// a lista canônica de TUDO, na ordem da galeria
const fotos = ["foto-001", "foto-002", /* … */ "video-001"];

// overlay de datas — reusa os MESMOS identificadores da lista acima
const fotosPorDia = {
  "2025-10-13": ["foto-001"],
  "2026-05-22": ["foto-002"]
  // chave = data em AAAA-MM-DD, valor = lista de identificadores
};
```

Datar uma foto é escrever um id numa chave: nenhum arquivo é movido nem
duplicado, e a galeria nunca sai de sincronia com o calendário. Foto sem data
conhecida simplesmente não entra aqui — ela continua aparecendo na galeria.

Lógica do calendário:
- Gere a grade do mês calculando o primeiro dia da semana e o número de dias do mês.
- Para cada célula, verifique se a data (formatada como `AAAA-MM-DD`) existe em `fotosPorDia`. Se existir, marque como destacada e clicável.
- Ao clicar, abra o modal e monte a galeria daquele dia a partir da lista de caminhos.
- **Decidido:** o calendário abre em outubro de 2025 (onde tudo começou). Para mudar, `ANO_INICIAL`/`MES_INICIAL` no topo de `js/calendario.js`.

Ponto de atenção: mantenha a formatação de data consistente em todo o projeto (`AAAA-MM-DD`). Um mês desalinhado entre o dado e a chave quebra o destaque.

---

## Etapa 5 — Galeria geral e lightbox

Prompt sugerido:

> Crie js/galeria.js com uma galeria em grade (grid) que reúna todas as fotos do relacionamento. Ao clicar em qualquer foto, abra um lightbox em tela cheia com navegação para próxima e anterior, e um botão de fechar. Reaproveite o mesmo componente de lightbox usado no calendário para não duplicar código.

Pontos de atenção:
- Um único componente de lightbox (`js/lightbox.js`) serve tanto para o calendário quanto para a galeria.
- O lightbox também abre **vídeo**: identificador que começa com `video-` vira `<video controls>` em vez de `<img>`.
- A grade carrega **só as miniaturas** de `assets/fotos/thumbs/` (~2 MB no total), com `loading="lazy"`. A imagem de 1600px só é baixada quando o lightbox abre — é isso que mantém a página leve no celular.
- Foto nova precisa dos **dois** arquivos: a grande e a miniatura, com o mesmo nome.

---

## Etapa 6 — Música (feita: trilha local + a playlist para ver)

Playlist escolhida: <https://open.spotify.com/playlist/2tCktWMXFeq2Um3Gybs314>

**A trilha é um MP3 de `assets/audio/`, sorteado, em loop**, começando no clique
do "Entrar" (`js/trilha.js`). É igual no computador e no celular. No lugar da
capa do álbum entra uma foto nossa, também sorteada. A faixa abre o conteúdo e
rola embora junto com a página — não é fixa.

**O Spotify não toca sozinho em lugar nenhum.** Ele continua como a seção "A
nossa playlist", visível para ela ver as músicas e abrir no aplicativo dela.
Isso não é escolha estética, é o que sobrou depois de testar: navegador de
celular recusa dar play num iframe de outro domínio mesmo com o toque do
usuário, o Web Playback SDK não roda em celular, e o embed não expõe volume,
nome de faixa nem capa. Não tente pilotá-lo de novo.

Pontos de atenção:
- Tire o parâmetro `?si=...` do link ao montar o embed — é um token de compartilhamento, não faz parte do endereço do player.
- Sem Premium logado, o Spotify toca prévias de 30 segundos. É assim mesmo, não é bug.
- O iframe é cross-origin: dá para estilizar a caixa em volta, não o conteúdo do player.
- **O volume da trilha fica em 30%, por GainNode da Web Audio API** — `audio.volume` não serve porque o Safari do iPhone o ignora. O `AudioContext` é montado dentro do clique do "Entrar" (no iOS ele nasce suspenso). A constante `VOLUME` no topo do `trilha.js` é o único lugar para mexer. Nunca ajuste os dois: com o áudio passando pelo ganho, eles se multiplicam.
- Chavinha de silencioso do iPhone muda tudo isso para zero. Não há código que dê jeito.
- O `<audio>` nasce com `preload="none"`: nada é baixado antes do clique.
- Requisições externas permitidas: Google Fonts e o embed do Spotify. Só.

---

## Etapa 7 — Ajustes finais

Prompt sugerido:

> Deixe a página totalmente responsiva para celular, já que ela vai abrir no telefone dela. Ajuste a timeline para empilhar em coluna única no mobile, o calendário para caber na tela e a galeria para reduzir o número de colunas. Revise as animações para ficarem suaves e adicione um scroll suave entre as seções.

Checklist final:
- Testar no celular (a maioria vai abrir por lá).
- Comprimir todas as imagens.
- Conferir o contador virando a meia-noite.
- Conferir se todos os dias com foto aparecem destacados no calendário.
- Escrever um README.md curto explicando como adicionar novas fotos e novos marcos.

---

## Como adicionar conteúdo novo depois

Deixe isso documentado no README para facilitar sua vida no futuro:

1. **Foto nova:** salve `assets/fotos/foto-NNN.jpg` (~1600px) e
   `assets/fotos/thumbs/foto-NNN.jpg` (~500px), e acrescente `"foto-NNN"` na
   lista `fotos` em `data/momentos.js`.
2. **Marcar de que dia é a foto:** acrescente o id dela na chave
   `AAAA-MM-DD` correspondente em `fotosPorDia`. É isso que acende o dia no
   calendário.
3. **Novo marco na timeline:** adicione um objeto no array `timeline`.

Assim você nunca mexe no código, só nos dados.

---

## Hospedagem

Depois de pronto:

1. **Netlify (mais fácil):** arraste a pasta `lovU/` em app.netlify.com e o site sobe na hora, com HTTPS e um subdomínio grátis.
2. **GitHub Pages:** suba o projeto num repositório na sua conta (joaovksp7), ative Pages nas settings e ele fica em `joaovksp7.github.io/lovU`.

Dica: um domínio próprio tipo `nossonamoro.com.br` custa pouco por ano e dá um toque especial se quiser presentear com o link.

---

## Ordem sugerida de implementação

1. Estrutura base + tela de entrada
2. Contador de dias
3. Timeline
4. Calendário com fotos
5. Galeria + lightbox
6. Player do Spotify
7. Responsividade e ajustes finais

Faça uma etapa de cada vez no Claude Code, testando no navegador antes de passar para a próxima. Assim fica fácil achar qualquer problema.
