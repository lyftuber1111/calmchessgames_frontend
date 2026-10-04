(function (global) {
  "use strict";

  const API_BASE = "https://api.calmchessgames.com";

  // Audio system with mobile/VR user-gesture unlocking
  let backgroundAudio = null;
  let sfxAudioEnabled = false;
  let audioContextInstance = null;

  function getAudioContext() {
    if (!audioContextInstance) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioContextInstance = new AudioCtx();
      }
    }
    if (audioContextInstance && audioContextInstance.state === "suspended") {
      audioContextInstance.resume();
    }
    return audioContextInstance;
  }

  function initBackgroundAudio() {
    if (!backgroundAudio) {
      backgroundAudio = new Audio("casino_music.wav");
      backgroundAudio.loop = true;
      backgroundAudio.volume = 0.3;
      backgroundAudio.preload = "auto";
    }
  }

  function duckBackgroundMusic() {
    if (!backgroundAudio || backgroundAudio.paused) return;
    try {
      backgroundAudio.volume = 0.08;
      setTimeout(() => {
        if (!backgroundAudio.paused) backgroundAudio.volume = 0.3;
      }, 500);
    } catch (e) {}
  }

  function playChipSfx() {
    if (!sfxAudioEnabled) return;
    duckBackgroundMusic();
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(900, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch (e) {}
  }

  function playCardDealSfx() {
    if (!sfxAudioEnabled) return;
    duckBackgroundMusic();
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const frameCount = ctx.sampleRate * 0.07;
      const buffer = ctx.createBuffer(1, frameCount, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < frameCount; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 1400;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      whiteNoise.start();
    } catch (e) {}
  }

  function playWinFanfareSfx() {
    if (!sfxAudioEnabled) return;
    duckBackgroundMusic();
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const startTime = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5];

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, startTime + idx * 0.08);

        gain.gain.setValueAtTime(0.1, startTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + idx * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime + idx * 0.08);
        osc.stop(startTime + idx * 0.08 + 0.35);
      });
    } catch (e) {}
  }

  global.toggleAudio = function () {
    initBackgroundAudio();
    getAudioContext();
    if (backgroundAudio.paused) {
      backgroundAudio
        .play()
        .then(() => {
          sfxAudioEnabled = true;
          global.showNotification("Casino Music & SFX Enabled", true);
        })
        .catch(() => {
          global.showNotification("Audio blocked. Tap again!");
        });
    } else {
      backgroundAudio.pause();
      sfxAudioEnabled = false;
      global.showNotification("Audio Disabled", false);
    }
  };

  global.showNotification = function (message, isSuccess) {
    const existing = document.getElementById("game-toast-badge");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.id = "game-toast-badge";
    toast.className = "game-notification-toast " + (isSuccess ? "success" : "error");
    toast.innerHTML = String(message || "").split("\n").join("<br>") +
      '<div style="font-size:0.65rem;color:#94a3b8;margin-top:3px;font-weight:normal;">(Tap to dismiss)</div>';

    toast.onclick = function () {
      toast.style.animation = "toastOut 0.25s ease forwards";
      setTimeout(() => toast.remove(), 250);
    };

    document.body.appendChild(toast);
    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.animation = "toastOut 0.25s ease forwards";
        setTimeout(() => toast.remove(), 250);
      }
    }, 4500);
  };

  // State Variables
  let currentAuthTab = "register";
  let selectedPackageCredits = 1000;
  let selectedPackagePrice = 4.99;
  let simulationMode = true;
  let paypalButtonsRendered = false;

  let currentInsuranceBet = 0;
  let insuranceResolvePromise = null;
  let shoe = [];
  let cutCardCount = 0;
  let cutCardReached = false;
  let activeHandIndex = 0;
  let userBank = 500;
  let currentBet = 0;
  let isRoundOver = true;

  let userId = null;
  let userEmail = "";
  let simulatedBotHands = [];
  let dealerCards = [];
  let playerHands = [];

  // DOM elements cache
  const elBankDisplay = document.getElementById("bank-display");
  const elBetDisplay = document.getElementById("bet-display");
  const elShoeDisplay = document.getElementById("shoe-display");
  const elCutDisplay = document.getElementById("cut-display");
  const elMessageBanner = document.getElementById("message-banner");
  const elDealerScore = document.getElementById("dealer-score");
  const elDealerCards = document.getElementById("dealer-cards");
  const elPlayerHandsContainer = document.getElementById("player-hands-container");
  const elDealBtn = document.getElementById("deal-btn");
  const elHitBtn = document.getElementById("hit-btn");
  const elStandBtn = document.getElementById("stand-btn");
  const elDoubleBtn = document.getElementById("double-btn");
  const elSplitBtn = document.getElementById("split-btn");
  const elChipControls = document.getElementById("chip-controls");

  // Dynamic Card Scaler across mobile, desktop, and VR
  function updateResponsiveCardScale() {
    const seats = getSeatsCount();
    const container = document.getElementById("game-container");
    if (!container) return;

    const availableWidth = container.clientWidth;
    const availableHeight = container.clientHeight;

    let targetWidth;
    if (availableWidth < 500) {
      targetWidth = Math.max(30, Math.floor((availableWidth - 40) / Math.max(2, seats * 1.4)));
    } else if (availableHeight < 550) {
      targetWidth = Math.min(46, Math.max(26, Math.floor(availableHeight * 0.08)));
    } else {
      targetWidth = Math.min(54, Math.max(34, Math.floor(availableWidth / (seats * 2.2))));
    }

    const targetHeight = Math.round(targetWidth * 1.45);
    document.documentElement.style.setProperty("--card-w", targetWidth + "px");
    document.documentElement.style.setProperty("--card-h", targetHeight + "px");
  }

  window.addEventListener("resize", () => {
    updateResponsiveCardScale();
    renderTable();
  });
  window.addEventListener("orientationchange", () => {
    setTimeout(() => {
      updateResponsiveCardScale();
      renderTable();
    }, 150);
  });

  global.handleSeatCountChange = function () {
    updateResponsiveCardScale();
    renderTable();
  };

  // Auth & Password validation
  global.checkPasswordRules = function (password) {
    if (currentAuthTab !== "register") return;

    const pwd = (password || "").toString();

    const setRuleState = (id, isValid) => {
      const el = document.getElementById(id);
      if (el) {
        el.className = isValid ? "rule-item valid" : "rule-item invalid";
      }
    };

    setRuleState("r-len", pwd.length >= 8);
    setRuleState("r-up", /[A-Z]/.test(pwd));
    setRuleState("r-low", /[a-z]/.test(pwd));
    setRuleState("r-num", /[0-9]/.test(pwd));
    setRuleState("r-spec", /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd));

    checkPasswordMatch();
  };

  global.checkPasswordMatch = function () {
    if (currentAuthTab !== "register") return true;

    const pwd = document.getElementById("auth-password") ? document.getElementById("auth-password").value : "";
    const confirmEl = document.getElementById("auth-password-confirm");
    const confirmPwd = confirmEl ? confirmEl.value : "";
    const matchRule = document.getElementById("r-match");

    const isMatch = pwd.length > 0 && pwd === confirmPwd;
    if (matchRule) {
      matchRule.className = isMatch ? "rule-item valid" : "rule-item invalid";
    }
    return isMatch;
  };

  global.switchAuthTab = function (tab) {
    currentAuthTab = tab;
    document.getElementById("tab-reg").classList.toggle("active", tab === "register");
    document.getElementById("tab-login").classList.toggle("active", tab === "login");

    const rulesEl = document.getElementById("password-rules");
    const confirmGroup = document.getElementById("confirm-password-group");
    const confirmInput = document.getElementById("auth-password-confirm");
    const submitBtn = document.getElementById("auth-submit-btn");
    const idLabel = document.getElementById("auth-id-label");
    const idInput = document.getElementById("auth-identifier");

    if (tab === "register") {
      if (rulesEl) {
        rulesEl.classList.remove("hidden");
        rulesEl.style.setProperty("display", "flex", "important");
      }
      if (confirmGroup) {
        confirmGroup.classList.remove("hidden");
        confirmGroup.style.setProperty("display", "flex", "important");
      }
      if (confirmInput) {
        confirmInput.disabled = false;
        confirmInput.required = true;
      }
      if (submitBtn) submitBtn.textContent = "Register & Play";
      if (idLabel) idLabel.textContent = "Email Address";
      if (idInput) idInput.placeholder = "player@casino.com";
      global.checkPasswordRules(document.getElementById("auth-password") ? document.getElementById("auth-password").value : "");
    } else {
      // SIGN IN TAB: Strictly hide and disable confirm password and rules
      if (rulesEl) {
        rulesEl.classList.add("hidden");
        rulesEl.style.setProperty("display", "none", "important");
      }
      if (confirmGroup) {
        confirmGroup.classList.add("hidden");
        confirmGroup.style.setProperty("display", "none", "important");
      }
      if (confirmInput) {
        confirmInput.disabled = true;
        confirmInput.required = false;
        confirmInput.value = "";
      }
      if (submitBtn) submitBtn.textContent = "Sign In";
      if (idLabel) idLabel.textContent = "Username or Email";
      if (idInput) idInput.placeholder = "username or email";
    }
    clearAuthAlert();
  };

  function showAuthAlert(msg, isError) {
    const alertEl = document.getElementById("auth-alert");
    if (!alertEl) return;
    alertEl.innerHTML = msg;
    alertEl.className = isError ? "auth-alert error" : "auth-alert success";
    alertEl.style.display = "block";
  }

  function clearAuthAlert() {
    const alertEl = document.getElementById("auth-alert");
    if (alertEl) alertEl.style.display = "none";
  }

  async function syncBankToServer(bankValue) {
    const bank = Math.max(0, parseFloat(bankValue) || 0);
    try {
      if (userId) localStorage.setItem("calmchess_bank_" + userId, bank.toFixed(2));
    } catch (e) {}

    try {
      await fetch(API_BASE + "/admin_api.php?action=sync_bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        keepalive: true,
        body: JSON.stringify({ user_id: userId, email: userEmail, bank: bank })
      });
    } catch (e) {}
  }

  global.handleAuthSubmit = async function (e) {
    if (e && e.preventDefault) e.preventDefault();
    clearAuthAlert();

    const identifier = document.getElementById("auth-identifier").value.trim();
    const password = document.getElementById("auth-password").value;
    const confirmInput = document.getElementById("auth-password-confirm");
    const confirmPassword = confirmInput ? confirmInput.value : "";

    // Verification only applies to Register tab
    if (currentAuthTab === "register") {
      if (password !== confirmPassword) {
        showAuthAlert("Passwords do not match. Please verify your password.", true);
        if (confirmInput) confirmInput.focus();
        return;
      }

      const hasLen = password.length >= 8;
      const hasUpper = /[A-Z]/.test(password);
      const hasLower = /[a-z]/.test(password);
      const hasNum = /[0-9]/.test(password);
      const hasSpec = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

      if (!hasLen || !hasUpper || !hasLower || !hasNum || !hasSpec) {
        showAuthAlert("Please satisfy all password complexity requirements.", true);
        return;
      }
    }

    const endpoint = API_BASE + (currentAuthTab === "register" ? "/register.php" : "/login.php");

    try {
      const res = await fetch(endpoint + "?_t=" + Date.now(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ identifier: identifier, email: identifier, password: password })
      });

      const rawText = await res.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (jsonErr) {
        showAuthAlert("Server Error (" + res.status + "): " + rawText.replace(/<[^>]*>?/gm, "").trim(), true);
        return;
      }

      if (res.status === 409 || (data && (data.error_code === "EMAIL_EXISTS" || (data.message && data.message.includes("already registered"))))) {
        showAuthAlert(data.message, true);
        global.showNotification(data.message + "\n\nSwitching to Sign In tab.", false);
        global.switchAuthTab("login");
        document.getElementById("auth-password").value = "";
        document.getElementById("auth-password").focus();
        return;
      }

      if (!data.success) {
        showAuthAlert(data.message, true);
        return;
      }

      userId = data.user.id;
      userEmail = data.user.email || identifier;
      const loadedBank = parseFloat(data.user.bank);

      document.getElementById("lobby-screen").classList.remove("active");
      document.getElementById("game-screen").classList.add("active");

      loadAdminMode();
      initGameState(loadedBank);
      updateResponsiveCardScale();
    } catch (err) {
      showAuthAlert("Network Error: " + err.message, true);
    }
  };

  global.executeLogout = async function () {
    if (isRoundOver && currentBet > 0) {
      userBank += currentBet;
      currentBet = 0;
    }
    await syncBankToServer(userBank);

    try {
      await fetch(API_BASE + "/logout.php?_t=" + Date.now(), {
        method: "POST",
        credentials: "include",
        keepalive: true
      });
    } catch (e) {}

    document.getElementById("game-screen").classList.remove("active");
    document.getElementById("lobby-screen").classList.add("active");
    document.getElementById("auth-password").value = "";
    const confirmEl = document.getElementById("auth-password-confirm");
    if (confirmEl) confirmEl.value = "";

    userId = null;
    userEmail = "";
    shoe = [];
    dealerCards = [];
    playerHands = [];
    simulatedBotHands = [];
  };

  async function loadAdminMode() {
    try {
      const res = await fetch(API_BASE + "/admin_api.php?action=get_mode&_t=" + Date.now(), {
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) {
        simulationMode = data.simulation_mode;
        applyStoreModeUI();
      }
    } catch (e) {}
  }

  function applyStoreModeUI() {
    const simBox = document.getElementById("simulation-container");
    const liveBox = document.getElementById("paypal-live-container");

    if (simBox) simBox.style.display = simulationMode ? "block" : "none";
    if (liveBox) liveBox.style.display = simulationMode ? "none" : "flex";

    if (!simulationMode) {
      renderPayPalButtons();
    }
  }

  global.selectPackage = function (credits, price, cardEl) {
    selectedPackageCredits = credits;
    selectedPackagePrice = price;

    document.querySelectorAll(".package-box").forEach(el => el.classList.remove("selected"));
    if (cardEl) cardEl.classList.add("selected");

    const simBtn = document.getElementById("sim-buy-btn");
    if (simBtn) simBtn.textContent = "Add Credits (Simulated $" + price + ")";
  };

  global.openStoreModal = function () {
    loadAdminMode();
    document.getElementById("store-modal").classList.add("active");
  };

  global.closeStoreModal = function () {
    document.getElementById("store-modal").classList.remove("active");
  };

  global.openAdminModal = function () {
    document.getElementById("admin-sim-toggle").checked = simulationMode;
    document.getElementById("admin-modal").classList.add("active");
  };

  global.closeAdminModal = function () {
    document.getElementById("admin-modal").classList.remove("active");
  };

  global.saveAdminSettings = async function () {
    const adminKey = document.getElementById("admin-key").value;
    const simEnabled = document.getElementById("admin-sim-toggle").checked ? 1 : 0;

    try {
      const res = await fetch(API_BASE + "/admin_api.php?action=set_mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ admin_key: adminKey, enable_simulation: simEnabled })
      });
      const data = await res.json();

      if (!data.success) {
        global.showNotification("Admin Error: " + data.message, false);
        return;
      }

      simulationMode = data.simulation_mode;
      global.showNotification("Simulation mode: " + (simulationMode ? "ENABLED" : "DISABLED"), true);
      global.closeAdminModal();
      applyStoreModeUI();
    } catch (err) {
      global.showNotification("Connection error: " + err.message, false);
    }
  };

  global.executeSimulatedPurchase = async function () {
    const check = document.getElementById("accept-terms-check");
    if (check && !check.checked) {
      global.showNotification("Please review and check the Terms of Service acceptance box.", false);
      return;
    }

    try {
      const res = await fetch(API_BASE + "/admin_api.php?action=buy_credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ package: selectedPackageCredits, user_id: userId, email: userEmail })
      });
      const data = await res.json();

      if (!data.success) {
        global.showNotification(data.message, false);
        return;
      }

      userBank = parseFloat(data.new_bank);
      elBankDisplay.textContent = userBank;
      syncBankToServer(userBank);
      global.showNotification("[SIMULATION]: " + data.message, true);
      global.closeStoreModal();
    } catch (err) {
      global.showNotification("Simulation failed: " + err.message, false);
    }
  };

  function renderPayPalButtons() {
    if (paypalButtonsRendered || typeof paypal === "undefined") return;

    paypal.Buttons({
      style: { layout: "vertical", color: "gold", shape: "rect", label: "pay" },
      onClick: function (data, actions) {
        const terms = document.getElementById("accept-terms-check");
        if (terms && !terms.checked) {
          global.showNotification("Accept Terms of Service before continuing.", false);
          return actions.reject();
        }
        return actions.resolve();
      },
      createOrder: async function () {
        const res = await fetch(API_BASE + "/paypal_api.php?action=create_order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ package: selectedPackageCredits, user_id: userId, email: userEmail })
        });
        const orderData = await res.json();
        if (!orderData.success) throw new Error(orderData.message);
        return orderData.orderID;
      },
      onApprove: async function (data) {
        const res = await fetch(API_BASE + "/paypal_api.php?action=capture_order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ orderID: data.orderID, package: selectedPackageCredits, user_id: userId, email: userEmail })
        });
        const captureData = await res.json();
        if (captureData.success) {
          userBank = parseFloat(captureData.new_bank);
          elBankDisplay.textContent = userBank;
          syncBankToServer(userBank);
          global.showNotification(captureData.message, true);
          global.closeStoreModal();
        } else {
          global.showNotification("Capture Error: " + captureData.message, false);
        }
      },
      onError: function (err) {
        global.showNotification("Payment error: " + err, false);
      }
    }).render("#paypal-button-container");

    paypalButtonsRendered = true;
  }

  // Confetti celebration animation (DPI / Retina / VR calibrated)
  let confettiAnimId = null;
  let confettiParticles = [];
  let celebrationDismissTimer = null;

  function triggerCelebration(wonAmount) {
    playWinFanfareSfx();
    const overlay = document.getElementById("celebration-overlay");
    document.getElementById("celebration-payout").textContent = "Won $" + wonAmount + " (3:2 Payout)";
    overlay.classList.add("active");
    startConfetti();
    clearTimeout(celebrationDismissTimer);
    celebrationDismissTimer = setTimeout(global.closeBlackjackCelebration, 4000);
  }

  global.closeBlackjackCelebration = function () {
    const overlay = document.getElementById("celebration-overlay");
    if (overlay) overlay.classList.remove("active");
    stopConfetti();
    clearTimeout(celebrationDismissTimer);
  };

  function startConfetti() {
    const canvas = document.getElementById("confetti-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);

    confettiParticles = [];
    const colors = ["#f1c40f", "#e74c3c", "#2ecc71", "#3498db", "#9b59b6", "#ffffff"];
    for (let i = 0; i < 90; i++) {
      confettiParticles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight - window.innerHeight,
        size: Math.random() * 7 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: Math.random() * 4 - 2,
        vy: Math.random() * 4 + 3,
        rot: Math.random() * 360,
        rotSpeed: Math.random() * 8 - 4
      });
    }

    function step() {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      confettiParticles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.rotSpeed;
        if (p.y > window.innerHeight) {
          p.y = -10;
          p.x = Math.random() * window.innerWidth;
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.6);
        ctx.restore();
      });
      confettiAnimId = requestAnimationFrame(step);
    }
    cancelAnimationFrame(confettiAnimId);
    step();
  }

  function stopConfetti() {
    cancelAnimationFrame(confettiAnimId);
    const canvas = document.getElementById("confetti-canvas");
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  // 6-Deck Shoe Mechanics
  const SUITS = ["♠", "♥", "♦", "♣"];
  const CARD_RANKS = [
    { n: "2", v: 2 }, { n: "3", v: 3 }, { n: "4", v: 4 }, { n: "5", v: 5 },
    { n: "6", v: 6 }, { n: "7", v: 7 }, { n: "8", v: 8 }, { n: "9", v: 9 },
    { n: "10", v: 10 }, { n: "J", v: 10 }, { n: "Q", v: 10 }, { n: "K", v: 10 },
    { n: "A", v: 11 }
  ];
  const DECKS_COUNT = 6;
  const MAX_SPLIT_HANDS = 4;

  function getSeatsCount() {
    const input = document.getElementById("table-seats-input");
    const val = input ? input.value.trim() : "";
    if (val === "") return 1;
    const count = parseInt(val, 10);
    if (isNaN(count) || count < 1) return 1;
    return count > 7 ? 7 : count;
  }

  function initAndShuffleShoe() {
    const cards = [];
    for (let d = 0; d < DECKS_COUNT; d++) {
      for (let s = 0; s < SUITS.length; s++) {
        for (let r = 0; r < CARD_RANKS.length; r++) {
          cards.push({ suit: SUITS[s], name: CARD_RANKS[r].n, value: CARD_RANKS[r].v });
        }
      }
    }

    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = cards[i];
      cards[i] = cards[j];
      cards[j] = temp;
    }

    const half = Math.floor(cards.length / 2);
    const left = cards.slice(0, half);
    const right = cards.slice(half);
    const riffled = [];

    while (left.length || right.length) {
      const takeLeft = Math.min(left.length, Math.floor(Math.random() * 8) + 16);
      const takeRight = Math.min(right.length, Math.floor(Math.random() * 8) + 16);
      const leftBatch = left.splice(0, takeLeft);
      const rightBatch = right.splice(0, takeRight);

      while (leftBatch.length || rightBatch.length) {
        if (leftBatch.length && (!rightBatch.length || Math.random() > 0.5)) {
          riffled.push(leftBatch.pop());
        } else if (rightBatch.length) {
          riffled.push(rightBatch.pop());
        }
      }
    }

    const cutPos = Math.floor(Math.random() * 80) + 116;
    shoe = riffled.slice(cutPos).concat(riffled.slice(0, cutPos));

    cutCardCount = Math.floor(Math.random() * 24) + 55;
    cutCardReached = false;
    shoe.pop();

    elShoeDisplay.textContent = shoe.length;
    elCutDisplay.textContent = cutCardCount + " cards";
  }

  function drawCard() {
    if (shoe.length <= cutCardCount) {
      cutCardReached = true;
    }
    if (shoe.length === 0) {
      initAndShuffleShoe();
    }
    const card = shoe.pop();
    elShoeDisplay.textContent = shoe.length;
    return card;
  }

  function calcHandScore(cards) {
    let score = 0;
    let aces = 0;
    for (let i = 0; i < cards.length; i++) {
      score += cards[i].value;
      if (cards[i].name === "A") aces++;
    }
    while (score > 21 && aces > 0) {
      score -= 10;
      aces--;
    }
    return score;
  }

  function createCardElement(card, isHidden) {
    const el = document.createElement("div");
    if (isHidden) {
      el.className = "card hidden";
      return el;
    }
    const isRed = card.suit === "♥" || card.suit === "♦";
    el.className = "card " + (isRed ? "red" : "black");
    el.innerHTML = "<div>" + card.name + '</div><div class="suit">' + card.suit + '</div><div class="corner-bottom">' + card.name + "</div>";
    return el;
  }

  function renderTable(hideDealerHoleCard = true) {
    elDealerCards.innerHTML = "";
    dealerCards.forEach((c, idx) => {
      elDealerCards.appendChild(createCardElement(c, idx === 1 && hideDealerHoleCard && !isRoundOver));
    });

    elDealerScore.textContent = hideDealerHoleCard && !isRoundOver
      ? (dealerCards[0] ? dealerCards[0].value : 0)
      : calcHandScore(dealerCards);

    const seatCount = getSeatsCount();
    elPlayerHandsContainer.innerHTML = "";

    if (seatCount > 1 && window.innerWidth >= 640) {
      const centerIndex = Math.floor(seatCount / 2);
      let botIdx = 0;

      for (let s = 0; s < seatCount; s++) {
        const box = document.createElement("div");
        const isCenter = s === centerIndex;
        let score = 0;
        let cardsArr = [];

        if (isCenter) {
          cardsArr = (playerHands[0] && playerHands[0].cards) || [];
          score = calcHandScore(cardsArr);
          const isActive = !isRoundOver && activeHandIndex === 0;
          box.className = isActive ? "hand-box active center-seat" : "hand-box center-seat";

          const label = document.createElement("div");
          label.className = "hand-label";
          label.innerHTML = "Score: <span>" + score + "</span>";
          box.appendChild(label);

          if (isRoundOver && playerHands[0] && playerHands[0].resTxt) {
            const badge = document.createElement("div");
            badge.className = "hand-result-badge " + (playerHands[0].resType || "win");
            badge.textContent = playerHands[0].resTxt;
            box.appendChild(badge);
          }
        } else {
          cardsArr = simulatedBotHands[botIdx] || [];
          score = calcHandScore(cardsArr);
          box.className = "hand-group";

          const label = document.createElement("div");
          label.className = "hand-label";
          label.innerHTML = "Score: <span>" + score + "</span>";
          box.appendChild(label);
          botIdx++;
        }

        const cardsRow = document.createElement("div");
        cardsRow.className = "cards-row";
        cardsArr.forEach(c => cardsRow.appendChild(createCardElement(c, false)));
        box.appendChild(cardsRow);
        elPlayerHandsContainer.appendChild(box);
      }
    } else {
      playerHands.forEach((hand, idx) => {
        const score = calcHandScore(hand.cards);
        const box = document.createElement("div");
        box.className = !isRoundOver && idx === activeHandIndex ? "hand-box active" : "hand-box";

        const label = document.createElement("div");
        label.className = "hand-label";
        label.innerHTML = "Score: <span>" + score + "</span>";
        box.appendChild(label);

        if (isRoundOver && hand.resTxt) {
          const badge = document.createElement("div");
          badge.className = "hand-result-badge " + (hand.resType || "win");
          badge.textContent = hand.resTxt;
          box.appendChild(badge);
        }

        const cardsRow = document.createElement("div");
        cardsRow.className = "cards-row";
        hand.cards.forEach(c => cardsRow.appendChild(createCardElement(c, false)));
        box.appendChild(cardsRow);
        elPlayerHandsContainer.appendChild(box);
      });
    }

    elBetDisplay.textContent = isRoundOver
      ? currentBet
      : playerHands.reduce((acc, h) => acc + h.bet, 0) || currentBet;

    elBankDisplay.textContent = userBank;
  }

  function initGameState(bankAmount) {
    userBank = parseFloat(bankAmount);
    currentBet = 0;
    currentInsuranceBet = 0;
    isRoundOver = true;
    dealerCards = [];
    playerHands = [];
    simulatedBotHands = [];

    elBankDisplay.textContent = userBank;
    elBetDisplay.textContent = 0;
    elMessageBanner.textContent = "Place your bet and press DEAL!";
    elDealerScore.textContent = "0";
    elDealerCards.innerHTML = "";
    elPlayerHandsContainer.innerHTML = "";

    const seatInput = document.getElementById("table-seats-input");
    if (seatInput) seatInput.value = "";

    initAndShuffleShoe();
    updateButtonStates();
    updateResponsiveCardScale();
    renderTable();
  }

  global.addBet = function (amount) {
    playChipSfx();
    if (!isRoundOver) {
      dealerCards = [];
      playerHands = [];
      simulatedBotHands = [];
      elDealerCards.innerHTML = "";
      elPlayerHandsContainer.innerHTML = "";
      elDealerScore.textContent = "0";
      isRoundOver = true;
    }

    if (currentBet >= 500) {
      elMessageBanner.textContent = "Maximum bet is $500!";
      return;
    }

    const betToAdd = Math.min(amount, 500 - currentBet);
    if (userBank >= betToAdd) {
      userBank -= betToAdd;
      currentBet += betToAdd;
      elBankDisplay.textContent = userBank;
      elBetDisplay.textContent = currentBet;

      if (currentBet === 500) {
        elMessageBanner.textContent = "Max bet reached ($500)";
      } else if (elMessageBanner.textContent.includes("bet")) {
        elMessageBanner.textContent = "";
      }
    } else if (userBank <= 0 && currentBet === 0) {
      global.openStoreModal();
    }
  };

  global.clearBet = function () {
    playChipSfx();
    if (!isRoundOver) return;
    userBank += currentBet;
    currentBet = 0;
    elBankDisplay.textContent = userBank;
    elBetDisplay.textContent = 0;
    elMessageBanner.textContent = "";
  };

  function updateButtonStates() {
    if (isRoundOver) {
      elDealBtn.disabled = false;
      elHitBtn.disabled = elStandBtn.disabled = elDoubleBtn.disabled = elSplitBtn.disabled = true;
      elChipControls.style.opacity = "1";
      elChipControls.querySelectorAll(".chip, button").forEach(c => (c.style.pointerEvents = "auto"));
      return;
    }

    elDealBtn.disabled = true;
    elChipControls.style.opacity = "0.3";
    elChipControls.querySelectorAll(".chip, button").forEach(c => (c.style.pointerEvents = "none"));

    const curHand = playerHands[activeHandIndex];
    if (!curHand) return;

    if (curHand.isSplitAce) {
      elHitBtn.disabled = elDoubleBtn.disabled = elSplitBtn.disabled = true;
      elStandBtn.disabled = false;
      return;
    }

    elHitBtn.disabled = elStandBtn.disabled = false;
    elDoubleBtn.disabled = !(curHand.cards.length === 2 && userBank >= curHand.bet);

    const isPair = curHand.cards.length === 2 && curHand.cards[0].value === curHand.cards[1].value;
    const isPairAces = curHand.cards.length === 2 && curHand.cards[0].name === "A";

    elSplitBtn.disabled = !(
      playerHands.length < MAX_SPLIT_HANDS &&
      isPair &&
      userBank >= curHand.bet &&
      (!curHand.isSplitAce || !isPairAces)
    );
  }

  function promptInsuranceModal() {
    return new Promise(resolve => {
      insuranceResolvePromise = resolve;
      const cost = Math.floor(playerHands[0].bet / 2);
      document.getElementById("insurance-amount-label").textContent = "Insurance Cost: $" + cost;
      const yesBtn = document.getElementById("ins-yes-btn");

      if (userBank < cost) {
        yesBtn.disabled = true;
        yesBtn.textContent = "Insufficient Funds";
      } else {
        yesBtn.disabled = false;
        yesBtn.textContent = "Take Insurance";
      }

      document.getElementById("insurance-modal").classList.add("active");
    });
  }

  global.handleInsuranceChoice = function (accepted) {
    document.getElementById("insurance-modal").classList.remove("active");
    if (insuranceResolvePromise) {
      const cb = insuranceResolvePromise;
      insuranceResolvePromise = null;
      cb(accepted);
    }
  };

  function playBotsTurn() {
    simulatedBotHands.forEach(hand => {
      while (true) {
        const score = calcHandScore(hand);
        const hasAce = hand.some(c => c.name === "A");
        if (score < 17) {
          hand.push(drawCard());
        } else if (score === 17 && hasAce) {
          hand.push(drawCard());
        } else {
          break;
        }
      }
    });
  }

  global.startGame = async function () {
    playCardDealSfx();
    if (currentBet === 0) {
      if (userBank <= 0) {
        global.openStoreModal();
      } else {
        elMessageBanner.textContent = "Please place a bet first!";
      }
      return;
    }

    if (cutCardReached || shoe.length <= cutCardCount) {
      initAndShuffleShoe();
      elMessageBanner.textContent = "Cut card reached! Shoe reshuffled & card burned.";
    } else {
      elMessageBanner.textContent = "";
    }

    isRoundOver = false;
    currentInsuranceBet = 0;
    playerHands = [{ cards: [], bet: currentBet, status: "playing", isSplitAce: false }];
    currentBet = 0;
    activeHandIndex = 0;
    dealerCards = [];
    simulatedBotHands = [];

    const seats = getSeatsCount();
    const botCount = seats - 1;

    playerHands[0].cards.push(drawCard());
    for (let i = 0; i < botCount; i++) simulatedBotHands.push([drawCard()]);
    dealerCards.push(drawCard());
    playerHands[0].cards.push(drawCard());
    for (let i = 0; i < botCount; i++) simulatedBotHands[i].push(drawCard());
    dealerCards.push(drawCard());

    updateResponsiveCardScale();
    renderTable(true);
    updateButtonStates();

    const upCard = dealerCards[0];
    const dealerHasBlackjack = calcHandScore(dealerCards) === 21;

    if (upCard.name === "A") {
      const wantsInsurance = await promptInsuranceModal();
      if (wantsInsurance) {
        const cost = Math.floor(playerHands[0].bet / 2);
        currentInsuranceBet = cost;
        userBank -= cost;
        elBankDisplay.textContent = userBank;
      }

      if (dealerHasBlackjack) {
        if (currentInsuranceBet > 0) {
          const payout = currentInsuranceBet * 3;
          userBank += payout;
          elBankDisplay.textContent = userBank;
          elMessageBanner.textContent = "Dealer has Blackjack! Insurance pays 2:1 (+$" + (currentInsuranceBet * 2) + ").";
          if (playerHands[0]) {
            playerHands[0].resTxt = "PUSH";
            playerHands[0].resType = "push";
          }
        } else {
          elMessageBanner.textContent = "Dealer has Blackjack!";
          if (playerHands[0]) {
            playerHands[0].resTxt = "-$" + playerHands[0].bet;
            playerHands[0].resType = "loss";
          }
        }
        resolveDealerHandAndPayouts();
        return;
      } else if (currentInsuranceBet > 0) {
        elMessageBanner.textContent = "Insurance collected.";
      }
    } else if (upCard.value === 10 && dealerHasBlackjack) {
      elMessageBanner.textContent = "Dealer has Blackjack!";
      resolveDealerHandAndPayouts();
      return;
    }

    if (playerHands[0].cards.length === 2 && calcHandScore(playerHands[0].cards) === 21) {
      resolveDealerHandAndPayouts();
    }
  };

  global.playerHit = function () {
    playCardDealSfx();
    const hand = playerHands[activeHandIndex];
    hand.cards.push(drawCard());

    const score = calcHandScore(hand.cards);
    if (score >= 21) {
      hand.status = score > 21 ? "busted" : "stood";
      renderTable(true);
      advanceToNextHand();
    } else {
      renderTable(true);
      updateButtonStates();
    }
  };

  global.playerDouble = function () {
    const hand = playerHands[activeHandIndex];
    userBank -= hand.bet;
    hand.bet *= 2;
    hand.cards.push(drawCard());

    const score = calcHandScore(hand.cards);
    hand.status = score > 21 ? "busted" : "stood";
    renderTable(true);
    advanceToNextHand();
  };

  global.playerSplit = function () {
    const hand = playerHands[activeHandIndex];
    userBank -= hand.bet;

    const firstCard = hand.cards[0];
    const secondCard = hand.cards[1];
    const isAceSplit = firstCard.name === "A";

    const handA = {
      cards: [firstCard, drawCard()],
      bet: hand.bet,
      status: isAceSplit ? "stood" : "playing",
      isSplitAce: isAceSplit
    };

    const handB = {
      cards: [secondCard, drawCard()],
      bet: hand.bet,
      status: isAceSplit ? "stood" : "playing",
      isSplitAce: isAceSplit
    };

    playerHands.splice(activeHandIndex, 1, handA, handB);
    updateResponsiveCardScale();
    renderTable(true);

    if (isAceSplit) {
      advanceToNextHand();
    } else {
      updateButtonStates();
    }
  };

  global.playerStand = function () {
    playerHands[activeHandIndex].status = "stood";
    advanceToNextHand();
  };

  function advanceToNextHand() {
    const nextIdx = playerHands.findIndex((h, idx) => idx >= activeHandIndex && h.status === "playing");
    if (nextIdx !== -1) {
      activeHandIndex = nextIdx;
      renderTable(true);
      updateButtonStates();
    } else {
      resolveDealerHandAndPayouts();
    }
  }

  function dealerMustHit(cards) {
    let score = 0;
    let aces = 0;
    for (let i = 0; i < cards.length; i++) {
      score += cards[i].value;
      if (cards[i].name === "A") aces++;
    }
    while (score > 21 && aces > 0) {
      score -= 10;
      aces--;
    }
    if (score < 17) return true;
    if (score === 17 && aces > 0) return true;
    return false;
  }

  function resolveDealerHandAndPayouts() {
    isRoundOver = true;
    playBotsTurn();

    const dealerHasNatural = dealerCards.length === 2 && calcHandScore(dealerCards) === 21;
    const allPlayerHandsBusted = playerHands.every(h => calcHandScore(h.cards) > 21);

    if (!dealerHasNatural && !allPlayerHandsBusted) {
      while (dealerMustHit(dealerCards)) {
        dealerCards.push(drawCard());
      }
    }

    const dealerScore = calcHandScore(dealerCards);
    let totalWon = 0;
    let hasNaturalBlackjack = false;
    let celebrationWinAmount = 0;

    playerHands.forEach(hand => {
      const playerScore = calcHandScore(hand.cards);
      const isNatural = hand.cards.length === 2 && playerScore === 21 && playerHands.length === 1;

      if (playerScore > 21) {
        hand.resTxt = "-$" + hand.bet;
        hand.resType = "loss";
      } else if (isNatural) {
        if (dealerHasNatural) {
          totalWon += hand.bet;
          hand.resTxt = "PUSH";
          hand.resType = "push";
        } else {
          const payout = Math.floor(hand.bet * 2.5);
          totalWon += payout;
          hasNaturalBlackjack = true;
          celebrationWinAmount = payout;
          hand.resTxt = "+$" + Math.floor(hand.bet * 1.5);
          hand.resType = "win";
        }
      } else if (dealerHasNatural) {
        hand.resTxt = "-$" + hand.bet;
        hand.resType = "loss";
      } else if (dealerScore > 21 || playerScore > dealerScore) {
        totalWon += hand.bet * 2;
        hand.resTxt = "+$" + hand.bet;
        hand.resType = "win";
      } else if (playerScore === dealerScore) {
        totalWon += hand.bet;
        hand.resTxt = "PUSH";
        hand.resType = "push";
      } else {
        hand.resTxt = "-$" + hand.bet;
        hand.resType = "loss";
      }
    });

    userBank += totalWon;

    let banner = "";
    if (dealerHasNatural) {
      if (currentInsuranceBet > 0) {
        banner = "Dealer has Blackjack! Insurance pays 2:1 (+$" + (currentInsuranceBet * 2) + ").";
      } else {
        banner = "Dealer has Blackjack!";
      }
    } else {
      if (currentInsuranceBet > 0) banner = "Insurance collected. ";
      if (dealerScore > 21) banner += "Dealer Busted!";
    }

    if (cutCardReached) {
      banner += "<br><span style='color:var(--gold);'>(Cut Card Reached - Reshuffling Next Deal)</span>";
    }

    elMessageBanner.innerHTML = banner;
    renderTable(false);
    elBetDisplay.textContent = 0;
    updateButtonStates();
    syncBankToServer(userBank);

    if (hasNaturalBlackjack) {
      triggerCelebration(celebrationWinAmount);
    }

    if (userBank <= 0 && currentBet === 0) {
      elMessageBanner.innerHTML += "<br><span style='color:var(--gold);'>Out of credits! Click '+ Credits' to refill.</span>";
      setTimeout(global.openStoreModal, 1200);
    }
  }

  // Easter egg: Triple click table title to open Admin Modal
  document.addEventListener("DOMContentLoaded", function () {
    const titleEl = document.getElementById("table-title");
    let clickCount = 0;
    let clickTimer = null;

    if (titleEl) {
      titleEl.addEventListener("click", function () {
        clickCount++;
        clearTimeout(clickTimer);
        clickTimer = setTimeout(() => { clickCount = 0; }, 900);
        if (clickCount >= 3) {
          clickCount = 0;
          global.openAdminModal();
        }
      });
    }

    updateResponsiveCardScale();
  });

})(window);