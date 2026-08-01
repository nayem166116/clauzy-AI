(function () {
  "use strict";

  var USERS_KEY = "clauzy_demo_users";

  function getUsers() {
    try {
      var raw = localStorage.getItem(USERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveUsers(users) {
    try {
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch (e) {
      /* storage unavailable; demo continues in-memory for this page load only */
    }
  }

  function normalizeEmail(email) {
    return (email || "").trim().toLowerCase();
  }

  function findUser(email) {
    var e = normalizeEmail(email);
    var users = getUsers();
    for (var i = 0; i < users.length; i++) {
      if (users[i].email === e) return users[i];
    }
    return null;
  }

  function genCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  function markInvalid(field, shake) {
    if (!field) return;
    field.classList.add("is-invalid");
    if (shake) {
      field.classList.add("is-shaking");
      window.setTimeout(function () {
        field.classList.remove("is-shaking");
      }, 340);
    }
  }

  function clearInvalid(field) {
    if (field) field.classList.remove("is-invalid");
  }

  function showMessage(el, msg) {
    if (!el) return;
    if (msg) {
      el.textContent = msg;
      el.hidden = false;
    } else {
      el.textContent = "";
      el.hidden = true;
    }
  }

  function checkRequired(form) {
    var ok = true;
    var required = form.querySelectorAll("[required]");
    Array.prototype.forEach.call(required, function (input) {
      var field = input.closest(".field");
      var valid = input.checkValidity();
      if (field) field.classList.toggle("is-invalid", !valid);
      if (!valid && ok) {
        ok = false;
        input.focus();
        if (field) markInvalid(field, true);
      }
    });
    return ok;
  }

  function startExitAndRedirect() {
    var progress = document.getElementById("progress");
    if (progress) {
      progress.classList.remove("is-done");
      progress.classList.add("is-active");
    }
    document.body.classList.add("is-exiting");
    window.setTimeout(function () {
      window.location.href = "/loading";
    }, 180);
  }

  /* ---------------- Sign in ---------------- */
  var loginForm = document.querySelector('[data-auth-form="login"]');
  if (loginForm) {
    var loginError = document.getElementById("loginFormError");
    var loginEmail = document.getElementById("login-email");
    var loginPassword = document.getElementById("login-password");

    loginForm.addEventListener("submit", function (event) {
      event.preventDefault();
      showMessage(loginError, "");
      clearInvalid(loginEmail.closest(".field"));
      clearInvalid(loginPassword.closest(".field"));

      if (!checkRequired(loginForm)) return;

      var user = findUser(loginEmail.value);
      if (!user) {
        markInvalid(loginEmail.closest(".field"), true);
        showMessage(loginError, "No account found for this email. Please create an account first.");
        return;
      }
      if (user.password !== loginPassword.value) {
        markInvalid(loginPassword.closest(".field"), true);
        showMessage(loginError, "Incorrect email or password. Please try again.");
        return;
      }

      startExitAndRedirect();
    });
  }

  /* ---------------- Create account ---------------- */
  var regForm = document.querySelector('[data-auth-form="register"]');
  if (regForm) {
    var regStep1 = document.getElementById("regStep1");
    var regStep2 = document.getElementById("regStep2");
    var regFormError = document.getElementById("regFormError");
    var regEmail = document.getElementById("reg-email");
    var regPassword = document.getElementById("reg-password");
    var verifyEmailLabel = document.getElementById("regVerifyEmail");
    var demoCodeNote = document.getElementById("regDemoCode");
    var codeInput = document.getElementById("regCode");
    var codeError = document.getElementById("regCodeError");
    var resendBtn = document.getElementById("regResend");
    var backBtn = document.getElementById("regBack");
    var verifyForm = document.getElementById("regVerifyForm");
    var pending = null;

    function issueCode() {
      pending.code = genCode();
      if (verifyEmailLabel) verifyEmailLabel.textContent = pending.email;
      if (demoCodeNote) {
        demoCodeNote.textContent = "Demo mode: no real email is sent. Your verification code is " + pending.code + ".";
      }
      // eslint-disable-next-line no-console
      console.log("[Clauzy demo] Email verification code for " + pending.email + ": " + pending.code);
    }

    regForm.addEventListener("submit", function (event) {
      event.preventDefault();
      showMessage(regFormError, "");
      clearInvalid(regEmail.closest(".field"));

      if (!checkRequired(regForm)) return;

      if (regPassword.value.length < 12) {
        markInvalid(regPassword.closest(".field"), true);
        return;
      }

      if (findUser(regEmail.value)) {
        markInvalid(regEmail.closest(".field"), true);
        showMessage(regFormError, "An account with this email already exists. Sign in instead.");
        return;
      }

      pending = {
        name: document.getElementById("reg-name").value,
        email: normalizeEmail(regEmail.value),
        company: document.getElementById("reg-company").value,
        password: regPassword.value
      };
      issueCode();

      if (regStep1) regStep1.hidden = true;
      if (regStep2) regStep2.hidden = false;
      showMessage(codeError, "");
      clearInvalid(codeInput.closest(".field"));
      codeInput.value = "";
      codeInput.focus();
    });

    if (resendBtn) {
      resendBtn.addEventListener("click", function (event) {
        event.preventDefault();
        if (!pending) return;
        issueCode();
        showMessage(codeError, "");
        clearInvalid(codeInput.closest(".field"));
        codeInput.value = "";
        codeInput.focus();
      });
    }

    if (backBtn) {
      backBtn.addEventListener("click", function (event) {
        event.preventDefault();
        pending = null;
        if (regStep2) regStep2.hidden = true;
        if (regStep1) regStep1.hidden = false;
      });
    }

    if (verifyForm) {
      verifyForm.addEventListener("submit", function (event) {
        event.preventDefault();
        if (!pending) return;

        var entered = (codeInput.value || "").trim();
        if (entered !== pending.code) {
          markInvalid(codeInput.closest(".field"), true);
          showMessage(codeError, "That code is incorrect. Please try again.");
          return;
        }

        clearInvalid(codeInput.closest(".field"));
        showMessage(codeError, "");

        var users = getUsers();
        users.push({
          name: pending.name,
          email: pending.email,
          company: pending.company,
          password: pending.password
        });
        saveUsers(users);
        pending = null;

        startExitAndRedirect();
      });
    }
  }
})();
