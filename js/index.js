const API_BASE = 'https://api.calmchessgames.com';
        let showSegmentIdsOnRing = false;

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
            // 1. Immediately hydrate from localStorage for instantaneous persistence
            try {
                const cached = localStorage.getItem('calmchess_segments');
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        currentSegments = parsed;
                        renderRings();
                        renderGamesGrid();
                    }
                }
            } catch (e) {
                console.warn('Error reading cached segments:', e);
            }

            // 2. Fetch latest segments from backend API
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
                            if (data && data.success && data.segments && data.segments.length > 0) break;
                        }
                    } catch (e) {
                        // try next candidate endpoint
                    }
                }
                clearTimeout(timeoutId);

                if (data && data.success && data.segments && data.segments.length > 0) {
                    currentSegments = data.segments.map(apiSeg => {
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

        // Generate circular arc for curved textPath with proper left-to-right reading direction
        function describeTextPath(cx, cy, radius, startAngle, endAngle, sweepClockwise) {
            const pStart = polarToCartesian(cx, cy, radius, sweepClockwise ? startAngle : endAngle);
            const pEnd = polarToCartesian(cx, cy, radius, sweepClockwise ? endAngle : startAngle);
            const largeArcFlag = Math.abs(endAngle - startAngle) <= 180 ? "0" : "1";
            const sweepFlag = sweepClockwise ? "1" : "0";
            return `M ${pStart.x} ${pStart.y} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${pEnd.x} ${pEnd.y}`;
        }

        // Code-based Sci-Fi Laser Audio Synthesizer (Web Audio API)
        let laserAudioCtx = null;
        function playSciFiLaser() {
            try {
                const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
                if (!AudioCtxClass) return;
                if (!laserAudioCtx) {
                    laserAudioCtx = new AudioCtxClass();
                }
                if (laserAudioCtx.state === 'suspended') {
                    laserAudioCtx.resume();
                }

                const now = laserAudioCtx.currentTime;

                // Primary downward pitch sweep (Sawtooth wave for gritty laser bite)
                const oscPrimary = laserAudioCtx.createOscillator();
                oscPrimary.type = 'sawtooth';
                oscPrimary.frequency.setValueAtTime(1550, now);
                oscPrimary.frequency.exponentialRampToValueAtTime(70, now + 0.17);

                // Secondary harmonic oscillator (Sine wave for laser body & thud)
                const oscSecondary = laserAudioCtx.createOscillator();
                oscSecondary.type = 'sine';
                oscSecondary.frequency.setValueAtTime(900, now);
                oscSecondary.frequency.exponentialRampToValueAtTime(110, now + 0.14);

                // Resonant bandpass filter (producing the classic vocalic sci-fi "pew" sweep)
                const biquadFilter = laserAudioCtx.createBiquadFilter();
                biquadFilter.type = 'bandpass';
                biquadFilter.Q.setValueAtTime(3.8, now);
                biquadFilter.frequency.setValueAtTime(2400, now);
                biquadFilter.frequency.exponentialRampToValueAtTime(240, now + 0.17);

                // Sharp attack and smooth exponential decay envelope
                const gainEnvelope = laserAudioCtx.createGain();
                gainEnvelope.gain.setValueAtTime(0.35, now);
                gainEnvelope.gain.exponentialRampToValueAtTime(0.001, now + 0.19);

                // Route audio graph
                oscPrimary.connect(biquadFilter);
                oscSecondary.connect(biquadFilter);
                biquadFilter.connect(gainEnvelope);
                gainEnvelope.connect(laserAudioCtx.destination);

                // Fire laser
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
                setTimeout(() => {
                    window.location.href = url;
                }, 130);
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

            // Render Inner Ring
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

                    // Text Path: centered vertically inside inner ring at radius = 100
                    const textRadius = 100;
                    // For bottom half (90 to 270 deg), sweep counter-clockwise so letters stay upright
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

            // Render Outer Ring
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

                    // Text Path: centered vertically inside outer ring at radius = 175
                    const textRadius = 175;
                    // For bottom segments (midAngle between 100 and 250 deg), sweep counter-clockwise so letters stay upright
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
            currentSegments.forEach(seg => {
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

        centerLogo.addEventListener('click', (e) => {
            e.stopPropagation();
            clickCount++;
			
			 if (clickCount === 1) {
				 clickTimer0 = setTimeout(() => {
                   centerLogo.innerHTML='
                   
					<a href="https://calmchessgames.com/" class="btn" style="display:inline-block; margin-top:15px; text-align:center;">Go Home</a>
					';
					clickCount = 0;
				 
				}, 700);
					clickTimer1 = setTimeout(() => {
                    clickCount = 0;
                }, 600);
            } else if (clickCount === 3) {
				
				clearTimeout(clickTimer1);
                clickCount = 0;
                promptAdminPassword();
            }else if(clickCount===2){               
				clearTimeout(clickTimer0);
				}
        });

        function promptAdminPassword() {
            const authModal = document.getElementById('adminPasswordModal');
            const authInput = document.getElementById('adminAuthInput');
            const authError = document.getElementById('adminAuthError');
            if (authInput) authInput.value = '';
            if (authError) {
                authError.innerText = '';
                authError.style.display = 'none';
            }
            if (authModal) authModal.style.display = 'flex';
            if (authInput) {
                setTimeout(() => authInput.focus(), 50);
            }
        }

        function closeAdminPasswordModal() {
            const authModal = document.getElementById('adminPasswordModal');
            const authInput = document.getElementById('adminAuthInput');
            if (authInput) authInput.value = '';
            if (authModal) authModal.style.display = 'none';
        }

        function submitAdminPassword() {
            const authInput = document.getElementById('adminAuthInput');
            const authError = document.getElementById('adminAuthError');
            const password = authInput ? authInput.value.trim() : '';

            if (!password) {
                if (authError) {
                    authError.innerText = 'Password cannot be empty.';
                    authError.style.display = 'block';
                }
                if (authInput) authInput.focus();
                return;
            }

            closeAdminPasswordModal();
            openAdminModal(password);
        }

        // Allow pressing Enter key in adminAuthInput to submit
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

        function openAdminModal(providedPassword = '') {
            const adminPwdInput = document.getElementById('adminPassword');
            if (adminPwdInput) {
                adminPwdInput.value = providedPassword;
            }

            const listContainer = document.getElementById('adminSegmentsList');
            listContainer.innerHTML = '';
            currentSegments.forEach((seg, index) => {
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
            document.getElementById('adminModal').style.display = 'flex';
        }

        function closeAdminModal() {
            const adminPwdInput = document.getElementById('adminPassword');
            if (adminPwdInput) {
                adminPwdInput.value = '';
            }
            const authInput = document.getElementById('adminAuthInput');
            if (authInput) {
                authInput.value = '';
            }
            document.getElementById('adminModal').style.display = 'none';
        }

        async function saveSegments() {
            const adminPwdInput = document.getElementById('adminPassword');
            let password = adminPwdInput ? adminPwdInput.value.trim() : '';

            if (!password) {
                alert('Admin password is required to save changes.');
                if (adminPwdInput) adminPwdInput.focus();
                return;
            }

            const updatedSegments = currentSegments.map((seg, index) => {
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

            // Set loading state on both top and bottom save buttons
            const saveButtons = document.querySelectorAll('.admin-modal .btn-save, .admin-modal button[onclick="saveSegments()"]');
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

                for (const targetUrl of uniqueUrls) {
                    try {
                        const response = await fetch(targetUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ admin_password: password, segments: updatedSegments })
                        });
                        const result = await response.json();
                        if (result.success) {
                            savedToServer = true;
                            break;
                        } else {
                            errorMsg = result.message || result.error || 'Unauthorized';
                            if (response.status === 401) {
                                break;
                            }
                        }
                    } catch (e) {
                        // try next candidate endpoint
                    }
                }

                if (savedToServer) {
                    currentSegments = updatedSegments;
                    localStorage.setItem('calmchess_segments', JSON.stringify(updatedSegments));
                    renderRings();
                    renderGamesGrid();
                    alert('Segments updated successfully in database!');
                    closeAdminModal();
                } else if (errorMsg && errorMsg.includes('credentials')) {
                    alert('Error: ' + errorMsg + '. Please check your Admin Password.');
                    if (adminPwdInput) adminPwdInput.focus();
                } else {
                    currentSegments = updatedSegments;
                    localStorage.setItem('calmchess_segments', JSON.stringify(updatedSegments));
                    renderRings();
                    renderGamesGrid();
                    alert('Changes saved locally. (Backend server unreachable: ' + (errorMsg || 'CORS / Network restriction') + ')');
                    closeAdminModal();
                }
            } catch (err) {
                console.error('Error saving segments:', err);
                currentSegments = updatedSegments;
                localStorage.setItem('calmchess_segments', JSON.stringify(updatedSegments));
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

        // Immediate initial render for instant FCP and offline readiness
        renderRings();
        renderGamesGrid();
        // Fetch latest segments from API
        window.addEventListener('DOMContentLoaded', fetchSegments);
