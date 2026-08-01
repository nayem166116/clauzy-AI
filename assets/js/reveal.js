/* ============================================================
   Clauzy - reveal.js
   IntersectionObserver scroll reveal. The variant comes from the
   data-reveal value in the markup, so each section reveals in a
   different way. Plays once, respects reduced motion, and can
   never leave content permanently hidden: anything already in
   view is revealed immediately, and a safety timer reveals the
   remainder if the observer never reports.
   ============================================================ */
(function () {
  "use strict";

  var nodes = document.querySelectorAll("[data-reveal]");
  if (!nodes.length) return;

  var list = Array.prototype.slice.call(nodes);

  function show(node, stagger) {
    if (node.classList.contains("is-in")) return;
    var step = parseInt(node.getAttribute("data-reveal-step") || "0", 10);
    node.style.transitionDelay = stagger && step > 0 ? step * 90 + "ms" : "0ms";
    node.classList.add("is-in");
  }

  function showAll() {
    list.forEach(function (node) {
      show(node, false);
    });
  }

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || !("IntersectionObserver" in window)) {
    showAll();
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        show(entry.target, true);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
  );

  list.forEach(function (node) {
    observer.observe(node);
  });

  /* Anything already inside the first viewport reveals at once, so the
     page never opens on empty space. */
  function revealInitial() {
    var vh = window.innerHeight || document.documentElement.clientHeight;
    list.forEach(function (node) {
      var box = node.getBoundingClientRect();
      if (box.top < vh * 0.92 && box.bottom > 0) {
        show(node, true);
        observer.unobserve(node);
      }
    });
  }

  revealInitial();
  window.requestAnimationFrame(revealInitial);

  /* Safety net: if the observer never reports (unsupported viewport
     conditions, prerender, print), nothing stays invisible. */
  window.setTimeout(showAll, 2200);
  window.addEventListener("beforeprint", showAll);
})();
