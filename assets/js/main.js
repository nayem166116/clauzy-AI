/* ============================================================
   Clauzy - main.js
   App-feel layer: top progress bar, page exit/entry transition,
   sticky masthead state, shared init. Progressive enhancement:
   every route is a real HTML document and works without JS.
   ============================================================ */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var progress = document.getElementById("progress");

  function startProgress() {
    if (!progress) return;
    progress.classList.remove("is-done");
    progress.classList.add("is-active");
  }

  function finishProgress() {
    if (!progress) return;
    progress.classList.add("is-done");
    window.setTimeout(function () {
      progress.classList.remove("is-active", "is-done");
    }, 320);
  }

  /* ---- Sticky masthead compaction ---- */
  var masthead = document.getElementById("masthead");
  var lastKnown = 0;
  var ticking = false;

  function applyScrollState() {
    if (masthead) masthead.classList.toggle("is-scrolled", lastKnown > 24);
    ticking = false;
  }

  window.addEventListener(
    "scroll",
    function () {
      lastKnown = window.pageYOffset || document.documentElement.scrollTop;
      if (!ticking) {
        window.requestAnimationFrame(applyScrollState);
        ticking = true;
      }
    },
    { passive: true }
  );
  applyScrollState();

  /* ---- Internal link exit transition ---- */
  function isInternalNav(anchor) {
    if (!anchor) return false;
    if (anchor.target && anchor.target !== "_self") return false;
    if (anchor.hasAttribute("download")) return false;
    if (anchor.dataset.noTransition === "true") return false;
    var href = anchor.getAttribute("href");
    if (!href) return false;
    if (href.charAt(0) === "#") return false;
    if (/^(mailto:|tel:|javascript:)/i.test(href)) return false;
    if (anchor.origin && anchor.origin !== window.location.origin) return false;
    if (anchor.pathname === window.location.pathname && anchor.hash) return false;
    return true;
  }

  document.addEventListener("click", function (event) {
    if (event.defaultPrevented) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (event.button !== 0) return;

    var anchor = event.target.closest ? event.target.closest("a") : null;
    if (!isInternalNav(anchor)) return;

    var destination = anchor.href;
    startProgress();

    if (reduced) return; /* let the browser navigate normally */

    event.preventDefault();
    document.body.classList.add("is-exiting");
    window.setTimeout(function () {
      window.location.href = destination;
    }, 180);
  });

  /* ---- Restore state on back/forward cache ---- */
  window.addEventListener("pageshow", function (event) {
    document.body.classList.remove("is-exiting");
    if (event.persisted) finishProgress();
  });

  window.addEventListener("load", finishProgress);

  /* ---- Accordions (FAQ + inline) ---- */
  var accButtons = document.querySelectorAll("[data-acc-btn]");
  Array.prototype.forEach.call(accButtons, function (btn) {
    var panel = document.getElementById(btn.getAttribute("aria-controls"));
    if (!panel) return;

    btn.addEventListener("click", function () {
      var expanded = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", expanded ? "false" : "true");
      if (expanded) {
        panel.style.height = panel.scrollHeight + "px";
        window.requestAnimationFrame(function () {
          panel.style.height = "0px";
        });
      } else {
        panel.style.height = panel.scrollHeight + "px";
        window.setTimeout(function () {
          if (btn.getAttribute("aria-expanded") === "true") panel.style.height = "auto";
        }, 330);
      }
    });
  });

  /* ---- Contact form: inline success state, nothing is stored ---- */
  var contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var ok = true;
      var required = contactForm.querySelectorAll("[required]");
      Array.prototype.forEach.call(required, function (input) {
        var field = input.closest(".field");
        var valid = input.checkValidity();
        if (field) field.classList.toggle("is-invalid", !valid);
        if (!valid && ok) {
          ok = false;
          input.focus();
          if (field) {
            field.classList.add("is-shaking");
            window.setTimeout(function () {
              field.classList.remove("is-shaking");
            }, 340);
          }
        }
      });
      if (!ok) return;

      var success = document.getElementById("contactSuccess");
      contactForm.reset();
      if (success) {
        success.classList.add("is-visible");
        success.setAttribute("tabindex", "-1");
        success.focus();
      }
    });
  }

  /* ---- Auth mock forms: submit goes to /loading and stops there ---- */
  var authForms = document.querySelectorAll("[data-auth-form]");
  Array.prototype.forEach.call(authForms, function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var ok = true;
      var required = form.querySelectorAll("[required]");
      Array.prototype.forEach.call(required, function (input) {
        var field = input.closest(".field");
        var valid = input.checkValidity();
        if (field) field.classList.toggle("is-invalid", !valid);
        if (!valid && ok) {
          ok = false;
          input.focus();
          if (field) {
            field.classList.add("is-shaking");
            window.setTimeout(function () {
              field.classList.remove("is-shaking");
            }, 340);
          }
        }
      });
      if (!ok) return;
      startProgress();
      document.body.classList.add("is-exiting");
      window.setTimeout(function () {
        window.location.href = "/loading";
      }, 180);
    });
  });

  /* ---- Signature moment: the redline draw on the clause ledger ---- */
  var ledger = document.querySelector("[data-ledger]");
  if (ledger) {
    if ("IntersectionObserver" in window) {
      var ledgerObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-live");
              ledgerObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.3 }
      );
      ledgerObserver.observe(ledger);
      /* If the ledger is already in the opening viewport, or if the
         observer never reports, the sequence still plays. */
      var box = ledger.getBoundingClientRect();
      if (box.top < (window.innerHeight || 800) * 0.9) {
        ledger.classList.add("is-live");
        ledgerObserver.unobserve(ledger);
      }
      window.setTimeout(function () {
        ledger.classList.add("is-live");
      }, 2200);
    } else {
      ledger.classList.add("is-live");
    }
  }
})();
