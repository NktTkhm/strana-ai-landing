/* =========================================================
   Применение ИИ · Страна Девелопмент — скролл-дек
   GSAP 3 + ScrollTrigger + SmoothScroll
   ========================================================= */
(function () {
  "use strict";
  document.documentElement.classList.add("js");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  if (!reduced && window.SmoothScroll) {
    SmoothScroll({ animationTime: 800, stepSize: 90, accelerationDelta: 40, accelerationMax: 2 });
  }

  const scenes = Array.from(document.querySelectorAll("[data-scene]"));
  const dots = Array.from(document.querySelectorAll(".progress__dot"));

  // Клик по индикатору → плавный скролл к сцене
  dots.forEach((d) => d.addEventListener("click", () => {
    const t = document.getElementById(d.getAttribute("data-go"));
    if (t) t.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  }));

  if (!window.gsap) return;
  gsap.registerPlugin(ScrollTrigger);

  const isDark = (s) => s.classList.contains("scene--dark") || s.classList.contains("scene--cover");

  function setActive(i) {
    dots.forEach((d, k) => d.classList.toggle("is-active", k === i));
    document.body.classList.toggle("on-dark", isDark(scenes[i]));
  }

  if (reduced) {
    gsap.set("[data-r],[data-r-stagger]", { opacity: 1, y: 0 });
    scenes.forEach((s, i) => ScrollTrigger.create({
      trigger: s, start: "top 55%", end: "bottom 55%", onToggle: (self) => self.isActive && setActive(i),
    }));
    return;
  }

  /* — Появление контента каждой сцены — */
  scenes.forEach((scene, i) => {
    const solo = scene.querySelectorAll("[data-r]");
    const group = scene.querySelectorAll("[data-r-stagger]");
    const lines = scene.querySelectorAll("[data-r-line]");
    const first = i === 0;

    const build = (tl) => {
      if (lines.length) tl.from(lines, { yPercent: 115, duration: 1.1, stagger: 0.1, ease: "power3.out" }, 0);
      if (solo.length) tl.to(solo, { opacity: 1, y: 0, duration: 0.9, stagger: 0.1, ease: "power3.out" }, lines.length ? 0.4 : 0);
      if (group.length) tl.to(group, { opacity: 1, y: 0, duration: 0.8, stagger: 0.12, ease: "power3.out" }, "-=0.55");
    };

    // Сигнатурный момент: формула КДТ собирается слева направо (К × Д × Т)
    if (scene.id === "s5") {
      const head = scene.querySelector(".head");
      const formula = scene.querySelector(".formula");
      const cards = scene.querySelectorAll(".kdt__card");
      const letters = scene.querySelectorAll(".kdt__l");
      const xs = scene.querySelectorAll(".kdt__x");
      const warn = scene.querySelector(".warn");
      const tl = gsap.timeline({ scrollTrigger: { trigger: scene, start: "top 65%" }, defaults: { ease: "power3.out" } });
      tl.to(head, { opacity: 1, y: 0, duration: 0.8 })
        .to(formula, { opacity: 1, y: 0, duration: 0.7 }, "-=0.45");
      [0, 1, 2].forEach((k) => {
        tl.to(cards[k], { opacity: 1, y: 0, duration: 0.55 }, k === 0 ? ">-0.1" : "-=0.05")
          .from(letters[k], { scale: 0.7, transformOrigin: "50% 62%", duration: 0.6, ease: "back.out(1.7)" }, "<");
        if (xs[k]) tl.fromTo(xs[k], { opacity: 0, scale: 0, y: 0 }, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2.2)" }, "-=0.25");
      });
      tl.to(warn, { opacity: 1, y: 0, duration: 0.6 }, "-=0.05");
    } else if (first) {
      build(gsap.timeline({ delay: 0.15 }));
    } else {
      build(gsap.timeline({ scrollTrigger: { trigger: scene, start: "top 68%" } }));
    }

    // Активная сцена для индикатора + тёмная тема марки
    ScrollTrigger.create({
      trigger: scene, start: "top 55%", end: "bottom 55%",
      onToggle: (self) => self.isActive && setActive(i),
    });
  });

  setActive(0);

  /* — Parallax фонов обложек — */
  document.querySelectorAll("[data-parallax]").forEach((bg) => {
    gsap.to(bg, {
      yPercent: 12, ease: "none",
      scrollTrigger: { trigger: bg.closest("[data-scene]"), start: "top bottom", end: "bottom top", scrub: true },
    });
  });

  window.addEventListener("load", () => ScrollTrigger.refresh());
})();
