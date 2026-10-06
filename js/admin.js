/**
 * Calm Chess Computers - Casino Operations Admin
 * (c) 2026 Calm Chess Computers. All Rights Reserved.
 */

const API_BASE = "https://api.calmchessgames.com";

let activeAdminKey = "";

async function callAdminApi(action, payload = {}, method = 'POST') {
  const endpoints = [
    `${API_BASE}/admin_api.php?action=${action}&_t=${Date.now()}`,
    `./admin_api.php?action=${action}&_t=${Date.now()}`,
    `/admin_api.php?action=${action}&_t=${Date.now()}`
  ];
  const uniqueEndpoints = [...new Set(endpoints)];

  let lastError = null;
  for (const url of uniqueEndpoints) {
    try {
      const opts = {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      };
      if (method !== 'GET') {
        opts.body = JSON.stringify(payload);
      }
      const res = await fetch(url, opts);
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        return data;
      } catch (e) {}
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error("Failed to communicate with Admin API");
}

async function authenticateAdmin() {
  const pass = document.getElementById("adm-pass").value.trim();
  const authMsg = document.getElementById("auth-msg");
  if (!pass) {
    if (authMsg) authMsg.textContent = "Please enter the admin password.";
    return;
  }
  activeAdminKey = pass;
  if (authMsg) authMsg.textContent = "";
  await loadDashboard();
}

function logoutAdmin() {
  activeAdminKey = "";
  const passInput = document.getElementById("adm-pass");
  if (passInput) passInput.value = "";
  const dash = document.getElementById("dash-section");
  const auth = document.getElementById("auth-card");
  if (dash) dash.style.display = "none";
  if (auth) auth.style.display = "block";
}

async function loadDashboard() {
  const authMsg = document.getElementById("auth-msg");
  try {
    const data = await callAdminApi('get_dashboard_data', { admin_key: activeAdminKey });
    if (!data.success) {
      if (authMsg) authMsg.textContent = data.message || "Access Denied: Invalid Credentials";
      return;
    }

    const authCard = document.getElementById("auth-card");
    const dashSection = document.getElementById("dash-section");
    if (authCard) authCard.style.display = "none";
    if (dashSection) dashSection.style.display = "flex";

    // 1. Android Blackjack App Simulation Mode
    const androidSim = Boolean(data.android_simulation_mode);
    const androidBox = document.getElementById("android-sim-toggle");
    if (androidBox) androidBox.checked = androidSim;
    updateAndroidBadge(androidSim);

    // 2. Desktop HTML Blackjack App Simulation Mode
    const desktopSim = Boolean(data.desktop_simulation_mode !== undefined ? data.desktop_simulation_mode : data.simulation_mode);
    const desktopBox = document.getElementById("desktop-sim-toggle");
    if (desktopBox) desktopBox.checked = desktopSim;
    updateDesktopBadge(desktopSim);

    // 3. Allow Guest Login
    const guestBox = document.getElementById("guest-toggle");
    if (guestBox) guestBox.checked = Boolean(data.allow_guest);
    updateGuestBadge(Boolean(data.allow_guest));

    // Users
    const uTbody = document.getElementById("users-tbody");
    if (uTbody) {
      uTbody.innerHTML = "";
      (data.users || []).forEach(u => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>#${u.id}</td><td>${u.email}</td><td><strong>$${parseFloat(u.bank || 0).toFixed(2)}</strong></td><td>${u.created_at || ''}</td><td><button class="btn" style="padding:4px 8px;font-size:0.75rem;" onclick="manualBankEdit(${u.id}, ${u.bank})">Edit</button></td>`;
        uTbody.appendChild(tr);
      });
    }

    // Purchases
    if (Array.isArray(data.purchases)) {
      allAdminPurchases = data.purchases;
      renderAdminLedger();
    }
  } catch (err) {
    if (authMsg) authMsg.textContent = "Network Error: " + err.message;
  }
}

let allAdminPurchases = [];
let activeAdminPurchaseFilter = 'ALL';
let activeAdminPurchaseSearch = '';

function setAdminPurchaseFilter(filter) {
  activeAdminPurchaseFilter = filter;
  const pills = document.querySelectorAll("#admin-purchase-filter-buttons .filter-pill");
  pills.forEach(pill => {
    const fnAttr = pill.getAttribute("onclick") || "";
    pill.classList.toggle("active", fnAttr.includes(`'${filter}'`));
  });
  renderAdminLedger();
}

function handleAdminPurchaseSearch(term) {
  activeAdminPurchaseSearch = (term || "").trim().toLowerCase();
  renderAdminLedger();
}

function renderAdminLedger() {
  const pTbody = document.getElementById("ledger-tbody");
  const countBadge = document.getElementById("admin-ledger-count");
  if (!pTbody) return;

  if (!allAdminPurchases || allAdminPurchases.length === 0) {
    pTbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding:16px; color:#94a3b8;">No purchase transactions found in database ledger.</td></tr>';
    if (countBadge) countBadge.textContent = '0 transactions';
    return;
  }

  let filtered = allAdminPurchases.filter(p => {
    const method = (p.payment_method || 'PAYPAL').toUpperCase();
    if (activeAdminPurchaseFilter === 'ALL') return true;
    if (activeAdminPurchaseFilter === 'GOOGLE_PLAY') return method === 'GOOGLE_PLAY';
    if (activeAdminPurchaseFilter === 'GOOGLE_PLAY_SIMULATED') return method === 'GOOGLE_PLAY_SIMULATED';
    if (activeAdminPurchaseFilter === 'PAYPAL') return method === 'PAYPAL';
    if (activeAdminPurchaseFilter === 'PAYPAL_SIMULATED') return method === 'PAYPAL_SIMULATED';
    return true;
  });

  if (activeAdminPurchaseSearch) {
    filtered = filtered.filter(p => {
      const email = (p.email || ('user #' + p.user_id)).toLowerCase();
      const orderId = (p.order_id || p.paypal_order_id || '').toLowerCase();
      const productId = (p.product_id || '').toLowerCase();
      const token = (p.purchase_token || '').toLowerCase();
      const id = String(p.id || '');
      return email.includes(activeAdminPurchaseSearch) ||
             orderId.includes(activeAdminPurchaseSearch) ||
             productId.includes(activeAdminPurchaseSearch) ||
             token.includes(activeAdminPurchaseSearch) ||
             id.includes(activeAdminPurchaseSearch);
    });
  }

  if (countBadge) {
    countBadge.textContent = `${filtered.length} of ${allAdminPurchases.length} transaction${allAdminPurchases.length === 1 ? '' : 's'}`;
  }

  if (filtered.length === 0) {
    pTbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding:16px; color:#94a3b8;">No matching transactions found.</td></tr>';
    return;
  }

  pTbody.innerHTML = "";
  filtered.forEach(p => {
    const method = (p.payment_method || 'PAYPAL').toUpperCase();
    let methodBadge = 'badge-live';
    let methodLabel = method;

    if (method === 'GOOGLE_PLAY') {
      methodBadge = 'badge-gplay';
      methodLabel = 'Google Play (Live)';
    } else if (method === 'GOOGLE_PLAY_SIMULATED') {
      methodBadge = 'badge-sim';
      methodLabel = 'Google Play (Sim)';
    } else if (method === 'PAYPAL') {
      methodBadge = 'badge-paypal';
      methodLabel = 'PayPal (Live)';
    } else if (method === 'PAYPAL_SIMULATED') {
      methodBadge = 'badge-sim';
      methodLabel = 'PayPal (Sim)';
    }

    const orderIdDisplay = p.order_id || p.paypal_order_id || 'N/A';
    const productIdDisplay = p.product_id || ('credits_' + p.credits_added);
    const dateDisplay = p.created_at || '';

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>#${p.id}</td>
      <td title="${p.email}">${p.email}</td>
      <td><span class="badge ${methodBadge}">${methodLabel}</span></td>
      <td style="font-family: monospace; font-size: 0.78rem;">${orderIdDisplay}</td>
      <td style="font-family: monospace; font-size: 0.78rem; color:#94a3b8;">${productIdDisplay}</td>
      <td style="color:var(--gold); font-weight:bold;">+${parseInt(p.credits_added, 10).toLocaleString()}</td>
      <td>$${parseFloat(p.amount_paid || 0).toFixed(2)}</td>
      <td><span class="badge ${p.status==='COMPLETED'?'badge-sim':'badge-disabled'}">${p.status || 'COMPLETED'}</span></td>
      <td style="color:#94a3b8; font-size:0.75rem;">${dateDisplay}</td>
      <td style="text-align: center;">
        <button class="btn" style="padding:3px 8px; font-size:0.72rem;" onclick="viewAdminPurchaseDetails(${p.id})">Details</button>
      </td>
    `;
    pTbody.appendChild(tr);
  });
}

function viewAdminPurchaseDetails(purchaseId) {
  const p = allAdminPurchases.find(item => parseInt(item.id, 10) === parseInt(purchaseId, 10));
  if (!p) {
    alert("Transaction record not found.");
    return;
  }

  const modal = document.getElementById("adminPurchaseModal");
  const content = document.getElementById("adminPurchaseModalContent");
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
      <span class="purchase-detail-label">Database Record ID</span>
      <span class="purchase-detail-val">#${p.id}</span>
    </div>

    <div class="purchase-detail-row">
      <span class="purchase-detail-label">Payment Gateway & Simulation Status</span>
      <div style="display:flex; gap:8px; align-items:center; margin-top:2px;">
        <span class="badge ${method.includes('GOOGLE') ? 'badge-gplay' : 'badge-paypal'}">${gatewayTitle}</span>
        <span class="badge ${isSim ? 'badge-sim' : 'badge-live'}">${isSim ? 'Simulated Purchase' : 'Live Gateway'}</span>
        <span class="badge ${p.status === 'COMPLETED' ? 'badge-sim' : 'badge-disabled'}">${p.status || 'COMPLETED'}</span>
      </div>
    </div>

    <div class="purchase-detail-row">
      <span class="purchase-detail-label">Player Account</span>
      <span class="purchase-detail-val">${p.email || ('User #' + p.user_id)} (User ID: #${p.user_id})</span>
    </div>

    <div class="purchase-detail-row">
      <span class="purchase-detail-label">Gateway Order ID / GPA Transaction ID</span>
      <div style="display:flex; align-items:center; justify-content:space-between; margin-top:2px;">
        <span class="purchase-detail-val" style="font-family:monospace; font-weight:bold; color:var(--gold);">${orderId}</span>
        <button class="copy-chip-btn" onclick="copyAdminField('${orderId}', this)">Copy Order ID</button>
      </div>
    </div>

    <div class="purchase-detail-row">
      <span class="purchase-detail-label">Product SKU / Package ID</span>
      <span class="purchase-detail-val" style="font-family:monospace;">${productId}</span>
    </div>

    <div class="purchase-detail-row">
      <span class="purchase-detail-label">Credits & Amount</span>
      <div style="display:flex; gap:16px; margin-top:2px;">
        <div><strong>Credits Added:</strong> <span style="color:var(--gold); font-weight:bold;">+${parseInt(p.credits_added, 10).toLocaleString()} chips</span></div>
        <div><strong>Amount Paid:</strong> <span style="color:#fff; font-weight:bold;">$${parseFloat(p.amount_paid || 0).toFixed(2)} USD</span></div>
      </div>
    </div>

    ${p.payer_email || p.payer_id || p.package_name ? `
    <div class="purchase-detail-row">
      <span class="purchase-detail-label">Gateway Payer & App Metadata</span>
      <div style="display:flex; flex-direction:column; gap:4px; font-size:0.82rem; margin-top:2px;">
        ${p.payer_email ? `<div><strong>Payer Email:</strong> <span>${p.payer_email}</span></div>` : ''}
        ${p.payer_id ? `<div><strong>Payer ID:</strong> <span style="font-family:monospace;">${p.payer_id}</span></div>` : ''}
        ${p.package_name ? `<div><strong>App Package:</strong> <span style="font-family:monospace;">${p.package_name}</span></div>` : ''}
      </div>
    </div>` : ''}

    <div class="purchase-detail-row">
      <span class="purchase-detail-label">Purchase Token / Gateway Authorization Token</span>
      <div style="margin-top:4px;">
        <div style="background:rgba(0,0,0,0.5); border:1px solid #334155; border-radius:4px; padding:8px 10px; font-family:monospace; font-size:0.75rem; color:#cbd5e1; max-height:85px; overflow-y:auto; word-break:break-all;">
          ${purchaseToken || '<em style="color:#64748b;">No verification token recorded for this purchase.</em>'}
        </div>
        ${purchaseToken ? `
        <div style="display:flex; justify-content:flex-end; margin-top:4px;">
          <button class="copy-chip-btn" onclick="copyAdminField('${purchaseToken.replace(/'/g, "\\'")}', this)">Copy Token String</button>
        </div>` : ''}
      </div>
    </div>

    ${p.raw_response ? `
    <div class="purchase-detail-row">
      <span class="purchase-detail-label">Raw Gateway Verification Data (JSON)</span>
      <div style="margin-top:4px;">
        <pre style="background:rgba(0,0,0,0.6); border:1px solid #334155; border-radius:4px; padding:8px 10px; font-family:monospace; font-size:0.72rem; color:#38bdf8; max-height:120px; overflow-y:auto; margin:0; white-space:pre-wrap; word-break:break-all;">${(p.raw_response || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
        <div style="display:flex; justify-content:flex-end; margin-top:4px;">
          <button class="copy-chip-btn" onclick="copyAdminField('${p.raw_response.replace(/'/g, "\\'").replace(/\n/g, '\\n')}', this)">Copy Raw JSON</button>
        </div>
      </div>
    </div>` : ''}

    <div class="purchase-detail-row">
      <span class="purchase-detail-label">Recorded Timestamp</span>
      <span class="purchase-detail-val" style="color:#94a3b8;">${p.created_at || 'N/A'}</span>
    </div>
  `;

  modal.style.display = "flex";
}

function closeAdminPurchaseModal() {
  const modal = document.getElementById("adminPurchaseModal");
  if (modal) modal.style.display = "none";
}

function copyAdminField(text, btnElement) {
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

function updateAndroidBadge(isSim) {
  const b = document.getElementById("android-sim-status-label");
  if (!b) return;
  b.className = `badge ${isSim ? 'badge-sim' : 'badge-live'}`;
  b.textContent = isSim ? 'Simulated Purchases' : 'Live: Google Play Billing';
}

function updateDesktopBadge(isSim) {
  const b = document.getElementById("desktop-sim-status-label");
  if (!b) return;
  b.className = `badge ${isSim ? 'badge-sim' : 'badge-live'}`;
  b.textContent = isSim ? 'Simulated Checkout' : 'Live: PayPal Gateway';
}

function updateGuestBadge(isAllowed) {
  const b = document.getElementById("guest-status-label");
  if (!b) return;
  b.className = `badge ${isAllowed ? 'badge-sim' : 'badge-disabled'}`;
  b.textContent = isAllowed ? 'Guest Allowed' : 'Guests Disabled';
}

async function applyModeUpdate() {
  const androidBox = document.getElementById("android-sim-toggle");
  const desktopBox = document.getElementById("desktop-sim-toggle");
  const guestBox = document.getElementById("guest-toggle");

  const isAndroidSim = androidBox && androidBox.checked ? 1 : 0;
  const isDesktopSim = desktopBox && desktopBox.checked ? 1 : 0;
  const isGuest = guestBox && guestBox.checked ? 1 : 0;

  const statusMsg = document.getElementById("settings-status-msg");
  if (statusMsg) {
    statusMsg.textContent = "Saving to database...";
    statusMsg.style.color = "var(--gold)";
  }

  try {
    const d = await callAdminApi('set_mode', {
      admin_key: activeAdminKey,
      android_simulation_mode: isAndroidSim,
      desktop_simulation_mode: isDesktopSim,
      simulation_mode: isDesktopSim,
      allow_guest: isGuest
    });

    if (d.success) {
      if (statusMsg) {
        statusMsg.textContent = "✔ " + (d.message || "Database configuration updated successfully");
        statusMsg.style.color = "var(--success-green)";
      }
      updateAndroidBadge(Boolean(d.android_simulation_mode));
      updateDesktopBadge(Boolean(d.desktop_simulation_mode));
      updateGuestBadge(Boolean(d.allow_guest));
    } else {
      if (statusMsg) {
        statusMsg.textContent = "✖ " + (d.message || "Failed to update settings");
        statusMsg.style.color = "var(--error-red)";
      }
    }
  } catch (err) {
    if (statusMsg) {
      statusMsg.textContent = "Update Error: " + err.message;
      statusMsg.style.color = "var(--error-red)";
    }
  }
}

async function manualBankEdit(uid, current) {
  const val = prompt(`Enter new credit balance for User #${uid}:`, current);
  if (val === null || isNaN(val)) return;
  try {
    const d = await callAdminApi('adjust_user_bank', {
      admin_key: activeAdminKey,
      user_id: uid,
      new_bank: parseFloat(val)
    });
    alert(d.message || "Balance adjusted");
    await loadDashboard();
  } catch (err) {
    alert("Adjustment Error: " + err.message);
  }
}

// Event Listeners
window.addEventListener("DOMContentLoaded", () => {
  const passInput = document.getElementById("adm-pass");
  if (passInput) {
    passInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        authenticateAdmin();
      }
    });
  }

  const androidToggle = document.getElementById("android-sim-toggle");
  if (androidToggle) {
    androidToggle.addEventListener("change", (e) => updateAndroidBadge(e.target.checked));
  }

  const desktopToggle = document.getElementById("desktop-sim-toggle");
  if (desktopToggle) {
    desktopToggle.addEventListener("change", (e) => updateDesktopBadge(e.target.checked));
  }

  const guestToggle = document.getElementById("guest-toggle");
  if (guestToggle) {
    guestToggle.addEventListener("change", (e) => updateGuestBadge(e.target.checked));
  }
});

// Window Exports
window.authenticateAdmin = authenticateAdmin;
window.logoutAdmin = logoutAdmin;
window.loadDashboard = loadDashboard;
window.applyModeUpdate = applyModeUpdate;
window.manualBankEdit = manualBankEdit;
window.setAdminPurchaseFilter = setAdminPurchaseFilter;
window.handleAdminPurchaseSearch = handleAdminPurchaseSearch;
window.viewAdminPurchaseDetails = viewAdminPurchaseDetails;
window.closeAdminPurchaseModal = closeAdminPurchaseModal;
window.copyAdminField = copyAdminField;