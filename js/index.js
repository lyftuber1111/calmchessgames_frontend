(function (global) {
  "use strict";

  const API_BASE = 'https://api.calmchessgames.com';
  let showSegmentIdsOnRing = false;
  let centerLogoUrl = 'chess.html';

  let currentSegments = [
      { ring_type: 'inner', segment_index: 0, title: 'Chess Game', url: 'chess.html', description: 'Offline Stockfish chess engine' },
      { ring_type: 'inner', segment_index: 1, title: 'Blackjack', url: 'blackjack.html', description: 'Casino style blackjack simulation' },
      { ring_type: 'inner', segment_index: 2, title: 'Mobility App', url: 'mobility.html', description: 'Exercise and mobility routines' },
      { ring_type: 'inner', segment_index: 3, title: 'Video Chat', url: 'video-chat.html', description: 'Live peer-to-peer video chat' },
      { ring_type: 'outer', segment_index: 0, title: 'About Us', url: '#about', description: 'Company history and mission' },
      { ring_type: 'outer', segment_index: 1, title: 'Engine Specs', url: 'specs.html', description: 'Hardware & architecture specs' },
      { ring_type: 'outer', segment_index: 2, title: 'Leaderboard', url: 'leaderboard.html', description: 'Global player scores' },
      { ring_type: 'outer', segment_index: 3, title: 'Contact', url: '#contact', description: 'Get in touch with support' },
      { ring_type: 'outer', segment_index: 4, title: 'Bug House', url: 'bughouse.html', description: 'Bug house chess simulation' },
      { ring_type: 'outer', segment_index: 5, title: 'Documentation', url: 'docs.html', description: 'API and game rules' }
  ];

  let allBlackjackUsers = [];
  let activeAdminTab = 'segments';
  let sessionAdminPassword = '';
  let androidSimulationMode = false;
  let desktopSimulationMode = false;
  let allowGuestAccess = true;

  async function callAdminApi(action, payload = null, method = 'POST') {
      const endpoints = [
          `${API_BASE}/admin_api.php?action=${action}&_t=${Date.now()}`,
          `./admin_api.php?action=${action}&_t=${Date.now()}`,
          `/admin_api.php?action=${action}&_t=${Date.now()}`,
          `https://calmchessgames.com/admin_api.php?action=${action}&_t=${Date.now()}`
      ];
      const uniqueEndpoints = [...new Set(endpoints)];

      let lastError = null;
      for (const url of uniqueEndpoints) {
          try {
              const fetchOptions = {
                  method: method,
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include'
              };
              if (payload !== null && method !== 'GET') {
                  fetchOptions.body = JSON.stringify(payload);
              }
              const res = await fetch(url, fetchOptions);
              const text = await res.text();
              try {
                  const data = JSON.parse(text);
                  return data;
              } catch (parseErr) {}
          } catch (e) {
              lastError = e;
          }
      }
      throw lastError || new Error('Network error calling admin API');
  }

  async function fetchSegments() {
      try {
          const cachedSegments = localStorage.getItem('calmchess_segments');
          if (cachedSegments) {
              const parsed = JSON.parse(cachedSegments);
              if (Array.isArray(parsed) && parsed.length > 0) {
                  currentSegments = parsed.filter(s => s.ring_type !== 'center');
                  renderRings();
                  renderGamesGrid();
              }
          }
      } catch (e) {
          console.warn('Error reading cached segments:', e);
      }

      try {
          const cachedLogoUrl = localStorage.getItem('calmchess_center_logo_url');
          if (cachedLogoUrl !== null && cachedLogoUrl !== '') {
              centerLogoUrl = cachedLogoUrl;
          }
      } catch (e) {
          console.warn('Error reading cached center logo URL:', e);
      }

      try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);

          const candidateUrls = [
              `${API_BASE}/get_segments.php`,
              './get_segments.php',
              '/get_segments.php',
              'https://api.calmchessgames.com/get_segments.php'
          ];
          const uniqueUrls = [...new Set(candidateUrls)];

          let data = null;
          for (const url of uniqueUrls) {
              try {
                  const response = await fetch(url, { signal: controller.signal });
                  if (response.ok) {
                      data = await response.json();
                      if (data && data.success) break;
                  }
              } catch (e) {}
          }
          clearTimeout(timeoutId);

          if (data && data.success) {
              if (data.center_logo_url !== undefined && data.center_logo_url !== null && data.center_logo_url !== '') {
                  centerLogoUrl = data.center_logo_url;
                  localStorage.setItem('calmchess_center_logo_url', centerLogoUrl);
              } else if (data.data && data.data.center_logo_url !== undefined && data.data.center_logo_url !== '') {
                  centerLogoUrl = data.data.center_logo_url;
                  localStorage.setItem('calmchess_center_logo_url', centerLogoUrl);
              }

              const apiSegments = data.segments || (data.data && data.data.segments);
              if (Array.isArray(apiSegments) && apiSegments.length > 0) {
                  const centerSeg = apiSegments.find(s => s.ring_type === 'center');
                  if (centerSeg && centerSeg.url) {
                      centerLogoUrl = centerSeg.url;
                      localStorage.setItem('calmchess_center_logo_url', centerLogoUrl);
                  }

                  const ringItems = apiSegments.filter(s => s.ring_type === 'inner' || s.ring_type === 'outer');
                  if (ringItems.length > 0) {
                      currentSegments = ringItems.map(apiSeg => {
                          const fallback = currentSegments.find(s => s.ring_type === apiSeg.ring_type && parseInt(s.segment_index, 10) === parseInt(apiSeg.segment_index, 10));
                          return {
                              ring_type: apiSeg.ring_type,
                              segment_index: parseInt(apiSeg.segment_index, 10),
                              title: apiSeg.title !== undefined ? apiSeg.title : (fallback ? fallback.title : ''),
                              url: apiSeg.url !== undefined ? apiSeg.url : (fallback ? fallback.url : ''),
                              description: apiSeg.description !== undefined ? apiSeg.description : (fallback ? fallback.description : ''),
                              is_active: apiSeg.is_active !== undefined ? parseInt(apiSeg.is_active, 10) : 1
                          };
                      });
                      localStorage.setItem('calmchess_segments', JSON.stringify(currentSegments));
                  }
              }
          }
      } catch (err) {
          console.warn('Using cached or fallback segments due to API connection error:', err);
      }
      renderRings();
      renderGamesGrid();
  }

  function describeArc(x, y, innerRadius, outerRadius, startAngle, endAngle) {
      const startOuter = polarToCartesian(x, y, outerRadius, endAngle);
      const endOuter = polarToCartesian(x, y, outerRadius, startAngle);
      const startInner = polarToCartesian(x, y, innerRadius, endAngle);
      const endInner = polarToCartesian(x, y, innerRadius, startAngle);
      const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
      return [
          "M", startOuter.x, startOuter.y,
          "A", outerRadius, outerRadius, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
          "L", endInner.x, endInner.y,
          "A", innerRadius, innerRadius, 0, largeArcFlag, 1, startInner.x, startInner.y,
          "Z"
      ].join(" ");
  }

  function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
      const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
      return {
          x: centerX + (radius * Math.cos(angleInRadians)),
          y: centerY + (radius * Math.sin(angleInRadians))
      };
  }

  function describeTextPath(cx, cy, radius, startAngle, endAngle, sweepClockwise) {
      const pStart = polarToCartesian(cx, cy, radius, sweepClockwise ? startAngle : endAngle);
      const pEnd = polarToCartesian(cx, cy, radius, sweepClockwise ? endAngle : startAngle);
      const largeArcFlag = Math.abs(endAngle - startAngle) <= 180 ? "0" : "1";
      const sweepFlag = sweepClockwise ? "1" : "0";
      return `M ${pStart.x} ${pStart.y} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${pEnd.x} ${pEnd.y}`;
  }

  let laserAudioCtx = null;
  function playSciFiLaser() {
      try {
          const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
          if (!AudioCtxClass) return;
          if (!laserAudioCtx) laserAudioCtx = new AudioCtxClass();
          if (laserAudioCtx.state === 'suspended') laserAudioCtx.resume();

          const now = laserAudioCtx.currentTime;
          const oscPrimary = laserAudioCtx.createOscillator();
          oscPrimary.type = 'sawtooth';
          oscPrimary.frequency.setValueAtTime(1550, now);
          oscPrimary.frequency.exponentialRampToValueAtTime(70, now + 0.17);

          const oscSecondary = laserAudioCtx.createOscillator();
          oscSecondary.type = 'sine';
          oscSecondary.frequency.setValueAtTime(900, now);
          oscSecondary.frequency.exponentialRampToValueAtTime(110, now + 0.14);

          const biquadFilter = laserAudioCtx.createBiquadFilter();
          biquadFilter.type = 'bandpass';
          biquadFilter.Q.setValueAtTime(3.8, now);
          biquadFilter.frequency.setValueAtTime(2400, now);
          biquadFilter.frequency.exponentialRampToValueAtTime(240, now + 0.17);

          const gainEnvelope = laserAudioCtx.createGain();
          gainEnvelope.gain.setValueAtTime(0.35, now);
          gainEnvelope.gain.exponentialRampToValueAtTime(0.001, now + 0.19);

          oscPrimary.connect(biquadFilter);
          oscSecondary.connect(biquadFilter);
          biquadFilter.connect(gainEnvelope);
          gainEnvelope.connect(laserAudioCtx.destination);

          oscPrimary.start(now);
          oscSecondary.start(now);
          oscPrimary.stop(now + 0.2);
          oscSecondary.stop(now + 0.2);
      } catch (err) {
          console.warn('Laser sound synthesis error:', err);
      }
  }

  function handleRingSegmentPress(url) {
      playSciFiLaser();
      if (!url) return;
      if (url.startsWith('#')) {
          window.location.href = url;
      } else {
          setTimeout(() => { window.location.href = url; }, 130);
      }
  }

  function handleCenterLogoRedirect(url) {
      if (!url || typeof url !== 'string') return;
      const targetUrl = url.trim();
      if (!targetUrl) return;

      playSciFiLaser();
      if (targetUrl.startsWith('#')) {
          window.location.href = targetUrl;
      } else {
          setTimeout(() => { window.location.href = targetUrl; }, 130);
      }
  }

  function renderRings() {
      const svg = document.getElementById('ringSvg');
      if (!svg) return;
      svg.innerHTML = '';
      const cx = 250, cy = 250;

      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      svg.appendChild(defs);

      const innerSegments = currentSegments.filter(s => s.ring_type === 'inner');
      const outerSegments = currentSegments.filter(s => s.ring_type === 'outer');

      if (innerSegments.length > 0) {
          const angleStep = 360 / innerSegments.length;
          innerSegments.forEach((seg, i) => {
              const startAngle = i * angleStep;
              const endAngle = (i + 1) * angleStep;
              const midAngle = startAngle + (angleStep / 2);
              const pathData = describeArc(cx, cy, 75, 125, startAngle + 1.5, endAngle - 1.5);

              const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
              path.setAttribute('d', pathData);
              path.setAttribute('fill', '#ffd700');
              path.setAttribute('class', 'ring-segment');
              path.setAttribute('role', 'button');
              path.setAttribute('tabindex', '0');
              path.setAttribute('aria-label', seg.title);
              path.onpointerdown = () => playSciFiLaser();
              path.onclick = (e) => { e.preventDefault(); handleRingSegmentPress(seg.url); };
              path.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleRingSegmentPress(seg.url); } };
              svg.appendChild(path);

              const textRadius = 100;
              const sweepClockwise = !(midAngle > 90 && midAngle < 270);
              const textPathId = `inner-textpath-${i}`;

              const textArc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
              textArc.setAttribute('id', textPathId);
              textArc.setAttribute('d', describeTextPath(cx, cy, textRadius, startAngle + 2, endAngle - 2, sweepClockwise));
              textArc.setAttribute('fill', 'none');
              defs.appendChild(textArc);

              const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
              text.setAttribute('class', 'ring-text');
              text.setAttribute('dominant-baseline', 'central');

              const textPath = document.createElementNS('http://www.w3.org/2000/svg', 'textPath');
              textPath.setAttribute('href', '#' + textPathId);
              textPath.setAttribute('startOffset', '50%');
              textPath.setAttribute('text-anchor', 'middle');
              textPath.textContent = seg.title;

              text.appendChild(textPath);
              svg.appendChild(text);

              if (showSegmentIdsOnRing) {
                  const idPos = polarToCartesian(cx, cy, 115, midAngle);
                  let idText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                  idText.setAttribute('x', idPos.x);
                  idText.setAttribute('y', idPos.y);
                  idText.setAttribute('class', 'ring-id-label');
                  idText.setAttribute('text-anchor', 'middle');
                  idText.setAttribute('dominant-baseline', 'middle');
                  idText.textContent = `inner-${i}`;
                  svg.appendChild(idText);
              }
          });
      }

      if (outerSegments.length > 0) {
          const angleStep = 360 / outerSegments.length;
          outerSegments.forEach((seg, i) => {
              const startAngle = i * angleStep;
              const endAngle = (i + 1) * angleStep;
              const midAngle = startAngle + (angleStep / 2);
              const pathData = describeArc(cx, cy, 135, 215, startAngle + 1.5, endAngle - 1.5);

              const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
              path.setAttribute('d', pathData);
              path.setAttribute('fill', '#ffe066');
              path.setAttribute('class', 'ring-segment');
              path.setAttribute('role', 'button');
              path.setAttribute('tabindex', '0');
              path.setAttribute('aria-label', seg.title);
              path.onpointerdown = () => playSciFiLaser();
              path.onclick = (e) => { e.preventDefault(); handleRingSegmentPress(seg.url); };
              path.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleRingSegmentPress(seg.url); } };
              svg.appendChild(path);

              const textRadius = 175;
              const sweepClockwise = !(midAngle > 100 && midAngle < 250);
              const textPathId = `outer-textpath-${i}`;

              const textArc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
              textArc.setAttribute('id', textPathId);
              textArc.setAttribute('d', describeTextPath(cx, cy, textRadius, startAngle + 2, endAngle - 2, sweepClockwise));
              textArc.setAttribute('fill', 'none');
              defs.appendChild(textArc);

              const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
              text.setAttribute('class', 'ring-text');
              text.setAttribute('dominant-baseline', 'central');

              const textPath = document.createElementNS('http://www.w3.org/2000/svg', 'textPath');
              textPath.setAttribute('href', '#' + textPathId);
              textPath.setAttribute('startOffset', '50%');
              textPath.setAttribute('text-anchor', 'middle');
              textPath.textContent = seg.title;

              text.appendChild(textPath);
              svg.appendChild(text);

              if (showSegmentIdsOnRing) {
                  const idPos = polarToCartesian(cx, cy, 203, midAngle);
                  let idText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                  idText.setAttribute('x', idPos.x);
                  idText.setAttribute('y', idPos.y);
                  idText.setAttribute('class', 'ring-id-label');
                  idText.setAttribute('text-anchor', 'middle');
                  idText.setAttribute('dominant-baseline', 'middle');
                  idText.textContent = `outer-${i}`;
                  svg.appendChild(idText);
              }
          });
      }
  }

  function renderGamesGrid() {
      const grid = document.getElementById('gamesGrid');
      if (!grid) return;
      grid.innerHTML = '';
      currentSegments.filter(s => s.ring_type !== 'center').forEach(seg => {
          const card = document.createElement('div');
          card.className = 'game-card';
          card.innerHTML = `
              <div>
                  <h3>${seg.title}</h3>
                  <p>${seg.description || 'Explore interactive features and games.'}</p>
              </div>
              <a href="${seg.url}" class="btn" style="display:inline-block; margin-top:15px; text-align:center;">Launch Page</a>
          `;
          grid.appendChild(card);
      });
  }

  function toggleSegmentIds(isChecked) {
      showSegmentIdsOnRing = isChecked;
      renderRings();
  }

  const centerLogo = document.getElementById('centerLogo');
  let clickCount = 0;
  let clickTimer = null;

  if (centerLogo) {
      centerLogo.addEventListener('click', (e) => {
          e.stopPropagation();
          clickCount++;

          if (clickCount === 1) {
              clickTimer = setTimeout(() => {
                  const wasSingleClick = (clickCount === 1);
                  clickCount = 0;
                  if (wasSingleClick && centerLogoUrl && centerLogoUrl.trim() !== '') {
                      handleCenterLogoRedirect(centerLogoUrl);
                  }
              }, 600);
          } else if (clickCount === 3) {
              clearTimeout(clickTimer);
              clickCount = 0;
              promptAdminPassword();
          }
      });

      centerLogo.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (centerLogoUrl && centerLogoUrl.trim() !== '') {
                  handleCenterLogoRedirect(centerLogoUrl);
              }
          }
      });
  }

  function promptAdminPassword() {
      const authModal = document.getElementById('adminPasswordModal');
      const authInput = document.getElementById('adminAuthInput');
      const authError = document.getElementById('adminAuthError');
      const submitBtn = document.getElementById('adminAuthSubmitBtn');
      if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Unlock Console';
      }
      if (authInput) authInput.value = sessionAdminPassword || '';
      if (authError) {
          authError.innerText = '';
          authError.style.display = 'none';
      }
      if (authModal) authModal.style.display = 'flex';
      if (authInput) setTimeout(() => authInput.focus(), 50);
  }

  function closeAdminPasswordModal() {
      const authModal = document.getElementById('adminPasswordModal');
      if (authModal) authModal.style.display = 'none';
  }

  // CRITICAL FIX: Verifies password with server BEFORE granting entry!
  async function submitAdminPassword() {
      const authInput = document.getElementById('adminAuthInput');
      const authError = document.getElementById('adminAuthError');
      const submitBtn = document.getElementById('adminAuthSubmitBtn');
      const password = authInput ? authInput.value.trim() : '';

      if (!password) {
          if (authError) {
              authError.innerText = 'Password cannot be empty.';
              authError.style.display = 'block';
          }
          if (authInput) authInput.focus();
          return;
      }

      if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Verifying...';
      }
      if (authError) {
          authError.style.display = 'none';
      }

      try {
          const data = await callAdminApi('verify_auth', { admin_key: password, admin_password: password });

          if (data && data.success) {
              sessionAdminPassword = password;
              closeAdminPasswordModal();
              openAdminModal(password);
          } else {
              if (authError) {
                  authError.innerText = (data && data.message) ? data.message : 'Invalid Admin Password. Access Denied.';
                  authError.style.display = 'block';
              }
              if (authInput) authInput.focus();
          }
      } catch (err) {
          if (authError) {
              authError.innerText = 'Authentication error: Could not reach API server.';
              authError.style.display = 'block';
          }
      } finally {
          if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = 'Unlock Console';
          }
      }
  }

  window.addEventListener('DOMContentLoaded', () => {
      const authInput = document.getElementById('adminAuthInput');
      if (authInput) {
          authInput.addEventListener('keydown', (e) => {
              if (e.key === 'Enter') {
                  e.preventDefault();
                  submitAdminPassword();
              } else if (e.key === 'Escape') {
                  closeAdminPasswordModal();
              }
          });
      }
  });

  /* --- ADMIN TAB SWITCHER --- */
  function switchAdminTab(tabName) {
      // Map potential aliases
      const normalized = (tabName || 'segments').toLowerCase().trim();
      let targetTab = 'segments';
      if (normalized === 'store' || normalized === 'billing' || normalized === 'shop' || normalized === 'credit' || normalized === 'purchases') {
          targetTab = 'store';
      } else if (normalized === 'users' || normalized === 'user' || normalized === 'players' || normalized === 'accounts') {
          targetTab = 'users';
      } else {
          targetTab = 'segments';
      }

      activeAdminTab = targetTab;
      const tabBtnSegments = document.getElementById('tabBtnSegments');
      const tabBtnUsers = document.getElementById('tabBtnUsers');
      const tabBtnStore = document.getElementById('tabBtnStore');
      const contentSegments = document.getElementById('tabContentSegments');
      const contentUsers = document.getElementById('tabContentUsers');
      const contentStore = document.getElementById('tabContentStore');

      if (tabBtnSegments) tabBtnSegments.classList.toggle('active', targetTab === 'segments');
      if (tabBtnUsers) tabBtnUsers.classList.toggle('active', targetTab === 'users');
      if (tabBtnStore) tabBtnStore.classList.toggle('active', targetTab === 'store');

      if (contentSegments) contentSegments.style.display = (targetTab === 'segments') ? 'block' : 'none';
      if (contentUsers) contentUsers.style.display = (targetTab === 'users') ? 'block' : 'none';
      if (contentStore) contentStore.style.display = (targetTab === 'store') ? 'block' : 'none';

      // Reset scroll position to top of modal container so users see the selected tab header immediately
      const adminContent = document.querySelector('.admin-content');
      if (adminContent) {
          adminContent.scrollTop = 0;
      }

      if (targetTab === 'users') {
          fetchBlackjackUsers();
      } else if (targetTab === 'store') {
          fetchStoreSettings();
      }
  }

  function getAdminKey() {
      const pwdInput = document.getElementById('adminPassword');
      let key = pwdInput ? pwdInput.value.trim() : '';
      if (!key) {
          const authInput = document.getElementById('adminAuthInput');
          if (authInput && authInput.value.trim()) {
              key = authInput.value.trim();
          }
      }
      if (!key && sessionAdminPassword) {
          key = sessionAdminPassword;
      }
      if (key && pwdInput && !pwdInput.value) {
          pwdInput.value = key;
      }
      return key;
  }

  function openAdminModal(providedPassword = '') {
      if (providedPassword) {
          sessionAdminPassword = providedPassword;
      }
      const adminPwdInput = document.getElementById('adminPassword');
      if (adminPwdInput) {
          adminPwdInput.value = sessionAdminPassword || providedPassword || '';
      }

      const centerLogoInput = document.getElementById('adminCenterLogoUrl');
      if (centerLogoInput) {
          centerLogoInput.value = centerLogoUrl || '';
      }

      const listContainer = document.getElementById('adminSegmentsList');
      if (listContainer) {
          listContainer.innerHTML = '';
          const segmentsToEdit = currentSegments.filter(s => s.ring_type !== 'center');
          segmentsToEdit.forEach((seg, index) => {
              const segmentId = `${seg.ring_type}-${seg.segment_index}`;
              const titleVal = (seg.title || '').replace(/"/g, '&quot;');
              const urlVal = (seg.url || '').replace(/"/g, '&quot;');
              const descVal = (seg.description || '').replace(/"/g, '&quot;');

              listContainer.innerHTML += `
                  <div style="background: rgba(0,0,0,0.3); padding: 12px; margin-bottom: 12px; border-radius: 6px; border: 1px solid #334155;">
                      <strong style="color: var(--gold-primary); display: block; margin-bottom: 8px;">Segment ID: [${segmentId}]</strong>
                      <div class="form-group">
                          <label>Title</label>
                          <input type="text" id="admin_title_${index}" value="${titleVal}">
                      </div>
                      <div class="form-group">
                          <label>URL / Path</label>
                          <input type="text" id="admin_url_${index}" value="${urlVal}">
                      </div>
                      <div class="form-group">
                          <label>Description</label>
                          <input type="text" id="admin_desc_${index}" value="${descVal}">
                      </div>
                  </div>
              `;
          });
      }

      switchAdminTab(activeAdminTab || 'segments');
      fetchStoreSettings();
      const modal = document.getElementById('adminModal');
      if (modal) modal.style.display = 'flex';
  }

  function closeAdminModal() {
      const modal = document.getElementById('adminModal');
      if (modal) modal.style.display = 'none';
  }

  async function saveSegments() {
      const password = getAdminKey();

      if (!password) {
          alert('Admin password is required to save changes.');
          promptAdminPassword();
          return;
      }

      const centerLogoInput = document.getElementById('adminCenterLogoUrl');
      const updatedCenterLogoUrl = centerLogoInput ? centerLogoInput.value.trim() : centerLogoUrl;

      const nonCenterSegments = currentSegments.filter(s => s.ring_type !== 'center');
      const updatedSegments = nonCenterSegments.map((seg, index) => {
          const titleEl = document.getElementById(`admin_title_${index}`);
          const urlEl = document.getElementById(`admin_url_${index}`);
          const descEl = document.getElementById(`admin_desc_${index}`);
          return {
              ring_type: seg.ring_type,
              segment_index: parseInt(seg.segment_index, 10),
              title: titleEl ? titleEl.value : seg.title,
              url: urlEl ? urlEl.value : seg.url,
              description: descEl ? descEl.value : (seg.description || ''),
              is_active: 1
          };
      });

      const saveButtons = document.querySelectorAll('.admin-modal .btn-save');
      saveButtons.forEach(btn => {
          btn.disabled = true;
          btn.textContent = 'Saving...';
      });

      try {
          let savedToServer = false;
          let errorMsg = '';

          const candidateUrls = [
              `${API_BASE}/update_segments.php`,
              './update_segments.php',
              '/update_segments.php',
              'https://api.calmchessgames.com/update_segments.php'
          ];
          const uniqueUrls = [...new Set(candidateUrls)];

          const payload = {
              admin_password: password,
              admin_key: password,
              segments: [
                  ...updatedSegments,
                  {
                      ring_type: 'center',
                      segment_index: 0,
                      title: 'Center Logo',
                      url: updatedCenterLogoUrl,
                      description: 'Center knight logo single-click redirect URL',
                      is_active: 1
                  }
              ],
              center_logo_url: updatedCenterLogoUrl
          };

          for (const targetUrl of uniqueUrls) {
              try {
                  const response = await fetch(targetUrl, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload)
                  });
                  const result = await response.json();
                  if (result.success) {
                      savedToServer = true;
                      break;
                  } else {
                      errorMsg = result.message || result.error || 'Unauthorized';
                      if (response.status === 401) break;
                  }
              } catch (e) {}
          }

          if (savedToServer) {
              currentSegments = updatedSegments;
              centerLogoUrl = updatedCenterLogoUrl;
              localStorage.setItem('calmchess_segments', JSON.stringify(updatedSegments));
              localStorage.setItem('calmchess_center_logo_url', centerLogoUrl);
              renderRings();
              renderGamesGrid();
              alert('Settings updated successfully in database!');
              closeAdminModal();
          } else if (errorMsg && errorMsg.includes('credentials')) {
              alert('Error: ' + errorMsg + '. Please verify your Admin Password.');
              promptAdminPassword();
          } else {
              currentSegments = updatedSegments;
              centerLogoUrl = updatedCenterLogoUrl;
              localStorage.setItem('calmchess_segments', JSON.stringify(updatedSegments));
              localStorage.setItem('calmchess_center_logo_url', centerLogoUrl);
              renderRings();
              renderGamesGrid();
              alert('Changes saved locally. (Backend: ' + (errorMsg || 'Network/CORS') + ')');
              closeAdminModal();
          }
      } catch (err) {
          console.error('Error saving settings:', err);
          currentSegments = updatedSegments;
          centerLogoUrl = updatedCenterLogoUrl;
          localStorage.setItem('calmchess_segments', JSON.stringify(updatedSegments));
          localStorage.setItem('calmchess_center_logo_url', centerLogoUrl);
          renderRings();
          renderGamesGrid();
          alert('Changes saved locally.');
          closeAdminModal();
      } finally {
          saveButtons.forEach(btn => {
              btn.disabled = false;
              btn.textContent = 'Save Changes';
          });
      }
  }

  /* --- BLACKJACK USER MANAGEMENT LOGIC --- */

  function showUserAdminAlert(message, isSuccess = true) {
      const alertBox = document.getElementById('userAdminAlert');
      if (!alertBox) return;
      alertBox.style.display = 'block';
      alertBox.style.background = isSuccess ? 'rgba(46, 204, 113, 0.15)' : 'rgba(239, 68, 68, 0.15)';
      alertBox.style.color = isSuccess ? 'var(--success-green)' : 'var(--error-red)';
      alertBox.style.border = `1px solid ${isSuccess ? 'var(--success-green)' : 'var(--error-red)'}`;
      alertBox.textContent = message;
      setTimeout(() => { alertBox.style.display = 'none'; }, 4500);
  }

  function toggleCreateUserPanel(forceOpen) {
      const panel = document.getElementById('createUserPanel');
      if (!panel) return;
      if (typeof forceOpen === 'boolean') {
          panel.style.display = forceOpen ? 'block' : 'none';
      } else {
          panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
      }
  }

  async function fetchBlackjackUsers() {
      const container = document.getElementById('adminUsersList');
      const adminKey = getAdminKey();

      if (!adminKey) {
          if (container) {
              container.innerHTML = `
                  <div style="text-align: center; padding: 24px;">
                      <p style="color: var(--error-red); margin-bottom: 12px; font-weight: 600;">Admin password is missing or session expired.</p>
                      <button class="btn btn-sm btn-gold" onclick="promptAdminPassword()">Re-enter Password</button>
                  </div>
              `;
          }
          return;
      }

      if (container) {
          container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem; text-align: center; padding: 20px;">Fetching users from database...</p>';
      }

      try {
          const res = await fetch(`${API_BASE}/admin_api.php?action=get_users&_t=${Date.now()}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  admin_key: adminKey,
                  admin_password: adminKey 
              })
          });

          const rawText = await res.text();
          let data;
          try {
              data = JSON.parse(rawText);
          } catch (jsonErr) {
              if (container) {
                  container.innerHTML = `<p style="color: var(--error-red); text-align: center; padding: 20px;">Server Error (${res.status}): ${rawText.replace(/<[^>]*>?/gm, '').trim() || 'Internal Error'}</p>`;
              }
              return;
          }

          if (data.success && Array.isArray(data.users)) {
              allBlackjackUsers = data.users;
              const searchVal = document.getElementById('adminUserSearchInput') ? document.getElementById('adminUserSearchInput').value : '';
              renderBlackjackUsers(searchVal);
          } else {
              if (container) {
                  container.innerHTML = `
                      <div style="text-align: center; padding: 24px;">
                          <p style="color: var(--error-red); margin-bottom: 12px;">${data.message || 'Unauthorized access'}</p>
                          <button class="btn btn-sm btn-gold" onclick="promptAdminPassword()">Re-authenticate</button>
                      </div>
                  `;
              }
          }
      } catch (err) {
          if (container) {
              container.innerHTML = `<p style="color: var(--error-red); text-align: center; padding: 20px;">Connection failed: ${err.message}</p>`;
          }
      }
  }

  function handleUserSearchInput(term) {
      renderBlackjackUsers(term);
  }

  function renderBlackjackUsers(filterTerm = '') {
      const container = document.getElementById('adminUsersList');
      if (!container) return;

      const term = (filterTerm || '').toLowerCase().trim();
      const filtered = allBlackjackUsers.filter(u => {
          const email = (u.email || u.username || '').toLowerCase();
          const id = String(u.id || '');
          return email.includes(term) || id.includes(term);
      });

      if (filtered.length === 0) {
          container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 24px;">No matching users found.</p>';
          return;
      }

      container.innerHTML = '';
      filtered.forEach(user => {
          const isBanned = parseInt(user.is_active, 10) === 0 || parseInt(user.is_banned, 10) === 1;
          const card = document.createElement('div');
          card.className = `user-card ${isBanned ? 'banned' : ''}`;
          card.id = `user_card_${user.id}`;

          card.innerHTML = `
              <div class="user-card-head">
                  <div style="font-weight: 700; color: var(--gold-primary); font-size: 0.95rem;">
                      #${user.id} — <span id="user_display_${user.id}">${user.email || user.username}</span>
                  </div>
                  <div style="display: flex; gap: 8px; align-items: center;">
                      <span class="badge-status ${isBanned ? 'badge-banned' : 'badge-active'}">${isBanned ? 'Banned' : 'Active'}</span>
                      <span style="font-size: 0.72rem; color: var(--text-muted);">${user.created_at ? user.created_at.split(' ')[0] : ''}</span>
                  </div>
              </div>

              <div class="user-card-inputs">
                  <div>
                      <label>Username / Email</label>
                      <input type="text" id="usr_email_${user.id}" value="${user.email || user.username || ''}">
                  </div>
                  <div>
                      <label>Bankroll ($)</label>
                      <input type="number" id="usr_bank_${user.id}" value="${parseFloat(user.bank || 0)}" min="0" step="5">
                  </div>
                  <div>
                      <label>Reset Password (blank to keep)</label>
                      <input type="password" id="usr_pwd_${user.id}" placeholder="New password">
                  </div>
              </div>

              <div class="user-card-actions">
                  <button class="btn btn-sm btn-gold" onclick="executeUpdateUser(${user.id})">Save Edit</button>
                  <button class="btn btn-sm ${isBanned ? 'btn-success' : 'btn-warn'}" onclick="executeToggleBanUser(${user.id}, ${isBanned ? 1 : 0})">
                      ${isBanned ? 'Unban User' : 'Ban User'}
                  </button>
                  <button class="btn btn-sm btn-danger" onclick="executeDeleteUser(${user.id}, '${user.email || user.username}')">Delete</button>
              </div>
          `;
          container.appendChild(card);
      });
  }

  async function executeCreateUser() {
      const adminKey = getAdminKey();
      const email = document.getElementById('new_user_email').value.trim();
      const password = document.getElementById('new_user_pwd').value;
      const bank = parseFloat(document.getElementById('new_user_bank').value) || 0;
      const isActive = parseInt(document.getElementById('new_user_status').value, 10);

      if (!email || !password) {
          showUserAdminAlert('Email/Username and Password are required.', false);
          return;
      }

      try {
          const res = await fetch(`${API_BASE}/admin_api.php?action=create_user`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  admin_key: adminKey,
                  admin_password: adminKey,
                  email: email,
                  password: password,
                  bank: bank,
                  is_active: isActive
              })
          });
          const data = await res.json();
          if (data.success) {
              showUserAdminAlert(data.message || 'User created successfully!', true);
              document.getElementById('new_user_email').value = '';
              document.getElementById('new_user_pwd').value = '';
              toggleCreateUserPanel(false);
              fetchBlackjackUsers();
          } else {
              showUserAdminAlert(data.message || 'Failed to create user.', false);
          }
      } catch (err) {
          showUserAdminAlert('Error: ' + err.message, false);
      }
  }

  async function executeUpdateUser(userId) {
      const adminKey = getAdminKey();
      const email = document.getElementById(`usr_email_${userId}`).value.trim();
      const bank = parseFloat(document.getElementById(`usr_bank_${userId}`).value) || 0;
      const newPwd = document.getElementById(`usr_pwd_${userId}`).value;

      if (!email) {
          showUserAdminAlert('Email cannot be empty.', false);
          return;
      }

      try {
          const res = await fetch(`${API_BASE}/admin_api.php?action=update_user`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  admin_key: adminKey,
                  admin_password: adminKey,
                  user_id: userId,
                  email: email,
                  bank: bank,
                  password: newPwd || undefined
              })
          });
          const data = await res.json();
          if (data.success) {
              showUserAdminAlert(`User #${userId} updated successfully!`, true);
              document.getElementById(`usr_pwd_${userId}`).value = '';
              fetchBlackjackUsers();
          } else {
              showUserAdminAlert(data.message || 'Update failed.', false);
          }
      } catch (err) {
          showUserAdminAlert('Error: ' + err.message, false);
      }
  }

  async function executeToggleBanUser(userId, newActiveStatus) {
      const adminKey = getAdminKey();
      const actionLabel = newActiveStatus === 1 ? 'unban' : 'ban';
      if (!confirm(`Are you sure you want to ${actionLabel} user #${userId}?`)) return;

      try {
          const res = await fetch(`${API_BASE}/admin_api.php?action=toggle_ban_user`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  admin_key: adminKey,
                  admin_password: adminKey,
                  user_id: userId,
                  is_active: newActiveStatus
              })
          });
          const data = await res.json();
          if (data.success) {
              showUserAdminAlert(data.message || `User #${userId} status updated!`, true);
              fetchBlackjackUsers();
          } else {
              showUserAdminAlert(data.message || 'Status change failed.', false);
          }
      } catch (err) {
          showUserAdminAlert('Error: ' + err.message, false);
      }
  }

  async function executeDeleteUser(userId, userEmail) {
      const adminKey = getAdminKey();
      if (!confirm(`PERMANENT ACTION: Delete user #${userId} (${userEmail}) from the database?`)) return;

      try {
          const res = await fetch(`${API_BASE}/admin_api.php?action=delete_user`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  admin_key: adminKey,
                  admin_password: adminKey,
                  user_id: userId
              })
          });
          const data = await res.json();
          if (data.success) {
              showUserAdminAlert(`User #${userId} permanently deleted.`, true);
              fetchBlackjackUsers();
          } else {
              showUserAdminAlert(data.message || 'Delete failed.', false);
          }
      } catch (err) {
          showUserAdminAlert('Error: ' + err.message, false);
      }
  }

  /* --- BLACKJACK BILLING & STORE CONFIG LOGIC --- */

  let allStorePurchases = [];
  let activePurchaseFilter = 'ALL';
  let activePurchaseSearchTerm = '';

  async function fetchStoreSettings() {
      const adminKey = getAdminKey();
      const alertBox = document.getElementById('storeSettingsAlert');
      if (alertBox) alertBox.style.display = 'none';

      try {
          const data = await callAdminApi('get_dashboard_data', { admin_key: adminKey, admin_password: adminKey });
          if (data && data.success) {
              if (data.android_simulation_mode !== undefined) {
                  androidSimulationMode = Boolean(data.android_simulation_mode);
              }
              if (data.desktop_simulation_mode !== undefined) {
                  desktopSimulationMode = Boolean(data.desktop_simulation_mode);
              } else if (data.simulation_mode !== undefined) {
                  desktopSimulationMode = Boolean(data.simulation_mode);
              }
              if (data.allow_guest !== undefined) {
                  allowGuestAccess = Boolean(data.allow_guest);
              }

              const androidToggle = document.getElementById('adminAndroidSimToggle');
              const desktopToggle = document.getElementById('adminDesktopSimToggle');
              const guestToggle = document.getElementById('adminGuestToggle');

              if (androidToggle) androidToggle.checked = androidSimulationMode;
              if (desktopToggle) desktopToggle.checked = desktopSimulationMode;
              if (guestToggle) guestToggle.checked = allowGuestAccess;

              updateStoreBadges(androidSimulationMode, desktopSimulationMode, allowGuestAccess);

              // Save purchases in memory and render
              if (Array.isArray(data.purchases)) {
                  allStorePurchases = data.purchases;
                  renderStoreLedger();
              }
          } else {
              showStoreAlert((data && data.message) ? data.message : 'Failed to load store settings from database.', false);
          }
      } catch (err) {
          console.warn('Could not load dashboard data, trying get_mode:', err);
          try {
              const data = await callAdminApi('get_mode', null, 'GET');
              if (data && data.success) {
                  if (data.android_simulation_mode !== undefined) {
                      androidSimulationMode = Boolean(data.android_simulation_mode);
                  }
                  if (data.desktop_simulation_mode !== undefined) {
                      desktopSimulationMode = Boolean(data.desktop_simulation_mode);
                  } else if (data.simulation_mode !== undefined) {
                      desktopSimulationMode = Boolean(data.simulation_mode);
                  }
                  if (data.allow_guest !== undefined) {
                      allowGuestAccess = Boolean(data.allow_guest);
                  }

                  const androidToggle = document.getElementById('adminAndroidSimToggle');
                  const desktopToggle = document.getElementById('adminDesktopSimToggle');
                  const guestToggle = document.getElementById('adminGuestToggle');

                  if (androidToggle) androidToggle.checked = androidSimulationMode;
                  if (desktopToggle) desktopToggle.checked = desktopSimulationMode;
                  if (guestToggle) guestToggle.checked = allowGuestAccess;

                  updateStoreBadges(androidSimulationMode, desktopSimulationMode, allowGuestAccess);
              }
          } catch (e2) {
              showStoreAlert('Connection error loading settings from database: ' + e2.message, false);
          }
      }
  }

  function handleStoreToggleChange() {
      const androidToggle = document.getElementById('adminAndroidSimToggle');
      const desktopToggle = document.getElementById('adminDesktopSimToggle');
      const guestToggle = document.getElementById('adminGuestToggle');

      const isAndroidSim = androidToggle ? androidToggle.checked : false;
      const isDesktopSim = desktopToggle ? desktopToggle.checked : false;
      const isGuest = guestToggle ? guestToggle.checked : true;

      updateStoreBadges(isAndroidSim, isDesktopSim, isGuest);
  }

  function updateStoreBadges(isAndroidSim, isDesktopSim, isGuest) {
      const androidBadge = document.getElementById('androidSimBadge');
      const androidExplanation = document.getElementById('androidModeExplanation');
      const androidCheckLabel = document.getElementById('androidCheckMarkLabel');
      if (androidBadge) {
          androidBadge.className = `badge-status ${isAndroidSim ? 'badge-sim' : 'badge-live'}`;
          androidBadge.textContent = isAndroidSim ? 'Simulated Credit Purchases' : 'Live: Google Play Billing';
      }
      if (androidCheckLabel) {
          androidCheckLabel.textContent = isAndroidSim ? '[✔] Simulated Active' : '[  ] Live Google Play';
          androidCheckLabel.style.color = isAndroidSim ? 'var(--success-green)' : 'var(--gold-primary)';
      }
      if (androidExplanation) {
          androidExplanation.innerHTML = isAndroidSim
              ? '<span style="color:var(--success-green); font-weight:bold;">Simulation Active:</span> In-app credit purchases bypass Google Play and refill chips instantly (database: <code>android_simulation_mode = 1</code>).'
              : '<span style="color:var(--gold-primary); font-weight:bold;">Live Billing Active:</span> Android in-app purchases use official <strong>Google Play In-App Billing</strong> (database: <code>android_simulation_mode = 0</code>).';
      }

      const desktopBadge = document.getElementById('desktopSimBadge');
      const desktopExplanation = document.getElementById('desktopModeExplanation');
      const desktopCheckLabel = document.getElementById('desktopCheckMarkLabel');
      if (desktopBadge) {
          desktopBadge.className = `badge-status ${isDesktopSim ? 'badge-sim' : 'badge-live'}`;
          desktopBadge.textContent = isDesktopSim ? 'Simulated Checkout' : 'Live: PayPal Gateway';
      }
      if (desktopCheckLabel) {
          desktopCheckLabel.textContent = isDesktopSim ? '[✔] Simulated Active' : '[  ] Live PayPal';
          desktopCheckLabel.style.color = isDesktopSim ? 'var(--success-green)' : 'var(--gold-primary)';
      }
      if (desktopExplanation) {
          desktopExplanation.innerHTML = isDesktopSim
              ? '<span style="color:var(--success-green); font-weight:bold;">Simulation Active:</span> Chip purchases on <code>blackjack.html</code> bypass PayPal and refill instantly in simulated mode (database: <code>desktop_simulation_mode = 1</code>).'
              : '<span style="color:var(--gold-primary); font-weight:bold;">Live Gateway Active:</span> Desktop players purchase chips through <strong>PayPal Orders v2</strong> (database: <code>desktop_simulation_mode = 0</code>).';
      }

      const guestBadge = document.getElementById('guestAccessBadge');
      const guestExplanation = document.getElementById('guestModeExplanation');
      const guestCheckLabel = document.getElementById('guestCheckMarkLabel');
      if (guestBadge) {
          guestBadge.className = `badge-status ${isGuest ? 'badge-active' : 'badge-banned'}`;
          guestBadge.textContent = isGuest ? 'Guest Allowed' : 'Registration Required';
      }
      if (guestCheckLabel) {
          guestCheckLabel.textContent = isGuest ? '[✔] Allowed' : '[  ] Disabled';
          guestCheckLabel.style.color = isGuest ? 'var(--success-green)' : 'var(--error-red)';
      }
      if (guestExplanation) {
          guestExplanation.innerHTML = isGuest
              ? 'Guest play is enabled. Players can enter tables immediately without logging in.'
              : 'Guest play is disabled. Players must sign in with a registered account.';
      }
  }

  function showStoreAlert(message, isSuccess = true) {
      const alertBox = document.getElementById('storeSettingsAlert');
      if (!alertBox) return;
      alertBox.style.display = 'block';
      alertBox.style.background = isSuccess ? 'rgba(46, 204, 113, 0.15)' : 'rgba(239, 68, 68, 0.15)';
      alertBox.style.color = isSuccess ? 'var(--success-green)' : 'var(--error-red)';
      alertBox.style.border = `1px solid ${isSuccess ? 'var(--success-green)' : 'var(--error-red)'}`;
      alertBox.textContent = message;
      setTimeout(() => { if (alertBox) alertBox.style.display = 'none'; }, 6000);
  }

  async function saveStoreSettings() {
      const adminKey = getAdminKey();
      if (!adminKey) {
          alert('Admin password required. Please re-authenticate.');
          promptAdminPassword();
          return;
      }

      const androidToggle = document.getElementById('adminAndroidSimToggle');
      const desktopToggle = document.getElementById('adminDesktopSimToggle');
      const guestToggle = document.getElementById('adminGuestToggle');

      const isAndroidSim = androidToggle ? (androidToggle.checked ? 1 : 0) : 0;
      const isDesktopSim = desktopToggle ? (desktopToggle.checked ? 1 : 0) : 0;
      const isGuest = guestToggle ? (guestToggle.checked ? 1 : 0) : 1;

      showStoreAlert('Saving settings to MySQL database...', true);

      try {
          const payload = {
              admin_key: adminKey,
              admin_password: adminKey,
              android_simulation_mode: isAndroidSim,
              desktop_simulation_mode: isDesktopSim,
              simulation_mode: isDesktopSim,
              allow_guest: isGuest
          };

          const data = await callAdminApi('set_mode', payload, 'POST');
          if (data && data.success) {
              androidSimulationMode = Boolean(data.android_simulation_mode);
              desktopSimulationMode = Boolean(data.desktop_simulation_mode);
              allowGuestAccess = Boolean(data.allow_guest);

              updateStoreBadges(androidSimulationMode, desktopSimulationMode, allowGuestAccess);

              const androidLabel = androidSimulationMode ? 'Simulated Purchases' : 'Live Google Play Billing';
              const desktopLabel = desktopSimulationMode ? 'Simulated Checkout' : 'Live PayPal Gateway';
              showStoreAlert(`✔ Database updated successfully!\nAndroid App: [${androidLabel}] | Desktop: [${desktopLabel}]`, true);
          } else {
              showStoreAlert((data && data.message) ? data.message : 'Error updating database settings.', false);
          }
      } catch (err) {
          showStoreAlert('Failed to save settings: ' + err.message, false);
      }
  }

  /* --- PURCHASES LEDGER FILTER, SEARCH & DETAILS --- */

  function setPurchaseFilter(filter) {
      activePurchaseFilter = filter;
      const filterPills = document.querySelectorAll('#purchaseFilterButtons .filter-pill');
      filterPills.forEach(pill => {
          const fnAttr = pill.getAttribute('onclick') || '';
          pill.classList.toggle('active', fnAttr.includes(`'${filter}'`));
      });
      renderStoreLedger();
  }

  function handlePurchaseSearchInput(term) {
      activePurchaseSearchTerm = (term || '').trim().toLowerCase();
      renderStoreLedger();
  }

  function renderStoreLedger() {
      const tbody = document.getElementById('adminStoreLedgerBody');
      const countBadge = document.getElementById('ledgerCountBadge');
      if (!tbody) return;

      if (!allStorePurchases || allStorePurchases.length === 0) {
          tbody.innerHTML = '<tr><td colspan="10" style="padding: 14px; text-align: center; color: var(--text-muted);">No purchases in database ledger yet.</td></tr>';
          if (countBadge) countBadge.textContent = '0 transactions';
          return;
      }

      // Filter by gateway / method
      let filtered = allStorePurchases.filter(p => {
          const method = (p.payment_method || 'PAYPAL').toUpperCase();
          if (activePurchaseFilter === 'ALL') return true;
          if (activePurchaseFilter === 'GOOGLE_PLAY') return method === 'GOOGLE_PLAY';
          if (activePurchaseFilter === 'GOOGLE_PLAY_SIMULATED') return method === 'GOOGLE_PLAY_SIMULATED';
          if (activePurchaseFilter === 'PAYPAL') return method === 'PAYPAL';
          if (activePurchaseFilter === 'PAYPAL_SIMULATED') return method === 'PAYPAL_SIMULATED';
          return true;
      });

      // Filter by search query
      if (activePurchaseSearchTerm) {
          filtered = filtered.filter(p => {
              const email = (p.email || ('user #' + p.user_id)).toLowerCase();
              const orderId = (p.order_id || p.paypal_order_id || '').toLowerCase();
              const productId = (p.product_id || '').toLowerCase();
              const token = (p.purchase_token || '').toLowerCase();
              const id = String(p.id || '');
              return email.includes(activePurchaseSearchTerm) ||
                     orderId.includes(activePurchaseSearchTerm) ||
                     productId.includes(activePurchaseSearchTerm) ||
                     token.includes(activePurchaseSearchTerm) ||
                     id.includes(activePurchaseSearchTerm);
          });
      }

      if (countBadge) {
          countBadge.textContent = `${filtered.length} of ${allStorePurchases.length} transaction${allStorePurchases.length === 1 ? '' : 's'}`;
      }

      if (filtered.length === 0) {
          tbody.innerHTML = '<tr><td colspan="10" style="padding: 14px; text-align: center; color: var(--text-muted);">No transactions match your search or filter criteria.</td></tr>';
          return;
      }

      tbody.innerHTML = '';
      filtered.forEach(p => {
          const tr = document.createElement('tr');
          tr.style.borderBottom = '1px solid rgba(255,255,255,0.06)';

          const method = (p.payment_method || 'PAYPAL').toUpperCase();
          let methodBadgeClass = 'badge-live';
          let methodLabel = method;

          if (method === 'GOOGLE_PLAY') {
              methodBadgeClass = 'badge-gplay';
              methodLabel = 'Google Play (Live)';
          } else if (method === 'GOOGLE_PLAY_SIMULATED') {
              methodBadgeClass = 'badge-sim';
              methodLabel = 'Google Play (Sim)';
          } else if (method === 'PAYPAL') {
              methodBadgeClass = 'badge-paypal';
              methodLabel = 'PayPal (Live)';
          } else if (method === 'PAYPAL_SIMULATED') {
              methodBadgeClass = 'badge-sim';
              methodLabel = 'PayPal (Sim)';
          }

          const orderIdDisplay = p.order_id || p.paypal_order_id || 'N/A';
          const productIdDisplay = p.product_id || ('credits_' + p.credits_added);
          const dateDisplay = p.created_at ? p.created_at.split(' ')[0] : '';

          tr.innerHTML = `
              <td style="padding: 8px 10px;">#${p.id}</td>
              <td style="padding: 8px 10px; max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${p.email || ('User #' + p.user_id)}">${p.email || ('User #' + p.user_id)}</td>
              <td style="padding: 8px 10px;"><span class="badge-status ${methodBadgeClass}">${methodLabel}</span></td>
              <td style="padding: 8px 10px; font-family: monospace; font-size: 0.75rem;">
                  <span title="${orderIdDisplay}">${orderIdDisplay.length > 16 ? orderIdDisplay.substring(0, 16) + '...' : orderIdDisplay}</span>
              </td>
              <td style="padding: 8px 10px; font-family: monospace; font-size: 0.75rem; color: #94a3b8;">${productIdDisplay}</td>
              <td style="padding: 8px 10px; color: var(--gold-primary); font-weight: bold;">+${parseInt(p.credits_added, 10).toLocaleString()}</td>
              <td style="padding: 8px 10px;">$${parseFloat(p.amount_paid || 0).toFixed(2)}</td>
              <td style="padding: 8px 10px;"><span class="badge-status ${p.status === 'COMPLETED' ? 'badge-active' : 'badge-banned'}">${p.status || 'DONE'}</span></td>
              <td style="padding: 8px 10px; color: var(--text-muted); font-size: 0.75rem;">${dateDisplay}</td>
              <td style="padding: 8px 10px; text-align: center;">
                  <button class="btn btn-sm btn-gold" style="padding: 3px 8px; font-size: 0.72rem;" onclick="viewPurchaseDetails(${p.id})">Details</button>
              </td>
          `;
          tbody.appendChild(tr);
      });
  }

  function viewPurchaseDetails(purchaseId) {
      const p = allStorePurchases.find(item => parseInt(item.id, 10) === parseInt(purchaseId, 10));
      if (!p) {
          alert('Purchase record not found.');
          return;
      }

      const modal = document.getElementById('purchaseDetailsModal');
      const content = document.getElementById('purchaseDetailsContent');
      if (!modal || !content) return;

      const method = (p.payment_method || 'PAYPAL').toUpperCase();
      let gatewayTitle = 'PayPal';
      let isSim = false;

      if (method.includes('GOOGLE')) {
          gatewayTitle = 'Google Play In-App Billing';
          isSim = method.includes('SIM');
      } else {
          gatewayTitle = 'PayPal Orders v2';
          isSim = method.includes('SIM');
      }

      const orderId = p.order_id || p.paypal_order_id || 'N/A';
      const productId = p.product_id || ('credits_' + p.credits_added);
      const purchaseToken = p.purchase_token || '';

      content.innerHTML = `
          <div class="purchase-detail-row">
              <span class="purchase-detail-label">Transaction Record ID</span>
              <span class="purchase-detail-val">#${p.id}</span>
          </div>

          <div class="purchase-detail-row">
              <span class="purchase-detail-label">Payment Gateway & Simulation Status</span>
              <div style="display: flex; gap: 8px; align-items: center; margin-top: 2px;">
                  <span class="badge-status ${method.includes('GOOGLE') ? 'badge-gplay' : 'badge-paypal'}">${gatewayTitle}</span>
                  <span class="badge-status ${isSim ? 'badge-sim' : 'badge-live'}">${isSim ? 'Simulated Purchase' : 'Live Gateway'}</span>
                  <span class="badge-status ${p.status === 'COMPLETED' ? 'badge-active' : 'badge-banned'}">${p.status || 'COMPLETED'}</span>
              </div>
          </div>

          <div class="purchase-detail-row">
              <span class="purchase-detail-label">Player Account Information</span>
              <span class="purchase-detail-val">${p.email || ('User #' + p.user_id)} (User ID: #${p.user_id})</span>
          </div>

          <div class="purchase-detail-row">
              <span class="purchase-detail-label">Gateway Order ID / GPA Transaction ID</span>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 2px;">
                  <span class="purchase-detail-val" style="font-family: monospace; font-weight: bold; color: var(--gold-primary);">${orderId}</span>
                  <button class="copy-chip-btn" onclick="copyPurchaseField('${orderId}', this)">Copy Order ID</button>
              </div>
          </div>

          <div class="purchase-detail-row">
              <span class="purchase-detail-label">Product SKU / Package Identifier</span>
              <span class="purchase-detail-val" style="font-family: monospace;">${productId}</span>
          </div>

          <div class="purchase-detail-row">
              <span class="purchase-detail-label">Credits & Payment Amount</span>
              <div style="display: flex; gap: 16px; margin-top: 2px;">
                  <div><strong>Credits Added:</strong> <span style="color: var(--gold-primary); font-weight: bold;">+${parseInt(p.credits_added, 10).toLocaleString()} chips</span></div>
                  <div><strong>Amount Paid:</strong> <span style="color: #fff; font-weight: bold;">$${parseFloat(p.amount_paid || 0).toFixed(2)} USD</span></div>
              </div>
          </div>

          ${p.payer_email || p.payer_id || p.package_name ? `
          <div class="purchase-detail-row">
              <span class="purchase-detail-label">Gateway Payer & Application Metadata</span>
              <div style="display: flex; flex-direction: column; gap: 4px; font-size: 0.82rem; margin-top: 2px;">
                  ${p.payer_email ? `<div><strong>Payer Email:</strong> <span>${p.payer_email}</span></div>` : ''}
                  ${p.payer_id ? `<div><strong>Payer / Account ID:</strong> <span style="font-family: monospace;">${p.payer_id}</span></div>` : ''}
                  ${p.package_name ? `<div><strong>App Package:</strong> <span style="font-family: monospace;">${p.package_name}</span></div>` : ''}
              </div>
          </div>` : ''}

          <div class="purchase-detail-row">
              <span class="purchase-detail-label">Purchase Token / Gateway Authorization Token</span>
              <div style="margin-top: 4px;">
                  <div style="background: rgba(0,0,0,0.5); border: 1px solid #334155; border-radius: 4px; padding: 8px 10px; font-family: monospace; font-size: 0.76rem; color: #cbd5e1; max-height: 90px; overflow-y: auto; word-break: break-all;">
                      ${purchaseToken || '<em style="color:#64748b;">No verification token recorded for this purchase.</em>'}
                  </div>
                  ${purchaseToken ? `
                  <div style="display: flex; justify-content: flex-end; margin-top: 4px;">
                      <button class="copy-chip-btn" onclick="copyPurchaseField('${purchaseToken.replace(/'/g, "\\'")}', this)">Copy Token String</button>
                  </div>` : ''}
              </div>
          </div>

          ${p.raw_response ? `
          <div class="purchase-detail-row">
              <span class="purchase-detail-label">Raw Gateway Verification Data (JSON)</span>
              <div style="margin-top: 4px;">
                  <pre style="background: rgba(0,0,0,0.6); border: 1px solid #334155; border-radius: 4px; padding: 8px 10px; font-family: monospace; font-size: 0.72rem; color: #38bdf8; max-height: 120px; overflow-y: auto; margin: 0; white-space: pre-wrap; word-break: break-all;">${(p.raw_response || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
                  <div style="display: flex; justify-content: flex-end; margin-top: 4px;">
                      <button class="copy-chip-btn" onclick="copyPurchaseField('${p.raw_response.replace(/'/g, "\\'").replace(/\n/g, '\\n')}', this)">Copy Raw JSON</button>
                  </div>
              </div>
          </div>` : ''}

          <div class="purchase-detail-row">
              <span class="purchase-detail-label">Date & Time Recorded</span>
              <span class="purchase-detail-val" style="color: var(--text-muted);">${p.created_at || 'N/A'}</span>
          </div>
      `;

      modal.style.display = 'flex';
  }

  function closePurchaseDetailsModal() {
      const modal = document.getElementById('purchaseDetailsModal');
      if (modal) modal.style.display = 'none';
  }

  function copyPurchaseField(text, btnElement) {
      if (!text || text === 'N/A') return;
      navigator.clipboard.writeText(text).then(() => {
          const orig = btnElement.textContent;
          btnElement.textContent = '✔ Copied!';
          btnElement.style.background = 'var(--success-green)';
          btnElement.style.color = '#000';
          setTimeout(() => {
              btnElement.textContent = orig;
              btnElement.style.background = '';
              btnElement.style.color = '';
          }, 2000);
      }).catch(() => {
          alert('Could not copy to clipboard.');
      });
  }

  // Explicit Global Scope Binding
  global.switchAdminTab = switchAdminTab;
  global.openAdminModal = openAdminModal;
  global.closeAdminModal = closeAdminModal;
  global.saveSegments = saveSegments;
  global.toggleSegmentIds = toggleSegmentIds;
  global.promptAdminPassword = promptAdminPassword;
  global.closeAdminPasswordModal = closeAdminPasswordModal;
  global.submitAdminPassword = submitAdminPassword;
  global.fetchBlackjackUsers = fetchBlackjackUsers;
  global.handleUserSearchInput = handleUserSearchInput;
  global.toggleCreateUserPanel = toggleCreateUserPanel;
  global.executeCreateUser = executeCreateUser;
  global.executeUpdateUser = executeUpdateUser;
  global.executeToggleBanUser = executeToggleBanUser;
  global.executeDeleteUser = executeDeleteUser;
  global.fetchStoreSettings = fetchStoreSettings;
  global.handleStoreToggleChange = handleStoreToggleChange;
  global.saveStoreSettings = saveStoreSettings;
  global.updateStoreBadges = updateStoreBadges;
  global.setPurchaseFilter = setPurchaseFilter;
  global.handlePurchaseSearchInput = handlePurchaseSearchInput;
  global.renderStoreLedger = renderStoreLedger;
  global.viewPurchaseDetails = viewPurchaseDetails;
  global.closePurchaseDetailsModal = closePurchaseDetailsModal;
  global.copyPurchaseField = copyPurchaseField;

  renderRings();
  renderGamesGrid();
  window.addEventListener('DOMContentLoaded', fetchSegments);

})(window);