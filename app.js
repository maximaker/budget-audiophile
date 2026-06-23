/* ============================================================
   The Budget Audiophile — application logic
   Faceted database: search · category · price · sound · sort,
   gallery ⇄ list views, and a detail modal. Vanilla DOM.
   ============================================================ */

/* ---------- per-category SVG illustrations (fallback only) ---------- */
const ART = {
  iems: (c) => `
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M48 30c14-6 30 2 32 20 1 10-4 16-10 22-5 5-6 12-13 12-9 0-16-7-18-17-3-15-3-31 9-37Z" fill="${c.fill}" stroke="${c.ink}" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="58" cy="52" r="9" fill="${c.accent}"/>
      <path d="M70 70c10 4 18 14 18 28" stroke="${c.ink}" stroke-width="4" stroke-linecap="round"/>
      <path d="M84 30 96 22" stroke="${c.ink}" stroke-width="4" stroke-linecap="round"/>
    </svg>`,
  headphones: (c) => `
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 70V58a38 38 0 0 1 76 0v12" stroke="${c.ink}" stroke-width="4" stroke-linecap="round"/>
      <rect x="14" y="64" width="20" height="34" rx="9" fill="${c.fill}" stroke="${c.ink}" stroke-width="4"/>
      <rect x="86" y="64" width="20" height="34" rx="9" fill="${c.fill}" stroke="${c.ink}" stroke-width="4"/>
      <rect x="18" y="70" width="12" height="22" rx="5" fill="${c.accent}"/>
      <rect x="90" y="70" width="12" height="22" rx="5" fill="${c.accent}"/>
    </svg>`,
  dacamp: (c) => `
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="16" y="40" width="88" height="48" rx="8" fill="${c.fill}" stroke="${c.ink}" stroke-width="4"/>
      <circle cx="38" cy="64" r="13" fill="none" stroke="${c.ink}" stroke-width="4"/>
      <path d="M38 64 38 55" stroke="${c.accent}" stroke-width="4" stroke-linecap="round"/>
      <rect x="64" y="56" width="28" height="5" rx="2.5" fill="${c.ink}"/>
      <rect x="64" y="68" width="20" height="5" rx="2.5" fill="${c.accent}"/>
    </svg>`,
  speakers: (c) => `
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="34" y="16" width="52" height="88" rx="9" fill="${c.fill}" stroke="${c.ink}" stroke-width="4"/>
      <circle cx="60" cy="74" r="17" fill="none" stroke="${c.ink}" stroke-width="4"/>
      <circle cx="60" cy="74" r="6" fill="${c.accent}"/>
      <circle cx="60" cy="34" r="7" fill="none" stroke="${c.ink}" stroke-width="4"/>
    </svg>`,
  turntables: (c) => `
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="16" y="34" width="88" height="56" rx="8" fill="${c.fill}" stroke="${c.ink}" stroke-width="4"/>
      <circle cx="54" cy="62" r="22" fill="none" stroke="${c.ink}" stroke-width="4"/>
      <circle cx="54" cy="62" r="5" fill="${c.accent}"/>
      <path d="M88 44 70 70" stroke="${c.ink}" stroke-width="4" stroke-linecap="round"/>
      <circle cx="88" cy="44" r="4" fill="${c.accent}"/>
    </svg>`,
  players: (c) => `
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="37" y="12" width="46" height="96" rx="11" fill="${c.fill}" stroke="${c.ink}" stroke-width="4"/>
      <rect x="46" y="22" width="28" height="38" rx="4" fill="${c.accent}" opacity="0.22" stroke="${c.ink}" stroke-width="3"/>
      <circle cx="60" cy="84" r="12" fill="none" stroke="${c.ink}" stroke-width="4"/>
      <circle cx="60" cy="84" r="3.5" fill="${c.accent}"/>
    </svg>`,
};

/* uniform neutral product tile (monochrome — products carry the colour) */
const NEUTRAL_TINT = { fill: "#E7E7E4", ink: "#585858", accent: "#2A2A2A", bg: "linear-gradient(160deg,#F4F4F3,#FFFFFF)" };
const TINTS = {
  iems: NEUTRAL_TINT, headphones: NEUTRAL_TINT, dacamp: NEUTRAL_TINT,
  speakers: NEUTRAL_TINT, turntables: NEUTRAL_TINT, players: NEUTRAL_TINT,
};

const catLabel = (id) => (CATEGORIES.find((c) => c.id === id) || {}).label || id;
const fmtPrice = (n) => "$" + n.toLocaleString("en-US");

/* recent rising-star arrivals — flagged with a "New" marker */
const FRESH = new Set(["daybreak", "portazo", "aful-explorer", "supermix4", "ft1-pro", "snowsky-melody", "aiyima-a07max", "hd505", "qx13", "wiim-ultra", "echo-mini"]);

/* aspirational halo picks that stretch the budget framing */
const STRETCH = new Set(["wiim-ultra", "qx13"]);

/* highest-rated piece in each category (tie-break: more ratings) → "Top pick" */
const TOP_PICKS = (() => {
  const best = {};
  PRODUCTS.forEach((p) => {
    const c = best[p.category];
    if (!c || p.rating > c.rating || (p.rating === c.rating && p.ratingCount > c.ratingCount)) best[p.category] = p;
  });
  const out = {};
  Object.keys(best).forEach((k) => (out[k] = best[k].id));
  return out;
})();
const isTopPick = (p) => TOP_PICKS[p.category] === p.id;

/* ============================================================
   Enhancement data: genre fit · sound profile · glossary ·
   pairings · starter systems · value score
   ============================================================ */

/* --- genre / music fit (editorial heuristic from tuning) --- */
const GENRES = [
  { id: "vocal", label: "Vocals & Pop" },
  { id: "jazz", label: "Jazz & Acoustic" },
  { id: "bass", label: "Hip-hop & EDM" },
  { id: "rock", label: "Rock & Metal" },
  { id: "classical", label: "Classical" },
];
const GENRE_LABEL = Object.fromEntries(GENRES.map((g) => [g.id, g.label]));
const TRANSDUCERS = new Set(["iems", "headphones", "speakers"]);
const _genreCache = {};
function genresFor(p) {
  if (_genreCache[p.id]) return _genreCache[p.id];
  let out;
  if (!TRANSDUCERS.has(p.category)) {
    out = GENRES.map((g) => g.id); // sources are genre-agnostic
  } else {
    const s = (p.signature + " " + p.type + " " + p.tags.join(" ")).toLowerCase();
    const set = new Set();
    if (/warm/.test(s)) { set.add("vocal"); set.add("jazz"); set.add("rock"); }
    if (/neutral|reference|natural/.test(s)) { set.add("jazz"); set.add("classical"); set.add("vocal"); }
    if (/harman|balanced|smooth/.test(s)) { set.add("vocal"); set.add("bass"); }
    if (/bright|airy|detailed|planar|spacious/.test(s)) { set.add("classical"); set.add("jazz"); }
    if (/bass|v-shaped|w-shaped|punchy|powerful|fun|energetic/.test(s)) { set.add("bass"); set.add("rock"); }
    if (set.size === 0) { set.add("vocal"); set.add("jazz"); }
    out = [...set];
  }
  _genreCache[p.id] = out;
  return out;
}

/* --- sound profile bars (transducers only) --- */
function profileFor(p) {
  const s = (p.signature + " " + p.tags.join(" ")).toLowerCase();
  let bass = 3, mids = 3, treble = 3, detail = 3, comfort = 3;
  if (/warm/.test(s)) { bass += 1; treble -= 1; mids += 0.5; }
  if (/bright|airy/.test(s)) { treble += 1.5; bass -= 1; }
  if (/neutral|reference/.test(s)) { detail += 1; bass -= 0.3; }
  if (/bass|v-shaped|w-shaped|punchy|powerful/.test(s)) { bass += 2; mids -= 0.5; }
  if (/harman|balanced/.test(s)) { bass += 0.7; }
  if (/planar/.test(s)) { detail += 1; bass += 0.5; treble += 0.3; }
  if (/spacious|wide-stage/.test(s)) { detail += 0.5; }
  detail += (p.rating - 4.4) * 2;
  if (p.tags.includes("comfortable") || /open-back/.test(p.type)) comfort += 1;
  if (/closed-back/.test(p.type)) comfort -= 0.3;
  const c = (v) => Math.max(1, Math.min(5, Math.round(v * 2) / 2));
  return [["Bass", c(bass)], ["Mids", c(mids)], ["Treble", c(treble)], ["Detail", c(detail)], ["Comfort", c(comfort)]];
}

/* --- plain-English glossary, applied inline to jargon --- */
const GLOSSARY = {
  Harman: "A research-based target tuning many listeners prefer — gentle bass lift, even mids, controlled treble.",
  Neutral: "Tuning that adds little colour of its own — faithful to the recording.",
  Reference: "Studio-accurate, uncoloured sound used as a benchmark.",
  Warm: "A gentle lift in bass/lower-mids that flatters voices and feels smooth.",
  Bright: "Extra treble energy — crisp and airy, but can fatigue some listeners.",
  Planar: "A planar-magnetic driver: a flat diaphragm giving fast, low-distortion, textured sound.",
  Hybrid: "An IEM combining driver types (e.g. dynamic + balanced armature).",
  Tribrid: "An IEM with three driver types in one shell.",
  "Open-back": "Earcups vented to the air — a bigger, airier stage, but they leak sound.",
  "Closed-back": "Sealed earcups — better isolation and bass, a smaller stage.",
  Balanced: "A 4.4mm connection sending each channel on its own wires — often more power, lower noise.",
  soundstage: "The perceived sense of space and width in the sound.",
  DAC: "Digital-to-analogue converter — turns digital files into the signal your headphones need.",
};
const _glossRe = new RegExp(
  "\\b(" + Object.keys(GLOSSARY).sort((a, b) => b.length - a.length).map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")\\b",
  "gi"
);
function glossarize(text) {
  const seen = new Set();
  return text.replace(_glossRe, (m) => {
    const key = Object.keys(GLOSSARY).find((k) => k.toLowerCase() === m.toLowerCase());
    if (!key || seen.has(key)) return m; // define each term once per string
    seen.add(key);
    return `<span class="term" tabindex="0" data-def="${GLOSSARY[key].replace(/"/g, "&quot;")}">${m}</span>`;
  });
}

/* --- "pairs well with" synergy map (curated) --- */
const PAIRINGS = {
  hd6xx: ["fosi-k7", "qudelix5k"], hd560s: ["qudelix5k", "apple-dongle"], dt770: ["fosi-k7", "snowsky-melody"],
  shp9500: ["snowsky-melody", "apple-dongle"], hd505: ["snowsky-melody", "qudelix5k"], "ft1-pro": ["fosi-k7", "qx13"],
  zero2: ["apple-dongle", "snowsky-melody"], "tanchjim-one": ["apple-dongle", "dawn-pro"], ew200: ["snowsky-melody", "dawn-pro"],
  cadenza2: ["dawn-pro", "qudelix5k"], zerored: ["dawn-pro", "qudelix5k"], "artti-t10": ["qudelix5k", "fosi-k7"],
  hexa: ["dawn-pro", "qudelix5k"], nova: ["qudelix5k", "qx13"], daybreak: ["qudelix5k", "qx13"], portazo: ["dawn-pro", "qudelix5k"],
  "aful-explorer": ["dawn-pro", "snowsky-melody"], supermix4: ["qudelix5k", "dawn-pro"],
  "fosi-k7": ["hd6xx", "ft1-pro"], qudelix5k: ["zerored", "hexa"], "dawn-pro": ["ew200", "hexa"], "epz-tp35": ["zerored", "aful-explorer"],
  "snowsky-melody": ["zero2", "ew200"], "snowsky-nano": ["zero2", "cadenza2"], "apple-dongle": ["zero2", "tanchjim-one"],
  qx13: ["nova", "ft1-pro"], "fosi-za3": ["q1meta", "diamond121"], "aiyima-a07max": ["diamond121", "q1meta"], "wiim-ultra": ["q1meta", "diamond121"],
  q1meta: ["fosi-za3", "wiim-ultra"], diamond121: ["fosi-za3", "aiyima-a07max"], r1280t: ["rt81", "lp60x"],
  rt81: ["r1280t", "fosi-za3"], lp60x: ["r1280t", "echo-mini"], "echo-mini": ["zero2", "ew200"],
};
function pairsFor(p) {
  const ids = PAIRINGS[p.id] || (TRANSDUCERS.has(p.category) ? ["qudelix5k", "dawn-pro"] : ["hexa", "zero2"]);
  return ids.map((id) => PRODUCTS.find((x) => x.id === id)).filter(Boolean).filter((x) => x.id !== p.id);
}

/* --- starter systems (curated bundles) --- */
const STARTER_SYSTEMS = [
  { id: "pocket-hifi", name: "Pocket hi-fi", tag: "On the go", items: ["ew200", "snowsky-melody"],
    blurb: "A musical IEM and a wood-bodied balanced dongle — serious sound in a coat pocket.",
    about: "Everything you need to carry a real hi-fi signature out the door. Plug the dongle into any phone or laptop, slot in the IEMs, and you're listening to a clean, musical sound that costs less than a pair of mainstream wireless earbuds — and keeps the cable-free convenience of Bluetooth as a bonus." },
  { id: "desktop-starter", name: "The desktop starter", tag: "At the desk", items: ["hd6xx", "fosi-k7"],
    blurb: "The classic open-back and a do-it-all desktop amp with power to spare.",
    about: "The canonical introduction to a 'big', open headphone sound at a desk. The amp gives the open-back the clean power it craves, while its DAC, Bluetooth and tone controls cover every source. It's the setup people buy once and keep for years." },
  { id: "first-real-speakers", name: "First real speakers", tag: "For the room", items: ["q1meta", "fosi-za3"],
    blurb: "KEF's coaxial magic, driven by the internet's favourite budget amp.",
    about: "A genuine two-channel system for a room, on a budget. The tiny TPA3255 amp drives KEF's coaxial bookshelf speakers with surprising authority — add any source (phone, laptop, or a turntable) and you have proper stereo imaging that belies the price. Mind the power supply on the amp; it matters." },
  { id: "vinyl-from-scratch", name: "Vinyl from scratch", tag: "Spin records", items: ["rt81", "r1280t"],
    blurb: "An upgradeable belt-drive deck into powered speakers — plug in and drop the needle.",
    about: "Records from a standing start, no separates required. The belt-drive deck has a switchable built-in preamp, so it plugs straight into the powered speakers — drop the needle and go. As you catch the bug, switch the preamp off and add a better one, or upgrade the cartridge." },
];
const systemBySlug = (slug) => STARTER_SYSTEMS.find((s) => s.id === slug);
const ROLE_LABEL = { iems: "In-ear monitors", headphones: "Headphones", dacamp: "Source & amp", players: "Player", speakers: "Speakers", turntables: "Turntable" };

/* --- value score (rating per dollar, gently) --- */
const valueScore = (p) => p.rating / Math.pow(p.price, 0.4);

/* ---------- small svg helpers ---------- */
function stars(rating) {
  let out = "";
  for (let i = 1; i <= 5; i++) {
    const half = rating >= i - 0.5 && rating < i;
    const cls = rating < i - 0.5 ? "empty" : "";
    if (half) {
      out += `<svg width="14" height="14" viewBox="0 0 24 24"><defs><linearGradient id="h${i}"><stop offset="50%" stop-color="currentColor"/><stop offset="50%" stop-color="#D6C9B4"/></linearGradient></defs><path fill="url(#h${i})" d="M12 2l2.9 6.3 6.9.7-5.1 4.7 1.4 6.8L12 17.8 5.9 20.5l1.4-6.8L2.2 9l6.9-.7z"/></svg>`;
    } else {
      out += `<svg class="${cls}" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.3 6.9.7-5.1 4.7 1.4 6.8L12 17.8 5.9 20.5l1.4-6.8L2.2 9l6.9-.7z"/></svg>`;
    }
  }
  return `<span class="stars">${out}</span>`;
}
const eqGlyph = () =>
  `<svg class="eq" width="15" height="13" viewBox="0 0 16 14" aria-hidden="true"><rect x="0" y="5" width="2.6" height="9" rx="1.3"/><rect x="4.5" y="1" width="2.6" height="13" rx="1.3"/><rect x="9" y="7" width="2.6" height="7" rx="1.3"/><rect x="13.4" y="3" width="2.6" height="11" rx="1.3"/></svg>`;

/* ---------- dotted rating gauge (functional, SVG) ---------- */
function dotGauge(value, max) {
  const cx = 80, cy = 80, N = 44, filled = Math.round((value / max) * N);
  let d = "";
  for (let i = 0; i < 30; i++) {               // faint inner texture
    const a = (i / 30) * Math.PI * 2;
    d += `<circle cx="${(cx + Math.cos(a) * 50).toFixed(1)}" cy="${(cy + Math.sin(a) * 50).toFixed(1)}" r="1.5" fill="var(--line-2)" opacity=".55"/>`;
  }
  for (let i = 0; i < N; i++) {                 // main gauge ring (from top, clockwise)
    const a = -Math.PI / 2 + (i / N) * Math.PI * 2;
    const on = i < filled;
    d += `<circle cx="${(cx + Math.cos(a) * 68).toFixed(1)}" cy="${(cy + Math.sin(a) * 68).toFixed(1)}" r="${on ? 3.4 : 2.4}" fill="${on ? "var(--ember)" : "var(--line-2)"}"/>`;
  }
  return `<svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">${d}</svg>`;
}

/* ---------- synthetic community comments (deterministic) ---------- */
const COMMENT_POOL = [
  { n: "audio_otter", t: "Picked these up on a recommendation and haven't looked back. Genuinely surprised at the price.", s: 5, w: "2 weeks ago" },
  { n: "FletcherM", t: "Solid pick for the money. Took a few days to settle in but now I get the hype.", s: 4, w: "1 month ago" },
  { n: "quietloud", t: "Pairs beautifully with a clean source. EQ'd slightly and it's near-perfect for me.", s: 5, w: "3 months ago" },
  { n: "dawn.patrol", t: "Good, not magic. Worth it at the price but manage your expectations on the extremes.", s: 4, w: "6 weeks ago" },
  { n: "vinyl_vera", t: "My third piece from this brand. Consistent house sound and reliable build.", s: 5, w: "2 months ago" },
  { n: "ohmmeter", t: "Measurements line up with what I hear. No notes — does exactly what it says.", s: 5, w: "5 days ago" },
];
function commentsFor(p) {
  const seed = p.id.split("").reduce((a, ch) => a + ch.charCodeAt(0), 0);
  return [COMMENT_POOL[seed % COMMENT_POOL.length], COMMENT_POOL[(seed + 3) % COMMENT_POOL.length]];
}
const AVATAR_COLORS = ["#BF5230", "#3C6152", "#3F5874", "#C2882B", "#9C5670"];

/* ---------- facet definitions ---------- */
const PRICE_BANDS = [
  { id: "all", label: "Any price", test: () => true },
  { id: "0-30", label: "Under $30", test: (p) => p.price < 30 },
  { id: "30-100", label: "$30 – $100", test: (p) => p.price >= 30 && p.price < 100 },
  { id: "100-200", label: "$100 – $200", test: (p) => p.price >= 100 && p.price < 200 },
  { id: "200-9999", label: "$200 +", test: (p) => p.price >= 200 },
];
const SOUND_FILTERS = [
  { id: "neutral", label: "Neutral", test: (p) => /neutral|reference/i.test(p.signature) || p.tags.includes("neutral") || p.tags.includes("reference") },
  { id: "warm", label: "Warm", test: (p) => /warm/i.test(p.signature) || p.tags.includes("warm") },
  { id: "harman", label: "Harman", test: (p) => /harman|balanced/i.test(p.signature) || p.tags.includes("harman") || p.tags.includes("balanced") },
  { id: "bright", label: "Bright", test: (p) => /bright|airy/i.test(p.signature) || p.tags.includes("bright") || p.tags.includes("spacious") },
  { id: "bass", label: "Bassy / V", test: (p) => /bass|v-shaped|w-shaped|punchy|powerful/i.test(p.signature) || p.tags.includes("bass") },
  { id: "planar", label: "Planar", test: (p) => /planar/i.test(p.type) || p.tags.includes("planar") },
];

/* category-specific "type" facets — the options that appear once a
   product category is chosen. Heading + options adapt per category. */
const TYPE_HEADING = { iems: "Driver", headphones: "Design", dacamp: "Form factor", speakers: "Type", turntables: "Operation", players: "Type" };
const TYPE_FACETS = {
  iems: [
    { id: "single", label: "Single DD", test: (p) => /single/i.test(p.type) },
    { id: "dual", label: "Dual DD", test: (p) => /dual dd/i.test(p.type) },
    { id: "hybrid", label: "Hybrid", test: (p) => /hybrid/i.test(p.type) },
    { id: "tribrid", label: "Tribrid", test: (p) => /tribrid/i.test(p.type) },
    { id: "planar", label: "Planar", test: (p) => /planar/i.test(p.type) },
  ],
  headphones: [
    { id: "open", label: "Open-back", test: (p) => /open-back/i.test(p.type) },
    { id: "closed", label: "Closed-back", test: (p) => /closed-back/i.test(p.type) },
  ],
  dacamp: [
    { id: "dongle", label: "Dongle", test: (p) => /dongle/i.test(p.type) },
    { id: "bluetooth", label: "Bluetooth", test: (p) => /bluetooth/i.test(p.type) },
    { id: "desktop", label: "Desktop", test: (p) => /desktop/i.test(p.type) },
    { id: "poweramp", label: "Power amp", test: (p) => /power amp/i.test(p.type) },
    { id: "streaming", label: "Streaming amp", test: (p) => /streaming/i.test(p.type) },
  ],
  speakers: [
    { id: "powered", label: "Powered", test: (p) => /powered/i.test(p.type) },
    { id: "passive", label: "Passive", test: (p) => /passive/i.test(p.type) },
  ],
  turntables: [
    { id: "auto", label: "Automatic", test: (p) => /automatic/i.test(p.type) },
    { id: "manual", label: "Manual", test: (p) => !/automatic/i.test(p.type) },
  ],
};
const typeOptionsFor = (cat) => TYPE_FACETS[cat] || [];

/* ============================================================
   State
   ============================================================ */
const state = { q: "", cat: "all", type: "all", price: "all", sounds: [], genres: [], sort: "rating", view: "gallery", facetsOpen: false, compare: [], openItem: null, spotlight: 0, gallery: 0, route: "home" };

const $ = (id) => document.getElementById(id);
const els = {
  listing: $("listing"), count: $("count"), reset: $("reset"), activeTags: $("activeTags"),
  search: $("search"), sort: $("sort"), navCount: $("navCount"), heroStats: $("heroStats"),
  fCat: $("facetCategory"), fType: $("facetType"), fPrice: $("facetPrice"), fSound: $("facetSound"), fGenre: $("facetGenre"),
  modal: $("modal"), modalInner: $("modalInner"), wavePath: $("wavePath"),
  catalog: document.querySelector(".catalog"), facets: $("facets"),
  facetToggle: $("facetToggle"), facetPanel: $("facetPanel"), facetBadge: $("facetBadge"),
  ciSub: document.querySelector(".ci-sub"),
  home: $("top"), systemsView: $("systemsView"),
};

function setFacetsOpen(open) {
  state.facetsOpen = open;
  els.facets.classList.toggle("is-open", open);
  els.catalog.classList.toggle("facets-open", open);
  els.facetToggle.setAttribute("aria-expanded", String(open));
  els.facetPanel.hidden = !open;
}
const activeFacetCount = () =>
  (state.cat !== "all" ? 1 : 0) + (state.type !== "all" ? 1 : 0) + (state.price !== "all" ? 1 : 0) + state.sounds.length + state.genres.length;
const typeLabel = (cat, id) => (typeOptionsFor(cat).find((t) => t.id === id) || {}).label || id;

/* ============================================================
   Filtering (faceted — supports skipping one facet for counts)
   ============================================================ */
const matchQuery = (p) => {
  if (!state.q) return true;
  const hay = [p.name, p.brand, p.signature, p.type, p.bestFor, p.blurb, ...(p.tags || [])].join(" ").toLowerCase();
  return hay.includes(state.q.toLowerCase());
};
const matchCat = (p) => state.cat === "all" || p.category === state.cat;
const matchType = (p) => {
  if (state.cat === "all" || state.type === "all") return true;
  const o = typeOptionsFor(state.cat).find((t) => t.id === state.type);
  return o ? o.test(p) : true;
};
const matchPrice = (p) => (PRICE_BANDS.find((b) => b.id === state.price) || PRICE_BANDS[0]).test(p);
const matchSound = (p) => !state.sounds.length || state.sounds.some((sid) => SOUND_FILTERS.find((s) => s.id === sid).test(p));
const matchGenre = (p) => !state.genres.length || state.genres.some((g) => genresFor(p).includes(g));

function passes(p, skip) {
  if (skip !== "q" && !matchQuery(p)) return false;
  if (skip !== "cat" && !matchCat(p)) return false;
  if (skip !== "type" && !matchType(p)) return false;
  if (skip !== "price" && !matchPrice(p)) return false;
  if (skip !== "sound" && !matchSound(p)) return false;
  if (skip !== "genre" && !matchGenre(p)) return false;
  return true;
}

/* when the category changes, drop selections that no longer apply */
function reconcileForCategory() {
  state.type = "all";
  state.sounds = state.sounds.filter((sid) =>
    PRODUCTS.some((p) => matchCat(p) && SOUND_FILTERS.find((s) => s.id === sid).test(p))
  );
  state.genres = state.genres.filter((g) => PRODUCTS.some((p) => matchCat(p) && genresFor(p).includes(g)));
  if (state.price !== "all") {
    const band = PRICE_BANDS.find((b) => b.id === state.price);
    if (!PRODUCTS.some((p) => matchCat(p) && band.test(p))) state.price = "all";
  }
}
function getFiltered() {
  const by = {
    rating: (a, b) => b.rating - a.rating || b.ratingCount - a.ratingCount,
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
    value: (a, b) => valueScore(b) - valueScore(a),
    name: (a, b) => a.name.localeCompare(b.name),
  };
  return PRODUCTS.filter((p) => passes(p, null)).sort(by[state.sort]);
}

/* ============================================================
   Static chrome: hero stats + soundwave
   ============================================================ */
function buildHero() {
  const avg = (PRODUCTS.reduce((s, p) => s + p.rating, 0) / PRODUCTS.length).toFixed(1);
  const cheapest = Math.min(...PRODUCTS.map((p) => p.price));
  const stats = [
    { v: PRODUCTS.length, k: "Pieces logged" },
    { v: CATEGORIES.length, k: "Categories" },
    { v: avg + "★", k: "Avg. score" },
    { v: fmtPrice(cheapest), k: "Entry point" },
  ];
  els.heroStats.innerHTML = stats.map((s) => `<div class="hstat"><div class="k">${s.k}</div><div class="v">${s.v}</div></div>`).join("");
  els.navCount.textContent = PRODUCTS.length;
}

/* ---------- editor's picks (curated entry points) ---------- */
const PICKS = [
  { id: "zero2", role: "Best first buy", note: "Pocket-money, no compromises" },
  { id: "hexa", role: "Best all-rounder", note: "The sub-$100 benchmark" },
  { id: "hd6xx", role: "Endgame on a budget", note: "Buy once, keep for years" },
];
const SPOTLIGHT = PICKS; // featured carousel = the three editor's picks
function renderSpotThumbs() {
  const el = document.getElementById("spotThumbs");
  if (!el) return;
  el.innerHTML = SPOTLIGHT.map((pk, idx) => {
    const p = PRODUCTS.find((x) => x.id === pk.id);
    return `<button class="spot-thumb${idx === state.spotlight ? " active" : ""}" data-spot="${idx}" aria-label="${p.brand} ${p.name}"><img src="${p.image}" alt="" decoding="async"></button>`;
  }).join("");
  el.querySelectorAll("[data-spot]").forEach((b) =>
    b.addEventListener("click", () => { state.spotlight = +b.dataset.spot; renderSpotlight(); }));
}
function renderSpotlight() {
  const i = ((state.spotlight % SPOTLIGHT.length) + SPOTLIGHT.length) % SPOTLIGHT.length;
  state.spotlight = i;
  const pk = SPOTLIGHT[i], p = PRODUCTS.find((x) => x.id === pk.id);
  if (!p) return;
  const pager = `${String(i + 1).padStart(2, "0")} / ${String(SPOTLIGHT.length).padStart(2, "0")}`;
  const photo = document.getElementById("spotPhoto");
  if (photo) photo.innerHTML = `<img class="prod-img" src="${p.image}" alt="${p.brand} ${p.name}" decoding="async">`;
  const info = document.getElementById("spotInfo");
  if (info) {
    info.innerHTML = `
      <span class="spot-role">${pk.role}<span class="spot-pager">${pager}</span></span>
      <h1 class="spot-name">${p.name}</h1>
      <div class="spot-sub">${p.brand} · ${catLabel(p.category)}</div>
      <p class="spot-blurb">${p.blurb}</p>
      <div class="spot-rating">${stars(p.rating)}<span class="spot-rval">${p.rating.toFixed(1)}</span><span class="spot-rprice">${fmtPrice(p.price)}</span></div>
      <button class="btn btn-primary spot-cta" data-id="${p.id}">Discover more <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`;
    info.querySelector(".spot-cta").addEventListener("click", () => openModal(p.id));
  }
  document.querySelectorAll(".spot-thumb").forEach((t, idx) => t.classList.toggle("active", idx === i));
}

/* ---------- starter systems ---------- */
function systemCardHTML(sys) {
  const items = sys.items.map((id) => PRODUCTS.find((x) => x.id === id)).filter(Boolean);
  const total = items.reduce((s, x) => s + x.price, 0);
  const itemsHTML = items.map((x, idx) => {
    const tt = TINTS[x.category];
    return `${idx > 0 ? '<span class="sys-plus">+</span>' : ""}<span class="sys-item">
      <span class="sys-thumb" style="background:${tt.bg}"><img src="${x.image}" alt="" decoding="async" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span class="art-fallback">${ART[x.category](tt)}</span></span>
      <span class="sys-name">${x.name}</span></span>`;
  }).join("");
  return `<a class="system" href="#/system/${sys.id}" aria-label="${sys.name} — view system">
    <div class="sys-top"><span class="sys-tag">${sys.tag}</span><span class="sys-total">${fmtPrice(total)}</span></div>
    <h3 class="sys-name-title">${sys.name}</h3>
    <p class="sys-blurb">${sys.blurb}</p>
    <div class="sys-items">${itemsHTML}</div>
    <span class="sys-cta">View system <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
  </a>`;
}
function renderSystems() {
  const grid = document.getElementById("systemsGrid");
  if (grid) grid.innerHTML = STARTER_SYSTEMS.map(systemCardHTML).join("");
}

/* ---------- starter-systems pages (hash-routed) ---------- */
function systemsOverviewHTML() {
  return `
    <section class="wrap page-hero">
      <nav class="crumbs"><a href="#top">Home</a><span>/</span><span aria-current="page">Systems</span></nav>
      <span class="kicker">Build a system</span>
      <h1 class="page-title">Starter systems</h1>
      <p class="page-lede">Proven budget pairings — a source and a transducer, or a deck and a pair of speakers — chosen to sing together. Each is a complete setup you can buy today and grow into.</p>
    </section>
    <section class="wrap"><div class="systems-grid systems-grid-page">${STARTER_SYSTEMS.map(systemCardHTML).join("")}</div></section>`;
}
function systemDetailHTML(sys) {
  const items = sys.items.map((id) => PRODUCTS.find((x) => x.id === id)).filter(Boolean);
  const total = items.reduce((s, x) => s + x.price, 0);
  const comps = items.map((x, i) => {
    const tt = TINTS[x.category];
    return `${i > 0 ? '<div class="comp-join" aria-hidden="true">+</div>' : ""}<article class="comp">
      <div class="comp-art" style="background:${tt.bg}"><img class="prod-img" src="${x.image}" alt="${x.brand} ${x.name}" decoding="async" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span class="art-fallback">${ART[x.category](tt)}</span></div>
      <div class="comp-info">
        <span class="comp-role">${ROLE_LABEL[x.category] || "Component"}</span>
        <div class="comp-brand">${x.brand}</div>
        <h3 class="comp-name">${x.name}</h3>
        <div class="comp-rate">${stars(x.rating)}<span class="comp-rval">${x.rating.toFixed(1)}</span></div>
        <p class="comp-blurb">${x.blurb}</p>
        <div class="comp-foot"><span class="comp-price">${fmtPrice(x.price)}</span><button class="btn btn-ghost comp-cta" data-id="${x.id}">View details</button></div>
      </div>
    </article>`;
  }).join("");
  return `
    <section class="wrap page-hero">
      <nav class="crumbs"><a href="#top">Home</a><span>/</span><a href="#/systems">Systems</a><span>/</span><span aria-current="page">${sys.name}</span></nav>
      <span class="kicker">${sys.tag}</span>
      <h1 class="page-title">${sys.name}</h1>
      <p class="page-lede">${sys.about}</p>
      <div class="sys-detail-meta">
        <div><span class="sdm-k">Complete setup</span><span class="sdm-v">${fmtPrice(total)}</span></div>
        <div><span class="sdm-k">Pieces</span><span class="sdm-v">${items.length}</span></div>
      </div>
    </section>
    <section class="wrap sys-components">${comps}</section>
    <section class="wrap sys-cta-band">
      <a class="btn btn-ghost" href="#/systems">← All systems</a>
      <a class="btn btn-primary" href="#catalog">Browse the full catalogue <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
    </section>`;
}
function wireSystemsView() {
  els.systemsView.querySelectorAll("[data-id]").forEach((b) => b.addEventListener("click", () => openModal(b.dataset.id)));
}
function applyRoute(initial) {
  const h = location.hash;
  if (h === "#/systems") {
    state.route = "systems"; els.home.hidden = true; els.systemsView.hidden = false;
    els.systemsView.innerHTML = systemsOverviewHTML(); wireSystemsView(); window.scrollTo(0, 0);
  } else if (h.indexOf("#/system/") === 0) {
    const sys = systemBySlug(decodeURIComponent(h.slice(9)));
    if (!sys) { location.hash = "#/systems"; return; }
    state.route = "system"; els.home.hidden = true; els.systemsView.hidden = false;
    els.systemsView.innerHTML = systemDetailHTML(sys); wireSystemsView(); window.scrollTo(0, 0);
  } else {
    if (!initial && state.route === "home") return; // in-page anchor (#catalog etc.) — just let it scroll
    state.route = "home"; els.systemsView.hidden = true; els.home.hidden = false;
    readURL();
    setFacetsOpen(activeFacetCount() > 0 || !!state.q);
    render();
    if (initial) {
      const it = new URLSearchParams(location.hash.slice(1)).get("item");
      if (it && PRODUCTS.some((p) => p.id === it)) openModal(it);
    }
  }
}

/* ---------- shop by category (teaser cards) ---------- */
function renderCategoryCards() {
  const grid = document.getElementById("catCards");
  if (!grid) return;
  grid.innerHTML = CATEGORIES.map((c) => {
    const count = PRODUCTS.filter((p) => p.category === c.id).length;
    const rep = PRODUCTS.find((p) => p.id === TOP_PICKS[c.id]) || PRODUCTS.find((p) => p.category === c.id);
    const tt = TINTS[c.id];
    return `<button class="sc-card" data-cat="${c.id}" aria-label="Browse ${c.label}">
      <div class="sc-text">
        <span class="sc-count">${count} pick${count === 1 ? "" : "s"}</span>
        <h3 class="sc-title">${c.label}</h3>
        <p class="sc-blurb">${c.blurb}</p>
        <span class="sc-link">Explore <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
      </div>
      <div class="sc-img">
        <img src="${rep.image}" alt="" decoding="async" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">
        <span class="art-fallback">${ART[c.id](tt)}</span>
      </div>
    </button>`;
  }).join("");
  grid.querySelectorAll("[data-cat]").forEach((b) =>
    b.addEventListener("click", () => {
      if (state.cat !== b.dataset.cat) { state.cat = b.dataset.cat; reconcileForCategory(); }
      render();
      document.getElementById("catalog").scrollIntoView({ behavior: "smooth", block: "start" });
    }));
}

/* ---------- curated shortlists (multi-column) ---------- */
function renderShortlists() {
  const grid = document.getElementById("shortlists");
  if (!grid) return;
  const byRating = [...PRODUCTS].sort((a, b) => b.rating - a.rating || b.ratingCount - a.ratingCount);
  const byValue = [...PRODUCTS].sort((a, b) => valueScore(b) - valueScore(a));
  const fresh = PRODUCTS.filter((p) => FRESH.has(p.id)).sort((a, b) => b.rating - a.rating);
  const byReviews = [...PRODUCTS].sort((a, b) => b.ratingCount - a.ratingCount);
  const LISTS = [
    { kicker: "Top rated", title: "Editor favourites", items: byRating.slice(0, 5) },
    { kicker: "Rating per $", title: "Best value", items: byValue.slice(0, 5) },
    { kicker: "New arrivals", title: "Just landed", items: fresh.slice(0, 5) },
    { kicker: "Most reviewed", title: "Crowd favourites", items: byReviews.slice(0, 5) },
  ];
  grid.innerHTML = LISTS.map((col) => `
    <div class="sl-col">
      <span class="kicker">${col.kicker}</span>
      <h3 class="sl-title">${col.title}</h3>
      <div class="sl-rows">
        ${col.items.map((p) => {
          const tt = TINTS[p.category];
          return `<button class="sl-row" data-id="${p.id}" aria-label="${p.brand} ${p.name} — details">
            <span class="sl-thumb" style="background:${tt.bg}"><img src="${p.image}" alt="" decoding="async" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span class="art-fallback">${ART[p.category](tt)}</span></span>
            <span class="sl-meta"><span class="sl-name">${p.name}</span><span class="sl-sub">${stars(p.rating)}<span class="sl-price">${fmtPrice(p.price)}</span></span></span>
          </button>`;
        }).join("")}
      </div>
    </div>`).join("");
  grid.querySelectorAll("[data-id]").forEach((el) => el.addEventListener("click", () => openModal(el.dataset.id)));
}

/* ============================================================
   Facet rendering (rebuilt each render for live counts)
   ============================================================ */
function renderFacets() {
  // category — always show all so you can switch freely
  const catOpts = [{ id: "all", label: "All categories" }, ...CATEGORIES];
  els.fCat.querySelector(".facet-body").innerHTML = catOpts
    .map((c) => {
      const n = c.id === "all"
        ? PRODUCTS.filter((p) => passes(p, "cat")).length
        : PRODUCTS.filter((p) => passes(p, "cat") && p.category === c.id).length;
      return optHTML("cat", c.id, c.label, n, state.cat === c.id);
    })
    .join("");

  // type — appears only once a category is chosen; heading + options adapt
  if (state.cat === "all" || typeOptionsFor(state.cat).length === 0) {
    els.fType.hidden = true;
    els.fType.querySelector(".facet-body").innerHTML = "";
  } else {
    const heading = TYPE_HEADING[state.cat] || "Type";
    els.fType.querySelector("h3").textContent = heading;
    const opts = [{ id: "all", label: "Any " + heading.toLowerCase(), test: () => true }, ...typeOptionsFor(state.cat)];
    els.fType.querySelector(".facet-body").innerHTML = renderRadioOpts("type", opts, state.type, "type");
    els.fType.hidden = false;
  }

  // price — hide bands with no matches in the current context
  els.fPrice.querySelector(".facet-body").innerHTML = renderRadioOpts("price", PRICE_BANDS, state.price, "price");

  // sound — multi-select chips, hide empty (selected stay visible)
  const soundHTML = SOUND_FILTERS.map((s) => {
    const n = PRODUCTS.filter((p) => passes(p, "sound") && s.test(p)).length;
    const on = state.sounds.includes(s.id);
    if (n === 0 && !on) return "";
    return `<button class="sig-chip ${on ? "on" : ""}" data-facet="sound" data-val="${s.id}">${s.label} <span style="opacity:.55">${n}</span></button>`;
  }).join("");
  els.fSound.querySelector(".facet-body").innerHTML = soundHTML;
  els.fSound.hidden = soundHTML === "";

  // genre / music fit — multi-select chips, hide empty
  const genreHTML = GENRES.map((g) => {
    const n = PRODUCTS.filter((p) => passes(p, "genre") && genresFor(p).includes(g.id)).length;
    const on = state.genres.includes(g.id);
    if (n === 0 && !on) return "";
    return `<button class="sig-chip genre ${on ? "on" : ""}" data-facet="genre" data-val="${g.id}">${g.label} <span style="opacity:.55">${n}</span></button>`;
  }).join("");
  els.fGenre.querySelector(".facet-body").innerHTML = genreHTML;
  els.fGenre.hidden = genreHTML === "";

  // wire
  [els.fCat, els.fType, els.fPrice, els.fSound, els.fGenre].forEach((g) =>
    g.querySelectorAll("[data-facet]").forEach((b) => b.addEventListener("click", onFacet)));
}

/* render single-select radio options, hiding empties (keep selected visible) */
function renderRadioOpts(facetKey, options, selected, skipKey) {
  return options
    .map((o) => {
      const n = o.id === "all"
        ? PRODUCTS.filter((p) => passes(p, skipKey)).length
        : PRODUCTS.filter((p) => passes(p, skipKey) && o.test(p)).length;
      const sel = selected === o.id;
      if (n === 0 && !sel && o.id !== "all") return "";
      return optHTML(facetKey, o.id, o.label, n, sel);
    })
    .join("");
}
function optHTML(facet, val, label, count, on) {
  return `<button class="facet-opt ${on ? "on" : ""}" data-facet="${facet}" data-val="${val}">
    <span class="radio"></span><span class="lbl">${label}</span><span class="ct">${count}</span>
  </button>`;
}
function onFacet(e) {
  const { facet, val } = e.currentTarget.dataset;
  if (facet === "cat") { if (state.cat !== val) { state.cat = val; reconcileForCategory(); } }
  else if (facet === "type") state.type = val;
  else if (facet === "price") state.price = val;
  else if (facet === "sound") {
    state.sounds = state.sounds.includes(val) ? state.sounds.filter((s) => s !== val) : [...state.sounds, val];
  }
  else if (facet === "genre") {
    state.genres = state.genres.includes(val) ? state.genres.filter((g) => g !== val) : [...state.genres, val];
  }
  render();
}

/* ============================================================
   Listing render (gallery / list)
   ============================================================ */
function cardHTML(p, i) {
  const t = TINTS[p.category];
  const idx = String(i + 1).padStart(2, "0");
  const hl = isTopPick(p)
    ? `<span class="hl-pill hl-top">★ Top pick</span>`
    : STRETCH.has(p.id) ? `<span class="hl-pill hl-stretch">Stretch</span>` : "";
  return `
    <article class="card" data-id="${p.id}" tabindex="0" role="button" aria-label="${p.brand} ${p.name} — details">
      <div class="card-art" style="background:${t.bg}">
        <span class="cat-badge">${catLabel(p.category)}</span>
        <span class="card-idx">№ ${idx}</span>
        ${hl}
        <img class="prod-img" src="${p.image}" alt="${p.brand} ${p.name}" decoding="async"
             onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">
        <span class="art-fallback">${ART[p.category](t)}</span>
        <button class="cmp-btn ${state.compare.includes(p.id) ? "on" : ""}" data-cmp="${p.id}" aria-label="Add to compare" title="Compare">${state.compare.includes(p.id) ? "✓" : "+"}</button>
      </div>
      <div class="card-body">
        <div class="card-top">
          <div>
            <div class="card-brand">${p.brand}${FRESH.has(p.id) ? '<span class="new-badge">New</span>' : ""}</div>
            <h3 class="card-name">${p.name}</h3>
          </div>
          <span class="card-price">${fmtPrice(p.price)}</span>
        </div>
        <div class="rating">${stars(p.rating)}<span class="val">${p.rating.toFixed(1)}</span><span class="ct">(${p.ratingCount.toLocaleString()})</span></div>
        <p class="card-blurb">${p.blurb}</p>
        <div class="card-foot">
          <span class="sig-tag">${eqGlyph()}${p.signature}</span>
          <span class="card-type">${p.type}</span>
        </div>
      </div>
    </article>`;
}
function rowHTML(p, i) {
  const t = TINTS[p.category];
  return `
    <div class="row${isTopPick(p) ? " row-feat" : ""}" data-id="${p.id}" tabindex="0" role="button" aria-label="${p.brand} ${p.name} — details">
      <span class="row-idx">${String(i + 1).padStart(2, "0")}</span>
      <div class="row-thumb" style="background:${t.bg}">
        <img class="prod-img" src="${p.image}" alt="" decoding="async"
             onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">
        <span class="art-fallback">${ART[p.category](t)}</span>
      </div>
      <div class="row-main"><div class="r-name">${isTopPick(p) ? '<span class="r-top" title="Top pick">★</span>' : ""}${p.name}${FRESH.has(p.id) ? '<span class="new-dot" title="New arrival"></span>' : ""}</div><div class="r-brand">${p.brand}</div></div>
      <div class="row-sig">${p.signature}<span class="r-type">${p.type}</span></div>
      <div class="row-rating">${stars(p.rating)}<span class="val">${p.rating.toFixed(1)}</span></div>
      <div class="row-price">${fmtPrice(p.price)}</div>
      <button class="cmp-btn row-cmp ${state.compare.includes(p.id) ? "on" : ""}" data-cmp="${p.id}" aria-label="Add to compare" title="Compare">${state.compare.includes(p.id) ? "✓" : "+"}</button>
    </div>`;
}

function render() {
  renderFacets();
  const list = getFiltered();
  const active = state.q || state.cat !== "all" || state.type !== "all" || state.price !== "all" || state.sounds.length;
  els.reset.hidden = !active;

  // active-filter badge on the collapsed rail
  const fc = activeFacetCount();
  els.facetBadge.hidden = fc === 0;
  els.facetBadge.textContent = fc;

  // count + active chips
  els.count.innerHTML = `<b>${list.length}</b> / ${PRODUCTS.length} pieces`;
  if (els.ciSub) {
    const cat = CATEGORIES.find((c) => c.id === state.cat);
    els.ciSub.textContent = cat ? cat.blurb : "Filtered live · sorted by ear & by numbers";
  }
  const chips = [];
  if (state.cat !== "all") chips.push(["cat", catLabel(state.cat)]);
  if (state.type !== "all") chips.push(["type", typeLabel(state.cat, state.type)]);
  if (state.price !== "all") chips.push(["price", (PRICE_BANDS.find((b) => b.id === state.price) || {}).label]);
  state.sounds.forEach((s) => chips.push(["sound:" + s, SOUND_FILTERS.find((f) => f.id === s).label]));
  state.genres.forEach((g) => chips.push(["genre:" + g, GENRE_LABEL[g]]));
  els.activeTags.innerHTML = chips
    .map(([key, label]) => `<span class="at">${label}<button data-clear="${key}" aria-label="Remove ${label}">✕</button></span>`)
    .join("");
  els.activeTags.querySelectorAll("[data-clear]").forEach((b) =>
    b.addEventListener("click", () => {
      const k = b.dataset.clear;
      if (k === "cat") { state.cat = "all"; reconcileForCategory(); }
      else if (k === "type") state.type = "all";
      else if (k === "price") state.price = "all";
      else if (k.startsWith("sound:")) state.sounds = state.sounds.filter((s) => s !== k.slice(6));
      else if (k.startsWith("genre:")) state.genres = state.genres.filter((g) => g !== k.slice(6));
      render();
    })
  );

  renderCompareTray();
  writeURL();

  // listing
  els.listing.className = "listing " + state.view;
  if (!list.length) {
    els.listing.className = "listing";
    els.listing.innerHTML = `<div class="empty">
      <div class="empty-ring">${dotGauge(0, 5)}</div>
      <h3>Nothing matches just yet</h3><p>Try a broader search or clear a filter or two.</p></div>`;
    return;
  }
  if (state.view === "gallery") {
    els.listing.innerHTML = list.map((p, i) => cardHTML(p, i)).join("");
  } else {
    els.listing.innerHTML =
      `<div class="list-head"><span>№</span><span></span><span>Model</span><span>Signature</span><span>Rating</span><span>Price</span><span></span></div>` +
      list.map((p, i) => rowHTML(p, i)).join("");
  }
  els.listing.querySelectorAll("[data-id]").forEach((el) => {
    el.addEventListener("click", () => openModal(el.dataset.id));
    el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openModal(el.dataset.id); } });
  });
  els.listing.querySelectorAll("[data-cmp]").forEach((b) =>
    b.addEventListener("click", (e) => { e.stopPropagation(); toggleCompare(b.dataset.cmp); }));
}

/* ============================================================
   Detail modal
   ============================================================ */
const imagesFor = (p) => (p.images && p.images.length ? p.images : [p.image]);
function galleryImages() {
  const p = PRODUCTS.find((x) => x.id === state.openItem);
  return p ? imagesFor(p) : [];
}
function showGalleryImage(idx) {
  const imgs = galleryImages(); const n = imgs.length;
  if (n < 2) return;
  state.gallery = ((idx % n) + n) % n;
  const m = $("galMain");
  if (m) m.src = imgs[state.gallery];
  document.querySelectorAll(".gal-thumb").forEach((t, i) => t.classList.toggle("active", i === state.gallery));
}

function openModal(id) {
  const p = PRODUCTS.find((x) => x.id === id);
  if (!p) return;
  state.openItem = id;
  state.gallery = 0;
  writeURL();
  const t = TINTS[p.category];
  const imgs = imagesFor(p);
  const multi = imgs.length > 1;

  const buys = p.retailers.map((r) => `<a class="buy" href="#" onclick="return false">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M6 6h15l-1.5 9h-12z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M6 6 5 3H2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="9" cy="20" r="1.5" fill="currentColor"/><circle cx="18" cy="20" r="1.5" fill="currentColor"/></svg>
      <span>${r.name}<span class="reg"> · ${r.region}</span></span></a>`).join("");

  const cmts = commentsFor(p).map((c, i) => `
    <div class="comment">
      <span class="avatar" style="background:${AVATAR_COLORS[(c.n.length + i) % AVATAR_COLORS.length]}">${c.n[0].toUpperCase()}</span>
      <div class="c-body">
        <div class="c-top"><span class="c-name">${c.n}</span><span class="c-stars">${"★".repeat(c.s)}${"☆".repeat(5 - c.s)}</span><span class="c-when">${c.w}</span></div>
        <p class="c-text">${c.t}</p>
      </div>
    </div>`).join("");

  // tuning profile (transducers), genre fit, pairings
  const profile = TRANSDUCERS.has(p.category) ? profileFor(p) : null;
  const tuningHTML = profile
    ? `<div class="section-h">Tuning profile</div>
       <div class="tuning">${profile.map(([k, v]) => `<div class="tune-row"><span class="tk">${k}</span><span class="tbar">${[1, 2, 3, 4, 5].map((n) => `<i class="${v >= n ? "on" : v >= n - 0.5 ? "half" : ""}"></i>`).join("")}</span></div>`).join("")}</div>
       <p class="tune-note">An editorial read of the house sound — a guide, not a measurement.</p>`
    : "";
  const genreHTML = TRANSDUCERS.has(p.category)
    ? `<div class="genre-tags">${genresFor(p).map((g) => `<span class="genre-tag">${GENRE_LABEL[g]}</span>`).join("")}</div>`
    : `<div class="genre-tags"><span class="genre-tag muted">Source component — works with any genre</span></div>`;
  const pairsHTML = pairsFor(p).map((x) => {
    const tt = TINTS[x.category];
    return `<button class="pair" data-pair="${x.id}">
        <span class="pair-thumb" style="background:${tt.bg}"><img src="${x.image}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span class="art-fallback">${ART[x.category](tt)}</span></span>
        <span class="pair-info"><span class="pair-brand">${x.brand}</span><span class="pair-name">${x.name}</span></span>
        <span class="pair-price">${fmtPrice(x.price)}</span>
      </button>`;
  }).join("");

  els.modalInner.innerHTML = `
    <div class="modal-head">
      <button class="modal-close" id="mClose" aria-label="Close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
      <div class="modal-gallery">
        <div class="modal-art">
          <img class="prod-img" id="galMain" src="${imgs[0]}" alt="${p.brand} ${p.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'">
          <span class="art-fallback">${ART[p.category](t)}</span>
          ${multi ? `<div class="gal-arrows">
            <button class="spot-arrow" id="galPrev" aria-label="Previous image"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
            <button class="spot-arrow" id="galNext" aria-label="Next image"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          </div>` : ""}
        </div>
        ${multi ? `<div class="gal-thumbs" id="galThumbs">${imgs.map((src, idx) => `<button class="gal-thumb${idx === 0 ? " active" : ""}" data-gal="${idx}" aria-label="View image ${idx + 1}"><img src="${src}" alt="" decoding="async" onerror="this.style.display='none'"></button>`).join("")}</div>` : ""}
      </div>
      <div class="modal-intro">
        <span class="b">${p.brand} · ${catLabel(p.category)}</span>
        <h2>${p.name}</h2>
        <span class="meta-line">${p.blurb}</span>
        ${isTopPick(p)
          ? `<span class="modal-tag t-top">★ Top pick in ${catLabel(p.category)}</span>`
          : STRETCH.has(p.id) ? `<span class="modal-tag t-stretch">Stretch pick — aspirational</span>` : ""}
        <div class="modal-hero-meta">
          <span class="mh-rating">${stars(p.rating)}<span class="mh-rval">${p.rating.toFixed(1)}</span></span>
          <span class="mh-price">${fmtPrice(p.price)}</span>
        </div>
      </div>
    </div>
    <div class="modal-body">
      <div class="score-ring">
        <div class="dot-gauge">
          ${dotGauge(p.rating, 5)}
          <div class="dg-center"><div class="dg-val">${p.rating.toFixed(1)}</div><div class="dg-max">out of 5</div></div>
        </div>
        <div class="score-meta">
          <div class="sm-label">Editorial score</div>
          <div class="sm-stars">${stars(p.rating)}</div>
          <div class="sm-sub">${p.ratingCount.toLocaleString()} community ratings</div>
        </div>
      </div>

      <div class="spec-row">
        <div class="spec"><div class="k">Street price</div><div class="v">${fmtPrice(p.price)}</div></div>
        <div class="spec"><div class="k">Type</div><div class="v" style="font-size:.92rem">${glossarize(p.type)}</div></div>
        <div class="spec"><div class="k">Signature</div><div class="v" style="font-size:.92rem">${glossarize(p.signature)}</div></div>
        <div class="spec"><div class="k">Best for</div><div class="v" style="font-size:.86rem;line-height:1.3">${p.bestFor}</div></div>
      </div>

      ${tuningHTML}

      <div class="section-h">Great for</div>
      ${genreHTML}

      <div class="section-h">The verdict</div>
      <p class="modal-review">${p.review}</p>

      <div class="pc-grid">
        <div class="pros"><div class="section-h" style="margin-top:0">What we love</div>
          <ul>${p.pros.map((x) => `<li><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>${x}</li>`).join("")}</ul></div>
        <div class="cons"><div class="section-h" style="margin-top:0">Worth knowing</div>
          <ul>${p.cons.map((x) => `<li><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/><path d="M12 8v5M12 16.5v.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>${x}</li>`).join("")}</ul></div>
      </div>

      <div class="section-h">Pairs well with</div>
      <div class="pairs">${pairsHTML}</div>

      <div class="section-h">Where to buy</div>
      <div class="buy-row">${buys}</div>

      <div class="section-h">From the community</div>
      <div class="comments">${cmts}</div>
    </div>`;

  els.modal.classList.add("open");
  document.body.style.overflow = "hidden";
  $("mClose").addEventListener("click", closeModal);
  if (multi) {
    $("galPrev").addEventListener("click", () => showGalleryImage(state.gallery - 1));
    $("galNext").addEventListener("click", () => showGalleryImage(state.gallery + 1));
    els.modalInner.querySelectorAll("[data-gal]").forEach((b) =>
      b.addEventListener("click", () => showGalleryImage(+b.dataset.gal)));
  }
  els.modalInner.querySelectorAll("[data-pair]").forEach((b) =>
    b.addEventListener("click", () => openModal(b.dataset.pair)));
  els.modal.scrollTop = 0;
}
function closeModal() {
  els.modal.classList.remove("open");
  document.body.style.overflow = "";
  state.openItem = null;
  writeURL();
}

/* ============================================================
   Compare mode
   ============================================================ */
function toggleCompare(id) {
  if (state.compare.includes(id)) state.compare = state.compare.filter((x) => x !== id);
  else { state.compare = [...state.compare, id]; if (state.compare.length > 3) state.compare.shift(); }
  render();
}
function renderCompareTray() {
  const tray = $("compareTray");
  if (!tray) return;
  tray.hidden = state.compare.length === 0;
  document.body.classList.toggle("has-compare", state.compare.length > 0);
  $("ctItems").innerHTML = state.compare.map((id) => {
    const x = PRODUCTS.find((p) => p.id === id); const tt = TINTS[x.category];
    return `<button class="ct-chip" data-cmp="${id}" title="Remove ${x.name}"><span class="ct-thumb" style="background:${tt.bg}"><img src="${x.image}" alt="" onerror="this.remove()"></span>${x.name}<span class="ct-x">✕</span></button>`;
  }).join("");
  const go = $("ctGo");
  go.textContent = `Compare (${state.compare.length})`;
  go.disabled = state.compare.length < 2;
  $("ctItems").querySelectorAll("[data-cmp]").forEach((b) => b.addEventListener("click", () => toggleCompare(b.dataset.cmp)));
}
function openCompare() {
  if (state.compare.length < 2) return;
  const items = state.compare.map((id) => PRODUCTS.find((p) => p.id === id));
  const rows = [
    ["Price", (x) => `<span class="cmp-price">${fmtPrice(x.price)}</span>`],
    ["Rating", (x) => `${stars(x.rating)} <b>${x.rating.toFixed(1)}</b>`],
    ["Category", (x) => catLabel(x.category)],
    ["Type", (x) => x.type],
    ["Signature", (x) => x.signature],
    ["Best for", (x) => x.bestFor],
    ["Great for", (x) => genresFor(x).map((g) => GENRE_LABEL[g]).join(" · ")],
    ["What we love", (x) => `<ul>${x.pros.map((p) => `<li>${p}</li>`).join("")}</ul>`],
    ["Worth knowing", (x) => `<ul>${x.cons.map((c) => `<li>${c}</li>`).join("")}</ul>`],
  ];
  $("comparePanel").innerHTML = `
    <button class="modal-close" id="cmpClose" aria-label="Close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
    <div class="cmp-scroll">
      <div class="cmp-grid" style="grid-template-columns:118px repeat(${items.length},minmax(140px,1fr))">
        <div class="cmp-corner"><span class="kicker">Compare</span></div>
        ${items.map((x) => {
          const tt = TINTS[x.category];
          return `<button class="cmp-head" data-id="${x.id}">
            <span class="cmp-thumb" style="background:${tt.bg}"><img src="${x.image}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><span class="art-fallback">${ART[x.category](tt)}</span></span>
            <span class="cmp-brand">${x.brand}</span><span class="cmp-name">${x.name}</span></button>`;
        }).join("")}
        ${rows.map(([label, fn], ri) => `<div class="cmp-rowlabel ${ri % 2 ? "alt" : ""}">${label}</div>${items.map((x) => `<div class="cmp-cell ${ri % 2 ? "alt" : ""}">${fn(x)}</div>`).join("")}`).join("")}
      </div>
    </div>`;
  $("compareBack").classList.add("open");
  document.body.style.overflow = "hidden";
  $("cmpClose").addEventListener("click", closeCompare);
  $("comparePanel").querySelectorAll(".cmp-head[data-id]").forEach((b) =>
    b.addEventListener("click", () => { closeCompare(); openModal(b.dataset.id); }));
}
function closeCompare() {
  $("compareBack").classList.remove("open");
  document.body.style.overflow = "";
}

/* ============================================================
   Theme + shareable deep links
   ============================================================ */
function applyTheme(t) {
  document.documentElement.setAttribute("data-theme", t);
  const btn = $("themeToggle");
  if (btn) btn.setAttribute("aria-pressed", String(t === "dark"));
  try { localStorage.setItem("ba-theme", t); } catch (e) {}
}
let _urlReady = false;
function writeURL() {
  if (!_urlReady || state.route !== "home") return;
  const sp = new URLSearchParams();
  if (state.q) sp.set("q", state.q);
  if (state.cat !== "all") sp.set("cat", state.cat);
  if (state.type !== "all") sp.set("type", state.type);
  if (state.price !== "all") sp.set("price", state.price);
  if (state.sounds.length) sp.set("sound", state.sounds.join(","));
  if (state.genres.length) sp.set("genre", state.genres.join(","));
  if (state.sort !== "rating") sp.set("sort", state.sort);
  if (state.view !== "gallery") sp.set("view", state.view);
  if (state.openItem) sp.set("item", state.openItem);
  const hash = sp.toString();
  history.replaceState(null, "", hash ? "#" + hash : location.pathname + location.search);
}
function readURL() {
  const sp = new URLSearchParams(location.hash.slice(1));
  if (sp.has("q")) { state.q = sp.get("q"); els.search.value = state.q; }
  if (sp.has("cat") && CATEGORIES.some((c) => c.id === sp.get("cat"))) state.cat = sp.get("cat");
  if (sp.has("type")) state.type = sp.get("type");
  if (sp.has("price") && PRICE_BANDS.some((b) => b.id === sp.get("price"))) state.price = sp.get("price");
  if (sp.has("sound")) state.sounds = sp.get("sound").split(",").filter((s) => SOUND_FILTERS.some((f) => f.id === s));
  if (sp.has("genre")) state.genres = sp.get("genre").split(",").filter((g) => GENRES.some((f) => f.id === g));
  if (sp.has("sort")) state.sort = sp.get("sort");
  if (sp.has("view") && ["gallery", "list"].includes(sp.get("view"))) state.view = sp.get("view");
  els.sort.value = state.sort;
  document.querySelectorAll(".view-toggle button").forEach((b) => b.classList.toggle("active", b.dataset.view === state.view));
  return sp.get("item");
}

/* ============================================================
   Events
   ============================================================ */
function debounce(fn, ms) { let id; return (...a) => { clearTimeout(id); id = setTimeout(() => fn(...a), ms); }; }

els.search.addEventListener("input", debounce((e) => { state.q = e.target.value.trim(); render(); }, 110));
els.sort.addEventListener("change", (e) => { state.sort = e.target.value; render(); });
els.reset.addEventListener("click", () => {
  state.q = ""; state.cat = "all"; state.type = "all"; state.price = "all"; state.sounds = []; state.genres = [];
  els.search.value = ""; render();
});
document.querySelectorAll(".view-toggle button").forEach((b) =>
  b.addEventListener("click", () => {
    state.view = b.dataset.view;
    document.querySelectorAll(".view-toggle button").forEach((x) => x.classList.toggle("active", x === b));
    render();
  })
);
els.facetToggle.addEventListener("click", () => setFacetsOpen(!state.facetsOpen));
$("themeToggle").addEventListener("click", () =>
  applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark"));
document.addEventListener("keydown", (e) => {
  if (e.key === "/" && !/^(input|textarea|select)$/i.test(e.target.tagName)) { e.preventDefault(); els.search.focus(); }
});

els.modal.addEventListener("click", (e) => { if (e.target === els.modal) closeModal(); });
$("ctClear").addEventListener("click", () => { state.compare = []; render(); });
$("ctGo").addEventListener("click", openCompare);
$("compareBack").addEventListener("click", (e) => { if (e.target === $("compareBack")) closeCompare(); });
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if ($("compareBack").classList.contains("open")) closeCompare();
    else if (els.modal.classList.contains("open")) closeModal();
  } else if (els.modal.classList.contains("open") && !$("compareBack").classList.contains("open")) {
    if (e.key === "ArrowLeft") showGalleryImage(state.gallery - 1);
    else if (e.key === "ArrowRight") showGalleryImage(state.gallery + 1);
  }
});

/* ---------- go ---------- */
(function init() {
  let theme = "light";
  try { theme = localStorage.getItem("ba-theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"); } catch (e) {}
  applyTheme(theme);

  setFacetsOpen(false); // collapsed by default
  buildHero();
  renderCategoryCards();
  renderSpotThumbs();
  renderSpotlight();
  renderSystems();
  renderShortlists();
  const sp = $("spotPrev"), sn = $("spotNext");
  if (sp) sp.addEventListener("click", () => { state.spotlight--; renderSpotlight(); });
  if (sn) sn.addEventListener("click", () => { state.spotlight++; renderSpotlight(); });
  _urlReady = true;
  window.addEventListener("hashchange", () => applyRoute(false));
  applyRoute(true); // route: home (with filters/deep-link) or a systems page
})();
