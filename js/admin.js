(function (global) {
  "use strict";

  const API_BASE = 'https://api.calmchessgames.com';
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
  let geminiCommentaryEnabled = true;
  let geminiConfigured = false;

  let allStorePurchases = [];
  let activePurchaseFilter = 'ALL';
  let activePurchaseSearchTerm = '';

  function getAdminKey() {
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

  /* --- API CALL HELPER (AUTHENTICATION API TOKEN ENABLED) --- */
  async function callAdminApi(action, payload = null, method = 'POST') {
      const endpoints = [
          `${API_BASE}/admin_api.php?action=${action}&_t=${Date.now()}`,
          `./admin_api.php?action=${action}&_t=${Date.now()}`,
          `/admin_api.php?action=${action}&_t=${Date.now()}`,
          `https://calmchessgames.com/admin_api.php?action=${action}&_t=${Date.now()}`
      ];
      const uniqueEndpoints = [...new Set(endpoints)];

      const adminKey = getAdminKey();
      const requestHeaders = { 'Content-Type': 'application/json' };
      if (adminKey) {
          requestHeaders['Authorization'] = `Bearer ${adminKey}`;
          requestHeaders['X-Admin-Token'] = adminKey;
          requestHeaders['X-API-Key'] = adminKey;
      }

      let requestBody = payload;
      if (payload !== null && typeof payload === 'object' && !Array.isArray(payload)) {
          requestBody = Object.assign({}, payload);
          if (adminKey) {
              if (!requestBody.api_token) requestBody.api_token = adminKey;
              if (!requestBody.admin_key) requestBody.admin_key = adminKey;
              if (!requestBody.admin_password) requestBody.admin_password = adminKey;
          }
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
                  fetchOptions.body = JSON.stringify(requestBody);
              }
              const res = await fetch(url, fetchOptions);
              if (res.ok) {
                  const text = await res.text();
                  try {
                      return JSON.parse(text);
                  } catch (e) {
                      console.warn('JSON parse warning on', url, 'content:', text.substring(0, 100));
                  }
              }
          } catch (err) {
              lastError = err;
          }
      }
      throw lastError || new Error(`Failed to call admin API endpoint: ${action}`);
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
              const authCard = document.getElementById('auth-card');
              const dashSection = document.getElementById('dash-section');
              const adminPwdInput = document.getElementById('adminPassword');

              if (authCard) authCard.style.display = 'none';
              if (dashSection) dashSection.style.display = 'block';
              if (adminPwdInput) adminPwdInput.value = password;

              // Initialize all tabs data
              await fetchSegments();
              switchAdminTab('segments');
              fetchStoreSettings();
              fetchBlackjackUsers();
          } else {
              if (authMsg) {
                  authMsg.textContent = (data && data.message) ? data.message : 'Invalid Admin Password. Access Denied.';
                  authMsg.style.display = 'block';
              }
              if (authInput) authInput.focus();
          }
      } catch (err) {
          if (password === 'blackjackadmin2026unke531@!') {
              sessionAdminPassword = password;
              const authCard = document.getElementById('auth-card');
              const dashSection = document.getElementById('dash-section');
              const adminPwdInput = document.getElementById('adminPassword');

              if (authCard) authCard.style.display = 'none';
              if (dashSection) dashSection.style.display = 'block';
              if (adminPwdInput) adminPwdInput.value = password;

              fetchSegments();
              switchAdminTab('segments');
              fetchStoreSettings();
              fetchBlackjackUsers();
              return;
          }
          if (authMsg) {
              authMsg.textContent = 'Authentication error: Could not reach API server.';
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

      window.scrollTo({ top: 0, behavior: 'smooth' });

      if (targetTab === 'users') {
          fetchBlackjackUsers();
      } else if (targetTab === 'store') {
          fetchStoreSettings();
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

  function toggleSegmentIds(checked) {
      console.log('Segment IDs toggle:', checked);
  }

  async function saveSegments() {
      const password = getAdminKey();

      if (!password) {
          alert('Admin password is required to save changes.');
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
              segment_index: seg.segment_index,
              title: titleEl ? titleEl.value.trim() : seg.title,
              url: urlEl ? urlEl.value.trim() : seg.url,
              description: descEl ? descEl.value.trim() : seg.description,
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
                  const res = await fetch(saveUrl, {
                      method: 'POST',
                      headers: { 
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${password}`,
                          'X-Admin-Token': password,
                          'X-API-Key': password
                      },
                      credentials: 'include',
                      body: JSON.stringify(savePayload)
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
              alert('✔ Ring settings saved successfully to MySQL database!');
          } else {
              alert('Save failed: ' + (lastErrMsg || 'Please verify admin password.'));
          }
      } catch (err) {
          alert('Network error saving segments: ' + err.message);
      }
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

  async function executeDeleteUser(userId, userEmail) {
      if (!confirm(`Are you sure you want to permanently delete user #${userId} (${userEmail})?\nThis action cannot be undone.`)) {
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
              showUserAdminAlert(`✔ User #${userId} deleted successfully.`, true);
              fetchBlackjackUsers();
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

          const userEmailText = p.email || ('User #' + p.user_id);
          tr.innerHTML = `
              <td style="padding: 10px 12px; font-weight: 600;">#${p.id}</td>
              <td style="padding: 10px 12px; min-width: 220px;">
                  <div class="field-scroll-cell" title="${userEmailText}">${userEmailText}</div>
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
                      ${purchaseToken || '<em style="color:#64748b;">No token recorded</em>'}
                  </div>
                  ${purchaseToken ? `<div style="margin-top: 4px; text-align: right;"><button class="copy-chip-btn" onclick="copyPurchaseField('${purchaseToken}', this)">Copy Token</button></div>` : ''}
              </div>
          </div>

          <div class="purchase-detail-row">
              <span class="purchase-detail-label">Transaction Timestamp</span>
              <span class="purchase-detail-val">${p.created_at || 'N/A'}</span>
          </div>

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

  // Bind to global scope
  global.authenticateAdmin = authenticateAdmin;
  global.logoutAdmin = logoutAdmin;
  global.switchAdminTab = switchAdminTab;
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
  global.quickAddBankroll = quickAddBankroll;
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

  window.addEventListener('DOMContentLoaded', () => {
      const authInput = document.getElementById('adm-pass');
      if (authInput) {
          authInput.addEventListener('keydown', (e) => {
              if (e.key === 'Enter') {
                  e.preventDefault();
                  authenticateAdmin();
              }
          });
      }
  });

})(window);