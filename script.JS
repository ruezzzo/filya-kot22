/* script.js
   - background animated floating green dots (inertia on mouse)
   - carousel with autoplay + arrows + dots
   - working search with live hints
   - hover and UI animations
*/

(() => {
  /* ======== Canvas background dots ======== */
  const canvas = document.getElementById('bg-dots');
  const ctx = canvas.getContext('2d');
  let W = (canvas.width = innerWidth);
  let H = (canvas.height = innerHeight);
  const DOT_COUNT = Math.max(18, Math.floor((W * H) / 90000));
  const dots = [];
  let mouse = { x: W / 2, y: H / 2, vx: 0, vy: 0 };

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  class Dot {
    constructor() {
      this.r = rand(6, 18) * (Math.min(W, H) / 1400 + 0.8);
      this.x = rand(0, W);
      this.y = rand(0, H);
      this.vx = rand(-0.25, 0.25);
      this.vy = rand(-0.25, 0.25);
      this.alpha = rand(0.15, 0.6);
      this.phase = rand(0, Math.PI * 2);
      this.baseR = this.r;
    }
    step() {
      this.x += this.vx + Math.sin(this.phase) * 0.12;
      this.y += this.vy + Math.cos(this.phase) * 0.12;
      this.phase += 0.01 + this.baseR / 200;

      // wrap
      if (this.x < -50) this.x = W + 50;
      if (this.x > W + 50) this.x = -50;
      if (this.y < -50) this.y = H + 50;
      if (this.y > H + 50) this.y = -50;

      // attraction to mouse
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const pull = Math.max(0, 60 - dist) / 140;
      this.vx += (dx / dist) * pull;
      this.vy += (dy / dist) * pull;

      // damping
      this.vx *= 0.995;
      this.vy *= 0.995;
    }
    draw() {
      ctx.beginPath();
      const g = ctx.createRadialGradient(
        this.x,
        this.y,
        0,
        this.x,
        this.y,
        this.r * 1.8
      );
      g.addColorStop(0, `rgba(30,240,30,${this.alpha})`);
      g.addColorStop(0.4, `rgba(30,240,30,${this.alpha * 0.25})`);
      g.addColorStop(1, `rgba(0,0,0,0)`);
      ctx.fillStyle = g;
      ctx.arc(
        this.x,
        this.y,
        this.r + Math.sin(this.phase) * 1.5,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }

  function resize() {
    W = canvas.width = innerWidth;
    H = canvas.height = innerHeight;
    while (dots.length < DOT_COUNT) dots.push(new Dot());
  }
  window.addEventListener('resize', resize);

  for (let i = 0; i < DOT_COUNT; i++) dots.push(new Dot());

  // mouse inertia
  let lastMouse = { x: W / 2, y: H / 2 };
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.vx = mouse.x - lastMouse.x;
    mouse.vy = mouse.y - lastMouse.y;
    lastMouse.x = mouse.x;
    lastMouse.y = mouse.y;
  });

  function loop() {
    ctx.clearRect(0, 0, W, H);
    for (const d of dots) {
      d.step();
      d.draw();
    }
    requestAnimationFrame(loop);
  }
  loop();

  /* ======== Fade-in animation ======== */
  document
    .querySelectorAll(
      ".product, .feature-card, .section-title, .new-content, .carousel"
    )
    .forEach((el, i) => {
      el.style.opacity = 0;
      el.style.transform = "translateY(10px)";
      setTimeout(() => {
        el.style.transition =
          "opacity 600ms ease, transform 600ms cubic-bezier(.2,.9,.3,1)";
        el.style.opacity = 1;
        el.style.transform = "translateY(0)";
      }, 120 * i);
    });

  /* ======== Carousel ======== */
  const track = document.querySelector(".carousel-track");
  const slides = Array.from(track.children);
  const leftBtn = document.querySelector(".carousel-btn.left");
  const rightBtn = document.querySelector(".carousel-btn.right");
  const dotsWrap = document.querySelector(".carousel-dots");
  let current = 0;
  let sliding = false;
  let slideWidth = null;
  let autoplayInterval = null;
  const AUTOPLAY_MS = 4200;

  function setupCarousel() {
    const windowEl = document.querySelector(".carousel-window");
    slideWidth = windowEl.clientWidth;
    slides.forEach((s) => (s.style.minWidth = slideWidth + "px"));
    moveTo(current, false);

    dotsWrap.innerHTML = "";
    slides.forEach((_, i) => {
      const b = document.createElement("button");
      b.addEventListener("click", () => {
        moveTo(i);
        resetAutoplay();
      });
      if (i === current) b.classList.add("active");
      dotsWrap.appendChild(b);
    });
  }

  function updateDots() {
    Array.from(dotsWrap.children).forEach((b, i) =>
      b.classList.toggle("active", i === current)
    );
  }

  function moveTo(idx, animate = true) {
    if (sliding) return;
    if (idx < 0) idx = slides.length - 1;
    if (idx >= slides.length) idx = 0;
    current = idx;
    sliding = true;
    track.style.transition = animate
      ? "transform 600ms cubic-bezier(.22,.9,.32,1)"
      : "none";
    track.style.transform = `translateX(${-idx * slideWidth}px)`;
    updateDots();
    setTimeout(() => (sliding = false), animate ? 650 : 30);
  }

  leftBtn.addEventListener("click", () => {
    moveTo(current - 1);
    resetAutoplay();
  });
  rightBtn.addEventListener("click", () => {
    moveTo(current + 1);
    resetAutoplay();
  });

  function startAutoplay() {
    autoplayInterval = setInterval(() => moveTo(current + 1), AUTOPLAY_MS);
  }
  function resetAutoplay() {
    clearInterval(autoplayInterval);
    startAutoplay();
  }

  window.addEventListener("load", () => {
    setupCarousel();
    startAutoplay();
  });
  window.addEventListener("resize", () => {
    setupCarousel();
  });

  /* ======== Smooth nav scroll ======== */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute("href"));
      if (target) target.scrollIntoView({ behavior: "smooth" });
    });
  });

  /* ======== Search with live hints (fixed) ======== */
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");
  const searchHints = document.getElementById("searchHints");

  function getAllProducts() {
    return Array.from(document.querySelectorAll(".product h3")).map((el) => ({
      name: el.textContent.trim(),
      element: el.closest(".product"),
    }));
  }

  function showHints(query) {
    const all = getAllProducts();
    const matches = all
      .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 6);

    searchHints.innerHTML = "";
    if (matches.length === 0) {
      searchHints.style.display = "none";
      return;
    }

    matches.forEach((match) => {
      const div = document.createElement("div");
      div.className = "hint-item";
      div.textContent = match.name;
      div.addEventListener("click", () => {
        highlight(match.element);
        searchHints.style.display = "none";
        searchInput.value = match.name;
      });
      searchHints.appendChild(div);
    });
    searchHints.style.display = "block";
  }

  function highlight(el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("search-highlight");
    setTimeout(() => el.classList.remove("search-highlight"), 2000);
  }

  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.trim();
    if (query) showHints(query);
    else searchHints.style.display = "none";
  });

  searchBtn.addEventListener("click", () => {
    const query = searchInput.value.trim();
    if (!query) return;
    const all = getAllProducts();
    const match = all.find((p) =>
      p.name.toLowerCase().includes(query.toLowerCase())
    );
    if (match) highlight(match.element);
    else alert("No headset found for: " + query);
    searchHints.style.display = "none";
  });

  /* ======== UI micro-animations ======== */
  // Button hover
  document.querySelectorAll(".btn").forEach((b) => {
    b.addEventListener("mouseenter", () => (b.style.transform = "translateY(-6px) scale(1.02)"));
    b.addEventListener("mouseleave", () => (b.style.transform = ""));
  });

  // Card tilt
  document.querySelectorAll(".product").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const rotateX = (y - rect.height / 2) / 10;
      const rotateY = (rect.width / 2 - x) / 10;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });
    card.addEventListener("mouseleave", () => (card.style.transform = ""));
  });

  // Title glitch
  const title = document.querySelector(".title");
  if (title) {
    title.addEventListener("mouseenter", function () {
      const original = this.textContent;
      let i = 0;
      const interval = setInterval(() => {
        this.textContent = original
          .split("")
          .map((c, idx) =>
            idx < i ? original[idx] : String.fromCharCode(33 + Math.random() * 94)
          )
          .join("");
        if (++i > 8) {
          clearInterval(interval);
          this.textContent = original;
        }
      }, 50);
    });
  }

  // Price pulse
  setInterval(() => {
    document.querySelectorAll(".price").forEach((p) => {
      p.style.animation = "pricePulse 0.6s ease-out";
      setTimeout(() => (p.style.animation = ""), 600);
    });
  }, 3000);

  // Float badges
  document.querySelectorAll(".discount-badge, .badge").forEach((b, i) => {
    b.style.animation = `floatBadge 3s ease-in-out ${i * 0.5}s infinite`;
  });
})();
/* ===== SEARCH SYSTEM (header pop-up + typing hints) ===== */
(() => {
  const toggleBtn = document.getElementById("toggleSearch");
  const panel = document.getElementById("searchPanel");
  const input = document.getElementById("searchInput");
  const btn = document.getElementById("searchBtn");
  const hints = document.getElementById("searchHints");

  // Toggle popup
  toggleBtn.addEventListener("click", () => {
    panel.classList.toggle("active");
    input.focus();
    if (!panel.classList.contains("active")) hints.style.display = "none";
  });

  // Close if clicked outside
  document.addEventListener("click", (e) => {
    if (!panel.contains(e.target) && !toggleBtn.contains(e.target))
      panel.classList.remove("active");
  });
  const closeBtn = document.getElementById("closeSearch");
  closeBtn.addEventListener("click", () => {
  panel.classList.remove("active");
  });

  // Get all products
  function getProducts() {
    return Array.from(document.querySelectorAll(".product h3")).map((el) => ({
      name: el.textContent.trim(),
      el: el.closest(".product"),
    }));
  }

  // Typing animation for hint text
  function typeText(element, text, speed = 25) {
    element.textContent = "";
    let i = 0;
    const interval = setInterval(() => {
      element.textContent += text[i++];
      if (i >= text.length) clearInterval(interval);
    }, speed);
  }

  // Show hints with typing
  function showHints(query) {
    const all = getProducts();
    const matches = all.filter((p) =>
      p.name.toLowerCase().includes(query.toLowerCase())
    );
    hints.innerHTML = "";
    if (!matches.length) {
      hints.style.display = "none";
      return;
    }
    hints.style.display = "block";
    matches.slice(0, 6).forEach((m) => {
      const div = document.createElement("div");
      div.className = "hint-item";
      hints.appendChild(div);
      typeText(div, m.name);
      div.addEventListener("click", () => {
        scrollToProduct(m.el);
        hints.style.display = "none";
        input.value = m.name;
      });
    });
  }

  // Highlight & scroll to headset
  function scrollToProduct(el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("search-highlight");
    setTimeout(() => el.classList.remove("search-highlight"), 2000);
  }

  input.addEventListener("input", (e) => {
    const q = e.target.value.trim();
    if (q) showHints(q);
    else hints.style.display = "none";
  });

  btn.addEventListener("click", () => {
    const q = input.value.trim();
    if (!q) return;
    const all = getProducts();
    const found = all.find((p) =>
      p.name.toLowerCase().includes(q.toLowerCase())
    );
    if (found) scrollToProduct(found.el);
    else alert("No headset found for: " + q);
    hints.style.display = "none";
  });
})();
