/**
 * Calm Chess Computers (c) 2026. All Rights Reserved.
 * Client-Side Secure Password Portal Gateway (js/password_reset.js)
 * Supports two authentication paths:
 *   1. Direct authenticated password change using current password
 *   2. Forgotten password reset authenticated via user email verification response
 */

(function (global) {
  "use strict";

  // Dynamic origin detection for API routing
  const API_BASE = (function () {
    if (typeof window !== "undefined" && window.location) {
      if (window.CC_API_BASE) return window.CC_API_BASE;
      const host = window.location.hostname;
      if (host === "api.calmchessgames.com") return window.location.origin;
      if ((host === "localhost" || host === "127.0.0.1") && (window.location.port === "" || window.location.port === "80" || window.location.port === "443")) {
        return window.location.origin;
      }
    }
    return "https://api.calmchessgames.com";
  })();

  // Enforce secure HTTPS
  if (typeof CryptoTransport !== "undefined" && CryptoTransport.ensureHttps) {
    CryptoTransport.ensureHttps();
  }

  function secureFetchApi(url, options = {}) {
    const fetchFn = (typeof CryptoTransport !== "undefined" && CryptoTransport.secureFetch)
      ? CryptoTransport.secureFetch
      : fetch;
    return fetchFn(url, options);
  }

  function getCandidateEndpoints(action) {
    const actQuery = action ? `?action=${action}&_t=${Date.now()}` : `?_t=${Date.now()}`;
    return [
      `${API_BASE}/password_reset.php${actQuery}`,
      `${API_BASE}/php/password_reset.php${actQuery}`,
      `./password_reset.php${actQuery}`,
      `./php/password_reset.php${actQuery}`,
      `password_reset.php${actQuery}`,
      `php/password_reset.php${actQuery}`,
      `../password_reset.php${actQuery}`,
      `../php/password_reset.php${actQuery}`,
      `https://api.calmchessgames.com/password_reset.php${actQuery}`,
      `https://api.calmchessgames.com/php/password_reset.php${actQuery}`
    ];
  }

  async function postApiEncrypted(action, payload) {
    const endpoints = [...new Set(getCandidateEndpoints(action))];
    const bodyObj = Object.assign({ action: action }, payload);
    let lastError = null;

    for (const url of endpoints) {
      try {
        const res = await secureFetchApi(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          encrypt: true,
          body: bodyObj
        });

        const rawText = await res.text();
        let data = null;
        try {
          data = JSON.parse(rawText);
        } catch (jsonErr) {
          data = { success: false, message: rawText.replace(/<[^>]*>?/gm, "").trim() };
        }

        if (res.ok || data.success) {
          return data;
        } else if (data && data.message) {
          return data;
        }
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError || new Error("Failed to communicate with password security servers.");
  }

  /* --- TAB SWITCHING --- */
  function switchResetTab(tabName) {
    const viewEmail = document.getElementById("viewEmail");
    const viewCurrent = document.getElementById("viewCurrent");

    const btnEmail = document.getElementById("tabBtnEmail");
    const btnCurrent = document.getElementById("tabBtnCurrent");

    if (viewEmail) viewEmail.style.display = tabName === "email" ? "block" : "none";
    if (viewCurrent) viewCurrent.style.display = tabName === "current" ? "block" : "none";

    if (btnEmail) {
      btnEmail.classList.toggle("active", tabName === "email");
      btnEmail.setAttribute("aria-selected", tabName === "email");
    }
    if (btnCurrent) {
      btnCurrent.classList.toggle("active", tabName === "current");
      btnCurrent.setAttribute("aria-selected", tabName === "current");
    }

    // Clear alert boxes
    ["alert-email-req", "alert-email-comp", "alert-current"].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.style.display = "none";
        el.textContent = "";
        el.className = "status-alert";
      }
    });
  }

  /* --- PASSWORD TOGGLE VISIBILITY --- */
  function togglePasswordVisibility(inputId, btnEl) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === "password") {
      input.type = "text";
      if (btnEl) btnEl.textContent = "🙈";
    } else {
      input.type = "password";
      if (btnEl) btnEl.textContent = "👁";
    }
  }

  /* --- PASSWORD COMPLEXITY RULES VALIDATOR --- */
  function evaluatePasswordRules(pwd, confirmPwd, prefix) {
    const hasLen = pwd.length >= 8;
    const hasUp = /[A-Z]/.test(pwd);
    const hasLow = /[a-z]/.test(pwd);
    const hasNum = /[0-9]/.test(pwd);
    const hasSpec = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd);
    const hasMatch = pwd.length > 0 && pwd === confirmPwd;

    const setRule = (id, valid) => {
      const el = document.getElementById(`${prefix}-${id}`);
      if (el) {
        el.className = valid ? "rule-item valid" : "rule-item";
      }
    };

    setRule("len", hasLen);
    setRule("up", hasUp);
    setRule("low", hasLow);
    setRule("num", hasNum);
    setRule("spec", hasSpec);
    setRule("match", hasMatch);

    return hasLen && hasUp && hasLow && hasNum && hasSpec && hasMatch;
  }

  function checkEmailPwdRules() {
    const pwd = (document.getElementById("email-comp-new-pwd") || {}).value || "";
    const confirm = (document.getElementById("email-comp-confirm-pwd") || {}).value || "";
    return evaluatePasswordRules(pwd, confirm, "ep");
  }

  function checkCurrentPwdRules() {
    const pwd = (document.getElementById("curr-new-pwd") || {}).value || "";
    const confirm = (document.getElementById("curr-confirm-pwd") || {}).value || "";
    return evaluatePasswordRules(pwd, confirm, "cp");
  }

  function showEmailRequestStep() {
    const stepReq = document.getElementById("email-step-request");
    const stepComp = document.getElementById("email-step-complete");
    if (stepReq) stepReq.style.display = "block";
    if (stepComp) stepComp.style.display = "none";
  }

  /* --- METHOD 1: REQUEST AUTHENTICATION EMAIL --- */
  async function handleSendResetEmail(event) {
    if (event && event.preventDefault) event.preventDefault();

    const alertEl = document.getElementById("alert-email-req");
    const submitBtn = document.getElementById("btn-submit-send-email");
    const idInput = document.getElementById("email-req-identifier");
    if (!alertEl || !submitBtn || !idInput) return;

    const identifier = idInput.value.trim();
    if (!identifier) {
      alertEl.className = "status-alert error";
      alertEl.textContent = "Please enter your registered email address or username.";
      alertEl.style.display = "block";
      idInput.focus();
      return;
    }

    alertEl.style.display = "none";
    submitBtn.disabled = true;
    submitBtn.textContent = "Dispatching Authentication Email...";

    try {
      const data = await postApiEncrypted("send_reset_email", { identifier: identifier });

      submitBtn.disabled = false;
      submitBtn.textContent = "Send Authentication Email";

      if (data && data.success) {
        // Transition to complete step
        const stepReq = document.getElementById("email-step-request");
        const stepComp = document.getElementById("email-step-complete");
        const compIdInput = document.getElementById("email-comp-identifier");
        const compCodeInput = document.getElementById("email-comp-code");

        if (stepReq) stepReq.style.display = "none";
        if (stepComp) stepComp.style.display = "block";

        if (compIdInput) {
          compIdInput.value = (data.data && data.data.email) ? data.data.email : identifier;
        }

        if (compCodeInput) {
          compCodeInput.focus();
        }
      } else {
        alertEl.className = "status-alert error";
        alertEl.textContent = (data && data.message) ? data.message : "Failed to send reset email. Please try again.";
        alertEl.style.display = "block";
      }
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Send Authentication Email";
      alertEl.className = "status-alert error";
      alertEl.textContent = "Communication error while connecting to security server: " + (err.message || "Network issue");
      alertEl.style.display = "block";
    }
  }

  /* --- METHOD 1: COMPLETE EMAIL RESET AFTER AUTHENTICATING RESPONSE --- */
  async function handleCompleteEmailReset(event) {
    if (event && event.preventDefault) event.preventDefault();

    const alertEl = document.getElementById("alert-email-comp");
    const submitBtn = document.getElementById("btn-submit-complete-email");
    const emailInput = document.getElementById("email-comp-identifier");
    const codeInput = document.getElementById("email-comp-code");
    const newPwdInput = document.getElementById("email-comp-new-pwd");
    const confirmPwdInput = document.getElementById("email-comp-confirm-pwd");

    if (!alertEl || !submitBtn || !emailInput || !codeInput || !newPwdInput || !confirmPwdInput) return;

    const email = emailInput.value.trim();
    const code = codeInput.value.trim();
    const newPwd = newPwdInput.value;
    const confirmPwd = confirmPwdInput.value;

    if (!email) {
      alertEl.className = "status-alert error";
      alertEl.textContent = "Please provide your account email.";
      alertEl.style.display = "block";
      emailInput.focus();
      return;
    }

    if (!code) {
      alertEl.className = "status-alert error";
      alertEl.textContent = "Please enter the 6-digit confirmation code from your email.";
      alertEl.style.display = "block";
      codeInput.focus();
      return;
    }

    if (!checkEmailPwdRules()) {
      alertEl.className = "status-alert error";
      alertEl.textContent = "Please ensure your new password satisfies all complexity requirements.";
      alertEl.style.display = "block";
      newPwdInput.focus();
      return;
    }

    alertEl.style.display = "none";
    submitBtn.disabled = true;
    submitBtn.textContent = "Updating Password...";

    try {
      const data = await postApiEncrypted("complete_email_reset", {
        identifier: email,
        email: email,
        code: code,
        new_password: newPwd
      });

      submitBtn.disabled = false;
      submitBtn.textContent = "Authenticate & Update Password";

      if (data && data.success) {
        alertEl.className = "status-alert success";
        alertEl.innerHTML = `
          <strong>✔ Password Updated Successfully!</strong><br>
          ${data.message || "Your password has been reset."}<br><br>
          <a href="blackjack.html" class="btn-submit" style="display:inline-block; text-align:center; text-decoration:none; padding:10px 18px; margin-top:8px;">Sign In to Blackjack &rarr;</a>
        `;
        alertEl.style.display = "block";
        newPwdInput.value = "";
        confirmPwdInput.value = "";
        codeInput.value = "";
      } else {
        alertEl.className = "status-alert error";
        alertEl.textContent = (data && data.message) ? data.message : "Password update failed. Please verify your code.";
        alertEl.style.display = "block";
      }
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Authenticate & Update Password";
      alertEl.className = "status-alert error";
      alertEl.textContent = "Error communicating with server: " + (err.message || "Network error");
      alertEl.style.display = "block";
    }
  }

  /* --- METHOD 2: DIRECT PASSWORD UPDATE WITH CURRENT PASSWORD --- */
  async function handleCurrentPasswordSubmit(event) {
    if (event && event.preventDefault) event.preventDefault();

    const alertEl = document.getElementById("alert-current");
    const submitBtn = document.getElementById("btn-submit-current");
    const idInput = document.getElementById("curr-identifier");
    const currPwdInput = document.getElementById("curr-pwd");
    const newPwdInput = document.getElementById("curr-new-pwd");
    const confirmPwdInput = document.getElementById("curr-confirm-pwd");

    if (!alertEl || !submitBtn || !idInput || !currPwdInput || !newPwdInput || !confirmPwdInput) return;

    const identifier = idInput.value.trim();
    const currentPassword = currPwdInput.value;
    const newPassword = newPwdInput.value;

    if (!identifier) {
      alertEl.className = "status-alert error";
      alertEl.textContent = "Please enter your registered email address or username.";
      alertEl.style.display = "block";
      idInput.focus();
      return;
    }

    if (!currentPassword) {
      alertEl.className = "status-alert error";
      alertEl.textContent = "Please enter your current password.";
      alertEl.style.display = "block";
      currPwdInput.focus();
      return;
    }

    if (!checkCurrentPwdRules()) {
      alertEl.className = "status-alert error";
      alertEl.textContent = "Please ensure your new password satisfies all requirements.";
      alertEl.style.display = "block";
      newPwdInput.focus();
      return;
    }

    alertEl.style.display = "none";
    submitBtn.disabled = true;
    submitBtn.textContent = "Verifying Credentials...";

    try {
      const data = await postApiEncrypted("update_authenticated_password", {
        identifier: identifier,
        current_password: currentPassword,
        new_password: newPassword
      });

      submitBtn.disabled = false;
      submitBtn.textContent = "Change Password";

      if (data && data.success) {
        alertEl.className = "status-alert success";
        alertEl.innerHTML = `
          <strong>✔ Password Changed Successfully!</strong><br>
          ${data.message || "Your password has been changed."}<br><br>
          <a href="blackjack.html" class="btn-submit" style="display:inline-block; text-align:center; text-decoration:none; padding:10px 18px; margin-top:8px;">Sign In to Blackjack &rarr;</a>
        `;
        alertEl.style.display = "block";
        currPwdInput.value = "";
        newPwdInput.value = "";
        confirmPwdInput.value = "";
      } else {
        alertEl.className = "status-alert error";
        alertEl.textContent = (data && data.message) ? data.message : "Authentication failed. Current password is incorrect.";
        alertEl.style.display = "block";
      }
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Change Password";
      alertEl.className = "status-alert error";
      alertEl.textContent = "Server communication error: " + (err.message || "Network issue");
      alertEl.style.display = "block";
    }
  }

  /* --- INITIALIZATION & URL PARAMETER PARSING --- */
  async function initFromUrlParams() {
    if (typeof window === "undefined" || !window.location) return;
    const params = new URLSearchParams(window.location.search);
    const action = params.get("action");
    const emailParam = params.get("email") || params.get("identifier");
    const codeParam = params.get("code") || params.get("verification_code");

    if (action === "verify_email" || codeParam) {
      switchResetTab("email");
      const stepReq = document.getElementById("email-step-request");
      const stepComp = document.getElementById("email-step-complete");
      if (stepReq) stepReq.style.display = "none";
      if (stepComp) stepComp.style.display = "block";

      const emailInput = document.getElementById("email-comp-identifier");
      const codeInput = document.getElementById("email-comp-code");
      const hintEl = document.getElementById("code-status-hint");

      if (emailInput && emailParam) emailInput.value = emailParam;
      if (codeInput && codeParam) codeInput.value = codeParam;

      if (codeParam) {
        if (hintEl) {
          hintEl.style.color = "var(--gold)";
          hintEl.textContent = "Verifying email response confirmation code...";
        }
        try {
          const res = await postApiEncrypted("verify_email_code", {
            identifier: emailParam || "",
            code: codeParam
          });
          if (res && res.verified) {
            if (hintEl) {
              hintEl.style.color = "#55efc4";
              hintEl.textContent = "✔ Email authentication confirmed! Please set your new password below.";
            }
            const newPwd = document.getElementById("email-comp-new-pwd");
            if (newPwd) newPwd.focus();
          } else {
            if (hintEl) {
              hintEl.style.color = "#ff8b8b";
              hintEl.textContent = "✕ " + ((res && res.message) ? res.message : "Code invalid or expired.");
            }
          }
        } catch (e) {
          if (hintEl) hintEl.textContent = "Proceed to enter your new password.";
        }
      }
    }
  }

  // Export functions globally
  global.switchResetTab = switchResetTab;
  global.togglePasswordVisibility = togglePasswordVisibility;
  global.checkEmailPwdRules = checkEmailPwdRules;
  global.checkCurrentPwdRules = checkCurrentPwdRules;
  global.handleSendResetEmail = handleSendResetEmail;
  global.handleCompleteEmailReset = handleCompleteEmailReset;
  global.handleCurrentPasswordSubmit = handleCurrentPasswordSubmit;
  global.showEmailRequestStep = showEmailRequestStep;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFromUrlParams);
  } else {
    initFromUrlParams();
  }

})(typeof window !== "undefined" ? window : this);
