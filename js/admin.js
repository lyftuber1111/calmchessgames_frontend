(function (global) {
  "use strict";

  // Dynamic origin detection: When frontend is served on GitHub Pages or static hosts, route API requests to DigitalOcean LAMP server
  const API_BASE = (function () {
    if (typeof window !== 'undefined' && window.location) {
      if (window.CC_API_BASE) return window.CC_API_BASE;
      const host = window.location.hostname;
      if (host === 'api.calmchessgames.com') return window.location.origin;
      if ((host === 'localhost' || host === '127.0.0.1') && (window.location.port === '' || window.location.port === '80' || window.location.port === '443')) {
        return window.location.origin;
      }
    }
    return 'https://api.calmchessgames.com';
  })();
  let centerLogoUrl = 'chess.html';

  // Ensure HTTPS transport encryption immediately
  if (typeof CryptoTransport !== 'undefined' && CryptoTransport.ensureHttps) {
      CryptoTransport.ensureHttps();
  }

  let currentSegments = [
      { ring_type: 'inner', segment_index: 0, title: 'Chess Game', url: 'chess.html', description: 'Offline Stockfish chess engine' },
      { ring_type: 'inner', segment_index: 1, title: 'Chess Tactics', url: 'chess.html', description: 'Interactive chess engine & tactics' },
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
  let sessionAdminJwt = '';
  try { sessionAdminJwt = sessionStorage.getItem('cc_admin_jwt') || ''; } catch(e) {}
  let androidSimulationMode = false;
  let desktopSimulationMode = false;
  let allowGuestAccess = true;
  let geminiCommentaryEnabled = true;
  let geminiConfigured = false;

  let allStorePurchases = [];
  let activePurchaseFilter = 'ALL';
  let activePurchaseSearchTerm = '';

  let allDeletionRequests = [];
  let activeDeletionFilter = 'ALL';
  let activeDeletionSearchTerm = '';

  let allPasswordResets = [];
  let activeResetFilter = 'ALL';
  let activeResetSearchTerm = '';

  function getAdminKey() {
      if (sessionAdminJwt) return sessionAdminJwt;
      try {
          const stored = sessionStorage.getItem('cc_admin_jwt');
          if (stored) {
              sessionAdminJwt = stored;
              return stored;
          }
      } catch(e) {}
      const pwdInput = document.getElementById('adminPassword');
      let key = pwdInput ? pwdInput.value.trim() : '';
      if (!key) {
          const authInput = document.getElementById('adm-pass');
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

  /* --- API CALL HELPER (AUTHENTICATION API TOKEN ENABLED WITH IN-TRANSIT ENCRYPTION) --- */
  async function callAdminApi(action, payload = {}, method = 'POST') {
      const endpoints = [
          `./admin_api.php?action=${action}&_t=${Date.now()}`,
          `admin_api.php?action=${action}&_t=${Date.now()}`,
          `${API_BASE}/admin/admin_api.php?action=${action}&_t=${Date.now()}`,
          `https://api.calmchessgames.com/admin/admin_api.php?action=${action}&_t=${Date.now()}`,
          `${API_BASE}/admin_api.php?action=${action}&_t=${Date.now()}`,
          `https://api.calmchessgames.com/admin_api.php?action=${action}&_t=${Date.now()}`,
          `${API_BASE}/php/admin_api.php?action=${action}&_t=${Date.now()}`,
          `https://api.calmchessgames.com/php/admin_api.php?action=${action}&_t=${Date.now()}`
      ];
      const uniqueEndpoints = [...new Set(endpoints)];

      const adminKey = getAdminKey();
      const requestHeaders = { 'Content-Type': 'application/json' };
      if (adminKey) {
          requestHeaders['Authorization'] = `Bearer ${adminKey}`;
          requestHeaders['X-Admin-Token'] = adminKey;
          requestHeaders['X-API-Key'] = adminKey;
      }

      let requestBody = (payload && typeof payload === 'object' && !Array.isArray(payload))
          ? Object.assign({}, payload)
          : (payload !== null ? payload : {});
      if (typeof requestBody === 'object' && !Array.isArray(requestBody) && adminKey) {
          if (!requestBody.api_token) requestBody.api_token = adminKey;
          if (!requestBody.admin_key) requestBody.admin_key = adminKey;
          if (!requestBody.admin_password) requestBody.admin_password = adminKey;
      }

      let lastError = null;
      for (const url of uniqueEndpoints) {
          try {
              const fetchOptions = {
                  method: method,
                  headers: requestHeaders,
                  credentials: 'include'
              };
              if (requestBody !== null && method !== 'GET') {
                  fetchOptions.body = requestBody;
                  fetchOptions.encrypt = true;
              }
              const fetchFn = (typeof CryptoTransport !== 'undefined' && CryptoTransport.secureFetch) 
                  ? CryptoTransport.secureFetch 
                  : fetch;
              const res = await fetchFn(url, fetchOptions);
              const text = await res.text();
              let parsed = null;
              try {
                  parsed = JSON.parse(text);
              } catch (e) {}

              if (res.ok) {
                  return parsed || { success: true };
              } else if (parsed && typeof parsed === 'object') {
                  return parsed;
              }
          } catch (err) {
              lastError = err;
          }
      }
      return { success: false, message: lastError ? lastError.message : `Failed to call admin API endpoint: ${action}` };
  }

  /* --- AUTHENTICATION IN STANDALONE CONSOLE --- */
  async function authenticateAdmin() {
      const authInput = document.getElementById('adm-pass');
      const authMsg = document.getElementById('auth-msg');
      const submitBtn = document.getElementById('auth-submit-btn');
      const password = authInput ? authInput.value.trim() : '';

      if (!password) {
          if (authMsg) {
              authMsg.textContent = 'Please enter the admin password.';
              authMsg.style.display = 'block';
          }
          if (authInput) authInput.focus();
          return;
      }

      if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Verifying...';
      }
      if (authMsg) authMsg.style.display = 'none';

      try {
          const data = await callAdminApi('verify_auth', { admin_key: password, admin_password: password });
          if (data && data.success) {
              sessionAdminPassword = password;
              if (data.token) {
                  sessionAdminJwt = data.token;
                  try { sessionStorage.setItem('cc_admin_jwt', data.token); } catch(e) {}
              }
              const authCard = document.getElementById('auth-card');
              const dashSection = document.getElementById('dash-section');
              const adminPwdInput = document.getElementById('adminPassword');

              if (authCard) authCard.style.display = 'none';
              if (dashSection) dashSection.style.display = 'block';
              if (adminPwdInput) adminPwdInput.value = password;

              // Ensure search input on Users tab is blank/unpopulated
              const searchInput = document.getElementById('adminUserSearchInput');
              if (searchInput) searchInput.value = '';

              // Initialize all tabs data
              await fetchPublicGuestStats();
              await fetchSegments();
              switchAdminTab('segments');
              fetchStoreSettings();
              fetchBlackjackUsers();
              fetchAccountDeletionRequests();
              fetchPasswordResets();
              fetchAppointments();
          fetchGameWeapons();
          fetchWormholeDevices();
          } else {
              if (authMsg) {
                  authMsg.textContent = (data && data.message) ? data.message : 'Invalid Admin Password. Access Denied.';
                  authMsg.style.display = 'block';
              }
              if (authInput) authInput.focus();
          }
      } catch (err) {
          if (authMsg) {
              authMsg.textContent = 'Authentication error: Could not reach API server to verify credentials.';
              authMsg.style.display = 'block';
          }
      } finally {
          if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = 'Unlock Console';
          }
      }
  }

  function logoutAdmin() {
      sessionAdminPassword = '';
      sessionAdminJwt = '';
      try { sessionStorage.removeItem('cc_admin_jwt'); } catch(e) {}
      const authInput = document.getElementById('adm-pass');
      const adminPwdInput = document.getElementById('adminPassword');
      const authCard = document.getElementById('auth-card');
      const dashSection = document.getElementById('dash-section');

      if (authInput) authInput.value = '';
      if (adminPwdInput) adminPwdInput.value = '';
      if (authCard) authCard.style.display = 'block';
      if (dashSection) dashSection.style.display = 'none';
  }

  /* --- ADMIN TAB SWITCHER --- */
  function switchAdminTab(tabName) {
      const normalized = (tabName || 'segments').toLowerCase().trim();
      let targetTab = 'segments';
      if (normalized === 'store' || normalized === 'billing' || normalized === 'shop' || normalized === 'credit' || normalized === 'purchases') {
          targetTab = 'store';
      } else if (normalized === 'users' || normalized === 'user' || normalized === 'players' || normalized === 'accounts') {
          targetTab = 'users';
      } else if (normalized === 'purge' || normalized === 'purged' || normalized === 'purges' || normalized === 'deletions' || normalized === 'deletion' || normalized === 'delete' || normalized === 'gdpr') {
          targetTab = 'deletions';
      } else if (normalized === 'resets' || normalized === 'reset' || normalized === 'password-reset' || normalized === 'tokens') {
          targetTab = 'resets';
      } else if (normalized === 'appointments' || normalized === 'appointment' || normalized === 'bookings' || normalized === 'consultation' || normalized === 'consultations') {
          targetTab = 'appointments';
      } else if (normalized === 'messages' || normalized === 'message' || normalized === 'contact' || normalized === 'inquiries' || normalized === 'sent' || normalized === 'sent-messages') {
          targetTab = 'messages';
      } else if (normalized === 'manager' || normalized === 'game_manager' || normalized === 'gamemanager' || normalized === 'game-manager' || normalized === 'gamemgr' || normalized === 'game' || normalized === 'weapons' || normalized === 'wormhole_devices' || normalized === 'wormhole' || normalized === 'devices' || normalized === 'xr') {
          targetTab = 'game_manager';
      } else {
          targetTab = 'segments';
      }

      activeAdminTab = targetTab;
      const tabBtnSegments = document.getElementById('tabBtnSegments');
      const tabBtnUsers = document.getElementById('tabBtnUsers');
      const tabBtnStore = document.getElementById('tabBtnStore');
      const tabBtnDeletions = document.getElementById('tabBtnDeletions');
      const tabBtnResets = document.getElementById('tabBtnResets');
      const tabBtnAppointments = document.getElementById('tabBtnAppointments');
      const tabBtnMessages = document.getElementById('tabBtnMessages');
      const tabBtnGameManager = document.getElementById('tabBtnGameManager') || document.getElementById('tabBtnManager') || document.getElementById('tabBtnWormholeDevices');

      const contentSegments = document.getElementById('tabContentSegments');
      const contentUsers = document.getElementById('tabContentUsers');
      const contentStore = document.getElementById('tabContentStore');
      const contentDeletions = document.getElementById('tabContentDeletions');
      const contentResets = document.getElementById('tabContentResets');
      const contentAppointments = document.getElementById('tabContentAppointments');
      const contentMessages = document.getElementById('tabContentMessages');
      const contentGameManager = document.getElementById('tabContentGameManager') || document.getElementById('tabContentManager') || document.getElementById('tabContentWormholeDevices');

      if (tabBtnSegments) tabBtnSegments.classList.toggle('active', targetTab === 'segments');
      if (tabBtnUsers) tabBtnUsers.classList.toggle('active', targetTab === 'users');
      if (tabBtnStore) tabBtnStore.classList.toggle('active', targetTab === 'store');
      if (tabBtnDeletions) tabBtnDeletions.classList.toggle('active', targetTab === 'deletions');
      if (tabBtnResets) tabBtnResets.classList.toggle('active', targetTab === 'resets');
      if (tabBtnAppointments) tabBtnAppointments.classList.toggle('active', targetTab === 'appointments');
      if (tabBtnMessages) tabBtnMessages.classList.toggle('active', targetTab === 'messages');
      if (tabBtnGameManager) tabBtnGameManager.classList.toggle('active', targetTab === 'game_manager');

      if (contentSegments) contentSegments.style.display = (targetTab === 'segments') ? 'block' : 'none';
      if (contentUsers) contentUsers.style.display = (targetTab === 'users') ? 'block' : 'none';
      if (contentStore) contentStore.style.display = (targetTab === 'store') ? 'block' : 'none';
      if (contentDeletions) contentDeletions.style.display = (targetTab === 'deletions') ? 'block' : 'none';
      if (contentResets) contentResets.style.display = (targetTab === 'resets') ? 'block' : 'none';
      if (contentAppointments) contentAppointments.style.display = (targetTab === 'appointments') ? 'block' : 'none';
      if (contentMessages) contentMessages.style.display = (targetTab === 'messages') ? 'block' : 'none';
      if (contentGameManager) contentGameManager.style.display = (targetTab === 'game_manager') ? 'block' : 'none';

      window.scrollTo({ top: 0, behavior: 'smooth' });

      if (targetTab === 'users') {
          const searchInput = document.getElementById('adminUserSearchInput');
          if (searchInput) searchInput.value = '';
          fetchBlackjackUsers();
      } else if (targetTab === 'store') {
          fetchStoreSettings();
      } else if (targetTab === 'deletions') {
          fetchAccountDeletionRequests();
      } else if (targetTab === 'resets') {
          fetchPasswordResets();
      } else if (targetTab === 'appointments') {
          fetchAppointments();
      } else if (targetTab === 'messages') {
          fetchAppointments();
      } else if (targetTab === 'game_manager') {
          if (normalized === 'devices' || normalized === 'device' || normalized === 'wormhole_devices' || normalized === 'wormhole' || normalized === 'device_check' || normalized === 'xr') {
              switchGameManagerSubTab('devices');
          } else if (normalized === 'weapons' || normalized === 'weapon') {
              switchGameManagerSubTab('weapons');
          } else if (normalized === 'enemies' || normalized === 'enemy') {
              switchGameManagerSubTab('enemies');
          } else if (normalized === 'stages' || normalized === 'stage') {
              switchGameManagerSubTab('stages');
          } else {
              switchGameManagerSubTab(activeGameManagerSubTab || 'devices');
          }
          fetchGameStages();
          fetchGameWeapons();
          fetchGameEnemies();
          fetchWormholeDevices();
      }

      try {
          if (typeof window !== 'undefined' && window.location && window.history && window.history.replaceState) {
              window.history.replaceState(null, '', '#' + targetTab);
          }
      } catch (e) {}
  }

  // Immediately bind switchAdminTab to global window scope
  global.switchAdminTab = switchAdminTab;

  /* --- TAB 1: RING NAVIGATION & SEGMENTS --- */
  async function fetchSegments() {
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
              if (data.center_logo_url) {
                  centerLogoUrl = data.center_logo_url;
              } else if (data.data && data.data.center_logo_url) {
                  centerLogoUrl = data.data.center_logo_url;
              }

              const apiSegments = data.segments || (data.data && data.data.segments);
              if (Array.isArray(apiSegments) && apiSegments.length > 0) {
                  const centerSeg = apiSegments.find(s => s.ring_type === 'center');
                  if (centerSeg && centerSeg.url) {
                      centerLogoUrl = centerSeg.url;
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
                  }
              }
          }
      } catch (err) {
          console.warn('Using cached or fallback segments:', err);
      }

      renderSegmentsEditor();
  }

  function renderSegmentsEditor() {
      const centerLogoInput = document.getElementById('adminCenterLogoUrl');
      if (centerLogoInput) {
          centerLogoInput.value = centerLogoUrl || '';
      }

      const listContainer = document.getElementById('adminSegmentsList');
      if (listContainer) {
          listContainer.innerHTML = '';
          const segmentsToEdit = currentSegments.filter(s => s.ring_type !== 'center');
          segmentsToEdit.forEach((seg, index) => {
              const ringLabel = seg.ring_type === 'inner' ? 'Inner Ring' : 'Outer Ring';
              const titleVal = (seg.title || '').replace(/"/g, '&quot;');
              const urlVal = (seg.url || '').replace(/"/g, '&quot;');
              const descVal = (seg.description || '').replace(/"/g, '&quot;');

              listContainer.innerHTML += `
                  <div class="user-card" style="margin-bottom: 14px;">
                      <h4 style="color: var(--gold-primary); margin-bottom: 8px; font-size: 0.95rem;">
                          ${ringLabel} â€” Segment #${seg.segment_index}
                      </h4>
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
  }

  function updateRingLinksWithParam(show) {
      const headerLink = document.getElementById('linkMainRingsHeader');
      const tabLink = document.getElementById('linkMainRingsTab');
      const targetUrl = show ? 'https://calmchessgames.com/index.html?show_segment_ids=1' : 'https://calmchessgames.com/index.html';
      if (headerLink) headerLink.href = targetUrl;
      if (tabLink) tabLink.href = targetUrl;
  }

  function toggleSegmentIds(checked) {
      try {
          if (checked) {
              localStorage.setItem('calmchess_temp_show_segment_ids', '1');
              sessionStorage.setItem('calmchess_temp_show_segment_ids', '1');
          } else {
              localStorage.removeItem('calmchess_temp_show_segment_ids');
              sessionStorage.removeItem('calmchess_temp_show_segment_ids');
          }
      } catch (e) {}
      updateRingLinksWithParam(checked);
  }

  async function saveSegments() {
      const password = getAdminKey();

      if (!password) {
          alert('Admin password is required to save changes.');
          return;
      }

      const centerLogoInput = document.getElementById('adminCenterLogoUrl');
      const updatedCenterLogoUrl = centerLogoInput ? centerLogoInput.value.trim() : centerLogoUrl;

      if (!updatedCenterLogoUrl) {
          alert('Center knight logo URL is required to save ring configurations. Ring segments URL and text can be left blank.');
          if (centerLogoInput) {
              centerLogoInput.focus();
              centerLogoInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          return;
      }

      const masterShowIds = document.getElementById('masterShowIds');
      const shouldShowIds = masterShowIds ? masterShowIds.checked : false;
      try {
          if (shouldShowIds) {
              localStorage.setItem('calmchess_temp_show_segment_ids', '1');
              sessionStorage.setItem('calmchess_temp_show_segment_ids', '1');
          } else {
              localStorage.removeItem('calmchess_temp_show_segment_ids');
              sessionStorage.removeItem('calmchess_temp_show_segment_ids');
          }
      } catch(e) {}
      updateRingLinksWithParam(shouldShowIds);

      const nonCenterSegments = currentSegments.filter(s => s.ring_type !== 'center');
      const updatedSegments = nonCenterSegments.map((seg, index) => {
          const titleEl = document.getElementById(`admin_title_${index}`);
          const urlEl = document.getElementById(`admin_url_${index}`);
          const descEl = document.getElementById(`admin_desc_${index}`);

          return {
              ring_type: seg.ring_type,
              segment_index: seg.segment_index,
              title: titleEl ? titleEl.value.trim() : (seg.title || ''),
              url: urlEl ? urlEl.value.trim() : (seg.url || ''),
              description: descEl ? descEl.value.trim() : (seg.description || ''),
              is_active: seg.is_active !== undefined ? seg.is_active : 1
          };
      });

      const savePayload = {
          password: password,
          admin_key: password,
          admin_password: password,
          api_token: password,
          segments: [
              ...updatedSegments,
              {
                  ring_type: 'center',
                  segment_index: 0,
                  title: 'Calm Chess Knight Logo',
                  url: updatedCenterLogoUrl,
                  description: 'Center Logo Redirect URL',
                  is_active: 1
              }
          ],
          center_logo_url: updatedCenterLogoUrl
      };

      try {
          const candidateSaveUrls = [
              `${API_BASE}/update_segments.php`,
              './update_segments.php',
              '/update_segments.php',
              'https://api.calmchessgames.com/update_segments.php'
          ];
          const uniqueSaveUrls = [...new Set(candidateSaveUrls)];

          let saved = false;
          let lastErrMsg = '';

          for (const saveUrl of uniqueSaveUrls) {
              try {
                  const fetchFn = (typeof CryptoTransport !== 'undefined' && CryptoTransport.secureFetch)
                      ? CryptoTransport.secureFetch
                      : fetch;
                  const res = await fetchFn(saveUrl, {
                      method: 'POST',
                      headers: { 
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${password}`,
                          'X-Admin-Token': password,
                          'X-API-Key': password
                      },
                      credentials: 'include',
                      body: savePayload,
                      encrypt: true
                  });
                  const data = await res.json();
                  if (data && data.success) {
                      saved = true;
                      break;
                  } else if (data && data.message) {
                      lastErrMsg = data.message;
                  }
              } catch (e) {
                  lastErrMsg = e.message;
              }
          }

          if (saved) {
              currentSegments = updatedSegments;
              centerLogoUrl = updatedCenterLogoUrl;
              if (shouldShowIds) {
                  try {
                      localStorage.setItem('calmchess_temp_show_segment_ids', '1');
                      sessionStorage.setItem('calmchess_temp_show_segment_ids', '1');
                  } catch(e) {}
                  updateRingLinksWithParam(true);
              }
              alert('âœ” Ring settings saved successfully to MySQL database!');
          } else {
              alert('Save failed: ' + (lastErrMsg || 'Please verify admin password.'));
          }
      } catch (err) {
          alert('Network error saving segments: ' + err.message);
      }
  }

  function updateGuestLoginsDisplay(data) {
      if (!data) return;
      const total = data.guest_logins_total !== undefined ? Number(data.guest_logins_total) : (data.total_guest_logins !== undefined ? Number(data.total_guest_logins) : null);
      const today = data.guest_logins_today !== undefined ? Number(data.guest_logins_today) : null;
      const active = data.guest_active_24h !== undefined ? Number(data.guest_active_24h) : null;
      const dbCount = data.guest_db_count !== undefined ? Number(data.guest_db_count) : null;

      if (total !== null) {
          const elHeader = document.getElementById('adminGuestLoginCount');
          if (elHeader) elHeader.textContent = total.toLocaleString();
          const elTotal = document.getElementById('adminGuestTotalText');
          if (elTotal) elTotal.textContent = total.toLocaleString();
          const elStat = document.getElementById('adminGuestStatDisplay');
          if (elStat) elStat.textContent = total.toLocaleString();
          document.querySelectorAll('.guest-total-val').forEach(el => { el.textContent = total.toLocaleString(); });
      }
      if (today !== null) {
          const elToday = document.getElementById('adminGuestTodayText');
          if (elToday) elToday.textContent = today.toLocaleString();
          const elStatToday = document.getElementById('adminGuestStatTodayDisplay');
          if (elStatToday) elStatToday.textContent = today.toLocaleString();
          document.querySelectorAll('.guest-today-val').forEach(el => { el.textContent = today.toLocaleString(); });
      }
      if (active !== null) {
          const elActive = document.getElementById('adminGuestActiveText');
          if (elActive) elActive.textContent = active.toLocaleString();
          const elStatActive = document.getElementById('adminGuestStatActiveDisplay');
          if (elStatActive) elStatActive.textContent = active.toLocaleString();
          document.querySelectorAll('.guest-active-val').forEach(el => { el.textContent = active.toLocaleString(); });
      }
      if (dbCount !== null) {
          const elDb = document.getElementById('adminGuestDbText');
          if (elDb) elDb.textContent = dbCount.toLocaleString();
          document.querySelectorAll('.guest-db-val').forEach(el => { el.textContent = dbCount.toLocaleString(); });
      }
  }

  async function fetchPublicGuestStats() {
      try {
          const data = await callAdminApi('get_mode', null, 'GET');
          if (data && data.success) {
              updateGuestLoginsDisplay(data);
          }
      } catch (e) {}
  }

  async function resetGuestLoginCount() {
      if (!confirm('Are you sure you want to reset the running guest login count to zero?')) {
          return;
      }

      const resetBtns = [
          document.getElementById('btnResetGuestCountBanner'),
          document.getElementById('btnResetGuestCountStore')
      ].filter(Boolean);

      resetBtns.forEach(btn => {
          btn.disabled = true;
          btn.innerHTML = '<span>â³</span> Resetting...';
      });

      try {
          const res = await callAdminApi('reset_guest_logins', {}, 'POST');
          if (res && res.success) {
              updateGuestLoginsDisplay({
                  guest_logins_total: 0,
                  guest_logins_today: 0,
                  guest_active_24h: 0,
                  guest_db_count: 0
              });
              alert('âœ” ' + (res.message || 'Guest login counts have been reset to zero!'));
              if (typeof fetchBlackjackUsers === 'function') {
                  fetchBlackjackUsers();
              }
              if (typeof fetchStoreSettings === 'function') {
                  fetchStoreSettings();
              }
          } else {
              alert('Failed to reset guest login count: ' + (res && res.message ? res.message : 'Unknown error'));
          }
      } catch (err) {
          alert('Error resetting guest login count: ' + (err.message || err));
      } finally {
          resetBtns.forEach(btn => {
              btn.disabled = false;
              btn.innerHTML = '<span>ðŸ”„</span> Reset Guest Count';
          });
      }
  }

  /* --- TAB 2: USER MANAGEMENT --- */
  async function fetchBlackjackUsers() {
      const container = document.getElementById('adminUsersList');
      const adminKey = getAdminKey();

      if (!adminKey) {
          if (container) {
              container.innerHTML = `
                  <div style="text-align: center; padding: 24px;">
                      <p style="color: var(--error-red); margin-bottom: 12px; font-weight: 600;">Admin password is missing or session expired.</p>
                  </div>
              `;
          }
          return;
      }

      if (container) {
          container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem; text-align: center; padding: 20px;">Fetching users from database...</p>';
      }

      try {
          const data = await callAdminApi('get_users', { 
              admin_key: adminKey,
              admin_password: adminKey 
          });

          if (data && data.success && Array.isArray(data.users)) {
              allBlackjackUsers = data.users;
              updateGuestLoginsDisplay(data);
              const delReqs = Array.isArray(data.deletion_requests) ? data.deletion_requests : (Array.isArray(data.requests) ? data.requests : null);
              if (delReqs) {
                  allDeletionRequests = delReqs;
                  updateDeletionBadge((data.pending_deletion_count !== undefined) ? data.pending_deletion_count : data.pending_count);
              }
              if (Array.isArray(data.password_resets)) {
                  allPasswordResets = data.password_resets;
                  updateResetBadges(data.pending_reset_count || 0);
              }
              const searchVal = document.getElementById('adminUserSearchInput') ? document.getElementById('adminUserSearchInput').value : '';
              renderBlackjackUsers(searchVal);
          } else {
              if (container) {
                  container.innerHTML = `
                      <div style="text-align: center; padding: 24px;">
                          <p style="color: var(--error-red); margin-bottom: 12px;">${(data && data.message) || 'Unauthorized access'}</p>
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

  let activeUserFilter = 'ALL';

  function setUserFilter(filter) {
      activeUserFilter = (filter || 'ALL').toUpperCase();
      ['All', 'Active', 'Banned', 'Guests', 'Reset'].forEach(f => {
          const btn = document.getElementById('userFilter' + f);
          if (btn) {
              if (f.toUpperCase() === activeUserFilter) {
                  btn.classList.add('active');
                  if (f === 'Reset') {
                      btn.style.background = 'rgba(243, 156, 18, 0.25)';
                      btn.style.color = '#fed7aa';
                      btn.style.borderColor = '#f39c12';
                  } else if (f === 'Guests') {
                      btn.style.background = 'rgba(52, 152, 219, 0.25)';
                      btn.style.color = '#93c5fd';
                      btn.style.borderColor = '#3498db';
                  } else {
                      btn.style.background = 'rgba(255, 215, 0, 0.2)';
                      btn.style.color = 'var(--gold-primary)';
                      btn.style.borderColor = 'var(--gold-primary)';
                  }
              } else {
                  btn.classList.remove('active');
                  btn.style.background = 'rgba(0, 0, 0, 0.35)';
                  if (f === 'Reset') {
                      btn.style.color = '#fed7aa';
                      btn.style.borderColor = '#f39c12';
                  } else if (f === 'Guests') {
                      btn.style.color = '#93c5fd';
                      btn.style.borderColor = '#3498db';
                  } else {
                      btn.style.color = 'var(--text-muted)';
                      btn.style.borderColor = '#334155';
                  }
              }
          }
      });
      const searchVal = document.getElementById('adminUserSearchInput') ? document.getElementById('adminUserSearchInput').value : '';
      renderBlackjackUsers(searchVal);
  }

  function handleUserSearchInput(term) {
      renderBlackjackUsers(term);
  }

  function isUserPurgeRequested(user) {
      if (!user) return false;
      const uIdent = (user.email || user.username || '').toLowerCase();
      return (parseInt(user.deletion_requested, 10) === 1) || allDeletionRequests.some(r => 
          (r.status || '').toUpperCase() === 'PENDING' && 
          (String(r.user_id) === String(user.id) || (r.identifier && r.identifier.toLowerCase() === uIdent))
      );
  }

  function renderBlackjackUsers(filterTerm = '') {
      const container = document.getElementById('adminUsersList');
      if (!container) return;

      const term = (filterTerm || '').toLowerCase().trim();

      // Separate out users requesting account deletion / purge:
      // Excluded from the Users tab and managed exclusively in the dedicated Purge tab.
      const regularUsers = allBlackjackUsers.filter(u => !isUserPurgeRequested(u));

      // Calculate real-time counts for status filter pills
      let countAll = regularUsers.length;
      let countActive = 0;
      let countBanned = 0;
      let countGuests = 0;
      let countReset = 0;

      regularUsers.forEach(u => {
          const uIdent = (u.email || u.username || '').toLowerCase();
          const hasReset = (parseInt(u.reset_requested, 10) === 1) || allPasswordResets.some(r => 
              (r.status || '').toUpperCase() === 'PENDING' && 
              (String(r.user_id) === String(u.id) || (r.identifier && r.identifier.toLowerCase() === uIdent))
          );
          const isRawInactive = parseInt(u.is_active, 10) === 0 || parseInt(u.is_banned, 10) === 1;
          const isGuest = parseInt(u.is_guest, 10) === 1 || uIdent.startsWith('guest_') || (u.username && u.username.toLowerCase().startsWith('guest_'));

          if (isGuest) countGuests++;
          if (hasReset) countReset++;
          if (isRawInactive) {
              countBanned++;
          } else {
              countActive++;
          }
      });

      const elCountAll = document.getElementById('userCountAll');
      const elCountActive = document.getElementById('userCountActive');
      const elCountBanned = document.getElementById('userCountBanned');
      const elCountGuests = document.getElementById('userCountGuests');
      const elCountReset = document.getElementById('userCountReset');
      if (elCountAll) elCountAll.textContent = countAll;
      if (elCountActive) elCountActive.textContent = countActive;
      if (elCountBanned) elCountBanned.textContent = countBanned;
      if (elCountGuests) elCountGuests.textContent = countGuests;
      if (elCountReset) elCountReset.textContent = countReset;

      const filtered = regularUsers.filter(u => {
          const email = (u.email || u.username || '').toLowerCase();
          const id = String(u.id || '');
          const matchesSearch = !term || email.includes(term) || id.includes(term);
          if (!matchesSearch) return false;

          const hasReset = (parseInt(u.reset_requested, 10) === 1) || allPasswordResets.some(r => 
              (r.status || '').toUpperCase() === 'PENDING' && 
              (String(r.user_id) === String(u.id) || (r.identifier && r.identifier.toLowerCase() === email))
          );
          const isRawInactive = parseInt(u.is_active, 10) === 0 || parseInt(u.is_banned, 10) === 1;
          const isGuest = parseInt(u.is_guest, 10) === 1 || email.startsWith('guest_') || (u.username && u.username.toLowerCase().startsWith('guest_'));

          if (activeUserFilter === 'RESET') return hasReset;
          if (activeUserFilter === 'BANNED') return isRawInactive;
          if (activeUserFilter === 'ACTIVE') return !isRawInactive;
          if (activeUserFilter === 'GUESTS') return isGuest;
          return true; // 'ALL'
      });

      if (filtered.length === 0) {
          container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 24px;">No matching users found.</p>';
          return;
      }

      container.innerHTML = '';
      filtered.forEach(user => {
          const userIdent = (user.email || user.username || '').toLowerCase();
          const matchingReset = allPasswordResets.find(r => 
              (r.status || '').toUpperCase() === 'PENDING' && 
              (String(r.user_id) === String(user.id) || (r.identifier && r.identifier.toLowerCase() === userIdent))
          );
          const hasPendingReset = (parseInt(user.reset_requested, 10) === 1) || Boolean(matchingReset);
          const resetExp = user.reset_expires_at || (matchingReset ? matchingReset.expires_at : '');

          const isRawInactive = parseInt(user.is_active, 10) === 0 || parseInt(user.is_banned, 10) === 1;
          const isBanned = isRawInactive;
          const isGuestUser = parseInt(user.is_guest, 10) === 1 || userIdent.startsWith('guest_') || (user.username && user.username.toLowerCase().startsWith('guest_'));

          const card = document.createElement('div');
          card.className = `user-card ${isBanned ? 'banned' : ''}`;
          card.id = `user_card_${user.id}`;

          let statusBadgeHtml = '';
          let banToggleHtml = '';
          let deleteBtnHtml = '';

          const guestBadgeHtml = isGuestUser ? `
              <span class="badge-status" style="background: rgba(52, 152, 219, 0.2); border: 1px solid #3498db; color: #93c5fd; font-weight: 700; padding: 2px 7px; border-radius: 4px; font-size: 0.72rem;" title="Guest account">
                  ðŸ‘¤ GUEST
              </span>
          ` : '';

          const resetBadgeHtml = hasPendingReset ? `
              <span class="badge-status badge-reset" style="background: rgba(243, 156, 18, 0.2); border: 1px solid #f39c12; color: #f39c12; font-weight: 700; padding: 2px 7px; border-radius: 4px; font-size: 0.72rem;" title="User has requested a password reset. Token active.">
                  ðŸ”‘ RESET REQUESTED
              </span>
          ` : '';

          if (isBanned) {
              statusBadgeHtml = `<span class="badge-status badge-banned">Banned</span>`;
              banToggleHtml = `
                  <button class="btn btn-sm btn-success" onclick="executeToggleBanUser(${user.id}, 1)">
                      Unban User
                  </button>
              `;
              deleteBtnHtml = `
                  <button class="btn btn-sm btn-danger" onclick="executeDeleteUser(${user.id}, '${escapeHtml(user.email || user.username)}')" title="Administrative user deletion (7-yr statutory financial audit retention)">
                      Delete User
                  </button>
              `;
          } else {
              statusBadgeHtml = `<span class="badge-status badge-active">Active</span>`;
              banToggleHtml = `
                  <button class="btn btn-sm btn-warn" onclick="executeToggleBanUser(${user.id}, 0)">
                      Ban User
                  </button>
              `;
              deleteBtnHtml = `
                  <button class="btn btn-sm btn-danger" onclick="executeDeleteUser(${user.id}, '${escapeHtml(user.email || user.username)}')" title="Administrative user deletion (7-yr statutory financial audit retention)">
                      Delete User
                  </button>
              `;
          }

          const resetTokenId = user.reset_request_id || (matchingReset ? matchingReset.id : 0);

          card.innerHTML = `
              <div class="user-card-head">
                  <div style="font-weight: 700; color: var(--gold-primary); font-size: 0.95rem;">
                      #${user.id} â€” <span id="user_display_${user.id}">${escapeHtml(user.email || user.username)}</span>
                  </div>
                  <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                      ${guestBadgeHtml}
                      ${resetBadgeHtml}
                      ${statusBadgeHtml}
                      <span style="font-size: 0.72rem; color: var(--text-muted);">${user.created_at ? user.created_at.split(' ')[0] : ''}</span>
                  </div>
              </div>

              ${hasPendingReset ? `
              <div style="margin: 4px 0 6px 0; padding: 7px 11px; background: rgba(243, 156, 18, 0.12); border-left: 3px solid #f39c12; border-radius: 4px; font-size: 0.78rem; color: #fed7aa; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
                  <div>
                      <strong>ðŸ”‘ Password Reset Request Pending:</strong> Active token expires at <em>${escapeHtml(resetExp || '1 hour')}</em>.
                  </div>
                  <div style="display: flex; gap: 6px;">
                      <button type="button" class="btn btn-sm" style="background: #f39c12; color: #1a1000; font-weight: 700; padding: 2px 8px; font-size: 0.72rem;" onclick="copyUserResetLink('${escapeHtml(user.email || user.username)}', ${resetTokenId || 0})">
                          ðŸ“‹ Copy Reset URL
                      </button>
                  </div>
              </div>
              ` : ''}

              <div class="user-card-inputs">
                  <div>
                      <label>Username / Email</label>
                      <input type="text" id="usr_email_${user.id}" value="${escapeHtml(user.email || user.username || '')}">
                  </div>
                  <div>
                      <label>Bankroll ($)</label>
                      <div style="display: flex; gap: 4px; align-items: center;">
                          <input type="number" id="usr_bank_${user.id}" value="${parseFloat(user.bank || 0)}" min="0" step="5" style="flex: 1;">
                          <button type="button" class="btn btn-sm" style="padding: 2px 6px; font-size: 0.7rem; background: #334155; min-height: 28px;" title="Add $100 chips" onclick="quickAddBankroll(${user.id}, 100)">+100</button>
                          <button type="button" class="btn btn-sm" style="padding: 2px 6px; font-size: 0.7rem; background: #334155; min-height: 28px;" title="Add $500 chips" onclick="quickAddBankroll(${user.id}, 500)">+500</button>
                          <button type="button" class="btn btn-sm" style="padding: 2px 6px; font-size: 0.7rem; background: #334155; min-height: 28px;" title="Add $1000 chips" onclick="quickAddBankroll(${user.id}, 1000)">+1000</button>
                      </div>
                  </div>
                  <div>
                      <label>Reset Password (blank to keep)</label>
                      <input type="password" id="usr_pwd_${user.id}" placeholder="New password">
                  </div>
              </div>

              <div class="user-card-actions">
                  <button class="btn btn-sm btn-gold" onclick="executeUpdateUser(${user.id})" title="Update password and account settings">Update Password &amp; Profile</button>
                  ${banToggleHtml}
                  ${deleteBtnHtml}
              </div>
          `;
          container.appendChild(card);
      });
  }

  function quickAddBankroll(userId, amount) {
      const input = document.getElementById(`usr_bank_${userId}`);
      if (input) {
          const current = parseFloat(input.value) || 0;
          input.value = Math.max(0, current + amount);
      }
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
          const data = await callAdminApi('create_user', {
              admin_key: adminKey,
              admin_password: adminKey,
              email: email,
              password: password,
              bank: bank,
              is_active: isActive
          });

          if (data && data.success) {
              showUserAdminAlert(`âœ” User ${email} created successfully with $${bank} bankroll!`, true);
              document.getElementById('new_user_email').value = '';
              document.getElementById('new_user_pwd').value = '';
              document.getElementById('new_user_bank').value = '500';
              toggleCreateUserPanel(false);
              fetchBlackjackUsers();
          } else {
              showUserAdminAlert(data.message || 'Failed to create user.', false);
          }
      } catch (err) {
          showUserAdminAlert('Connection error: ' + err.message, false);
      }
  }

  async function executeUpdateUser(userId) {
      const adminKey = getAdminKey();
      const email = document.getElementById(`usr_email_${userId}`).value.trim();
      const bank = parseFloat(document.getElementById(`usr_bank_${userId}`).value) || 0;
      const pwd = document.getElementById(`usr_pwd_${userId}`).value;

      try {
          const payload = {
              admin_key: adminKey,
              admin_password: adminKey,
              user_id: userId,
              email: email,
              bank: bank
          };
          if (pwd.trim()) {
              payload.password = pwd.trim();
          }

          const data = await callAdminApi('update_user', payload);
          if (data && data.success) {
              showUserAdminAlert(`âœ” User #${userId} (${email}) updated successfully!`, true);
              document.getElementById(`usr_pwd_${userId}`).value = '';
              fetchBlackjackUsers();
          } else {
              showUserAdminAlert(data.message || 'Update failed.', false);
          }
      } catch (err) {
          showUserAdminAlert('Connection error: ' + err.message, false);
      }
  }

  async function executeToggleBanUser(userId, currentBannedState) {
      const adminKey = getAdminKey();
      const shouldBan = currentBannedState === 0;

      try {
          const data = await callAdminApi('toggle_ban', {
              admin_key: adminKey,
              admin_password: adminKey,
              user_id: userId,
              is_banned: shouldBan ? 1 : 0
          });

          if (data && data.success) {
              showUserAdminAlert(`âœ” User #${userId} is now ${shouldBan ? 'BANNED' : 'ACTIVE'}.`, true);
              fetchBlackjackUsers();
          } else {
              showUserAdminAlert(data.message || 'Action failed.', false);
          }
      } catch (err) {
          showUserAdminAlert('Connection error: ' + err.message, false);
      }
  }

  async function executePurgeUser(userId, userEmail, requestId = 0) {
      const confirmMsg = `CONFIRM PERMANENT USER PURGE (Google Play & Privacy Request):\n\n` +
          `User #${userId} (${userEmail}) has submitted an explicit account and data deletion request.\n\n` +
          `Executing this action will:\n` +
          `1. Permanently delete all credentials, passwords, and user records from database.\n` +
          `2. Mark any pending deletion request in the privacy ledger as COMPLETED.\n` +
          `3. Pseudonymize and detach all purchase records for 7-year statutory financial compliance.\n` +
          `4. Write an immutable administrative audit record.\n\n` +
          `Are you sure you want to permanently PURGE this user?`;

      if (!confirm(confirmMsg)) {
          return;
      }

      const adminKey = getAdminKey();
      try {
          // If a request ID is attached, approve the deletion request
          if (requestId && Number(requestId) > 0) {
              await callAdminApi('process_deletion_request', {
                  admin_key: adminKey,
                  admin_password: adminKey,
                  request_id: requestId,
                  decision: 'APPROVE'
              });
          }

          // Permanently delete user credentials and pseudonymize purchases
          const data = await callAdminApi('delete_user', {
              admin_key: adminKey,
              admin_password: adminKey,
              user_id: userId
          });

          if (data && data.success) {
              showUserAdminAlert(`âœ” User #${userId} (${userEmail}) permanently PURGED. Financial ledger pseudonymized for 7-year audit retention.`, true);
              fetchBlackjackUsers();
              fetchAccountDeletionRequests();
          } else {
              showUserAdminAlert((data && data.message) || 'Purge failed.', false);
          }
      } catch (err) {
          showUserAdminAlert('Purge connection error: ' + err.message, false);
      }
  }

  async function executeDeleteUser(userId, userEmail) {
      if (!confirm(`ADMINISTRATIVE USER DELETION:\n\nAre you sure you want to delete user #${userId} (${userEmail})?\n\nPersonal credentials, password hashes, and profile balances will be permanently removed.\nFinancial transaction records in the purchases ledger will be pseudonymized and retained for 7 years in compliance with statutory audit regulations.\n\nThis action cannot be undone.`)) {
          return;
      }

      const adminKey = getAdminKey();
      try {
          const data = await callAdminApi('delete_user', {
              admin_key: adminKey,
              admin_password: adminKey,
              user_id: userId
          });

          if (data && data.success) {
              showUserAdminAlert(`âœ” User #${userId} deleted. Financial records pseudonymized for 7-year audit retention.`, true);
              fetchBlackjackUsers();
              fetchAccountDeletionRequests();
          } else {
              showUserAdminAlert(data.message || 'Failed to delete user.', false);
          }
      } catch (err) {
          showUserAdminAlert('Connection error: ' + err.message, false);
      }
  }

  function toggleCreateUserPanel(forceState = null) {
      const panel = document.getElementById('createUserPanel');
      if (!panel) return;
      if (forceState !== null) {
          panel.style.display = forceState ? 'block' : 'none';
      } else {
          panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
      }
  }

  function showUserAdminAlert(msg, isSuccess = true) {
      const alertBox = document.getElementById('userAdminAlert');
      if (!alertBox) return;
      alertBox.style.display = 'block';
      alertBox.style.background = isSuccess ? 'rgba(46, 204, 113, 0.15)' : 'rgba(239, 68, 68, 0.15)';
      alertBox.style.color = isSuccess ? 'var(--success-green)' : 'var(--error-red)';
      alertBox.style.border = `1px solid ${isSuccess ? 'var(--success-green)' : 'var(--error-red)'}`;
      alertBox.textContent = msg;
      setTimeout(() => { if (alertBox) alertBox.style.display = 'none'; }, 5000);
  }

  /* --- TAB 3: STORE & BILLING SETTINGS --- */
  async function fetchStoreSettings() {
      const adminKey = getAdminKey();
      const alertBox = document.getElementById('storeSettingsAlert');
      if (alertBox) alertBox.style.display = 'none';

      try {
          const data = await callAdminApi('get_dashboard_data', { admin_key: adminKey, admin_password: adminKey });
          if (data && data.success) {
              updateGuestLoginsDisplay(data);
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
              if (data.gemini_commentary_enabled !== undefined) {
                  geminiCommentaryEnabled = Boolean(data.gemini_commentary_enabled);
              }
              if (data.gemini_configured !== undefined) {
                  geminiConfigured = Boolean(data.gemini_configured);
              }

              const androidToggle = document.getElementById('adminAndroidSimToggle');
              const desktopToggle = document.getElementById('adminDesktopSimToggle');
              const guestToggle = document.getElementById('adminGuestToggle');
              const geminiToggle = document.getElementById('adminGeminiToggle');

              if (androidToggle) androidToggle.checked = androidSimulationMode;
              if (desktopToggle) desktopToggle.checked = desktopSimulationMode;
              if (guestToggle) guestToggle.checked = allowGuestAccess;
              if (geminiToggle) geminiToggle.checked = geminiCommentaryEnabled;

              updateStoreBadges(androidSimulationMode, desktopSimulationMode, allowGuestAccess, geminiCommentaryEnabled, geminiConfigured);

              if (data.admin_allowed_ip !== undefined) {
                  const ipInput = document.getElementById('adminAllowedIpInput');
                  if (ipInput) ipInput.value = data.admin_allowed_ip;
                  const ipBadge = document.getElementById('adminIpBadge');
                  if (ipBadge) ipBadge.textContent = data.admin_allowed_ip === '*' ? 'Public (*)' : data.admin_allowed_ip;
              }
              if (data.client_ip) {
                  const detectedDisplay = document.getElementById('detectedClientIpDisplay');
                  if (detectedDisplay) detectedDisplay.textContent = data.client_ip;
                  window._detectedAdminClientIp = data.client_ip;
              }

              if (Array.isArray(data.purchases)) {
                  allStorePurchases = data.purchases;
                  renderStoreLedger();
              }

              const delReqs = Array.isArray(data.deletion_requests) ? data.deletion_requests : (Array.isArray(data.requests) ? data.requests : null);
              if (delReqs) {
                  allDeletionRequests = delReqs;
                  updateDeletionBadge((data.pending_deletion_count !== undefined) ? data.pending_deletion_count : data.pending_count);
                  renderDeletionRequestsTable();
              }
          } else {
              showStoreAlert((data && data.message) ? data.message : 'Failed to load store settings from database.', false);
          }
      } catch (err) {
          console.warn('Could not load dashboard data, trying get_mode:', err);
          try {
              const data = await callAdminApi('get_mode', null, 'GET');
              if (data && data.success) {
                  updateGuestLoginsDisplay(data);
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
                  if (data.gemini_commentary_enabled !== undefined) {
                      geminiCommentaryEnabled = Boolean(data.gemini_commentary_enabled);
                  }
                  if (data.gemini_configured !== undefined) {
                      geminiConfigured = Boolean(data.gemini_configured);
                  }

                  const androidToggle = document.getElementById('adminAndroidSimToggle');
                  const desktopToggle = document.getElementById('adminDesktopSimToggle');
                  const guestToggle = document.getElementById('adminGuestToggle');
                  const geminiToggle = document.getElementById('adminGeminiToggle');

                  if (androidToggle) androidToggle.checked = androidSimulationMode;
                  if (desktopToggle) desktopToggle.checked = desktopSimulationMode;
                  if (guestToggle) guestToggle.checked = allowGuestAccess;
                  if (geminiToggle) geminiToggle.checked = geminiCommentaryEnabled;

                  updateStoreBadges(androidSimulationMode, desktopSimulationMode, allowGuestAccess, geminiCommentaryEnabled, geminiConfigured);

                  if (data.admin_allowed_ip !== undefined) {
                      const ipInput = document.getElementById('adminAllowedIpInput');
                      if (ipInput) ipInput.value = data.admin_allowed_ip;
                      const ipBadge = document.getElementById('adminIpBadge');
                      if (ipBadge) ipBadge.textContent = data.admin_allowed_ip === '*' ? 'Public (*)' : data.admin_allowed_ip;
                  }
                  if (data.client_ip) {
                      const detectedDisplay = document.getElementById('detectedClientIpDisplay');
                      if (detectedDisplay) detectedDisplay.textContent = data.client_ip;
                      window._detectedAdminClientIp = data.client_ip;
                  }
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
      const geminiToggle = document.getElementById('adminGeminiToggle');

      const isAndroidSim = androidToggle ? androidToggle.checked : false;
      const isDesktopSim = desktopToggle ? desktopToggle.checked : false;
      const isGuest = guestToggle ? guestToggle.checked : true;
      const isGemini = geminiToggle ? geminiToggle.checked : true;

      updateStoreBadges(isAndroidSim, isDesktopSim, isGuest, isGemini, geminiConfigured);
  }

  function updateStoreBadges(isAndroidSim, isDesktopSim, isGuest, isGemini = true, isGeminiConfigured = false) {
      const androidBadge = document.getElementById('androidSimBadge');
      const androidExplanation = document.getElementById('androidModeExplanation');
      const androidCheckLabel = document.getElementById('androidCheckMarkLabel');
      if (androidBadge) {
          androidBadge.className = `badge-status ${isAndroidSim ? 'badge-sim' : 'badge-live'}`;
          androidBadge.textContent = isAndroidSim ? 'Simulated Credit Purchases' : 'Live: Google Play Billing';
      }
      if (androidCheckLabel) {
          androidCheckLabel.textContent = isAndroidSim ? '[âœ”] Simulated Active' : '[  ] Live Google Play';
          androidCheckLabel.style.color = isAndroidSim ? 'var(--success-green)' : 'var(--gold-primary)';
      }
      if (androidExplanation) {
          androidExplanation.innerHTML = isAndroidSim 
              ? 'Simulated Mode Active â€” Android in-app credit purchases use <strong>Instant Free Refills</strong> (<code>android_simulation_mode = 1</code>).'
              : 'Live Billing Active â€” Android in-app purchases use official <strong>Google Play In-App Billing</strong> (<code>android_simulation_mode = 0</code>).';
      }

      const desktopBadge = document.getElementById('desktopSimBadge');
      const desktopExplanation = document.getElementById('desktopModeExplanation');
      const desktopCheckLabel = document.getElementById('desktopCheckMarkLabel');
      if (desktopBadge) {
          desktopBadge.className = `badge-status ${isDesktopSim ? 'badge-sim' : 'badge-live'}`;
          desktopBadge.textContent = isDesktopSim ? 'Simulated Checkout Active' : 'Live: PayPal Gateway';
      }
      if (desktopCheckLabel) {
          desktopCheckLabel.textContent = isDesktopSim ? '[âœ”] Simulated Active' : '[  ] Live PayPal';
          desktopCheckLabel.style.color = isDesktopSim ? 'var(--success-green)' : 'var(--gold-primary)';
      }
      if (desktopExplanation) {
          desktopExplanation.innerHTML = isDesktopSim
              ? 'Simulated Mode Active â€” Desktop players receive instant simulated credits without charging PayPal (<code>desktop_simulation_mode = 1</code>).'
              : 'Live Billing Active â€” Desktop players purchase chips through <strong>PayPal Orders v2</strong> (<code>desktop_simulation_mode = 0</code>).';
      }

      const guestBadge = document.getElementById('guestAccessBadge');
      const guestExplanation = document.getElementById('guestModeExplanation');
      const guestCheckLabel = document.getElementById('guestCheckMarkLabel');
      if (guestBadge) {
          guestBadge.className = `badge-status ${isGuest ? 'badge-active' : 'badge-banned'}`;
          guestBadge.textContent = isGuest ? 'Guest Allowed' : 'Registration Required';
      }
      if (guestCheckLabel) {
          guestCheckLabel.textContent = isGuest ? '[âœ”] Allowed' : '[  ] Disabled';
          guestCheckLabel.style.color = isGuest ? 'var(--success-green)' : 'var(--error-red)';
      }
      if (guestExplanation) {
          guestExplanation.textContent = isGuest
              ? 'Guest play is enabled. Players can enter tables immediately without logging in.'
              : 'Guest play is disabled. Players must sign in with a registered account.';
      }

      const geminiBadge = document.getElementById('geminiModelBadge');
      const geminiCheckLabel = document.getElementById('geminiCheckMarkLabel');
      const geminiExplanation = document.getElementById('geminiModeExplanation');
      const geminiKeyBadge = document.getElementById('geminiKeyStatusBadge');

      if (geminiBadge) {
          geminiBadge.className = `badge-status ${isGemini ? 'badge-active' : 'badge-banned'}`;
          geminiBadge.textContent = isGemini ? 'gemini-3.8-flash (Active)' : 'Gemini AI (Disabled)';
      }
      if (geminiCheckLabel) {
          geminiCheckLabel.textContent = isGemini ? '[âœ”] Active' : '[  ] Disabled';
          geminiCheckLabel.style.color = isGemini ? '#93c5fd' : 'var(--text-muted)';
      }
      if (geminiExplanation) {
          geminiExplanation.innerHTML = isGemini
              ? (isGeminiConfigured
                  ? 'Gemini 3.8 Flash live strategic commentary and probabilities active via Google GenAI Interactions API.'
                  : 'Gemini 3.8 Flash commentary active with built-in mathematical strategic engine fallback.')
              : 'Gemini AI commentary and strategy advice are disabled.';
      }
      if (geminiKeyBadge) {
          if (isGeminiConfigured) {
              geminiKeyBadge.className = 'badge-status badge-active';
              geminiKeyBadge.textContent = 'API Key Configured';
              geminiKeyBadge.style.background = 'rgba(46, 204, 113, 0.2)';
              geminiKeyBadge.style.color = '#55efc4';
          } else {
              geminiKeyBadge.className = 'badge-status badge-sim';
              geminiKeyBadge.textContent = 'Unconfigured (Simulation Fallback)';
              geminiKeyBadge.style.background = 'rgba(245, 158, 11, 0.2)';
              geminiKeyBadge.style.color = '#fbbf24';
          }
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
          return;
      }

      const androidToggle = document.getElementById('adminAndroidSimToggle');
      const desktopToggle = document.getElementById('adminDesktopSimToggle');
      const guestToggle = document.getElementById('adminGuestToggle');
      const geminiToggle = document.getElementById('adminGeminiToggle');
      const geminiApiKeyInput = document.getElementById('adminGeminiApiKeyInput');

      const isAndroidSim = androidToggle ? androidToggle.checked : false;
      const isDesktopSim = desktopToggle ? desktopToggle.checked : false;
      const isGuest = guestToggle ? guestToggle.checked : true;
      const isGemini = geminiToggle ? geminiToggle.checked : true;
      const newApiKey = geminiApiKeyInput ? geminiApiKeyInput.value.trim() : '';

      const ipInput = document.getElementById('adminAllowedIpInput');
      const newAllowedIp = ipInput ? ipInput.value.trim() : '';

      showStoreAlert('Saving settings to MySQL database...', true);

      try {
          const payload = {
              admin_key: adminKey,
              admin_password: adminKey,
              android_simulation_mode: isAndroidSim ? 1 : 0,
              desktop_simulation_mode: isDesktopSim ? 1 : 0,
              simulation_mode: isDesktopSim ? 1 : 0,
              allow_guest: isGuest ? 1 : 0,
              gemini_commentary_enabled: isGemini ? 1 : 0
          };
          if (newApiKey) {
              payload.gemini_api_key = newApiKey;
          }
          if (newAllowedIp) {
              payload.admin_allowed_ip = newAllowedIp;
          }

          const data = await callAdminApi('set_mode', payload);

          if (data && data.success) {
              androidSimulationMode = isAndroidSim;
              desktopSimulationMode = isDesktopSim;
              allowGuestAccess = isGuest;
              geminiCommentaryEnabled = isGemini;
              if (data.gemini_configured !== undefined) {
                  geminiConfigured = Boolean(data.gemini_configured);
              } else if (newApiKey) {
                  geminiConfigured = true;
              }
              if (geminiApiKeyInput && newApiKey) {
                  geminiApiKeyInput.value = '';
              }
              if (data.admin_allowed_ip !== undefined) {
                  const ipBadge = document.getElementById('adminIpBadge');
                  if (ipBadge) ipBadge.textContent = data.admin_allowed_ip === '*' ? 'Public (*)' : data.admin_allowed_ip;
              }
              updateStoreBadges(isAndroidSim, isDesktopSim, isGuest, isGemini, geminiConfigured);

              const androidLabel = isAndroidSim ? 'SIMULATED' : 'LIVE (Google Play)';
              const desktopLabel = isDesktopSim ? 'SIMULATED' : 'LIVE (PayPal)';
              const geminiLabel = isGemini ? 'ACTIVE (gemini-3.8-flash)' : 'DISABLED';
              showStoreAlert(`âœ” Database updated successfully!\nAndroid: [${androidLabel}] | Desktop: [${desktopLabel}] | Gemini AI: [${geminiLabel}]`, true);
          } else {
              showStoreAlert((data && data.message) ? data.message : 'Error updating database settings.', false);
          }
      } catch (err) {
          showStoreAlert('Failed to save settings: ' + err.message, false);
      }
  }

  function useCurrentDetectedIp() {
      const ipInput = document.getElementById('adminAllowedIpInput');
      const detectedDisplay = document.getElementById('detectedClientIpDisplay');
      let clientIp = window._detectedAdminClientIp || (detectedDisplay ? detectedDisplay.textContent.trim() : '');
      if (clientIp && clientIp !== 'Detecting...' && ipInput) {
          ipInput.value = clientIp;
          showStoreAlert(`Copied detected IP [${clientIp}] into Authorized IP field. Click "Save Allowed IP" to apply.`, true);
          return;
      }
      fetch('https://api.ipify.org?format=json')
          .then(r => r.json())
          .then(d => {
              if (d && d.ip && ipInput) {
                  ipInput.value = d.ip;
                  if (detectedDisplay) detectedDisplay.textContent = d.ip;
                  window._detectedAdminClientIp = d.ip;
                  showStoreAlert(`Detected IP [${d.ip}] copied into field. Click "Save Allowed IP" to apply.`, true);
              }
          })
          .catch(() => alert('Could not detect public IP automatically. Please type your IP address manually.'));
  }

  async function saveAdminAllowedIp() {
      const adminKey = getAdminKey();
      if (!adminKey) {
          alert('Admin password required. Please re-authenticate.');
          return;
      }
      const ipInput = document.getElementById('adminAllowedIpInput');
      const newIp = ipInput ? ipInput.value.trim() : '';
      if (!newIp) {
          alert('Please enter an authorized IP address or "*" to permit all IPs.');
          return;
      }

      if (!confirm(`Are you sure you want to restrict Admin Console access to:\n${newIp}\n\nAll requests from other IP addresses will receive 403 Forbidden.`)) {
          return;
      }

      showStoreAlert('Updating admin IP whitelist in database...', true);
      try {
          const data = await callAdminApi('update_allowed_ip', {
              admin_key: adminKey,
              admin_password: adminKey,
              admin_allowed_ip: newIp,
              allowed_ip: newIp
          });
          if (data && data.success) {
              showStoreAlert(`âœ” Admin access restricted to: ${newIp}`, true);
              const badge = document.getElementById('adminIpBadge');
              if (badge) badge.textContent = newIp === '*' ? 'Public (*)' : newIp;
          } else {
              showStoreAlert((data && data.message) ? data.message : 'Error updating allowed IP.', false);
          }
      } catch (err) {
          showStoreAlert('Failed to update allowed IP: ' + err.message, false);
      }
  }

  function setPurchaseFilter(filter) {
      activePurchaseFilter = filter;
      const buttons = document.querySelectorAll('#purchaseFilterButtons .filter-pill');
      buttons.forEach(btn => {
          btn.classList.toggle('active', btn.getAttribute('onclick').includes(filter));
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

      let filtered = allStorePurchases.filter(p => {
          const method = (p.payment_method || 'PAYPAL').toUpperCase();
          const isGuestPurchase = p.is_guest == 1 || (p.email && p.email.toLowerCase().includes('guest')) || (p.payer_email && p.payer_email.toLowerCase().includes('guest'));
          if (activePurchaseFilter === 'ALL') return true;
          if (activePurchaseFilter === 'GUEST') return isGuestPurchase;
          if (activePurchaseFilter === 'GOOGLE_PLAY') return method === 'GOOGLE_PLAY';
          if (activePurchaseFilter === 'GOOGLE_PLAY_SIMULATED') return method === 'GOOGLE_PLAY_SIMULATED';
          if (activePurchaseFilter === 'PAYPAL') return method === 'PAYPAL';
          if (activePurchaseFilter === 'PAYPAL_SIMULATED') return method === 'PAYPAL_SIMULATED';
          return true;
      });

      if (activePurchaseSearchTerm) {
          filtered = filtered.filter(p => {
              const email = (p.email || ('user #' + p.user_id)).toLowerCase();
              const orderId = (p.order_id || p.paypal_order_id || '').toLowerCase();
              const productId = (p.product_id || '').toLowerCase();
              const token = (p.purchase_token || '').toLowerCase();
              const report = (p.purchase_report || '').toLowerCase();
              const id = String(p.id || '');
              return email.includes(activePurchaseSearchTerm) ||
                     orderId.includes(activePurchaseSearchTerm) ||
                     productId.includes(activePurchaseSearchTerm) ||
                     token.includes(activePurchaseSearchTerm) ||
                     report.includes(activePurchaseSearchTerm) ||
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

          const isGuestPurchase = p.is_guest == 1 || (p.email && p.email.toLowerCase().includes('guest')) || (p.payer_email && p.payer_email.toLowerCase().includes('guest'));
          const isDeletedUser = (!p.user_id || p.user_id === 0 || p.email === '[Deleted User - 7-Yr Retained]' || String(p.email).includes('Deleted User') || p.email === 'User #null') && !isGuestPurchase;
          const isRetainedGuest = (!p.user_id || p.user_id === 0 || String(p.email).includes('Retained')) && isGuestPurchase;

          let userDisplayHtml = '';
          if (isRetainedGuest) {
              userDisplayHtml = `<span class="badge-status" style="background: rgba(6, 182, 212, 0.18); border: 1px solid #06b6d4; color: #a5f3fc; font-size: 0.72rem; letter-spacing: 0.4px;" title="Statutory 7-year audit retention for expired or purged guest player session">[Guest - 7-Yr Retained]</span>`;
          } else if (isDeletedUser) {
              userDisplayHtml = `<span class="badge-status badge-banned" style="font-size: 0.72rem; letter-spacing: 0.5px;" title="Statutory 7-year audit retention for purged registered user">[Deleted User - 7-Yr Retained]</span>`;
          } else if (isGuestPurchase) {
              const userEmailText = escapeHtml(p.email || p.payer_email || ('Guest #' + (p.user_id || '')));
              userDisplayHtml = `<div style="display: flex; align-items: center; gap: 6px;"><span class="badge-status" style="background: rgba(6, 182, 212, 0.2); border: 1px solid #06b6d4; color: #67e8f9; font-size: 0.68rem; padding: 1px 5px; flex-shrink: 0;">GUEST</span><div class="field-scroll-cell" title="${userEmailText}">${userEmailText}</div></div>`;
          } else {
              const userEmailText = escapeHtml(p.email || ('User #' + p.user_id));
              userDisplayHtml = `<div class="field-scroll-cell" title="${userEmailText}">${userEmailText}</div>`;
          }

          tr.innerHTML = `
              <td style="padding: 10px 12px; font-weight: 600;">#${p.id}</td>
              <td style="padding: 10px 12px; min-width: 220px;">
                  ${userDisplayHtml}
              </td>
              <td style="padding: 10px 12px; text-align: center; white-space: nowrap;"><span class="badge-status badge-gateway ${methodBadgeClass}">${methodLabel}</span></td>
              <td style="padding: 10px 12px;">
                  <div class="field-scroll-cell" style="font-family: monospace; font-size: 0.75rem;" title="${orderIdDisplay}">${orderIdDisplay}</div>
              </td>
              <td style="padding: 10px 12px;">
                  <div class="field-scroll-cell" style="font-family: monospace; font-size: 0.75rem; color: #94a3b8;" title="${productIdDisplay}">${productIdDisplay}</div>
              </td>
              <td style="padding: 10px 12px; color: var(--gold-primary); font-weight: bold; white-space: nowrap;">+${parseInt(p.credits_added, 10).toLocaleString()}</td>
              <td style="padding: 10px 12px; font-weight: 600; white-space: nowrap;">$${parseFloat(p.amount_paid || 0).toFixed(2)}</td>
              <td style="padding: 10px 12px; text-align: center; white-space: nowrap;"><span class="badge-status ${p.status === 'COMPLETED' ? 'badge-active' : 'badge-banned'}" style="min-width: 90px;">${p.status || 'COMPLETED'}</span></td>
              <td style="padding: 10px 12px; color: var(--text-muted); font-size: 0.78rem; white-space: nowrap;">${dateDisplay}</td>
              <td style="padding: 10px 12px; text-align: center; white-space: nowrap;">
                  <button class="btn btn-sm btn-gold" style="padding: 4px 10px; font-size: 0.75rem;" onclick="viewPurchaseDetails(${p.id})">Details</button>
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

      const isGuestPurchase = p.is_guest == 1 || (p.email && p.email.toLowerCase().includes('guest')) || (p.payer_email && p.payer_email.toLowerCase().includes('guest'));
      const isDeletedUser = (!p.user_id || p.user_id === 0 || p.email === '[Deleted User - 7-Yr Retained]' || String(p.email).includes('Deleted User') || p.email === 'User #null') && !isGuestPurchase;
      const isRetainedGuest = (!p.user_id || p.user_id === 0 || String(p.email).includes('Retained')) && isGuestPurchase;

      let playerInfoDisplay = '';
      if (isRetainedGuest) {
          playerInfoDisplay = `<span class="badge-status" style="background: rgba(6, 182, 212, 0.2); border-color: #06b6d4; color: #a5f3fc; font-size: 0.75rem;">[Guest Player - 7-Yr Retained]</span> <span style="color: var(--text-muted); font-size: 0.8rem; margin-left: 6px;">(Guest player session expired or reset; transaction strictly retained for 7-year statutory audit compliance)</span>`;
      } else if (isDeletedUser) {
          playerInfoDisplay = `<span class="badge-status badge-banned" style="font-size: 0.75rem;">[Deleted User - 7-Yr Retained]</span> <span style="color: var(--text-muted); font-size: 0.8rem; margin-left: 6px;">(Account & credentials purged per GDPR/Play compliance; transaction retained for 7-year audit)</span>`;
      } else if (isGuestPurchase) {
          playerInfoDisplay = `<span class="badge-status" style="background: rgba(6, 182, 212, 0.2); border-color: #06b6d4; color: #67e8f9; font-size: 0.75rem; margin-right: 6px;">Guest Player</span> ${escapeHtml(p.email || p.payer_email || ('Guest #' + (p.user_id || '')))} (User ID: #${p.user_id || 'N/A'})`;
      } else {
          playerInfoDisplay = `${escapeHtml(p.email || ('User #' + p.user_id))} (User ID: #${p.user_id})`;
      }

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
              <span class="purchase-detail-val">${playerInfoDisplay}</span>
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
                      ${purchaseToken || '<em style="color:#64748b;">No token recorded</em>'}
                  </div>
                  ${purchaseToken ? `<div style="margin-top: 4px; text-align: right;"><button class="copy-chip-btn" onclick="copyPurchaseField('${purchaseToken}', this)">Copy Token</button></div>` : ''}
              </div>
          </div>

          <div class="purchase-detail-row">
              <span class="purchase-detail-label">Transaction Timestamp</span>
              <span class="purchase-detail-val">${p.created_at || 'N/A'}</span>
          </div>

          ${p.purchase_report ? `
          <div class="purchase-detail-row">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span class="purchase-detail-label" style="color: #34d399; font-weight: 600;">Financial Purchase Report (Verified Audit Payload)</span>
                  <button class="copy-chip-btn" id="btnCopyReportJson" onclick="copyPurchaseField(decodeURIComponent('${encodeURIComponent(p.purchase_report)}'), this)">Copy Purchase Report</button>
              </div>
              <div style="margin-top: 4px;">
                  <pre style="background: rgba(0,0,0,0.6); border: 1px solid rgba(16,185,129,0.4); border-radius: 4px; padding: 8px 10px; font-family: monospace; font-size: 0.72rem; color: #6ee7b7; max-height: 140px; overflow-y: auto; white-space: pre-wrap; word-break: break-all;">${(()=>{
                      try {
                          return JSON.stringify(JSON.parse(p.purchase_report), null, 2);
                      } catch(e) {
                          return p.purchase_report;
                      }
                  })()}</pre>
              </div>
          </div>` : ''}

          ${p.raw_response ? `
          <div class="purchase-detail-row">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span class="purchase-detail-label">Raw Gateway Verification Response</span>
                  <button class="copy-chip-btn" id="btnCopyRawJson" onclick="copyPurchaseField(decodeURIComponent('${encodeURIComponent(p.raw_response)}'), this)">Copy Raw JSON</button>
              </div>
              <div style="margin-top: 4px;">
                  <pre style="background: rgba(0,0,0,0.6); border: 1px solid #334155; border-radius: 4px; padding: 8px 10px; font-family: monospace; font-size: 0.72rem; color: #38bdf8; max-height: 140px; overflow-y: auto; white-space: pre-wrap; word-break: break-all;">${(()=>{
                      try {
                          return JSON.stringify(JSON.parse(p.raw_response), null, 2);
                      } catch(e) {
                          return p.raw_response;
                      }
                  })()}</pre>
              </div>
          </div>` : ''}
      `;

      modal.style.display = 'flex';
  }

  function closePurchaseDetailsModal() {
      const modal = document.getElementById('purchaseDetailsModal');
      if (modal) modal.style.display = 'none';
  }

  function copyPurchaseField(text, btnElement) {
      if (!text) return;
      navigator.clipboard.writeText(text).then(() => {
          const orig = btnElement.textContent;
          btnElement.textContent = 'Copied! âœ”';
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

  /* --- TAB 4: ACCOUNT DELETION REQUESTS (Google Play & Privacy Compliance) --- */
  function escapeHtml(str) {
      if (!str) return '';
      return String(str)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
  }

  function updateDeletionBadge(pendingCount) {
      if (pendingCount === undefined || pendingCount === null) {
          pendingCount = allDeletionRequests.filter(r => (r.status || '').toUpperCase() === 'PENDING').length;
      }
      const badge = document.getElementById('delBadge');
      if (badge) {
          badge.textContent = pendingCount;
          badge.style.display = (pendingCount > 0) ? 'inline-block' : 'none';
      }
      const pendingEl = document.getElementById('delPendingCount');
      if (pendingEl) pendingEl.textContent = pendingCount;

      let completed = 0;
      let total = allDeletionRequests.length;
      allDeletionRequests.forEach(r => {
          if ((r.status || '').toUpperCase() === 'COMPLETED') completed++;
      });
      const completedEl = document.getElementById('delCompletedCount');
      if (completedEl) completedEl.textContent = completed;
      const totalEl = document.getElementById('delTotalCount');
      if (totalEl) totalEl.textContent = total;
  }

  async function fetchAccountDeletionRequests() {
      const tbody = document.getElementById('adminDeletionsBody');
      if (tbody) {
          tbody.innerHTML = '<tr><td colspan="8" style="padding: 16px; text-align: center; color: var(--text-muted);">Fetching account deletion requests from database...</td></tr>';
      }

      const res = await callAdminApi('get_deletion_requests');
      if (res && res.success) {
          const requests = (res.data && Array.isArray(res.data.requests))
              ? res.data.requests
              : (res.data && Array.isArray(res.data.deletion_requests))
              ? res.data.deletion_requests
              : (Array.isArray(res.requests))
              ? res.requests
              : (Array.isArray(res.deletion_requests))
              ? res.deletion_requests
              : (Array.isArray(res.data))
              ? res.data
              : [];

          allDeletionRequests = requests;

          const pendingCount = (res.pending_count !== undefined)
              ? res.pending_count
              : (res.pending_deletion_count !== undefined)
              ? res.pending_deletion_count
              : (res.data && res.data.pending_count !== undefined)
              ? res.data.pending_count
              : (res.data && res.data.pending_deletion_count !== undefined)
              ? res.data.pending_deletion_count
              : allDeletionRequests.filter(r => (r.status || '').toUpperCase() === 'PENDING').length;

          updateDeletionBadge(pendingCount);
          renderDeletionRequestsTable();
      } else {
          if (tbody) {
              tbody.innerHTML = `<tr><td colspan="8" style="padding: 16px; text-align: center; color: #ff6b6b;">Failed to load requests: ${res && res.message ? res.message : 'Unauthorized or database error'}</td></tr>`;
          }
      }
  }

  function setDeletionFilter(filter) {
      activeDeletionFilter = (filter || 'ALL').toUpperCase();
      ['All', 'Pending', 'Completed', 'Cancelled'].forEach(f => {
          const btn = document.getElementById('delFilter' + f);
          if (btn) {
              if (f.toUpperCase() === activeDeletionFilter) {
                  btn.style.background = 'var(--gold-primary)';
                  btn.style.color = '#000';
                  btn.style.fontWeight = '700';
              } else {
                  btn.style.background = '#334155';
                  btn.style.color = '#fff';
                  btn.style.fontWeight = 'normal';
              }
          }
      });
      renderDeletionRequestsTable();
  }

  function filterDeletionRequests() {
      const input = document.getElementById('delSearchInput');
      activeDeletionSearchTerm = input ? input.value.trim().toLowerCase() : '';
      renderDeletionRequestsTable();
  }

  function renderDeletionRequestsTable() {
      const tbody = document.getElementById('adminDeletionsBody');
      if (!tbody) return;

      let filtered = allDeletionRequests.filter(r => {
          if (activeDeletionFilter !== 'ALL' && (r.status || '').toUpperCase() !== activeDeletionFilter) {
              return false;
          }
          if (activeDeletionSearchTerm) {
              const str = `${r.id} ${r.identifier} ${r.reason || ''} ${r.ip_address || ''} ${r.status || ''}`.toLowerCase();
              if (!str.includes(activeDeletionSearchTerm)) return false;
          }
          return true;
      });

      if (filtered.length === 0) {
          tbody.innerHTML = '<tr><td colspan="8" style="padding: 16px; text-align: center; color: var(--text-muted);">No account deletion requests found matching the current criteria.</td></tr>';
          return;
      }

      let html = '';
      filtered.forEach(r => {
          const isPending = (r.status || '').toUpperCase() === 'PENDING';
          const isCompleted = (r.status || '').toUpperCase() === 'COMPLETED';

          let statusBadge = '';
          if (isPending) {
              statusBadge = '<span style="background: rgba(241,196,15,0.18); color: #f1c40f; border: 1px solid rgba(241,196,15,0.5); padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 0.78rem;">PENDING</span>';
          } else if (isCompleted) {
              statusBadge = '<span style="background: rgba(46,204,113,0.18); color: #2ecc71; border: 1px solid rgba(46,204,113,0.5); padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 0.78rem;">COMPLETED</span>';
          } else {
              statusBadge = '<span style="background: rgba(148,163,184,0.18); color: #94a3b8; border: 1px solid rgba(148,163,184,0.5); padding: 2px 8px; border-radius: 4px; font-size: 0.78rem;">CANCELLED</span>';
          }

          let actionButtons = '';
          if (isPending) {
              actionButtons = `
                  <button class="btn btn-sm btn-danger" style="font-weight: 800; padding: 5px 14px; margin-right: 4px;" onclick="processDeletionRequest(${r.id}, 'purge')" title="Permanently purge user personal data (retains 7-yr financial ledger)">Purge</button>
                  <button class="btn btn-sm" style="background: #475569; color: #fff; padding: 5px 8px;" onclick="processDeletionRequest(${r.id}, 'cancel')" title="Cancel this request">Dismiss</button>
              `;
          } else if (isCompleted) {
              actionButtons = '<span style="color: #2ecc71; font-size: 0.82rem; font-weight: bold;">âœ“ Purged (7-Yr Financial Ledger Preserved)</span>';
          } else {
              actionButtons = '<span style="color: #94a3b8; font-size: 0.82rem;">Dismissed</span>';
          }

          const submittedDate = r.created_at ? r.created_at.replace('T', ' ').substring(0, 19) : 'â€”';

          html += `
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
                  <td style="padding: 10px 12px; font-weight: bold; color: var(--gold-primary);">${r.id}</td>
                  <td style="padding: 10px 12px; font-weight: 600; color: #fff;">${escapeHtml(r.identifier || 'â€”')}</td>
                  <td style="padding: 10px 12px; color: var(--text-muted); font-size: 0.82rem;">${submittedDate}</td>
                  <td style="padding: 10px 12px;">${statusBadge}</td>
                  <td style="padding: 10px 12px; color: var(--text-muted); font-size: 0.85rem;" title="${escapeHtml(r.reason || '')}">${escapeHtml(r.reason || 'â€”')}</td>
                  <td style="padding: 10px 12px; font-size: 0.78rem; color: #fca5a5;">Credentials, Passwords, Bankroll</td>
                  <td style="padding: 10px 12px; font-size: 0.78rem; color: #fcd34d; font-weight: 600;">7-Yr Purchases Ledger</td>
                  <td style="padding: 10px 12px; text-align: center;">${actionButtons}</td>
              </tr>
          `;
      });

      tbody.innerHTML = html;
  }

  async function processDeletionRequest(requestId, subaction) {
      if (subaction === 'purge') {
          const ok = confirm("PERMANENT USER DATA PURGE:\n\nAre you sure you want to permanently purge this user's account, personal profile, and login credentials?\n\nFinancial transaction records will remain archived in the purchases ledger for 7-year statutory audit compliance.\n\nThis action cannot be undone.");
          if (!ok) return;
      }

      const res = await callAdminApi('process_deletion_request', { request_id: requestId, subaction: subaction });
      if (res && res.success) {
          alert(res.message || 'Deletion request processed successfully.');
          fetchAccountDeletionRequests();
          if (typeof fetchBlackjackUsers === 'function') {
              fetchBlackjackUsers();
          }
      } else {
          alert('Error processing request: ' + (res && res.message ? res.message : 'Unknown error'));
      }
  }

  async function purgeAllPendingAccounts() {
      const ok = confirm("BULK PERMANENT ACCOUNT PURGE:\n\nAre you sure you want to permanently purge ALL pending player accounts in the purge queue?\n\nThis permanently erases all login credentials, password hashes, profiles, and active bankrolls from the database.\n\nFinancial transaction records are pseudonymized and preserved for 7-year statutory audit compliance.\n\nThis action cannot be undone.");
      if (!ok) return;

      const res = await callAdminApi('purge_all_pending', {});
      if (res && res.success) {
          alert(res.message || 'All pending accounts have been permanently purged.');
          fetchAccountDeletionRequests();
          if (typeof fetchBlackjackUsers === 'function') {
              fetchBlackjackUsers();
          }
      } else {
          alert('Error during bulk purge: ' + (res && res.message ? res.message : 'Unknown error'));
      }
  }

  async function quickPurgeAccount() {
      const input = document.getElementById('quickPurgeIdentifier');
      const identifier = input ? input.value.trim() : '';
      if (!identifier) {
          alert('Please enter an account email or username to purge.');
          if (input) input.focus();
          return;
      }

      const ok = confirm(`PERMANENT USER DATA PURGE:\n\nAre you sure you want to permanently purge user '${identifier}'?\n\nAll personal credentials, password hashes, and active balances will be permanently destroyed.\nFinancial transaction records are pseudonymized and preserved for 7-year statutory audit compliance.\n\nThis action cannot be undone.`);
      if (!ok) return;

      const res = await callAdminApi('quick_purge_account', { identifier: identifier });
      if (res && res.success) {
          alert(res.message || `Account '${identifier}' permanently purged.`);
          if (input) input.value = '';
          fetchAccountDeletionRequests();
          if (typeof fetchBlackjackUsers === 'function') {
              fetchBlackjackUsers();
          }
      } else {
          alert('Error purging account: ' + (res && res.message ? res.message : 'Unknown error'));
      }
  }

  /* --- TAB 5: PASSWORD RESET MANAGEMENT --- */
  async function fetchPasswordResets() {
      const adminKey = getAdminKey();
      try {
          const data = await callAdminApi('get_password_resets', {
              admin_key: adminKey,
              admin_password: adminKey
          });

          if (data && data.success && Array.isArray(data.resets)) {
              allPasswordResets = data.resets;
              updateResetBadges(data.pending_count || 0);
              renderPasswordResets();
              // Also refresh user cards if loaded to reflect latest reset tokens
              const searchVal = document.getElementById('adminUserSearchInput') ? document.getElementById('adminUserSearchInput').value : '';
              if (allBlackjackUsers.length > 0) {
                  renderBlackjackUsers(searchVal);
              }
          }
      } catch (err) {
          console.error('Error fetching password resets:', err);
      }
  }

  function updateResetBadges(pendingCount) {
      const topBadge = document.getElementById('adminPendingResetNotificationBadge');
      const topCount = document.getElementById('adminPendingResetCount');
      const tabBadge = document.getElementById('resetBadge');

      const count = (typeof pendingCount === 'number') ? pendingCount : allPasswordResets.filter(r => (r.status || '').toUpperCase() === 'PENDING').length;

      if (topCount) topCount.textContent = count;
      if (topBadge) {
          topBadge.style.display = count > 0 ? 'inline-flex' : 'none';
      }
      if (tabBadge) {
          tabBadge.textContent = count;
          tabBadge.style.display = count > 0 ? 'inline-block' : 'none';
      }

      const pCountEl = document.getElementById('resetPendingCountDisplay');
      const uCountEl = document.getElementById('resetUsedCountDisplay');
      const tCountEl = document.getElementById('resetTotalCountDisplay');

      if (pCountEl) pCountEl.textContent = count;
      if (uCountEl) uCountEl.textContent = allPasswordResets.filter(r => (r.status || '').toUpperCase() === 'USED').length;
      if (tCountEl) tCountEl.textContent = allPasswordResets.length;

      const userPillCount = document.getElementById('userCountReset');
      if (userPillCount) userPillCount.textContent = count;
  }

  function setResetFilter(filter) {
      activeResetFilter = (filter || 'ALL').toUpperCase();
      ['All', 'Pending', 'Used', 'Expired', 'Cancelled'].forEach(f => {
          const btn = document.getElementById('resetFilter' + f);
          if (btn) {
              if (f.toUpperCase() === activeResetFilter) {
                  btn.style.background = 'var(--gold-primary)';
                  btn.style.color = '#000';
              } else {
                  btn.style.background = '#334155';
                  btn.style.color = '#fff';
              }
          }
      });
      renderPasswordResets();
  }

  function filterPasswordResets() {
      const input = document.getElementById('resetSearchInput');
      activeResetSearchTerm = input ? input.value.trim().toLowerCase() : '';
      renderPasswordResets();
  }

  function renderPasswordResets() {
      const tbody = document.getElementById('adminResetsBody');
      if (!tbody) return;

      const filtered = allPasswordResets.filter(r => {
          const matchesStatus = (activeResetFilter === 'ALL') || ((r.status || '').toUpperCase() === activeResetFilter);
          if (!matchesStatus) return false;

          if (!activeResetSearchTerm) return true;
          const ident = (r.identifier || '').toLowerCase();
          const ip = (r.ip_address || '').toLowerCase();
          const id = String(r.id || '');
          return ident.includes(activeResetSearchTerm) || ip.includes(activeResetSearchTerm) || id.includes(activeResetSearchTerm);
      });

      if (filtered.length === 0) {
          tbody.innerHTML = '<tr><td colspan="8" style="padding: 24px; text-align: center; color: var(--text-muted);">No password reset requests match current filter.</td></tr>';
          return;
      }

      let html = '';
      filtered.forEach(r => {
          const status = (r.status || 'PENDING').toUpperCase();
          let statusBadge = '';
          if (status === 'PENDING') {
              statusBadge = '<span style="background: rgba(243, 156, 18, 0.2); border: 1px solid #f39c12; color: #f39c12; border-radius: 4px; padding: 2px 7px; font-weight: 700; font-size: 0.76rem;">PENDING</span>';
          } else if (status === 'USED') {
              statusBadge = '<span style="background: rgba(46, 204, 113, 0.2); border: 1px solid #2ecc71; color: #2ecc71; border-radius: 4px; padding: 2px 7px; font-weight: 700; font-size: 0.76rem;">USED</span>';
          } else if (status === 'EXPIRED') {
              statusBadge = '<span style="background: rgba(148, 163, 184, 0.2); border: 1px solid #64748b; color: #94a3b8; border-radius: 4px; padding: 2px 7px; font-weight: 700; font-size: 0.76rem;">EXPIRED</span>';
          } else {
              statusBadge = '<span style="background: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; color: #f87171; border-radius: 4px; padding: 2px 7px; font-weight: 700; font-size: 0.76rem;">CANCELLED</span>';
          }

          let actionButtons = '';
          if (status === 'PENDING') {
              actionButtons = `
                  <button class="btn btn-sm" style="background: #f39c12; color: #1a1000; font-weight: 700; padding: 3px 8px; margin-right: 4px; font-size: 0.74rem;" onclick="copyUserResetLink('${escapeHtml(r.identifier)}', ${r.id})" title="Copy Password Reset Link">Copy Link</button>
                  <button class="btn btn-sm" style="background: #475569; color: #fff; padding: 3px 8px; font-size: 0.74rem;" onclick="cancelPasswordReset(${r.id})" title="Cancel this reset token">Revoke</button>
              `;
          } else if (status === 'USED') {
              actionButtons = '<span style="color: #2ecc71; font-size: 0.8rem; font-weight: 700;">âœ“ Consumed</span>';
          } else {
              actionButtons = '<span style="color: #94a3b8; font-size: 0.8rem;">Inactive</span>';
          }

          const createdDate = r.created_at ? r.created_at.replace('T', ' ').substring(0, 19) : 'â€”';
          const expiresDate = r.expires_at ? r.expires_at.replace('T', ' ').substring(0, 19) : 'â€”';
          const authMethod = r.verification_type || 'Email Response';

          html += `
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
                  <td style="padding: 10px 12px; font-weight: bold; color: var(--gold-primary);">${r.id}</td>
                  <td style="padding: 10px 12px; font-weight: 600; color: #fff;">${escapeHtml(r.identifier || 'â€”')}</td>
                  <td style="padding: 10px 12px; font-size: 0.82rem; color: #55efc4; font-weight: 600;">${escapeHtml(authMethod)}</td>
                  <td style="padding: 10px 12px; color: var(--text-muted); font-size: 0.82rem;">${createdDate}</td>
                  <td style="padding: 10px 12px; color: var(--text-muted); font-size: 0.82rem;">${expiresDate}</td>
                  <td style="padding: 10px 12px;">${statusBadge}</td>
                  <td style="padding: 10px 12px; font-family: monospace; font-size: 0.8rem; color: #94a3b8;">${escapeHtml(r.ip_address || 'â€”')}</td>
                  <td style="padding: 10px 12px; text-align: center;">${actionButtons}</td>
              </tr>
          `;
      });

      tbody.innerHTML = html;
  }

  async function cancelPasswordReset(tokenId) {
      if (!confirm("Cancel this password reset request? The user will no longer be able to use it to authenticate their password change.")) return;
      const adminKey = getAdminKey();
      try {
          const res = await callAdminApi('cancel_password_reset', {
              admin_key: adminKey,
              admin_password: adminKey,
              token_id: tokenId
          });
          if (res && res.success) {
              alert(res.message || 'Request cancelled successfully.');
              fetchPasswordResets();
          } else {
              alert('Error cancelling request: ' + (res && res.message ? res.message : 'Unknown error'));
          }
      } catch (err) {
          alert('Failed to cancel request: ' + err.message);
      }
  }

  function copyUserResetLink(identifier, tokenId) {
      const resetUrl = `${window.location.origin}/password_reset.html`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(resetUrl).then(() => {
              alert(`Password Reset Portal Link copied:\n${resetUrl}\n\nDirect user to this page.`);
          }).catch(() => {
              prompt("Password Reset Portal URL:", resetUrl);
          });
      } else {
          prompt("Password Reset Portal URL:", resetUrl);
      }
  }

  // Bind to global scope
  global.authenticateAdmin = authenticateAdmin;
  global.logoutAdmin = logoutAdmin;
  global.switchAdminTab = switchAdminTab;
  global.fetchAccountDeletionRequests = fetchAccountDeletionRequests;
  global.purgeAllPendingAccounts = purgeAllPendingAccounts;
  global.quickPurgeAccount = quickPurgeAccount;
  global.setDeletionFilter = setDeletionFilter;
  global.filterDeletionRequests = filterDeletionRequests;
  global.processDeletionRequest = processDeletionRequest;
  global.fetchSegments = fetchSegments;
  global.saveSegments = saveSegments;
  global.toggleSegmentIds = toggleSegmentIds;
  global.fetchBlackjackUsers = fetchBlackjackUsers;
  global.handleUserSearchInput = handleUserSearchInput;
  global.toggleCreateUserPanel = toggleCreateUserPanel;
  global.executeCreateUser = executeCreateUser;
  global.executeUpdateUser = executeUpdateUser;
  global.executeToggleBanUser = executeToggleBanUser;
  global.executeDeleteUser = executeDeleteUser;
  global.executePurgeUser = executePurgeUser;
  global.setUserFilter = setUserFilter;
  global.quickAddBankroll = quickAddBankroll;
  global.updateGuestLoginsDisplay = updateGuestLoginsDisplay;
  global.resetGuestLoginCount = resetGuestLoginCount;
  global.fetchStoreSettings = fetchStoreSettings;
  global.handleStoreToggleChange = handleStoreToggleChange;
  global.saveStoreSettings = saveStoreSettings;
  global.useCurrentDetectedIp = useCurrentDetectedIp;
  global.saveAdminAllowedIp = saveAdminAllowedIp;
  global.updateStoreBadges = updateStoreBadges;
  global.setPurchaseFilter = setPurchaseFilter;
  global.handlePurchaseSearchInput = handlePurchaseSearchInput;
  global.renderStoreLedger = renderStoreLedger;
  global.viewPurchaseDetails = viewPurchaseDetails;
  global.closePurchaseDetailsModal = closePurchaseDetailsModal;
  global.copyPurchaseField = copyPurchaseField;
  global.fetchPasswordResets = fetchPasswordResets;
  global.updateResetBadges = updateResetBadges;
  global.renderPasswordResets = renderPasswordResets;
  global.setResetFilter = setResetFilter;
  global.filterPasswordResets = filterPasswordResets;
  global.cancelPasswordReset = cancelPasswordReset;
  global.copyUserResetLink = copyUserResetLink;
  global.fetchAppointments = fetchAppointments;
  global.setAppFilter = setAppFilter;
  global.filterAppointments = filterAppointments;
  global.renderAppointments = renderAppointments;
  global.updateAppointmentStatus = updateAppointmentStatus;
  global.deleteAppointment = deleteAppointment;
  global.setMessageFilter = setMessageFilter;
  global.renderContactMessages = renderContactMessages;
  global.updateContactMessageStatus = updateContactMessageStatus;
  global.toggleSelectAllContactMessages = toggleSelectAllContactMessages;
  global.onContactMessageCheckboxChange = onContactMessageCheckboxChange;
  global.updateSelectedContactMessagesCount = updateSelectedContactMessagesCount;
  global.deleteContactMessage = deleteContactMessage;
  global.deleteSelectedContactMessages = deleteSelectedContactMessages;
  global.openNewAppointmentModal = openNewAppointmentModal;
  global.openEditAppointmentModal = openEditAppointmentModal;
  global.closeAppointmentModal = closeAppointmentModal;
  global.submitAppointmentModal = submitAppointmentModal;

  global.copyContactMessage = copyContactMessage;
  global.openModifyMessageModal = openModifyMessageModal;
  global.closeModifyMessageModal = closeModifyMessageModal;
  global.saveModifiedContactMessage = saveModifiedContactMessage;
  global.openReplyMessageModal = openReplyMessageModal;
  global.closeReplyMessageModal = closeReplyMessageModal;
  global.sendContactMessageReply = sendContactMessageReply;
  global.sendContactNotification = sendContactNotification;
  global.filterContactMessages = filterContactMessages;

  /* --- TAB 6: CONSULTATION APPOINTMENTS & INQUIRIES --- */
  let allAppointments = [];
  let allContactMessages = [];
  let activeAppFilter = 'ALL';
  let activeAppSearchTerm = '';
  let activeMsgFilter = 'ALL';

  async function fetchAppointments() {
      const appBody = document.getElementById('adminAppointmentsBody');
      const msgBody = document.getElementById('adminContactMessagesBody');
      const adminKey = getAdminKey();

      if (!adminKey) {
          if (appBody) appBody.innerHTML = '<tr><td colspan="7" style="padding:16px; text-align:center; color:var(--error-red);">Admin authentication required.</td></tr>';
          return;
      }

      try {
          const res = await callAdminApi('get_appointments', { admin_key: adminKey });
          if (res && res.success) {
              const data = res.data || res || {};
              allAppointments = Array.isArray(data.appointments)
                  ? data.appointments
                  : (Array.isArray(res.appointments) ? res.appointments : []);
              allContactMessages = Array.isArray(data.contact_messages)
                  ? data.contact_messages
                  : (Array.isArray(data.messages)
                      ? data.messages
                      : (Array.isArray(res.contact_messages)
                          ? res.contact_messages
                          : (Array.isArray(res.messages) ? res.messages : [])));
              const rawStats = data.stats || res.stats || {};
              const stats = {
                  today: rawStats.today !== undefined ? rawStats.today : (rawStats.today_count !== undefined ? rawStats.today_count : 0),
                  confirmed: rawStats.confirmed !== undefined ? rawStats.confirmed : (rawStats.confirmed_count !== undefined ? rawStats.confirmed_count : 0),
                  pending: rawStats.pending !== undefined ? rawStats.pending : (rawStats.pending_count !== undefined ? rawStats.pending_count : 0),
                  completed: rawStats.completed !== undefined ? rawStats.completed : (rawStats.completed_count !== undefined ? rawStats.completed_count : 0),
                  cancelled: rawStats.cancelled !== undefined ? rawStats.cancelled : (rawStats.cancelled_count !== undefined ? rawStats.cancelled_count : 0),
                  total: rawStats.total !== undefined ? rawStats.total : (rawStats.total_count !== undefined ? rawStats.total_count : allAppointments.length)
              };

              const todayEl = document.getElementById('appTodayCountDisplay');
              const confEl = document.getElementById('appConfirmedCountDisplay');
              const pendEl = document.getElementById('appPendingCountDisplay');
              const msgsEl = document.getElementById('appMessagesCountDisplay');
              const totalEl = document.getElementById('appTotalCountDisplay');
              const badgeEl = document.getElementById('appBadge');

              if (todayEl) todayEl.textContent = stats.today;
              if (confEl) confEl.textContent = stats.confirmed;
              if (pendEl) pendEl.textContent = stats.pending;
              if (msgsEl) msgsEl.textContent = (data.unread_messages !== undefined ? data.unread_messages : (res.unread_messages !== undefined ? res.unread_messages : allContactMessages.length));
              if (totalEl) totalEl.textContent = stats.total;

              const unreadMsgCount = allContactMessages.filter(m => (m.status || 'unread').toLowerCase() === 'unread').length;
              const attentionCount = (parseInt(stats.pending, 10) || 0);
              if (badgeEl) {
                  if (attentionCount > 0) {
                      badgeEl.textContent = attentionCount;
                      badgeEl.style.display = 'inline-block';
                  } else {
                      badgeEl.style.display = 'none';
                  }
              }

              const msgBadge = document.getElementById('msgTabBadge');
              if (msgBadge) {
                  if (unreadMsgCount > 0) {
                      msgBadge.textContent = unreadMsgCount;
                      msgBadge.style.display = 'inline-block';
                  } else {
                      msgBadge.style.display = 'none';
                  }
              }

              const totalMsgCount = allContactMessages.length;
              const repliedMsgCount = allContactMessages.filter(m => (m.status || '').toLowerCase() === 'replied').length;
              const archivedMsgCount = allContactMessages.filter(m => ['read', 'archived'].includes((m.status || '').toLowerCase())).length;

              const msgTotalEl = document.getElementById('msgTotalCountDisplay');
              const msgUnreadEl = document.getElementById('msgUnreadCountDisplay');
              const msgRepliedEl = document.getElementById('msgRepliedCountDisplay');
              const msgArchivedEl = document.getElementById('msgArchivedCountDisplay');
              if (msgTotalEl) msgTotalEl.textContent = totalMsgCount;
              if (msgUnreadEl) msgUnreadEl.textContent = unreadMsgCount;
              if (msgRepliedEl) msgRepliedEl.textContent = repliedMsgCount;
              if (msgArchivedEl) msgArchivedEl.textContent = archivedMsgCount;

              renderAppointments();
              renderContactMessages();
          } else {
              if (appBody) appBody.innerHTML = `<tr><td colspan="7" style="padding:16px; text-align:center; color:var(--error-red);">${res && res.message ? res.message : 'Failed to load appointments.'}</td></tr>`;
          }
      } catch (err) {
          if (appBody) appBody.innerHTML = `<tr><td colspan="7" style="padding:16px; text-align:center; color:var(--error-red);">Error loading appointments: ${err.message}</td></tr>`;
      }
  }

  function setAppFilter(filter) {
      activeAppFilter = (filter || 'ALL').toUpperCase();
      ['All', 'Today', 'Confirmed', 'Pending', 'Completed', 'Cancelled'].forEach(btnKey => {
          const btn = document.getElementById(`appFilter${btnKey}`);
          if (btn) {
              const isActive = (btnKey.toUpperCase() === activeAppFilter);
              btn.style.background = isActive ? 'var(--gold-primary)' : '#334155';
              btn.style.color = isActive ? '#000' : '#fff';
              btn.style.fontWeight = isActive ? '700' : '400';
          }
      });
      renderAppointments();
  }

  function filterAppointments() {
      const searchInput = document.getElementById('appSearchInput');
      activeAppSearchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
      renderAppointments();
  }

  function renderAppointments() {
      const tbody = document.getElementById('adminAppointmentsBody');
      if (!tbody) return;

      const todayStr = new Date().toISOString().slice(0, 10);

      const filtered = allAppointments.filter(app => {
          const status = (app.status || 'confirmed').toUpperCase();
          if (activeAppFilter === 'TODAY' && app.appointment_date !== todayStr) return false;
          if (activeAppFilter === 'CONFIRMED' && status !== 'CONFIRMED') return false;
          if (activeAppFilter === 'PENDING' && status !== 'PENDING') return false;
          if (activeAppFilter === 'COMPLETED' && status !== 'COMPLETED') return false;
          if (activeAppFilter === 'CANCELLED' && status !== 'CANCELLED') return false;

          if (activeAppSearchTerm) {
              const name = (app.attendee_name || '').toLowerCase();
              const email = (app.attendee_email || '').toLowerCase();
              const phone = (app.attendee_phone || '').toLowerCase();
              const topic = (app.topic || '').toLowerCase();
              const notes = (app.notes || '').toLowerCase();
              const date = (app.appointment_date || '').toLowerCase();
              if (!name.includes(activeAppSearchTerm) &&
                  !email.includes(activeAppSearchTerm) &&
                  !phone.includes(activeAppSearchTerm) &&
                  !topic.includes(activeAppSearchTerm) &&
                  !notes.includes(activeAppSearchTerm) &&
                  !date.includes(activeAppSearchTerm)) {
                  return false;
              }
          }
          return true;
      });

      if (filtered.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" style="padding:24px; text-align:center; color:var(--text-muted);">No consultation appointments match the selected filters.</td></tr>';
          return;
      }

      tbody.innerHTML = filtered.map(app => {
          const st = (app.status || 'confirmed').toLowerCase();
          let badgeStyle = 'background:rgba(46, 204, 113, 0.2); color:#2ecc71; border:1px solid #2ecc71;';
          if (st === 'pending') badgeStyle = 'background:rgba(243, 156, 18, 0.2); color:#f39c12; border:1px solid #f39c12;';
          else if (st === 'cancelled') badgeStyle = 'background:rgba(231, 76, 60, 0.2); color:#ff6b6b; border:1px solid #ff6b6b;';
          else if (st === 'completed') badgeStyle = 'background:rgba(52, 152, 219, 0.2); color:#70a1ff; border:1px solid #70a1ff;';

          const safeName = escapeHtml(app.attendee_name || 'Anonymous');
          const safeEmail = escapeHtml(app.attendee_email || 'No email');
          const safePhone = escapeHtml(app.attendee_phone || 'â€”');
          const safeDate = escapeHtml(app.appointment_date || 'â€”');
          const safeTime = escapeHtml(app.appointment_time || 'â€”');
          const safeTz = escapeHtml(app.timezone || 'EST');
          const safeTopic = escapeHtml(app.topic || 'Consultation');
          const safeNotes = escapeHtml(app.notes || 'â€”');

          return `
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
                  <td style="padding: 10px 12px; font-weight:700; color:var(--gold-primary);">${app.id}</td>
                  <td style="padding: 10px 12px;">
                      <strong style="color:#fff; font-size:0.95rem;">${safeName}</strong>
                  </td>
                  <td style="padding: 10px 12px; font-size:0.85rem;">
                      <div><a href="mailto:${safeEmail}" style="color:var(--accent-blue); text-decoration:none;">âœ‰ï¸ ${safeEmail}</a></div>
                      ${app.attendee_phone ? `<div><a href="tel:${safePhone}" style="color:#94a3b8; text-decoration:none;">ðŸ“ž ${safePhone}</a></div>` : ''}
                  </td>
                  <td style="padding: 10px 12px; font-size:0.86rem; color:#cbd5e1;">
                      <div style="font-weight:700; color:#fff;">ðŸ“… ${safeDate}</div>
                      <div style="color:var(--gold-primary);">â° ${safeTime} <span style="font-size:0.75rem; color:#94a3b8;">(${safeTz})</span></div>
                  </td>
                  <td style="padding: 10px 12px; font-size:0.85rem;">
                      <div style="font-weight:600; color:#cbd5e1;">${safeTopic}</div>
                      ${app.notes ? `<div style="color:#94a3b8; font-style:italic; max-width:240px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${safeNotes}">ðŸ“ ${safeNotes}</div>` : ''}
                  </td>
                  <td style="padding: 10px 12px;">
                      <select onchange="updateAppointmentStatus(${app.id}, this.value)" style="${badgeStyle} border-radius:4px; padding:3px 8px; font-size:0.82rem; font-weight:700; cursor:pointer;">
                          <option value="confirmed" ${st === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                          <option value="pending" ${st === 'pending' ? 'selected' : ''}>Pending</option>
                          <option value="completed" ${st === 'completed' ? 'selected' : ''}>Completed</option>
                          <option value="cancelled" ${st === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                      </select>
                  </td>
                  <td style="padding: 10px 12px; text-align:center;">
                      <div style="display:flex; gap:6px; justify-content:center;">
                          <button class="btn btn-sm" style="background:#334155; color:#fff; padding:4px 8px; font-size:0.78rem;" onclick="openEditAppointmentModal(${app.id})">Edit</button>
                          <button class="btn btn-sm btn-danger" style="padding:4px 8px; font-size:0.78rem;" onclick="deleteAppointment(${app.id})">Delete</button>
                      </div>
                  </td>
              </tr>
          `;
      }).join('');
  }

  async function updateAppointmentStatus(id, newStatus) {
      const adminKey = getAdminKey();
      try {
          const res = await callAdminApi('update_appointment', {
              admin_key: adminKey,
              id: id,
              status: newStatus
          });
          if (res && res.success) {
              fetchAppointments();
          } else {
              alert('Failed to update status: ' + (res && res.message ? res.message : 'Unknown error'));
              fetchAppointments();
          }
      } catch (err) {
          alert('Error updating status: ' + err.message);
          fetchAppointments();
      }
  }

  async function deleteAppointment(id) {
      if (!confirm(`Are you sure you want to permanently delete appointment #${id}?`)) {
          return;
      }
      const adminKey = getAdminKey();
      try {
          const res = await callAdminApi('delete_appointment', {
              admin_key: adminKey,
              id: id
          });
          if (res && res.success) {
              fetchAppointments();
          } else {
              alert('Failed to delete appointment: ' + (res && res.message ? res.message : 'Unknown error'));
          }
      } catch (err) {
          alert('Error deleting appointment: ' + err.message);
      }
  }

  function setMessageFilter(filter) {
      activeMsgFilter = (filter || 'ALL').toUpperCase();
      ['All', 'Unread', 'Read', 'Replied'].forEach(btnKey => {
          const btn = document.getElementById(`msgFilter${btnKey}`);
          if (btn) {
              const isActive = (btnKey.toUpperCase() === activeMsgFilter);
              btn.style.background = isActive ? 'var(--gold-primary)' : '#334155';
              btn.style.color = isActive ? '#000' : '#fff';
              btn.style.fontWeight = isActive ? '700' : '400';
          }
      });
      renderContactMessages();
  }

  let activeContactMsgSearch = '';

  function filterContactMessages() {
      const input = document.getElementById('contactMsgSearchInput');
      activeContactMsgSearch = input ? input.value.trim().toLowerCase() : '';
      renderContactMessages();
  }

  function renderContactMessages() {
      const tbody = document.getElementById('adminContactMessagesBody');
      if (!tbody) return;

      const selectAll = document.getElementById('selectAllContactMessages');
      if (selectAll) {
          selectAll.checked = false;
          selectAll.indeterminate = false;
      }
      updateSelectedContactMessagesCount();

      const filtered = allContactMessages.filter(msg => {
          const st = (msg.status || 'unread').toUpperCase();
          if (activeMsgFilter === 'UNREAD' && st !== 'UNREAD') return false;
          if (activeMsgFilter === 'READ' && st !== 'READ') return false;
          if (activeMsgFilter === 'REPLIED' && st !== 'REPLIED') return false;
          if (activeMsgFilter === 'ARCHIVED' && st !== 'ARCHIVED') return false;

          if (activeContactMsgSearch) {
              const sender = (msg.sender_name || '').toLowerCase();
              const email = (msg.sender_email || '').toLowerCase();
              const subj = (msg.subject || '').toLowerCase();
              const body = (msg.message || '').toLowerCase();
              if (!sender.includes(activeContactMsgSearch) &&
                  !email.includes(activeContactMsgSearch) &&
                  !subj.includes(activeContactMsgSearch) &&
                  !body.includes(activeContactMsgSearch)) {
                  return false;
              }
          }
          return true;
      });

      if (filtered.length === 0) {
          tbody.innerHTML = '<tr><td colspan="8" style="padding:24px; text-align:center; color:var(--text-muted);">No contact messages match the selected filter.</td></tr>';
          return;
      }

      tbody.innerHTML = filtered.map(msg => {
          const st = (msg.status || 'unread').toLowerCase();
          let badgeStyle = 'background:rgba(243, 156, 18, 0.2); color:#f39c12; border:1px solid #f39c12;';
          if (st === 'read') badgeStyle = 'background:rgba(148, 163, 184, 0.2); color:#cbd5e1; border:1px solid #94a3b8;';
          else if (st === 'replied') badgeStyle = 'background:rgba(46, 204, 113, 0.2); color:#2ecc71; border:1px solid #2ecc71;';
          else if (st === 'archived') badgeStyle = 'background:rgba(100, 116, 139, 0.2); color:#94a3b8; border:1px solid #64748b;';

          const safeSender = escapeHtml(msg.sender_name || 'Anonymous');
          const safeEmail = escapeHtml(msg.sender_email || '');
          const safeSubject = escapeHtml(msg.subject || '(No Subject)');
          const safeMsg = escapeHtml(msg.message || '');
          const dateStr = msg.created_at ? msg.created_at.slice(0, 16).replace('T', ' ') : 'â€”';

          return `
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
                  <td style="padding: 10px 12px; text-align: center;">
                      <input type="checkbox" class="contact-msg-checkbox" value="${msg.id}" onchange="onContactMessageCheckboxChange()" style="cursor: pointer; width: 16px; height: 16px;">
                  </td>
                  <td style="padding: 10px 12px; font-weight:700; color:var(--gold-primary);">${msg.id}</td>
                  <td style="padding: 10px 12px; font-size:0.82rem; color:#94a3b8;">${dateStr}</td>
                  <td style="padding: 10px 12px;">
                      <div style="font-weight:700; color:#fff;">${safeSender}</div>
                      <div><a href="mailto:${safeEmail}?subject=Re:%20${encodeURIComponent(msg.subject || 'Calm Chess Consultation')}" style="color:var(--accent-blue); text-decoration:none; font-size:0.82rem;">âœ‰ï¸ ${safeEmail}</a></div>
                  </td>
                  <td style="padding: 10px 12px; font-weight:600; color:#fed7aa; font-size:0.88rem;">${safeSubject}</td>
                  <td style="padding: 10px 12px; font-size:0.84rem; color:#cbd5e1; max-width:260px;">
                      <div style="max-height:65px; overflow-y:auto; line-height:1.4; white-space:pre-wrap;">${safeMsg}</div>
                  </td>
                  <td style="padding: 10px 12px;">
                      <select onchange="updateContactMessageStatus(${msg.id}, this.value)" style="${badgeStyle} border-radius:4px; padding:3px 8px; font-size:0.82rem; font-weight:700; cursor:pointer;">
                          <option value="unread" ${st === 'unread' ? 'selected' : ''}>Unread</option>
                          <option value="read" ${st === 'read' ? 'selected' : ''}>Read</option>
                          <option value="replied" ${st === 'replied' ? 'selected' : ''}>Replied</option>
                          <option value="archived" ${st === 'archived' ? 'selected' : ''}>Archived</option>
                      </select>
                  </td>
                  <td style="padding: 10px 12px; text-align:center;">
                      <div style="display:flex; gap:4px; justify-content:center; flex-wrap:wrap;">
                          <button class="btn btn-sm btn-gold" style="padding:3px 7px; font-size:0.75rem;" onclick="copyContactMessage(${msg.id})" title="Copy message text to clipboard">ðŸ“‹ Copy</button>
                          <button class="btn btn-sm" style="background:#3b82f6; color:#fff; padding:3px 7px; font-size:0.75rem; border:none; border-radius:4px; cursor:pointer;" onclick="openReplyMessageModal(${msg.id})" title="Reply to message and notify Brian">âœ‰ï¸ Reply</button>
                          <button class="btn btn-sm" style="background:#f59e0b; color:#1a1000; font-weight:700; padding:3px 7px; font-size:0.75rem; border:none; border-radius:4px; cursor:pointer;" onclick="openModifyMessageModal(${msg.id})" title="Modify message content & sender info">âœï¸ Modify</button>
                          <button class="btn btn-sm" style="background:#8b5cf6; color:#fff; padding:3px 7px; font-size:0.75rem; border:none; border-radius:4px; cursor:pointer;" onclick="sendContactNotification(${msg.id})" title="Send notification to bberry@calmchessgames.com">ðŸ”” Notify</button>
                          <button class="btn btn-sm" style="background:#ef4444; color:#fff; padding:3px 7px; font-size:0.75rem; border:none; border-radius:4px; cursor:pointer;" onclick="deleteContactMessage(${msg.id})" title="Delete message">ðŸ—‘ï¸ Del</button>
                      </div>
                  </td>
              </tr>
          `;
      }).join('');
  }

  // COPY MESSAGE TO CLIPBOARD
  function copyContactMessage(id) {
      const msg = allContactMessages.find(m => Number(m.id) === Number(id));
      if (!msg) return;
      const text = `From: ${msg.sender_name} <${msg.sender_email}>
Subject: ${msg.subject}
Received: ${msg.created_at}

Message:
${msg.message}`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(() => {
              alert(`âœ” Message #${id} copied to clipboard!`);
          }).catch(() => {
              fallbackCopyText(text, id);
          });
      } else {
          fallbackCopyText(text, id);
      }
  }

  function fallbackCopyText(text, id) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try {
          document.execCommand('copy');
          alert(`âœ” Message #${id} copied to clipboard!`);
      } catch (e) {
          alert(`Message #${id} text:

${text}`);
      }
      document.body.removeChild(ta);
  }

  // MODIFY MESSAGE MODAL & ACTIONS
  function openModifyMessageModal(id) {
      const msg = allContactMessages.find(m => Number(m.id) === Number(id));
      if (!msg) return;

      const modal = document.getElementById('modifyMessageModal');
      const title = document.getElementById('modMsgModalTitle');
      const idInput = document.getElementById('modMsgId');
      const nameInput = document.getElementById('modMsgSenderName');
      const emailInput = document.getElementById('modMsgSenderEmail');
      const subjInput = document.getElementById('modMsgSubject');
      const statusInput = document.getElementById('modMsgStatus');
      const textInput = document.getElementById('modMsgText');

      if (title) title.textContent = `âœï¸ Modify Contact Message (#${msg.id})`;
      if (idInput) idInput.value = msg.id;
      if (nameInput) nameInput.value = msg.sender_name || '';
      if (emailInput) emailInput.value = msg.sender_email || '';
      if (subjInput) subjInput.value = msg.subject || '';
      if (statusInput) statusInput.value = (msg.status || 'unread').toLowerCase();
      if (textInput) textInput.value = msg.message || '';

      if (modal) modal.style.display = 'flex';
  }

  function closeModifyMessageModal() {
      const modal = document.getElementById('modifyMessageModal');
      if (modal) modal.style.display = 'none';
  }

  async function saveModifiedContactMessage() {
      const idInput = document.getElementById('modMsgId');
      const nameInput = document.getElementById('modMsgSenderName');
      const emailInput = document.getElementById('modMsgSenderEmail');
      const subjInput = document.getElementById('modMsgSubject');
      const statusInput = document.getElementById('modMsgStatus');
      const textInput = document.getElementById('modMsgText');
      const saveBtn = document.getElementById('btnSaveModMsg');

      const id = idInput ? parseInt(idInput.value, 10) : 0;
      const name = nameInput ? nameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';
      const subject = subjInput ? subjInput.value.trim() : '';
      const status = statusInput ? statusInput.value : 'unread';
      const message = textInput ? textInput.value.trim() : '';

      if (!id || !name || !email || !message) {
          alert('Please fill in all required fields (Name, Email, and Message).');
          return;
      }

      if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Saving...'; }
      const adminKey = getAdminKey();

      try {
          const res = await callAdminApi('modify_contact_message', {
              admin_key: adminKey,
              id: id,
              sender_name: name,
              sender_email: email,
              subject: subject,
              status: status,
              message: message
          });

          if (res && res.success) {
              alert('âœ” Message successfully modified and updated in database!');
              closeModifyMessageModal();
              // Update local object
              const target = allContactMessages.find(m => Number(m.id) === Number(id));
              if (target) {
                  target.sender_name = name;
                  target.sender_email = email;
                  target.subject = subject;
                  target.status = status;
                  target.message = message;
              }
              renderContactMessages();
          } else {
              alert('Failed to modify message: ' + (res && res.message ? res.message : 'Unknown error'));
          }
      } catch (err) {
          alert('Error modifying message: ' + err.message);
      } finally {
          if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'ðŸ’¾ Save Changes to Database'; }
      }
  }

  // REPLY TO MESSAGE MODAL & ACTIONS
  function openReplyMessageModal(id) {
      const msg = allContactMessages.find(m => Number(m.id) === Number(id));
      if (!msg) return;

      const modal = document.getElementById('replyMessageModal');
      const title = document.getElementById('replyMsgModalTitle');
      const idInput = document.getElementById('replyMsgId');
      const recipDisplay = document.getElementById('replyRecipientDisplay');
      const origSubjDisplay = document.getElementById('replyOrigSubjectDisplay');
      const origMsgPreview = document.getElementById('replyOrigMsgPreview');
      const replyText = document.getElementById('replyMsgText');

      if (title) title.textContent = `âœ‰ï¸ Reply to Message #${msg.id} from ${msg.sender_name}`;
      if (idInput) idInput.value = msg.id;
      if (recipDisplay) recipDisplay.textContent = `${msg.sender_name} <${msg.sender_email}>`;
      if (origSubjDisplay) origSubjDisplay.textContent = msg.subject || '(No Subject)';
      if (origMsgPreview) origMsgPreview.textContent = msg.message || '(Empty message)';
      if (replyText) {
          replyText.value = `Hello ${msg.sender_name},

Thank you for reaching out to Calm Chess Games. `;
          setTimeout(() => replyText.focus(), 50);
      }

      if (modal) modal.style.display = 'flex';
  }

  function closeReplyMessageModal() {
      const modal = document.getElementById('replyMessageModal');
      if (modal) modal.style.display = 'none';
  }

  async function sendContactMessageReply() {
      const idInput = document.getElementById('replyMsgId');
      const textInput = document.getElementById('replyMsgText');
      const sendBtn = document.getElementById('btnSendReplyMsg');

      const id = idInput ? parseInt(idInput.value, 10) : 0;
      const replyBody = textInput ? textInput.value.trim() : '';

      if (!id || !replyBody) {
          alert('Please write your reply message before sending.');
          return;
      }

      if (sendBtn) { sendBtn.disabled = true; sendBtn.textContent = 'Sending...'; }
      const adminKey = getAdminKey();

      try {
          const res = await callAdminApi('reply_contact_message', {
              admin_key: adminKey,
              id: id,
              reply: replyBody
          });

          if (res && res.success) {
              alert('âœ” Reply dispatched successfully! A copy of this reply has been sent to bberry@calmchessgames.com and the message marked as Replied.');
              closeReplyMessageModal();
              // Update local status
              const target = allContactMessages.find(m => Number(m.id) === Number(id));
              if (target) {
                  target.status = 'replied';
              }
              renderContactMessages();
          } else {
              alert('Failed to send reply: ' + (res && res.message ? res.message : 'Unknown error'));
          }
      } catch (err) {
          alert('Error sending reply: ' + err.message);
      } finally {
          if (sendBtn) { sendBtn.disabled = false; sendBtn.textContent = 'ðŸš€ Send Reply & Notify Brian'; }
      }
  }

  // SEND NOTIFICATION OF MESSAGE TO bberry@calmchessgames.com
  async function sendContactNotification(id) {
      if (!id) return;
      const adminKey = getAdminKey();
      try {
          const res = await callAdminApi('send_contact_notification', {
              admin_key: adminKey,
              id: id
          });
          if (res && res.success) {
              alert(`âœ” Notification for Message #${id} sent to bberry@calmchessgames.com!`);
          } else {
              alert('Failed to send notification: ' + (res && res.message ? res.message : 'Unknown error'));
          }
      } catch (err) {
          alert('Error sending notification: ' + err.message);
      }
  }

  function toggleSelectAllContactMessages(checked) {
      const checkboxes = document.querySelectorAll('.contact-msg-checkbox');
      checkboxes.forEach(cb => {
          cb.checked = checked;
      });
      updateSelectedContactMessagesCount();
  }

  function onContactMessageCheckboxChange() {
      const allCbs = document.querySelectorAll('.contact-msg-checkbox');
      const checkedCbs = document.querySelectorAll('.contact-msg-checkbox:checked');
      const selectAll = document.getElementById('selectAllContactMessages');
      if (selectAll) {
          selectAll.checked = allCbs.length > 0 && checkedCbs.length === allCbs.length;
          selectAll.indeterminate = checkedCbs.length > 0 && checkedCbs.length < allCbs.length;
      }
      updateSelectedContactMessagesCount();
  }

  function updateSelectedContactMessagesCount() {
      const checkedCbs = document.querySelectorAll('.contact-msg-checkbox:checked');
      const count = checkedCbs.length;
      const btn = document.getElementById('btnDeleteSelectedMessages');
      const countSpan = document.getElementById('selectedMsgCount');
      if (countSpan) countSpan.textContent = count;
      if (btn) btn.style.display = count > 0 ? 'inline-flex' : 'none';

      const btnDedicated = document.getElementById('btnDeleteSelectedMessagesDedicated');
      const countSpanDedicated = document.getElementById('selectedMsgCountDedicated');
      if (countSpanDedicated) countSpanDedicated.textContent = count;
      if (btnDedicated) btnDedicated.style.display = count > 0 ? 'inline-flex' : 'none';
  }

  async function deleteContactMessage(id) {
      if (!id) return;
      if (!confirm(`Are you sure you want to delete contact message #${id}?`)) {
          return;
      }
      const adminKey = getAdminKey();
      try {
          const res = await callAdminApi('delete_contact_message', {
              admin_key: adminKey,
              id: id
          });
          if (res && res.success) {
              allContactMessages = allContactMessages.filter(m => Number(m.id) !== Number(id));
              renderContactMessages();
          } else {
              alert('Failed to delete message: ' + (res && res.message ? res.message : 'Unknown error'));
          }
      } catch (err) {
          alert('Error deleting message: ' + err.message);
      }
  }

  async function deleteSelectedContactMessages() {
      const checkedCbs = Array.from(document.querySelectorAll('.contact-msg-checkbox:checked'));
      const ids = checkedCbs.map(cb => parseInt(cb.value, 10)).filter(id => !isNaN(id) && id > 0);
      if (ids.length === 0) {
          alert('Please select at least one contact message to delete.');
          return;
      }
      if (!confirm(`Are you sure you want to delete the ${ids.length} selected contact message(s)? This action cannot be undone.`)) {
          return;
      }
      const adminKey = getAdminKey();
      try {
          const res = await callAdminApi('delete_contact_messages', {
              admin_key: adminKey,
              ids: ids
          });
          if (res && res.success) {
              const idSet = new Set(ids.map(Number));
              allContactMessages = allContactMessages.filter(m => !idSet.has(Number(m.id)));
              renderContactMessages();
          } else {
              alert('Failed to delete messages: ' + (res && res.message ? res.message : 'Unknown error'));
          }
      } catch (err) {
          alert('Error deleting messages: ' + err.message);
      }
  }

  async function updateContactMessageStatus(id, newStatus) {
      const adminKey = getAdminKey();
      try {
          const res = await callAdminApi('update_contact_message', {
              admin_key: adminKey,
              id: id,
              status: newStatus
          });
          if (res && res.success) {
              fetchAppointments();
          }
      } catch (err) {
          console.error('Error updating message status:', err);
      }
  }

  function openNewAppointmentModal() {
      const modal = document.getElementById('appointmentModal');
      const title = document.getElementById('appModalTitle');
      const idInput = document.getElementById('appModalId');
      const nameInput = document.getElementById('appModalName');
      const emailInput = document.getElementById('appModalEmail');
      const phoneInput = document.getElementById('appModalPhone');
      const dateInput = document.getElementById('appModalDate');
      const timeInput = document.getElementById('appModalTime');
      const topicInput = document.getElementById('appModalTopic');
      const statusInput = document.getElementById('appModalStatus');
      const tzInput = document.getElementById('appModalTimezone');
      const notesInput = document.getElementById('appModalNotes');

      if (title) title.textContent = 'ðŸ“… Schedule Consultation Appointment';
      if (idInput) idInput.value = '';
      if (nameInput) nameInput.value = '';
      if (emailInput) emailInput.value = '';
      if (phoneInput) phoneInput.value = '';
      if (dateInput) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          dateInput.value = tomorrow.toISOString().slice(0, 10);
      }
      if (timeInput) timeInput.value = '10:00 AM EST';
      if (topicInput) topicInput.value = 'Chess Engine & Architecture Consultation';
      if (statusInput) statusInput.value = 'confirmed';
      if (tzInput) tzInput.value = 'America/New_York (EST)';
      if (notesInput) notesInput.value = '';

      if (modal) modal.style.display = 'flex';
  }

  function openEditAppointmentModal(id) {
      const app = allAppointments.find(a => Number(a.id) === Number(id));
      if (!app) return;

      const modal = document.getElementById('appointmentModal');
      const title = document.getElementById('appModalTitle');
      const idInput = document.getElementById('appModalId');
      const nameInput = document.getElementById('appModalName');
      const emailInput = document.getElementById('appModalEmail');
      const phoneInput = document.getElementById('appModalPhone');
      const dateInput = document.getElementById('appModalDate');
      const timeInput = document.getElementById('appModalTime');
      const topicInput = document.getElementById('appModalTopic');
      const statusInput = document.getElementById('appModalStatus');
      const tzInput = document.getElementById('appModalTimezone');
      const notesInput = document.getElementById('appModalNotes');

      if (title) title.textContent = `âœï¸ Edit Appointment #${app.id}`;
      if (idInput) idInput.value = app.id;
      if (nameInput) nameInput.value = app.attendee_name || '';
      if (emailInput) emailInput.value = app.attendee_email || '';
      if (phoneInput) phoneInput.value = app.attendee_phone || '';
      if (dateInput) dateInput.value = app.appointment_date || '';
      if (timeInput) timeInput.value = app.appointment_time || '';
      if (topicInput) topicInput.value = app.topic || '';
      if (statusInput) statusInput.value = app.status || 'confirmed';
      if (tzInput) tzInput.value = app.timezone || 'America/New_York (EST)';
      if (notesInput) notesInput.value = app.notes || '';

      if (modal) modal.style.display = 'flex';
  }

  function closeAppointmentModal() {
      const modal = document.getElementById('appointmentModal');
      if (modal) modal.style.display = 'none';
  }

  async function submitAppointmentModal() {
      const id = document.getElementById('appModalId')?.value;
      const name = document.getElementById('appModalName')?.value.trim();
      const email = document.getElementById('appModalEmail')?.value.trim();
      const phone = document.getElementById('appModalPhone')?.value.trim();
      const date = document.getElementById('appModalDate')?.value.trim();
      const time = document.getElementById('appModalTime')?.value.trim();
      const topic = document.getElementById('appModalTopic')?.value.trim();
      const status = document.getElementById('appModalStatus')?.value.trim();
      const timezone = document.getElementById('appModalTimezone')?.value.trim();
      const notes = document.getElementById('appModalNotes')?.value.trim();
      const adminKey = getAdminKey();

      if (!name) { alert('Attendee name is required'); return; }
      if (!email) { alert('Valid attendee email is required'); return; }
      if (!date) { alert('Appointment date is required'); return; }
      if (!time) { alert('Appointment time is required'); return; }

      const saveBtn = document.getElementById('btnSaveAppModal');
      if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Saving...'; }

      try {
          let res;
          if (id) {
              res = await callAdminApi('update_appointment', {
                  admin_key: adminKey,
                  id: id,
                  status: status,
                  notes: notes,
                  appointment_date: date,
                  appointment_time: time
              });
          } else {
              res = await callAdminApi('create_appointment', {
                  admin_key: adminKey,
                  name: name,
                  email: email,
                  phone: phone,
                  date: date,
                  time: time,
                  topic: topic,
                  status: status,
                  timezone: timezone,
                  notes: notes
              });
          }

          if (res && res.success) {
              closeAppointmentModal();
              fetchAppointments();
          } else {
              alert('Failed to save appointment: ' + (res && res.message ? res.message : 'Unknown error'));
          }
      } catch (err) {
          alert('Error saving appointment: ' + err.message);
      } finally {
          if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Save Appointment'; }
      }
  }

  function escapeHtml(str) {
      if (str === null || str === undefined) return '';
      return String(str)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
  }

  function initAdminConsole() {
      fetchPublicGuestStats();

      const searchInput = document.getElementById('adminUserSearchInput');
      if (searchInput) {
          searchInput.value = '';
      }

      const authInput = document.getElementById('adm-pass');
      if (authInput && (!authInput.dataset || !authInput.dataset.boundEnter)) {
          if (authInput.dataset) authInput.dataset.boundEnter = 'true';
          authInput.addEventListener('keydown', (e) => {
              if (e.key === 'Enter') {
                  e.preventDefault();
                  authenticateAdmin();
              }
          });
      }

      // Explicit click listener binding on Manager tab button for robust cross-browser clickability
      const managerBtn = document.getElementById('tabBtnGameManager') || document.getElementById('tabBtnManager');
      if (managerBtn && (!managerBtn.dataset || !managerBtn.dataset.boundClick)) {
          if (managerBtn.dataset) managerBtn.dataset.boundClick = 'true';
          managerBtn.style.cursor = 'pointer';
          managerBtn.addEventListener('click', function(e) {
              if (e) e.preventDefault();
              switchAdminTab('game_manager');
          });
      }

      // Check for initial URL hash (#manager, #game_manager, etc.)
      try {
          if (typeof window !== 'undefined' && window.location && window.location.hash) {
              const h = window.location.hash.replace('#', '').trim();
              if (h) {
                  switchAdminTab(h);
              }
          }
      } catch (e) {}
  }

  if (typeof window !== 'undefined') {
      window.addEventListener('hashchange', () => {
          const h = (window.location.hash || '').replace('#', '').trim();
          if (h && typeof window.switchAdminTab === 'function') {
              window.switchAdminTab(h);
          }
      });
  }

  if (document.readyState === 'loading') {
      window.addEventListener('DOMContentLoaded', initAdminConsole);
  } else {
      initAdminConsole();
  }
  window.addEventListener('load', () => {
      fetchPublicGuestStats();
  });


  function getActiveAdminKey() {
      return getAdminKey();
  }


  // =========================================================================
  // WORMHOLE XR HARDWARE & TELEMETRY REGISTRY
  // =========================================================================
  let cachedWormholeDevices = [];

  async function callAdminWormholeApi(action, method = 'GET', body = null) {
      const pass = getActiveAdminKey();
      const t = Date.now();

      // Dual-endpoint candidate cascade: checks both admin_api.php and wormhole_device_api.php across relative and base origins
      const isStageOrAdminAction = action.includes('stage') || action.includes('weapon') || action.includes('enem');
      const endpoints = isStageOrAdminAction ? [
          `admin_api.php?action=${action}&_t=${t}`,
          `./admin_api.php?action=${action}&_t=${t}`,
          `${API_BASE}/admin/admin_api.php?action=${action}&_t=${t}`,
          `${API_BASE}/admin_api.php?action=${action}&_t=${t}`,
          `../admin/admin_api.php?action=${action}&_t=${t}`,
          `../admin_api.php?action=${action}&_t=${t}`,
          `wormhole_device_api.php?action=${action}&_t=${t}`,
          `./wormhole_device_api.php?action=${action}&_t=${t}`,
          `${API_BASE}/admin/wormhole_device_api.php?action=${action}&_t=${t}`,
          `${API_BASE}/wormhole_device_api.php?action=${action}&_t=${t}`,
          `../admin/wormhole_device_api.php?action=${action}&_t=${t}`,
          `../wormhole_device_api.php?action=${action}&_t=${t}`
      ] : [
          `wormhole_device_api.php?action=${action}&_t=${t}`,
          `admin_api.php?action=${action}&_t=${t}`,
          `./wormhole_device_api.php?action=${action}&_t=${t}`,
          `./admin_api.php?action=${action}&_t=${t}`,
          `${API_BASE}/admin/wormhole_device_api.php?action=${action}&_t=${t}`,
          `${API_BASE}/admin/admin_api.php?action=${action}&_t=${t}`,
          `${API_BASE}/wormhole_device_api.php?action=${action}&_t=${t}`,
          `${API_BASE}/admin_api.php?action=${action}&_t=${t}`,
          `../admin/wormhole_device_api.php?action=${action}&_t=${t}`,
          `../admin/admin_api.php?action=${action}&_t=${t}`,
          `../wormhole_device_api.php?action=${action}&_t=${t}`,
          `../admin_api.php?action=${action}&_t=${t}`
      ];
      const uniqueUrls = [...new Set(endpoints)];

      const requestHeaders = {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
      };
      if (pass) {
          requestHeaders['Authorization'] = `Bearer ${pass}`;
          requestHeaders['X-Admin-Token'] = pass;
          requestHeaders['X-API-Key'] = pass;
          requestHeaders['X-Auth-Token'] = pass;
      }

      let payload = (body && typeof body === 'object' && !Array.isArray(body))
          ? Object.assign({}, body)
          : (body !== null ? body : {});
      if (pass && typeof payload === 'object' && !Array.isArray(payload)) {
          if (!payload.admin_key) payload.admin_key = pass;
          if (!payload.api_token) payload.api_token = pass;
          if (!payload.token) payload.token = pass;
          if (!payload.admin_password) payload.admin_password = pass;
      }

      let lastError = null;
      for (const u of uniqueUrls) {
          try {
              let reqUrl = u;
              if (method === 'GET' && pass) {
                  const sep = reqUrl.includes('?') ? '&' : '?';
                  reqUrl += `${sep}admin_key=${encodeURIComponent(pass)}&api_token=${encodeURIComponent(pass)}&token=${encodeURIComponent(pass)}`;
              }

              const fetchOptions = {
                  method: method,
                  headers: requestHeaders,
                  credentials: 'include'
              };

              if (method !== 'GET' && payload !== null) {
                  fetchOptions.body = JSON.stringify(payload);
              }

              const fetchFn = (typeof CryptoTransport !== 'undefined' && CryptoTransport.secureFetch) 
                  ? CryptoTransport.secureFetch 
                  : fetch;

              const res = await fetchFn(reqUrl, fetchOptions);
              const text = await res.text();
              let data = null;
              try {
                  data = JSON.parse(text);
              } catch (e) {}

              if (res.ok && data && data.success !== false) {
                  return data;
              } else if (data && data.success === true) {
                  return data;
              } else if (data && data.message) {
                  lastError = new Error(data.message);
              } else if (!res.ok) {
                  lastError = new Error(`HTTP ${res.status}: ${res.statusText}`);
              }
          } catch (e) {
              lastError = e;
          }
      }
      throw lastError || new Error('Failed to reach admin API endpoint');
  }

  function fetchWormholeDevices() {
      const tbody = document.getElementById('adminWormholeDevicesBody');
      if (tbody) {
          tbody.innerHTML = '<tr><td colspan="9" style="padding: 16px; text-align: center; color: var(--text-muted);">Querying hardware telemetry database...</td></tr>';
      }

      callAdminWormholeApi('get_wormhole_devices', 'GET')
      .then(res => {
          if (!res.success) {
              if (tbody) tbody.innerHTML = `<tr><td colspan="9" style="padding: 16px; text-align: center; color: #ef476f;">Error: ${res.message || 'Failed to load devices'}</td></tr>`;
              return;
          }

          cachedWormholeDevices = res.devices || [];

          // Update metrics
          const mTotal = document.getElementById('metricTotalDevices');
          const mSupp = document.getElementById('metricSupportedDevices');
          const mUnsupp = document.getElementById('metricUnsupportedDevices');
          const mVr = document.getElementById('metricVrDevices');
          const badge = document.getElementById('wormholeDeviceBadge');

          if (mTotal) mTotal.textContent = res.total || 0;
          if (mSupp) mSupp.textContent = res.supported || 0;
          if (mUnsupp) mUnsupp.textContent = res.unsupported || 0;
          if (mVr) mVr.textContent = (res.vr_count || 0) + (res.mobile_count || 0);

          if (badge) {
              badge.textContent = res.total || 0;
              badge.style.display = (res.total > 0) ? 'inline-block' : 'none';
          }
          const badgeCount = document.getElementById('badgeDeviceCount');
          if (badgeCount) {
              badgeCount.textContent = res.total || 0;
          }

          renderWormholeDevices(cachedWormholeDevices);
      })
      .catch(err => {
          console.error('[Admin] Wormhole device fetch error:', err);
          if (tbody) tbody.innerHTML = `<tr><td colspan="9" style="padding: 16px; text-align: center; color: #ef476f;">Network or Server Error: ${err.message}</td></tr>`;
      });
  }

  function renderWormholeDevices(devices) {
      const tbody = document.getElementById('adminWormholeDevicesBody');
      if (!tbody) return;

      if (!devices || devices.length === 0) {
          tbody.innerHTML = '<tr><td colspan="9" style="padding: 24px; text-align: center; color: var(--text-muted);">No hardware devices currently registered in database. Click <strong>[ðŸŒ± Seed Certified XR Devices]</strong> or <strong>[+ Add Device]</strong> to populate.</td></tr>';
          return;
      }

      let html = '';
      devices.forEach(d => {
          const isSupp = parseInt(d.is_supported, 10) === 1;
          const statusBadge = isSupp
              ? '<span style="background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid #10b981; padding: 2px 8px; border-radius: 12px; font-size: 0.72rem; font-weight: bold;">âœ“ SUPPORTED</span>'
              : '<span style="background: rgba(239, 68, 111, 0.2); color: #ef476f; border: 1px solid #ef476f; padding: 2px 8px; border-radius: 12px; font-size: 0.72rem; font-weight: bold;">âœ— BLOCKED</span>';

          const typePill = `<span style="background: rgba(0, 240, 255, 0.1); color: #00f0ff; border: 1px solid rgba(0, 240, 255, 0.3); padding: 1px 6px; border-radius: 4px; font-size: 0.72rem; text-transform: uppercase;">${escapeHtml(d.device_type || 'unknown')}</span>`;

          const modes = (d.supported_modes || '').split(',').map(m => `<span style="background: rgba(255,255,255,0.06); padding: 1px 5px; border-radius: 3px; font-size: 0.7rem; margin-right: 3px;">${escapeHtml(m.trim())}</span>`).join('');

          html += `
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.2s;" onmouseover="this.style.background='rgba(0, 240, 255, 0.05)'" onmouseout="this.style.background='transparent'">
              <td style="padding: 10px 12px; font-family: monospace; color: var(--text-muted);">${d.id}</td>
              <td style="padding: 10px 12px; font-weight: bold; color: #fff;">
                  ${escapeHtml(d.device_name)}
                  ${d.notes ? `<div style="font-size: 0.72rem; color: var(--text-muted); font-weight: normal; margin-top: 2px;">${escapeHtml(d.notes)}</div>` : ''}
              </td>
              <td style="padding: 10px 12px;">${typePill}</td>
              <td style="padding: 10px 12px; font-size: 0.78rem;">
                  <div style="color: #e0f9ff;">${escapeHtml(d.os_platform || '-')}</div>
                  <div style="color: var(--text-muted); font-size: 0.72rem;">${escapeHtml(d.browser || '-')}</div>
              </td>
              <td style="padding: 10px 12px; font-size: 0.75rem; color: var(--text-dim); max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(d.gpu_renderer || '')}">
                  ${escapeHtml(d.gpu_renderer || '-')}
              </td>
              <td style="padding: 10px 12px;">${modes || '<span style="color:#ef476f;">None</span>'}</td>
              <td style="padding: 10px 12px; text-align: center;">${statusBadge}</td>
              <td style="padding: 10px 12px; text-align: center; font-family: monospace; font-weight: bold; color: #00f0ff;">${d.reported_count || 1}</td>
              <td style="padding: 10px 12px; text-align: center; white-space: nowrap;">
                  <button onclick="toggleWormholeDeviceSupport(${d.id}, ${isSupp ? 1 : 0})" class="admin-tab-btn" style="padding: 3px 8px; font-size: 0.7rem; background: rgba(255,255,255,0.06); border-color: ${isSupp ? '#ef476f' : '#10b981'}; color: ${isSupp ? '#ef476f' : '#10b981'};" title="Toggle Support State">
                      ${isSupp ? 'Block' : 'Whitelist'}
                  </button>
                  <button onclick="deleteWormholeDevice(${d.id}, '${escapeHtml(d.device_name)}')" class="admin-tab-btn" style="padding: 3px 8px; font-size: 0.7rem; background: rgba(239, 68, 111, 0.15); border-color: #ef476f; color: #ef476f; margin-left: 4px;" title="Delete Device Record">
                      Delete
                  </button>
              </td>
          </tr>
          `;
      });

      tbody.innerHTML = html;
  }

  function filterWormholeDevices() {
      const q = (document.getElementById('wormholeDeviceSearchInput')?.value || '').toLowerCase().trim();
      const filter = document.getElementById('wormholeDeviceFilterSelect')?.value || 'all';

      const filtered = cachedWormholeDevices.filter(d => {
          const matchQuery = !q || (d.device_name || '').toLowerCase().includes(q) || (d.gpu_renderer || '').toLowerCase().includes(q) || (d.os_platform || '').toLowerCase().includes(q);
          if (!matchQuery) return false;

          if (filter === 'supported') return parseInt(d.is_supported, 10) === 1;
          if (filter === 'unsupported') return parseInt(d.is_supported, 10) === 0;
          if (filter === 'vr_hmd') return d.device_type === 'vr_hmd';
          if (filter === 'mobile') return d.device_type === 'mobile' || d.device_type === 'tablet';
          if (filter === 'desktop') return d.device_type === 'desktop';
          return true;
      });

      renderWormholeDevices(filtered);
  }

  function openAddWormholeDeviceModal() {
      const m = document.getElementById('addWormholeDeviceModal');
      if (m) m.style.display = 'flex';
  }

  function closeAddWormholeDeviceModal() {
      const m = document.getElementById('addWormholeDeviceModal');
      if (m) m.style.display = 'none';
  }

  function saveManualWormholeDevice() {
      const name = document.getElementById('newDevName')?.value.trim();
      const type = document.getElementById('newDevType')?.value || 'unknown';
      const supp = document.getElementById('newDevSupported')?.value || '1';
      const os = document.getElementById('newDevOs')?.value.trim();
      const browser = document.getElementById('newDevBrowser')?.value.trim();
      const gpu = document.getElementById('newDevGpu')?.value.trim();
      const notes = document.getElementById('newDevNotes')?.value.trim();

      const modes = [];
      if (document.getElementById('chkModeDesktopXr')?.checked) modes.push('desktop-xr');
      if (document.getElementById('chkModeDesktopVr')?.checked) modes.push('desktop-vr');
      if (document.getElementById('chkModeMobileXr')?.checked) modes.push('mobile-xr');
      if (document.getElementById('chkModeMobileAr')?.checked) modes.push('mobile-ar');

      if (!name) {
          alert('Please enter a device name or model.');
          return;
      }

      const payload = {
          device_name: name,
          device_type: type,
          is_supported: supp,
          os_platform: os,
          browser: browser,
          gpu_renderer: gpu,
          supported_modes: modes.join(','),
          notes: notes
      };

      callAdminWormholeApi('add_wormhole_device', 'POST', payload)
      .then(res => {
          if (!res.success) {
              alert('Failed to register device: ' + (res.message || 'Unknown error'));
              return;
          }
          closeAddWormholeDeviceModal();
          // Reset form
          if (document.getElementById('newDevName')) document.getElementById('newDevName').value = '';
          if (document.getElementById('newDevOs')) document.getElementById('newDevOs').value = '';
          if (document.getElementById('newDevBrowser')) document.getElementById('newDevBrowser').value = '';
          if (document.getElementById('newDevGpu')) document.getElementById('newDevGpu').value = '';
          if (document.getElementById('newDevNotes')) document.getElementById('newDevNotes').value = '';
          fetchWormholeDevices();
          alert('âœ“ Device registered successfully into hardware whitelist!');
      })
      .catch(err => {
          alert('Error: ' + err.message);
      });
  }

  function toggleWormholeDeviceSupport(id, currentStatus) {
      const newStatus = (currentStatus === 1) ? 0 : 1;

      callAdminWormholeApi('update_wormhole_device', 'POST', { id: id, is_supported: newStatus })
      .then(res => {
          if (!res.success) {
              alert('Failed to update support status: ' + (res.message || 'Unknown error'));
              return;
          }
          fetchWormholeDevices();
      })
      .catch(err => alert('Error: ' + err.message));
  }

  function deleteWormholeDevice(id, name) {
      if (!confirm(`Are you sure you want to permanently delete hardware record #${id} ("${name}")?`)) {
          return;
      }

      callAdminWormholeApi('delete_wormhole_device', 'POST', { id: id })
      .then(res => {
          if (!res.success) {
              alert('Failed to delete device: ' + (res.message || 'Unknown error'));
              return;
          }
          fetchWormholeDevices();
      })
      .catch(err => alert('Error: ' + err.message));
  }

  function seedOpenSourceWormholeDevices() {
      if (!confirm('Populate the certified open-source list of WebXR & ARCore devices into the database?')) {
          return;
      }

      callAdminWormholeApi('seed_wormhole_devices', 'POST', {})
      .then(res => {
          if (!res.success) {
              alert('Seeding failed: ' + (res.message || 'Unknown error'));
              return;
          }
          fetchWormholeDevices();
          alert('âœ“ Successfully populated ' + (res.seeded_count || 14) + ' certified Open-Source XR/ARCore devices!');
      })
      .catch(err => alert('Error: ' + err.message));
  }

  // =========================================================================
  // LIVE CLIENT HARDWARE DETECTION & COMPATIBLE DEVICE CHECK DIAGNOSTICS
  // =========================================================================
  function getAdminClientGpuInfo() {
      try {
          const canvas = document.createElement('canvas');
          const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
          if (!gl) {
              return { hasWebgl: false, isWebgl2: false, renderer: 'Software / No 3D Acceleration', vendor: 'Unavailable' };
          }
          const isWebgl2 = !!canvas.getContext('webgl2');
          let renderer = gl.getParameter(gl.RENDERER);
          let vendor = gl.getParameter(gl.VENDOR);
          const dbg = gl.getExtension('WEBGL_debug_renderer_info');
          if (dbg) {
              renderer = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || renderer;
              vendor = gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) || vendor;
          }
          return {
              hasWebgl: true,
              isWebgl2: isWebgl2,
              renderer: renderer || 'WebGL Accelerated Device',
              vendor: vendor || 'Unknown Vendor'
          };
      } catch (e) {
          return { hasWebgl: false, isWebgl2: false, renderer: 'Unavailable (' + e.message + ')', vendor: 'Error' };
      }
  }

  function getAdminClientPlatformInfo() {
      const ua = navigator.userAgent || '';
      let os = 'Unknown OS';
      if (/Windows NT 10/i.test(ua)) os = 'Windows 10/11';
      else if (/Windows/i.test(ua)) os = 'Windows';
      else if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS';
      else if (/Android/i.test(ua)) os = 'Android';
      else if (/iPhone/i.test(ua)) os = 'iOS (iPhone)';
      else if (/iPad/i.test(ua)) os = 'iPadOS';
      else if (/Linux/i.test(ua)) os = 'Linux';
      else if (/OculusBrowser|Quest/i.test(ua)) os = 'Meta Horizon OS';

      let browser = 'Unknown Browser';
      if (/OculusBrowser\/([0-9.]+)/i.test(ua)) browser = 'OculusBrowser ' + RegExp.$1;
      else if (/Edg\/([0-9.]+)/i.test(ua)) browser = 'Edge ' + RegExp.$1;
      else if (/Chrome\/([0-9.]+)/i.test(ua)) browser = 'Chrome ' + RegExp.$1;
      else if (/Firefox\/([0-9.]+)/i.test(ua)) browser = 'Firefox ' + RegExp.$1;
      else if (/Safari\/([0-9.]+)/i.test(ua)) browser = 'Safari ' + RegExp.$1;

      let deviceType = 'desktop';
      if (/OculusBrowser|Quest|Pico|Vive|Vision/i.test(ua)) deviceType = 'vr_hmd';
      else if (/Android.*Mobile|iPhone/i.test(ua)) deviceType = 'mobile';
      else if (/iPad|Android(?!.*Mobile)|Tablet/i.test(ua)) deviceType = 'tablet';

      let inferredModel = 'Generic System';
      if (/Quest 3/i.test(ua)) inferredModel = 'Meta Quest 3';
      else if (/Quest 2/i.test(ua)) inferredModel = 'Meta Quest 2';
      else if (/Quest Pro/i.test(ua)) inferredModel = 'Meta Quest Pro';
      else if (/SM-S928/i.test(ua)) inferredModel = 'Samsung Galaxy S24 Ultra';
      else if (/SM-S91/i.test(ua)) inferredModel = 'Samsung Galaxy S23';
      else if (/Pixel 8/i.test(ua)) inferredModel = 'Google Pixel 8';
      else if (/Pixel 7/i.test(ua)) inferredModel = 'Google Pixel 7';
      else if (/iPhone16/i.test(ua)) inferredModel = 'iPhone 16';
      else if (/iPhone15/i.test(ua)) inferredModel = 'iPhone 15';
      else if (deviceType === 'desktop') inferredModel = 'Desktop PC / Workstation';

      return { ua, os, browser, deviceType, inferredModel };
  }

  async function checkAdminWebXrCapabilities() {
      const caps = { supported: false, vr: false, ar: false };
      if ('xr' in navigator && navigator.xr && typeof navigator.xr.isSessionSupported === 'function') {
          caps.supported = true;
          try { caps.vr = await navigator.xr.isSessionSupported('immersive-vr'); } catch (e) {}
          try { caps.ar = await navigator.xr.isSessionSupported('immersive-ar'); } catch (e) {}
      }
      return caps;
  }

  async function initLiveClientSpecs() {
      const plat = getAdminClientPlatformInfo();
      const gpu = getAdminClientGpuInfo();
      const xrCaps = await checkAdminWebXrCapabilities();

      const elOs = document.getElementById('liveClientOs');
      const elBrowser = document.getElementById('liveClientBrowser');
      const elGpu = document.getElementById('liveClientGpu');
      const elXr = document.getElementById('liveClientWebxr');

      if (elOs) elOs.textContent = `${plat.os} (${plat.deviceType.toUpperCase()})`;
      if (elBrowser) elBrowser.textContent = plat.browser;
      if (elGpu) {
          elGpu.textContent = gpu.renderer;
          elGpu.title = `${gpu.vendor} - ${gpu.renderer} (WebGL2: ${gpu.isWebgl2 ? 'YES' : 'NO'})`;
      }
      if (elXr) {
          if (xrCaps.vr || xrCaps.ar) {
              const modes = [];
              if (xrCaps.vr) modes.push('VR');
              if (xrCaps.ar) modes.push('AR');
              elXr.textContent = `Supported (${modes.join(', ')})`;
              elXr.style.color = '#10b981';
          } else if (xrCaps.supported) {
              elXr.textContent = 'WebXR API Present (No HMD Active)';
              elXr.style.color = '#7dd3fc';
          } else {
              elXr.textContent = 'Standard WebGL (No WebXR HMD)';
              elXr.style.color = 'var(--text-muted)';
          }
      }
  }

  async function runAdminLiveDeviceCheck() {
      const badge = document.getElementById('adminLiveCheckBadge');
      const resultBox = document.getElementById('liveCheckResultBox');
      if (badge) {
          badge.style.display = 'inline-block';
          badge.textContent = '⏳ RUNNING DIAGNOSTICS...';
          badge.style.background = 'rgba(0, 240, 255, 0.2)';
          badge.style.color = '#00f0ff';
      }
      if (resultBox) {
          resultBox.style.display = 'block';
          resultBox.style.background = 'rgba(0, 240, 255, 0.08)';
          resultBox.style.border = '1px solid rgba(0, 240, 255, 0.3)';
          resultBox.style.color = '#7dd3fc';
          resultBox.innerHTML = 'Querying hardware telemetry API (action=check)...';
      }

      try {
          const plat = getAdminClientPlatformInfo();
          const gpu = getAdminClientGpuInfo();
          const xrCaps = await checkAdminWebXrCapabilities();

          const payload = {
              action: 'check',
              device_name: plat.inferredModel,
              device_type: plat.deviceType,
              os_platform: plat.os,
              browser: plat.browser,
              gpu_renderer: gpu.renderer,
              immersive_vr: xrCaps.vr ? 1 : 0,
              immersive_ar: xrCaps.ar ? 1 : 0,
              has_touch: ('ontouchstart' in window || navigator.maxTouchPoints > 0) ? 1 : 0,
              has_gamepad: (typeof navigator.getGamepads === 'function') ? 1 : 0,
              mode: (xrCaps.vr ? 'desktop-vr' : (plat.deviceType === 'mobile' ? 'mobile-xr' : 'desktop-xr')),
              is_supported: gpu.hasWebgl ? 1 : 0
          };

          const res = await callAdminWormholeApi('check', 'POST', payload);

          if (badge) {
              if (res.is_supported) {
                  badge.textContent = '✓ COMPATIBLE & READY';
                  badge.style.background = 'rgba(16, 185, 129, 0.2)';
                  badge.style.color = '#10b981';
              } else {
                  badge.textContent = '✗ INCOMPATIBLE / BLOCKED';
                  badge.style.background = 'rgba(239, 68, 111, 0.2)';
                  badge.style.color = '#ef476f';
              }
          }

          if (resultBox) {
              const isSupp = !!res.is_supported;
              const modes = (res.supported_modes || 'desktop-xr').split(',').map(m => `<span style="background: rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; margin-right: 4px;">${escapeHtml(m.trim())}</span>`).join('');

              resultBox.style.background = isSupp ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 111, 0.1)';
              resultBox.style.border = `1px solid ${isSupp ? '#10b981' : '#ef476f'}`;
              resultBox.style.color = '#fff';

              resultBox.innerHTML = `
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
                      <div style="font-size: 1rem; font-weight: bold; color: ${isSupp ? '#10b981' : '#ef476f'};">
                          ${isSupp ? '✓ Hardware Validated: Compatible with Wormhole XR Cockpit' : '✗ Compatibility Check Failed: Device Blocked'}
                      </div>
                      <div style="font-size: 0.75rem; color: var(--text-muted); font-family: monospace;">
                          Device ID: ${res.device_id || 'Auto-Evaluated'} | Status: ${isSupp ? 'WHITELISTED' : 'UNSUPPORTED'}
                      </div>
                  </div>
                  <div style="font-size: 0.82rem; margin-bottom: 6px;">
                      <strong>Identified Profile:</strong> <span style="color: #00f0ff;">${escapeHtml(res.device_name || plat.inferredModel)}</span> 
                      &bull; <strong>Tested Mode:</strong> <code>${escapeHtml(payload.mode)}</code> 
                      &bull; <strong>Recommended Mode:</strong> <code>${escapeHtml(res.recommended_mode || 'desktop-xr')}</code>
                  </div>
                  ${res.reason ? `<div style="font-size: 0.8rem; color: ${isSupp ? '#a7f3d0' : '#fca5a5'}; margin-bottom: 6px;"><strong>Advisory / Reason:</strong> ${escapeHtml(res.reason)}</div>` : ''}
                  <div style="margin-top: 6px; font-size: 0.78rem;">
                      <strong>Validated Flight Modes:</strong> ${modes}
                  </div>
                  <div style="margin-top: 10px; display: flex; gap: 8px;">
                      <button onclick="fetchWormholeDevices()" class="admin-tab-btn" style="padding: 4px 10px; font-size: 0.75rem; background: rgba(255,255,255,0.08);">🔄 Refresh Registry Table</button>
                      ${!isSupp ? `<button onclick="quickWhitelistCurrentDevice('${escapeHtml(res.device_name || plat.inferredModel)}', '${escapeHtml(plat.deviceType)}', '${escapeHtml(plat.os)}', '${escapeHtml(plat.browser)}', '${escapeHtml(gpu.renderer)}')" class="admin-tab-btn" style="padding: 4px 12px; font-size: 0.75rem; background: rgba(16, 185, 129, 0.2); border-color: #10b981; color: #10b981; font-weight: bold;">+ Whitelist This Device Now</button>` : ''}
                  </div>
              `;
          }
      } catch (err) {
          console.error('[Admin] Live device check error:', err);
          if (badge) {
              badge.textContent = '⚠️ CHECK FAILED';
              badge.style.background = 'rgba(239, 68, 111, 0.2)';
              badge.style.color = '#ef476f';
          }
          if (resultBox) {
              resultBox.style.display = 'block';
              resultBox.style.background = 'rgba(239, 68, 111, 0.1)';
              resultBox.style.border = '1px solid #ef476f';
              resultBox.style.color = '#fca5a5';
              resultBox.innerHTML = `<strong>Error executing live diagnostics:</strong> ${escapeHtml(err.message)}`;
          }
      }
  }

  async function simulateDeviceCheck() {
      const nameInput = document.getElementById('simDeviceInput');
      const modeSelect = document.getElementById('simModeSelect');
      const simName = (nameInput?.value || '').trim();
      const simMode = modeSelect?.value || 'desktop-xr';

      if (!simName) {
          alert('Please enter a device model to simulate (e.g. "Meta Quest 3" or "Legacy Android").');
          if (nameInput) nameInput.focus();
          return;
      }

      const resultBox = document.getElementById('liveCheckResultBox');
      if (resultBox) {
          resultBox.style.display = 'block';
          resultBox.style.background = 'rgba(0, 240, 255, 0.08)';
          resultBox.style.border = '1px solid rgba(0, 240, 255, 0.3)';
          resultBox.style.color = '#7dd3fc';
          resultBox.innerHTML = `Simulating check for "<strong>${escapeHtml(simName)}</strong>" under mode <code>${escapeHtml(simMode)}</code>...`;
      }

      try {
          const res = await callAdminWormholeApi('check', 'POST', {
              action: 'check',
              device_name: simName,
              mode: simMode,
              is_supported: 1
          });

          if (resultBox) {
              const isSupp = !!res.is_supported;
              resultBox.style.background = isSupp ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 111, 0.1)';
              resultBox.style.border = `1px solid ${isSupp ? '#10b981' : '#ef476f'}`;
              resultBox.style.color = '#fff';

              resultBox.innerHTML = `
                  <div style="font-size: 0.95rem; font-weight: bold; color: ${isSupp ? '#10b981' : '#ef476f'}; margin-bottom: 4px;">
                      ${isSupp ? '✓ Simulated Check: Whitelisted & Permitted' : '✗ Simulated Check: Incompatible / Rejected'}
                  </div>
                  <div style="font-size: 0.82rem; margin-bottom: 4px;">
                      <strong>Device:</strong> ${escapeHtml(res.device_name || simName)} &bull; <strong>Requested Mode:</strong> <code>${escapeHtml(simMode)}</code> &bull; <strong>Permitted Modes:</strong> <code>${escapeHtml(res.supported_modes || 'None')}</code>
                  </div>
                  <div style="font-size: 0.8rem; color: ${isSupp ? '#a7f3d0' : '#fca5a5'};">
                      <strong>Result Notes:</strong> ${escapeHtml(res.reason || (isSupp ? 'Device model validated in hardware registry.' : 'Device model not supported for this mode.'))}
                  </div>
              `;
          }
      } catch (err) {
          if (resultBox) {
              resultBox.style.background = 'rgba(239, 68, 111, 0.1)';
              resultBox.style.border = '1px solid #ef476f';
              resultBox.style.color = '#fca5a5';
              resultBox.innerHTML = `Simulation error: ${escapeHtml(err.message)}`;
          }
      }
  }

  async function quickWhitelistCurrentDevice(name, type, os, browser, gpu) {
      try {
          const payload = {
              device_name: name,
              device_type: type || 'desktop',
              is_supported: 1,
              os_platform: os || '',
              browser: browser || '',
              gpu_renderer: gpu || '',
              supported_modes: 'desktop-xr,desktop-vr,mobile-xr,mobile-ar',
              notes: 'Manually whitelisted via Admin Live Device Check'
          };
          const res = await callAdminWormholeApi('add_wormhole_device', 'POST', payload);
          if (res.success) {
              alert(`✓ Successfully whitelisted "${name}" in hardware registry!`);
              fetchWormholeDevices();
              runAdminLiveDeviceCheck();
          } else {
              alert('Failed to whitelist: ' + (res.message || 'Unknown error'));
          }
      } catch (e) {
          alert('Error: ' + e.message);
      }
  }

  // =========================================================================
  // GAME MANAGER SUB-TABS NAVIGATION & STAGES PROGRESSION
  // =========================================================================
  let activeGameManagerSubTab = 'devices';
  let cachedGameStages = [];
  let cachedGameEnemies = [];

  function switchGameManagerSubTab(subTab) {
      const normalized = (subTab || 'devices').toLowerCase().trim();
      let target = 'devices';
      if (normalized === 'stages' || normalized === 'stage' || normalized === 'levels' || normalized === 'level') {
          target = 'stages';
      } else if (normalized === 'weapons' || normalized === 'weapon' || normalized === 'arsenal') {
          target = 'weapons';
      } else if (normalized === 'enemies' || normalized === 'enemy' || normalized === 'threats') {
          target = 'enemies';
      } else {
          target = 'devices';
      }
      activeGameManagerSubTab = target;

      const btnDevices = document.getElementById('gmSubTabBtnDevices');
      const btnStages = document.getElementById('gmSubTabBtnStages');
      const btnWeapons = document.getElementById('gmSubTabBtnWeapons');
      const btnEnemies = document.getElementById('gmSubTabBtnEnemies');

      const panelDevices = document.getElementById('gmSubTabPanelDevices');
      const panelStages = document.getElementById('gmSubTabPanelStages');
      const panelWeapons = document.getElementById('gmSubTabPanelWeapons');
      const panelEnemies = document.getElementById('gmSubTabPanelEnemies');

      if (btnDevices) btnDevices.classList.toggle('active', target === 'devices');
      if (btnStages) btnStages.classList.toggle('active', target === 'stages');
      if (btnWeapons) btnWeapons.classList.toggle('active', target === 'weapons');
      if (btnEnemies) btnEnemies.classList.toggle('active', target === 'enemies');

      if (panelDevices) panelDevices.style.display = (target === 'devices') ? 'block' : 'none';
      if (panelStages) panelStages.style.display = (target === 'stages') ? 'block' : 'none';
      if (panelWeapons) panelWeapons.style.display = (target === 'weapons') ? 'block' : 'none';
      if (panelEnemies) panelEnemies.style.display = (target === 'enemies') ? 'block' : 'none';

      if (target === 'devices') {
          initLiveClientSpecs();
          fetchWormholeDevices();
      } else if (target === 'stages') {
          fetchGameStages();
      } else if (target === 'weapons') {
          fetchGameWeapons();
      } else if (target === 'enemies') {
          fetchGameEnemies();
      }
  }

  // =========================================================================
  // SUB-TAB 1: WORMHOLE GAME STAGES & LEVEL PROGRESSION
  // =========================================================================
  async function fetchGameStages() {
      const tbody = document.getElementById('adminGameStagesBody');
      if (tbody) {
          tbody.innerHTML = '<tr><td colspan="8" style="padding: 16px; text-align: center; color: var(--text-muted);">Querying stages and level progression...</td></tr>';
      }

      try {
          const res = await callAdminWormholeApi('get_game_stages', 'GET');
          cachedGameStages = (res && res.stages) ? res.stages : [];

          // If empty, use sensible defaults
          if (!cachedGameStages || cachedGameStages.length === 0) {
              cachedGameStages = [
                  { id: 1, stage_level: 1, stage_name: 'Warp Origin', environment_theme: 'Warp Cyan Corridor', events_within_level: 'Sub-space Entry, Nav-Beacon Calibration, Asteroid Debris Belt, Anomaly Alpha Spike, Plasma Surge Alert', end_level_event: 'Warp Horizon Jump Gate Initialized', description: 'Initial entry vector into unstable hyperspace corridor.', par_score: 5000, is_enabled: 1 },
                  { id: 2, stage_level: 2, stage_name: 'Event Horizon', environment_theme: 'Event Horizon Amber', events_within_level: 'Tachyon Flux Distortions, Ion Cloud Interference, Interceptor Ambush Wave, Wormhole Coil Resonance Alert', end_level_event: 'Singularity Perimeter Breach', description: 'High-velocity relativistic light-horizon boundary with intense magnetic shear.', par_score: 12000, is_enabled: 1 },
                  { id: 3, stage_level: 3, stage_name: 'Singularity Core', environment_theme: 'Singularity Void Violet', events_within_level: 'Gravitational Tidal Waves, Singularity Probe Deployment, Heavy Antimatter Eruptions, Core Guardian Awakening', end_level_event: 'Core Collapse Breakthrough', description: 'Extreme gravitational distortion sector surrounding the black hole collapse boundary.', par_score: 25000, is_enabled: 1 },
                  { id: 4, stage_level: 4, stage_name: 'Quantum Realm', environment_theme: 'Quantum Phasor Magenta', events_within_level: 'Phase-Shift Anomalies, Multi-Dimensional Phasing, Antimatter Vortex, Quantum Dreadnought Confrontation', end_level_event: 'Quantum Conduit Realignment & Safe Extraction', description: 'Deepest reaches beyond physical spacetime.', par_score: 50000, is_enabled: 1 }
              ];
          }

          // Update stage metrics
          const metricTotalStages = document.getElementById('metricTotalStages');
          if (metricTotalStages) metricTotalStages.textContent = cachedGameStages.length;

          const badgeStages = document.getElementById('badgeStageCount');
          if (badgeStages) badgeStages.textContent = cachedGameStages.length;

          let totalEvents = 0;
          cachedGameStages.forEach(s => {
              if (s.events_within_level) {
                  const evs = s.events_within_level.split(',').filter(e => e.trim().length > 0);
                  totalEvents += evs.length;
              }
          });
          const metricEvents = document.getElementById('metricTotalStageEvents');
          if (metricEvents) metricEvents.textContent = totalEvents;

          const metricEndTriggers = document.getElementById('metricEndLevelTriggers');
          if (metricEndTriggers) metricEndTriggers.textContent = cachedGameStages.filter(s => !!s.end_level_event).length;

          const metricActive = document.getElementById('metricActiveStagesCount');
          if (metricActive) metricActive.textContent = cachedGameStages.filter(s => parseInt(s.is_enabled) === 1).length;

          renderGameStages(cachedGameStages);
      } catch (err) {
          console.error('[Admin] Game stages fetch error:', err);
          if (tbody) {
              tbody.innerHTML = `<tr><td colspan="8" style="padding: 16px; text-align: center; color: #ef476f;">Error loading stages: ${escapeHtml(err.message)}</td></tr>`;
          }
      }
  }

  function renderGameStages(stages) {
      const tbody = document.getElementById('adminGameStagesBody');
      if (!tbody) return;

      if (!stages || stages.length === 0) {
          tbody.innerHTML = '<tr><td colspan="9" style="padding: 16px; text-align: center; color: var(--text-muted);">No stages found. Click "+ Add Stage" or "🌱 Reset Default Stages" to initialize.</td></tr>';
          return;
      }

      tbody.innerHTML = stages.map(s => {
          const isActive = parseInt(s.is_enabled) === 1;
          const stageNum = parseInt(s.stage_level || 1);
          const stageName = escapeHtml(s.stage_name || `Stage ${stageNum}`);
          const theme = escapeHtml(s.environment_theme || 'Warp Cyan Corridor');
          const endEvent = escapeHtml(s.end_level_event || 'Level Complete Trigger');
          const parScore = s.par_score ? parseInt(s.par_score).toLocaleString() : '5,000';
          const requiredKills = parseInt(s.required_enemy_kills || 10);
          const warpDist = parseInt(s.warp_target_distance || 50000).toLocaleString();
          const objectivesDesc = escapeHtml(s.mission_objectives || `Destroy ${requiredKills} enemies & approach within < ${warpDist} KM of wormhole`);

          // Split events into stylish pills
          const eventsList = (s.events_within_level || '')
              .split(',')
              .map(e => e.trim())
              .filter(e => e.length > 0);

          const eventsHtml = eventsList.length > 0
              ? eventsList.map(e => `<span class="event-tag-pill" title="In-Level Event">${escapeHtml(e)}</span>`).join('')
              : '<span style="color:var(--text-muted);font-size:0.78rem;">No events configured</span>';

          const statusBtn = isActive
              ? `<span class="status-badge-box active" style="display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:6px 15px;min-width:100px;border-radius:8px;background:rgba(16,185,129,0.22);border:1.5px solid #10b981;color:#10b981;font-size:0.80rem;font-weight:800;white-space:nowrap;box-sizing:border-box;box-shadow:0 0 8px rgba(16,185,129,0.25);"><span style="font-size:0.9rem;">✓</span><span>Active</span></span>`
              : `<span class="status-badge-box inactive" style="display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:6px 15px;min-width:100px;border-radius:8px;background:rgba(239,68,111,0.22);border:1.5px solid #ef476f;color:#ef476f;font-size:0.80rem;font-weight:800;white-space:nowrap;box-sizing:border-box;box-shadow:0 0 8px rgba(239,68,111,0.25);"><span style="font-size:0.9rem;">⏸️</span><span>Inactive</span></span>`;

          return `
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.06); transition: background 0.15s ease;">
                  <td style="padding: 10px 14px; text-align: center;">
                      <span class="stage-badge-box" style="display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:6px 15px;min-width:100px;font-size:0.84rem;background:rgba(0,240,255,0.18);border:1.5px solid #00f0ff;border-radius:8px;color:#00f0ff;font-weight:800;white-space:nowrap;box-sizing:border-box;box-shadow:0 0 8px rgba(0,240,255,0.25);">
                          <span style="font-size:0.95rem;">🗺️</span>
                          <span>Stage ${stageNum}</span>
                      </span>
                  </td>
                  <td style="padding: 10px 12px;">
                      <div style="font-weight: bold; color: #fff; font-size: 0.95rem; display: flex; align-items: center; gap: 6px;">
                          <span>${stageName}</span>
                          <button onclick="openEditGameStageModal(${s.id})" title="Edit stage name and configuration" style="background:none;border:none;color:#00f0ff;cursor:pointer;font-size:0.8rem;padding:0;">✏️</button>
                      </div>
                      ${s.description ? `<div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 3px;">${escapeHtml(s.description)}</div>` : ''}
                  </td>
                  <td style="padding: 10px 14px; text-align: left; min-width: 185px;">
                      <span class="stage-theme-badge-box" style="display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:7px 18px;min-width:175px;font-size:0.83rem;background:rgba(16,185,129,0.16);border:1.5px solid rgba(16,185,129,0.5);border-radius:8px;color:#a7f3d0;font-weight:700;white-space:nowrap;box-sizing:border-box;box-shadow:0 0 10px rgba(16,185,129,0.22);overflow:visible;">
                          <span style="font-size:0.95rem;">🎨</span>
                          <span>${theme}</span>
                      </span>
                  </td>
                  <td style="padding: 10px 12px; min-width: 280px;">
                      <div style="display: flex; gap: 6px; align-items: center; margin-bottom: 4px; flex-wrap: wrap;">
                          <span style="font-size: 0.74rem; font-weight: bold; background: rgba(16,185,129,0.2); border: 1px solid #10b981; color: #6ee7b7; padding: 2px 7px; border-radius: 4px;">🎯 ${requiredKills} Kills</span>
                          <span style="font-size: 0.74rem; font-weight: bold; background: rgba(0,240,255,0.2); border: 1px solid #00f0ff; color: #67e8f9; padding: 2px 7px; border-radius: 4px;">🌌 &lt; ${warpDist} KM</span>
                      </div>
                      <div style="font-size: 0.75rem; color: #cbd5e1; line-height: 1.3;">${objectivesDesc}</div>
                  </td>
                  <td style="padding: 10px 12px; max-width: 380px;">
                      <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                          ${eventsHtml}
                      </div>
                  </td>
                  <td style="padding: 10px 12px;">
                      <div class="end-event-pill" title="Event that ends this level">
                          <span>🏁</span>
                          <span>${endEvent}</span>
                      </div>
                  </td>
                  <td style="padding: 10px 12px; text-align: center;">
                      <span style="color: #f59e0b; font-weight: bold; font-family: monospace; font-size: 0.88rem;">${parScore}</span>
                  </td>
                  <td style="padding: 10px 14px; text-align: center;">
                      ${statusBtn}
                  </td>
                  <td style="padding: 10px 12px; text-align: center;">
                      <div style="display: flex; gap: 6px; justify-content: center;">
                          <button onclick="openEditGameStageModal(${s.id})" class="admin-tab-btn" style="padding: 4px 10px; font-size: 0.78rem; background: rgba(0,240,255,0.15); border-color: #00f0ff; color: #00f0ff; cursor: pointer;">✏️ Edit</button>
                          <button onclick="deleteGameStage(${s.id}, '${stageName}')" class="admin-tab-btn" style="padding: 4px 8px; font-size: 0.78rem; background: rgba(239,68,111,0.15); border-color: #ef476f; color: #ef476f; cursor: pointer;" title="Delete stage">🗑️</button>
                      </div>
                  </td>
              </tr>
          `;
      }).join('');
  }

  function filterGameStages() {
      const q = (document.getElementById('gameStageSearchInput')?.value || '').toLowerCase().trim();
      const filtered = cachedGameStages.filter(s => {
          if (!q) return true;
          return (s.stage_name && s.stage_name.toLowerCase().includes(q)) ||
                 (s.events_within_level && s.events_within_level.toLowerCase().includes(q)) ||
                 (s.end_level_event && s.end_level_event.toLowerCase().includes(q)) ||
                 (s.environment_theme && s.environment_theme.toLowerCase().includes(q)) ||
                 (s.mission_objectives && s.mission_objectives.toLowerCase().includes(q)) ||
                 (s.description && s.description.toLowerCase().includes(q));
      });
      renderGameStages(filtered);
  }

  function openAddGameStageModal() {
      const title = document.getElementById('stageModalTitle');
      if (title) title.innerHTML = '<span>🗺️ Add Stage & Level Events</span>';

      document.getElementById('stageRecordId').value = '0';
      const nextLevel = cachedGameStages.length > 0 ? Math.max(...cachedGameStages.map(s => parseInt(s.stage_level || 0))) + 1 : 1;
      document.getElementById('stageLevelNumber').value = nextLevel;
      document.getElementById('stageNameInput').value = '';
      document.getElementById('stageThemeInput').value = 'Warp Cyan Corridor';
      if (document.getElementById('stageEnemyKillsInput')) document.getElementById('stageEnemyKillsInput').value = '10';
      if (document.getElementById('stageWarpDistanceInput')) document.getElementById('stageWarpDistanceInput').value = '50000';
      if (document.getElementById('stageObjectivesInput')) document.getElementById('stageObjectivesInput').value = 'Destroy 10 hostiles and close within 50,000 KM of wormhole singularity to authorize warp jump.';
      document.getElementById('stageParScoreInput').value = '5000';
      document.getElementById('stageEventsWithinInput').value = '';
      document.getElementById('stageEndLevelEventInput').value = '';
      document.getElementById('stageDescriptionInput').value = '';
      document.getElementById('stageIsEnabledInput').checked = true;

      const modal = document.getElementById('editGameStageModal');
      if (modal) modal.style.display = 'flex';
  }

  function openEditGameStageModal(id) {
      const stage = cachedGameStages.find(s => parseInt(s.id) === parseInt(id));
      if (!stage) {
          alert('Stage not found in cache');
          return;
      }

      const title = document.getElementById('stageModalTitle');
      if (title) title.innerHTML = `<span>🗺️ Edit Stage ${stage.stage_level}: ${escapeHtml(stage.stage_name)}</span>`;

      document.getElementById('stageRecordId').value = stage.id;
      document.getElementById('stageLevelNumber').value = stage.stage_level || 1;
      document.getElementById('stageNameInput').value = stage.stage_name || '';
      document.getElementById('stageThemeInput').value = stage.environment_theme || 'Warp Cyan Corridor';
      if (document.getElementById('stageEnemyKillsInput')) document.getElementById('stageEnemyKillsInput').value = stage.required_enemy_kills || 10;
      if (document.getElementById('stageWarpDistanceInput')) document.getElementById('stageWarpDistanceInput').value = stage.warp_target_distance || 50000;
      if (document.getElementById('stageObjectivesInput')) document.getElementById('stageObjectivesInput').value = stage.mission_objectives || '';
      document.getElementById('stageParScoreInput').value = stage.par_score || 5000;
      document.getElementById('stageEventsWithinInput').value = stage.events_within_level || '';
      document.getElementById('stageEndLevelEventInput').value = stage.end_level_event || '';
      document.getElementById('stageDescriptionInput').value = stage.description || '';
      document.getElementById('stageIsEnabledInput').checked = parseInt(stage.is_enabled) === 1;

      const modal = document.getElementById('editGameStageModal');
      if (modal) modal.style.display = 'flex';
  }

  function closeEditGameStageModal() {
      const modal = document.getElementById('editGameStageModal');
      if (modal) modal.style.display = 'none';
  }

  async function saveGameStage() {
      const id = parseInt(document.getElementById('stageRecordId').value || 0);
      const stageLevel = parseInt(document.getElementById('stageLevelNumber').value || 1);
      const stageName = (document.getElementById('stageNameInput').value || '').trim();
      const theme = (document.getElementById('stageThemeInput').value || '').trim();
      const kills = parseInt(document.getElementById('stageEnemyKillsInput')?.value || 10);
      const warpDistance = parseInt(document.getElementById('stageWarpDistanceInput')?.value || 50000);
      const objectives = (document.getElementById('stageObjectivesInput')?.value || '').trim();
      const parScore = parseInt(document.getElementById('stageParScoreInput').value || 5000);
      const eventsWithin = (document.getElementById('stageEventsWithinInput').value || '').trim();
      const endEvent = (document.getElementById('stageEndLevelEventInput').value || '').trim();
      const desc = (document.getElementById('stageDescriptionInput').value || '').trim();
      const isEnabled = document.getElementById('stageIsEnabledInput').checked ? 1 : 0;

      if (!stageName) {
          alert('Stage / Level Name is required!');
          return;
      }
      if (!eventsWithin) {
          alert('Please enter at least one event that occurs within this level.');
          return;
      }
      if (!endEvent) {
          alert('Please enter the event that ends the level.');
          return;
      }

      const payload = {
          id: id,
          stage_level: stageLevel,
          stage_name: stageName,
          environment_theme: theme,
          required_enemy_kills: kills,
          warp_target_distance: warpDistance,
          mission_objectives: objectives,
          events_within_level: eventsWithin,
          end_level_event: endEvent,
          description: desc,
          par_score: parScore,
          is_enabled: isEnabled
      };

      try {
          const res = await callAdminWormholeApi('save_game_stage', 'POST', payload);
          let successMsg = res.message || 'Stage saved successfully!';
          if (res.stage_slug) {
              successMsg += `\n\n📁 Stage profile JS created in mobile, desktop, arcore, and vr directories.\n🔊 Empty audio directory initialized: ${res.stage_slug}`;
          }
          alert(successMsg);
          closeEditGameStageModal();
          fetchGameStages();
      } catch (err) {
          console.error('[Admin] Save stage error:', err);
          alert('Failed to save stage: ' + err.message);
      }
  }

  async function deleteGameStage(id, name) {
      if (!confirm(`Are you sure you want to delete Stage '${name}'?`)) {
          return;
      }

      try {
          const res = await callAdminWormholeApi('delete_game_stage', 'POST', { id: id });
          alert(res.message || 'Stage deleted successfully');
          fetchGameStages();
      } catch (err) {
          console.error('[Admin] Delete stage error:', err);
          alert('Failed to delete stage: ' + err.message);
      }
  }

  async function seedDefaultGameStages() {
      if (!confirm('Re-seed / Reset default stages (Warp Origin, Event Horizon, Singularity Core, Quantum Realm)?')) {
          return;
      }

      try {
          const res = await callAdminWormholeApi('seed_game_stages', 'POST', {});
          alert(res.message || 'Default stages initialized successfully!');
          fetchGameStages();
      } catch (err) {
          console.error('[Admin] Seed stages error:', err);
          alert('Failed to seed default stages: ' + err.message);
      }
  }

  async function syncAllStageFiles() {
      try {
          const res = await callAdminWormholeApi('sync_all_stage_files', 'POST', {});
          let msg = res.message || 'Stage files and empty audio folders synchronized successfully!';
          if (res.files_count) {
              msg += `\n\n📄 Total Files Created/Updated: ${res.files_count}\n🔊 Audio Folders Created: ${res.audio_folders_count || 0}`;
          }
          alert(msg);
          fetchGameStages();
      } catch (err) {
          console.error('[Admin] Sync stage files error:', err);
          alert('Failed to sync stage files: ' + err.message);
      }
  }

  // =========================================================================
  // SUB-TAB 3: WORMHOLE GAME ENEMIES & THREAT REGISTRY
  // =========================================================================
  async function fetchGameEnemies() {
      const tbody = document.getElementById('adminGameEnemiesBody');
      if (tbody) {
          tbody.innerHTML = '<tr><td colspan="10" style="padding: 16px; text-align: center; color: var(--text-muted);">Querying enemies threat registry...</td></tr>';
      }

      try {
          const res = await callAdminWormholeApi('get_game_enemies', 'GET');
          cachedGameEnemies = (res && res.enemies) ? res.enemies : [];

          // Sensible default fallback if DB table not yet populated
          if (!cachedGameEnemies || cachedGameEnemies.length === 0) {
              cachedGameEnemies = [
                  { id: 1, enemy_id: 'void_recon_drone', enemy_name: 'Void Recon Drone', enemy_class: 'Scout Drone', icon: '🛸', color_hex: '#00f0ff', stage_level: 1, hits_to_destroy: 2, piercing_weapon_id: 'any', armor_strength: 10, has_force_field: 0, shield_capacity_hits: 0, movement_speed: 320, attack_damage: 5, fire_rate_seconds: 2.5, score_value: 100, threat_level: 'Low', description: 'Light autonomous scout probe sent to map entry corridor geometry.', is_enabled: 1 },
                  { id: 2, enemy_id: 'phase_interceptor', enemy_name: 'Phase Interceptor', enemy_class: 'Fast Interceptor', icon: '🚀', color_hex: '#38bdf8', stage_level: 1, hits_to_destroy: 4, piercing_weapon_id: 'red_laser', armor_strength: 25, has_force_field: 1, shield_capacity_hits: 2, movement_speed: 420, attack_damage: 10, fire_rate_seconds: 1.8, score_value: 250, threat_level: 'Medium', description: 'High-agility skirmisher equipped with a polarized light shield. Pierced by Neon Red Laser.', is_enabled: 1 },
                  { id: 3, enemy_id: 'tachyon_cruiser', enemy_name: 'Horizon Tachyon Cruiser', enemy_class: 'Heavy Cruiser', icon: '🛰️', color_hex: '#ffd166', stage_level: 2, hits_to_destroy: 8, piercing_weapon_id: 'tachyon_lance', armor_strength: 50, has_force_field: 1, shield_capacity_hits: 4, movement_speed: 200, attack_damage: 20, fire_rate_seconds: 3.0, score_value: 500, threat_level: 'High', description: 'Reinforced hull traversing relativistic space. Shields pierced by Tachyon Lance.', is_enabled: 1 },
                  { id: 4, enemy_id: 'void_guardian', enemy_name: 'Singularity Void Guardian', enemy_class: 'Guardian Frigate', icon: '👾', color_hex: '#a855f7', stage_level: 3, hits_to_destroy: 15, piercing_weapon_id: 'plasma_torpedo', armor_strength: 70, has_force_field: 1, shield_capacity_hits: 6, movement_speed: 150, attack_damage: 35, fire_rate_seconds: 2.2, score_value: 1000, threat_level: 'High', description: 'Ancient automaton defending singularity core. Dense armor broken by Quantum Plasma Torpedoes.', is_enabled: 1 },
                  { id: 5, enemy_id: 'quantum_dreadnought', enemy_name: 'Quantum Omega Dreadnought', enemy_class: 'Boss Dreadnought', icon: '💀', color_hex: '#ef476f', stage_level: 4, hits_to_destroy: 35, piercing_weapon_id: 'quantum_phaser', armor_strength: 90, has_force_field: 1, shield_capacity_hits: 15, movement_speed: 90, attack_damage: 60, fire_rate_seconds: 1.2, score_value: 5000, threat_level: 'Extreme', description: 'Colossal multi-phase flagship commanding deep realm forces. Impervious nanite armor.', is_enabled: 1 }
              ];
          }

          // Update metrics
          const metricTotal = document.getElementById('metricTotalEnemies');
          if (metricTotal) metricTotal.textContent = cachedGameEnemies.length;

          const badgeEnemies = document.getElementById('badgeEnemyCount');
          if (badgeEnemies) badgeEnemies.textContent = cachedGameEnemies.length;

          const forceFieldCount = cachedGameEnemies.filter(e => parseInt(e.has_force_field) === 1).length;
          const metricShield = document.getElementById('metricForceFieldEnemies');
          if (metricShield) metricShield.textContent = forceFieldCount;

          const heavyArmorCount = cachedGameEnemies.filter(e => parseInt(e.armor_strength || 0) >= 50).length;
          const metricHeavy = document.getElementById('metricHeavyArmorEnemies');
          if (metricHeavy) metricHeavy.textContent = heavyArmorCount;

          const bossCount = cachedGameEnemies.filter(e => (e.threat_level || '').toLowerCase().includes('extreme') || (e.threat_level || '').toLowerCase().includes('boss')).length;
          const metricBoss = document.getElementById('metricBossThreats');
          if (metricBoss) metricBoss.textContent = bossCount;

          populateEnemyPiercingWeaponDropdown();
          populateCloneEnemyDropdown();
          renderGameEnemies(cachedGameEnemies);
      } catch (err) {
          console.error('[Admin] Game enemies fetch error:', err);
          if (tbody) {
              tbody.innerHTML = `<tr><td colspan="10" style="padding: 16px; text-align: center; color: #ef476f;">Error loading enemies: ${escapeHtml(err.message)}</td></tr>`;
          }
      }
  }

  function getWeaponDisplayName(weaponId) {
      if (!weaponId || weaponId === 'any') return '✨ Any Weapon';
      if (cachedGameWeapons && cachedGameWeapons.length > 0) {
          const match = cachedGameWeapons.find(w => w.weapon_id === weaponId);
          if (match) return `${match.icon || '⚡'} ${match.weapon_name}`;
      }
      const known = {
          'red_laser': '🔴 Neon Red Laser',
          'blue_laser': '🔵 Cobalt Blue Laser',
          'tachyon_lance': '⚡ Tachyon Lance',
          'plasma_torpedo': '💣 Quantum Plasma Torpedo',
          'quantum_phaser': '✨ Quantum Phaser Cannon'
      };
      return known[weaponId] || `🔫 ${weaponId}`;
  }

  function renderGameEnemies(enemies) {
      const tbody = document.getElementById('adminGameEnemiesBody');
      if (!tbody) return;

      if (!enemies || enemies.length === 0) {
          tbody.innerHTML = '<tr><td colspan="12" style="padding: 16px; text-align: center; color: var(--text-muted);">No enemies registered. Click "+ Add Enemy" or "🌱 Reset Default Enemies" to initialize.</td></tr>';
          return;
      }

      tbody.innerHTML = enemies.map(e => {
          const icon = escapeHtml(e.icon || '🛸');
          const color = escapeHtml(e.color_hex || '#ef476f');
          const model3dType = escapeHtml(e.model_3d_type || 'scout_drone');
          const model3dLabel = model3dType.replace(/_/g, ' ').toUpperCase();
          const weaponName = escapeHtml(e.weapon_name || 'Plasma Bolt');
          const weaponDmg = parseInt(e.weapon_damage || 5);
          const weaponSpeed = parseInt(e.weapon_speed || 450);
          const weaponColor = escapeHtml(e.weapon_color || '#ff0055');
          const hits = parseInt(e.hits_to_destroy || 1);
          const armor = parseInt(e.armor_strength || 0);
          const hasField = parseInt(e.has_force_field) === 1;
          const shieldHits = parseInt(e.shield_capacity_hits || 0);
          const pierceDisplay = escapeHtml(getWeaponDisplayName(e.piercing_weapon_id));
          const threat = escapeHtml(e.threat_level || 'Low');
          const speed = parseInt(e.movement_speed || 250);
          const score = parseInt(e.score_value || 100).toLocaleString();
          const scale = parseFloat(e.scale !== undefined && e.scale !== null ? e.scale : 1.0).toFixed(2);
          const length = parseFloat(e.length !== undefined && e.length !== null ? e.length : 3.0).toFixed(1);
          const height = parseFloat(e.height !== undefined && e.height !== null ? e.height : 1.5).toFixed(1);
          const depth = parseFloat(e.depth !== undefined && e.depth !== null ? e.depth : 3.0).toFixed(1);
          const circumference = parseFloat(e.circumference !== undefined && e.circumference !== null ? e.circumference : 6.0).toFixed(1);
          const radius = (parseFloat(circumference) / (2 * Math.PI)).toFixed(2);

          // Device badge
          const devType = (e.device_type || 'desktop').toLowerCase();
          let devBadge = '<span style="background:rgba(56,189,248,0.18);border:1px solid #38bdf8;color:#38bdf8;padding:3px 8px;border-radius:6px;font-size:0.75rem;font-weight:bold;white-space:nowrap;">💻 Desktop</span>';
          if (devType === 'mobile') {
              devBadge = '<span style="background:rgba(239,68,111,0.18);border:1px solid #ef476f;color:#ff4d6d;padding:3px 8px;border-radius:6px;font-size:0.75rem;font-weight:bold;white-space:nowrap;">📱 Mobile</span>';
          } else if (devType === 'vr') {
              devBadge = '<span style="background:rgba(168,85,247,0.18);border:1px solid #a855f7;color:#c084fc;padding:3px 8px;border-radius:6px;font-size:0.75rem;font-weight:bold;white-space:nowrap;">🥽 VR Headset</span>';
          } else if (devType === 'arcore') {
              devBadge = '<span style="background:rgba(16,185,129,0.18);border:1px solid #10b981;color:#10b981;padding:3px 8px;border-radius:6px;font-size:0.75rem;font-weight:bold;white-space:nowrap;">📱 ARCore</span>';
          } else if (devType === 'all') {
              devBadge = '<span style="background:rgba(255,215,0,0.18);border:1px solid #ffd700;color:#ffd700;padding:3px 8px;border-radius:6px;font-size:0.75rem;font-weight:bold;white-space:nowrap;">🌐 Universal</span>';
          }

          // Threat badge color
          let threatColor = '#10b981';
          if (threat.toLowerCase().includes('medium')) threatColor = '#f59e0b';
          else if (threat.toLowerCase().includes('high')) threatColor = '#ff6b6b';
          else if (threat.toLowerCase().includes('extreme') || threat.toLowerCase().includes('boss')) threatColor = '#a855f7';

          // Force Field Button / Status
          const fieldBtn = hasField
              ? `<button onclick="toggleEnemyForceField(${e.id}, 1)" class="admin-tab-btn" style="background:rgba(0,240,255,0.18);border-color:#00f0ff;color:#00f0ff;font-size:0.75rem;padding:3px 8px;cursor:pointer;" title="Click to disable force field">⚡ Yes (${shieldHits} hit shield)</button>`
              : `<button onclick="toggleEnemyForceField(${e.id}, 0)" class="admin-tab-btn" style="background:rgba(255,255,255,0.05);border-color:#475569;color:var(--text-muted);font-size:0.75rem;padding:3px 8px;cursor:pointer;" title="Click to enable force field">❌ No Force Field</button>`;

          return `
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.06); transition: background 0.15s ease;">
                  <td style="padding: 10px 14px; text-align: center;">
                      <span class="enemy-icon-badge-box" style="display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:6px 12px;min-width:54px;border-radius:8px;background:rgba(239,68,111,0.15);border:1.5px solid rgba(239,68,111,0.4);box-shadow:0 0 8px rgba(239,68,111,0.25);box-sizing:border-box;">
                          <span style="font-size:1.35rem;line-height:1;">${icon}</span>
                          <span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${color};box-shadow:0 0 6px ${color};"></span>
                      </span>
                  </td>
                  <td style="padding: 10px 12px;">
                      <div style="font-weight: bold; color: #fff; font-size: 0.92rem;">${escapeHtml(e.enemy_name)}</div>
                      <div style="display: flex; gap: 6px; align-items: center; margin-top: 2px;">
                          <span style="font-size: 0.73rem; color: #ff4d6d; font-family: monospace;">${escapeHtml(e.enemy_id)}</span>
                          <span style="font-size: 0.7rem; color: var(--text-muted); background: rgba(255,255,255,0.06); padding: 1px 5px; border-radius: 4px;">${escapeHtml(e.enemy_class || 'Drone')}</span>
                      </div>
                      ${e.description ? `<div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 3px;">${escapeHtml(e.description)}</div>` : ''}
                  </td>
                  <td style="padding: 10px 12px; min-width: 140px;">
                      <div style="font-weight: bold; font-size: 0.82rem; color: #00f0ff; display: flex; align-items: center; gap: 5px;">
                          <span>🛸</span>
                          <span>${model3dLabel}</span>
                      </div>
                      <div style="font-size: 0.7rem; color: var(--text-muted); font-family: monospace;">3D Procedural Mesh</div>
                  </td>
                  <td style="padding: 10px 12px; min-width: 190px;">
                      <div style="display: flex; gap: 5px; align-items: center; margin-bottom: 2px;">
                          <span style="background: rgba(16,185,129,0.2); border: 1px solid #10b981; color: #10b981; font-weight: bold; font-size: 0.76rem; padding: 1px 6px; border-radius: 4px;">Scale: ${scale}x</span>
                          <span style="font-size: 0.72rem; color: #00f0ff; font-family: monospace;">C: ${circumference}m (r: ${radius}m)</span>
                      </div>
                      <div style="font-size: 0.72rem; color: var(--text-muted); font-family: monospace;">
                          L: ${length}m &bull; H: ${height}m &bull; D: ${depth}m
                      </div>
                  </td>
                  <td style="padding: 10px 14px; text-align: center;">
                      <span class="stage-badge-box" style="display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:6px 15px;min-width:100px;font-size:0.84rem;background:rgba(0,240,255,0.18);border:1.5px solid #00f0ff;border-radius:8px;color:#00f0ff;font-weight:800;white-space:nowrap;box-sizing:border-box;box-shadow:0 0 8px rgba(0,240,255,0.25);">
                          <span style="font-size:0.95rem;">🗺️</span>
                          <span>Stage ${e.stage_level}</span>
                      </span>
                  </td>
                  <td style="padding: 10px 12px; text-align: center;">
                      ${devBadge}
                  </td>
                  <td style="padding: 10px 12px; min-width: 170px;">
                      <div style="font-weight: bold; font-size: 0.82rem; color: #ff6b8b; display: flex; align-items: center; gap: 5px;">
                          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${weaponColor};box-shadow:0 0 6px ${weaponColor};"></span>
                          <span>${weaponName}</span>
                      </div>
                      <div style="font-size: 0.72rem; color: #fb7185;">💥 ${weaponDmg} Dmg | ⚡ ${weaponSpeed} spd</div>
                  </td>
                  <td style="padding: 10px 12px; text-align: center;">
                      <span style="color: #00f0ff; font-weight: bold; font-size: 0.98rem; text-shadow: 0 0 8px rgba(0,240,255,0.35);">💥 ${hits} Hit${hits > 1 ? 's' : ''}</span>
                  </td>
                  <td style="padding: 10px 12px;">
                      <div style="font-size: 0.82rem; font-weight: bold; color: #fff;">${pierceDisplay}</div>
                      <div style="font-size: 0.7rem; color: var(--text-muted);">Required to pierce armor</div>
                  </td>
                  <td style="padding: 10px 12px;">
                      <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 3px;">
                          <span style="color: #f59e0b; font-weight: bold;">🛡️ ${armor}%</span>
                          <span style="color: var(--text-muted); font-size: 0.72rem;">${armor >= 70 ? 'Reinforced' : (armor >= 30 ? 'Medium' : 'Light')}</span>
                      </div>
                      <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden;">
                          <div style="width: ${Math.min(100, armor)}%; height: 100%; background: ${armor >= 70 ? '#ef476f' : (armor >= 30 ? '#f59e0b' : '#10b981')};"></div>
                      </div>
                  </td>
                  <td style="padding: 10px 12px; text-align: center;">
                      ${fieldBtn}
                  </td>
                  <td style="padding: 10px 12px; text-align: center;">
                      <div style="color: ${threatColor}; font-weight: bold; font-size: 0.82rem;">⚠️ ${threat}</div>
                      <div style="color: var(--text-muted); font-size: 0.73rem;">🏃 ${speed} px/s</div>
                  </td>
                  <td style="padding: 10px 12px; text-align: center;">
                      <span style="color: #10b981; font-weight: bold; font-family: monospace; font-size: 0.92rem;">🏆 ${score}</span>
                  </td>
                  <td style="padding: 10px 12px; text-align: center;">
                      <div style="display: flex; gap: 6px; justify-content: center;">
                          <button onclick="openEditGameEnemyModal(${e.id})" class="admin-tab-btn" style="padding: 4px 10px; font-size: 0.78rem; background: rgba(239,68,111,0.15); border-color: #ef476f; color: #ff4d6d; cursor: pointer;">✏️ Edit</button>
                          <button onclick="cloneGameEnemy(${e.id})" class="admin-tab-btn" style="padding: 4px 8px; font-size: 0.78rem; background: rgba(255,215,0,0.15); border-color: #ffd700; color: #ffd700; cursor: pointer;" title="Clone this enemy threat">📋 Clone</button>
                          <button onclick="deleteGameEnemy(${e.id}, '${escapeHtml(e.enemy_name)}')" class="admin-tab-btn" style="padding: 4px 8px; font-size: 0.78rem; background: rgba(239,68,111,0.15); border-color: #ef476f; color: #ef476f; cursor: pointer;" title="Delete enemy">🗑️</button>
                      </div>
                  </td>
              </tr>
          `;
      }).join('');
  }

  function filterGameEnemies() {
      const q = (document.getElementById('gameEnemySearchInput')?.value || '').toLowerCase().trim();
      const stageFilter = document.getElementById('gameEnemyStageFilter')?.value || 'all';
      const deviceFilter = (document.getElementById('gameEnemyDeviceFilter')?.value || 'all').toLowerCase();
      const shieldFilter = document.getElementById('gameEnemyForceFieldFilter')?.value || 'all';
      const armorFilter = document.getElementById('gameEnemyArmorFilter')?.value || 'all';

      const filtered = cachedGameEnemies.filter(e => {
          if (stageFilter !== 'all' && String(e.stage_level) !== String(stageFilter)) {
              return false;
          }
          if (deviceFilter !== 'all') {
              const enemyDev = (e.device_type || 'desktop').toLowerCase();
              if (enemyDev !== deviceFilter && enemyDev !== 'all') {
                  return false;
              }
          }
          if (shieldFilter === 'shielded' && parseInt(e.has_force_field) !== 1) {
              return false;
          }
          if (shieldFilter === 'unshielded' && parseInt(e.has_force_field) === 1) {
              return false;
          }
          const arm = parseInt(e.armor_strength || 0);
          if (armorFilter === 'light' && arm >= 25) return false;
          if (armorFilter === 'medium' && (arm < 25 || arm > 50)) return false;
          if (armorFilter === 'heavy' && arm <= 50) return false;

          if (!q) return true;
          return (e.enemy_name && e.enemy_name.toLowerCase().includes(q)) ||
                 (e.enemy_id && e.enemy_id.toLowerCase().includes(q)) ||
                 (e.device_type && e.device_type.toLowerCase().includes(q)) ||
                 (e.enemy_class && e.enemy_class.toLowerCase().includes(q)) ||
                 (e.model_3d_type && e.model_3d_type.toLowerCase().includes(q)) ||
                 (e.weapon_name && e.weapon_name.toLowerCase().includes(q)) ||
                 (e.piercing_weapon_id && e.piercing_weapon_id.toLowerCase().includes(q)) ||
                 (e.description && e.description.toLowerCase().includes(q));
      });

      renderGameEnemies(filtered);
  }

  function populateEnemyPiercingWeaponDropdown() {
      const select = document.getElementById('enemyPiercingWeaponInput');
      if (!select) return;

      const currentVal = select.value || 'any';
      let optionsHtml = '<option value="any">✨ Any Weapon (No specific resistance)</option>';

      if (cachedGameWeapons && cachedGameWeapons.length > 0) {
          optionsHtml += cachedGameWeapons.map(w => {
              return `<option value="${escapeHtml(w.weapon_id)}">${escapeHtml(w.icon || '⚡')} ${escapeHtml(w.weapon_name)} (Stage ${w.stage_level})</option>`;
          }).join('');
      } else {
          optionsHtml += `
              <option value="red_laser">🔴 Neon Red Laser</option>
              <option value="blue_laser">🔵 Cobalt Blue Laser</option>
              <option value="tachyon_lance">⚡ Tachyon Lance</option>
              <option value="plasma_torpedo">💣 Quantum Plasma Torpedo</option>
              <option value="quantum_phaser">✨ Quantum Phaser Cannon</option>
          `;
      }
      select.innerHTML = optionsHtml;
      select.value = currentVal;
  }

  function toggleEnemyShieldCapacityInput() {
      const fieldSelect = document.getElementById('enemyHasForceFieldInput');
      const shieldInput = document.getElementById('enemyShieldHitsInput');
      if (fieldSelect && shieldInput) {
          if (parseInt(fieldSelect.value) === 1) {
              if (parseInt(shieldInput.value || 0) <= 0) shieldInput.value = '2';
              shieldInput.disabled = false;
          } else {
              shieldInput.value = '0';
              shieldInput.disabled = true;
          }
      }
  }

  function openAddGameEnemyModal() {
      const title = document.getElementById('enemyModalTitle');
      if (title) title.innerHTML = '<span>👾 Register New Enemy Threat</span>';

      document.getElementById('enemyRecordId').value = '0';
      document.getElementById('enemyCodeInput').value = '';
      document.getElementById('enemyCodeInput').disabled = false;
      document.getElementById('enemyNameInput').value = '';
      document.getElementById('enemyClassInput').value = 'Scout Drone';
      if (document.getElementById('enemy3DModelInput')) document.getElementById('enemy3DModelInput').value = 'scout_drone';
      if (document.getElementById('enemy3DModelUrlInput')) document.getElementById('enemy3DModelUrlInput').value = '';
      if (document.getElementById('enemyScaleInput')) document.getElementById('enemyScaleInput').value = '1.00';
      if (document.getElementById('enemyLengthInput')) document.getElementById('enemyLengthInput').value = '3.00';
      if (document.getElementById('enemyHeightInput')) document.getElementById('enemyHeightInput').value = '1.50';
      if (document.getElementById('enemyDepthInput')) document.getElementById('enemyDepthInput').value = '3.00';
      if (document.getElementById('enemyCircumferenceInput')) document.getElementById('enemyCircumferenceInput').value = '6.00';
      document.getElementById('enemyIconInput').value = '🛸';
      document.getElementById('enemyColorInput').value = '#ef476f';
      document.getElementById('enemyStageLevelInput').value = '1';
      const currentDevFilter = document.getElementById('gameEnemyDeviceFilter')?.value;
      if (document.getElementById('enemyDeviceTypeInput')) {
          document.getElementById('enemyDeviceTypeInput').value = (currentDevFilter && currentDevFilter !== 'all') ? currentDevFilter : 'desktop';
      }
      if (document.getElementById('enemyWeaponNameInput')) document.getElementById('enemyWeaponNameInput').value = 'Plasma Pulse';
      if (document.getElementById('enemyWeaponDamageInput')) document.getElementById('enemyWeaponDamageInput').value = '5';
      if (document.getElementById('enemyWeaponSpeedInput')) document.getElementById('enemyWeaponSpeedInput').value = '450';
      if (document.getElementById('enemyWeaponColorInput')) document.getElementById('enemyWeaponColorInput').value = '#ff0055';
      document.getElementById('enemyHitsToDestroyInput').value = '4';
      document.getElementById('enemyArmorStrengthInput').value = '25';
      document.getElementById('enemyHasForceFieldInput').value = '0';
      document.getElementById('enemyShieldHitsInput').value = '0';
      document.getElementById('enemySpeedInput').value = '250';
      document.getElementById('enemyDamageInput').value = '10';
      document.getElementById('enemyFireRateInput').value = '2.0';
      document.getElementById('enemyScoreInput').value = '250';
      document.getElementById('enemyThreatLevelInput').value = 'Medium';
      document.getElementById('enemyDescriptionInput').value = '';

      populateEnemyPiercingWeaponDropdown();
      document.getElementById('enemyPiercingWeaponInput').value = 'any';
      toggleEnemyShieldCapacityInput();

      const modal = document.getElementById('editGameEnemyModal');
      if (modal) modal.style.display = 'flex';
  }

  function openEditGameEnemyModal(id) {
      const enemy = cachedGameEnemies.find(e => parseInt(e.id) === parseInt(id));
      if (!enemy) {
          alert('Enemy not found in cache');
          return;
      }

      const title = document.getElementById('enemyModalTitle');
      if (title) title.innerHTML = `<span>👾 Edit Threat: ${escapeHtml(enemy.enemy_name)}</span>`;

      document.getElementById('enemyRecordId').value = enemy.id;
      document.getElementById('enemyCodeInput').value = enemy.enemy_id || '';
      document.getElementById('enemyCodeInput').disabled = false;
      document.getElementById('enemyNameInput').value = enemy.enemy_name || '';
      document.getElementById('enemyClassInput').value = enemy.enemy_class || 'Scout Drone';
      if (document.getElementById('enemy3DModelInput')) document.getElementById('enemy3DModelInput').value = enemy.model_3d_type || 'scout_drone';
      if (document.getElementById('enemy3DModelUrlInput')) document.getElementById('enemy3DModelUrlInput').value = enemy.model_3d_url || '';
      if (document.getElementById('enemyScaleInput')) document.getElementById('enemyScaleInput').value = enemy.scale !== undefined && enemy.scale !== null ? enemy.scale : '1.00';
      if (document.getElementById('enemyLengthInput')) document.getElementById('enemyLengthInput').value = enemy.length !== undefined && enemy.length !== null ? enemy.length : '3.00';
      if (document.getElementById('enemyHeightInput')) document.getElementById('enemyHeightInput').value = enemy.height !== undefined && enemy.height !== null ? enemy.height : '1.50';
      if (document.getElementById('enemyDepthInput')) document.getElementById('enemyDepthInput').value = enemy.depth !== undefined && enemy.depth !== null ? enemy.depth : '3.00';
      if (document.getElementById('enemyCircumferenceInput')) document.getElementById('enemyCircumferenceInput').value = enemy.circumference !== undefined && enemy.circumference !== null ? enemy.circumference : '6.00';
      document.getElementById('enemyIconInput').value = enemy.icon || '🛸';
      document.getElementById('enemyColorInput').value = enemy.color_hex || '#ef476f';
      document.getElementById('enemyStageLevelInput').value = enemy.stage_level || 1;
      if (document.getElementById('enemyDeviceTypeInput')) {
          document.getElementById('enemyDeviceTypeInput').value = enemy.device_type || 'desktop';
      }
      if (document.getElementById('enemyWeaponNameInput')) document.getElementById('enemyWeaponNameInput').value = enemy.weapon_name || 'Plasma Pulse';
      if (document.getElementById('enemyWeaponDamageInput')) document.getElementById('enemyWeaponDamageInput').value = enemy.weapon_damage || 5;
      if (document.getElementById('enemyWeaponSpeedInput')) document.getElementById('enemyWeaponSpeedInput').value = enemy.weapon_speed || 450;
      if (document.getElementById('enemyWeaponColorInput')) document.getElementById('enemyWeaponColorInput').value = enemy.weapon_color || '#ff0055';
      document.getElementById('enemyHitsToDestroyInput').value = enemy.hits_to_destroy || 2;
      document.getElementById('enemyArmorStrengthInput').value = enemy.armor_strength || 10;
      document.getElementById('enemyHasForceFieldInput').value = parseInt(enemy.has_force_field) === 1 ? '1' : '0';
      document.getElementById('enemyShieldHitsInput').value = enemy.shield_capacity_hits || 0;
      document.getElementById('enemySpeedInput').value = enemy.movement_speed || 250;
      document.getElementById('enemyDamageInput').value = enemy.attack_damage || 5;
      document.getElementById('enemyFireRateInput').value = enemy.fire_rate_seconds || 2.0;
      document.getElementById('enemyScoreInput').value = enemy.score_value || 100;
      document.getElementById('enemyThreatLevelInput').value = enemy.threat_level || 'Low';
      document.getElementById('enemyDescriptionInput').value = enemy.description || '';

      populateEnemyPiercingWeaponDropdown();
      document.getElementById('enemyPiercingWeaponInput').value = enemy.piercing_weapon_id || 'any';
      toggleEnemyShieldCapacityInput();

      const modal = document.getElementById('editGameEnemyModal');
      if (modal) modal.style.display = 'flex';
  }

  function closeEditGameEnemyModal() {
      const modal = document.getElementById('editGameEnemyModal');
      if (modal) modal.style.display = 'none';
  }

  async function saveGameEnemy() {
      const id = parseInt(document.getElementById('enemyRecordId').value || 0);
      const code = (document.getElementById('enemyCodeInput').value || '').trim();
      const name = (document.getElementById('enemyNameInput').value || '').trim();
      const enemyClass = (document.getElementById('enemyClassInput').value || 'Scout Drone').trim();
      const model3dType = (document.getElementById('enemy3DModelInput')?.value || 'scout_drone').trim();
      const model3dUrl = (document.getElementById('enemy3DModelUrlInput')?.value || '').trim();
      const scale = parseFloat(document.getElementById('enemyScaleInput')?.value || 1.0);
      const length = parseFloat(document.getElementById('enemyLengthInput')?.value || 3.0);
      const height = parseFloat(document.getElementById('enemyHeightInput')?.value || 1.5);
      const depth = parseFloat(document.getElementById('enemyDepthInput')?.value || 3.0);
      const circumference = parseFloat(document.getElementById('enemyCircumferenceInput')?.value || 6.0);
      const icon = (document.getElementById('enemyIconInput').value || '🛸').trim();
      const color = (document.getElementById('enemyColorInput').value || '#ef476f').trim();
      const stage = parseInt(document.getElementById('enemyStageLevelInput').value || 1);
      const deviceType = (document.getElementById('enemyDeviceTypeInput')?.value || 'desktop').trim().toLowerCase();
      const weaponName = (document.getElementById('enemyWeaponNameInput')?.value || 'Plasma Pulse').trim();
      const weaponDamage = parseInt(document.getElementById('enemyWeaponDamageInput')?.value || 5);
      const weaponSpeed = parseInt(document.getElementById('enemyWeaponSpeedInput')?.value || 450);
      const weaponColor = (document.getElementById('enemyWeaponColorInput')?.value || '#ff0055').trim();
      const hits = parseInt(document.getElementById('enemyHitsToDestroyInput').value || 1);
      const pierce = (document.getElementById('enemyPiercingWeaponInput').value || 'any').trim();
      const armor = parseInt(document.getElementById('enemyArmorStrengthInput').value || 0);
      const hasField = parseInt(document.getElementById('enemyHasForceFieldInput').value || 0);
      const shieldHits = parseInt(document.getElementById('enemyShieldHitsInput').value || 0);
      const speed = parseInt(document.getElementById('enemySpeedInput').value || 250);
      const damage = parseInt(document.getElementById('enemyDamageInput').value || 5);
      const fireRate = parseFloat(document.getElementById('enemyFireRateInput').value || 2.0);
      const score = parseInt(document.getElementById('enemyScoreInput').value || 100);
      const threat = (document.getElementById('enemyThreatLevelInput').value || 'Low').trim();
      const desc = (document.getElementById('enemyDescriptionInput').value || '').trim();

      if (!code || !name) {
          alert('Enemy Identifier (Code) and Display Name are required!');
          return;
      }
      if (hits < 1) {
          alert('Hits to destroy must be at least 1 hit.');
          return;
      }

      const payload = {
          id: id,
          enemy_id: code,
          device_type: deviceType,
          enemy_name: name,
          enemy_class: enemyClass,
          model_3d_type: model3dType,
          model_3d_url: model3dUrl,
          scale: scale,
          length: length,
          height: height,
          depth: depth,
          circumference: circumference,
          icon: icon,
          color_hex: color,
          stage_level: stage,
          weapon_name: weaponName,
          weapon_damage: weaponDamage,
          weapon_speed: weaponSpeed,
          weapon_color: weaponColor,
          hits_to_destroy: hits,
          piercing_weapon_id: pierce,
          armor_strength: armor,
          has_force_field: hasField,
          shield_capacity_hits: shieldHits,
          movement_speed: speed,
          attack_damage: damage,
          fire_rate_seconds: fireRate,
          score_value: score,
          threat_level: threat,
          description: desc,
          is_enabled: 1
      };

      try {
          const res = await callAdminWormholeApi('save_game_enemy', 'POST', payload);
          alert(res.message || 'Enemy saved successfully!');
          closeEditGameEnemyModal();
          fetchGameEnemies();
      } catch (err) {
          console.error('[Admin] Save enemy error:', err);
          alert('Failed to save enemy: ' + err.message);
      }
  }

  async function deleteGameEnemy(id, name) {
      if (!confirm(`Are you sure you want to delete enemy threat '${name}'?`)) {
          return;
      }

      try {
          const res = await callAdminWormholeApi('delete_game_enemy', 'POST', { id: id });
          alert(res.message || 'Enemy deleted successfully');
          fetchGameEnemies();
      } catch (err) {
          console.error('[Admin] Delete enemy error:', err);
          alert('Failed to delete enemy: ' + err.message);
      }
  }

  async function toggleEnemyForceField(id, currentStatus) {
      try {
          await callAdminWormholeApi('toggle_game_enemy_field', 'POST', { id: id, field: 'has_force_field' });
          fetchGameEnemies();
      } catch (err) {
          console.error('[Admin] Toggle force field error:', err);
          alert('Failed to update force field: ' + err.message);
      }
  }

  async function seedDefaultGameEnemies() {
      if (!confirm('Re-seed / Reset default enemies (Void Recon Drone, Phase Interceptor, Tachyon Cruiser, Singularity Void Guardian, Quantum Dreadnought)?')) {
          return;
      }

      try {
          const res = await callAdminWormholeApi('seed_game_enemies', 'POST', {});
          alert(res.message || 'Default enemies successfully initialized!');
          fetchGameEnemies();
      } catch (err) {
          console.error('[Admin] Seed enemies error:', err);
          alert('Failed to seed default enemies: ' + err.message);
      }
  }

  function populateCloneEnemyDropdown() {
      const select = document.getElementById('cloneEnemySelect');
      if (!select) return;

      const previousVal = select.value;
      let html = '<option value="">-- Select Threat to Clone --</option>';

      if (cachedGameEnemies && cachedGameEnemies.length > 0) {
          html += cachedGameEnemies.map(e => {
              const icon = e.icon || '🛸';
              const name = e.enemy_name || e.enemy_id;
              const code = e.enemy_id || '';
              const stage = e.stage_level || 1;
              const device = e.device_type || 'desktop';
              return `<option value="${e.id}">${icon} ${escapeHtml(name)} (${escapeHtml(code)} &bull; ${escapeHtml(device)} &bull; Stage ${stage})</option>`;
          }).join('');
      }

      select.innerHTML = html;
      if (previousVal && Array.from(select.options).some(o => String(o.value) === String(previousVal))) {
          select.value = previousVal;
      }
  }

  async function cloneSelectedGameEnemy() {
      const select = document.getElementById('cloneEnemySelect');
      const selectedId = select ? select.value : '';
      if (!selectedId) {
          alert('Please select an enemy threat from the dropdown to clone.');
          if (select) select.focus();
          return;
      }
      await cloneGameEnemy(selectedId);
  }

  async function cloneGameEnemy(sourceId) {
      const enemy = cachedGameEnemies.find(e => parseInt(e.id) === parseInt(sourceId));
      if (!enemy) {
          alert('Selected enemy threat not found in registry. Please refresh the registry.');
          return;
      }

      const confirmClone = confirm(`Clone enemy threat '${enemy.enemy_name}' (${enemy.enemy_id})?\n\nThis will add a new duplicated threat to the registry and immediately open its edit page.`);
      if (!confirmClone) return;

      try {
          const payload = {
              source_id: parseInt(sourceId),
              source_enemy: enemy
          };

          const res = await callAdminWormholeApi('clone_game_enemy', 'POST', payload);
          if (!res || !res.success) {
              throw new Error(res?.message || 'Failed to clone enemy');
          }

          const newId = parseInt(res.id || (res.data && res.data.id) || 0);

          // Re-fetch registry so the newly added enemy is loaded into cachedGameEnemies
          await fetchGameEnemies();

          // Update dropdown selection
          const select = document.getElementById('cloneEnemySelect');
          if (select && newId > 0) {
              select.value = String(newId);
          }

          // Open the edit page / modal for the newly cloned enemy
          if (newId > 0) {
              openEditGameEnemyModal(newId);
          } else if (res.enemy_id && cachedGameEnemies && cachedGameEnemies.length > 0) {
              const match = cachedGameEnemies.find(e => e.enemy_id === res.enemy_id) || cachedGameEnemies[cachedGameEnemies.length - 1];
              if (match) openEditGameEnemyModal(match.id);
          } else if (cachedGameEnemies && cachedGameEnemies.length > 0) {
              const lastEnemy = cachedGameEnemies[cachedGameEnemies.length - 1];
              openEditGameEnemyModal(lastEnemy.id);
          }
      } catch (err) {
          console.error('[Admin] Clone enemy error:', err);
          alert('Failed to clone enemy: ' + err.message);
      }
  }


  // 30. WORMHOLE GAME MANAGER & STAGE ARSENAL WEAPONS
  // =========================================================================
  let cachedGameWeapons = [];

  async function fetchGameWeapons() {
      const tbody = document.getElementById('adminGameWeaponsBody');
      if (tbody) {
          tbody.innerHTML = '<tr><td colspan="10" style="padding: 16px; text-align: center; color: var(--text-muted);">Querying weapons database...</td></tr>';
      }

      try {
          const res = await callAdminWormholeApi('get_game_weapons', 'GET');
          cachedGameWeapons = res.weapons || [];

          // Update metrics
          const metricTotal = document.getElementById('metricTotalWeapons');
          if (metricTotal) metricTotal.textContent = cachedGameWeapons.length;

          const initialCount = cachedGameWeapons.filter(w => parseInt(w.is_initial_weapon) === 1).length;
          const metricInitial = document.getElementById('metricInitialWeapons');
          if (metricInitial) metricInitial.textContent = initialCount;

          const overheatCount = cachedGameWeapons.filter(w => parseInt(w.can_overheat) === 1).length;
          const metricOverheat = document.getElementById('metricOverheatWeapons');
          if (metricOverheat) metricOverheat.textContent = overheatCount;

          const distinctStages = new Set(cachedGameWeapons.map(w => w.stage_level));
          const metricStages = document.getElementById('metricActiveStages');
          if (metricStages) metricStages.textContent = distinctStages.size || (res.stages ? res.stages.length : 1);

          const badge = document.getElementById('gameManagerBadge');
          if (badge) {
              badge.textContent = cachedGameWeapons.length;
              badge.style.display = cachedGameWeapons.length > 0 ? 'inline-block' : 'none';
          }
          const subBadgeWeapon = document.getElementById('badgeWeaponCount');
          if (subBadgeWeapon) {
              subBadgeWeapon.textContent = cachedGameWeapons.length;
          }
          populateEnemyPiercingWeaponDropdown();

          renderGameWeapons(cachedGameWeapons);
      } catch (err) {
          console.error('[Admin] Game weapons fetch error:', err);
          if (tbody) {
              tbody.innerHTML = `<tr><td colspan="10" style="padding: 16px; text-align: center; color: #ef476f;">Error loading weapons: ${escapeHtml(err.message)}</td></tr>`;
          }
      }
  }

  function renderGameWeapons(weapons) {
      const tbody = document.getElementById('adminGameWeaponsBody');
      if (!tbody) return;

      if (!weapons || weapons.length === 0) {
          tbody.innerHTML = '<tr><td colspan="10" style="padding: 16px; text-align: center; color: var(--text-muted);">No stage weapons found in database. Click "+ Add Weapon" or "🌱 Reset Default Weapons" to initialize.</td></tr>';
          return;
      }

      tbody.innerHTML = weapons.map(w => {
          const isInitial = parseInt(w.is_initial_weapon) === 1;
          const isAcquirable = parseInt(w.is_acquirable) === 1;
          const canOverheat = parseInt(w.can_overheat) === 1;
          const drain = parseFloat(w.energy_drain_pct || 10).toFixed(0);
          const coolSec = parseFloat(w.cooldown_seconds || 5).toFixed(1);
          const dmg = parseInt(w.damage_per_hit || 1);
          const color = escapeHtml(w.color_hex || '#ff2244');
          const icon = escapeHtml(w.icon || '⚡');

          const initialBtn = isInitial
              ? `<button onclick="toggleWeaponInitial(${w.id}, 1, ${w.stage_level})" class="admin-tab-btn" style="background:rgba(16,185,129,0.2);border-color:#10b981;color:#10b981;font-size:0.75rem;padding:3px 8px;cursor:pointer;" title="Click to disable initial status">⭐ Stage ${w.stage_level} Initial</button>`
              : `<button onclick="toggleWeaponInitial(${w.id}, 0, ${w.stage_level})" class="admin-tab-btn" style="background:rgba(255,255,255,0.05);border-color:#475569;color:var(--text-muted);font-size:0.75rem;padding:3px 8px;cursor:pointer;" title="Click to make initial weapon for this stage">Set Initial</button>`;

          const overheatBtn = canOverheat
              ? `<button onclick="toggleWeaponOverheat(${w.id}, 1)" class="admin-tab-btn" style="background:rgba(239,68,111,0.2);border-color:#ef476f;color:#ef476f;font-size:0.75rem;padding:3px 8px;cursor:pointer;" title="Click to toggle overheat off">🔥 Overheats (Yes)</button>`
              : `<button onclick="toggleWeaponOverheat(${w.id}, 0)" class="admin-tab-btn" style="background:rgba(0,240,255,0.15);border-color:#00f0ff;color:#00f0ff;font-size:0.75rem;padding:3px 8px;cursor:pointer;" title="Click to enable overheat">❄️ No Overheat</button>`;

          const acquirableHtml = isAcquirable
              ? `<div style="font-size:0.8rem;color:#10b981;">💎 Acquirable</div><div style="font-size:0.72rem;color:var(--text-muted);font-family:monospace;">${escapeHtml(w.acquire_event || 'default_start')}</div>`
              : `<div style="font-size:0.8rem;color:#ef476f;">🔒 Locked</div>`;

          return `
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.06); transition: background 0.15s ease;">
                  <td style="padding: 10px 14px; text-align: center;">
                      <span class="weapon-icon-badge-box" style="display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:6px 12px;min-width:54px;border-radius:8px;background:rgba(0,240,255,0.12);border:1.5px solid rgba(0,240,255,0.35);box-shadow:0 0 8px rgba(0,240,255,0.2);box-sizing:border-box;">
                          <span style="font-size:1.3rem;line-height:1;" title="${escapeHtml(w.weapon_name)}">${icon}</span>
                          <span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${color};box-shadow:0 0 6px ${color};"></span>
                      </span>
                  </td>
                  <td style="padding: 10px 12px;">
                      <div style="font-weight: bold; color: #fff; font-size: 0.92rem;">${escapeHtml(w.weapon_name)}</div>
                      <div style="font-size: 0.75rem; color: #00f0ff; font-family: monospace;">${escapeHtml(w.weapon_id)}</div>
                      ${w.description ? `<div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">${escapeHtml(w.description)}</div>` : ''}
                  </td>
                  <td style="padding: 10px 14px; text-align: center;">
                      <span class="stage-badge-box" style="display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:6px 15px;min-width:100px;font-size:0.84rem;background:rgba(0,240,255,0.18);border:1.5px solid #00f0ff;border-radius:8px;color:#00f0ff;font-weight:800;white-space:nowrap;box-sizing:border-box;box-shadow:0 0 8px rgba(0,240,255,0.25);">
                          <span style="font-size:0.95rem;">🗺️</span>
                          <span>Stage ${w.stage_level}</span>
                      </span>
                  </td>
                  <td style="padding: 10px 12px; text-align: center;">
                      ${initialBtn}
                  </td>
                  <td style="padding: 10px 12px;">
                      ${acquirableHtml}
                  </td>
                  <td style="padding: 10px 12px; text-align: center;">
                      <span style="color: #ffb703; font-weight: bold; font-size: 0.95rem;">${drain}%</span>
                  </td>
                  <td style="padding: 10px 12px; text-align: center;">
                      ${overheatBtn}
                  </td>
                  <td style="padding: 10px 12px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
                      ${canOverheat ? `${coolSec}s` : '<span style="color:#64748b;">N/A</span>'}
                  </td>
                  <td style="padding: 10px 12px; text-align: center;">
                      <span style="color: #00f0ff; font-weight: bold; font-size: 1rem; text-shadow: 0 0 8px rgba(0,240,255,0.4);">💥 ${dmg} Hit${dmg > 1 ? 's' : ''}</span>
                  </td>
                  <td style="padding: 10px 12px; text-align: center;">
                      <div style="display: flex; gap: 6px; justify-content: center;">
                          <button onclick="openEditGameWeaponModal(${w.id})" class="admin-tab-btn" style="padding: 4px 10px; font-size: 0.78rem; background: rgba(0,240,255,0.15); border-color: #00f0ff; color: #00f0ff; cursor: pointer;">✏️ Edit</button>
                          <button onclick="deleteGameWeapon(${w.id}, '${escapeHtml(w.weapon_name)}')" class="admin-tab-btn" style="padding: 4px 8px; font-size: 0.78rem; background: rgba(239,68,111,0.15); border-color: #ef476f; color: #ef476f; cursor: pointer;" title="Delete weapon">🗑️</button>
                      </div>
                  </td>
              </tr>
          `;
      }).join('');
  }

  function filterGameWeapons() {
      const q = (document.getElementById('gameWeaponSearchInput')?.value || '').toLowerCase().trim();
      const stageFilter = document.getElementById('gameWeaponStageFilter')?.value || 'all';

      const filtered = cachedGameWeapons.filter(w => {
          if (stageFilter !== 'all' && String(w.stage_level) !== String(stageFilter)) {
              return false;
          }
          if (!q) return true;
          return (w.weapon_name && w.weapon_name.toLowerCase().includes(q)) ||
                 (w.weapon_id && w.weapon_id.toLowerCase().includes(q)) ||
                 (w.acquire_event && w.acquire_event.toLowerCase().includes(q)) ||
                 (w.description && w.description.toLowerCase().includes(q));
      });

      renderGameWeapons(filtered);
  }

  function openAddGameWeaponModal() {
      const title = document.getElementById('weaponModalTitle');
      if (title) title.textContent = '🔫 Add Stage Weapon';

      document.getElementById('weaponRecordId').value = '0';
      document.getElementById('weaponCode').value = '';
      document.getElementById('weaponCode').disabled = false;
      document.getElementById('weaponName').value = '';
      document.getElementById('weaponIcon').value = '⚡';
      document.getElementById('weaponColor').value = '#ff2244';
      document.getElementById('weaponStageLevel').value = '1';
      document.getElementById('weaponIsInitial').checked = false;
      document.getElementById('weaponIsAcquirable').checked = true;
      document.getElementById('weaponAcquireEvent').value = 'default_start';
      document.getElementById('weaponDrainPct').value = '10';
      document.getElementById('weaponCanOverheat').value = '1';
      document.getElementById('weaponCooldownSec').value = '5.0';
      document.getElementById('weaponDamagePerHit').value = '2';
      document.getElementById('weaponBulletSpeed').value = '600';
      document.getElementById('weaponDescription').value = '';

      const modal = document.getElementById('editGameWeaponModal');
      if (modal) modal.style.display = 'flex';
  }

  function openEditGameWeaponModal(id) {
      const weapon = cachedGameWeapons.find(w => parseInt(w.id) === parseInt(id));
      if (!weapon) {
          alert('Weapon not found in local cache');
          return;
      }

      const title = document.getElementById('weaponModalTitle');
      if (title) title.textContent = `🔫 Edit Weapon: ${weapon.weapon_name}`;

      document.getElementById('weaponRecordId').value = weapon.id;
      document.getElementById('weaponCode').value = weapon.weapon_id;
      document.getElementById('weaponCode').disabled = true; // lock code during edit
      document.getElementById('weaponName').value = weapon.weapon_name;
      document.getElementById('weaponIcon').value = weapon.icon || '⚡';
      document.getElementById('weaponColor').value = weapon.color_hex || '#ff2244';
      document.getElementById('weaponStageLevel').value = weapon.stage_level || 1;
      document.getElementById('weaponIsInitial').checked = parseInt(weapon.is_initial_weapon) === 1;
      document.getElementById('weaponIsAcquirable').checked = parseInt(weapon.is_acquirable) === 1;
      document.getElementById('weaponAcquireEvent').value = weapon.acquire_event || 'default_start';
      document.getElementById('weaponDrainPct').value = parseFloat(weapon.energy_drain_pct || 10).toFixed(0);
      document.getElementById('weaponCanOverheat').value = parseInt(weapon.can_overheat) === 1 ? '1' : '0';
      document.getElementById('weaponCooldownSec').value = parseFloat(weapon.cooldown_seconds || 5).toFixed(1);
      document.getElementById('weaponDamagePerHit').value = weapon.damage_per_hit || 1;
      document.getElementById('weaponBulletSpeed').value = weapon.bullet_speed || 600;
      document.getElementById('weaponDescription').value = weapon.description || '';

      const modal = document.getElementById('editGameWeaponModal');
      if (modal) modal.style.display = 'flex';
  }

  function closeEditGameWeaponModal() {
      const modal = document.getElementById('editGameWeaponModal');
      if (modal) modal.style.display = 'none';
  }

  async function saveGameWeapon() {
      const id = parseInt(document.getElementById('weaponRecordId').value || 0);
      const code = (document.getElementById('weaponCode').value || '').trim();
      const name = (document.getElementById('weaponName').value || '').trim();
      const icon = (document.getElementById('weaponIcon').value || '⚡').trim();
      const color = (document.getElementById('weaponColor').value || '#ff2244').trim();
      const stage = parseInt(document.getElementById('weaponStageLevel').value || 1);
      const isInitial = document.getElementById('weaponIsInitial').checked ? 1 : 0;
      const isAcquirable = document.getElementById('weaponIsAcquirable').checked ? 1 : 0;
      const acquireEvent = (document.getElementById('weaponAcquireEvent').value || 'default_start').trim();
      const drain = parseFloat(document.getElementById('weaponDrainPct').value || 10);
      const canOverheat = parseInt(document.getElementById('weaponCanOverheat').value || 1);
      const coolSec = parseFloat(document.getElementById('weaponCooldownSec').value || 5);
      const dmg = parseInt(document.getElementById('weaponDamagePerHit').value || 1);
      const speed = parseInt(document.getElementById('weaponBulletSpeed').value || 600);
      const desc = (document.getElementById('weaponDescription').value || '').trim();

      if (!code || !name) {
          alert('Weapon Identifier (Code) and Display Name are required!');
          return;
      }

      if (drain <= 0 || drain > 100) {
          alert('Energy Drain percentage must be between 1% and 100%');
          return;
      }

      if (dmg < 1) {
          alert('Damage number must be at least 1 hit');
          return;
      }

      const payload = {
          id: id,
          weapon_id: code,
          weapon_name: name,
          icon: icon,
          color_hex: color,
          stage_level: stage,
          is_initial_weapon: isInitial,
          is_acquirable: isAcquirable,
          acquire_event: acquireEvent,
          energy_drain_pct: drain,
          can_overheat: canOverheat,
          cooldown_seconds: coolSec,
          damage_per_hit: dmg,
          bullet_speed: speed,
          description: desc
      };

      try {
          const res = await callAdminWormholeApi('save_game_weapon', 'POST', payload);
          alert(res.message || 'Weapon saved successfully!');
          closeEditGameWeaponModal();
          fetchGameWeapons();
      } catch (err) {
          console.error('[Admin] Save game weapon error:', err);
          alert('Failed to save weapon: ' + err.message);
      }
  }

  async function deleteGameWeapon(id, name) {
      if (!confirm(`Are you sure you want to delete the weapon '${name}' from the game arsenal?`)) {
          return;
      }

      try {
          const res = await callAdminWormholeApi('delete_game_weapon', 'POST', { id: id });
          alert(res.message || 'Weapon deleted successfully');
          fetchGameWeapons();
      } catch (err) {
          console.error('[Admin] Delete game weapon error:', err);
          alert('Failed to delete weapon: ' + err.message);
      }
  }

  async function toggleWeaponOverheat(id, currentStatus) {
      const newStatus = currentStatus ? 0 : 1;
      try {
          await callAdminWormholeApi('toggle_game_weapon_overheat', 'POST', { id: id, can_overheat: newStatus });
          fetchGameWeapons();
      } catch (err) {
          console.error('[Admin] Toggle overheat error:', err);
          alert('Failed to update overheat status: ' + err.message);
      }
  }

  async function toggleWeaponInitial(id, currentStatus, stage) {
      try {
          const res = await callAdminWormholeApi('toggle_game_weapon_initial', 'POST', { id: id });
          fetchGameWeapons();
      } catch (err) {
          console.error('[Admin] Toggle initial weapon error:', err);
          alert('Failed to update initial weapon: ' + err.message);
      }
  }

  async function seedDefaultGameWeapons() {
      if (!confirm('Re-seed / Reset default weapons (Red Laser, Blue Laser, Tachyon Lance, Plasma Torpedo, Quantum Phaser)? This will ensure default configurations exist.')) {
          return;
      }

      try {
          const res = await callAdminWormholeApi('seed_game_weapons', 'POST', {});
          alert(res.message || 'Default weapons successfully initialized!');
          fetchGameWeapons();
      } catch (err) {
          console.error('[Admin] Seed weapons error:', err);
          alert('Failed to seed default weapons: ' + err.message);
      }
  }

  global.switchGameManagerSubTab = switchGameManagerSubTab;
  global.runAdminLiveDeviceCheck = runAdminLiveDeviceCheck;
  global.simulateDeviceCheck = simulateDeviceCheck;
  global.quickWhitelistCurrentDevice = quickWhitelistCurrentDevice;
  global.initLiveClientSpecs = initLiveClientSpecs;
  global.fetchGameStages = fetchGameStages;
  global.renderGameStages = renderGameStages;
  global.filterGameStages = filterGameStages;
  global.openAddGameStageModal = openAddGameStageModal;
  global.openEditGameStageModal = openEditGameStageModal;
  global.closeEditGameStageModal = closeEditGameStageModal;
  global.saveGameStage = saveGameStage;
  global.deleteGameStage = deleteGameStage;
  global.seedDefaultGameStages = seedDefaultGameStages;
  global.syncAllStageFiles = syncAllStageFiles;

  global.fetchGameEnemies = fetchGameEnemies;
  global.renderGameEnemies = renderGameEnemies;
  global.filterGameEnemies = filterGameEnemies;
  global.openAddGameEnemyModal = openAddGameEnemyModal;
  global.openEditGameEnemyModal = openEditGameEnemyModal;
  global.closeEditGameEnemyModal = closeEditGameEnemyModal;
  global.saveGameEnemy = saveGameEnemy;
  global.deleteGameEnemy = deleteGameEnemy;
  global.toggleEnemyForceField = toggleEnemyForceField;
  global.toggleEnemyShieldCapacityInput = toggleEnemyShieldCapacityInput;
  global.seedDefaultGameEnemies = seedDefaultGameEnemies;
  global.populateEnemyPiercingWeaponDropdown = populateEnemyPiercingWeaponDropdown;
  global.populateCloneEnemyDropdown = populateCloneEnemyDropdown;
  global.cloneSelectedGameEnemy = cloneSelectedGameEnemy;
  global.cloneGameEnemy = cloneGameEnemy;
  global.fetchGameWeapons = fetchGameWeapons;
  global.renderGameWeapons = renderGameWeapons;
  global.filterGameWeapons = filterGameWeapons;
  global.openAddGameWeaponModal = openAddGameWeaponModal;
  global.openEditGameWeaponModal = openEditGameWeaponModal;
  global.closeEditGameWeaponModal = closeEditGameWeaponModal;
  global.saveGameWeapon = saveGameWeapon;
  global.deleteGameWeapon = deleteGameWeapon;
  global.toggleWeaponOverheat = toggleWeaponOverheat;
  global.toggleWeaponInitial = toggleWeaponInitial;
  global.seedDefaultGameWeapons = seedDefaultGameWeapons;
  global.fetchWormholeDevices = fetchWormholeDevices;
  global.fetchWormholeDevices = fetchWormholeDevices;
  global.renderWormholeDevices = renderWormholeDevices;
  global.filterWormholeDevices = filterWormholeDevices;
  global.openAddWormholeDeviceModal = openAddWormholeDeviceModal;
  global.closeAddWormholeDeviceModal = closeAddWormholeDeviceModal;
  global.saveManualWormholeDevice = saveManualWormholeDevice;
  global.toggleWormholeDeviceSupport = toggleWormholeDeviceSupport;
  global.deleteWormholeDevice = deleteWormholeDevice;
  global.seedOpenSourceWormholeDevices = seedOpenSourceWormholeDevices;

})(window);
