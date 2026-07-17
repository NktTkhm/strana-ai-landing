/* =========================================================
   Хаб из 5 карточек · ГК Страна Девелопмент
   Клик по карточке → разворот в полноэкранную «страницу» (GSAP Flip)
   ========================================================= */
(function () {
  "use strict";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (window.gsap && window.Flip) gsap.registerPlugin(Flip);

  /* ---------- Переключатель темы (тёмная по умолчанию, выбор сохраняется) ---------- */
  (function theme() {
    const root = document.documentElement;
    let saved;
    try { saved = localStorage.getItem("theme"); } catch (e) {}
    if (saved === "light") root.setAttribute("data-theme", "light");
    const btn = document.querySelector("[data-theme-toggle]");
    if (btn) btn.addEventListener("click", () => {
      const light = root.getAttribute("data-theme") === "light";
      if (light) root.removeAttribute("data-theme"); else root.setAttribute("data-theme", "light");
      try { localStorage.setItem("theme", light ? "dark" : "light"); } catch (e) {}
    });
  })();
  const cards = Array.from(document.querySelectorAll("[data-card]"));
  let openCard = null;

  const face = (c) => c.querySelector(".card__face");
  const page = (c) => c.querySelector(".card__page");

  // Клон иконки → крупный водяной знак по центру карточки
  cards.forEach((c) => {
    const svg = c.querySelector(".card__icon svg");
    if (!svg) return;
    const ghost = document.createElement("span");
    ghost.className = "card__ghost";
    ghost.setAttribute("aria-hidden", "true");
    ghost.appendChild(svg.cloneNode(true));
    c.insertBefore(ghost, c.querySelector(".card__face"));
  });

  function reveal(c) {
    const items = c.querySelectorAll("[data-r]");
    if (window.gsap && !reduced) {
      gsap.fromTo(items, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.07, ease: "power3.out" });
    }
  }

  function open(c) {
    if (openCard) return;
    openCard = c;
    document.body.classList.add("is-open");

    const finish = () => {
      face(c).style.opacity = "0";
      page(c).removeAttribute("hidden");
      page(c).scrollTop = 0;
      reveal(c);
    };

    if (window.gsap && window.Flip && !reduced) {
      const state = Flip.getState(c);
      c.classList.add("is-open");
      Flip.from(state, { duration: 0.6, ease: "power3.inOut", absolute: true, onComplete: finish });
    } else {
      c.classList.add("is-open");
      finish();
    }
  }

  function close() {
    const c = openCard;
    if (!c) return;
    openCard = null;
    document.body.classList.remove("is-open");
    page(c).hidden = true;

    const done = () => { face(c).style.opacity = ""; };

    if (window.gsap && window.Flip && !reduced) {
      const state = Flip.getState(c);
      c.classList.remove("is-open");
      face(c).style.opacity = "1";
      Flip.from(state, { duration: 0.55, ease: "power3.inOut", absolute: true, onComplete: done });
    } else {
      c.classList.remove("is-open");
      done();
    }
  }

  cards.forEach((c) => {
    face(c).addEventListener("click", () => open(c));
    const back = c.querySelector("[data-back]");
    if (back) back.addEventListener("click", (e) => { e.stopPropagation(); close(); });
  });

  /* ---------- Утка-каменщик: кладёт кирпичную кладку ---------- */
  (function duckBuilder() {
    const wall = document.querySelector("[data-duck-wall]");
    const bird = document.querySelector("[data-duck-bird]");
    if (!wall || !bird) return;
    const BW = 16, BH = 7, GAP = 2, COLS = 5, ROWS = 4, TOTAL = COLS * ROWS;

    const brickAt = (n) => {
      const row = Math.floor(n / COLS), col = n % COLS;
      const b = document.createElement("i");
      b.style.left = (col * (BW + GAP) + (row % 2 ? (BW + GAP) / 2 : 0)) + "px";
      b.style.bottom = (row * (BH + GAP)) + "px";
      wall.appendChild(b);
    };

    if (reduced) { // без движения — готовая стена с надписью
      for (let n = 0; n < TOTAL; n++) brickAt(n);
      wall.classList.add("is-done");
      return;
    }

    let i = 0, hold = 0;
    setInterval(() => {
      if (i >= TOTAL) { // стена готова — проявляем «Strana.AI», держим, сдаём объект
        if (hold === 0) wall.classList.add("is-done");
        hold++;
        if (hold >= 4) { // ≈5 секунд с надписью
          wall.classList.add("is-reset");
          setTimeout(() => {
            wall.querySelectorAll("i").forEach((b) => b.remove());
            wall.classList.remove("is-reset", "is-done");
          }, 550);
          i = 0; hold = 0;
        }
        return;
      }
      bird.classList.add("is-place");
      setTimeout(() => bird.classList.remove("is-place"), 470);
      setTimeout(() => brickAt(i - 1), 180); // кирпич появляется в момент «клевка»
      i++;
    }, 1300);
  })();

  /* ---------- Вертикальная лента слайдов ---------- */
  document.querySelectorAll("[data-slides]").forEach((root) => {
    const scrollEl = root.closest(".card__page");
    const track = root.querySelector("[data-slides-track]");
    const slides = track.querySelectorAll("[data-slide]");
    const prev = root.querySelector("[data-slide-prev]");
    const next = root.querySelector("[data-slide-next]");
    const dotsRoot = root.querySelector("[data-slide-dots]");
    const iEl = root.querySelector("[data-slide-i]");
    const nEl = root.querySelector("[data-slide-n]");
    const n = slides.length;
    let idx = 0;
    let scrollTick = false;

    if (!scrollEl || !n) return;
    if (nEl) nEl.textContent = n;

    const dots = [];
    if (dotsRoot) {
      slides.forEach((_, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "slides__dot";
        b.setAttribute("aria-label", "Слайд " + (i + 1));
        b.addEventListener("click", () => go(i));
        dotsRoot.appendChild(b);
        dots.push(b);
      });
    }

    const syncIdx = () => {
      const rootTop = scrollEl.getBoundingClientRect().top;
      const mark = rootTop + scrollEl.clientHeight * 0.35;
      let best = 0;
      let bestDist = Infinity;
      slides.forEach((s, i) => {
        const d = Math.abs(s.getBoundingClientRect().top - mark);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      if (best !== idx) { idx = best; updUI(); }
    };

    const updUI = () => {
      if (iEl) iEl.textContent = idx + 1;
      if (prev) prev.disabled = idx === 0;
      if (next) next.disabled = idx === n - 1;
      dots.forEach((d, i) => d.classList.toggle("is-on", i === idx));
    };

    const go = (t) => {
      const target = Math.min(n - 1, Math.max(0, t));
      if (target === idx) return;
      idx = target;
      updUI();
      slides[target].scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    };

    root._go = (d) => go(idx + d);
    root._scrollEl = scrollEl;
    if (prev) prev.addEventListener("click", () => root._go(-1));
    if (next) next.addEventListener("click", () => root._go(1));

    scrollEl.addEventListener("scroll", () => {
      if (scrollTick) return;
      scrollTick = true;
      requestAnimationFrame(() => { syncIdx(); scrollTick = false; });
    }, { passive: true });

    updUI();
  });

  /* ---------- Формула К×Д×Т: анимация карточек на слайде 03 ---------- */
  document.querySelectorAll("[data-kdt]").forEach((root) => {
    const slide = root.closest("[data-slide]");
    if (!slide) return;
    const cards = root.querySelectorAll("[data-kdt-card]");
    const muls = root.querySelectorAll("[data-kdt-mul]");
    const warn = root.querySelector("[data-kdt-warn]");
    let played = false;

    if (!reduced && window.gsap) {
      gsap.set([...cards, ...muls, warn].filter(Boolean), { opacity: 0 });
    }

    const play = () => {
      if (played || reduced || !window.gsap) return;
      played = true;

      gsap.set(cards, { opacity: 0, y: 48, scale: 0.9 });
      gsap.set(muls, { opacity: 0, scale: 0.35 });
      if (warn) gsap.set(warn, { opacity: 0, y: 20, scale: 0.95 });

      const tl = gsap.timeline();
      tl.to(cards, { opacity: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.16, ease: "power3.out" });
      tl.to(muls, { opacity: 1, scale: 1, duration: 0.5, stagger: 0.1, ease: "back.out(2.4)" }, "-=0.5");
      if (warn) tl.to(warn, { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: "power3.out" }, "-=0.1");
    };

    const reset = () => {
      played = false;
      if (!reduced && window.gsap) {
        gsap.set([...cards, ...muls, warn].filter(Boolean), { opacity: 0, y: 0, scale: 1 });
      }
    };

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && e.intersectionRatio >= 0.3) play();
        else if (!e.isIntersecting) reset();
      });
    }, { threshold: [0, 0.3, 0.55] });
    io.observe(slide);
  });

  /* ---------- Дорожная карта: анимация полос при открытии ---------- */
  document.querySelectorAll("[data-rmap]").forEach((root) => {
    const bars = root.querySelectorAll("[data-rmap-bar]");
    const rows = root.querySelectorAll("[data-rmap-row]");
    if (!bars.length) return;

    const play = () => {
      if (reduced || !window.gsap) {
        bars.forEach((b) => { b.style.transform = "none"; b.style.opacity = "1"; });
        return;
      }
      gsap.fromTo(
        rows,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.45, stagger: 0.1, ease: "power3.out" }
      );
      gsap.fromTo(
        bars,
        { scaleX: 0, opacity: 0.35 },
        { scaleX: 1, opacity: 1, duration: 0.7, stagger: 0.08, ease: "power3.out", delay: 0.12 }
      );
    };

    const pageEl = root.closest(".card__page");
    const card = root.closest("[data-card]");
    if (!pageEl || !card) return;

    const mo = new MutationObserver(() => {
      if (!pageEl.hasAttribute("hidden") && card.classList.contains("is-open")) {
        play();
      }
    });
    mo.observe(pageEl, { attributes: true, attributeFilter: ["hidden"] });
  });

  /* ---------- Полноэкранный просмотр картинок на слайдах ---------- */
  let closeImgZoom = null;

  (function imgZoom() {
    const sources = document.querySelectorAll(".slide .slide__figure:not(.slide__figure--stack) > img");
    if (!sources.length) return;

    const root = document.createElement("div");
    root.className = "img-zoom";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-label", "Изображение во весь экран");
    root.innerHTML =
      '<div class="img-zoom__scrim" aria-hidden="true"></div>' +
      '<figure class="img-zoom__frame"><img class="img-zoom__img" alt="" /></figure>' +
      '<button type="button" class="img-zoom__close" aria-label="Свернуть">' +
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
      '<path d="M18 6 6 18M6 6l12 12"/></svg></button>';
    document.body.appendChild(root);

    const zoomImg = root.querySelector(".img-zoom__img");
    const closeBtn = root.querySelector(".img-zoom__close");
    let active = false;
    let lastFocus = null;

    const openZoom = (source) => {
      lastFocus = source;
      zoomImg.src = source.currentSrc || source.src;
      zoomImg.alt = source.alt;
      root.classList.add("is-open");
      document.body.classList.add("is-img-zoom");
      active = true;
      closeBtn.focus();
    };

    const closeZoom = () => {
      if (!active) return;
      root.classList.remove("is-open");
      document.body.classList.remove("is-img-zoom");
      active = false;
      zoomImg.removeAttribute("src");
      if (lastFocus) lastFocus.focus();
    };

    closeImgZoom = closeZoom;

    sources.forEach((el) => {
      el.tabIndex = 0;
      el.setAttribute("role", "button");
      const label = el.alt ? el.alt + " — развернуть" : "Развернуть изображение";
      el.setAttribute("aria-label", label);
      el.addEventListener("click", () => openZoom(el));
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openZoom(el); }
      });
    });

    closeBtn.addEventListener("click", closeZoom);
  })();

  // ESC закрывает лайтбокс, карточку или листает ленту
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (closeImgZoom && document.body.classList.contains("is-img-zoom")) { closeImgZoom(); return; }
      if (openCard) { close(); return; }
    }
    if (!openCard) return;
    const sl = openCard.querySelector("[data-slides]");
    if (!sl || !sl._go) return;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") sl._go(1);
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") sl._go(-1);
  });
  // Клик по логотипу возвращает на хаб
  const home = document.querySelector("[data-home]");
  if (home) home.addEventListener("click", (e) => { e.preventDefault(); if (openCard) close(); });
})();
