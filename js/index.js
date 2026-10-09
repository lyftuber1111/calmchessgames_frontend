(function (global) {
  "use strict";

  const API_BASE = 'https://api.calmchessgames.com';
  let showSegmentIdsOnRing = false;
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

  if (centerLogo) {
      centerLogo.addEventListener('click', (e) => {
          e.stopPropagation();
          if (centerLogoUrl && centerLogoUrl.trim() !== '') {
              handleCenterLogoRedirect(centerLogoUrl);
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

  // Standalone admin portal redirect fallback if invoked programmatically
  function promptAdminPassword() {
      window.location.href = 'admin.html';
  }

  function openAdminModal() {
      window.location.href = 'admin.html';
  }

  // Explicit Global Scope Binding
  global.handleCenterLogoRedirect = handleCenterLogoRedirect;
  global.handleRingSegmentPress = handleRingSegmentPress;
  global.toggleSegmentIds = toggleSegmentIds;
  global.promptAdminPassword = promptAdminPassword;
  global.openAdminModal = openAdminModal;
  global.renderRings = renderRings;
  global.renderGamesGrid = renderGamesGrid;
  global.fetchSegments = fetchSegments;

  renderRings();
  renderGamesGrid();
  window.addEventListener('DOMContentLoaded', fetchSegments);

})(window);