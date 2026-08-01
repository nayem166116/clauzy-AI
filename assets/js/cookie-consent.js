/* ============================================================
   Clauzy - cookie-consent.js
   Banner + preference centre. Choices persist in localStorage.
   No backend, no tracking scripts are loaded before consent.
   ============================================================ */
(function () {
  "use strict";

  var STORAGE_KEY = "clauzy.consent.v1";
  var banner = document.getElementById("cookieBanner");
  var modal = document.getElementById("cookieModal");
  if (!banner || !modal) return;

  var analyticsToggle = document.getElementById("prefAnalytics");
  var marketingToggle = document.getElementById("prefMarketing");
  var lastFocused = null;

  function readConsent() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function writeConsent(value) {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          essential: true,
          analytics: !!value.analytics,
          marketing: !!value.marketing,
          decidedAt: new Date().toISOString()
        })
      );
    } catch (error) {
      /* storage unavailable - the banner simply shows again next visit */
    }
  }

  function showBanner() {
    banner.hidden = false;
    window.requestAnimationFrame(function () {
      banner.classList.add("is-open");
    });
  }

  function hideBanner() {
    banner.classList.remove("is-open");
    window.setTimeout(function () {
      banner.hidden = true;
    }, 460);
  }

  function openModal() {
    var saved = readConsent();
    if (analyticsToggle) analyticsToggle.checked = saved ? !!saved.analytics : false;
    if (marketingToggle) marketingToggle.checked = saved ? !!saved.marketing : false;
    lastFocused = document.activeElement;
    modal.classList.add("is-open");
    modal.removeAttribute("hidden");
    document.documentElement.style.overflow = "hidden";
    var focusTarget = modal.querySelector(".modal__close");
    if (focusTarget) focusTarget.focus();
    document.addEventListener("keydown", onKeydown);
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("hidden", "");
    document.documentElement.style.overflow = "";
    document.removeEventListener("keydown", onKeydown);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function onKeydown(event) {
    if (event.key === "Escape") closeModal();
    if (event.key !== "Tab") return;
    var items = modal.querySelectorAll('a[href], button:not([disabled]), input:not([disabled])');
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

  function decide(value) {
    writeConsent(value);
    hideBanner();
    if (modal.classList.contains("is-open")) closeModal();
  }

  document.addEventListener("click", function (event) {
    var target = event.target.closest ? event.target.closest("[data-consent]") : null;
    if (!target) return;
    var action = target.getAttribute("data-consent");

    if (action === "accept") {
      event.preventDefault();
      decide({ analytics: true, marketing: true });
    } else if (action === "reject") {
      event.preventDefault();
      decide({ analytics: false, marketing: false });
    } else if (action === "manage") {
      event.preventDefault();
      openModal();
    } else if (action === "close") {
      event.preventDefault();
      closeModal();
    } else if (action === "save") {
      event.preventDefault();
      decide({
        analytics: analyticsToggle ? analyticsToggle.checked : false,
        marketing: marketingToggle ? marketingToggle.checked : false
      });
    }
  });

  if (!readConsent()) {
    window.setTimeout(showBanner, 700);
  }
})();
