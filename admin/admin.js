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
          `${API_BASE}/admin_api.php?action=${action}&_t=${Date.now()}`,
          `https://api.calmchessgames.com/admin_api.php?action=${action}&_t=${Date.now()}`,
          `${API_BASE}/admin/admin_api.php?action=${action}&_t=${Date.now()}`,
          `https://api.calmchessgames.com/admin/admin_api.php?action=${action}&_t=${Date.now()}`,
          `./admin_api.php?action=${action}&_t=${Date.now()}`,
          `admin_api.php?action=${action}&_t=${Date.now()}`,
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

              // Ensure search input on Blackjack Users tab is blank/unpopulated
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

      const contentSegments = document.getElementById('tabContentSegments');
      const contentUsers = document.getElementById('tabContentUsers');
      const contentStore = document.getElementById('tabContentStore');
      const contentDeletions = document.getElementById('tabContentDeletions');
      const contentResets = document.getElementById('tabContentResets');
      const contentAppointments = document.getElementById('tabContentAppointments');

      if (tabBtnSegments) tabBtnSegments.classList.toggle('active', targetTab === 'segments');
      if (tabBtnUsers) tabBtnUsers.classList.toggle('active', targetTab === 'users');
      if (tabBtnStore) tabBtnStore.classList.toggle('active', targetTab === 'store');
      if (tabBtnDeletions) tabBtnDeletions.classList.toggle('active', targetTab === 'deletions');
      if (tabBtnResets) tabBtnResets.classList.toggle('active', targetTab === 'resets');
      if (tabBtnAppointments) tabBtnAppointments.classList.toggle('active', targetTab === 'appointments');

      if (contentSegments) contentSegments.style.display = (targetTab === 'segments') ? 'block' : 'none';
      if (contentUsers) contentUsers.style.display = (targetTab === 'users') ? 'block' : 'none';
      if (contentStore) contentStore.style.display = (targetTab === 'store') ? 'block' : 'none';
      if (contentDeletions) contentDeletions.style.display = (targetTab === 'deletions') ? 'block' : 'none';
      if (contentResets) contentResets.style.display = (targetTab === 'resets') ? 'block' : 'none';
      if (contentAppointments) contentAppointments.style.display = (targetTab === 'appointments') ? 'block' : 'none';

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
      }
  }

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
                          ${ringLabel} — Segment #${seg.segment_index}
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
              alert('✔ Ring settings saved successfully to MySQL database!');
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

  /* --- TAB 2: BLACKJACK USERS MANAGEMENT --- */
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
      // Excluded from the Blackjack Users tab and managed exclusively in the dedicated Purge tab.
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
                  👤 GUEST
              </span>
          ` : '';

          const resetBadgeHtml = hasPendingReset ? `
              <span class="badge-status badge-reset" style="background: rgba(243, 156, 18, 0.2); border: 1px solid #f39c12; color: #f39c12; font-weight: 700; padding: 2px 7px; border-radius: 4px; font-size: 0.72rem;" title="User has requested a password reset. Token active.">
                  🔑 RESET REQUESTED
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
                      #${user.id} — <span id="user_display_${user.id}">${escapeHtml(user.email || user.username)}</span>
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
                      <strong>🔑 Password Reset Request Pending:</strong> Active token expires at <em>${escapeHtml(resetExp || '1 hour')}</em>.
                  </div>
                  <div style="display: flex; gap: 6px;">
                      <button type="button" class="btn btn-sm" style="background: #f39c12; color: #1a1000; font-weight: 700; padding: 2px 8px; font-size: 0.72rem;" onclick="copyUserResetLink('${escapeHtml(user.email || user.username)}', ${resetTokenId || 0})">
                          📋 Copy Reset URL
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
              showUserAdminAlert(`✔ User ${email} created successfully with $${bank} bankroll!`, true);
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
              showUserAdminAlert(`✔ User #${userId} (${email}) updated successfully!`, true);
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
              showUserAdminAlert(`✔ User #${userId} is now ${shouldBan ? 'BANNED' : 'ACTIVE'}.`, true);
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
              showUserAdminAlert(`✔ User #${userId} (${userEmail}) permanently PURGED. Financial ledger pseudonymized for 7-year audit retention.`, true);
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
              showUserAdminAlert(`✔ User #${userId} deleted. Financial records pseudonymized for 7-year audit retention.`, true);
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
          androidCheckLabel.textContent = isAndroidSim ? '[✔] Simulated Active' : '[  ] Live Google Play';
          androidCheckLabel.style.color = isAndroidSim ? 'var(--success-green)' : 'var(--gold-primary)';
      }
      if (androidExplanation) {
          androidExplanation.innerHTML = isAndroidSim 
              ? 'Simulated Mode Active — Android in-app credit purchases use <strong>Instant Free Refills</strong> (<code>android_simulation_mode = 1</code>).'
              : 'Live Billing Active — Android in-app purchases use official <strong>Google Play In-App Billing</strong> (<code>android_simulation_mode = 0</code>).';
      }

      const desktopBadge = document.getElementById('desktopSimBadge');
      const desktopExplanation = document.getElementById('desktopModeExplanation');
      const desktopCheckLabel = document.getElementById('desktopCheckMarkLabel');
      if (desktopBadge) {
          desktopBadge.className = `badge-status ${isDesktopSim ? 'badge-sim' : 'badge-live'}`;
          desktopBadge.textContent = isDesktopSim ? 'Simulated Checkout Active' : 'Live: PayPal Gateway';
      }
      if (desktopCheckLabel) {
          desktopCheckLabel.textContent = isDesktopSim ? '[✔] Simulated Active' : '[  ] Live PayPal';
          desktopCheckLabel.style.color = isDesktopSim ? 'var(--success-green)' : 'var(--gold-primary)';
      }
      if (desktopExplanation) {
          desktopExplanation.innerHTML = isDesktopSim
              ? 'Simulated Mode Active — Desktop players receive instant simulated credits without charging PayPal (<code>desktop_simulation_mode = 1</code>).'
              : 'Live Billing Active — Desktop players purchase chips through <strong>PayPal Orders v2</strong> (<code>desktop_simulation_mode = 0</code>).';
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
          geminiCheckLabel.textContent = isGemini ? '[✔] Active' : '[  ] Disabled';
          geminiCheckLabel.style.color = isGemini ? '#93c5fd' : 'var(--text-muted)';
      }
      if (geminiExplanation) {
          geminiExplanation.innerHTML = isGemini
              ? (isGeminiConfigured
                  ? 'Gemini 3.8 Flash live dealer commentary and strategic probabilities active via Google GenAI Interactions API.'
                  : 'Gemini 3.8 Flash commentary active with built-in mathematical Basic Strategy & casino fallback engine.')
              : 'Gemini AI dealer commentary and strategy advice are disabled for this table.';
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
              showStoreAlert(`✔ Database updated successfully!\nAndroid: [${androidLabel}] | Desktop: [${desktopLabel}] | Gemini AI: [${geminiLabel}]`, true);
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
              showStoreAlert(`✔ Admin access restricted to: ${newIp}`, true);
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
          if (activePurchaseFilter === 'ALL') return true;
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

          const isDeletedUser = !p.user_id || p.user_id === 0 || p.email === '[Deleted User - 7-Yr Retained]' || String(p.email).includes('Deleted User') || p.email === 'User #null';
          let userDisplayHtml = '';
          if (isDeletedUser) {
              userDisplayHtml = `<span class="badge-status badge-banned" style="font-size: 0.72rem; letter-spacing: 0.5px;">[Deleted User - 7-Yr Retained]</span>`;
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

      const isDeletedUser = !p.user_id || p.user_id === 0 || p.email === '[Deleted User - 7-Yr Retained]' || String(p.email).includes('Deleted User') || p.email === 'User #null';
      const playerInfoDisplay = isDeletedUser
          ? `<span class="badge-status badge-banned" style="font-size: 0.75rem;">[Deleted User - 7-Yr Retained]</span> <span style="color: var(--text-muted); font-size: 0.8rem; margin-left: 6px;">(Account & credentials purged per GDPR/Play compliance; transaction retained for 7-year audit)</span>`
          : `${escapeHtml(p.email || ('User #' + p.user_id))} (User ID: #${p.user_id})`;

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
          btnElement.textContent = 'Copied! ✔';
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
              actionButtons = '<span style="color: #2ecc71; font-size: 0.82rem; font-weight: bold;">✓ Purged (7-Yr Financial Ledger Preserved)</span>';
          } else {
              actionButtons = '<span style="color: #94a3b8; font-size: 0.82rem;">Dismissed</span>';
          }

          const submittedDate = r.created_at ? r.created_at.replace('T', ' ').substring(0, 19) : '—';

          html += `
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
                  <td style="padding: 10px 12px; font-weight: bold; color: var(--gold-primary);">${r.id}</td>
                  <td style="padding: 10px 12px; font-weight: 600; color: #fff;">${escapeHtml(r.identifier || '—')}</td>
                  <td style="padding: 10px 12px; color: var(--text-muted); font-size: 0.82rem;">${submittedDate}</td>
                  <td style="padding: 10px 12px;">${statusBadge}</td>
                  <td style="padding: 10px 12px; color: var(--text-muted); font-size: 0.85rem;" title="${escapeHtml(r.reason || '')}">${escapeHtml(r.reason || '—')}</td>
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
              actionButtons = '<span style="color: #2ecc71; font-size: 0.8rem; font-weight: 700;">✓ Consumed</span>';
          } else {
              actionButtons = '<span style="color: #94a3b8; font-size: 0.8rem;">Inactive</span>';
          }

          const createdDate = r.created_at ? r.created_at.replace('T', ' ').substring(0, 19) : '—';
          const expiresDate = r.expires_at ? r.expires_at.replace('T', ' ').substring(0, 19) : '—';
          const authMethod = r.verification_type || 'Email Response';

          html += `
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
                  <td style="padding: 10px 12px; font-weight: bold; color: var(--gold-primary);">${r.id}</td>
                  <td style="padding: 10px 12px; font-weight: 600; color: #fff;">${escapeHtml(r.identifier || '—')}</td>
                  <td style="padding: 10px 12px; font-size: 0.82rem; color: #55efc4; font-weight: 600;">${escapeHtml(authMethod)}</td>
                  <td style="padding: 10px 12px; color: var(--text-muted); font-size: 0.82rem;">${createdDate}</td>
                  <td style="padding: 10px 12px; color: var(--text-muted); font-size: 0.82rem;">${expiresDate}</td>
                  <td style="padding: 10px 12px;">${statusBadge}</td>
                  <td style="padding: 10px 12px; font-family: monospace; font-size: 0.8rem; color: #94a3b8;">${escapeHtml(r.ip_address || '—')}</td>
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

              const attentionCount = (parseInt(stats.pending, 10) || 0) + (parseInt(data.unread_messages !== undefined ? data.unread_messages : (res.unread_messages || 0), 10) || 0);
              if (badgeEl) {
                  if (attentionCount > 0) {
                      badgeEl.textContent = attentionCount;
                      badgeEl.style.display = 'inline-block';
                  } else {
                      badgeEl.style.display = 'none';
                  }
              }

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
          const safePhone = escapeHtml(app.attendee_phone || '—');
          const safeDate = escapeHtml(app.appointment_date || '—');
          const safeTime = escapeHtml(app.appointment_time || '—');
          const safeTz = escapeHtml(app.timezone || 'EST');
          const safeTopic = escapeHtml(app.topic || 'Consultation');
          const safeNotes = escapeHtml(app.notes || '—');

          return `
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
                  <td style="padding: 10px 12px; font-weight:700; color:var(--gold-primary);">${app.id}</td>
                  <td style="padding: 10px 12px;">
                      <strong style="color:#fff; font-size:0.95rem;">${safeName}</strong>
                  </td>
                  <td style="padding: 10px 12px; font-size:0.85rem;">
                      <div><a href="mailto:${safeEmail}" style="color:var(--accent-blue); text-decoration:none;">✉️ ${safeEmail}</a></div>
                      ${app.attendee_phone ? `<div><a href="tel:${safePhone}" style="color:#94a3b8; text-decoration:none;">📞 ${safePhone}</a></div>` : ''}
                  </td>
                  <td style="padding: 10px 12px; font-size:0.86rem; color:#cbd5e1;">
                      <div style="font-weight:700; color:#fff;">📅 ${safeDate}</div>
                      <div style="color:var(--gold-primary);">⏰ ${safeTime} <span style="font-size:0.75rem; color:#94a3b8;">(${safeTz})</span></div>
                  </td>
                  <td style="padding: 10px 12px; font-size:0.85rem;">
                      <div style="font-weight:600; color:#cbd5e1;">${safeTopic}</div>
                      ${app.notes ? `<div style="color:#94a3b8; font-style:italic; max-width:240px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${safeNotes}">📝 ${safeNotes}</div>` : ''}
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

          const safeSender = escapeHtml(msg.sender_name || 'Anonymous');
          const safeEmail = escapeHtml(msg.sender_email || '');
          const safeSubject = escapeHtml(msg.subject || '(No Subject)');
          const safeMsg = escapeHtml(msg.message || '');
          const dateStr = msg.created_at ? msg.created_at.slice(0, 16).replace('T', ' ') : '—';

          return `
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
                  <td style="padding: 10px 12px; text-align: center;">
                      <input type="checkbox" class="contact-msg-checkbox" value="${msg.id}" onchange="onContactMessageCheckboxChange()" style="cursor: pointer; width: 16px; height: 16px;">
                  </td>
                  <td style="padding: 10px 12px; font-weight:700; color:var(--gold-primary);">${msg.id}</td>
                  <td style="padding: 10px 12px; font-size:0.82rem; color:#94a3b8;">${dateStr}</td>
                  <td style="padding: 10px 12px;">
                      <div style="font-weight:700; color:#fff;">${safeSender}</div>
                      <div><a href="mailto:${safeEmail}?subject=Re:%20${encodeURIComponent(msg.subject || 'Calm Chess Consultation')}" style="color:var(--accent-blue); text-decoration:none; font-size:0.82rem;">✉️ ${safeEmail}</a></div>
                  </td>
                  <td style="padding: 10px 12px; font-weight:600; color:#fed7aa; font-size:0.88rem;">${safeSubject}</td>
                  <td style="padding: 10px 12px; font-size:0.84rem; color:#cbd5e1; max-width:280px;">
                      <div style="max-height:60px; overflow-y:auto; line-height:1.4;">${safeMsg}</div>
                  </td>
                  <td style="padding: 10px 12px;">
                      <select onchange="updateContactMessageStatus(${msg.id}, this.value)" style="${badgeStyle} border-radius:4px; padding:3px 8px; font-size:0.82rem; font-weight:700; cursor:pointer;">
                          <option value="unread" ${st === 'unread' ? 'selected' : ''}>Unread</option>
                          <option value="read" ${st === 'read' ? 'selected' : ''}>Read</option>
                          <option value="replied" ${st === 'replied' ? 'selected' : ''}>Replied</option>
                          <option value="archived" ${st === 'archived' ? 'selected' : ''}>Archived</option>
                      </select>
                  </td>
                  <td style="padding: 10px 12px; text-align:center; white-space: nowrap;">
                      <a href="mailto:${safeEmail}?subject=Re:%20${encodeURIComponent(msg.subject || 'Calm Chess Consultation')}" class="btn btn-sm btn-gold" style="padding:4px 8px; font-size:0.78rem; text-decoration:none; display:inline-block; margin-right:4px;" onclick="updateContactMessageStatus(${msg.id}, 'replied')">✉️ Reply</a>
                      <button class="btn btn-sm" style="background:#ef4444; color:#fff; padding:4px 8px; font-size:0.78rem; border:none; border-radius:4px; cursor:pointer;" onclick="deleteContactMessage(${msg.id})" title="Delete message">🗑️ Delete</button>
                  </td>
              </tr>
          `;
      }).join('');
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
      if (btn) {
          btn.style.display = count > 0 ? 'inline-flex' : 'none';
      }
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

      if (title) title.textContent = '📅 Schedule Consultation Appointment';
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

      if (title) title.textContent = `✏️ Edit Appointment #${app.id}`;
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
      if (authInput && !authInput.dataset.boundEnter) {
          authInput.dataset.boundEnter = 'true';
          authInput.addEventListener('keydown', (e) => {
              if (e.key === 'Enter') {
                  e.preventDefault();
                  authenticateAdmin();
              }
          });
      }
  }

  if (document.readyState === 'loading') {
      window.addEventListener('DOMContentLoaded', initAdminConsole);
  } else {
      initAdminConsole();
  }
  window.addEventListener('load', () => {
      fetchPublicGuestStats();
  });

})(window);