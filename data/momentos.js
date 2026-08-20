/* ==========================================================================
   momentos.js — O ÚNICO arquivo que você precisa editar para mudar conteúdo.
   Nunca mexa no código das seções para adicionar foto ou marco novo.
   Todas as datas no formato AAAA-MM-DD.
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. Vocês dois — aparece na tela de entrada
   -------------------------------------------------------------------------- */
const casal = {
  nomeA: "Amanda Letícia",
  nomeB: "João Vitor",
  frase: "Um cantinho na internet só nosso, para guardar o que a gente já viveu."
};

/* --------------------------------------------------------------------------
   1b. A abertura — a primeira seção depois do clique no "Entrar"

   "recado" é a frase grande lá no alto. "dica" é o empurrãozinho para ela
   rolar (deixe em "" para esconder a setinha).

   "video" é o identificador da mídia do abraço, sem pasta e sem extensão,
   igual ao resto do site: o .mp4 mora em assets/fotos/. Deixar vazio faz a
   seção ficar só com o recado, sem quadro nenhum.

   "mascara" escolhe como a mídia é revelada ao rolar. As seis:
     "iris"     círculo abrindo do centro       "slats"   faixas horizontais
     "wipe"     varredura em diagonal           "grid"    grade florescendo
     "curtain"  cortinas abrindo do meio        "type"    a palavra virando janela
   Para afinar cada uma (pluma, zoom, atraso, colunas...), o painel é o
   PADRAO no topo de js/scroll-mask.js.
   -------------------------------------------------------------------------- */
const abertura = {
  recado: "Aumenta o volume, mor!",
  dica: "role para baixo",

  /* >>> TROCAR pelo vídeo do abraço quando o arquivo chegar. <<<
     Por enquanto aponta para o vídeo que já existe, só para o efeito poder
     ser visto e testado. Salve o novo como assets/fotos/video-002.mp4,
     escreva "video-002" aqui e acrescente o mesmo id na lista `fotos`
     abaixo se você também quiser ele na galeria. */
  video: "video-002",
  descricao: "O nosso abraço",

  mascara: "iris",

  /* a palavra que vira janela — só a máscara "type" usa; as outras ignoram */
  palavra: "ABRAÇO",

  /* O bilhetinho que aparece POR CIMA do vídeo assim que ele começa a tocar e
     some sozinho depois. Cada item da lista é uma linha; a primeira sai maior.
     Lista vazia ([]) desliga o aviso, e "avisoSegundos" é quanto tempo ele
     fica na tela antes de desaparecer. */
  aviso: [
    "Alguns vídeos ficaram cortados rs",
    "Mas tudo foi feito com muito amor e carinho!"
  ],
  avisoSegundos: 5
};

/* --------------------------------------------------------------------------
   2. Todas as mídias, na ordem em que aparecem na galeria.

   Use só o identificador (sem pasta e sem extensão) — o código monta sozinho
   o caminho da miniatura e o da imagem grande.

   Para adicionar uma foto nova:
     a) salve o arquivo como assets/fotos/foto-083.jpg (lado maior ~1600px)
     b) salve a miniatura como assets/fotos/thumbs/foto-083.jpg (~500px)
     c) acrescente "foto-083" nesta lista
   Vídeos entram como "video-002" e por diante, com o .mp4 em assets/fotos/.
   -------------------------------------------------------------------------- */
const fotos = [
  "foto-001", "foto-002", "foto-003", "foto-004", "foto-005", "foto-006",
  "foto-007", "foto-008", "foto-009", "foto-010", "foto-011", "foto-012",
  "foto-013", "foto-014", "foto-015", "foto-016", "foto-017", "foto-018",
  "foto-019", "foto-020", "foto-021", "foto-022", "foto-023", "foto-024",
  "foto-025", "foto-026", "foto-027", "foto-028", "foto-029", "foto-030",
  "foto-031", "foto-032", "foto-033", "foto-034", "foto-035", "foto-036",
  "foto-037", "foto-038", "foto-039", "foto-040", "foto-041", "foto-042",
  "foto-043", "foto-044", "foto-045", "foto-046", "foto-047", "foto-048",
  "foto-049", "foto-050", "foto-051", "foto-052", "foto-053", "foto-054",
  "foto-055", "foto-056", "foto-057", "foto-058", "foto-059", "foto-060",
  "foto-061", "foto-062", "foto-063", "foto-064", "foto-065", "foto-066",
  "foto-067", "foto-068", "foto-069", "foto-070", "foto-071", "foto-072",
  "foto-073", "foto-074", "foto-075", "foto-076", "foto-077", "foto-078",
  "foto-079", "foto-080", "foto-081", "foto-082", "foto-083", "foto-084",
  "foto-085", "foto-086", "foto-087", "foto-088", "foto-089", "foto-090",
  "foto-091", "foto-092", "foto-093", "foto-094", "foto-095", "foto-096",
  "foto-097", "foto-098", "foto-099", "foto-100", "foto-101", "foto-102",
  "foto-103", "foto-104", "foto-105", "foto-106", "foto-107", "foto-108",
  "foto-109", "foto-110", "foto-111", "foto-112", "foto-113", "foto-114",
  "foto-115", "foto-116", "foto-117", "foto-118", "foto-119", "foto-120",
  "foto-121", "video-001", "video-003", "video-004"
];

/* --------------------------------------------------------------------------
   3. Quais fotos são de quais dias — é isso que acende o calendário.

   Um dia só fica destacado e clicável se tiver uma chave aqui. Os nomes são
   os MESMOS da lista de cima: nada é copiado nem movido de pasta, você só
   diz "esta foto é deste dia".

   >>> ATENÇÃO: os dois dias abaixo estão com fotos de EXEMPLO. <<<
   As fotos vieram do WhatsApp sem data (o EXIF foi apagado no envio), então
   não há como adivinhar de que dia cada uma é. Troque pelos identificadores
   certos — e vá acrescentando os outros dias com calma, um de cada vez.
   -------------------------------------------------------------------------- */
const fotosPorDia = {
  "2024-10-13": ["foto-092"],
  "2024-10-18": ["foto-093", "foto-094"],
  "2025-04-18": ["foto-083"],
  "2025-10-13": ["foto-084"],
  "2025-10-26": ["foto-085"],
  "2025-12-15": ["foto-086"],
  "2025-12-25": ["foto-087", "foto-088"],
  "2025-12-26": ["foto-089"],
  "2025-12-31": [
    "foto-001", "foto-002", "foto-003", "foto-090",
    "foto-091"
  ],
  "2026-01-05": ["foto-096"],
  "2026-01-08": ["foto-099"],
  "2026-01-09": ["foto-007", "foto-097", "foto-100", "foto-101"],
  "2026-01-10": ["foto-098", "foto-102"],
  "2026-02-07": ["foto-004", "foto-005", "foto-006"],
  "2026-02-13": ["foto-103"],
  "2026-02-14": ["foto-104"],
  "2026-03-13": ["foto-106"],
  "2026-03-14": ["foto-105"],
  "2026-03-27": ["foto-121", "video-004"],
  "2026-04-05": ["foto-010"],
  "2026-04-10": ["foto-107"],
  "2026-04-12": ["foto-008", "foto-009", "foto-108", "foto-109"],
  "2026-04-20": ["foto-013"],
  "2026-05-03": ["foto-011"],
  "2026-05-09": ["foto-012"],
  "2026-05-16": [
    "foto-014", "foto-015", "foto-110", "foto-111",
    "foto-112"
  ],
  "2026-05-22": ["foto-113", "foto-114"],
  "2026-05-29": [
    "foto-017", "foto-018", "foto-019", "foto-021",
    "foto-023", "foto-025", "foto-026", "foto-027",
    "foto-028", "foto-029", "foto-095"
  ],
  "2026-05-30": ["foto-016", "foto-020", "foto-022", "foto-024"],
  "2026-06-04": ["foto-115"],
  "2026-06-05": [
    "foto-030", "foto-031", "foto-032", "foto-033",
    "foto-034", "foto-035", "foto-036", "foto-037",
    "foto-038", "foto-039", "foto-040", "foto-041",
    "foto-042", "foto-045"
  ],
  "2026-06-06": ["foto-043", "foto-044"],
  "2026-06-13": ["foto-046", "foto-047", "foto-051", "foto-053"],
  "2026-06-14": ["foto-048", "foto-049", "foto-070", "foto-071"],
  "2026-06-19": ["foto-050"],
  "2026-06-28": [
    "foto-052", "foto-054", "foto-055", "foto-056",
    "foto-057", "foto-058", "foto-116"
  ],
  "2026-07-03": ["foto-059", "foto-060", "foto-061"],
  "2026-07-05": [
    "foto-062", "foto-063", "foto-064", "foto-065",
    "foto-066", "foto-067", "foto-069"
  ],
  "2026-07-06": ["foto-068"],
  "2026-07-07": ["foto-073"],
  "2026-07-17": ["foto-072", "foto-074", "foto-075", "foto-076"],
  "2026-07-18": ["foto-077", "foto-079"],
  "2026-07-22": [
    "foto-078", "foto-080", "foto-081", "foto-082",
    "video-001"
  ],
  "2026-07-26": ["foto-117"],
  "2026-08-06": ["foto-118"],
  "2026-08-15": ["foto-119"],
  "2026-08-19": ["foto-120", "video-003"]
};

/* --------------------------------------------------------------------------
   3b. O recado de cada dia — o que você escreveria no verso da foto.

   Um dia que tenha frase aqui também acende no calendário, MESMO SEM FOTO:
   é assim que entram os dias de que não sobrou imagem nenhuma. Se o dia tiver
   foto, a frase vira a legenda dela; se não tiver, ela aparece sozinha logo
   abaixo do calendário.

   As chaves são as mesmas do `fotosPorDia` — AAAA-MM-DD.
   -------------------------------------------------------------------------- */
const frasesPorDia = {
  "2024-09-18": "Nosso primeiro contato no Viva Unisc, dia que te conheci pessoalmente.",
  "2024-10-06": "Nossas primeiras mensagens. Período sensível, mas as primeiras ações.",
  "2024-10-13": "Nossa primeira foto juntos.",
  "2024-10-18": "Primeira vez comendo red.",
  "2025-04-18": "Dia do sushi. Já não tinha mais a incerteza de sair da cidade e minha esperança reacendeu.",
  "2025-10-13": "Dia especial voltando a nos falar, e encontrei essa foto na galeria.",
  "2025-10-26": "Baita dia de Oktober, lembra dessa foto?",
  "2025-12-15": "Dia de piscina.",
  "2025-12-25": "Merry Christmas!",
  "2025-12-26": "Festa pré-praia e o melhor expediente não remunerado que já tive.",
  "2025-12-31": "A virada de chave: o brinde que abriu 2026 com você do meu lado.",
  "2026-02-07": "Muito bom passar toda e qualquer data contigo",
  "2026-02-13": "Primeira viagem dirigindo e tu do meu lado",
  "2026-03-13": "Manda pra elas seu fdp",
  "2026-03-27": "Dia muito especial para mim, um dos dias mais felizes da minha vida",
  "2026-04-10": "jetzt geht's los uuuniããããooo corinthiaaannss jetzt geht's los",
  "2026-04-12": "E é fia da puta esse nosso cupido",
  "2026-05-16": "Eu todo bobo do primeiro evento na tua família",
  "2026-05-22": "O dia em que a gente parou de enrolar e virou namoro de verdade.",
  "2026-06-04": "Nossa primeira viagem sozinhos juntos",
  "2026-06-28": "Nem ia ter graça assistir o Brasil sem tua companhia"
};

/* --------------------------------------------------------------------------
   4. Os marcos da timeline.
   "foto" é opcional — se não quiser imagem no marco, apague a linha.

   "destaque: true" também é opcional: o marco vira o cartão cromático, com
   a borda girando e o brilho colorido seguindo o dedo. É para UM marco só —
   se todos brilharem, nenhum brilha.

   "corte: true" é o outro opcional: o marco sai de um dos lados e atravessa a
   timeline inteira, cortando o caule em dois, com o título feito de partículas.
   Também é para UM marco só, pelo mesmo motivo.
   -------------------------------------------------------------------------- */
const timeline = [
  {
    data: "2024-09-18",
    titulo: "O primeiro contato",
    descricao: "Nosso primeiro contato no Viva Unisc, dia que te conheci pessoalmente."
  },
  {
    data: "2024-10-06",
    titulo: "As primeiras mensagens",
    descricao: "Período sensível, mas as primeiras ações."
  },
  {
    data: "2024-10-13",
    titulo: "A primeira foto juntos",
    foto: "foto-092"
  },
  {
    data: "2024-10-18",
    titulo: "O primeiro red rs",
    descricao: "Eu gosto muito desse dia e dessas fotos.",
    foto: "foto-093"
  },
  {
    data: "2025-04-18",
    titulo: "O dia do sushi",
    descricao: "Já não tinha mais a incerteza de sair da cidade e minha esperança reacendeu.",
    foto: "foto-083"
  },
  {
    data: "2025-10-13",
    titulo: "Voltamos a nos falar",
    descricao: "Dia especial voltando a nos falar, e encontrei essa foto na galeria.",
    foto: "foto-084"
  },
  {
    data: "2025-10-26",
    titulo: "Oktoberfest",
    descricao: "Baita dia de Oktober, lembra dessa foto?",
    foto: "foto-085"
  },
  {
    data: "2025-12-15",
    titulo: "Dia de piscina",
    foto: "foto-086"
  },
  {
    data: "2025-12-25",
    titulo: "Merry Christmas!",
    foto: "foto-087"
  },
  {
    data: "2025-12-26",
    titulo: "Festa pré-praia",
    descricao: "A festa pré-praia e o melhor expediente não remunerado que já tive.",
    foto: "foto-089"
  },
  {
    data: "2025-12-31",
    titulo: "Finalmente Praia!",
    descricao: "O brinde que abriu 2026. Depois desse dia, a gente não se desgrudou mais.",
    foto: "foto-002",
    destaque: true,
    corte: true
  },
  {
    data: "2026-01-05",
    titulo: "Praia com minha família",
    descricao: "Uma semaninha de farra e uma semaninha de descanso.",
    foto: "foto-096"
  },
  {
    data: "2026-02-07",
    titulo: "O carnaval!",
    descricao: "Muito bom passar toda e qualquer data contigo",
    foto: "foto-004"
  },
  {
    data: "2026-02-13",
    titulo: "Viagem pra barragem",
    descricao: "Primeira viagem dirigindo e tu do meu lado",
    foto: "foto-103"
  },
  {
    data: "2026-03-13",
    titulo: "DJ MU540",
    descricao: "Manda pra elas seu fdp",
    foto: "foto-106"
  },
  {
    /* atravessa a timeline e o título vira partículas, como o 31/12 e o 22/05,
       mas sem `destaque`: a foto aparece como foto mesmo, inteira e no ratio
       dela — o CSS do marco de corte não recorta em 4/3 como os comuns. */
    data: "2026-03-27",
    titulo: "A Virada de Chave",
    descricao: "Dia muito especial para mim, um dos dias mais felizes da minha vida",
    foto: "foto-121",
    destaque: true,
    corte: true,
  },
  {
    data: "2026-04-10",
    titulo: "Muitos jogos do União Continthians",
    descricao: "jetzt geht's los uuuniããããooo corinthiaaannss jetzt geht's los",
    foto: "foto-107"
  },
  {
    data: "2026-04-12",
    titulo: "Despedida do Berno",
    descricao: "E é fia da puta esse nosso cupido",
    foto: "foto-108"
  },
  {
    data: "2026-05-16",
    titulo: "Aniversário da tua mãe",
    descricao: "Eu todo bobo do primeiro evento na tua família",
    foto: "foto-111"
  },
  {
    data: "2026-05-22",
    titulo: "O Grande Dia",
    descricao: "Melhor sensação do mundo foi te entregar aquele buque e passar a noite na frente da lareira assistindo got.",
    foto: "foto-114",
    destaque: true,
    corte: true,
  },
  {
    data: "2026-06-04",
    titulo: "Viagem pra Serra",
    descricao: "Nossa primeira viagem sozinhos juntos",
    foto: "foto-115"
  },
  {
    data: "2026-06-28",
    titulo: "Copa do Mundo 2026",
    descricao: "Nem ia ter graça assistir o Brasil sem tua companhia",
    foto: "foto-116"
  },
  {
    data: "2026-07-26",
    titulo: "Dias de Canastra",
    descricao: "Nossos dias de canastra sempre reforçam meu amor por ti!",
    foto: "foto-117"
  },
  {
    data: "2026-08-06",
    titulo: "Neny Remoto",
    descricao: "Se Moisés não vai até o Neny, o Neny vai até Moisés.",
    foto: "foto-118"
  },
  {
    data: "2026-08-15",
    titulo: "O tempo contigo",
    descricao: "Final de semana passado sempre reforçando o quanto eu amo dormir, acordar...",
    foto: "foto-119"
  },
  {
    data: "2026-08-19",
    titulo: "Hoje",
    /* os asteriscos viram o destaque dourado — quem os lê é o
       montarDescricao() do js/timeline.js */
    descricao: "...jantar, almoçar, tomar café, ir pra faculdade, treinar, home office, beber, cantar, dançar. Tudo reforça o quanto *Te amo*!",
    foto: "foto-120"
  }
  // Novo marco? É só copiar um bloco acima e mudar os campos.
];

/* --------------------------------------------------------------------------
   5. A trilha do celular.

   No computador quem toca é o player do Spotify. No celular ele não pode
   (o navegador recusa dar play num iframe de outro domínio), então a página
   toca UMA destas músicas em loop.

   A ORDEM IMPORTA: a PRIMEIRA da lista é sempre a que começa no clique do
   "Entrar". As outras continuam aqui, ao alcance das setinhas da barra. Para
   trocar a música de abertura, é só subir o bloco dela para o topo.

   "arquivo" é só o nome, sem pasta e sem extensão — o .mp3 mora em
   assets/audio/. "titulo" e "artista" são o que aparece na barra do topo.

   Para trocar uma música:
     a) salve o MP3 como assets/audio/musica-004.mp3 (siga a numeração)
     b) acrescente um bloco aqui com o nome do arquivo, o título e o artista
   -------------------------------------------------------------------------- */
const trilha = [
  /* a que abre a página */
  { arquivo: "musica-003", titulo: "Mystery of Love",                   artista: "Sufjan Stevens" },

  { arquivo: "musica-001", titulo: "Todo o Amor Que Houver Nessa Vida", artista: "Cazuza" },
  { arquivo: "musica-002", titulo: "Um Girassol da Cor do Seu Cabelo",  artista: "Lô Borges" }
];
