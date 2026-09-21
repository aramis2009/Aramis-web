// Tema claro / oscuro
const root = document.documentElement;
const toggle = document.getElementById("themeToggle");

function currentTheme() {
  return root.dataset.theme === "light" ? "light" : "dark";
}

toggle.addEventListener("click", () => {
  const next = currentTheme() === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  try { localStorage.setItem("theme", next); } catch (e) {}
});

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=/<>";
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

// Glitch automático: cada elemento [data-glitch] salta a su texto
// alternativo (data-alt) con separación de colores y vuelve al real.
const GLITCH_COLORS = ["#00e5ff", "#ff2a6d", "#b6ff00", "#ffe600", "#a855f7"];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rnd = (min, max) => Math.random() * (max - min) + min;

function jitter(el) {
  const s = el.style;
  const c1 = pick(GLITCH_COLORS);
  let c2 = pick(GLITCH_COLORS);
  while (c2 === c1) c2 = pick(GLITCH_COLORS);
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
