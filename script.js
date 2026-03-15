/* Kerolos Essa — portfolio interactions (no frameworks) */

(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

  // Dark/Light Mode (required: toggle body.light-mode)
  const THEME_KEY = "ke_theme_v2";
  const body = document.body;
  const themeToggle = $("[data-theme-toggle]");

  function setLightMode(isLight) {
    body.classList.toggle("light-mode", isLight);
    try {
      localStorage.setItem(THEME_KEY, isLight ? "light" : "dark");
    } catch {
      // ignore
    }
  }

  function initTheme() {
    let saved = null;
    try {
      saved = localStorage.getItem(THEME_KEY);
    } catch {
      saved = null;
    }
    if (saved === "light") return setLightMode(true);
    if (saved === "dark") return setLightMode(false);
    const systemLight = window.matchMedia?.("(prefers-color-scheme: light)")?.matches ?? false;
    setLightMode(systemLight);
  }

  initTheme();

  themeToggle?.addEventListener("click", () => {
    setLightMode(!body.classList.contains("light-mode"));
  });

  // Mobile nav
  const header = $("[data-header]");
  const nav = $("[data-nav]");
  const navToggle = $("[data-nav-toggle]");

  function setNavOpen(open) {
    if (!nav || !navToggle) return;
    nav.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
  }

  navToggle?.addEventListener("click", () => setNavOpen(!nav?.classList.contains("is-open")));

  // Close nav on link click (mobile)
  $$(".nav__link", nav ?? document).forEach((link) => {
    link.addEventListener("click", () => setNavOpen(false));
  });

  // Close nav on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    setNavOpen(false);
  });

  // Smooth scroll (fallback for browsers where CSS is disabled)
  function smoothScrollToId(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
  }

  $$(".nav__link").forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href") || "";
      if (!href.startsWith("#")) return;
      const id = href.slice(1);
      if (!id) return;
      e.preventDefault();
      smoothScrollToId(id);
      history.replaceState(null, "", `#${id}`);
    });
  });

  // Header compact + progress bar
  const progressBar = $("[data-progress]");
  function onScroll() {
    const y = window.scrollY || 0;
    if (header) header.classList.toggle("is-compact", y > 8);

    const doc = document.documentElement;
    const scrollable = Math.max(1, doc.scrollHeight - doc.clientHeight);
    const pct = Math.min(100, Math.max(0, (y / scrollable) * 100));
    if (progressBar) progressBar.style.width = `${pct}%`;
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Hero lightweight animated "code" background
  const heroCode = $("[data-hero-code]");
  if (heroCode && !prefersReducedMotion) {
    const symbols = ["</>", "{ }", "=>", "()", "[]", "SQL", "API", "git", "npm", "var", "const", "let", "JSON", ".env"];
    const count = Math.min(22, Math.max(14, Math.round(window.innerWidth / 70)));
    const seed = () => Math.random();
    heroCode.replaceChildren();

    for (let i = 0; i < count; i += 1) {
      const s = document.createElement("span");
      s.className = "code-float";
      s.textContent = symbols[(symbols.length * seed()) | 0];
      s.style.setProperty("--x", `${(seed() * 100).toFixed(2)}%`);
      s.style.setProperty("--y", `${(seed() * 100).toFixed(2)}%`);
      s.style.setProperty("--s", `${(12 + seed() * 10).toFixed(1)}px`);
      s.style.setProperty("--d", `${(8 + seed() * 10).toFixed(1)}s`);
      s.style.animationDelay = `${(-seed() * 10).toFixed(2)}s`;
      heroCode.appendChild(s);
    }
  }

  // Active section link (IntersectionObserver)
  const sections = ["home", "about", "tech", "projects", "services", "contact"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const navLinksByHash = new Map($$(".nav__link").map((a) => [a.getAttribute("href"), a]));

  function setActiveLink(hash) {
    $$(".nav__link").forEach((a) => a.classList.remove("is-active"));
    const active = navLinksByHash.get(hash);
    if (active) active.classList.add("is-active");
  }

  if ("IntersectionObserver" in window && sections.length) {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];
        if (!visible?.target?.id) return;
        setActiveLink(`#${visible.target.id}`);
      },
      { root: null, threshold: [0.25, 0.35, 0.5], rootMargin: "-20% 0px -65% 0px" }
    );
    sections.forEach((s) => obs.observe(s));
  } else {
    // Basic fallback: set based on location hash
    if (location.hash) setActiveLink(location.hash);
  }

  // Scroll reveal
  const revealEls = $$(".reveal");
  if ("IntersectionObserver" in window && revealEls.length && !prefersReducedMotion) {
    // Add subtle stagger for groups of cards
    revealEls.forEach((el, idx) => {
      el.dataset.delay = "1";
      el.style.setProperty("--delay", `${Math.min(220, (idx % 6) * 55)}ms`);
    });
    const revealObs = new IntersectionObserver(
      (entries, o) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("is-visible");
          o.unobserve(e.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
    );
    revealEls.forEach((el) => revealObs.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  // Back to top
  const toTop = $("[data-to-top]");
  const fabTop = $("[data-fab-top]");
  toTop?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
    setNavOpen(false);
  });
  fabTop?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
    setNavOpen(false);
  });

  // Show/hide floating back-to-top
  function updateFab() {
    if (!fabTop) return;
    const y = window.scrollY || 0;
    fabTop.classList.toggle("is-visible", y > 520);
  }
  window.addEventListener("scroll", updateFab, { passive: true });
  updateFab();

  // Button ripple effect
  function addRipple(e, el) {
    const rect = el.getBoundingClientRect();
    const x = (e.clientX ?? rect.left + rect.width / 2) - rect.left;
    const y = (e.clientY ?? rect.top + rect.height / 2) - rect.top;
    el.style.setProperty("--rx", `${x}px`);
    el.style.setProperty("--ry", `${y}px`);
    el.classList.remove("is-rippling");
    // Force reflow to restart animation
    void el.offsetWidth;
    el.classList.add("is-rippling");
    window.setTimeout(() => el.classList.remove("is-rippling"), 760);
  }

  $$("[data-ripple]").forEach((el) => {
    el.addEventListener("click", (e) => addRipple(e, el), { passive: true });
  });

  // Subtle tilt micro-interaction (pointer)
  const tiltEls = $$("[data-tilt]");
  if (!prefersReducedMotion && tiltEls.length) {
    const strength = 6; // degrees
    tiltEls.forEach((el) => {
      let raf = 0;
      function onMove(e) {
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const r = el.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width;
          const py = (e.clientY - r.top) / r.height;
          const rx = (py - 0.5) * -strength;
          const ry = (px - 0.5) * strength;
          el.style.transform = `translateY(-3px) rotateX(${rx}deg) rotateY(${ry}deg)`;
        });
      }
      function onLeave() {
        if (raf) cancelAnimationFrame(raf);
        el.style.transform = "";
      }
      el.addEventListener("mousemove", onMove);
      el.addEventListener("mouseleave", onLeave);
    });
  }

  // Form validation
  const form = $("[data-contact-form]");
  const note = $("[data-form-note]");
  const nameInput = $("#name");
  const emailInput = $("#email");
  const messageInput = $("#message");

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

  function setFieldError(input, msg) {
    if (!input) return;
    const field = input.closest(".field");
    const err = $(`[data-error-for="${input.name}"]`, form ?? document);
    if (field) field.classList.toggle("is-invalid", Boolean(msg));
    if (err) err.textContent = msg || "";
  }

  function validate() {
    let ok = true;
    const name = (nameInput?.value || "").trim();
    const email = (emailInput?.value || "").trim();
    const message = (messageInput?.value || "").trim();

    if (name.length < 2) {
      setFieldError(nameInput, "Please enter your name (at least 2 characters).");
      ok = false;
    } else setFieldError(nameInput, "");

    if (!emailRegex.test(email)) {
      setFieldError(emailInput, "Please enter a valid email address.");
      ok = false;
    } else setFieldError(emailInput, "");

    if (message.length < 10) {
      setFieldError(messageInput, "Please enter a message (at least 10 characters).");
      ok = false;
    } else setFieldError(messageInput, "");

    return ok;
  }

  [nameInput, emailInput, messageInput].forEach((input) => {
    input?.addEventListener("input", () => {
      if (!form) return;
      validate();
    });
  });

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const ok = validate();
    if (!note) return;

    if (!ok) {
      note.textContent = "Please fix the highlighted fields and try again.";
      note.style.color = "var(--bad)";
      return;
    }

    // No backend here; show a friendly success state.
    note.textContent = "Message ready to send. Hook this form to your backend or email service when deployed.";
    note.style.color = "var(--good)";
    form.reset();
    window.setTimeout(() => {
      note.textContent = "";
      note.style.color = "";
    }, 5200);
  });

  // Close mobile nav when clicking outside
  document.addEventListener("click", (e) => {
    if (!nav || !navToggle) return;
    if (!nav.classList.contains("is-open")) return;
    const target = e.target;
    if (!(target instanceof Element)) return;
    if (nav.contains(target) || navToggle.contains(target)) return;
    setNavOpen(false);
  });

  // ── GitHub API — Auto-load repos into Projects section ──────────────────
  const GITHUB_USERNAME = "KerolosEssa1";
  const SKIP_REPOS = new Set([
    "KerolosEssa1", "KerolosEssa2", "thmsgbrt", "portfolio",
    "my-project", "My-Study-Archive", "vulnerability-Checklist"
  ]);

  // Map language → display name + pill colour
  const LANG_COLORS = {
    PHP:        { color: "#7a86b8" },
    JavaScript: { color: "#f7df1e" },
    HTML:       { color: "#e44d26" },
    CSS:        { color: "#264de4" },
    TypeScript: { color: "#3178c6" },
    Python:     { color: "#3572A5" },
    default:    { color: "var(--accent2)" },
  };

  // Generate a gradient SVG placeholder based on repo name
  function repoPlaceholder(name) {
    const safe = name.replace(/[<>&"']/g, "").substring(0, 32);
    return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1280' height='720'><defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'><stop stop-color='%2338bdf8' stop-opacity='0.35'/><stop offset='1' stop-color='%236366f1' stop-opacity='0.35'/></linearGradient></defs><rect width='100%25' height='100%25' fill='%230f172a'/><rect width='100%25' height='100%25' fill='url(%23g)'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23f8fafc' font-family='Inter,Segoe UI,Arial' font-size='42' font-weight='700'>${safe}</text></svg>`;
  }

  // Format repo name: "ecommerce-project" → "Ecommerce Project"
  function formatName(raw) {
    return raw
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function buildProjectCard(repo) {
    const langInfo = LANG_COLORS[repo.language] || LANG_COLORS.default;
    const desc = repo.description || "A project on GitHub.";
    const name = formatName(repo.name);

    const article = document.createElement("article");
    article.className = "project-card reveal";
    article.innerHTML = `
      <div class="project-card__media">
        <img class="project-card__img"
          alt="${name} project preview"
          src="${repoPlaceholder(name)}"
          loading="lazy"
        />
      </div>
      <div class="project-card__body">
        <h3 class="project-card__title">${name}</h3>
        <p class="project-card__desc">${desc}</p>
        <div class="project-card__meta">
          ${repo.language ? `<span class="pill" style="border-color:${langInfo.color}40;color:${langInfo.color}">${repo.language}</span>` : ""}
          ${repo.stargazers_count > 0 ? `<span class="pill">⭐ ${repo.stargazers_count}</span>` : ""}
        </div>
        <div class="project-card__actions">
          <a class="btn btn--sm btn--primary"
            href="${repo.html_url}"
            target="_blank" rel="noreferrer" data-ripple>GitHub</a>
          ${repo.homepage ? `<a class="btn btn--sm btn--ghost" href="${repo.homepage}" target="_blank" rel="noreferrer" data-ripple>Live Demo</a>` : ""}
        </div>
      </div>`;

    // Wire ripple on new buttons
    article.querySelectorAll("[data-ripple]").forEach((el) => {
      el.addEventListener("click", (e) => addRipple(e, el), { passive: true });
    });

    return article;
  }

  async function loadGithubProjects() {
    const grid = $("[data-projects-grid]");
    const loader = $("[data-projects-loader]");
    if (!grid) return;

    try {
      const res = await fetch(
        `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=30`
      );
      if (!res.ok) throw new Error(`GitHub API: ${res.status}`);
      const repos = await res.json();

      const filtered = repos.filter(
        (r) => !r.fork && !SKIP_REPOS.has(r.name) && r.size > 0
      );

      if (filtered.length === 0) throw new Error("No suitable repos found");

      // Remove loader + static fallback cards
      grid.innerHTML = "";

      // Insert GitHub cards
      filtered.forEach((repo) => {
        const card = buildProjectCard(repo);
        grid.appendChild(card);
      });

      // Re-run reveal observer on new cards
      const newCards = Array.from(grid.querySelectorAll(".reveal"));
      newCards.forEach((el, idx) => {
        el.style.setProperty("--delay", `${Math.min(220, (idx % 6) * 55)}ms`);
      });
      if ("IntersectionObserver" in window && !prefersReducedMotion) {
        const obs = new IntersectionObserver(
          (entries, o) => {
            entries.forEach((e) => {
              if (!e.isIntersecting) return;
              e.target.classList.add("is-visible");
              o.unobserve(e.target);
            });
          },
          { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
        );
        newCards.forEach((el) => obs.observe(el));
      } else {
        newCards.forEach((el) => el.classList.add("is-visible"));
      }
    } catch (err) {
      // On any error: just remove the loader and keep the static cards
      console.warn("GitHub projects load failed:", err);
      loader?.remove();
      // Make existing static cards visible
      $$(`.project-card`, grid).forEach((el) => el.classList.add("is-visible"));
    }
  }

  loadGithubProjects();
})();


/* Kerolos Essa — portfolio interactions (no frameworks) */

(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

  // Dark/Light Mode (required: toggle body.light-mode)
  const THEME_KEY = "ke_theme_v2";
  const body = document.body;
  const themeToggle = $("[data-theme-toggle]");

  function setLightMode(isLight) {
    body.classList.toggle("light-mode", isLight);
    try {
      localStorage.setItem(THEME_KEY, isLight ? "light" : "dark");
    } catch {
      // ignore
    }
  }

  function initTheme() {
    let saved = null;
    try {
      saved = localStorage.getItem(THEME_KEY);
    } catch {
      saved = null;
    }
    if (saved === "light") return setLightMode(true);
    if (saved === "dark") return setLightMode(false);
    const systemLight = window.matchMedia?.("(prefers-color-scheme: light)")?.matches ?? false;
    setLightMode(systemLight);
  }

  initTheme();

  themeToggle?.addEventListener("click", () => {
    setLightMode(!body.classList.contains("light-mode"));
  });

  // Mobile nav
  const header = $("[data-header]");
  const nav = $("[data-nav]");
  const navToggle = $("[data-nav-toggle]");

  function setNavOpen(open) {
    if (!nav || !navToggle) return;
    nav.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
  }

  navToggle?.addEventListener("click", () => setNavOpen(!nav?.classList.contains("is-open")));

  // Close nav on link click (mobile)
  $$(".nav__link", nav ?? document).forEach((link) => {
    link.addEventListener("click", () => setNavOpen(false));
  });

  // Close nav on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    setNavOpen(false);
  });

  // Smooth scroll (fallback for browsers where CSS is disabled)
  function smoothScrollToId(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
  }

  $$(".nav__link").forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href") || "";
      if (!href.startsWith("#")) return;
      const id = href.slice(1);
      if (!id) return;
      e.preventDefault();
      smoothScrollToId(id);
      history.replaceState(null, "", `#${id}`);
    });
  });

  // Header compact + progress bar
  const progressBar = $("[data-progress]");
  function onScroll() {
    const y = window.scrollY || 0;
    if (header) header.classList.toggle("is-compact", y > 8);

    const doc = document.documentElement;
    const scrollable = Math.max(1, doc.scrollHeight - doc.clientHeight);
    const pct = Math.min(100, Math.max(0, (y / scrollable) * 100));
    if (progressBar) progressBar.style.width = `${pct}%`;
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Hero lightweight animated "code" background
  const heroCode = $("[data-hero-code]");
  if (heroCode && !prefersReducedMotion) {
    const symbols = ["</>", "{ }", "=>", "()", "[]", "SQL", "API", "git", "npm", "var", "const", "let", "JSON", ".env"];
    const count = Math.min(22, Math.max(14, Math.round(window.innerWidth / 70)));
    const seed = () => Math.random();
    heroCode.replaceChildren();

    for (let i = 0; i < count; i += 1) {
      const s = document.createElement("span");
      s.className = "code-float";
      s.textContent = symbols[(symbols.length * seed()) | 0];
      s.style.setProperty("--x", `${(seed() * 100).toFixed(2)}%`);
      s.style.setProperty("--y", `${(seed() * 100).toFixed(2)}%`);
      s.style.setProperty("--s", `${(12 + seed() * 10).toFixed(1)}px`);
      s.style.setProperty("--d", `${(8 + seed() * 10).toFixed(1)}s`);
      s.style.animationDelay = `${(-seed() * 10).toFixed(2)}s`;
      heroCode.appendChild(s);
    }
  }

  // Active section link (IntersectionObserver)
  const sections = ["home", "about", "tech", "projects", "services", "contact"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const navLinksByHash = new Map($$(".nav__link").map((a) => [a.getAttribute("href"), a]));

  function setActiveLink(hash) {
    $$(".nav__link").forEach((a) => a.classList.remove("is-active"));
    const active = navLinksByHash.get(hash);
    if (active) active.classList.add("is-active");
  }

  if ("IntersectionObserver" in window && sections.length) {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];
        if (!visible?.target?.id) return;
        setActiveLink(`#${visible.target.id}`);
      },
      { root: null, threshold: [0.25, 0.35, 0.5], rootMargin: "-20% 0px -65% 0px" }
    );
    sections.forEach((s) => obs.observe(s));
  } else {
    // Basic fallback: set based on location hash
    if (location.hash) setActiveLink(location.hash);
  }

  // Scroll reveal
  const revealEls = $$(".reveal");
  if ("IntersectionObserver" in window && revealEls.length && !prefersReducedMotion) {
    // Add subtle stagger for groups of cards
    revealEls.forEach((el, idx) => {
      el.dataset.delay = "1";
      el.style.setProperty("--delay", `${Math.min(220, (idx % 6) * 55)}ms`);
    });
    const revealObs = new IntersectionObserver(
      (entries, o) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("is-visible");
          o.unobserve(e.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
    );
    revealEls.forEach((el) => revealObs.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  // Back to top
  const toTop = $("[data-to-top]");
  const fabTop = $("[data-fab-top]");
  toTop?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
    setNavOpen(false);
  });
  fabTop?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
    setNavOpen(false);
  });

  // Show/hide floating back-to-top
  function updateFab() {
    if (!fabTop) return;
    const y = window.scrollY || 0;
    fabTop.classList.toggle("is-visible", y > 520);
  }
  window.addEventListener("scroll", updateFab, { passive: true });
  updateFab();

  // Button ripple effect
  function addRipple(e, el) {
    const rect = el.getBoundingClientRect();
    const x = (e.clientX ?? rect.left + rect.width / 2) - rect.left;
    const y = (e.clientY ?? rect.top + rect.height / 2) - rect.top;
    el.style.setProperty("--rx", `${x}px`);
    el.style.setProperty("--ry", `${y}px`);
    el.classList.remove("is-rippling");
    // Force reflow to restart animation
    void el.offsetWidth;
    el.classList.add("is-rippling");
    window.setTimeout(() => el.classList.remove("is-rippling"), 760);
  }

  $$("[data-ripple]").forEach((el) => {
    el.addEventListener("click", (e) => addRipple(e, el), { passive: true });
  });

  // Subtle tilt micro-interaction (pointer)
  const tiltEls = $$("[data-tilt]");
  if (!prefersReducedMotion && tiltEls.length) {
    const strength = 6; // degrees
    tiltEls.forEach((el) => {
      let raf = 0;
      function onMove(e) {
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const r = el.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width;
          const py = (e.clientY - r.top) / r.height;
          const rx = (py - 0.5) * -strength;
          const ry = (px - 0.5) * strength;
          el.style.transform = `translateY(-3px) rotateX(${rx}deg) rotateY(${ry}deg)`;
        });
      }
      function onLeave() {
        if (raf) cancelAnimationFrame(raf);
        el.style.transform = "";
      }
      el.addEventListener("mousemove", onMove);
      el.addEventListener("mouseleave", onLeave);
    });
  }

  // Form validation
  const form = $("[data-contact-form]");
  const note = $("[data-form-note]");
  const nameInput = $("#name");
  const emailInput = $("#email");
  const messageInput = $("#message");

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

  function setFieldError(input, msg) {
    if (!input) return;
    const field = input.closest(".field");
    const err = $(`[data-error-for="${input.name}"]`, form ?? document);
    if (field) field.classList.toggle("is-invalid", Boolean(msg));
    if (err) err.textContent = msg || "";
  }

  function validate() {
    let ok = true;
    const name = (nameInput?.value || "").trim();
    const email = (emailInput?.value || "").trim();
    const message = (messageInput?.value || "").trim();

    if (name.length < 2) {
      setFieldError(nameInput, "Please enter your name (at least 2 characters).");
      ok = false;
    } else setFieldError(nameInput, "");

    if (!emailRegex.test(email)) {
      setFieldError(emailInput, "Please enter a valid email address.");
      ok = false;
    } else setFieldError(emailInput, "");

    if (message.length < 10) {
      setFieldError(messageInput, "Please enter a message (at least 10 characters).");
      ok = false;
    } else setFieldError(messageInput, "");

    return ok;
  }

  [nameInput, emailInput, messageInput].forEach((input) => {
    input?.addEventListener("input", () => {
      if (!form) return;
      validate();
    });
  });

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const ok = validate();
    if (!note) return;

    if (!ok) {
      note.textContent = "Please fix the highlighted fields and try again.";
      note.style.color = "var(--bad)";
      return;
    }

    // No backend here; show a friendly success state.
    note.textContent = "Message ready to send. Hook this form to your backend or email service when deployed.";
    note.style.color = "var(--good)";
    form.reset();
    window.setTimeout(() => {
      note.textContent = "";
      note.style.color = "";
    }, 5200);
  });

  // Close mobile nav when clicking outside
  document.addEventListener("click", (e) => {
    if (!nav || !navToggle) return;
    if (!nav.classList.contains("is-open")) return;
    const target = e.target;
    if (!(target instanceof Element)) return;
    if (nav.contains(target) || navToggle.contains(target)) return;
    setNavOpen(false);
  });

  // ── GitHub API — Auto-load repos into Projects section ──────────────────
  const GITHUB_USERNAME = "KerolosEssa1";
  const SKIP_REPOS = new Set([
    "KerolosEssa1", "KerolosEssa2", "thmsgbrt", "portfolio",
    "my-project", "My-Study-Archive", "vulnerability-Checklist"
  ]);

  // Map language → display name + pill colour
  const LANG_COLORS = {
    PHP:        { color: "#7a86b8" },
    JavaScript: { color: "#f7df1e" },
    HTML:       { color: "#e44d26" },
    CSS:        { color: "#264de4" },
    TypeScript: { color: "#3178c6" },
    Python:     { color: "#3572A5" },
    default:    { color: "var(--accent2)" },
  };

  // Generate a gradient SVG placeholder based on repo name
  function repoPlaceholder(name) {
    const safe = name.replace(/[<>&"']/g, "").substring(0, 32);
    return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1280' height='720'><defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'><stop stop-color='%2338bdf8' stop-opacity='0.35'/><stop offset='1' stop-color='%236366f1' stop-opacity='0.35'/></linearGradient></defs><rect width='100%25' height='100%25' fill='%230f172a'/><rect width='100%25' height='100%25' fill='url(%23g)'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23f8fafc' font-family='Inter,Segoe UI,Arial' font-size='42' font-weight='700'>${safe}</text></svg>`;
  }

  // Format repo name: "ecommerce-project" → "Ecommerce Project"
  function formatName(raw) {
    return raw
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function buildProjectCard(repo) {
    const langInfo = LANG_COLORS[repo.language] || LANG_COLORS.default;
    const desc = repo.description || "A project on GitHub.";
    const name = formatName(repo.name);

    const article = document.createElement("article");
    article.className = "project-card reveal";
    article.innerHTML = `
      <div class="project-card__media">
        <img class="project-card__img"
          alt="${name} project preview"
          src="${repoPlaceholder(name)}"
          loading="lazy"
        />
      </div>
      <div class="project-card__body">
        <h3 class="project-card__title">${name}</h3>
        <p class="project-card__desc">${desc}</p>
        <div class="project-card__meta">
          ${repo.language ? `<span class="pill" style="border-color:${langInfo.color}40;color:${langInfo.color}">${repo.language}</span>` : ""}
          ${repo.stargazers_count > 0 ? `<span class="pill">⭐ ${repo.stargazers_count}</span>` : ""}
        </div>
        <div class="project-card__actions">
          <a class="btn btn--sm btn--primary"
            href="${repo.html_url}"
            target="_blank" rel="noreferrer" data-ripple>GitHub</a>
          ${repo.homepage ? `<a class="btn btn--sm btn--ghost" href="${repo.homepage}" target="_blank" rel="noreferrer" data-ripple>Live Demo</a>` : ""}
        </div>
      </div>`;

    // Wire ripple on new buttons
    article.querySelectorAll("[data-ripple]").forEach((el) => {
      el.addEventListener("click", (e) => addRipple(e, el), { passive: true });
    });

    return article;
  }

  async function loadGithubProjects() {
    const grid = $("[data-projects-grid]");
    const loader = $("[data-projects-loader]");
    if (!grid) return;

    try {
      const res = await fetch(
        `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=30`
      );
      if (!res.ok) throw new Error(`GitHub API: ${res.status}`);
      const repos = await res.json();

      const filtered = repos.filter(
        (r) => !r.fork && !SKIP_REPOS.has(r.name) && r.size > 0
      );

      if (filtered.length === 0) throw new Error("No suitable repos found");

      // Remove loader + static fallback cards
      grid.innerHTML = "";

      // Insert GitHub cards
      filtered.forEach((repo) => {
        const card = buildProjectCard(repo);
        grid.appendChild(card);
      });

      // Re-run reveal observer on new cards
      const newCards = Array.from(grid.querySelectorAll(".reveal"));
      newCards.forEach((el, idx) => {
        el.style.setProperty("--delay", `${Math.min(220, (idx % 6) * 55)}ms`);
      });
      if ("IntersectionObserver" in window && !prefersReducedMotion) {
        const obs = new IntersectionObserver(
          (entries, o) => {
            entries.forEach((e) => {
              if (!e.isIntersecting) return;
              e.target.classList.add("is-visible");
              o.unobserve(e.target);
            });
          },
          { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
        );
        newCards.forEach((el) => obs.observe(el));
      } else {
        newCards.forEach((el) => el.classList.add("is-visible"));
      }
    } catch (err) {
      // On any error: just remove the loader and keep the static cards
      console.warn("GitHub projects load failed:", err);
      loader?.remove();
      // Make existing static cards visible
      $$(`.project-card`, grid).forEach((el) => el.classList.add("is-visible"));
    }
  }

  loadGithubProjects();
})();

