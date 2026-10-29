// Rebuild the portrait as a color halftone made of small dots.
const dotPortraitPixels = new WeakMap();
const portraitSilhouette = [
  [0.11, 1], [0.12, 0.86], [0.19, 0.77], [0.28, 0.67], [0.3, 0.57],
  [0.31, 0.47], [0.32, 0.4], [0.35, 0.34], [0.4, 0.3], [0.52, 0.3],
  [0.59, 0.34], [0.62, 0.4], [0.63, 0.5], [0.64, 0.57], [0.64, 0.69],
  [0.7, 0.84], [0.74, 1],
];

function isInsidePortraitSilhouette(x, y) {
  let inside = false;
  for (let i = 0, j = portraitSilhouette.length - 1; i < portraitSilhouette.length; j = i++) {
    const [xi, yi] = portraitSilhouette[i];
    const [xj, yj] = portraitSilhouette[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function makeDotPortrait(img) {
  const width = 480;
  const height = 480;
  const cell = 4;
  let pixels = dotPortraitPixels.get(img);
  if (!pixels) {
    const source = document.createElement("canvas");
    source.width = width;
    source.height = height;
    const sourceContext = source.getContext("2d", { willReadFrequently: true });
    const cropSize = Math.min(img.naturalWidth, img.naturalHeight);
    const cropX = (img.naturalWidth - cropSize) / 2;
    const cropY = (img.naturalHeight - cropSize) * 0.82;
    sourceContext.drawImage(img, cropX, cropY, cropSize, cropSize, 0, 0, width, height);
    pixels = sourceContext.getImageData(0, 0, width, height).data;
    dotPortraitPixels.set(img, pixels);
  }
  const art = document.createElement("canvas");
  art.width = width;
  art.height = height;
  const context = art.getContext("2d");
  const palette = ["--c0", "--c1", "--c2", "--c3", "--c4"].map((name) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  );

  for (let y = cell / 2; y < height; y += cell) {
    for (let x = cell / 2; x < width; x += cell) {
      const offset = (Math.floor(y) * width + Math.floor(x)) * 4;
      const red = pixels[offset];
      const green = pixels[offset + 1];
      const blue = pixels[offset + 2];
      const brightness = (red * 0.299 + green * 0.587 + blue * 0.114) / 255;
      const nx = x / width;
      const ny = y / height;
      const onUser = isInsidePortraitSilhouette(nx, ny);
      const isFace = nx > 0.35 && nx < 0.61 && ny > 0.48 && ny < 0.92 &&
        brightness > 0.28 && red > green * 0.93 && red > blue * 1.02;
      let level = Math.min(4, Math.floor(brightness * 5));
      if (onUser && brightness < 0.45) level = 2;
      if (isFace) level = 4;
      const radius = 0.5 + (1 - brightness) * 2.2 + (onUser ? 0.3 : 0);
      context.globalAlpha = onUser ? 1 : 0.55 + (1 - brightness) * 0.45;
      context.fillStyle = palette[level];
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }
  }
  context.globalAlpha = 1;

  img.src = art.toDataURL("image/png");
}

document.querySelectorAll("[data-dot-art]").forEach((img) => {
  if (img.complete && img.naturalWidth) makeDotPortrait(img);
  else img.addEventListener("load", () => makeDotPortrait(img), { once: true });
});

// Tema claro / oscuro
const root = document.documentElement;
const toggle = document.getElementById("themeToggle");

function currentTheme() {
  return root.dataset.theme === "light" ? "light" : "dark";
}

toggle.addEventListener("click", () => {
  const next = currentTheme() === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  document.querySelectorAll("[data-dot-art]").forEach((img) => {
    if (img.complete && img.naturalWidth) makeDotPortrait(img);
  });
  try { localStorage.setItem("theme", next); } catch (e) {}
});

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=/<>";
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- Idioma (EN / ES) ----------
// El inglés es el que está escrito en el HTML; aquí solo vive el español.
const ES_HTML = {
  age: "17 años",
  h_today: "Hoy",
  h_edu: "Educación",
  h_links: "Enlaces",
  p_today:
    'Ingeniero de software en <a data-link="reffactor">Reffactor</a>. Desarrollo un motor de comisiones de seguros de salud. Corrijo errores en producción y aprendo a moverme con cuidado donde un error significa dinero real.',
  p_edu:
    'Actualmente soy estudiante de secundaria en <a data-link="brs">British Royal School</a>. El próximo año dejo el colegio para dar exámenes libres, así puedo dedicarle más tiempo a mis proyectos y a mi trabajo.',
  p_links:
    'No dudes en escribirme por <a data-link="email">email</a>, o encuéntrame en <a data-link="x">X</a>, <a data-link="instagram">Instagram</a> y <a data-link="linkedin">LinkedIn</a>.',
};

// Textos sueltos (gráfico de GitHub, avisos, etiquetas de accesibilidad)
const STR = {
  en: {
    copied: "Copied ✓",
    themeLabel: "Toggle theme",
    langLabel: "Traducir al español",
    lastCommit: "last commit",
    less: "less",
    more: "more",
    now: "now",
    today: "today",
    ago: (n, u) => `${n}${u} ago`,
    contributions: (n) => `${n} contribution${n === 1 ? "" : "s"}`,
    inYear: (n) => `${n} contributions in the last year`,
    ariaYear: (n) => `${n} GitHub contributions in the last year`,
    dateLocale: "en-US",
    description: "Software engineer at Reffactor.",
  },
  es: {
    copied: "Copiado ✓",
    themeLabel: "Cambiar tema",
    langLabel: "Translate to English",
    lastCommit: "último commit",
    less: "menos",
    more: "más",
    now: "ahora",
    today: "hoy",
    ago: (n, u) => `hace ${n} ${u === "m" ? "min" : u}`,
    contributions: (n) => `${n} ${n === 1 ? "contribución" : "contribuciones"}`,
    inYear: (n) => `${n} contribuciones en el último año`,
    ariaYear: (n) => `${n} contribuciones en GitHub en el último año`,
    dateLocale: "es",
    description: "Ingeniero de software en Reffactor.",
  },
};

let LANG = "en";
try { if (localStorage.getItem("lang") === "es") LANG = "es"; } catch (e) {}
const strs = () => STR[LANG];

const i18nEls = [...document.querySelectorAll("[data-i18n]")];
const EN_HTML = new Map(i18nEls.map((el) => [el, el.innerHTML]));
// Los enlaces se escriben una sola vez en el HTML; el español los reutiliza
const LINKS = {};
document.querySelectorAll("[data-link]").forEach((a) => (LINKS[a.dataset.link] = a.cloneNode(false)));
const langBtn = document.getElementById("langToggle");

function applyLanguage(lang) {
  LANG = lang;
  i18nEls.forEach((el) => {
    el.innerHTML = lang === "en" ? EN_HTML.get(el) : ES_HTML[el.dataset.i18n];
    el.querySelectorAll("a[data-link]").forEach((a) => {
      for (const { name, value } of LINKS[a.dataset.link].attributes) a.setAttribute(name, value);
    });
  });
  root.lang = lang;
  toggle.setAttribute("aria-label", strs().themeLabel);
  langBtn.setAttribute("aria-label", strs().langLabel);
  langBtn.querySelectorAll("[data-l]").forEach((s) => s.classList.toggle("on", s.dataset.l === lang));
  for (const sel of ['meta[name="description"]', 'meta[property="og:description"]']) {
    document.querySelector(sel)?.setAttribute("content", strs().description);
  }
}
if (LANG !== "en") applyLanguage(LANG);

// Copiar el email al hacer clic (mailto no funciona sin app de correo)
const toast = document.getElementById("toast");
let toastTimer;
function showToast(text) {
  toast.textContent = text;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}
document.addEventListener("click", async (e) => {
  const a = e.target.closest("[data-copy]");
  if (!a) return;
  e.preventDefault();
  const value = a.dataset.copy;
  try {
    await navigator.clipboard.writeText(value);
    showToast(`${strs().copied} ${value}`);
  } catch {
    // Sin acceso al portapapeles: se abre la app de correo con mailto
    location.href = a.href;
  }
});

// Glitch automático: cada elemento [data-glitch] salta a su texto
// alternativo (data-alt) con separación de colores y vuelve al real.
const GLITCH_COLORS = ["#00e5ff", "#ff2a6d", "#b6ff00", "#ffe600", "#a855f7"];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rnd = (min, max) => Math.random() * (max - min) + min;

function jitter(el, colors = GLITCH_COLORS) {
  const s = el.style;
  const c1 = pick(colors);
  let c2 = pick(colors);
  while (c2 === c1) c2 = pick(colors);
  s.setProperty("--g1", c1);
  s.setProperty("--g2", c2);
  s.setProperty("--dx1", rnd(-6, 6).toFixed(1) + "px");
  s.setProperty("--dx2", rnd(-6, 6).toFixed(1) + "px");
  s.setProperty("--dy1", rnd(-2, 2).toFixed(1) + "px");
  s.setProperty("--dy2", rnd(-2, 2).toFixed(1) + "px");
  // Franjas horizontales aleatorias de cada capa
  const a = rnd(0, 70), b = rnd(0, 70);
  s.setProperty("--clip1", `inset(${a}% 0 ${Math.max(0, 100 - a - rnd(15, 55))}% 0)`);
  s.setProperty("--clip2", `inset(${b}% 0 ${Math.max(0, 100 - b - rnd(15, 55))}% 0)`);
  s.setProperty("--skew", rnd(-8, 8).toFixed(1) + "deg");
}

// Links: glitch corto en dorado y morado al pasar el mouse o con el teclado
const LINK_COLORS = ["#f5c542", "#ffb000", "#a855f7", "#c084fc"];

function addLinkGlitch(a) {
  if (reduce) return;
  a.classList.add("link-glitch");
  a.dataset.text = a.textContent.trim();
  let running = false;
  const run = () => {
    a.querySelectorAll(".w").forEach(reveal);
    if (running) return;
    running = true;
    a.classList.add("glitching");
    let i = 0;
    const id = setInterval(() => {
      jitter(a, LINK_COLORS);
      if (++i >= 9) {
        clearInterval(id);
        a.classList.remove("glitching");
        running = false;
      }
    }, 50);
  };
  a.addEventListener("mouseenter", run);
  a.addEventListener("focus", run);
}

function setupGlitch(el) {
  const real = el.textContent;
  const alt = el.dataset.alt;
  let running = false;

  const set = (t) => { el.textContent = t; el.dataset.text = t; };

  // real temblando → parpadeo → alt → parpadeo → real
  const seq = [
    real, real, real,
    alt, real, alt,
    alt, alt, alt, alt, alt, alt, alt, alt,
    real, alt, real,
    real, real,
  ];

  function run() {
    if (reduce || running) return;
    running = true;
    el.classList.add("glitching");
    let i = 0;
    const id = setInterval(() => {
      set(seq[i]);
      jitter(el);
      if (++i >= seq.length) {
        clearInterval(id);
        set(real);
        el.classList.remove("glitching");
        running = false;
      }
    }, 60);
  }

  return run;
}

if (!reduce) {
  document.querySelectorAll("[data-glitch]").forEach((el, n) => {
    const run = setupGlitch(el);
    const first = 500 + n * 900; // desfasados para que no coincidan
    setTimeout(run, first);
    const loop = () => setTimeout(() => { run(); loop(); }, rnd(4500, 8000));
    setTimeout(loop, first);
    el.parentElement.addEventListener("mouseenter", run);
  });

  document.querySelectorAll(".block a").forEach(addLinkGlitch);
}

// Texto "encriptado": todo aparece revuelto y cada palabra se arregla
// (una sola vez) cuando entra en pantalla al hacer scroll. El texto original queda para lectores de pantalla.
const words = [];

function randomize(text) {
  return text.replace(/[\p{L}\p{N}]/gu, () => CHARS[Math.floor(Math.random() * CHARS.length)]);
}

function encrypt(container) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  nodes.forEach((node) => {
    const wrap = document.createElement("span");
    const sr = document.createElement("span");
    sr.className = "sr-only";
    sr.textContent = node.textContent;
    const visual = document.createElement("span");
    visual.setAttribute("aria-hidden", "true");

    node.textContent.split(/(\s+)/).forEach((token) => {
      if (!token) return;
      if (/^\s+$/.test(token)) return visual.append(token);
      const w = document.createElement("span");
      w.className = "w";
      w.dataset.o = token;
      w.textContent = randomize(token);
      visual.append(w);
      words.push(w);
    });

    wrap.append(sr, visual);
    node.replaceWith(wrap);
  });
}

function reveal(w) {
  if (w.dataset.done) return;
  w.dataset.done = "1";
  const original = w.dataset.o;
  let frame = 0;
  const frames = 6 + Math.floor(Math.random() * 6);
  const id = setInterval(() => {
    const solved = Math.floor((frame / frames) * original.length);
    w.textContent = original.slice(0, solved) + randomize(original.slice(solved));
    if (++frame > frames) {
      clearInterval(id);
      w.textContent = original;
      w.classList.add("done");
    }
  }, 35);
}

if (!reduce) {
  document.querySelectorAll(".block").forEach(encrypt);

  // Revelar con el teclado (tab entre links)
  document.addEventListener("focusin", (e) => {
    e.target.querySelectorAll?.(".w").forEach(reveal);
  });

  // Se arregla por líneas al entrar en pantalla mientras haces scroll
  const io = new IntersectionObserver((entries) => {
    entries.filter((e) => e.isIntersecting).forEach((e, i) => {
      io.unobserve(e.target);
      setTimeout(() => reveal(e.target), 200 + i * 20);
    });
  });
  words.forEach((w) => io.observe(w));

  // Al llegar al final de la página se arregla lo que quede
  const atBottom = () => {
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) {
      words.forEach(reveal);
      removeEventListener("scroll", atBottom);
    }
  };
  addEventListener("scroll", atBottom, { passive: true });
  atBottom();
}

// Botón EN / ES: cambia todo el texto y lo vuelve a decodificar con el mismo efecto
langBtn.addEventListener("click", () => {
  const next = LANG === "en" ? "es" : "en";
  applyLanguage(next);
  try { localStorage.setItem("lang", next); } catch (e) {}

  i18nEls.forEach((el) => el.querySelectorAll("a").forEach(addLinkGlitch));
  if (!reduce) {
    const before = words.length;
    i18nEls.filter((el) => el.closest(".block")).forEach(encrypt);
    words.slice(before).forEach((w, i) => setTimeout(() => reveal(w), i * 10));
  }
  window.__refreshGraphText?.();
});

// "Último commit": hora exacta del último push (incluye privados si la función
// /api/last-commit está configurada; si no, solo los públicos). Si el gráfico
// muestra actividad más reciente que ese push, se usa el día del gráfico.
function lastCommitText(days, pushTimes) {
  const lastDay = [...days].reverse().find((d) => d.count > 0)?.date;
  const pushes = pushTimes.map((s) => new Date(s));
  const lastPush = pushes.length ? new Date(Math.max(...pushes)) : null;
  const localDate = (d) => d.toLocaleDateString("en-CA"); // YYYY-MM-DD

  if (lastPush && (!lastDay || localDate(lastPush) >= lastDay)) {
    const mins = Math.round((Date.now() - lastPush) / 60000);
    if (mins < 1) return { kind: "now" };
    if (mins < 60) return { kind: "ago", n: mins, unit: "m" };
    if (mins < 60 * 24) return { kind: "ago", n: Math.round(mins / 60), unit: "h" };
    return { kind: "ago", n: Math.round(mins / 1440), unit: "d" };
  }
  if (!lastDay) return null;
  const today = new Date(localDate(new Date()) + "T00:00:00");
  const diff = Math.round((today - new Date(lastDay + "T00:00:00")) / 86400000);
  return diff === 0 ? { kind: "today" } : { kind: "ago", n: diff, unit: "d" };
}

// Texto del último commit en el idioma actual ("2h ago" / "hace 2 h")
function lastCommitLabel(info) {
  const t = strs();
  return info.kind === "ago" ? t.ago(info.n, info.unit) : t[info.kind];
}

// Contribuciones de GitHub dibujadas con caracteres
(async function contributions() {
  const fig = document.getElementById("contrib");
  const grid = document.getElementById("contribGrid");
  const meta = document.getElementById("contribMeta");
  const legend = document.getElementById("contribLegend");
  const user = fig.dataset.user;
  const GLYPHS = ["·", "░", "▒", "▓", "█"];

  // Hora exacta del último push: primero la función de Vercel (incluye repos
  // privados); si no está disponible, los pushes públicos
  const pushesReq = fetch("/api/last-commit")
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((d) => (d.lastCommit ? [d.lastCommit] : Promise.reject()))
    .catch(() =>
      fetch(`https://api.github.com/users/${user}/events/public?per_page=100`)
        .then((r) => (r.ok ? r.json() : []))
        .then((events) => events.filter((e) => e.type === "PushEvent").map((e) => e.created_at))
        .catch(() => [])
    );

  try {
    const res = await fetch(`https://github-contributions-api.jogruber.de/v4/${user}?y=last`);
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    const days = data.contributions;

    // Columnas = semanas, filas = días (domingo arriba), como en GitHub
    const offset = new Date(days[0].date + "T00:00:00").getDay();
    const weeks = Math.ceil((days.length + offset) / 7);
    const rows = Array.from({ length: 7 }, () => Array(weeks).fill(null));
    days.forEach((d, i) => {
      const k = i + offset;
      rows[k % 7][Math.floor(k / 7)] = d;
    });

    rows.forEach((row, y) => {
      row.forEach((d, x) => {
        const s = document.createElement("span");
        if (!d) {
          s.textContent = " ";
        } else {
          s.textContent = GLYPHS[d.level];
          s.className = "l" + d.level;
          s.dataset.count = d.count;
          s.dataset.date = d.date;
        }
        s.style.setProperty("--x", x);
        s.style.setProperty("--y", y);
        grid.append(s);
      });
      grid.append("\n");
    });

    const total = data.total.lastYear ?? days.reduce((n, d) => n + d.count, 0);
    const lastInfo = lastCommitText(days, await pushesReq);

    // Todos los textos del gráfico; se vuelve a llamar al cambiar de idioma
    window.__refreshGraphText = () => {
      const t = strs();
      const fmtDate = new Intl.DateTimeFormat(t.dateLocale, { month: "short", day: "numeric", year: "numeric" });
      meta.innerHTML =
        `<a href="https://github.com/${user}" target="_blank" rel="noopener">@${user}</a>` +
        (lastInfo ? `<span>${t.lastCommit} ${lastCommitLabel(lastInfo)}</span>` : "");
      meta.querySelectorAll("a").forEach(addLinkGlitch);
      legend.innerHTML =
        t.less + GLYPHS.map((g, i) => `<span class="l${i}">${g}</span>`).join("") + t.more;
      grid.title = t.inYear(total);
      fig.setAttribute("aria-label", t.ariaYear(total));
      grid.querySelectorAll("span[data-date]").forEach((s) => {
        s.title = `${t.contributions(+s.dataset.count)} · ${fmtDate.format(new Date(s.dataset.date + "T00:00:00"))}`;
      });
    };
    window.__refreshGraphText();
    fig.hidden = false;

    if (reduce) return;
    new IntersectionObserver((entries, io) => {
      if (entries[0].isIntersecting) {
        fig.classList.add("in");
        io.disconnect();
        setTimeout(glitchLoop, 2500);
      }
    }).observe(fig);

    // Glitch cada pocos segundos, en dorado y morado como los links
    const cells = [...grid.querySelectorAll("span[class]")];
    grid.dataset.text = grid.textContent;
    const GRAPH_COLORS = LINK_COLORS;

    function glitchGraph() {
      if (document.hidden) return;
      grid.classList.add("glitching");
      const swapped = [];
      let i = 0;
      const id = setInterval(() => {
        jitter(grid, GRAPH_COLORS);
        grid.style.setProperty("--shift", rnd(-4, 4).toFixed(1) + "px");
        // Algunos caracteres cambian de forma por un instante
        swapped.forEach(([s, g]) => (s.textContent = g));
        swapped.length = 0;
        for (let n = 0; n < 18; n++) {
          const s = pick(cells);
          swapped.push([s, s.textContent]);
          s.textContent = pick(GLYPHS.slice(1));
        }
        if (++i >= 10) {
          clearInterval(id);
          swapped.forEach(([s, g]) => (s.textContent = g));
          grid.classList.remove("glitching");
        }
      }, 55);
    }

    function glitchLoop() {
      glitchGraph();
      setTimeout(glitchLoop, rnd(18000, 22000));
    }
  } catch {
    // Si la API falla, la sección queda sin gráfico
  }
})();
