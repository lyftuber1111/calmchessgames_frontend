/**
 * Calm Chess Computers & Games — Early-Boot Mobile & WebXR Background Music Engine
 * Runs synchronously before Three.js/WebXR module download so background music
 * attempts immediate autoplay (with muted pre-warm fallback) and unlocks seamlessly
 * on the first valid mobile touch, tap, scroll-release, key, or WebXR action—
 * without requiring the user to tap the bell icon.
 */
(function initChristmasAudioBootstrap(global) {
  'use strict';

  const BG_MUSIC_SRC = 'jingle_bells.wav?v=2';
  const BG_MUSIC_DEFAULT_VOLUME = 0.38;
  const BG_MUSIC_MUTE_KEY = 'calmchess_xr_jingle_muted';
  const IGNORED_UNLOCK_KEYS = new Set(['Escape', 'Tab', 'Shift', 'Control', 'Alt', 'Meta']);

  // On iOS Safari 16.4+, declare playback audio session so Web Audio / media plays reliably
  if (typeof navigator !== 'undefined' && navigator.audioSession && 'type' in navigator.audioSession) {
    try {
      navigator.audioSession.type = 'playback';
    } catch (e) {}
  }

  function resolveAudioElement() {
    const existing = document.getElementById('xrJingleBellsAudio');
    if (existing) return existing;
    const el = new Audio(BG_MUSIC_SRC);
    el.id = 'xrJingleBellsAudio';
    el.loop = true;
    el.preload = 'auto';
    el.autoplay = true;
    el.playsInline = true;
    el.setAttribute('playsinline', '');
    el.setAttribute('webkit-playsinline', '');
    return el;
  }

  const bgAudio = resolveAudioElement();
  bgAudio.loop = true;
  bgAudio.preload = 'auto';
  bgAudio.playsInline = true;
  bgAudio.setAttribute('playsinline', '');
  bgAudio.setAttribute('webkit-playsinline', '');

  let btnAudio = document.getElementById('xrAudioBtn');
  let isAudioOn = false;
  let isMutedPrewarm = false;
  let userMutedAudio = false;
  let pendingGestureUnlock = false;
  let pausedByVisibility = false;
  let isXrActive = false;
  let autoStartPromise = null;
  let earlyTouchStartPromise = null;
  let gestureStartPromise = null;
  let mutedPrewarmPromise = null;
  let postTouchCheckTimer = null;
  let activationWatchInterval = null;
  let audioBtnInteractionUntil = 0;
  let hasRetriedOnCanPlay = false;
  let autoplayBlockedByPolicy = false;
  let audioFadeRaf = null;
  let audioFadeFallbackTimer = null;
  let targetAudioVolume = BG_MUSIC_DEFAULT_VOLUME;
  const linkedAudioContexts = new Set();

  try {
    userMutedAudio = sessionStorage.getItem(BG_MUSIC_MUTE_KEY) === '1';
  } catch (e) {
    userMutedAudio = false;
  }

  try {
    bgAudio.volume = targetAudioVolume;
  } catch (e) {}

  function clamp01(val) {
    const n = Number(val);
    if (!Number.isFinite(n)) return BG_MUSIC_DEFAULT_VOLUME;
    return Math.min(1, Math.max(0, n));
  }

  function isAudiblyPlaying() {
    return !!(bgAudio && !bgAudio.paused && !bgAudio.muted);
  }

  function cancelAudioFade() {
    if (audioFadeRaf !== null) {
      cancelAnimationFrame(audioFadeRaf);
      audioFadeRaf = null;
    }
    if (audioFadeFallbackTimer !== null) {
      clearTimeout(audioFadeFallbackTimer);
      audioFadeFallbackTimer = null;
    }
  }

  function fadeAudioVolume(toVolume, durationMs = 480) {
    cancelAudioFade();
    const clampedTarget = clamp01(toVolume);
    let startVol = clampedTarget;
    try {
      startVol = Number.isFinite(bgAudio.volume) ? bgAudio.volume : clampedTarget;
    } catch (e) {
      return;
    }

    if (durationMs <= 0 || Math.abs(clampedTarget - startVol) < 0.005) {
      try {
        bgAudio.volume = clampedTarget;
      } catch (e) {}
      return;
    }

    const startTime = performance.now();
    const step = (now) => {
      const t = Math.min((now - startTime) / durationMs, 1);
      try {
        bgAudio.volume = startVol + (clampedTarget - startVol) * t;
      } catch (e) {
        cancelAudioFade();
        return;
      }
      if (t < 1 && !bgAudio.paused && !bgAudio.muted) {
        audioFadeRaf = requestAnimationFrame(step);
      } else {
        cancelAudioFade();
        if (!bgAudio.paused && !bgAudio.muted) {
          try {
            bgAudio.volume = clampedTarget;
          } catch (e) {}
        }
      }
    };

    audioFadeRaf = requestAnimationFrame(step);
    // Guarantee target volume is reached even if rAF is temporarily throttled on mobile
    audioFadeFallbackTimer = setTimeout(() => {
      cancelAudioFade();
      if (!bgAudio.paused && !bgAudio.muted) {
        try {
          bgAudio.volume = clampedTarget;
        } catch (e) {}
      }
    }, durationMs + 160);
  }

  function setAudioVolume(vol) {
    targetAudioVolume = clamp01(vol);
    cancelAudioFade();
    try {
      bgAudio.volume = targetAudioVolume;
    } catch (e) {}
  }

  function resumeLinkedAudioContexts() {
    linkedAudioContexts.forEach((ctx) => {
      if (ctx && ctx.state === 'suspended' && typeof ctx.resume === 'function') {
        try {
          const p = ctx.resume();
          if (p && typeof p.catch === 'function') p.catch(() => {});
        } catch (e) {}
      }
    });
  }

  function syncAudioUi() {
    if (!btnAudio) btnAudio = document.getElementById('xrAudioBtn');
    if (!btnAudio) return;
    btnAudio.setAttribute('aria-pressed', String(isAudioOn));
    btnAudio.classList.toggle('is-active', isAudioOn);
    if (isAudioOn) {
      btnAudio.textContent = '\u{1F50A}';
      btnAudio.title = 'Mute Jingle Bells Background Music';
      btnAudio.setAttribute('aria-label', 'Mute Jingle Bells Background Music');
    } else if (userMutedAudio) {
      btnAudio.textContent = '\u{1F507}';
      btnAudio.title = 'Unmute Jingle Bells Background Music';
      btnAudio.setAttribute('aria-label', 'Unmute Jingle Bells Background Music');
    } else {
      btnAudio.textContent = '\u{1F514}';
      btnAudio.title = 'Play Jingle Bells Background Music';
      btnAudio.setAttribute('aria-label', 'Play Jingle Bells Background Music');
    }
  }

  function isTargetAudioButton(target) {
    if (!btnAudio) btnAudio = document.getElementById('xrAudioBtn');
    if (!btnAudio || !target) return false;
    return target === btnAudio || (typeof btnAudio.contains === 'function' && btnAudio.contains(target));
  }

  function schedulePostActivationRetry() {
    if (userMutedAudio || isAudiblyPlaying()) return;
    if (postTouchCheckTimer !== null) {
      clearTimeout(postTouchCheckTimer);
      postTouchCheckTimer = null;
    }
    postTouchCheckTimer = setTimeout(() => {
      postTouchCheckTimer = null;
      if (userMutedAudio || !pendingGestureUnlock || isAudiblyPlaying()) return;
      if (performance.now() < audioBtnInteractionUntil) return;
      if (navigator.userActivation && navigator.userActivation.hasBeenActive) {
        startBackgroundMusic({ fromUserGesture: true });
      }
    }, 60);
  }

  function handleActivationSignal() {
    if (userMutedAudio || !pendingGestureUnlock) {
      disarmFirstGestureUnlock();
      return;
    }
    if (performance.now() < audioBtnInteractionUntil) {
      return;
    }
    if (isAudiblyPlaying()) {
      isAudioOn = true;
      isMutedPrewarm = false;
      disarmFirstGestureUnlock();
      syncAudioUi();
      return;
    }
    if (navigator.userActivation && navigator.userActivation.hasBeenActive) {
      startBackgroundMusic({ fromUserGesture: true });
    } else {
      schedulePostActivationRetry();
    }
  }

  function handleFirstGestureUnlock(e) {
    if (userMutedAudio || !pendingGestureUnlock) {
      disarmFirstGestureUnlock();
      return;
    }
    if (isAudiblyPlaying()) {
      isAudioOn = true;
      isMutedPrewarm = false;
      disarmFirstGestureUnlock();
      syncAudioUi();
      return;
    }
    let isEarlyTouch = false;
    if (e) {
      if (e.type === 'keydown' && IGNORED_UNLOCK_KEYS.has(e.key)) {
        return;
      }
      // Let the bell/speaker button handle its own click cleanly without double-toggling
      if (isTargetAudioButton(e.target)) {
        audioBtnInteractionUntil = performance.now() + 600;
        return;
      }
      // Tier-1 early touch events unlock Android Chrome immediately (including touch scroll/swipe),
      // while NEVER blocking Tier-2 release/click events required by iOS Safari / strict touch activation.
      if (e.type === 'touchstart' || (e.type === 'pointerdown' && e.pointerType && e.pointerType !== 'mouse')) {
        isEarlyTouch = true;
      }
    }
    startBackgroundMusic({ fromUserGesture: true, isEarlyTouch });
    // On mobile Chromium with passive touch listeners, Blink may grant userActivation.hasBeenActive
    // right after compositor scroll takeover (pointercancel / touchend); verify on next tick too.
    if (e && (e.type === 'touchend' || e.type === 'pointerup' || e.type === 'touchstart')) {
      schedulePostActivationRetry();
    }
  }

  function armFirstGestureUnlock() {
    if (pendingGestureUnlock || userMutedAudio || isAudiblyPlaying()) return;
    pendingGestureUnlock = true;
    // Tier-1 (scroll/swipe start on Android Chrome) + Tier-2 (touchend/pointerup/click on iOS Safari & Chrome)
    // + passive scroll/pointercancel activation observers for compositor-handled mobile scrolls
    window.addEventListener('touchstart', handleFirstGestureUnlock, { capture: true, passive: true });
    window.addEventListener('touchend', handleFirstGestureUnlock, { capture: true, passive: true });
    window.addEventListener('pointerdown', handleFirstGestureUnlock, { capture: true, passive: true });
    window.addEventListener('pointerup', handleFirstGestureUnlock, { capture: true, passive: true });
    window.addEventListener('click', handleFirstGestureUnlock, { capture: true, passive: true });
    window.addEventListener('keydown', handleFirstGestureUnlock, { capture: true, passive: true });
    window.addEventListener('mousedown', handleFirstGestureUnlock, { capture: true, passive: true });
    window.addEventListener('pointercancel', handleActivationSignal, { capture: true, passive: true });
    window.addEventListener('touchcancel', handleActivationSignal, { capture: true, passive: true });
    window.addEventListener('scroll', handleActivationSignal, { capture: true, passive: true });
    window.addEventListener('scrollend', handleActivationSignal, { capture: true, passive: true });
    // Lightweight activation observer cleared immediately upon playback or mute;
    // catches mobile compositor scrolls / WebXR gestures even if WebGL first frame is busy.
    if (activationWatchInterval === null && typeof navigator !== 'undefined' && navigator.userActivation) {
      activationWatchInterval = setInterval(checkUserActivation, 120);
    }
  }

  function disarmFirstGestureUnlock() {
    if (postTouchCheckTimer !== null) {
      clearTimeout(postTouchCheckTimer);
      postTouchCheckTimer = null;
    }
    if (activationWatchInterval !== null) {
      clearInterval(activationWatchInterval);
      activationWatchInterval = null;
    }
    if (!pendingGestureUnlock) return;
    pendingGestureUnlock = false;
    window.removeEventListener('touchstart', handleFirstGestureUnlock, { capture: true });
    window.removeEventListener('touchend', handleFirstGestureUnlock, { capture: true });
    window.removeEventListener('pointerdown', handleFirstGestureUnlock, { capture: true });
    window.removeEventListener('pointerup', handleFirstGestureUnlock, { capture: true });
    window.removeEventListener('click', handleFirstGestureUnlock, { capture: true });
    window.removeEventListener('keydown', handleFirstGestureUnlock, { capture: true });
    window.removeEventListener('mousedown', handleFirstGestureUnlock, { capture: true });
    window.removeEventListener('pointercancel', handleActivationSignal, { capture: true });
    window.removeEventListener('touchcancel', handleActivationSignal, { capture: true });
    window.removeEventListener('scroll', handleActivationSignal, { capture: true });
    window.removeEventListener('scrollend', handleActivationSignal, { capture: true });
  }

  function startMutedPrewarm() {
    if (!bgAudio || userMutedAudio || isAudiblyPlaying() || isMutedPrewarm || mutedPrewarmPromise || gestureStartPromise) {
      return;
    }
    try {
      bgAudio.loop = true;
      bgAudio.muted = true;
      const p = bgAudio.play();
      if (p && typeof p.then === 'function') {
        const tracked = p.then(() => {
          if (bgAudio.muted && !bgAudio.paused && !userMutedAudio) {
            isMutedPrewarm = true;
          }
        }).catch(() => {
          isMutedPrewarm = false;
          if (bgAudio.paused) {
            bgAudio.muted = false;
          }
        }).finally(() => {
          if (mutedPrewarmPromise === tracked) mutedPrewarmPromise = null;
        });
        mutedPrewarmPromise = tracked;
      }
    } catch (e) {
      isMutedPrewarm = false;
      bgAudio.muted = false;
    }
  }

  function startBackgroundMusic({ fromUserGesture = false, isEarlyTouch = false } = {}) {
    if (!bgAudio) return Promise.resolve(false);
    if (userMutedAudio && !fromUserGesture) return Promise.resolve(false);

    if (isAudiblyPlaying()) {
      isAudioOn = true;
      isMutedPrewarm = false;
      pausedByVisibility = false;
      disarmFirstGestureUnlock();
      syncAudioUi();
      return Promise.resolve(true);
    }

    // Never let a pending non-gesture or Tier-1 touchstart attempt block a Tier-2 touchend/pointerup/click gesture!
    if (fromUserGesture && !isEarlyTouch) {
      if (gestureStartPromise) return gestureStartPromise;
    } else if (fromUserGesture && isEarlyTouch) {
      if (gestureStartPromise) return gestureStartPromise;
      if (earlyTouchStartPromise) return earlyTouchStartPromise;
    } else {
      // Avoid redundant NotAllowedError spam once browser policy already blocked non-gesture autoplay
      if (autoplayBlockedByPolicy && !(navigator.userActivation && navigator.userActivation.hasBeenActive)) {
        return Promise.resolve(false);
      }
      // Do not interrupt an active/in-flight muted pre-warm outside a user gesture
      if (mutedPrewarmPromise || (isMutedPrewarm && !bgAudio.paused && bgAudio.muted)) {
        return Promise.resolve(false);
      }
      if (gestureStartPromise) return gestureStartPromise;
      if (earlyTouchStartPromise) return earlyTouchStartPromise;
      if (autoStartPromise) return autoStartPromise;
    }

    const wasMutedPrewarm = isMutedPrewarm && !bgAudio.paused && bgAudio.muted;
    isMutedPrewarm = false;
    bgAudio.loop = true;
    bgAudio.muted = false;

    cancelAudioFade();
    try {
      bgAudio.volume = Math.min(0.05, targetAudioVolume);
    } catch (e) {}

    if (fromUserGesture) {
      resumeLinkedAudioContexts();
    }

    // Invoke bgAudio.play() synchronously within the user-activation call stack (mandatory on iOS Safari & Android Chrome)
    let rawPlayPromise;
    try {
      rawPlayPromise = bgAudio.play();
    } catch (syncErr) {
      rawPlayPromise = Promise.reject(syncErr);
    }

    const trackedPromise = Promise.resolve(rawPlayPromise)
      .then(() => {
        if (bgAudio.paused || bgAudio.muted) {
          isAudioOn = false;
          if (!userMutedAudio) armFirstGestureUnlock();
          syncAudioUi();
          return false;
        }
        isAudioOn = true;
        isMutedPrewarm = false;
        autoplayBlockedByPolicy = false;
        pausedByVisibility = false;
        disarmFirstGestureUnlock();
        fadeAudioVolume(targetAudioVolume, wasMutedPrewarm ? 380 : 520);
        syncAudioUi();
        return true;
      })
      .catch((err) => {
        isAudioOn = false;
        if (!fromUserGesture && err && err.name === 'NotAllowedError') {
          autoplayBlockedByPolicy = true;
        }
        if (!userMutedAudio) {
          armFirstGestureUnlock();
          if (!fromUserGesture && !isMutedPrewarm && !mutedPrewarmPromise) {
            // Silently pre-warm & buffer the audio pipeline when browser permits muted pre-warm
            startMutedPrewarm();
          }
        }
        syncAudioUi();
        return false;
      })
      .finally(() => {
        if (fromUserGesture && !isEarlyTouch) {
          if (gestureStartPromise === trackedPromise) gestureStartPromise = null;
        } else if (fromUserGesture && isEarlyTouch) {
          if (earlyTouchStartPromise === trackedPromise) earlyTouchStartPromise = null;
        } else {
          if (autoStartPromise === trackedPromise) autoStartPromise = null;
        }
      });

    if (fromUserGesture && !isEarlyTouch) {
      gestureStartPromise = trackedPromise;
    } else if (fromUserGesture && isEarlyTouch) {
      earlyTouchStartPromise = trackedPromise;
    } else {
      autoStartPromise = trackedPromise;
    }

    return trackedPromise;
  }

  function stopBackgroundMusic(isExplicitMute = true) {
    cancelAudioFade();
    isMutedPrewarm = false;
    bgAudio.pause();
    bgAudio.muted = false;
    isAudioOn = false;
    pausedByVisibility = false;
    if (isExplicitMute) {
      userMutedAudio = true;
      disarmFirstGestureUnlock();
      try {
        sessionStorage.setItem(BG_MUSIC_MUTE_KEY, '1');
      } catch (e) {}
    }
    syncAudioUi();
  }

  function toggleHolidayAudio() {
    if (isAudioOn || isAudiblyPlaying()) {
      stopBackgroundMusic(true);
    } else {
      userMutedAudio = false;
      try {
        sessionStorage.removeItem(BG_MUSIC_MUTE_KEY);
      } catch (e) {}
      startBackgroundMusic({ fromUserGesture: true });
    }
  }

  function handleAudiblePlaybackStarted() {
    if (bgAudio.muted) return;
    isAudioOn = true;
    isMutedPrewarm = false;
    pausedByVisibility = false;
    disarmFirstGestureUnlock();
    syncAudioUi();
  }

  bgAudio.addEventListener('play', handleAudiblePlaybackStarted);
  bgAudio.addEventListener('playing', handleAudiblePlaybackStarted);
  bgAudio.addEventListener('volumechange', () => {
    if (!gestureStartPromise && isAudiblyPlaying() && !isAudioOn) {
      handleAudiblePlaybackStarted();
    }
  });
  bgAudio.addEventListener('pause', () => {
    if (isMutedPrewarm) {
      isMutedPrewarm = false;
      return;
    }
    if (!pausedByVisibility) {
      isAudioOn = false;
      if (!userMutedAudio) {
        armFirstGestureUnlock();
      }
      syncAudioUi();
    }
  });
  bgAudio.addEventListener('canplay', () => {
    if (!userMutedAudio && !isAudioOn && !isMutedPrewarm && !mutedPrewarmPromise && !hasRetriedOnCanPlay) {
      hasRetriedOnCanPlay = true;
      startBackgroundMusic({ fromUserGesture: false });
    }
  });
  bgAudio.addEventListener('error', () => {
    console.warn(`[ChristmasXR] Unable to load background music track: ${BG_MUSIC_SRC}`);
    isAudioOn = false;
    isMutedPrewarm = false;
    syncAudioUi();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && !isXrActive) {
      if (isAudioOn && !bgAudio.paused) {
        pausedByVisibility = true;
        cancelAudioFade();
        bgAudio.pause();
      }
    } else if (!document.hidden && pausedByVisibility) {
      pausedByVisibility = false;
      if (!userMutedAudio) {
        startBackgroundMusic({ fromUserGesture: false });
      }
    }
  });

  window.addEventListener('pageshow', (e) => {
    if (!userMutedAudio && !isAudiblyPlaying() && (e.persisted || !isAudioOn)) {
      armFirstGestureUnlock();
      startBackgroundMusic({ fromUserGesture: false });
    }
  });

  // Bind bell/speaker button immediately so it works even while Three.js loads
  if (btnAudio && !btnAudio.dataset.xrAudioBound) {
    btnAudio.dataset.xrAudioBound = '1';
    btnAudio.addEventListener('click', toggleHolidayAudio);
  }

  syncAudioUi();

  // Arm gesture unlock IMMEDIATELY at t=0ms (before autoplay promise settles and before Three.js downloads)
  if (!userMutedAudio) {
    armFirstGestureUnlock();
    startBackgroundMusic({ fromUserGesture: false });
  }

  function checkUserActivation() {
    if (!pendingGestureUnlock || userMutedAudio || isAudiblyPlaying()) return;
    if (performance.now() < audioBtnInteractionUntil) return;
    if (navigator.userActivation && navigator.userActivation.hasBeenActive) {
      startBackgroundMusic({ fromUserGesture: true });
    }
  }

  global.CalmChessChristmasAudio = {
    BG_MUSIC_SRC,
    bgAudio,
    startBackgroundMusic,
    stopBackgroundMusic,
    toggleHolidayAudio,
    setAudioVolume,
    syncAudioUi,
    armFirstGestureUnlock,
    disarmFirstGestureUnlock,
    checkUserActivation,
    setXrActive: (active) => {
      isXrActive = !!active;
    },
    attachAudioContext: (ctx) => {
      if (ctx) linkedAudioContexts.add(ctx);
    },
    getState: () => ({
      isAudioOn,
      isMutedPrewarm,
      userMutedAudio,
      pendingGestureUnlock,
      audioSrc: BG_MUSIC_SRC,
      audioCurrentSrc: bgAudio ? bgAudio.currentSrc : '',
      audioReadyState: bgAudio ? bgAudio.readyState : 0,
      audioPaused: bgAudio ? bgAudio.paused : true,
      audioMuted: bgAudio ? bgAudio.muted : false,
      audioVolume: bgAudio ? bgAudio.volume : 0,
      audioDuration: bgAudio && Number.isFinite(bgAudio.duration) ? bgAudio.duration : 0
    })
  };
})(window);
