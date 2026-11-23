(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const KIND = { studio: "Studio", university: "University", personal: "Personal" };

  /* ---------- Starfield: flies toward you, tilts with the mouse, speeds up on scroll ---------- */
  const canvas = $("#stars");
  const ctx = canvas.getContext("2d");
  const COLORS = ["#ffffff", "#7ef2c4", "#ff8fc8", "#ffb35c", "#6fa8ff"];
  let w, h, dpr, stars = [];
  let speed = 0.6, targetSpeed = 0.6, warp = 0;
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(700, (w * h) / 2200));
    stars = Array.from({ length: count }, newStar);
  }
  function newStar(_, i, z) {
    return {
      x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2,
      z: z ?? Math.random(), pz: 0,
      c: Math.random() < 0.85 ? COLORS[0] : COLORS[1 + ((Math.random() * 4) | 0)],
    };
  }
  function frame() {
    speed += (targetSpeed + warp - speed) * 0.06;
    warp *= 0.985;
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;
    ctx.fillStyle = warp > 1 ? "rgba(7,6,13,.25)" : "#07060d";
    ctx.fillRect(0, 0, w, h);
    const cx = w / 2 - mouse.x * 40, cy = h / 2 - mouse.y * 40;
    const scale = Math.max(w, h) * 0.5;
    for (const s of stars) {
      s.pz = s.z;
      s.z -= 0.0025 * speed;
      if (s.z <= 0.02) { Object.assign(s, newStar(0, 0, 1)); s.pz = 1; continue; }
      const sx = cx + (s.x / s.z) * scale, sy = cy + (s.y / s.z) * scale;
      const px = cx + (s.x / s.pz) * scale, py = cy + (s.y / s.pz) * scale;
      if (sx < -50 || sx > w + 50 || sy < -50 || sy > h + 50) { Object.assign(s, newStar(0, 0, 1)); continue; }
      const a = Math.min(1, (1 - s.z) * 1.4);
      ctx.globalAlpha = a;
      ctx.strokeStyle = s.c;
      ctx.lineWidth = Math.max(0.5, (1 - s.z) * 2.4);
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(sx, sy); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    if (heroVisible) requestAnimationFrame(frame); else running = false;
  }
  let heroVisible = true, running = false;
  function start() { if (!running && !reduced) { running = true; requestAnimationFrame(frame); } }
  new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; if (heroVisible) start(); }).observe($(".hero"));
  addEventListener("resize", resize);
  addEventListener("pointermove", (e) => { mouse.tx = e.clientX / innerWidth - 0.5; mouse.ty = e.clientY / innerHeight - 0.5; });
  resize();
  if (reduced) { speed = 0; frame(); } else start();

  /* ---------- Hero title: letters rise in one by one ---------- */
  let delay = 0.15;
  $$(".split").forEach((el) => {
    const text = el.textContent;
    el.setAttribute("aria-label", text);
    el.textContent = "";
    for (const ch of text) {
      const span = document.createElement("span");
      span.className = "ch";
      span.setAttribute("aria-hidden", "true");
      span.textContent = ch === " " ? " " : ch;
      span.style.animationDelay = `${delay}s`;
      delay += 0.035;
      el.appendChild(span);
    }
    if (el.classList.contains("grad")) {
      const chars = $$(".ch", el), n = chars.length;
      chars.forEach((c, i) => {
        c.style.setProperty("--gw", `${n * 100}%`);
        c.style.setProperty("--gx", `${n > 1 ? (i / (n - 1)) * 100 : 0}%`);
      });
    }
  });

  /* ---------- Typed role line ---------- */
  const roles = ["VR worlds in Unreal.", "physics puzzles in Unity.", "AI that hunts you.", "tools for designers.", "games people love."];
  const typed = $(".typed");
  if (reduced) typed.textContent = roles[0];
  else {
    let r = 0, i = 0, del = false;
    (function tick() {
      const word = roles[r];
      typed.textContent = word.slice(0, i);
      if (!del && i === word.length) { del = true; return setTimeout(tick, 1800); }
      if (del && i === 0) { del = false; r = (r + 1) % roles.length; }
      i += del ? -1 : 1;
      setTimeout(tick, del ? 28 : 60 + Math.random() * 50);
    })();
  }

  /* ---------- Projects ---------- */
  const grid = $("#grid");
  const thumbOf = (p) => (p.video ? `https://i.ytimg.com/vi/${p.video}/hqdefault.jpg` : p.image);
  PROJECTS.forEach((p, idx) => {
    const card = document.createElement("button");
    card.className = "card" + (p.featured ? " featured" : "");
    card.dataset.kind = p.kind;
    card.dataset.idx = idx;
    card.style.setProperty("--d", `${(idx % 3) * 0.08}s`);
    card.setAttribute("aria-label", `${p.title}: open details`);
    card.innerHTML = `
      <div class="thumb">
        <img src="${thumbOf(p)}" alt="" loading="lazy" />
        <span class="badge">${KIND[p.kind]}</span>
        ${p.video ? '<span class="play" aria-hidden="true"></span>' : ""}
      </div>
      <div class="card-body">
        <h3>${p.title}</h3>
        <p class="sub">${p.company ? p.company + " · " : ""}${p.genre}</p>
        <div class="tags"><span>${p.engine}</span><span>${p.language}</span>${p.time ? `<span>${p.time}</span>` : ""}</div>
      </div>`;
    grid.appendChild(card);
  });

  // 3D tilt and a light that follows the pointer
  if (!reduced && matchMedia("(hover: hover)").matches) {
    grid.addEventListener("pointermove", (e) => {
      const card = e.target.closest(".card");
      if (!card) return;
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.style.setProperty("--ry", `${(x - 0.5) * 10}deg`);
      card.style.setProperty("--rx", `${(0.5 - y) * 10}deg`);
      card.style.setProperty("--mx", `${x * 100}%`);
      card.style.setProperty("--my", `${y * 100}%`);
    });
    grid.addEventListener("pointerout", (e) => {
      const card = e.target.closest(".card");
      if (card && !card.contains(e.relatedTarget)) { card.style.setProperty("--rx", "0deg"); card.style.setProperty("--ry", "0deg"); }
    });
  }

  // Filters
  $$(".chip").forEach((chip) => chip.addEventListener("click", () => {
    $$(".chip").forEach((c) => { c.classList.toggle("active", c === chip); c.setAttribute("aria-selected", c === chip); });
    const f = chip.dataset.filter;
    let n = 0;
    $$(".card").forEach((card) => {
      const show = f === "all" || card.dataset.kind === f;
      card.classList.toggle("hide", !show);
      card.classList.remove("pop");
      if (show) { card.style.setProperty("--d", `${n++ * 0.05}s`); void card.offsetWidth; card.classList.add("pop"); }
    });
  }));

  // Detail dialog
  const modal = $("#modal");
  grid.addEventListener("click", (e) => {
    const card = e.target.closest(".card");
    if (card) openProject(PROJECTS[card.dataset.idx]);
  });
  function openProject(p) {
    $(".m-media", modal).innerHTML = p.video
      ? `<iframe src="https://www.youtube-nocookie.com/embed/${p.video}?autoplay=1&rel=0" title="${p.title} video" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`
      : `<img src="${p.image}" alt="${p.title}" />`;
    $(".m-kind", modal).textContent = KIND[p.kind] + (p.kind !== "studio" ? " project" : "");
    $("#m-title").textContent = p.title;
    const facts = [["Role", p.role], ["Company", p.company], ["Genre", p.genre], ["Platform", p.platform],
      ["Engine", p.engine], ["Language", p.language], ["Team", p.team], ["Time", p.time], ["Status", p.status]];
    $(".m-facts", modal).innerHTML = facts.filter(([, v]) => v).map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");
    $(".m-points", modal).innerHTML = p.points.map((t) => `<li>${t}</li>`).join("");
    $(".m-link", modal).innerHTML = p.link ? `<a class="btn primary" href="${p.link.href}" target="_blank" rel="noopener">Play on ${p.link.label} ↗</a>` : "";
    if (p.link?.label === "GitHub") $(".m-link a", modal).textContent = "View on GitHub ↗";
    modal.showModal();
  }
  const closeModal = () => modal.close();
  $(".close", modal).addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  modal.addEventListener("close", () => { $(".m-media", modal).innerHTML = ""; });

  /* ---------- Skills ---------- */
  $("#skills").innerHTML = Object.entries(SKILLS).map(([group, items]) =>
    `<div class="skill-group"><h4>${group}</h4><ul>${items.map((s, i) => `<li style="--d:${i * 0.06}s">${s}</li>`).join("")}</ul></div>`).join("");

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add(e.target.classList.contains("card") ? "pop" : "in");
    io.unobserve(e.target);
  }), { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  $$(".reveal, .card").forEach((el) => io.observe(el));
  $$(".hero .reveal").forEach((el, i) => el.style.setProperty("--d", `${0.5 + i * 0.12}s`));

  /* ---------- Counters ---------- */
  const countIO = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    countIO.unobserve(e.target);
    const end = +e.target.dataset.count, t0 = performance.now(), dur = reduced ? 1 : 1400;
    (function step(t) {
      const k = Math.min(1, (t - t0) / dur);
      e.target.textContent = Math.round(end * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }), { threshold: 0.6 });
  $$("[data-count]").forEach((el) => countIO.observe(el));

  /* ---------- Scroll: progress bar, nav state, timeline fill, active link ---------- */
  const nav = $(".nav"), bar = $(".progress"), timeline = $(".timeline");
  const sections = $$("main section[id]");
  function onScroll() {
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    nav.classList.toggle("scrolled", y > 30);
    targetSpeed = 0.6 + Math.min(y / 200, 6);
    const tr = timeline.getBoundingClientRect();
    timeline.style.setProperty("--fill", Math.max(0, Math.min(1, (innerHeight * 0.7 - tr.top) / tr.height)));
    let current = "";
    for (const s of sections) if (s.getBoundingClientRect().top < innerHeight * 0.4) current = s.id;
    $$(".links a").forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + current));
  }
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  const menuBtn = $(".menu-btn"), links = $(".links");
  menuBtn.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", open);
    document.body.style.overflow = open ? "hidden" : "";
  });
  links.addEventListener("click", (e) => {
    if (e.target.tagName === "A") { links.classList.remove("open"); menuBtn.setAttribute("aria-expanded", false); document.body.style.overflow = ""; }
  });

  /* ---------- Button spotlight ---------- */
  document.addEventListener("pointermove", (e) => {
    const b = e.target.closest?.(".btn");
    if (!b) return;
    const r = b.getBoundingClientRect();
    b.style.setProperty("--x", `${e.clientX - r.left}px`);
    b.style.setProperty("--y", `${e.clientY - r.top}px`);
  });

  /* ---------- Copy email ---------- */
  const toast = $(".toast");
  const showToast = (msg) => { toast.textContent = msg; toast.classList.add("show"); clearTimeout(showToast.t); showToast.t = setTimeout(() => toast.classList.remove("show"), 2200); };
  $(".copy").addEventListener("click", async (e) => {
    const email = e.currentTarget.dataset.email;
    try { await navigator.clipboard.writeText(email); showToast("Email copied. Talk soon!"); }
    catch { location.href = "mailto:" + email; }
  });

  /* ---------- Konami code: hyperspace ---------- */
  const code = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  let pos = 0;
  addEventListener("keydown", (e) => {
    pos = e.key.toLowerCase() === code[pos].toLowerCase() ? pos + 1 : (e.key === code[0] ? 1 : 0);
    if (pos === code.length) {
      pos = 0; warp = 40;
      document.body.classList.add("warp");
      setTimeout(() => document.body.classList.remove("warp"), 1600);
      scrollTo({ top: 0 }); showToast("+30 lives. Hyperspace engaged 🚀");
      if (!running) { reduced || start(); }
    }
  });

  $("#year").textContent = new Date().getFullYear();
})();
