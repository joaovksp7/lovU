# AGENTS.md

## Mandatory workflow

For every instruction, follow these steps in order — no exceptions:

1. **Read** — Identify and read all files related to the instruction (the section in `index.html`, its styles in `css/style.css`, its script in `js/`, its data in `data/momentos.js`, its assets).
2. **Confirm** — Reply with:
   - **Understood:** (2–3 sentence summary of what was requested)
   - **Files I will change:** (name and path of each file)
   - **What changes in each:** (brief description per file)
3. **Wait** — Do not make any changes until receiving explicit confirmation ("ok", "go ahead", "yes", or equivalent).
4. **Execute** — Only after confirmation, implement exactly what was agreed. Do not expand scope without informing first.

If any part of the instruction is unclear, ask before reading files.

---

## Rules

**Do:**

- Follow existing patterns in the project (naming, section structure, CSS-variable tokens)
- Stay within the strict scope of what was requested
- Report any problem found outside the scope before acting on it
- Keep every text in **PT-BR** — this is a personal, romantic page; the copy is hers to read
- Warn if a change may break something elsewhere on the page
- Keep **all** dates in the `AAAA-MM-DD` format, everywhere: `fotosPorDia` keys and timeline entries

**Do not:**

- Change files without presenting the plan and waiting for confirmation
- Assume anything not explicitly stated
- Introduce a framework, build step, bundler or external dependency (see stack below)
- Refactor beyond what was requested
- Rename, move or delete files without explicit approval
- Hard-code content (photos, milestones, dates) into HTML or JS — content belongs in `data/momentos.js`
- Duplicate the lightbox — the calendar and the gallery share one component

---

## Project — Nosso Namoro (landing page)

**What it is:** a single-page, romantic landing page, a personal gift. It opens with a full-screen entry screen (the click reveals the page **and** starts the music), then scrolls through: soundtrack bar → day counter → relationship timeline → interactive calendar with photos per day → general photo gallery. Warm colors, soft transitions. It will be opened mostly **on her phone**, so mobile is the primary target, not an afterthought.

**Reference dates (do not change without being told):**

- Started talking: **13/10/2025** → `new Date(2025, 9, 13)`
- Started dating: **22/05/2026** → `new Date(2026, 4, 22)` — this is the **main** date

Months in JS are 0-indexed. Pin both dates to **local midnight** so the day count does not oscillate with timezone.

**Full spec:** `PLANO_LANDING_PAGE.md` at the project root is the source of truth for scope, stage order and data shapes. Read it before starting a new stage.

**Stack — deliberately minimal:**

- Static site, no framework, no Vite, no npm, no build step, no TypeScript.
- Plain HTML + one external stylesheet + vanilla JS in separate files (unlike a single-file page — styles live in `css/style.css`, behavior in `js/`).
- Fonts via Google Fonts: a serif for headings (Playfair Display) and a clean sans for body text (Inter or Lato). Everything else is self-hosted.

**File structure (project root):**

```
index.html
css/
  style.css
js/
  lightbox.js          (the ONE viewer, shared by calendar and gallery)
  contador.js          (day counter)
  timeline.js          (milestones)
  calendario.js        (month grid + highlighted days)
  galeria.js           (grid gallery)
  trilha.js            (the soundtrack bar: one random local MP3, on loop)
  app.js               (entry screen, names, scroll reveals — loaded last)
data/
  momentos.js          (ALL content: casal + fotos + fotosPorDia + timeline + trilha)
assets/
  fotos/               foto-NNN.jpg (1600px) + video-NNN.mp4
  fotos/thumbs/        foto-NNN.jpg (500px) — what the grid loads
  fotos/originais/     untouched WhatsApp files — GITIGNORED (53 MB)
  audio/               musica-NNN.mp3 — the phone soundtrack (committed)
.gitignore
README.md
```

Classic `<script>` tags in that order — **no ES modules**, so `index.html`
still opens by double-click over `file://` (modules would need a server).

**Design system (source of truth = `:root` in `css/style.css`):**

- Warm romantic palette as CSS variables: burnt pink, soft bordô, light gold, cream / off-white background. **Use tokens, never hard-coded hexes for new work.**
- Soft transitions, gentle motion (e.g. a slowly pulsing heart). Nothing loud or flashy.

**Sections (in order in `index.html`):** entry screen (overlay) → soundtrack bar (first child of `<main>`, **not** sticky — it scrolls away like any other section) → day counter → timeline → calendar → gallery → Spotify playlist section.

**Content data — the one file that changes often (`data/momentos.js`):**

```js
const casal = { nomeA: "Amanda Letícia", nomeB: "João Vitor", frase: "..." };

// lista canônica, na ordem da galeria — só o identificador, sem pasta nem extensão
const fotos = ["foto-001", "foto-002", /* … */ "video-001"];

// overlay de datas: aponta para os MESMOS identificadores
const fotosPorDia = { "2025-10-13": ["foto-001"] };

const timeline = [{ data: "2025-10-13", titulo: "...", descricao: "...", foto: "foto-001" }];

// trilha do celular: identificador do arquivo, sem pasta nem extensão
const trilha = [{ arquivo: "musica-001", titulo: "...", artista: "..." }];
```

`fotos` é a fonte canônica; `fotosPorDia` é **só um overlay** que reusa os
mesmos ids. Datar uma foto = escrever um id numa chave; nenhum arquivo é
movido nem duplicado, e a galeria nunca sai de sincronia com o calendário.
Os caminhos completos são derivados em `Lightbox.caminho()` / `Lightbox.thumb()`
— **nunca** escreva `assets/fotos/...` à mão fora do `lightbox.js`.

Adding a milestone = one object in `timeline`. Adding a photo = two files
(`assets/fotos/` + `assets/fotos/thumbs/`) + one id in `fotos`. **Never** touch
the rendering code to add content.

**Photos have no reliable date.** They came from a WhatsApp export with the
EXIF stripped, so the calendar is populated by hand, a day at a time. Never
invent a date for a photo — if the day is unknown, it just stays out of
`fotosPorDia` and lives in the gallery only.

**Behavior (vanilla JS):**

- Entry screen: click fades it out, reveals the content **and** starts the music via `Trilha.iniciar()`. That call is the **first** thing in the click handler and must stay synchronous — iOS only accepts audio started from inside the gesture itself.
- Counter: `setInterval` at 1000ms, live, no reload needed. Days for both dates; years/months/days detail for the main one.
- Timeline: items alternate sides on a central line and fade in via **IntersectionObserver**.
- Calendar: one month at a time with prev/next navigation. Opens on **outubro/2025** (`ANO_INICIAL`/`MES_INICIAL` no topo de `calendario.js`). A cell is highlighted and clickable **only** if its `AAAA-MM-DD` key exists in `fotosPorDia` — dias sem foto viram `<span>`, não `<button>`.
- Lightbox: a **single** component (`js/lightbox.js`), reused by the calendar and the gallery — full screen, prev/next, close, `Esc`/`←`/`→`, devolve o foco a quem o abriu. Renders `<video controls>` when the id starts with `video-`.
- Soundtrack bar (`js/trilha.js`): opens the content, scrolls away with it. Random track from `trilha` + random photo from `fotos` (via `Lightbox.thumb()`) in place of album art, prev / pause / next. Same on desktop and phone — no device sniffing anywhere.
- Always respect `prefers-reduced-motion`.

**Images:** the grid loads **thumbnails only** (`thumbs/`, ~2 MB total), always `loading="lazy"`; the 1600px version is fetched only when the lightbox opens. Every new photo needs both files. Compress before committing — heavy photos kill mobile load time and free-tier bandwidth.

**Background music — a local MP3, started by the "Entrar" click. Same on every device.**

`trilha.js` draws **one** track from `trilha` at random and loops it. The `<audio>` carries `preload="none"`, so nothing is downloaded before the click; each MP3 is 6–10 MB and only the drawn one is ever fetched.

- **Volume is 30% of the original**, set by a **Web Audio `GainNode`**, not by `audio.volume` — iOS Safari ignores that property. The `AudioContext` is built inside the "Entrar" click, because on iOS it is born suspended and only leaves that state from a gesture. `VOLUME` at the top of `trilha.js` is the one knob; if Web Audio is missing, the code falls back to `audio.volume` (works everywhere but iOS). Never set both — routed through the gain node they would multiply.
- Chavinha de silencioso do iPhone mutes the `<audio>`. No JS can work around it; the play button just goes back to the paused state.
- **Spotify never plays on its own.** The embed stays as the "A nossa playlist" section, visible for her to browse and open — she presses play there herself, and it plays 30s previews without a logged-in Premium account.
- **Why Spotify is not the soundtrack:** mobile browsers refuse to start playback inside a cross-origin iframe even with a user gesture, the Web Playback SDK does not run in mobile browsers at all, and nothing in the embed exposes volume, track name or artwork. Do not try to drive it — this was tested and settled.
- Playlist: `https://open.spotify.com/playlist/2tCktWMXFeq2Um3Gybs314` — drop the `si=` share token when building the embed URL; it is a tracking parameter.
- Style the container, not Spotify's internals — the iframe is cross-origin and its CSS cannot be reached.
- The Spotify iframe and Google Fonts are the only two allowed external requests. Nothing else.

**Personal content:** the photos and the copy are private and real. Do not publish, upload or share assets anywhere outside this repo without being asked.

---

## Ao terminar

- Abrir `index.html` no **navegador real** (ou `python -m http.server`) e conferir a seção alterada em **mobile primeiro**, depois desktop.
- Verificar que nenhuma foto referenciada ficou quebrada (caminho e nome da pasta em `AAAA-MM-DD`) e que o player do Spotify carrega.
- Conferir a trilha: o clique no "Entrar" tem que fazer sair som de uma das músicas de `assets/audio/` (celular fora do silencioso), num volume que não estoura, com capa, nome, pausar e trocar de música funcionando.
- Conferir o contador virando a meia-noite e o formato de anos/meses/dias.
- Conferir se todos os dias com foto aparecem destacados no calendário e se os sem foto continuam não clicáveis.
- Manter o `README.md` atualizado com como adicionar fotos e marcos novos.

---

## Pendências conhecidas

- **`fotosPorDia` está com fotos de exemplo** nos dois dias conhecidos. Trocar
  pelos ids certos e ir datando o resto das 82 fotos aos poucos.
- Marcos da timeline além dos dois já conhecidos (13/10/2025 e 22/05/2026).
- Hospedagem: Netlify (arrastar a pasta) ou GitHub Pages em `joaovksp7.github.io`.
- **Os MP3 estão em 320kbps** (25,7 MB somados). Só um é baixado por visita, mas
  dá para cortar cada um para ~3 MB num conversor online — não há ffmpeg nesta
  máquina. As três faixas são gravações comerciais: link privado tudo bem,
  site público é redistribuição.
- O repositório ainda não tem nenhum commit.

---
