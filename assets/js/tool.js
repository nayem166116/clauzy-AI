/* ============================================================
   Clauzy - tool.js
   Free public clause analyzer. This is the ONE place in the
   product where a simulated result is rendered: the review
   engine is not called from the marketing site, so the
   findings below are illustrative sample output.
   ============================================================ */
(function () {
  "use strict";

  var form = document.getElementById("analyzerForm");
  if (!form) return;

  var input = document.getElementById("clauseInput");
  var output = document.getElementById("analyzerOutput");
  var counter = document.getElementById("charCount");
  var samples = document.querySelectorAll("[data-sample]");

  var SAMPLES = {
    indemnity:
      "Supplier shall indemnify, defend and hold harmless Customer and its affiliates from and against any and all claims, losses, liabilities and expenses of any kind whatsoever arising out of or in connection with this Agreement, without limitation as to amount or duration.",
    liability:
      "Except for a party's indemnification obligations, in no event shall either party's aggregate liability exceed the fees paid in the six (6) months preceding the claim. Customer waives all claims not brought within thirty (30) days of the event giving rise to the claim.",
    term:
      "This Agreement shall automatically renew for successive twelve (12) month periods unless either party provides written notice of non-renewal at least ninety (90) days prior to the end of the then-current term. Fees may be increased by Supplier upon renewal.",
    dataproc:
      "Supplier may process Customer Personal Data for its own business purposes, including product improvement, and may appoint sub-processors located outside the EEA without prior notice to or approval from Customer."
  };

  var FINDINGS = {
    indemnity: [
      {
        severity: "high",
        title: "Uncapped, unilateral indemnity",
        clause: "Clause 1 - Indemnification",
        quote: "...indemnify, defend and hold harmless ... without limitation as to amount or duration.",
        fix: "Cap the indemnity at a stated multiple of fees, make it mutual, and carve it out only for IP infringement, confidentiality breach and gross negligence."
      },
      {
        severity: "high",
        title: "Indemnity extends to undefined affiliates",
        clause: "Clause 1 - Beneficiaries",
        quote: "...Customer and its affiliates...",
        fix: "Define \"Affiliate\" and limit protected parties to entities that are party to an order form under this Agreement."
      },
      {
        severity: "medium",
        title: "No defence control or notice mechanics",
        clause: "Clause 1 - Procedure",
        quote: "...indemnify, defend and hold harmless...",
        fix: "Add prompt written notice, sole control of defence for the indemnifying party, and no settlement without consent."
      },
      {
        severity: "low",
        title: "Scope language is broader than the deal",
        clause: "Clause 1 - Trigger",
        quote: "...arising out of or in connection with this Agreement...",
        fix: "Narrow the trigger to third-party claims arising from the indemnifying party's performance under this Agreement."
      }
    ],
    liability: [
      {
        severity: "high",
        title: "Liability cap is below the contract value",
        clause: "Clause 2 - Limitation of Liability",
        quote: "...aggregate liability exceed the fees paid in the six (6) months preceding the claim.",
        fix: "Move to twelve (12) months of fees as the general cap, with a super-cap for data breach and confidentiality claims."
      },
      {
        severity: "high",
        title: "Thirty-day claim window is unenforceably short",
        clause: "Clause 2 - Time Bar",
        quote: "Customer waives all claims not brought within thirty (30) days...",
        fix: "Replace with a twelve-month limitation period, or delete and rely on the statutory limitation period."
      },
      {
        severity: "medium",
        title: "Indemnity carve-out is one-directional in effect",
        clause: "Clause 2 - Carve-outs",
        quote: "Except for a party's indemnification obligations...",
        fix: "State expressly that the carve-out applies to both parties and add fraud and wilful misconduct."
      },
      {
        severity: "low",
        title: "No exclusion of indirect loss",
        clause: "Clause 2 - Excluded Loss",
        quote: "...in no event shall either party's aggregate liability exceed...",
        fix: "Add a mutual exclusion of indirect, consequential and loss-of-profit damages to avoid an open-ended damages theory."
      }
    ],
    term: [
      {
        severity: "high",
        title: "Uncapped price increase on renewal",
        clause: "Clause 3 - Fees on Renewal",
        quote: "Fees may be increased by Supplier upon renewal.",
        fix: "Cap renewal uplift at the lower of CPI or 5%, and require sixty days' written notice before the non-renewal deadline."
      },
      {
        severity: "medium",
        title: "Ninety-day non-renewal window is long",
        clause: "Clause 3 - Notice Period",
        quote: "...written notice of non-renewal at least ninety (90) days prior...",
        fix: "Reduce to thirty days and require the supplier to send a renewal reminder before the window opens."
      },
      {
        severity: "medium",
        title: "Evergreen renewal with no exit for convenience",
        clause: "Clause 3 - Term",
        quote: "...automatically renew for successive twelve (12) month periods...",
        fix: "Add termination for convenience after the initial term with a pro-rata refund of prepaid fees."
      },
      {
        severity: "low",
        title: "Notice method not specified",
        clause: "Clause 3 - Notices",
        quote: "...provides written notice of non-renewal...",
        fix: "Point to the notices clause and allow email to a named contact so the deadline is practically achievable."
      }
    ],
    dataproc: [
      {
        severity: "high",
        title: "Processor uses personal data for its own purposes",
        clause: "Clause 4 - Data Processing",
        quote: "Supplier may process Customer Personal Data for its own business purposes...",
        fix: "Restrict processing to documented instructions of the controller; any product-improvement use must rely on aggregated, anonymised data only."
      },
      {
        severity: "high",
        title: "Sub-processors appointed without notice or objection right",
        clause: "Clause 4 - Sub-processing",
        quote: "...may appoint sub-processors ... without prior notice to or approval from Customer.",
        fix: "Require a published sub-processor list, thirty days' advance notice of changes, and a right to object with a termination remedy."
      },
      {
        severity: "medium",
        title: "International transfers lack a stated safeguard",
        clause: "Clause 4 - Transfers",
        quote: "...located outside the EEA...",
        fix: "Incorporate the current Standard Contractual Clauses and commit to a transfer impact assessment on request."
      },
      {
        severity: "low",
        title: "No audit or deletion commitment",
        clause: "Clause 4 - Assurance",
        quote: "Supplier may process Customer Personal Data...",
        fix: "Add annual audit rights or third-party report delivery, plus deletion or return of data within thirty days of termination."
      }
    ]
  };

  var GENERIC = [
    {
      severity: "high",
      title: "Obligation is stated without a measurable standard",
      clause: "Submitted clause - Obligations",
      quote: "The submitted text places an obligation on one party without a defined standard, deadline or remedy.",
      fix: "Attach a measurable standard (time period, service level or objective test) and state the consequence of failure."
    },
    {
      severity: "medium",
      title: "Undefined capitalised terms",
      clause: "Submitted clause - Definitions",
      quote: "Capitalised terms appear in the clause without a definition anywhere in the submitted text.",
      fix: "Define each capitalised term on first use or cross-reference the definitions schedule."
    },
    {
      severity: "medium",
      title: "One-sided allocation of risk",
      clause: "Submitted clause - Risk",
      quote: "Rights and remedies in the submitted text run predominantly in favour of a single party.",
      fix: "Make the obligation mutual, or balance it with an equivalent commitment from the counterparty."
    },
    {
      severity: "low",
      title: "Ambiguous connective drafting",
      clause: "Submitted clause - Drafting",
      quote: "Broad connectives such as \"in connection with\" widen scope beyond the intended subject matter.",
      fix: "Replace open-ended connectives with a closed list of the events the clause is meant to capture."
    }
  ];

  var SEV_WEIGHT = { high: 26, medium: 12, low: 5 };

  function detectProfile(text) {
    var t = text.toLowerCase();
    if (t.indexOf("indemnif") > -1 || t.indexOf("hold harmless") > -1) return "indemnity";
    if (t.indexOf("liability") > -1 || t.indexOf("liable") > -1) return "liability";
    if (t.indexOf("renew") > -1 || t.indexOf("term of this agreement") > -1 || t.indexOf("non-renewal") > -1) return "term";
    if (t.indexOf("personal data") > -1 || t.indexOf("sub-processor") > -1 || t.indexOf("gdpr") > -1) return "dataproc";
    return null;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function scoreOf(findings) {
    var score = 100;
    findings.forEach(function (f) {
      score -= SEV_WEIGHT[f.severity] || 5;
    });
    return Math.max(18, score);
  }

  function verdict(score) {
    if (score < 45) return "Not signature ready";
    if (score < 70) return "Negotiate before signing";
    return "Acceptable with minor edits";
  }

  function renderSkeleton() {
    output.innerHTML =
      '<div class="skeleton" role="status" aria-live="polite">' +
      '<div class="skeleton__line skeleton__line--sm"></div>' +
      '<div class="skeleton__line"></div>' +
      '<div class="skeleton__line skeleton__line--md"></div>' +
      '<div class="skeleton__line"></div>' +
      '<div class="skeleton__line skeleton__line--md"></div>' +
      '<div class="skeleton__line skeleton__line--sm"></div>' +
      '<p class="skeleton__status">Segmenting clauses and scoring risk\u2026</p>' +
      "</div>";
  }

  function renderResult(findings, words) {
    var score = scoreOf(findings);
    var high = findings.filter(function (f) { return f.severity === "high"; }).length;

    var html =
      '<article class="tool__result" aria-live="polite">' +
      '<div class="tool__result-head">' +
      '<div>' +
      '<p class="mono">Sample analysis \u00b7 ' + words + ' words \u00b7 ' + findings.length + ' findings</p>' +
      '<div class="tool__score"><b>' + score + '</b><span class="mono">Clauzy risk score \u00b7 ' + verdict(score) + '</span></div>' +
      '<div class="tool__meter"><span data-meter></span></div>' +
      "</div>" +
      '<p class="tag ' + (high > 0 ? "tag--ultra" : "tag--signal") + '">' + high + " high severity</p>" +
      "</div>";

    findings.forEach(function (f) {
      html +=
        '<section class="finding">' +
        '<p class="finding__sev finding__sev--' + f.severity + '"><span></span>' + f.severity + "</p>" +
        "<div>" +
        "<h4>" + escapeHtml(f.title) + "</h4>" +
        '<p class="finding__clause">' + escapeHtml(f.clause) + "</p>" +
        '<p class="finding__quote">' + escapeHtml(f.quote) + "</p>" +
        '<p class="finding__fix"><b>Suggested redline</b>' + escapeHtml(f.fix) + "</p>" +
        "</div>" +
        "</section>";
    });

    html +=
      '<div class="tool__gate">' +
      "<p>This is a sample of the public analyzer. Full-document review, playbook scoring, tracked-changes export and version comparison run in the Clauzy workspace.</p>" +
      '<a class="btn btn--primary" href="/register"><span class="btn__label">Unlock full report</span><span class="btn__icon"><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span></a>' +
      "</div>" +
      "</article>";

    output.innerHTML = html;

    var meter = output.querySelector("[data-meter]");
    if (meter) {
      window.requestAnimationFrame(function () {
        meter.style.width = score + "%";
      });
    }
  }

  function countWords(text) {
    var trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }

  if (input && counter) {
    input.addEventListener("input", function () {
      counter.textContent = input.value.length + " / 6000 characters";
    });
  }

  Array.prototype.forEach.call(samples, function (button) {
    button.addEventListener("click", function () {
      var key = button.getAttribute("data-sample");
      if (!SAMPLES[key] || !input) return;
      input.value = SAMPLES[key];
      if (counter) counter.textContent = input.value.length + " / 6000 characters";
      input.focus();
    });
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var text = input ? input.value.trim() : "";
    var field = input ? input.closest(".field") : null;

    if (text.length < 40) {
      if (field) {
        field.classList.add("is-invalid", "is-shaking");
        window.setTimeout(function () {
          field.classList.remove("is-shaking");
        }, 340);
      }
      if (input) input.focus();
      return;
    }
    if (field) field.classList.remove("is-invalid");

    renderSkeleton();
    var profile = detectProfile(text);
    var findings = profile ? FINDINGS[profile] : GENERIC;
    var words = countWords(text);

    window.setTimeout(function () {
      renderResult(findings, words);
    }, 1150);
  });
})();
