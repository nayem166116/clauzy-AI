/* ============================================================
   Clauzy - nav.js
   Indexed nav active state, full-screen overlay index menu,
   focus trapping and keyboard handling.
   ============================================================ */
(function () {
  "use strict";

  /* ---- Active route marking (also keeps state correct on back/forward) ---- */
  function markActive() {
    var path = window.location.pathname.replace(/\/+$/, "") || "/";
    var links = document.querySelectorAll("[data-nav-link]");
    Array.prototype.forEach.call(links, function (link) {
      var target = link.getAttribute("href").replace(/\/+$/, "") || "/";
      var active = target === "/" ? path === "/" : path === target || path.indexOf(target + "/") === 0;
      if (active) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  markActive();
  window.addEventListener("popstate", markActive);
  window.addEventListener("pageshow", markActive);

  /* ---- Overlay index menu ---- */
  var openBtn = document.getElementById("menuOpen");
  var closeBtn = document.getElementById("menuClose");
  var overlay = document.getElementById("overlayMenu");
  if (!openBtn || !overlay || !closeBtn) return;

  var lastFocused = null;

  function focusables() {
    return overlay.querySelectorAll('a[href], button:not([disabled])');
  }

  function openMenu() {
    lastFocused = document.activeElement;
    overlay.hidden = false;
    document.documentElement.style.overflow = "hidden";
    openBtn.setAttribute("aria-expanded", "true");
    var items = focusables();
    if (items.length) items[0].focus();
    document.addEventListener("keydown", onKeydown);
  }

  function closeMenu() {
    overlay.hidden = true;
    document.documentElement.style.overflow = "";
    openBtn.setAttribute("aria-expanded", "false");
    document.removeEventListener("keydown", onKeydown);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function onKeydown(event) {
    if (event.key === "Escape") {
      closeMenu();
      return;
    }
    if (event.key !== "Tab") return;
    var items = focusables();
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  openBtn.addEventListener("click", openMenu);
  closeBtn.addEventListener("click", closeMenu);

  window.addEventListener("resize", function () {
    if (!overlay.hidden && window.innerWidth > 1000) closeMenu();
  });
})();
