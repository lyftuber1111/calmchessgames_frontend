/**
 * Calm Chess Computers (c) 2026. All Rights Reserved.
 * Client-Side Account & Data Deletion Request Handler (delete_account.js)
 * Transmits request with Web Crypto SubtleCrypto in-transit encryption
 */

(function (global) {
  "use strict";

  // Dynamic origin detection: Route backend PHP API calls to DigitalOcean LAMP server (api.calmchessgames.com)
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

  async function submitDeletionRequest(event) {
    if (event && event.preventDefault) {
      event.preventDefault();
    }

    const alertEl = document.getElementById("status-alert");
    const submitBtn = document.getElementById("btn-submit-del");
    const identifierInput = document.getElementById("del-identifier");
    const reasonSelect = document.getElementById("del-reason");
    const confirmCheckbox = document.getElementById("del-confirm");

    if (!alertEl || !submitBtn || !identifierInput || !confirmCheckbox) return;

    alertEl.className = "status-alert";
    alertEl.style.display = "none";
    alertEl.textContent = "";

    const identifier = identifierInput.value.trim();
    const reason = reasonSelect ? reasonSelect.value : "Requested via Google Play web deletion page";

    if (!identifier) {
      alertEl.className = "status-alert error";
      alertEl.textContent = "Please enter your registered email address or username.";
      alertEl.style.display = "block";
      identifierInput.focus();
      return;
    }

    if (!confirmCheckbox.checked) {
      alertEl.className = "status-alert error";
      alertEl.textContent = "Please check the confirmation box acknowledging permanent deletion.";
      alertEl.style.display = "block";
      confirmCheckbox.focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting Secure Request...";

    const endpoints = [
      `${API_BASE}/delete_account.php?_t=${Date.now()}`,
      `https://api.calmchessgames.com/delete_account.php?_t=${Date.now()}`
    ];
    const uniqueEndpoints = [...new Set(endpoints)];

    let completed = false;
    let responseData = null;

    for (const url of uniqueEndpoints) {
      try {
        const res = await secureFetchApi(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          encrypt: true,
          body: {
            identifier: identifier,
            reason: reason,
            confirmed: true
          }
        });

        const rawText = await res.text();
        try {
          responseData = JSON.parse(rawText);
        } catch (jsonErr) {
          responseData = { success: false, message: rawText.replace(/<[^>]*>?/gm, "").trim() };
        }

        if (res.ok || responseData.success) {
          completed = true;
          break;
        }
      } catch (networkErr) {
        // Try fallback endpoint
      }
    }

    submitBtn.disabled = false;
    submitBtn.textContent = "Submit Account Deletion Request";

    if (completed && responseData && responseData.success) {
      alertEl.className = "status-alert success";
      alertEl.innerHTML = `<strong>Request Registered Successfully!</strong><br>${responseData.message || "Your account deletion request has been registered and scheduled for permanent purge."}`;
      alertEl.style.display = "block";

      identifierInput.value = "";
      confirmCheckbox.checked = false;
    } else {
      alertEl.className = "status-alert error";
      alertEl.innerHTML = `<strong>Notice:</strong> ${responseData && responseData.message ? responseData.message : "Unable to reach the server. Please email your request directly to <a href='mailto:privacy@calmchessgames.com' style='color:#fff;text-decoration:underline;'>privacy@calmchessgames.com</a>."}`;
      alertEl.style.display = "block";
    }
  }

  global.submitDeletionRequest = submitDeletionRequest;

})(typeof window !== "undefined" ? window : globalThis);
