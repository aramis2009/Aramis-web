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

// Copiar el email al hacer clic (mailto no funciona sin app de correo)
const toast = document.getElementById("toast");
let toastTimer;
function showToast(text) {
  toast.textContent = text;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}
document.querySelectorAll("[data-copy]").forEach((a) => {
  a.addEventListener("click", async (e) => {
    e.preventDefault();
    const value = a.dataset.copy;
    try {
      await navigator.clipboard.writeText(value);
      showToast(`Copied ✓ ${value}`);
    } catch {
      // Sin acceso al portapapeles: se abre la app de correo con mailto
      location.href = a.href;
    }
  });
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
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m ago`;
    if (mins < 60 * 24) return `${Math.round(mins / 60)}h ago`;
    return `${Math.round(mins / 1440)}d ago`;
  }
  if (!lastDay) return null;
  const today = new Date(localDate(new Date()) + "T00:00:00");
  const diff = Math.round((today - new Date(lastDay + "T00:00:00")) / 86400000);
  return diff === 0 ? "today" : `${diff}d ago`;
}

// Contribuciones de GitHub dibujadas con caracteres
(async function contributions() {
  const fig = document.getElementById("contrib");
  const grid = document.getElementById("contribGrid");
  const meta = document.getElementById("contribMeta");
  const user = fig.dataset.user;
  const GLYPHS = ["░", "░", "▒", "▓", "█"];
  const fmtDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

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
          s.title = `${d.count} contribution${d.count === 1 ? "" : "s"} · ${fmtDate.format(new Date(d.date + "T00:00:00"))}`;
        }
        s.style.setProperty("--x", x);
        s.style.setProperty("--y", y);
        grid.append(s);
      });
      grid.append("\n");
    });

    const total = data.total.lastYear ?? days.reduce((n, d) => n + d.count, 0);
    const last = lastCommitText(days, await pushesReq);
    meta.innerHTML =
      `<a href="https://github.com/${user}" target="_blank" rel="noopener">@${user}</a>` +
      (last ? `<span>last commit ${last}</span>` : "");
    grid.title = `${total} contributions in the last year`;
    meta.querySelectorAll("a").forEach(addLinkGlitch);
    fig.setAttribute("aria-label", `${total} GitHub contributions in the last year`);
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
