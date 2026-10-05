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
          const res = await fetch(`${API_BASE}/admin_api.php?action=verify_auth&_t=${Date.now()}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ admin_key: password, admin_password: password })
          });

          const raw = await res.text();
          let data = null;
          try {
              data = JSON.parse(raw);
          } catch(e) {}

          if (res.ok && data && data.success) {
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
      activeAdminTab = tabName;
      const tabBtnSegments = document.getElementById('tabBtnSegments');
      const tabBtnUsers = document.getElementById('tabBtnUsers');
      const contentSegments = document.getElementById('tabContentSegments');
      const contentUsers = document.getElementById('tabContentUsers');

      if (tabName === 'segments') {
          if (tabBtnSegments) tabBtnSegments.classList.add('active');
          if (tabBtnUsers) tabBtnUsers.classList.remove('active');
          if (contentSegments) contentSegments.style.display = 'block';
          if (contentUsers) contentUsers.style.display = 'none';
      } else {
          if (tabBtnUsers) tabBtnUsers.classList.add('active');
          if (tabBtnSegments) tabBtnSegments.classList.remove('active');
          if (contentSegments) contentSegments.style.display = 'none';
          if (contentUsers) contentUsers.style.display = 'block';
          fetchBlackjackUsers();
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

  renderRings();
  renderGamesGrid();
  window.addEventListener('DOMContentLoaded', fetchSegments);

})(window);