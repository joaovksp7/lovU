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

> Não tem ferramenta para redimensionar? O jeito rápido é o
> [squoosh.app](https://squoosh.app) — abre no navegador, não instala nada.

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

Só os dias que aparecem aqui ficam destacados e clicáveis no calendário. As
fotos continuam todas na galeria de qualquer jeito — datar é opcional, dá para
ir fazendo aos poucos.

> ⚠️ **As duas datas que já estão lá usam fotos de exemplo.** As fotos vieram
> do WhatsApp sem data (o EXIF é apagado no envio), então não deu para saber de
> que dia cada uma é. Troque `foto-001` e `foto-002` pelas certas.

### 3. Adicionar um marco na timeline

Um objeto novo no array `timeline`:

```js
{
  data: "2026-01-01",
  titulo: "Nosso primeiro réveillon",
  descricao: "Uma frase sobre o dia.",
  foto: "foto-030"          // opcional, pode apagar a linha
}
```

A ordem no arquivo não importa — a timeline se ordena sozinha pela data.

### 4. Trocar as músicas da trilha

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

---

## Estrutura

```
index.html            as seções, na ordem em que aparecem
css/style.css         todo o visual (paleta nas variáveis do :root)
js/
  lightbox.js         o visualizador de foto/vídeo — usado pelo calendário E pela galeria
  contador.js         os dias juntos
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
