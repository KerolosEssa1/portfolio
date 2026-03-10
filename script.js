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

  // Hero role typing animation
  const roleEl = $("[data-typing-role]");
  const rolePhrases = ["Full Stack Developer", "Building Modern Web Applications"];
  if (roleEl && !prefersReducedMotion) {
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    const baseText = "";
    const typingSpeed = 70;
    const pauseBetween = 1400;

    function tick() {
      const phrase = rolePhrases[phraseIndex];
      if (!isDeleting) {
        charIndex += 1;
      } else {
        charIndex -= 1;
      }
      const next = phrase.slice(0, Math.max(0, charIndex));
      roleEl.textContent = `${baseText}${next}`;

      let nextDelay = typingSpeed;
      if (!isDeleting && charIndex === phrase.length) {
        nextDelay = pauseBetween;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % rolePhrases.length;
        nextDelay = 400;
      }
      window.setTimeout(tick, nextDelay);
    }

    // small delay to avoid jarring on load
    window.setTimeout(tick, 550);
  }

  // Hero terminal intro typing
  const heroLines = [
    { el: $('[data-hero-line="0"]'), text: "> kerolos@dev:~$ loading portfolio..." },
    { el: $('[data-hero-line="1"]'), text: "> initializing projects..." },
    { el: $('[data-hero-line="2"]'), text: "> welcome to Kerolos.dev" },
  ];
  if (!prefersReducedMotion && heroLines.every((l) => l.el)) {
    let line = 0;
    let idx = 0;

    function typeLine() {
      const current = heroLines[line];
      if (!current) return;
      current.el.classList.add("is-visible");
      const full = current.text;
      current.el.textContent = full.slice(0, idx + 1);
      idx += 1;
      if (idx < full.length) {
        window.setTimeout(typeLine, 28);
      } else {
        line += 1;
        idx = 0;
        if (line < heroLines.length) {
          window.setTimeout(typeLine, 420);
        }
      }
    }
    window.setTimeout(typeLine, 900);
  } else {
    heroLines.forEach((l) => {
      if (!l.el) return;
      l.el.textContent = l.text;
      l.el.classList.add("is-visible");
    });
  }

  // Skills progress bars
  const skillBarItems = $$("[data-skill-bar]");
  if (skillBarItems.length) {
    const fillBars = () => {
      skillBarItems.forEach((item) => {
        const target = parseInt(item.getAttribute("data-skill-percent") || "0", 10);
        const fill = $(".skills-bars__fill", item);
        if (!fill) return;
        // only animate once
        if (fill.dataset.filled === "1") return;
        fill.dataset.filled = "1";
        window.requestAnimationFrame(() => {
          fill.style.width = `${Math.min(100, Math.max(0, target))}%`;
          fill.classList.add("is-filled");
        });
      });
    };

    if ("IntersectionObserver" in window && !prefersReducedMotion) {
      const obs = new IntersectionObserver(
        (entries, o) => {
          entries.forEach((e) => {
            if (!e.isIntersecting) return;
            fillBars();
            o.disconnect();
          });
        },
        { threshold: 0.25 }
      );
      obs.observe(document.getElementById("skills") || skillBarItems[0]);
    } else {
      fillBars();
    }
  }

  // Cursor trail (lightweight)
  if (!prefersReducedMotion) {
    let lastTime = 0;
    const maxDots = 24;
    const dots = [];

    function addDot(x, y) {
      const dot = document.createElement("div");
      dot.className = "cursor-dot";
      dot.style.left = `${x}px`;
      dot.style.top = `${y}px`;
      document.body.appendChild(dot);
      dots.push(dot);
      if (dots.length > maxDots) {
        const old = dots.shift();
        old?.remove();
      }
      window.requestAnimationFrame(() => {
        dot.style.opacity = "0";
        dot.style.transform = "translate(-50%, -50%) scale(1.4)";
      });
      window.setTimeout(() => dot.remove(), 550);
    }

    window.addEventListener(
      "pointermove",
      (e) => {
        const now = performance.now();
        if (now - lastTime < 22) return;
        lastTime = now;
        addDot(e.clientX, e.clientY);
      },
      { passive: true }
    );
  }

  // GitHub repo count
  const repoCountEl = $("[data-github-repos]");
  if (repoCountEl) {
    fetch("https://api.github.com/users/KerolosEssa1")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data || typeof data.public_repos !== "number") return;
        repoCountEl.textContent = String(data.public_repos);
      })
      .catch(() => {
        // ignore network issues
      });
  }

  // Interactive terminal
  const terminal = $("[data-terminal]");
  const terminalOutput = $("[data-terminal-output]");
  const terminalInput = $("[data-terminal-input]");
  const sectionMap = {
    about: "about",
    projects: "projects",
    skills: "skills",
    contact: "contact",
    services: "services",
    github: "github",
  };

  function appendTerminalLine(text) {
    if (!terminalOutput) return;
    const line = document.createElement("div");
    line.className = "dev-terminal__line";
    const span = document.createElement("span");
    span.dataset.terminalOutputText = "1";
    span.textContent = text;
    line.appendChild(span);
    terminalOutput.appendChild(line);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  }

  function handleTerminalCommand(raw) {
    const cmd = raw.trim().toLowerCase();
    if (!cmd) return;
    appendTerminalLine(`$ ${cmd}`);
    if (cmd === "clear") {
      if (terminalOutput) terminalOutput.innerHTML = "";
      return;
    }
    if (cmd === "help") {
      appendTerminalLine("Available: about, projects, skills, services, contact, github, clear, help");
      return;
    }
    const sectionId = sectionMap[cmd];
    if (!sectionId) {
      appendTerminalLine(`Unknown command: ${cmd}. Try: about, projects, skills, contact, github.`);
      return;
    }
    appendTerminalLine(`Navigating to ${sectionId}...`);
    smoothScrollToId(sectionId);
    const target = document.getElementById(sectionId);
    if (target) {
      target.classList.add("section--highlight");
      window.setTimeout(() => target.classList.remove("section--highlight"), 1500);
    }
  }

  if (terminal && terminalInput && terminalOutput) {
    terminalInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const value = terminalInput.value;
        terminalInput.value = "";
        handleTerminalCommand(value);
      }
    });
  }

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
})();

