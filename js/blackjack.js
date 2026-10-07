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

  function updateAudioButtonUI() {
    const btn = document.getElementById("audioToggleBtn");
    if (!btn) return;
    if (sfxAudioEnabled) {
      btn.innerHTML = "🔊 Audio ON";
      btn.className = "hdr-btn active";
      btn.style.background = "rgba(46, 204, 113, 0.35)";
      btn.style.borderColor = "#2ecc71";
      btn.style.color = "#2ecc71";
      btn.style.boxShadow = "0 0 10px rgba(46, 204, 113, 0.45)";
    } else {
      btn.innerHTML = "🔇 Audio OFF";
      btn.className = "hdr-btn muted";
      btn.style.background = "rgba(100, 116, 139, 0.25)";
      btn.style.borderColor = "#64748b";
      btn.style.color = "#94a3b8";
      btn.style.boxShadow = "none";
    }
  }

  global.toggleAudio = function () {
    initBackgroundAudio();
    getAudioContext();
    if (backgroundAudio.paused) {
      backgroundAudio
        .play()
        .then(() => {
          sfxAudioEnabled = true;
          updateAudioButtonUI();
          global.showNotification("Casino Music & SFX Enabled", true);
        })
        .catch(() => {
          sfxAudioEnabled = true;
          updateAudioButtonUI();
          global.showNotification("Audio Enabled! Tap screen to start music.", true);
        });
    } else {
      backgroundAudio.pause();
      sfxAudioEnabled = false;
      updateAudioButtonUI();
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
  let roundCleanupTimer = null;

  let userId = null;
  let userEmail = "";

  // Table Seats tracker - Default to 1 seat at startup
  let activeTableSeats = 1;

  // Bot hands structure: [ [ { cards:[], status:'', isSplitAce:false }, ... ], ... ]
  let simulatedBotHands = [];
  let dealerCards = [];
  let playerHands = [];

  function getEl(id) {
    return document.getElementById(id);
  }

  function getSeatsCount() {
    const input = getEl("table-seats-input");
    const val = input ? input.value.trim() : "";
    if (val === "") return activeTableSeats || 1;
    const count = parseInt(val, 10);
    if (isNaN(count) || count < 1) return 1;
    return count > 7 ? 7 : count;
  }

  function updateResponsiveCardScale() {
    const seats = getSeatsCount();
    const container = getEl("game-container");
    if (!container) return;

    const availableWidth = container.clientWidth;
    const availableHeight = container.clientHeight;

    const isUserSplit = playerHands && playerHands.length > 1;
    const anyBotSplit = simulatedBotHands && simulatedBotHands.some(b => b && b.length > 1);
    const hasAnySplit = isUserSplit || anyBotSplit;
    const availableCardAreaHeight = Math.max(120, availableHeight - (hasAnySplit ? 230 : 200));
    const maxCardHeight = Math.floor(availableCardAreaHeight / (hasAnySplit ? 2.5 : 2.0));

    let targetHeight;
    let targetWidth;

    if (availableWidth >= 2400 || availableHeight >= 1300) {
      // 4K / Ultra High Resolution (3840x2160, 4K monitors/TVs)
      let baseHeight = 135;
      if (seats >= 6) {
        baseHeight = 98;
      } else if (seats >= 4) {
        baseHeight = 110;
      } else if (seats >= 2) {
        baseHeight = 122;
      }
      if (hasAnySplit) baseHeight = Math.min(baseHeight, 92);

      targetHeight = Math.min(baseHeight, Math.max(60, maxCardHeight));
      targetWidth = Math.round(targetHeight / 1.42);

      const maxColWidth = Math.floor((availableWidth - (seats * 16) - 50) / seats);
      const allowedCardWidth = Math.floor(maxColWidth * 0.65);
      if (targetWidth > allowedCardWidth && allowedCardWidth >= 36) {
        targetWidth = allowedCardWidth;
        targetHeight = Math.round(targetWidth * 1.42);
      }
    } else if (availableWidth < 640) {
      // Mobile portrait
      const baseHeight = hasAnySplit ? 54 : 70;
      targetHeight = Math.min(baseHeight, Math.max(42, maxCardHeight));
      targetWidth = Math.round(targetHeight / 1.42);

      const maxHorizontalWidth = Math.floor((availableWidth - 36) / Math.max(3, seats * 1.8));
      if (targetWidth > maxHorizontalWidth) {
        targetWidth = Math.max(28, maxHorizontalWidth);
        targetHeight = Math.round(targetWidth * 1.42);
      }
    } else if (availableHeight < 560) {
      // Short screen landscape
      targetHeight = Math.min(52, Math.max(36, maxCardHeight));
      targetWidth = Math.round(targetHeight / 1.42);
    } else {
      // Desktop PC, Mac, 25-inch monitors, Quest VR
      let baseHeight = 118;
      if (seats >= 6) {
        baseHeight = 84;
      } else if (seats >= 4) {
        baseHeight = 96;
      } else if (seats >= 2) {
        baseHeight = 108;
      }
      if (hasAnySplit) baseHeight = Math.min(baseHeight, 82);

      targetHeight = Math.min(baseHeight, Math.max(50, maxCardHeight));
      targetWidth = Math.round(targetHeight / 1.42);

      const maxColWidth = Math.floor((availableWidth - (seats * 12) - 40) / seats);
      const allowedCardWidth = Math.floor(maxColWidth * 0.65);
      if (targetWidth > allowedCardWidth && allowedCardWidth >= 30) {
        targetWidth = allowedCardWidth;
        targetHeight = Math.round(targetWidth * 1.42);
      }
    }

    document.documentElement.style.setProperty("--card-w", targetWidth + "px");
    document.documentElement.style.setProperty("--card-h", targetHeight + "px");

    let maxSlotW = "clamp(240px, 28vw, 420px)";
    if (seats >= 6) {
      maxSlotW = "clamp(140px, 13vw, 215px)";
    } else if (seats >= 4) {
      maxSlotW = "clamp(180px, 18vw, 280px)";
    } else if (seats === 3) {
      maxSlotW = "clamp(220px, 25vw, 380px)";
    }
    document.documentElement.style.setProperty("--seat-slot-max-w", maxSlotW);
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
    activeTableSeats = getSeatsCount();
    updateResponsiveCardScale();
    renderTable();
  };

  // Basic Strategy Pair Splitting Decisions
  function shouldSplitBasicStrategy(c1, c2, dealerUpCard) {
    if (!c1 || !c2 || !dealerUpCard) return false;
    if (c1.value !== c2.value) return false;

    const rank = c1.name;
    const dVal = dealerUpCard.value;

    if (rank === "A" || rank === "8") return true;
    if (c1.value === 10 || rank === "5") return false;
    if (rank === "9") return (dVal >= 2 && dVal <= 9 && dVal !== 7);
    if (rank === "7") return (dVal >= 2 && dVal <= 7);
    if (rank === "6") return (dVal >= 2 && dVal <= 6);
    if (rank === "4") return (dVal === 5 || dVal === 6);
    if (rank === "2" || rank === "3") return (dVal >= 2 && dVal <= 7);

    return false;
  }

  // Returns { total, isSoft } for accurate Basic Strategy evaluation
  function getHandDetails(cards) {
    let rawTotal = 0;
    let aceCount = 0;

    for (let i = 0; i < cards.length; i++) {
      rawTotal += cards[i].value;
      if (cards[i].name === "A") aceCount++;
    }

    let isSoft = false;
    while (rawTotal > 21 && aceCount > 0) {
      rawTotal -= 10;
      aceCount--;
    }

    if (aceCount > 0 && rawTotal <= 21) {
      isSoft = true;
    }

    return { total: rawTotal, isSoft: isSoft };
  }

  // Basic Strategy Hit/Stand decision for bots playing each hand/sub-hand
  function botShouldHitBasicStrategy(cards, dealerUpCard) {
    if (!cards || cards.length === 0 || !dealerUpCard) return false;

    const { total, isSoft } = getHandDetails(cards);
    const dVal = dealerUpCard.value;

    if (total >= 21) return false;

    if (isSoft) {
      // Soft 19+ (A,8 or higher): Always Stand
      if (total >= 19) return false;
      // Soft 18 (A,7): Stand vs 2, 7, 8; Hit vs 9, 10, A
      if (total === 18) {
        return (dVal >= 9 || dVal === 11);
      }
      // Soft 17 or lower (A,2 through A,6): Always Hit
      return true;
    }

    // Hard totals
    if (total >= 17) return false;
    if (total >= 13 && total <= 16) {
      // Stand vs 2-6; Hit vs 7-A
      return !(dVal >= 2 && dVal <= 6);
    }
    if (total === 12) {
      // Stand vs 4, 5, 6; Hit vs 2, 3, and 7-A
      return !(dVal >= 4 && dVal <= 6);
    }

    // 11 or lower: Always Hit
    return true;
  }

  global.checkPasswordRules = function (password) {
    if (currentAuthTab !== "register") return;
    const pwd = (password || "").toString();

    const setRuleState = (id, isValid) => {
      const el = getEl(id);
      if (el) el.className = isValid ? "rule-item valid" : "rule-item invalid";
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
    const pwdEl = getEl("auth-password");
    const pwd = pwdEl ? pwdEl.value : "";
    const confirmEl = getEl("auth-password-confirm");
    const confirmPwd = confirmEl ? confirmEl.value : "";
    const matchRule = getEl("r-match");

    const isMatch = pwd.length > 0 && pwd === confirmPwd;
    if (matchRule) {
      matchRule.className = isMatch ? "rule-item valid" : "rule-item invalid";
    }
    return isMatch;
  };

  global.switchAuthTab = function (tab) {
    currentAuthTab = tab;
    const tabReg = getEl("tab-reg");
    const tabLogin = getEl("tab-login");
    if (tabReg) tabReg.classList.toggle("active", tab === "register");
    if (tabLogin) tabLogin.classList.toggle("active", tab === "login");

    const rulesEl = getEl("password-rules");
    const confirmGroup = getEl("confirm-password-group");
    const confirmInput = getEl("auth-password-confirm");
    const submitBtn = getEl("auth-submit-btn");
    const idLabel = getEl("auth-id-label");
    const idInput = getEl("auth-identifier");

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
      const pwdVal = getEl("auth-password") ? getEl("auth-password").value : "";
      global.checkPasswordRules(pwdVal);
    } else {
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
    const alertEl = getEl("auth-alert");
    if (!alertEl) return;
    alertEl.innerHTML = msg;
    alertEl.className = isError ? "auth-alert error" : "auth-alert success";
    alertEl.style.display = "block";
  }

  function clearAuthAlert() {
    const alertEl = getEl("auth-alert");
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

    const idInput = getEl("auth-identifier");
    const pwdInput = getEl("auth-password");
    const identifier = idInput ? idInput.value.trim() : "";
    const password = pwdInput ? pwdInput.value : "";
    const confirmInput = getEl("auth-password-confirm");
    const confirmPassword = confirmInput ? confirmInput.value : "";

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
        if (getEl("auth-password")) {
          getEl("auth-password").value = "";
          getEl("auth-password").focus();
        }
        return;
      }

      if (!data.success) {
        showAuthAlert(data.message, true);
        return;
      }

      userId = data.user.id;
      userEmail = data.user.email || identifier;
      const loadedBank = parseFloat(data.user.bank);

      const lobbyScreen = getEl("lobby-screen");
      const gameScreen = getEl("game-screen");
      if (lobbyScreen) lobbyScreen.classList.remove("active");
      if (gameScreen) gameScreen.classList.add("active");

      loadAdminMode();
      initGameState(loadedBank);
      updateResponsiveCardScale();
    } catch (err) {
      showAuthAlert("Network Error: " + err.message, true);
    }
  };

  global.executeLogout = async function () {
    if (roundCleanupTimer) {
      clearTimeout(roundCleanupTimer);
      roundCleanupTimer = null;
    }
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

    const gameScreen = getEl("game-screen");
    const lobbyScreen = getEl("lobby-screen");
    if (gameScreen) gameScreen.classList.remove("active");
    if (lobbyScreen) lobbyScreen.classList.add("active");

    const pwdEl = getEl("auth-password");
    if (pwdEl) pwdEl.value = "";
    const confirmEl = getEl("auth-password-confirm");
    if (confirmEl) confirmEl.value = "";

    userId = null;
    userEmail = "";
    shoe = [];
    dealerCards = [];
    playerHands = [];
    simulatedBotHands = [];
  };

  let androidSimulationMode = false;

  async function loadAdminMode() {
    try {
      const res = await fetch(API_BASE + "/admin_api.php?action=get_mode&_t=" + Date.now(), {
        credentials: "include"
      });
      const data = await res.json();
      if (data.success) {
        simulationMode = Boolean(data.desktop_simulation_mode !== undefined ? data.desktop_simulation_mode : data.simulation_mode);
        androidSimulationMode = Boolean(data.android_simulation_mode);
        applyStoreModeUI();
      }
    } catch (e) {}
  }

  function applyStoreModeUI() {
    const simBox = getEl("simulation-container");
    const liveBox = getEl("paypal-live-container");

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

    const simBtn = getEl("sim-buy-btn");
    if (simBtn) simBtn.textContent = "Add Credits (Simulated $" + price + ")";
  };

  global.openStoreModal = function () {
    loadAdminMode();
    const modal = getEl("store-modal");
    if (modal) modal.classList.add("active");
  };

  global.closeStoreModal = function () {
    const modal = getEl("store-modal");
    if (modal) modal.classList.remove("active");
  };

  global.openAdminModal = function () {
    const simToggle = getEl("admin-sim-toggle");
    if (simToggle) simToggle.checked = simulationMode;
    const androidToggle = getEl("admin-android-sim-toggle");
    if (androidToggle) androidToggle.checked = androidSimulationMode;
    const modal = getEl("admin-modal");
    if (modal) modal.classList.add("active");
  };

  global.closeAdminModal = function () {
    const modal = getEl("admin-modal");
    if (modal) modal.classList.remove("active");
  };

  global.saveAdminSettings = async function () {
    const adminKeyInput = getEl("admin-key");
    const adminKey = adminKeyInput ? adminKeyInput.value : "";
    const simToggle = getEl("admin-sim-toggle");
    const desktopSim = simToggle && simToggle.checked ? 1 : 0;
    const androidToggle = getEl("admin-android-sim-toggle");
    const androidSim = androidToggle && androidToggle.checked ? 1 : 0;

    try {
      const headers = { "Content-Type": "application/json" };
      const jwtToken = sessionStorage.getItem("cc_admin_jwt");
      if (jwtToken) {
        headers["Authorization"] = "Bearer " + jwtToken;
      }

      const res = await fetch(API_BASE + "/admin_api.php?action=set_mode", {
        method: "POST",
        headers: headers,
        credentials: "include",
        body: JSON.stringify({
          admin_key: adminKey,
          token: adminKey,
          desktop_simulation_mode: desktopSim,
          simulation_mode: desktopSim,
          android_simulation_mode: androidSim
        })
      });
      const data = await res.json();

      if (!data.success) {
        global.showNotification("Admin Error: " + data.message, false);
        return;
      }

      simulationMode = Boolean(data.desktop_simulation_mode !== undefined ? data.desktop_simulation_mode : data.simulation_mode);
      androidSimulationMode = Boolean(data.android_simulation_mode);
      global.showNotification("Modes updated:\nDesktop: " + (simulationMode ? "SIMULATED" : "LIVE PAYPAL") + "\nAndroid: " + (androidSimulationMode ? "SIMULATED" : "LIVE GOOGLE PLAY"), true);
      global.closeAdminModal();
      applyStoreModeUI();
    } catch (err) {
      global.showNotification("Connection error: " + err.message, false);
    }
  };

  global.executeSimulatedPurchase = async function () {
    const check = getEl("accept-terms-check");
    if (check && !check.checked) {
      global.showNotification("Please review and check the Terms of Service acceptance box.", false);
      return;
    }

    try {
      const res = await fetch(API_BASE + "/admin_api.php?action=buy_credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ package: selectedPackageCredits, user_id: userId, email: userEmail, platform: 'desktop' })
      });
      const data = await res.json();

      if (!data.success) {
        global.showNotification(data.message, false);
        return;
      }

      userBank = parseFloat(data.new_bank);
      const bankDisplay = getEl("bank-display");
      if (bankDisplay) bankDisplay.textContent = userBank;
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
        const terms = getEl("accept-terms-check");
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
          const bankDisplay = getEl("bank-display");
          if (bankDisplay) bankDisplay.textContent = userBank;
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

  // Confetti celebration animation
  let confettiAnimId = null;
  let confettiParticles = [];
  let celebrationDismissTimer = null;

  function triggerCelebration(wonAmount) {
    playWinFanfareSfx();
    const overlay = getEl("celebration-overlay");
    const payoutEl = getEl("celebration-payout");
    if (payoutEl) payoutEl.textContent = "Won $" + wonAmount + " (3:2 Payout)";
    if (overlay) overlay.classList.add("active");
    startConfetti();
    clearTimeout(celebrationDismissTimer);
    celebrationDismissTimer = setTimeout(global.closeBlackjackCelebration, 4000);
  }

  global.closeBlackjackCelebration = function () {
    const overlay = getEl("celebration-overlay");
    if (overlay) overlay.classList.remove("active");
    stopConfetti();
    clearTimeout(celebrationDismissTimer);
  };

  function startConfetti() {
    const canvas = getEl("confetti-canvas");
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
    const canvas = getEl("confetti-canvas");
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

    const shoeDisplay = getEl("shoe-display");
    const cutDisplay = getEl("cut-display");
    if (shoeDisplay) shoeDisplay.textContent = shoe.length;
    if (cutDisplay) cutDisplay.textContent = cutCardCount + " cards";
  }

  function drawCard() {
    if (shoe.length <= cutCardCount) {
      cutCardReached = true;
    }
    if (shoe.length === 0) {
      initAndShuffleShoe();
    }
    const card = shoe.pop();
    const shoeDisplay = getEl("shoe-display");
    if (shoeDisplay) shoeDisplay.textContent = shoe.length;
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

  function isHandSoft(cards) {
    if (!Array.isArray(cards)) return false;
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
    return aces > 0;
  }

  function createCardElement(card, isHidden, cardIndex = 0) {
    const el = document.createElement("div");
    if (isHidden) {
      el.className = "card hidden";
      el.style.zIndex = cardIndex + 1;
      return el;
    }
    const isRed = card.suit === "♥" || card.suit === "♦";
    el.className = "card " + (isRed ? "red" : "black");
    el.style.zIndex = cardIndex + 1;
    el.innerHTML = "<div>" + card.name + '</div><div class="suit">' + card.suit + '</div><div class="corner-bottom">' + card.name + "</div>";
    return el;
  }

  function clearCardsAfterRound() {
    dealerCards = [];
    playerHands = [];
    simulatedBotHands = [];

    const dealerCardsEl = getEl("dealer-cards");
    const dealerScoreEl = getEl("dealer-score");
    const splitStageEl = getEl("player-split-stage");
    const rulesBannerEl = getEl("felt-rules-banner");
    const messageBanner = getEl("message-banner");

    if (dealerCardsEl) dealerCardsEl.innerHTML = "";
    if (dealerScoreEl) dealerScoreEl.textContent = "0";
    if (splitStageEl) {
      splitStageEl.innerHTML = "";
      splitStageEl.classList.remove("active");
    }
    if (rulesBannerEl) rulesBannerEl.classList.remove("faded");
    if (messageBanner && isRoundOver) {
      messageBanner.textContent = "Place your bet and press DEAL!";
    }

    renderTable(false);
  }

  // RENDER TABLE: Displays solely cards values above the cards
  function renderTable(hideDealerHoleCard = true) {
    const dealerCardsEl = getEl("dealer-cards");
    const dealerScoreEl = getEl("dealer-score");
    const handsContainerEl = getEl("player-hands-container");
    const splitStageEl = getEl("player-split-stage");
    const rulesBannerEl = getEl("felt-rules-banner");
    const betDisplayEl = getEl("bet-display");
    const bankDisplayEl = getEl("bank-display");

    if (dealerCardsEl) {
      dealerCardsEl.innerHTML = "";
      dealerCards.forEach((c, idx) => {
        dealerCardsEl.appendChild(createCardElement(c, idx === 1 && hideDealerHoleCard && !isRoundOver, idx));
      });
    }

    if (dealerScoreEl) {
      dealerScoreEl.textContent = hideDealerHoleCard && !isRoundOver
        ? (dealerCards[0] ? dealerCards[0].value : 0)
        : calcHandScore(dealerCards);
    }

    const seatCount = activeTableSeats || getSeatsCount();
    const isUserSplit = playerHands && playerHands.length > 1;
    const anyBotSplit = simulatedBotHands && simulatedBotHands.some(b => b && b.length > 1);
    const hasAnySplit = isUserSplit || anyBotSplit;

    if (handsContainerEl) handsContainerEl.innerHTML = "";
    if (splitStageEl) splitStageEl.innerHTML = "";

    const isMultiRow = (seatCount >= 3 && window.innerWidth >= 640);
    if (handsContainerEl) {
      if (isMultiRow) {
        handsContainerEl.classList.add("multi-player-row");
      } else {
        handsContainerEl.classList.remove("multi-player-row");
      }
    }
    if (splitStageEl) {
      if (isMultiRow) {
        splitStageEl.classList.add("multi-player-row");
      } else {
        splitStageEl.classList.remove("multi-player-row");
      }
    }

    // 1. ELEVATED SPLIT STAGE: Render split hands in a column directly above the seat where its cards came from
    if (hasAnySplit && splitStageEl) {
      splitStageEl.classList.add("active");
      if (rulesBannerEl) rulesBannerEl.classList.add("faded");

      const centerIndex = (seatCount > 1) ? Math.floor(seatCount / 2) : 0;

      for (let s = 0; s < seatCount; s++) {
        const isCenter = (s === centerIndex);
        let seatHands = [];
        let isUser = false;

        if (isCenter) {
          if (isUserSplit) {
            seatHands = playerHands;
            isUser = true;
          }
        } else {
          const botIdx = s < centerIndex ? s : s - 1;
          const bHands = simulatedBotHands[botIdx] || [];
          if (bHands.length > 1) {
            seatHands = bHands;
            isUser = false;
          }
        }

        const slot = document.createElement("div");
        slot.className = "split-seat-slot";

        if (seatHands.length > 1) {
          const handsCount = Math.min(seatHands.length, 4);
          const seatGroup = document.createElement("div");
          seatGroup.className = "split-seat-group " + (isUser ? "user-split-group" : "bot-split-group") + " split-hands-" + handsCount;

          const splitRow = document.createElement("div");
          splitRow.className = "split-hands-row";

          seatHands.forEach((hand, hIdx) => {
            const score = calcHandScore(hand.cards);
            const splitBox = document.createElement("div");
            splitBox.className = (isUser && !isRoundOver && hIdx === activeHandIndex) ? "hand-box active" : "hand-box";

            const label = document.createElement("div");
            label.className = "hand-label";
            label.textContent = score;
            splitBox.appendChild(label);

            if (isRoundOver && hand.resTxt) {
              const badge = document.createElement("div");
              badge.className = "hand-result-badge " + (hand.resType || "win");
              badge.textContent = hand.resTxt;
              splitBox.appendChild(badge);
            }

            const cardsRow = document.createElement("div");
            cardsRow.className = "cards-row cascading";
            hand.cards.forEach((c, cIdx) => cardsRow.appendChild(createCardElement(c, false, cIdx)));
            splitBox.appendChild(cardsRow);
            splitRow.appendChild(splitBox);
          });

          seatGroup.appendChild(splitRow);
          slot.appendChild(seatGroup);
        } else {
          slot.className = "split-seat-slot empty";
          slot.style.visibility = "hidden";
          slot.style.pointerEvents = "none";
          slot.innerHTML = '<div style="height: 1px;"></div>';
        }

        splitStageEl.appendChild(slot);
      }
    } else {
      if (splitStageEl) splitStageEl.classList.remove("active");
      if (rulesBannerEl) rulesBannerEl.classList.remove("faded");
    }

    // 2. BOTTOM ROW: Non-split seats render normally; split seats show clean pulsating placeholder
    if (seatCount > 1 && handsContainerEl) {
      const centerIndex = Math.floor(seatCount / 2);

      for (let s = 0; s < seatCount; s++) {
        const isCenter = s === centerIndex;

        if (isCenter) {
          const box = document.createElement("div");
          box.className = "hand-box center-seat" + (!isRoundOver && !isUserSplit ? " active" : "");

          if (isUserSplit) {
            box.className = "hand-box center-seat";
            box.style.visibility = "hidden";
            box.style.pointerEvents = "none";
            box.innerHTML = '<div style="height: calc(var(--card-h) + 24px);"></div>';
          } else {
            const cardsArr = (playerHands[0] && playerHands[0].cards) || [];
            const score = calcHandScore(cardsArr);
            const label = document.createElement("div");
            label.className = "hand-label";
            label.textContent = score;
            box.appendChild(label);

            if (isRoundOver && playerHands[0] && playerHands[0].resTxt) {
              const badge = document.createElement("div");
              badge.className = "hand-result-badge " + (playerHands[0].resType || "win");
              badge.textContent = playerHands[0].resTxt;
              box.appendChild(badge);
            }

            const cardsRow = document.createElement("div");
            cardsRow.className = "cards-row" + (cardsArr.length >= 2 ? " cascading" : "");
            cardsArr.forEach((c, idx) => cardsRow.appendChild(createCardElement(c, false, idx)));
            box.appendChild(cardsRow);
          }

          handsContainerEl.appendChild(box);
        } else {
          const botIdx = s < centerIndex ? s : s - 1;
          const botSubHands = simulatedBotHands[botIdx] || [];
          const box = document.createElement("div");
          box.className = "hand-group";

          if (botSubHands.length > 1) {
            box.className = "hand-group";
            box.style.visibility = "hidden";
            box.style.pointerEvents = "none";
            box.innerHTML = '<div style="height: calc(var(--card-h) + 24px);"></div>';
          } else {
            const label = document.createElement("div");
            label.className = "hand-label";
            const bCards = (botSubHands[0] && botSubHands[0].cards) || [];
            const score = calcHandScore(bCards);
            label.textContent = score;
            box.appendChild(label);

            if (isRoundOver && botSubHands[0] && botSubHands[0].resTxt) {
              const badge = document.createElement("div");
              badge.className = "hand-result-badge " + (botSubHands[0].resType || "win");
              badge.textContent = botSubHands[0].resTxt;
              box.appendChild(badge);
            }

            const cardsRow = document.createElement("div");
            cardsRow.className = "cards-row" + (bCards.length >= 2 ? " cascading" : "");
            bCards.forEach((c, idx) => cardsRow.appendChild(createCardElement(c, false, idx)));
            box.appendChild(cardsRow);
          }

          handsContainerEl.appendChild(box);
        }
      }
    } else if (handsContainerEl) {
      // 1 Seat Solo Table
      if (isUserSplit) {
        const box = document.createElement("div");
        box.className = "hand-box center-seat";
        box.style.visibility = "hidden";
        box.style.pointerEvents = "none";
        box.innerHTML = '<div style="height: calc(var(--card-h) + 24px);"></div>';
        handsContainerEl.appendChild(box);
      } else {
        playerHands.forEach((hand, idx) => {
          const score = calcHandScore(hand.cards);
          const box = document.createElement("div");
          box.className = !isRoundOver && idx === activeHandIndex ? "hand-box active" : "hand-box";

          const label = document.createElement("div");
          label.className = "hand-label";
          label.textContent = score;
          box.appendChild(label);

          if (isRoundOver && hand.resTxt) {
            const badge = document.createElement("div");
            badge.className = "hand-result-badge " + (hand.resType || "win");
            badge.textContent = hand.resTxt;
            box.appendChild(badge);
          }

          const cardsRow = document.createElement("div");
          cardsRow.className = "cards-row" + (hand.cards.length >= 2 ? " cascading" : "");
          hand.cards.forEach((c, cIdx) => cardsRow.appendChild(createCardElement(c, false, cIdx)));
          box.appendChild(cardsRow);
          handsContainerEl.appendChild(box);
        });
      }
    }

    if (betDisplayEl) {
      betDisplayEl.textContent = isRoundOver
        ? currentBet
        : playerHands.reduce((acc, h) => acc + h.bet, 0) || currentBet;
    }

    if (bankDisplayEl) {
      bankDisplayEl.textContent = userBank;
    }
  }

  function initGameState(bankAmount) {
    if (roundCleanupTimer) {
      clearTimeout(roundCleanupTimer);
      roundCleanupTimer = null;
    }

    userBank = parseFloat(bankAmount);
    currentBet = 0;
    currentInsuranceBet = 0;
    isRoundOver = true;
    dealerCards = [];
    playerHands = [];
    simulatedBotHands = [];

    const bankDisplay = getEl("bank-display");
    const betDisplay = getEl("bet-display");
    const messageBanner = getEl("message-banner");
    const dealerScore = getEl("dealer-score");
    const dealerCardsEl = getEl("dealer-cards");
    const playerHandsContainer = getEl("player-hands-container");
    const splitStage = getEl("player-split-stage");
    const rulesBanner = getEl("felt-rules-banner");

    if (bankDisplay) bankDisplay.textContent = userBank;
    if (betDisplay) betDisplay.textContent = 0;
    if (messageBanner) messageBanner.textContent = "Place your bet and press DEAL!";
    if (dealerScore) dealerScore.textContent = "0";
    if (dealerCardsEl) dealerCardsEl.innerHTML = "";
    if (playerHandsContainer) playerHandsContainer.innerHTML = "";
    if (splitStage) {
      splitStage.innerHTML = "";
      splitStage.classList.remove("active");
    }
    if (rulesBanner) rulesBanner.classList.remove("faded");

    const seatInput = getEl("table-seats-input");
    if (seatInput) seatInput.value = "1";
    activeTableSeats = 1;

    initAndShuffleShoe();
    updateButtonStates();
    updateResponsiveCardScale();
    renderTable();
  }

  global.addBet = function (amount) {
    playChipSfx();

    if (roundCleanupTimer) {
      clearTimeout(roundCleanupTimer);
      roundCleanupTimer = null;
    }

    if (!isRoundOver) {
      dealerCards = [];
      playerHands = [];
      simulatedBotHands = [];
      const dealerCardsEl = getEl("dealer-cards");
      const playerHandsContainer = getEl("player-hands-container");
      const splitStage = getEl("player-split-stage");
      const rulesBanner = getEl("felt-rules-banner");
      const dealerScore = getEl("dealer-score");

      if (dealerCardsEl) dealerCardsEl.innerHTML = "";
      if (playerHandsContainer) playerHandsContainer.innerHTML = "";
      if (splitStage) {
        splitStage.innerHTML = "";
        splitStage.classList.remove("active");
      }
      if (rulesBanner) rulesBanner.classList.remove("faded");
      if (dealerScore) dealerScore.textContent = "0";
      isRoundOver = true;
    }

    const messageBanner = getEl("message-banner");
    if (currentBet >= 500) {
      if (messageBanner) messageBanner.textContent = "Maximum bet is $500!";
      return;
    }

    const betToAdd = Math.min(amount, 500 - currentBet);
    if (userBank >= betToAdd) {
      userBank -= betToAdd;
      currentBet += betToAdd;
      const bankDisplay = getEl("bank-display");
      const betDisplay = getEl("bet-display");
      if (bankDisplay) bankDisplay.textContent = userBank;
      if (betDisplay) betDisplay.textContent = currentBet;

      if (currentBet === 500) {
        if (messageBanner) messageBanner.textContent = "Max bet reached ($500)";
      } else if (messageBanner && messageBanner.textContent.includes("bet")) {
        messageBanner.textContent = "";
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
    const bankDisplay = getEl("bank-display");
    const betDisplay = getEl("bet-display");
    const messageBanner = getEl("message-banner");
    if (bankDisplay) bankDisplay.textContent = userBank;
    if (betDisplay) betDisplay.textContent = 0;
    if (messageBanner) messageBanner.textContent = "";
  };

  // =========================================================================
  // GEMINI 3.8 FLASH DEALER COMMENTARY & BASIC STRATEGY ADVISOR
  // =========================================================================
  let geminiAdvisorEnabled = (localStorage.getItem("cc_gemini_advisor_enabled") === "true");
  let geminiCommentaryAbortId = 0;

  function updateGeminiAdvisorUI() {
    const btn = getEl("geminiAdvisorBtn");
    const box = getEl("gemini-dealer-box");

    if (btn) {
      if (geminiAdvisorEnabled) {
        btn.classList.add("active");
        btn.classList.remove("muted");
        btn.textContent = "✨ Gemini AI";
      } else {
        btn.classList.remove("active");
        btn.classList.add("muted");
        btn.textContent = "✨ AI OFF";
      }
    }

    if (box) {
      if (geminiAdvisorEnabled) {
        box.classList.remove("hidden");
        box.style.display = "flex";
      } else {
        box.classList.add("hidden");
        box.style.display = "none";
      }
    }
  }

  global.toggleGeminiAdvisor = function () {
    geminiAdvisorEnabled = !geminiAdvisorEnabled;
    try {
      localStorage.setItem("cc_gemini_advisor_enabled", geminiAdvisorEnabled ? "true" : "false");
    } catch (e) {}
    updateGeminiAdvisorUI();
  };

  async function callGeminiApi(action, payload) {
    const candidateUrls = [
      `${API_BASE}/gemini_api.php?action=${action}`,
      `./gemini_api.php?action=${action}`,
      `/gemini_api.php?action=${action}`
    ];
    for (const url of candidateUrls) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (e) {}
    }
    return null;
  }

  async function triggerGeminiCommentary(event, extraData = {}) {
    if (!geminiAdvisorEnabled) return;

    const currentId = ++geminiCommentaryAbortId;
    const commentaryEl = getEl("gemini-commentary-text");

    const curHand = playerHands[activeHandIndex] || playerHands[0];
    const playerCards = curHand && curHand.cards ? curHand.cards.map(c => c.name + c.suit) : [];
    const playerScore = curHand && curHand.cards ? calcHandScore(curHand.cards) : (extraData.player_score || 0);
    const upCard = dealerCards[0] ? (dealerCards[0].name + dealerCards[0].suit) : (extraData.dealer_upcard || "7");
    const bet = curHand ? curHand.bet : (currentBet || 25);

    const payload = {
      event: event,
      player_cards: playerCards,
      player_score: playerScore,
      dealer_upcard: upCard,
      dealer_cards: dealerCards.map(c => c.name + c.suit),
      dealer_score: calcHandScore(dealerCards),
      bet: bet,
      bankroll: userBank,
      ...extraData
    };

    try {
      const data = await callGeminiApi("commentary", payload);
      if (currentId !== geminiCommentaryAbortId) return;

      if (data && data.success && data.commentary) {
        if (commentaryEl) {
          commentaryEl.style.opacity = "0.2";
          setTimeout(() => {
            if (currentId === geminiCommentaryAbortId) {
              commentaryEl.textContent = `"${data.commentary}"`;
              commentaryEl.style.opacity = "1";
            }
          }, 150);
        }
      }
    } catch (err) {
      console.warn("Gemini 3.8 Flash commentary error:", err);
    }
  }

  global.requestGeminiStrategyHint = async function () {
    if (isRoundOver) return;

    const curHand = playerHands[activeHandIndex];
    if (!curHand || curHand.cards.length < 2) return;

    // Automatically enable AI Assistant if it was off when hint requested
    if (!geminiAdvisorEnabled) {
      geminiAdvisorEnabled = true;
      try {
        localStorage.setItem("cc_gemini_advisor_enabled", "true");
      } catch (e) {}
      updateGeminiAdvisorUI();
    }

    const hintBox = getEl("gemini-strategy-hint");
    const hintPillBtn = getEl("ai-hint-btn");
    const hintBtn = getEl("btn-ai-hint");

    if (hintPillBtn) hintPillBtn.textContent = "Thinking...";
    if (hintBtn) hintBtn.textContent = "Thinking...";
    if (hintBox) {
      hintBox.style.display = "block";
      hintBox.innerHTML = `<em>Consulting Gemini 3.8 Flash Basic Strategy...</em>`;
    }

    const upCardStr = dealerCards[0] ? dealerCards[0].name : "7";
    const isSoft = isHandSoft(curHand.cards);
    const score = calcHandScore(curHand.cards);
    const canDouble = curHand.cards.length === 2 && userBank >= curHand.bet;
    const isPair = curHand.cards.length === 2 && curHand.cards[0].value === curHand.cards[1].value;
    const canSplit = isPair && playerHands.length < MAX_SPLIT_HANDS && userBank >= curHand.bet;

    const payload = {
      player_cards: curHand.cards.map(c => c.name + c.suit),
      player_score: score,
      is_soft: isSoft,
      dealer_upcard: upCardStr,
      can_double: canDouble,
      can_split: canSplit,
      bet: curHand.bet,
      bankroll: userBank
    };

    try {
      const data = await callGeminiApi("strategy_advisor", payload);
      if (hintBox) {
        if (data && data.success && data.recommendation) {
          hintBox.style.display = "block";
          const rec = data.recommendation;
          const rationale = data.rationale || "Follow standard Basic Strategy probability.";
          hintBox.innerHTML = `<strong>Gemini 3.8 Flash says: ${rec}</strong> &mdash; ${rationale}`;
        } else {
          hintBox.innerHTML = `<em>Unable to retrieve advice. Please try again.</em>`;
        }
      }
    } catch (err) {
      if (hintBox) {
        hintBox.innerHTML = `<em>AI Strategy Advisor temporarily offline.</em>`;
      }
    } finally {
      if (hintPillBtn) hintPillBtn.textContent = "💡 Strategy Advice";
      if (hintBtn) hintBtn.textContent = "💡 AI Hint";
    }
  };

  function updateButtonStates() {
    const dealBtn = getEl("deal-btn");
    const hitBtn = getEl("hit-btn");
    const standBtn = getEl("stand-btn");
    const doubleBtn = getEl("double-btn");
    const splitBtn = getEl("split-btn");
    const hintBtn = getEl("btn-ai-hint");
    const hintPillBtn = getEl("ai-hint-btn");
    const chipControls = getEl("chip-controls");

    if (isRoundOver) {
      if (dealBtn) dealBtn.disabled = false;
      if (hitBtn) hitBtn.disabled = true;
      if (standBtn) standBtn.disabled = true;
      if (doubleBtn) doubleBtn.disabled = true;
      if (splitBtn) splitBtn.disabled = true;
      if (hintBtn) hintBtn.disabled = true;
      if (hintPillBtn) hintPillBtn.disabled = true;
      if (chipControls) {
        chipControls.style.opacity = "1";
        chipControls.querySelectorAll(".chip, button").forEach(c => (c.style.pointerEvents = "auto"));
      }
      return;
    }

    if (dealBtn) dealBtn.disabled = true;
    if (chipControls) {
      chipControls.style.opacity = "0.3";
      chipControls.querySelectorAll(".chip, button").forEach(c => (c.style.pointerEvents = "none"));
    }

    const curHand = playerHands[activeHandIndex];
    if (!curHand) return;

    if (curHand.isSplitAce) {
      if (hitBtn) hitBtn.disabled = true;
      if (doubleBtn) doubleBtn.disabled = true;
      if (splitBtn) splitBtn.disabled = true;
      if (standBtn) standBtn.disabled = false;
      if (hintBtn) hintBtn.disabled = true;
      if (hintPillBtn) hintPillBtn.disabled = true;
      return;
    }

    if (hitBtn) hitBtn.disabled = false;
    if (standBtn) standBtn.disabled = false;
    if (hintBtn) hintBtn.disabled = false;
    if (hintPillBtn) hintPillBtn.disabled = false;
    if (doubleBtn) doubleBtn.disabled = !(curHand.cards.length === 2 && userBank >= curHand.bet);

    const isPair = curHand.cards.length === 2 && curHand.cards[0].value === curHand.cards[1].value;
    const isPairAces = curHand.cards.length === 2 && curHand.cards[0].name === "A";

    if (splitBtn) {
      splitBtn.disabled = !(
        playerHands.length < MAX_SPLIT_HANDS &&
        isPair &&
        userBank >= curHand.bet &&
        (!curHand.isSplitAce || !isPairAces)
      );
    }
  }

  function promptInsuranceModal() {
    return new Promise(resolve => {
      insuranceResolvePromise = resolve;
      const cost = Math.floor(playerHands[0].bet / 2);
      const label = getEl("insurance-amount-label");
      if (label) label.textContent = "Insurance Cost: $" + cost;
      const yesBtn = getEl("ins-yes-btn");

      if (userBank < cost) {
        if (yesBtn) {
          yesBtn.disabled = true;
          yesBtn.textContent = "Insufficient Funds";
        }
      } else {
        if (yesBtn) {
          yesBtn.disabled = false;
          yesBtn.textContent = "Take Insurance";
        }
      }

      const modal = getEl("insurance-modal");
      if (modal) modal.classList.add("active");
    });
  }

  global.handleInsuranceChoice = function (accepted) {
    const modal = getEl("insurance-modal");
    if (modal) modal.classList.remove("active");
    if (insuranceResolvePromise) {
      const cb = insuranceResolvePromise;
      insuranceResolvePromise = null;
      cb(accepted);
    }
  };

  // Bot play logic applying Basic Strategy splits, re-splits, and hitting/standing
  function playBotsTurn() {
    const dealerUpCard = dealerCards[0];

    simulatedBotHands.forEach(botSeat => {
      // Step 1: Evaluate splits (and re-splits) for each hand using Basic Strategy
      let splitOccurred = true;
      while (splitOccurred && botSeat.length < MAX_SPLIT_HANDS) {
        splitOccurred = false;
        for (let i = 0; i < botSeat.length; i++) {
          const subHand = botSeat[i];
          if (
            subHand.cards.length === 2 &&
            !subHand.isSplitAce &&
            shouldSplitBasicStrategy(subHand.cards[0], subHand.cards[1], dealerUpCard) &&
            botSeat.length < MAX_SPLIT_HANDS
          ) {
            const isAceSplit = subHand.cards[0].name === "A";
            const handA = {
              cards: [subHand.cards[0], drawCard()],
              status: isAceSplit ? "stood" : "playing",
              isSplitAce: isAceSplit
            };
            const handB = {
              cards: [subHand.cards[1], drawCard()],
              status: isAceSplit ? "stood" : "playing",
              isSplitAce: isAceSplit
            };
            botSeat.splice(i, 1, handA, handB);
            splitOccurred = true;
            break;
          }
        }
      }

      // Step 2: Play each sub-hand according to full Basic Strategy
      botSeat.forEach(subHand => {
        // Split aces receive only 1 card and automatically stand
        if (subHand.isSplitAce || subHand.status === "stood") {
          subHand.status = "stood";
          return;
        }

        while (true) {
          const score = calcHandScore(subHand.cards);
          if (score >= 21) {
            subHand.status = score > 21 ? "busted" : "stood";
            break;
          }

          if (botShouldHitBasicStrategy(subHand.cards, dealerUpCard)) {
            subHand.cards.push(drawCard());
          } else {
            subHand.status = "stood";
            break;
          }
        }
      });
    });
  }

  // Evaluate immediate splits for bots dealt pairs upon initial deal
  function evaluateBotInitialSplits() {
    const dealerUpCard = dealerCards[0];
    if (!dealerUpCard) return;

    simulatedBotHands.forEach(botSeat => {
      let splitOccurred = true;
      while (splitOccurred && botSeat.length < MAX_SPLIT_HANDS) {
        splitOccurred = false;
        for (let i = 0; i < botSeat.length; i++) {
          const subHand = botSeat[i];
          if (
            subHand.cards.length === 2 &&
            !subHand.isSplitAce &&
            shouldSplitBasicStrategy(subHand.cards[0], subHand.cards[1], dealerUpCard) &&
            botSeat.length < MAX_SPLIT_HANDS
          ) {
            const isAceSplit = subHand.cards[0].name === "A";
            const handA = {
              cards: [subHand.cards[0], drawCard()],
              status: isAceSplit ? "stood" : "playing",
              isSplitAce: isAceSplit
            };
            const handB = {
              cards: [subHand.cards[1], drawCard()],
              status: isAceSplit ? "stood" : "playing",
              isSplitAce: isAceSplit
            };
            botSeat.splice(i, 1, handA, handB);
            splitOccurred = true;
            break;
          }
        }
      }
    });
  }

  global.startGame = async function () {
    if (roundCleanupTimer) {
      clearTimeout(roundCleanupTimer);
      roundCleanupTimer = null;
    }

    const hintBox = getEl("gemini-strategy-hint");
    if (hintBox) {
      hintBox.style.display = "none";
      hintBox.innerHTML = "";
    }

    playCardDealSfx();
    const messageBanner = getEl("message-banner");
    if (currentBet === 0) {
      if (userBank <= 0) {
        global.openStoreModal();
      } else {
        if (messageBanner) messageBanner.textContent = "Please place a bet first!";
      }
      return;
    }

    if (cutCardReached || shoe.length <= cutCardCount) {
      initAndShuffleShoe();
      if (messageBanner) messageBanner.textContent = "Cut card reached! Shoe reshuffled & card burned.";
    } else {
      if (messageBanner) messageBanner.textContent = "";
    }

    activeTableSeats = getSeatsCount();

    isRoundOver = false;
    currentInsuranceBet = 0;
    playerHands = [{ cards: [], bet: currentBet, status: "playing", isSplitAce: false, insuranceResolved: false }];
    currentBet = 0;
    activeHandIndex = 0;
    dealerCards = [];
    simulatedBotHands = [];

    const seats = activeTableSeats;
    const botCount = seats - 1;

    for (let i = 0; i < botCount; i++) {
      simulatedBotHands.push([{ cards: [], status: "playing", isSplitAce: false }]);
    }

    // Deal Round 1
    playerHands[0].cards.push(drawCard());
    for (let i = 0; i < botCount; i++) simulatedBotHands[i][0].cards.push(drawCard());
    dealerCards.push(drawCard());

    // Deal Round 2
    playerHands[0].cards.push(drawCard());
    for (let i = 0; i < botCount; i++) simulatedBotHands[i][0].cards.push(drawCard());
    dealerCards.push(drawCard());

    evaluateBotInitialSplits();
    updateResponsiveCardScale();
    renderTable(true);
    updateButtonStates();

    const playerHasNatural = playerHands[0].cards.length === 2 && calcHandScore(playerHands[0].cards) === 21;
    if (playerHasNatural) {
      triggerGeminiCommentary("BLACKJACK");
    } else {
      triggerGeminiCommentary("DEALT");
    }

    const upCard = dealerCards[0];
    const dealerHasBlackjack = calcHandScore(dealerCards) === 21;

    if (upCard.name === "A") {
      const wantsInsurance = await promptInsuranceModal();
      if (wantsInsurance) {
        const cost = Math.floor(playerHands[0].bet / 2);
        currentInsuranceBet = cost;
        userBank -= cost;
        const bankDisplay = getEl("bank-display");
        if (bankDisplay) bankDisplay.textContent = userBank;
      }

      if (dealerHasBlackjack) {
        if (currentInsuranceBet > 0) {
          const winProfit = currentInsuranceBet * 2;
          const payout = currentInsuranceBet * 3;
          userBank += payout;
          const bankDisplay = getEl("bank-display");
          if (bankDisplay) bankDisplay.textContent = userBank;
          if (messageBanner) {
            messageBanner.textContent = "Dealer has Blackjack! Insurance pays 2:1 (+$" + winProfit + ").";
          }
          if (playerHands[0]) {
            playerHands[0].resTxt = "+$" + winProfit;
            playerHands[0].resType = "win";
            playerHands[0].insuranceResolved = true;
          }
        } else {
          if (messageBanner) messageBanner.textContent = "Dealer has Blackjack!";
          if (playerHands[0]) {
            playerHands[0].resTxt = "-$" + playerHands[0].bet;
            playerHands[0].resType = "loss";
            playerHands[0].insuranceResolved = true;
          }
        }
        resolveDealerHandAndPayouts();
        return;
      } else if (currentInsuranceBet > 0) {
        if (messageBanner) messageBanner.textContent = "Insurance collected.";
      }
    } else if (upCard.value === 10 && dealerHasBlackjack) {
      if (messageBanner) messageBanner.textContent = "Dealer has Blackjack!";
      resolveDealerHandAndPayouts();
      return;
    }

    if (playerHands[0].cards.length === 2 && calcHandScore(playerHands[0].cards) === 21) {
      resolveDealerHandAndPayouts();
    }
  };

  global.playerHit = function () {
    playCardDealSfx();
    const hintBox = getEl("gemini-strategy-hint");
    if (hintBox) hintBox.style.display = "none";

    const hand = playerHands[activeHandIndex];
    hand.cards.push(drawCard());

    const score = calcHandScore(hand.cards);
    if (score >= 21) {
      hand.status = score > 21 ? "busted" : "stood";
      renderTable(true);
      triggerGeminiCommentary(score > 21 ? "BUST" : "HIT", { player_score: score });
      advanceToNextHand();
    } else {
      renderTable(true);
      updateButtonStates();
      triggerGeminiCommentary("HIT", { player_score: score });
    }
  };

  global.playerDouble = function () {
    const hintBox = getEl("gemini-strategy-hint");
    if (hintBox) hintBox.style.display = "none";

    const hand = playerHands[activeHandIndex];
    userBank -= hand.bet;
    hand.bet *= 2;
    hand.cards.push(drawCard());

    const score = calcHandScore(hand.cards);
    hand.status = score > 21 ? "busted" : "stood";
    renderTable(true);
    triggerGeminiCommentary("DOUBLE", { player_score: score });
    advanceToNextHand();
  };

  global.playerSplit = function () {
    const hintBox = getEl("gemini-strategy-hint");
    if (hintBox) hintBox.style.display = "none";

    const hand = playerHands[activeHandIndex];
    userBank -= hand.bet;

    const firstCard = hand.cards[0];
    const secondCard = hand.cards[1];
    const isAceSplit = firstCard.name === "A";

    const handA = {
      cards: [firstCard, drawCard()],
      bet: hand.bet,
      status: isAceSplit ? "stood" : "playing",
      isSplitAce: isAceSplit,
      insuranceResolved: false
    };

    const handB = {
      cards: [secondCard, drawCard()],
      bet: hand.bet,
      status: isAceSplit ? "stood" : "playing",
      isSplitAce: isAceSplit,
      insuranceResolved: false
    };

    playerHands.splice(activeHandIndex, 1, handA, handB);
    updateResponsiveCardScale();
    renderTable(true);
    triggerGeminiCommentary("SPLIT");

    if (isAceSplit) {
      advanceToNextHand();
    } else {
      updateButtonStates();
    }
  };

  global.playerStand = function () {
    const hintBox = getEl("gemini-strategy-hint");
    if (hintBox) hintBox.style.display = "none";

    const score = calcHandScore(playerHands[activeHandIndex].cards);
    playerHands[activeHandIndex].status = "stood";
    triggerGeminiCommentary("STAND", { player_score: score });
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

    // Total hands being dealt across table
    const botHandsCount = simulatedBotHands.reduce((acc, seat) => acc + seat.length, 0);
    const totalHandsDealt = playerHands.length + botHandsCount;
    const moreThanOneHandDealt = totalHandsDealt > 1;

    // 1. Evaluate Bot Hands (other players at the table)
    simulatedBotHands.forEach(botSeat => {
      botSeat.forEach(subHand => {
        const botScore = calcHandScore(subHand.cards);
        const botIsNatural = subHand.cards.length === 2 && botScore === 21 && botSeat.length === 1;

        if (botScore > 21) {
          subHand.resTxt = "LOSS";
          subHand.resType = "loss";
        } else if (botIsNatural) {
          if (dealerHasNatural) {
            subHand.resTxt = "PUSH";
            subHand.resType = "push";
          } else {
            subHand.resTxt = "WIN";
            subHand.resType = "win";
          }
        } else if (dealerHasNatural) {
          subHand.resTxt = "LOSS";
          subHand.resType = "loss";
        } else if (dealerScore > 21 || botScore > dealerScore) {
          subHand.resTxt = "WIN";
          subHand.resType = "win";
        } else if (botScore === dealerScore) {
          subHand.resTxt = "PUSH";
          subHand.resType = "push";
        } else {
          subHand.resTxt = "LOSS";
          subHand.resType = "loss";
        }
      });
    });

    // 2. Evaluate User Hands (ALL player hands belong to user and show exact $ won/lost)
    playerHands.forEach((hand, idx) => {
      // Respect already-settled insurance payout badge
      if (hand.insuranceResolved) {
        if (dealerHasNatural && hand.cards.length === 2 && calcHandScore(hand.cards) === 21) {
          totalWon += hand.bet;
        }
        return;
      }

      const playerScore = calcHandScore(hand.cards);
      const isNatural = hand.cards.length === 2 && playerScore === 21 && playerHands.length === 1;

      if (playerScore > 21) {
        hand.resType = "loss";
        hand.resTxt = "-$" + hand.bet;
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
          hand.resType = "win";
          hand.resTxt = "+$" + Math.floor(hand.bet * 1.5);
        }
      } else if (dealerHasNatural) {
        hand.resType = "loss";
        hand.resTxt = "-$" + hand.bet;
      } else if (dealerScore > 21 || playerScore > dealerScore) {
        totalWon += hand.bet * 2;
        hand.resType = "win";
        hand.resTxt = "+$" + hand.bet;
      } else if (playerScore === dealerScore) {
        totalWon += hand.bet;
        hand.resTxt = "PUSH";
        hand.resType = "push";
      } else {
        hand.resType = "loss";
        hand.resTxt = "-$" + hand.bet;
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

    const messageBanner = getEl("message-banner");
    if (messageBanner) messageBanner.innerHTML = banner;
    renderTable(false);
    const betDisplay = getEl("bet-display");
    if (betDisplay) betDisplay.textContent = 0;
    updateButtonStates();
    syncBankToServer(userBank);

    // Determine overall result for the main player hand (hand 0) to trigger Gemini Dealer commentary
    let endEvent = "LOSS";
    if (playerHands[0]) {
      if (playerHands[0].resType === "win") {
        endEvent = hasNaturalBlackjack ? "BLACKJACK" : "WIN";
      } else if (playerHands[0].resType === "push") {
        endEvent = "PUSH";
      } else {
        endEvent = "LOSS";
      }
    }
    triggerGeminiCommentary(endEvent, {
      player_score: playerHands[0] ? calcHandScore(playerHands[0].cards) : 0,
      dealer_score: dealerScore
    });

    if (hasNaturalBlackjack) {
      triggerCelebration(celebrationWinAmount);
    }

    if (userBank <= 0 && currentBet === 0) {
      if (messageBanner) {
        messageBanner.innerHTML += "<br><span style='color:var(--gold);'>Out of credits! Click '+ Credits' to refill.</span>";
      }
      setTimeout(global.openStoreModal, 1200);
    }

    // 4-second cleanup: removes all cards and resets score labels
    if (roundCleanupTimer) clearTimeout(roundCleanupTimer);
    roundCleanupTimer = setTimeout(() => {
      clearCardsAfterRound();
    }, 4000);
  }

  // Triple click table title to open Admin Modal
  document.addEventListener("DOMContentLoaded", function () {
    const titleEl = getEl("table-title");
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
    updateAudioButtonUI();
    updateGeminiAdvisorUI();

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("test_split") === "1" || urlParams.get("test_bot_split") === "1") {
      const gameScreen = getEl("game-screen");
      const lobbyScreen = getEl("lobby-screen");
      if (gameScreen && lobbyScreen) {
        lobbyScreen.classList.remove("active");
        gameScreen.classList.add("active");
      }
      global.triggerTestBotSplit();
    } else if (urlParams.get("test_player_split") === "1") {
      const gameScreen = getEl("game-screen");
      const lobbyScreen = getEl("lobby-screen");
      if (gameScreen && lobbyScreen) {
        lobbyScreen.classList.remove("active");
        gameScreen.classList.add("active");
      }
      global.triggerTestPlayerSplit();
    } else if (urlParams.get("test_player_split_results") === "1") {
      const gameScreen = getEl("game-screen");
      const lobbyScreen = getEl("lobby-screen");
      if (gameScreen && lobbyScreen) {
        lobbyScreen.classList.remove("active");
        gameScreen.classList.add("active");
      }
      global.triggerTestPlayerSplitResults();
    } else if (urlParams.get("test_both_split") === "1") {
      const gameScreen = getEl("game-screen");
      const lobbyScreen = getEl("lobby-screen");
      if (gameScreen && lobbyScreen) {
        lobbyScreen.classList.remove("active");
        gameScreen.classList.add("active");
      }
      global.triggerTestBothSplit();
    } else if (urlParams.get("test_player_split_4") === "1") {
      const gameScreen = getEl("game-screen");
      const lobbyScreen = getEl("lobby-screen");
      if (gameScreen && lobbyScreen) {
        lobbyScreen.classList.remove("active");
        gameScreen.classList.add("active");
      }
      global.triggerTestPlayerSplit4();
    } else if (urlParams.get("test_all_three_split") === "1") {
      const gameScreen = getEl("game-screen");
      const lobbyScreen = getEl("lobby-screen");
      if (gameScreen && lobbyScreen) {
        lobbyScreen.classList.remove("active");
        gameScreen.classList.add("active");
      }
      global.triggerTestAllThreeSplit();
    } else if (urlParams.get("test_table") === "1") {
      const gameScreen = getEl("game-screen");
      const lobbyScreen = getEl("lobby-screen");
      if (gameScreen && lobbyScreen) {
        lobbyScreen.classList.remove("active");
        gameScreen.classList.add("active");
      }
      renderTable(false);
    }
  });

  // Developer/Test helper: Force a bot split scenario for automated/browser testing
  global.triggerTestBotSplit = function () {
    activeTableSeats = 3;
    const seatsInput = getEl("table-seats-input");
    if (seatsInput) seatsInput.value = "3";
    isRoundOver = false;
    currentBet = 0;
    activeHandIndex = 0;

    // Player hand
    playerHands = [{
      cards: [
        { suit: "♠", name: "10", value: 10 },
        { suit: "♦", name: "9", value: 9 }
      ],
      bet: 20,
      status: "playing",
      isSplitAce: false,
      insuranceResolved: false
    }];

    // Dealer cards
    dealerCards = [
      { suit: "♣", name: "6", value: 6 },
      { suit: "♥", name: "K", value: 10 }
    ];

    // Bot 0 (Seat 1) has split 8s!
    simulatedBotHands = [
      [
        { cards: [{ suit: "♠", name: "8", value: 8 }, { suit: "♥", name: "J", value: 10 }], status: "playing", isSplitAce: false },
        { cards: [{ suit: "♦", name: "8", value: 8 }, { suit: "♣", name: "9", value: 9 }], status: "playing", isSplitAce: false }
      ],
      [
        { cards: [{ suit: "♥", name: "K", value: 10 }, { suit: "♠", name: "7", value: 7 }], status: "playing", isSplitAce: false }
      ]
    ];

    updateResponsiveCardScale();
    renderTable(true);
    updateButtonStates();
    console.log("Triggered Bot Split Test Scenario! Check the high felt area.");
  };

  // Developer/Test helper: Force a player split scenario for automated/browser testing
  global.triggerTestPlayerSplit = function () {
    activeTableSeats = 3;
    const seatsInput = getEl("table-seats-input");
    if (seatsInput) seatsInput.value = "3";
    isRoundOver = false;
    currentBet = 0;
    activeHandIndex = 0;

    // Player split hands
    playerHands = [
      {
        cards: [{ suit: "♠", name: "8", value: 8 }, { suit: "♥", name: "K", value: 10 }],
        bet: 20,
        status: "playing",
        isSplitAce: false,
        insuranceResolved: false
      },
      {
        cards: [{ suit: "♦", name: "8", value: 8 }, { suit: "♣", name: "9", value: 9 }],
        bet: 20,
        status: "playing",
        isSplitAce: false,
        insuranceResolved: false
      }
    ];

    // Dealer cards
    dealerCards = [
      { suit: "♣", name: "6", value: 6 },
      { suit: "♥", name: "K", value: 10 }
    ];

    simulatedBotHands = [
      [
        { cards: [{ suit: "♠", name: "10", value: 10 }, { suit: "♥", name: "9", value: 9 }], status: "playing", isSplitAce: false }
      ],
      [
        { cards: [{ suit: "♥", name: "K", value: 10 }, { suit: "♠", name: "7", value: 7 }], status: "playing", isSplitAce: false }
      ]
    ];

    updateResponsiveCardScale();
    renderTable(true);
    updateButtonStates();
    console.log("Triggered Player Split Test Scenario!");
  };

  // Developer/Test helper: Force a player split round-over scenario to verify win/loss badges
  global.triggerTestPlayerSplitResults = function () {
    activeTableSeats = 3;
    const seatsInput = getEl("table-seats-input");
    if (seatsInput) seatsInput.value = "3";
    isRoundOver = true;
    currentBet = 0;
    activeHandIndex = -1;

    // Player split hands: Hand 1 won (+$20), Hand 2 lost (-$20)
    playerHands = [
      {
        cards: [{ suit: "♠", name: "8", value: 8 }, { suit: "♥", name: "K", value: 10 }],
        bet: 20,
        status: "stand",
        isSplitAce: false,
        insuranceResolved: false,
        resTxt: "+$20",
        resType: "win"
      },
      {
        cards: [{ suit: "♦", name: "8", value: 8 }, { suit: "♣", name: "7", value: 7 }],
        bet: 20,
        status: "stand",
        isSplitAce: false,
        insuranceResolved: false,
        resTxt: "-$20",
        resType: "loss"
      }
    ];

    dealerCards = [
      { suit: "♣", name: "10", value: 10 },
      { suit: "♥", name: "7", value: 7 }
    ];

    simulatedBotHands = [
      [
        { cards: [{ suit: "♠", name: "10", value: 10 }, { suit: "♥", name: "9", value: 9 }], status: "stand", isSplitAce: false, resTxt: "WIN", resType: "win" }
      ],
      [
        { cards: [{ suit: "♥", name: "K", value: 10 }, { suit: "♠", name: "6", value: 6 }], status: "stand", isSplitAce: false, resTxt: "LOSS", resType: "loss" }
      ]
    ];

    updateResponsiveCardScale();
    renderTable(true);
    updateButtonStates();
    console.log("Triggered Player Split Results Test Scenario!");
  };

  // Developer/Test helper: Force scenario where BOTH Seat 1 (bot) and Seat 2 (player) have split hands
  // Demonstrates Seat 1 split cards directly above Seat 1, and Seat 2 split cards directly above Seat 2
  global.triggerTestBothSplit = function () {
    activeTableSeats = 3;
    const seatsInput = getEl("table-seats-input");
    if (seatsInput) seatsInput.value = "3";
    isRoundOver = false;
    currentBet = 0;
    activeHandIndex = 0;

    // Player (Seat 2, center) has 2 split hands
    playerHands = [
      {
        cards: [{ suit: "♠", name: "8", value: 8 }, { suit: "♥", name: "K", value: 10 }],
        bet: 20,
        status: "playing",
        isSplitAce: false,
        insuranceResolved: false
      },
      {
        cards: [{ suit: "♦", name: "8", value: 8 }, { suit: "♣", name: "9", value: 9 }],
        bet: 20,
        status: "playing",
        isSplitAce: false,
        insuranceResolved: false
      }
    ];

    // Dealer cards
    dealerCards = [
      { suit: "♣", name: "6", value: 6 },
      { suit: "♥", name: "K", value: 10 }
    ];

    // Simulated Bot Hands:
    // Bot 0 (Seat 1, left) has 2 split hands
    // Bot 1 (Seat 3, right) has 1 normal hand
    simulatedBotHands = [
      [
        { cards: [{ suit: "♠", name: "9", value: 9 }, { suit: "♦", name: "J", value: 10 }], status: "playing", isSplitAce: false },
        { cards: [{ suit: "♥", name: "9", value: 9 }, { suit: "♣", name: "8", value: 8 }], status: "playing", isSplitAce: false }
      ],
      [
        { cards: [{ suit: "♥", name: "K", value: 10 }, { suit: "♠", name: "7", value: 7 }], status: "playing", isSplitAce: false }
      ]
    ];

    updateResponsiveCardScale();
    renderTable(true);
    updateButtonStates();
    console.log("Triggered Both Split Test Scenario (Seat 1 bot + Seat 2 player split)!");
  };

  // Developer/Test helper: Force scenario where player splits up to 4 hands with compact scaling
  global.triggerTestPlayerSplit4 = function () {
    activeTableSeats = 3;
    const seatsInput = getEl("table-seats-input");
    if (seatsInput) seatsInput.value = "3";
    isRoundOver = true;
    currentBet = 0;
    activeHandIndex = -1;

    // Player (Seat 2, center) has 4 split hands, round over with win/loss badges
    playerHands = [
      {
        cards: [{ suit: "♠", name: "8", value: 8 }, { suit: "♥", name: "K", value: 10 }],
        bet: 20,
        status: "stand",
        isSplitAce: false,
        insuranceResolved: false,
        resTxt: "+$20",
        resType: "win"
      },
      {
        cards: [{ suit: "♦", name: "8", value: 8 }, { suit: "♣", name: "3", value: 3 }, { suit: "♠", name: "10", value: 10 }],
        bet: 20,
        status: "stand",
        isSplitAce: false,
        insuranceResolved: false,
        resTxt: "+$20",
        resType: "win"
      },
      {
        cards: [{ suit: "♥", name: "8", value: 8 }, { suit: "♦", name: "7", value: 7 }, { suit: "♣", name: "5", value: 5 }],
        bet: 20,
        status: "stand",
        isSplitAce: false,
        insuranceResolved: false,
        resTxt: "+$20",
        resType: "win"
      },
      {
        cards: [{ suit: "♣", name: "8", value: 8 }, { suit: "♠", name: "2", value: 2 }, { suit: "♥", name: "9", value: 9 }],
        bet: 20,
        status: "stand",
        isSplitAce: false,
        insuranceResolved: false,
        resTxt: "-$20",
        resType: "loss"
      }
    ];

    dealerCards = [
      { suit: "♣", name: "10", value: 10 },
      { suit: "♥", name: "7", value: 7 }
    ];

    simulatedBotHands = [
      [
        { cards: [{ suit: "♠", name: "10", value: 10 }, { suit: "♥", name: "9", value: 9 }], status: "stand", isSplitAce: false, resTxt: "WIN", resType: "win" }
      ],
      [
        { cards: [{ suit: "♥", name: "K", value: 10 }, { suit: "♠", name: "6", value: 6 }], status: "stand", isSplitAce: false, resTxt: "LOSS", resType: "loss" }
      ]
    ];

    updateResponsiveCardScale();
    renderTable(true);
    updateButtonStates();
    console.log("Triggered Player 4 Split Hands Test Scenario!");
  };

  // Developer/Test helper: Force scenario where ALL THREE seats have split hands
  global.triggerTestAllThreeSplit = function () {
    activeTableSeats = 3;
    const seatsInput = getEl("table-seats-input");
    if (seatsInput) seatsInput.value = "3";
    isRoundOver = false;
    currentBet = 0;
    activeHandIndex = 0;

    // Player (Seat 2, center) has 3 split hands
    playerHands = [
      {
        cards: [{ suit: "♠", name: "9", value: 9 }, { suit: "♥", name: "2", value: 2 }, { suit: "♦", name: "K", value: 10 }],
        bet: 20,
        status: "stand",
        isSplitAce: false,
        insuranceResolved: false
      },
      {
        cards: [{ suit: "♦", name: "9", value: 9 }, { suit: "♣", name: "10", value: 10 }],
        bet: 20,
        status: "playing",
        isSplitAce: false,
        insuranceResolved: false
      },
      {
        cards: [{ suit: "♥", name: "9", value: 9 }, { suit: "♠", name: "8", value: 8 }],
        bet: 20,
        status: "playing",
        isSplitAce: false,
        insuranceResolved: false
      }
    ];

    dealerCards = [
      { suit: "♣", name: "5", value: 5 },
      { suit: "♥", name: "10", value: 10 }
    ];

    // Bot 0 (Seat 1) has 2 split hands; Bot 1 (Seat 3) has 2 split hands
    simulatedBotHands = [
      [
        { cards: [{ suit: "♠", name: "8", value: 8 }, { suit: "♥", name: "10", value: 10 }], status: "playing", isSplitAce: false },
        { cards: [{ suit: "♦", name: "8", value: 8 }, { suit: "♣", name: "9", value: 9 }], status: "playing", isSplitAce: false }
      ],
      [
        { cards: [{ suit: "♥", name: "7", value: 7 }, { suit: "♦", name: "4", value: 4 }, { suit: "♠", name: "9", value: 9 }], status: "playing", isSplitAce: false },
        { cards: [{ suit: "♣", name: "7", value: 7 }, { suit: "♠", name: "10", value: 10 }], status: "playing", isSplitAce: false }
      ]
    ];

    updateResponsiveCardScale();
    renderTable(true);
    updateButtonStates();
    console.log("Triggered All Three Seats Split Test Scenario!");
  };

})(window);