/**
 * Calm Chess Computers (c) 2026. All Rights Reserved.
 * Client-Side Secure Password Reset & Update Gateway (js/password_reset.js)
 * Implements SubtleCrypto in-transit encryption, dynamic token validation, and password strength auditing.
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

  // Immediately ensure HTTPS transport encryption
  if (typeof CryptoTransport !== "undefined" && CryptoTransport.ensureHttps) {
    CryptoTransport.ensureHttps();
  }

  function secureFetchApi(url, options = {}) {
    const fetchFn = (typeof CryptoTransport !== "undefined" && CryptoTransport.secureFetch)
      ? CryptoTransport.secureFetch
      : fetch;
    return fetchFn(url, options);
  }

  // Candidates for fallback API routing
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
          return data; // Return backend rejection message
        }
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError || new Error("Failed to communicate with password reset API servers.");
  }

  /* --- TAB SWITCHING --- */
  function switchResetTab(tabName) {
    const viewReq = document.getElementById("viewRequest");
    const viewTok = document.getElementById("viewToken");
    const viewAuth = document.getElementById("viewAuth");

    const btnReq = document.getElementById("tabBtnRequest");
    const btnTok = document.getElementById("tabBtnToken");
    const btnAuth = document.getElementById("tabBtnAuth");

    if (viewReq) viewReq.style.display = tabName === "request" ? "block" : "none";
    if (viewTok) viewTok.style.display = tabName === "token" ? "block" : "none";
    if (viewAuth) viewAuth.style.display = tabName === "auth" ? "block" : "none";

    if (btnReq) {
      btnReq.classList.toggle("active", tabName === "request");
      btnReq.setAttribute("aria-selected", tabName === "request");
    }
    if (btnTok) {
      btnTok.classList.toggle("active", tabName === "token");
      btnTok.setAttribute("aria-selected", tabName === "token");
    }
    if (btnAuth) {
      btnAuth.classList.toggle("active", tabName === "auth");
      btnAuth.setAttribute("aria-selected", tabName === "auth");
    }

    // Clear alert boxes
    ["alert-req", "alert-token", "alert-auth"].forEach(id => {
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

  function checkTokenPwdRules() {
    const pwd = (document.getElementById("tok-new-pwd") || {}).value || "";
    const confirm = (document.getElementById("tok-confirm-pwd") || {}).value || "";
    return evaluatePasswordRules(pwd, confirm, "tp");
  }

  function checkAuthPwdRules() {
    const pwd = (document.getElementById("auth-new-pwd") || {}).value || "";
    const confirm = (document.getElementById("auth-confirm-pwd") || {}).value || "";
    return evaluatePasswordRules(pwd, confirm, "ap");
  }

  /* --- REAL-TIME TOKEN VERIFICATION HELPER --- */
  let tokenVerifyTimeout = null;
  function validateCurrentTokenInput() {
    clearTimeout(tokenVerifyTimeout);
    const tokInput = document.getElementById("tok-token");
    const hintEl = document.getElementById("tok-status-hint");
    if (!tokInput || !hintEl) return;

    const tokenVal = tokInput.value.trim();
    if (tokenVal.length < 16) {
      hintEl.style.color = "var(--text-muted)";
      hintEl.textContent = "Paste the 64-char token received or automatically populated from your reset URL.";
      return;
    }

    hintEl.style.color = "var(--gold)";
    hintEl.textContent = "Verifying token validity with server...";

    tokenVerifyTimeout = setTimeout(async () => {
      try {
        const res = await postApiEncrypted("verify_token", { token: tokenVal });
        if (res && res.valid) {
          hintEl.style.color = "#55efc4";
          hintEl.textContent = `✔ Valid Token for: ${res.data && res.data.identifier ? res.data.identifier : "Account"} (Expires: ${res.data && res.data.expires_at ? res.data.expires_at : "within 1 hour"})`;
        } else {
          hintEl.style.color = "#ff8b8b";
          hintEl.textContent = `✕ Token invalid or expired: ${(res && res.message) ? res.message : "Please request a new token."}`;
        }
      } catch (err) {
        hintEl.style.color = "var(--text-muted)";
        hintEl.textContent = "Server verification pending submission.";
      }
    }, 600);
  }

  /* --- WORKFLOW 1: REQUEST RESET LINK --- */
  async function handleRequestReset(event) {
    if (event && event.preventDefault) event.preventDefault();

    const alertEl = document.getElementById("alert-req");
    const submitBtn = document.getElementById("btn-submit-req");
    const idInput = document.getElementById("req-identifier");
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
    submitBtn.textContent = "Generating Cryptographic Token...";

    try {
      const data = await postApiEncrypted("request_reset", { identifier: identifier });

      submitBtn.disabled = false;
      submitBtn.textContent = "Generate Secure Reset Link";

      if (data && data.success) {
        alertEl.className = "status-alert success";
        alertEl.style.display = "block";

        const token = (data.data && data.data.token) ? data.data.token : "";
        const resetUrl = (data.data && data.data.reset_url) ? data.data.reset_url : (token ? `password_reset.html?token=${encodeURIComponent(token)}` : "");
        const expTime = (data.data && data.data.expires_at) ? data.data.expires_at : "60 minutes";

        let html = `<strong>✔ Password Reset Registered!</strong><br>${data.message || "A secure 60-minute cryptographic reset token has been registered."}`;

        if (token) {
          html += `
            <div class="token-box">
              <strong style="color: var(--gold); display: block; margin-bottom: 4px;">🔑 Your Secure Reset Token:</strong>
              <div style="font-family: monospace; word-break: break-all; background: rgba(0,0,0,0.5); padding: 8px 10px; border-radius: 4px; color: #fff; font-size: 0.85rem; margin-bottom: 8px;">
                ${token}
              </div>
              <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px;">
                <button type="button" class="btn-submit" style="flex: 1; padding: 8px 12px; font-size: 0.82rem;" onclick="applyTokenAndProceed('${token}')">
                  Proceed to Reset Password Now &rarr;
                </button>
                <button type="button" class="btn-submit" style="background: #334155; color: #fff; padding: 8px 12px; font-size: 0.82rem;" onclick="copyTokenToClipboard('${token}')">
                  📋 Copy Token
                </button>
              </div>
              <div style="font-size: 0.78rem; color: #94a3b8; margin-top: 6px;">
                Token valid until: <strong>${expTime}</strong>. Never share this token with anyone.
              </div>
            </div>
          `;
        }

        alertEl.innerHTML = html;
      } else {
        alertEl.className = "status-alert error";
        alertEl.textContent = (data && data.message) ? data.message : "Unable to register reset request. Please try again.";
        alertEl.style.display = "block";
      }
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Generate Secure Reset Link";
      alertEl.className = "status-alert error";
      alertEl.textContent = "Network error: Could not reach API server. " + err.message;
      alertEl.style.display = "block";
    }
  }

  function applyTokenAndProceed(token) {
    switchResetTab("token");
    const tokInput = document.getElementById("tok-token");
    if (tokInput) {
      tokInput.value = token;
      validateCurrentTokenInput();
    }
    const pwdInput = document.getElementById("tok-new-pwd");
    if (pwdInput) pwdInput.focus();
  }

  function copyTokenToClipboard(token) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(token).then(() => {
        alert("Reset token copied to clipboard!");
      }).catch(() => {
        prompt("Copy token manually:", token);
      });
    } else {
      prompt("Copy token manually:", token);
    }
  }

  /* --- WORKFLOW 2: RESET PASSWORD VIA TOKEN --- */
  async function handleTokenReset(event) {
    if (event && event.preventDefault) event.preventDefault();

    const alertEl = document.getElementById("alert-token");
    const submitBtn = document.getElementById("btn-submit-token");
    const tokInput = document.getElementById("tok-token");
    const newPwdInput = document.getElementById("tok-new-pwd");
    const confirmPwdInput = document.getElementById("tok-confirm-pwd");

    if (!alertEl || !submitBtn || !tokInput || !newPwdInput || !confirmPwdInput) return;

    const token = tokInput.value.trim();
    const newPwd = newPwdInput.value;
    const confirmPwd = confirmPwdInput.value;

    if (!token) {
      alertEl.className = "status-alert error";
      alertEl.textContent = "Please enter your 64-character security reset token.";
      alertEl.style.display = "block";
      tokInput.focus();
      return;
    }

    if (!checkTokenPwdRules()) {
      alertEl.className = "status-alert error";
      alertEl.textContent = "Please make sure your new password meets all complexity requirements and that passwords match.";
      alertEl.style.display = "block";
      newPwdInput.focus();
      return;
    }

    alertEl.style.display = "none";
    submitBtn.disabled = true;
    submitBtn.textContent = "Encrypting & Updating Password...";

    try {
      const data = await postApiEncrypted("reset_password", {
        token: token,
        new_password: newPwd
      });

      submitBtn.disabled = false;
      submitBtn.textContent = "Update Password & Invalidate Token";

      if (data && data.success) {
        alertEl.className = "status-alert success";
        alertEl.innerHTML = `
          <strong>✔ Password Updated Successfully!</strong><br>
          ${data.message || "Your password has been securely updated and your reset token has been invalidated."}<br>
          <div style="margin-top: 10px;">
            <a href="blackjack.html" class="back-btn" style="background: var(--gold); color: #111; font-weight: 800; display: inline-block;">
              Return to Blackjack &amp; Sign In &rarr;
            </a>
          </div>
        `;
        alertEl.style.display = "block";

        tokInput.value = "";
        newPwdInput.value = "";
        confirmPwdInput.value = "";
        checkTokenPwdRules();
      } else {
        alertEl.className = "status-alert error";
        alertEl.textContent = (data && data.message) ? data.message : "Password update failed. Token may be invalid or expired.";
        alertEl.style.display = "block";
      }
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Update Password & Invalidate Token";
      alertEl.className = "status-alert error";
      alertEl.textContent = "Network error: Could not reach API server. " + err.message;
      alertEl.style.display = "block";
    }
  }

  /* --- WORKFLOW 3: DIRECT AUTHENTICATED PASSWORD UPDATE --- */
  async function handleAuthUpdate(event) {
    if (event && event.preventDefault) event.preventDefault();

    const alertEl = document.getElementById("alert-auth");
    const submitBtn = document.getElementById("btn-submit-auth");
    const idInput = document.getElementById("auth-identifier");
    const currPwdInput = document.getElementById("auth-curr-pwd");
    const newPwdInput = document.getElementById("auth-new-pwd");
    const confirmPwdInput = document.getElementById("auth-confirm-pwd");

    if (!alertEl || !submitBtn || !idInput || !currPwdInput || !newPwdInput || !confirmPwdInput) return;

    const identifier = idInput.value.trim();
    const currPwd = currPwdInput.value;
    const newPwd = newPwdInput.value;
    const confirmPwd = confirmPwdInput.value;

    if (!identifier) {
      alertEl.className = "status-alert error";
      alertEl.textContent = "Please enter your account email or username.";
      alertEl.style.display = "block";
      idInput.focus();
      return;
    }

    if (!currPwd) {
      alertEl.className = "status-alert error";
      alertEl.textContent = "Please enter your current password.";
      alertEl.style.display = "block";
      currPwdInput.focus();
      return;
    }

    if (!checkAuthPwdRules()) {
      alertEl.className = "status-alert error";
      alertEl.textContent = "Please make sure your new password meets all complexity rules and matches confirmation.";
      alertEl.style.display = "block";
      newPwdInput.focus();
      return;
    }

    alertEl.style.display = "none";
    submitBtn.disabled = true;
    submitBtn.textContent = "Verifying & Updating Password...";

    try {
      const data = await postApiEncrypted("update_authenticated_password", {
        identifier: identifier,
        current_password: currPwd,
        new_password: newPwd
      });

      submitBtn.disabled = false;
      submitBtn.textContent = "Change Password";

      if (data && data.success) {
        alertEl.className = "status-alert success";
        alertEl.innerHTML = `
          <strong>✔ Password Changed Successfully!</strong><br>
          ${data.message || "Your password has been changed."}<br>
          <div style="margin-top: 10px;">
            <a href="blackjack.html" class="back-btn" style="background: var(--gold); color: #111; font-weight: 800; display: inline-block;">
              Return to Blackjack Table &rarr;
            </a>
          </div>
        `;
        alertEl.style.display = "block";

        currPwdInput.value = "";
        newPwdInput.value = "";
        confirmPwdInput.value = "";
        checkAuthPwdRules();
      } else {
        alertEl.className = "status-alert error";
        alertEl.textContent = (data && data.message) ? data.message : "Password update failed.";
        alertEl.style.display = "block";
      }
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Change Password";
      alertEl.className = "status-alert error";
      alertEl.textContent = "Network error: Could not reach API server. " + err.message;
      alertEl.style.display = "block";
    }
  }

  // Auto-detect token query parameter on load
  function initPage() {
    if (typeof window !== "undefined" && window.location && window.location.search) {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get("token");
      if (urlToken) {
        switchResetTab("token");
        const tokInput = document.getElementById("tok-token");
        if (tokInput) {
          tokInput.value = urlToken;
          validateCurrentTokenInput();
        }
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPage);
  } else {
    initPage();
  }

  // Global exports
  global.switchResetTab = switchResetTab;
  global.togglePasswordVisibility = togglePasswordVisibility;
  global.checkTokenPwdRules = checkTokenPwdRules;
  global.checkAuthPwdRules = checkAuthPwdRules;
  global.validateCurrentTokenInput = validateCurrentTokenInput;
  global.handleRequestReset = handleRequestReset;
  global.handleTokenReset = handleTokenReset;
  global.handleAuthUpdate = handleAuthUpdate;
  global.applyTokenAndProceed = applyTokenAndProceed;
  global.copyTokenToClipboard = copyTokenToClipboard;

})(typeof window !== "undefined" ? window : globalThis);
