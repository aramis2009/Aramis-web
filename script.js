// Rebuild the portrait as a color halftone made of small dots.
const dotPortraitPixels = new WeakMap();

function makeDotPortrait(img) {
  const width = 720;
  const height = 720;
  const cell = 3;
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
  const paletteChannels = palette.map((color) => [
    parseInt(color.slice(1, 3), 16),
    parseInt(color.slice(3, 5), 16),
    parseInt(color.slice(5, 7), 16),
  ]);

  for (let y = cell / 2; y < height; y += cell) {
    for (let x = cell / 2; x < width; x += cell) {
      const offset = (Math.floor(y) * width + Math.floor(x)) * 4;
      const red = pixels[offset];
      const green = pixels[offset + 1];
      const blue = pixels[offset + 2];
      const brightness = (red * 0.299 + green * 0.587 + blue * 0.114) / 255;
      const nx = x / width;
      const ny = y / height;
      const faceHighlight = nx > 0.34 && nx < 0.64 && ny > 0.46 && ny < 0.93 &&
        brightness > 0.28 && red > green * 0.98 && red > blue * 1.02;
      const clothingShadow = nx > 0.12 && nx < 0.66 && ny > 0.5 && brightness < 0.32;
      let level = Math.min(4, Math.floor(brightness * 5));
      if (clothingShadow) level = Math.max(1, level);
      if (faceHighlight) level = Math.min(3, Math.max(2, level));
      const radius = 0.38 + (1 - brightness) * 1.62;
      context.globalAlpha = 0.55 + (1 - brightness) * 0.45;
      let color = palette[level];
      if (faceHighlight) {
        const nextLevel = Math.min(4, level + 1);
        const faceColor = paletteChannels[level].map((channel, index) =>
          Math.round(channel + (paletteChannels[nextLevel][index] - channel) * 0.3)
        );
        color = `rgb(${faceColor.join(", ")})`;
      }
      context.fillStyle = color;
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
  nav_journey: "Trayectoria →",
  nav_home: "Sobre mí",
  nav_map: "← Mapa",
  h_map: "Mapa",
  h_journey: "Trayectoria",
  j1_title: "Ingeniero de software · Reffactor",
  j1_text:
    "A cargo de principio a fin de un motor de pago de comisiones para seguros de salud: desde escribir código hasta hablar directamente con el cliente.",
  j3_when: "2.º medio",
  j3_title: "Dejé el colegio",
  j3_text:
    "Dejé el colegio para enfocarme en mis proyectos, y ahora termino la enseñanza media con exámenes libres.",
  alfi_when: "Mediados de 2026",
  alfi_title: "alfi.ai · proyecto propio",
  alfi_text:
    "Un agente que vive dentro de tu chat y te ayuda a no perder el contexto de la conversación, pensado para trabajos en grupo.",
  visit_site: "Ver sitio →",
  watch_video: "Ver video",
  crm_when: "Principios de 2026",
  crm_title: "CRM para una óptica",
  crm_text:
    "Desarrollé mi primer CRM para una óptica en Temuco, Chile. Le ayudó al cliente a tener sus ventas, usuarios y más de forma ordenada, cuando antes lo tenía todo en papel.",
  imp_title: "Impresos Berton",
  imp_text: "Rediseñé toda la página web de la empresa de mi familia.",
  water_title: "waterMarket · mi primer proyecto propio",
  water_text:
    "Un marketplace de recargas de bidones de agua y mi primer proyecto propio. Automatizaba la venta de las recargas para que el cliente no tuviera que gastar su tiempo haciéndolo a mano: solo 3 clics y compras.",
  games_when: "Diciembre de 2023",
  games_title: "Mis primeros juegos",
  games_text: "Empecé a programar a los 13 viendo videos, y en el camino creé tres juegos.",
  fortnite_title: "Jugador de Fortnite",
  fortnite_text: "Más de 20.000 horas jugadas en Fortnite.",
  p_today:
    'Soy ingeniero de software en <a data-link="reffactor">Reffactor</a> desde los 16 años. Estoy a cargo de principio a fin de un motor de pago de comisiones para seguros de salud: desde escribir el código hasta hablar directamente con el cliente.',
  p_edu:
    'Dejé el colegio en 2.º medio y ahora doy exámenes libres para terminar la enseñanza media. Así puedo organizar mejor mi tiempo y dedicar más tiempo a mis proyectos y al trabajo.',
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
    journeyTitle: "Journey",
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
    journeyTitle: "Trayectoria",
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
  updateTitle();
  // El glitch de los enlaces de navegación copia su texto: ponerlo al día
  document.querySelectorAll(".link-glitch[data-i18n]").forEach((a) => (a.dataset.text = a.textContent.trim()));
}

function updateTitle() {
  document.title = root.dataset.view === "journey" ? `${strs().journeyTitle} — Aramis Berton` : "Aramis Berton";
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
  document.querySelectorAll(".clip-action").forEach(addLinkGlitch);

  // Años de la trayectoria: glitch morado cada tanto (solo si la vista está a la vista) y al pasar el mouse
  const YEAR_COLORS = ["#a855f7", "#c084fc", "#8b3fe0"];
  document.querySelectorAll(".year-title").forEach((el, n) => {
    el.classList.add("link-glitch");
    el.dataset.text = el.textContent.trim();
    let running = false;
    const run = () => {
      if (running) return;
      running = true;
      el.classList.add("glitching");
      let i = 0;
      const id = setInterval(() => {
        jitter(el, YEAR_COLORS);
        if (++i >= 9) {
          clearInterval(id);
          el.classList.remove("glitching");
          running = false;
        }
      }, 50);
    };
    el.addEventListener("mouseenter", run);
    const loop = () => setTimeout(() => {
      if (root.dataset.view === "journey" && !document.hidden) run();
      loop();
    }, rnd(3500, 7000));
    setTimeout(loop, 1200 + n * 700); // desfasados para que no coincidan
  });
}

// Videos de los juegos: cerrados por defecto; al abrirlos arrancan solos y al cerrarlos se pausan
document.querySelectorAll("details.clip").forEach((d) => {
  const v = d.querySelector("video");
  d.addEventListener("toggle", () => {
    if (d.open) {
      v.play().catch(() => {});
      d.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
    } else {
      v.pause();
    }
  });
});

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
  window.__refreshMountain?.();
});

// ---------- Vistas (home / journey) con un glitch grande entre las dos ----------
// El nombre y el retrato se quedan arriba; cambia todo lo de abajo. La vista actual
// vive en root.dataset.view y se refleja en la URL (#journey), así que el botón
// "atrás" y los enlaces compartidos funcionan.

// Varias franjas horizontales a la vez, como un clip-path (un solo polígono en zigzag)
function bands(strength) {
  const n = 2 + Math.floor(strength * 6);
  const ys = Array.from({ length: n }, () => {
    const y = rnd(0, 96);
    return [y, Math.min(100, y + rnd(2, 6 + strength * 16))];
  }).sort((a, b) => a[0] - b[0]);
  const pts = ys.flatMap(([a, b]) => [`0% ${a}%`, `100% ${a}%`, `100% ${b}%`, `0% ${b}%`]);
  return `polygon(${pts.join(", ")})`;
}

// Dos copias de la página (una morada, otra dorada) encima de la real
function createGlitchRig() {
  const page = document.querySelector(".page");
  const wrap = document.createElement("div");
  wrap.className = "bigglitch";
  wrap.setAttribute("aria-hidden", "true");
  wrap.inert = true;
  const layers = ["purple", "gold"].map((tint) => {
    const layer = document.createElement("div");
    layer.className = `bg-layer bg-${tint}`;
    const copy = page.cloneNode(true);
    copy.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id"));
    copy.style.transform = `translateY(${-scrollY}px)`;
    layer.append(copy);
    wrap.append(layer);
    return { layer, copy };
  });
  const noise = document.createElement("div");
  noise.className = "bg-noise";
  wrap.append(noise);
  document.body.append(wrap);

  return {
    resetScroll() {
      layers.forEach(({ copy }) => (copy.style.transform = "translateY(0)"));
    },
    flash(on) {
      wrap.style.background = on ? "rgba(168, 85, 247, .4)" : "";
    },
    step(strength) {
      layers.forEach(({ layer }, i) => {
        const dir = i ? 1 : -1;
        layer.style.transform = `translateX(${(dir * (6 + strength * 90) * rnd(0.35, 1)).toFixed(1)}px)`;
        layer.style.clipPath = bands(strength);
      });
      // La página real también se desgarra y tiembla
      page.style.transform =
        `translate(${(rnd(-1, 1) * strength * 16).toFixed(1)}px, ${(rnd(-1, 1) * strength * 4).toFixed(1)}px) ` +
        `skewX(${(rnd(-1, 1) * strength * 7).toFixed(1)}deg)`;
      page.style.clipPath = strength > 0.55 && Math.random() < 0.75 ? bands(strength) : "";
      wrap.style.setProperty("--scan", (strength * 0.9).toFixed(2));
      noise.replaceChildren(
        ...Array.from({ length: Math.floor(strength * 9) }, () => {
          const b = document.createElement("i");
          b.style.cssText =
            `left:${rnd(0, 90)}%;top:${rnd(0, 98)}%;width:${rnd(6, 45)}%;height:${rnd(0.4, 5)}%;` +
            `background:${pick(["#a855f7", "#f5c542", "#ededed"])};opacity:${rnd(0.35, 0.9)}`;
          return b;
        })
      );
    },
    destroy() {
      wrap.remove();
      page.style.transform = "";
      page.style.clipPath = "";
    },
  };
}

// La intensidad sube hasta el medio (ahí se cambia la vista) y baja de nuevo
function bigGlitch(onMid) {
  return new Promise((resolve) => {
    if (document.hidden) { onMid(); resolve(); return; }
    const rig = createGlitchRig();
    const TOTAL = 1100, MID = 480, STEP = 55;
    const start = performance.now();
    let swapped = false;
    const tick = () => {
      const t = performance.now() - start;
      if (!swapped && t >= MID) {
        swapped = true;
        rig.resetScroll();
        onMid();
        rig.flash(true);
        setTimeout(() => rig.flash(false), 60);
      }
      if (t >= TOTAL) { rig.destroy(); resolve(); return; }
      const k = t < MID ? t / MID : 1 - (t - MID) / (TOTAL - MID);
      rig.step(Math.pow(Math.max(0, Math.min(1, k)), 0.85));
      setTimeout(tick, STEP);
    };
    tick();
  });
}

const HASH_OF = { mountain: "", home: "#about", journey: "#journey" };
// Old #about and #journey links land on the mountain now
const viewFromHash = () => "mountain";
let switching = false;

function setView(name) {
  root.dataset.view = name;
  updateTitle();
  window.scrollTo(0, 0);
  const h = document.querySelector(`.view[data-view="${name}"] h2`);
  if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
}

// La vista nueva llega revuelta y se decodifica, como continuación del glitch
function redecode(name) {
  const ws = [...document.querySelectorAll(`.view[data-view="${name}"] .w`)];
  ws.forEach((w) => {
    delete w.dataset.done;
    w.classList.remove("done");
    w.textContent = randomize(w.dataset.o);
  });
  ws.forEach((w, i) => setTimeout(() => reveal(w), 250 + i * 6));
}

function goTo(name, { push = true } = {}) {
  if (name === root.dataset.view || switching) return;
  switching = true;
  if (push) history.pushState(null, "", HASH_OF[name] || location.pathname + location.search);
  const swap = () => { setView(name); redecode(name); };
  const done = () => {
    switching = false;
    // Si pulsaron "atrás" en pleno glitch, ponerse al día
    if (viewFromHash() !== root.dataset.view) goTo(viewFromHash(), { push: false });
  };
  if (reduce) { swap(); done(); return; }
  bigGlitch(swap).then(done);
}

root.dataset.view = viewFromHash();
updateTitle();
document.querySelectorAll("a[data-nav]").forEach(addLinkGlitch);
document.addEventListener("click", (e) => {
  const a = e.target.closest("a[data-nav]");
  if (!a) return;
  e.preventDefault();
  goTo(a.dataset.nav);
});
addEventListener("popstate", () => goTo(viewFromHash(), { push: false }));

// ---------- Space background ----------
// A spiral galaxy and loose stars fill the viewport behind the page, in characters like
// the mountain. A small ship crosses the sky with a flickering exhaust.
(function space() {
  const box = document.getElementById("space");
  if (!box) return;
  const art = box.querySelector(".space-art");
  const ship = box.querySelector(".ship");
  const CELL_H = 12; // line height of the 12px art
  const hash = (x, y) => {
    const v = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return v - Math.floor(v);
  };
  const RAMP = " .·:*+%@";

  function draw() {
    // The layer spans the whole document so the galaxy stays behind the mountain on scroll
    const w = innerWidth, h = Math.max(innerHeight, document.documentElement.scrollHeight);
    box.style.height = h + "px";
    // The glyph advance depends on the loaded font and the page letter-spacing: measure it
    art.textContent = "0".repeat(20);
    const CELL_W = art.getBoundingClientRect().width / 20 || 7.2;
    const cols = Math.ceil(w / CELL_W) + 1, rows = Math.ceil(h / CELL_H) + 1;
    // Centered behind the summit, tilted and seen at an angle; it scales with the mountain
    const m = document.getElementById("mtn")?.getBoundingClientRect();
    const onMap = m && m.width > 0;
    const cx = onMap ? m.left + m.width * (+mtnSummit() || 0.5) : w * 0.5;
    const cy = onMap ? m.top + scrollY + m.height * 0.1 : h * 0.3;
    const R = onMap ? Math.max(170, Math.min(520, m.width * 0.46)) : Math.min(w, h) * 0.36;
    const tilt = -0.42, ct = Math.cos(tilt), st = Math.sin(tilt);
    const lines = [];
    for (let r = 0; r < rows; r++) {
      let out = "", cur = null, buf = "";
      for (let c = 0; c < cols; c++) {
        const dx = c * CELL_W - cx, dy = r * CELL_H - cy;
        const gx = (dx * ct - dy * st) / R, gy = (dx * st + dy * ct) / (R * 0.46);
        const rad = Math.hypot(gx, gy), ang = Math.atan2(gy, gx);
        // Two logarithmic arms, a bright core and a faint halo
        const arm = Math.pow(0.5 + 0.5 * Math.cos(2 * ang - 6 * Math.log(rad + 0.08)), 3) * Math.exp(-rad * 1.9);
        const core = Math.exp(-Math.pow(rad / 0.13, 2)) * 1.4;
        const d = (core + arm * 1.15 + Math.exp(-rad * 3.2) * 0.3) * (0.45 + 1.1 * hash(c, r));
        let ch = " ", cls = "";
        if (d > 0.07) {
          ch = RAMP[Math.max(1, Math.min(7, Math.round(Math.pow(Math.min(1, d), 0.6) * 7)))];
          cls = core > 0.25 ? "g-core" : hash(c + 31, r + 17) < 0.5 ? "g-arm" : "g-dust";
        } else if (hash(c * 1.7 + 5, r * 2.3 + 9) < 0.0045) {
          ch = hash(c, r + 3) < 0.25 ? "+" : ".";
          cls = "g-star";
        }
        if (cls !== cur) {
          if (buf) out += cur ? `<span class="${cur}">${buf}</span>` : buf;
          cur = cls;
          buf = "";
        }
        buf += ch;
      }
      lines.push(out + (buf ? (cur ? `<span class="${cur}">${buf}</span>` : buf) : ""));
    }
    art.innerHTML = lines.join("\n");
  }
  // The mountain module publishes where its summit is; redraw whenever the mountain resizes
  const mtnSummit = () => document.getElementById("mtn")?.dataset.summit;
  let timer;
  const redraw = () => { clearTimeout(timer); timer = setTimeout(draw, 150); };
  draw();
  addEventListener("resize", redraw);
  const mtnEl = document.getElementById("mtn");
  if (mtnEl) new ResizeObserver(redraw).observe(mtnEl);
  document.fonts?.ready.then(redraw);

  // The exhaust is redrawn a few times per second; the hull never changes
  const HULL = ["<|   \\___", "|  o  __>", "<|___/"];
  const flame = (n) => Array.from({ length: n }, () => "~=-:"[Math.floor(Math.random() * 4)]).join("");
  function drawShip() {
    const f = [flame(2), flame(4), flame(2)];
    ship.innerHTML =
      "      ___\n" +
      `  <span class="s-fire">${f[0]}</span>${HULL[0]}\n` +
      `<span class="s-fire">${f[1]}</span>${HULL[1]}\n` +
      `  <span class="s-fire">${f[2]}</span>${HULL[2]}`;
  }
  drawShip();
  if (!reduce) setInterval(() => { if (!document.hidden) drawShip(); }, 110);
})();

// ---------- Mountain cover ----------
// An ASCII Everest drawn from a seeded skyline; every point on the route opens one
// entry of the journey, oldest at the base and the current role at the summit.
(function mountain() {
  const fig = document.getElementById("mtn");
  const panel = document.getElementById("mtnPanel");
  if (!fig || !panel) return;
  const art = fig.querySelector(".mtn-art");
  const list = fig.querySelector(".mtn-pts");
  const body = document.getElementById("mtnBody");
  const pathEl = document.getElementById("mtnPath");
  const closeBtn = document.getElementById("mtnClose");
  // Two framings of the same terrain: the whole range on wide screens, and a taller
  // close-up of the main peak on phones so the characters stay readable.
  const VIEWS = {
    wide: { COLS: 140, ROWS: 46, X0: 0, W: 3, RISE: 39.6, DROP: 6, START: 0.2, ZIG: 3 },
    narrow: { COLS: 64, ROWS: 52, X0: 1.05, W: 1.3, RISE: 41.6, DROP: 5, START: 0.06, ZIG: 2 },
  };
  let COLS, ROWS, renderArt = () => {}, buttons = [];

  // The journey entries from base camp to the summit
  const POINTS = [
    { key: "fortnite_title", year: "2018" },
    { key: "games_title", year: "2023" },
    { key: "water_title", year: "2024" },
    { key: "imp_title", year: "2025" },
    { key: "crm_title", year: "2026" },
    { key: "alfi_title", year: "2026" },
    { key: "j3_title", year: "2026" },
    { key: "j1_title", year: null },
  ];
  POINTS.forEach((p) => (p.li = document.querySelector(`[data-i18n="${p.key}"]`)?.closest("li")));

  // Seeded so the mountain looks the same on every visit
  let seed = 7;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const table = Array.from({ length: 256 }, rand);
  const perm = Array.from({ length: 256 }, (_, i) => i).sort(() => rand() - 0.5);
  const smooth = (t) => t * t * (3 - 2 * t);
  const lattice = (i, j) => table[(perm[i & 255] + j) & 255];
  const noise = (x, y) => {
    const i = Math.floor(x), j = Math.floor(y), fx = smooth(x - i), fy = smooth(y - j);
    const a = lattice(i, j), b = lattice(i + 1, j), c = lattice(i, j + 1), d = lattice(i + 1, j + 1);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  };
  // Ridged noise has sharp crests, which is what eroded rock looks like
  const ridged = (x, y) => {
    let sum = 0, amp = 0.5, f = 1;
    for (let o = 0; o < 5; o++) {
      const n = 1 - Math.abs(2 * noise(x * f + o * 13.7, y * f + o * 7.3) - 1);
      sum += n * n * amp;
      amp *= 0.5;
      f *= 2.1;
    }
    return sum;
  };

  // The terrain is a real heightfield: flat-faced pyramids (so faces catch the light
  // like Everest's) roughened with ridged noise. [x, depth, height, radius, faces, rotation]
  const PEAKS = [
    [1.72, 1.25, 1.0, 0.98, 4, 1.05],
    [1.0, 0.9, 0.58, 0.62, 3, 0.0],
    [2.5, 1.05, 0.68, 0.66, 4, 1.1],
    [0.28, 1.5, 0.5, 0.6, 3, 0.9],
    [3.0, 1.6, 0.44, 0.55, 3, 0.1],
    [0.5, 0.3, 0.2, 0.42, 3, 0.4],
    [2.3, 0.26, 0.2, 0.45, 3, 1.3],
    [1.45, 0.42, 0.14, 0.4, 3, 2.0],
  ];
  const height = (x, y) => {
    const wx = x + (noise(x * 1.7 + 40, y * 1.7) - 0.5) * 0.3;
    const wy = y + (noise(x * 1.7, y * 1.7 + 90) - 0.5) * 0.3;
    let h = 0;
    for (const [cx, cy, ph, r, faces, rot] of PEAKS) {
      const dx = wx - cx, dy = wy - cy;
      let d = 0;
      for (let k = 0; k < faces; k++) {
        const a = rot + (k * 2 * Math.PI) / faces;
        d = Math.max(d, (dx * Math.cos(a) + dy * Math.sin(a)) / (r * (0.8 + 0.4 * table[(k * 37 + faces * 11) & 255])));
      }
      h = Math.max(h, ph * Math.pow(Math.max(0, 1 - d), 1.12));
    }
    return h + ridged(x * 2.4, y * 2.4) * (0.12 + 0.24 * h);
  };

  // Everything that depends on the framing: projection, shading, route and markers
  function build(view) {
    ({ COLS, ROWS } = view);
    // Side view: walk each column from the camera into the distance and keep what is
    // not hidden behind nearer terrain.
    const { X0, W, RISE, DROP } = view;
    const D = 2, STEPS = 320, TILT = 2.2;
    const hit = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    for (let cx = 0; cx < COLS; cx++) {
      const x = X0 + ((cx + 0.5) / COLS) * W;
      let minRow = ROWS;
      for (let s = 0; s <= STEPS; s++) {
        const y = (s / STEPS) * D;
        const h = height(x, y);
        const r = Math.round(ROWS + DROP - h * RISE - y * TILT);
        if (r < minRow) {
          for (let k = Math.max(0, r); k < minRow; k++) hit[k][cx] = { x, y, h };
          minRow = r;
        }
      }
    }

    // Low sun from the left: brightness per cell from the surface normal, a cast shadow,
    // snow above the snow line (bare rock where it is too steep) and haze with distance.
    const SUN = (() => { const v = [-0.72, -0.32, 0.5], m = Math.hypot(...v); return v.map((c) => c / m); })();
    const shade = (p) => {
      const e = 0.012;
      const hx = (height(p.x + e, p.y) - height(p.x - e, p.y)) / (2 * e);
      const hy = (height(p.x, p.y + e) - height(p.x, p.y - e)) / (2 * e);
      const m = Math.hypot(hx, hy, 1);
      let lit = Math.max(0, (-hx * SUN[0] - hy * SUN[1] + SUN[2]) / m);
      if (lit > 0) {
        for (let t = 0.03; t < 0.9; t += 0.03) {
          if (height(p.x + SUN[0] * t, p.y + SUN[1] * t) > p.h + SUN[2] * t + 0.01) { lit *= 0.25; break; }
        }
      }
      const snow = p.h > 0.3 + 0.2 * noise(p.x * 3.1, p.y * 3.1) && 1 / m > 0.3 + 0.16 * noise(p.x * 9, p.y * 9);
      // Rock is not one flat tone: strata bands by altitude plus gullies
      const rock = 0.12 + 0.42 * ridged(p.x * 6, p.y * 6) + 0.05 * noise(p.h * 34 + noise(p.x * 3, p.y * 3) * 3, 1.5);
      const fog = Math.max(0, Math.min(1, (p.y - 0.5) / 1.7)) * 0.5;
      // Skylight keeps some relief inside the shadows instead of one flat tone
      const ambient = 0.05 + 0.22 * (1 / m) * (0.5 + noise(p.x * 11, p.y * 11));
      const b = (snow ? 1 : rock) * (ambient + 0.9 * lit) * (1 - fog) + 0.16 * fog;
      return { b, snow, hx, steep: 1 / m < 0.62 };
    };

    const solid = (r, c) => r >= 0 && r < ROWS && c >= 0 && c < COLS && hit[r][c] !== null;
    const cells = hit.map((row, r) =>
      row.map((p, c) => {
        if (!p) return null;
        const s = shade(p);
        const cls = s.snow
          ? s.b > 0.5 ? (p.h > 0.82 ? "glow" : "sn") : "ss"
          : p.y > 1.45 ? "far" : s.b > 0.2 ? "rl" : "rs";
        // Outline against the sky, and a few strokes along the fall line on steep rock
        let ch = null;
        const skyL = !solid(r, c - 1), skyR = !solid(r, c + 1);
        if (skyL && skyR) ch = "^";
        else if (skyL) ch = "/";
        else if (skyR) ch = "\\";
        else if (!s.snow && s.steep && lattice(c * 7, r * 13) < 0.16) ch = s.hx > 0 ? "/" : "\\";
        return { b: s.b, cls, ch };
      })
    );

    const top = Array.from({ length: COLS }, (_, c) => {
      let r = 0;
      while (r < ROWS && !cells[r][c]) r++;
      return r;
    });
    const summitRow = Math.min(...top);
    const summitCols = top.map((r, c) => (r === summitRow ? c : -1)).filter((c) => c >= 0);
    const summitX = summitCols[summitCols.length >> 1];
    fig.dataset.summit = ((summitX + 0.5) / COLS).toFixed(4); // the space background centers its galaxy here

    const startX = Math.round(COLS * view.START), baseRow = ROWS - 5, last = POINTS.length - 1;
    POINTS.forEach((p, i) => {
      const t = i / last;
      // Slight switchbacks, like a real route
      const zig = i === 0 || i === last ? 0 : (i % 2 ? view.ZIG : -view.ZIG);
      p.x = Math.round(startX + (summitX - startX) * t + zig);
      p.y = i === last ? summitRow : Math.max(top[p.x] + 1, Math.round(baseRow + (summitRow - baseRow) * Math.pow(t, 0.85)));
    });
    const route = new Set();
    for (let i = 0; i < last; i++) {
      const a = POINTS[i], b = POINTS[i + 1];
      const n = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y));
      for (let k = 0; k <= n; k++) {
        const x = Math.round(a.x + ((b.x - a.x) * k) / n);
        const y = Math.max(top[x], Math.round(a.y + ((b.y - a.y) * k) / n));
        route.add(y * COLS + x);
      }
    }

    // Spindrift blowing off the summit (the stars come from the space background)
    const sky = new Map();
    for (let k = 2; k < 26; k++) {
      const r = summitRow + Math.round(k * 0.07 + (lattice(k, 3) - 0.5) * 1.6);
      const c = summitX + k;
      if (r >= 0 && c < COLS && !solid(r, c) && lattice(k, 9) < 0.85 * (1 - k / 26)) {
        sky.set(r * COLS + c, { ch: "~-.'"[Math.floor(lattice(k, 5) * 4)], cls: "plume" });
      }
    }
    // Brightness becomes character density, as in an image-to-ASCII filter. On a dark page
    // dense characters read as bright; on a light page it is the other way around.
    const RAMP = " .:-=+*#%@";
    function render() {
      const dark = root.dataset.theme !== "light";
      const rows = [];
      for (let r = 0; r < ROWS; r++) {
        let out = "", cur = null, buf = "";
        for (let c = 0; c < COLS; c++) {
          let ch = " ", cls = "";
          const cell = cells[r][c];
          if (route.has(r * COLS + c)) { ch = "•"; cls = "rt"; }
          else if (cell) {
            const level = Math.max(1, Math.min(9, Math.round(Math.pow(cell.b, 0.75) * 9)));
            ch = cell.ch || RAMP[dark ? level : 10 - level];
            cls = cell.cls;
          } else if (sky.has(r * COLS + c)) ({ ch, cls } = sky.get(r * COLS + c));
          if (cls !== cur) {
            if (buf) out += cur ? `<span class="${cur}">${buf}</span>` : buf;
            cur = cls;
            buf = "";
          }
          buf += ch === "<" ? "&lt;" : ch === "&" ? "&amp;" : ch;
        }
        rows.push(out + (buf ? (cur ? `<span class="${cur}">${buf}</span>` : buf) : ""));
      }
      art.innerHTML = rows.join("\n");
    }
    render();
    renderArt = render;

    // Markers laid over the art, positioned in percent of the character grid
    list.replaceChildren();
    buttons = POINTS.map((p, i) => {
      if (!p.li) return null;
      const li = document.createElement("li");
      li.style.cssText = `left:${(((p.x + 0.5) / COLS) * 100).toFixed(2)}%;top:${(((p.y + 0.5) / ROWS) * 100).toFixed(2)}%;--i:${i}`;
      const b = document.createElement("button");
      b.type = "button";
      b.className = "mtn-pt" + (i === POINTS.length - 1 ? " mtn-pt--top" : "");
      b.innerHTML = '<span class="pt-dot" aria-hidden="true">◉</span><span class="pt-year"></span><span class="pt-name"></span>';
      b.addEventListener("click", () => openPoint(i, b));
      li.append(b);
      list.append(li);
      return b;
    });
    syncLabels();
    fit();
  }

  // The glyph width depends on the font that actually loaded, so measure it and size the
  // art to fill the container exactly (markers are placed in percent of the grid).
  function fit() {
    const w = fig.clientWidth;
    if (!w) return;
    // Glyph advances can round differently per size, so converge in a few passes
    let size = (w / (COLS * 0.6)) || 12;
    for (let k = 0; k < 4; k++) {
      art.style.fontSize = size.toFixed(3) + "px";
      const natural = art.getBoundingClientRect().width;
      if (Math.abs(natural - w) < 0.5) break;
      size *= w / natural;
    }
  }

  // Labels follow the language (the titles live in the timeline entries)
  function syncLabels() {
    POINTS.forEach((p, i) => {
      const b = buttons[i];
      if (!b) return;
      // encrypt() wraps text in a visual (scrambled) copy plus an .sr-only original
      const h4 = p.li.querySelector("h4");
      const title = (h4?.querySelector(".sr-only") || h4)?.textContent.trim() || "";
      b.querySelector(".pt-year").textContent = p.year ?? strs().now;
      b.querySelector(".pt-name").textContent = title;
      b.setAttribute("aria-label", `${p.year ?? strs().now} — ${title}`);
    });
  }
  window.__refreshMountain = syncLabels;

  const narrow = matchMedia("(max-width: 640px)");
  build(narrow.matches ? VIEWS.narrow : VIEWS.wide);
  narrow.addEventListener("change", (e) => build(e.matches ? VIEWS.narrow : VIEWS.wide));
  new MutationObserver(() => renderArt()).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  new ResizeObserver(fit).observe(fig);
  document.fonts?.ready.then(fit);

  // Panel: the real timeline nodes are moved in (so their video handlers keep working)
  // and moved back on close.
  let current = -1, opener = null;

  function show(i) {
    const p = POINTS[i];
    current = i;
    body.replaceChildren(...p.li.childNodes);
    pathEl.textContent = `~/climb/${p.year ?? "now"}`;
    panel.hidden = false;
    fig.classList.add("dim");
    root.classList.add("mtn-open");
    const ws = [...body.querySelectorAll(".w")];
    ws.forEach((w) => {
      delete w.dataset.done;
      w.classList.remove("done");
      w.textContent = randomize(w.dataset.o);
    });
    ws.forEach((w, k) => setTimeout(() => reveal(w), 120 + k * 8));
    closeBtn.focus({ preventScroll: true });
  }

  function openPoint(i, btn) {
    if (switching || current !== -1) return;
    opener = btn;
    if (reduce) return show(i);
    switching = true;
    bigGlitch(() => show(i)).then(() => { switching = false; });
  }

  function close() {
    if (current === -1) return;
    body.querySelectorAll("video").forEach((v) => v.pause());
    POINTS[current].li.replaceChildren(...body.childNodes);
    current = -1;
    panel.hidden = true;
    fig.classList.remove("dim");
    root.classList.remove("mtn-open");
    opener?.focus({ preventScroll: true });
  }

  closeBtn.addEventListener("click", close);
  panel.addEventListener("click", (e) => { if (e.target === panel) close(); });
  addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
})();

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
