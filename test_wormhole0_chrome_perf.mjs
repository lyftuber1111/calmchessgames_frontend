import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

// Root directory for static assets
const staticDir = path.resolve('.');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.obj': 'text/plain'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/wormhole0/wormhole0.html';
  const filePath = path.join(staticDir, reqPath);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found: ' + reqPath);
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

const PORT = 8899;
server.listen(PORT, '127.0.0.1', async () => {
  console.log(`[Webserver] Serving ${staticDir} on http://127.0.0.1:${PORT}`);
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chrome = spawn(chromePath, [
    '--remote-debugging-port=9222',
    '--js-flags="--expose-gc"',
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1280,720',
    '--autoplay-policy=no-user-gesture-required',
    `http://127.0.0.1:${PORT}/wormhole0/wormhole0.html`
  ]);

  let isCleanedUp = false;
  function cleanup() {
    if (isCleanedUp) return;
    isCleanedUp = true;
    try { chrome.kill(); } catch (e) {}
    try { server.close(); } catch (e) {}
  }
  process.on('exit', cleanup);
  process.on('SIGINT', () => { cleanup(); process.exit(); });

  await new Promise(r => setTimeout(r, 2000));

  try {
    const listRes = await fetch('http://127.0.0.1:9222/json');
    const pages = await listRes.json();
    const targetPage = pages.find(p => p.url.includes(`${PORT}`)) || pages[0];
    if (!targetPage) throw new Error('No target page found in Chrome!');

    console.log('[CDP] Connecting to page:', targetPage.url);
    const ws = new WebSocket(targetPage.webSocketDebuggerUrl);
    let msgId = 1;
    const pending = new Map();

    function sendCommand(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        pending.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    async function evaluate(expression) {
      const res = await sendCommand('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true
      });
      if (res && res.exceptionDetails) {
        console.error('JS Eval Exception:', res.exceptionDetails);
      }
      return res && res.result ? res.result.value : undefined;
    }

    const consoleLogs = [];
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && pending.has(data.id)) {
        const { resolve } = pending.get(data.id);
        pending.delete(data.id);
        resolve(data.result);
      } else if (data.method === 'Runtime.consoleAPICalled') {
        const args = (data.params.args || []).map(a => a.value ?? a.description ?? JSON.stringify(a)).join(' ');
        consoleLogs.push({ type: data.params.type, text: args });
        if (data.params.type === 'error') {
          console.error(`[Browser Console Error]`, args);
        }
      } else if (data.method === 'Runtime.exceptionThrown') {
        console.error('[UNCAUGHT EXCEPTION]', JSON.stringify(data.params.exceptionDetails));
      }
    };

    await new Promise(r => { ws.onopen = r; });
    console.log('[CDP] Enabling domains...');
    await sendCommand('Runtime.enable');
    await sendCommand('Log.enable');
    await sendCommand('Page.enable');
    await sendCommand('Performance.enable');
    await sendCommand('Profiler.enable');
    await sendCommand('HeapProfiler.enable');

    console.log('[Performance Tools] Starting CPU Profiler and collecting initial metrics...');
    await sendCommand('Profiler.start');
    const initialMetrics = await sendCommand('Performance.getMetrics');

    // Wait for wormhole0 engine initialization and start button enablement
    console.log('[Game] Waiting for engine initialization and start button...');
    let initialized = false;
    for (let i = 0; i < 30; i++) {
      const check = await evaluate(`
        typeof window.applyDamageToPlayer === 'function' && 
        typeof window.state !== 'undefined' &&
        document.getElementById('btn-splash-start') &&
        !document.getElementById('btn-splash-start').disabled
      `);
      if (check) {
        initialized = true;
        break;
      }
      await new Promise(r => setTimeout(r, 500));
    }
    if (!initialized) throw new Error('Game failed to initialize within timeout!');
    console.log('[Game] Engine initialized and start button enabled.');

    // Click Launch Game
    console.log('[Game] Clicking Start Game on splash screen...');
    await evaluate(`document.getElementById('btn-splash-start')?.click()`);
    // Wait for countdown overlay to activate then skip it
    await new Promise(r => setTimeout(r, 800));
    await evaluate(`
      const overlay = document.getElementById('game-countdown-overlay');
      if (overlay) overlay.click();
    `);
    // Wait for finishCountdown (150ms timeout)
    await new Promise(r => setTimeout(r, 1000));

    // Verify initial flight and enemy spawn
    const startState = await evaluate(`({
      hasStarted: window.state?.hasStarted,
      isCountdownActive: window.state?.isCountdownActive,
      isGameOver: window.state?.isGameOver,
      health: window.state?.playerHealth,
      shield: window.state?.playerShield,
      activeEnemiesCount: window.active3DEnemies ? window.active3DEnemies().length : -1,
      activeBoltsCount: window.enemyBolts ? window.enemyBolts().length : -1,
      stage: window.currentActiveStage ? window.currentActiveStage() : -1
    })`);
    console.log('[Game State - In Flight]:', startState);

    // Ensure enemies are spawned before death
    if (startState.activeEnemiesCount === 0) {
      await evaluate(`window.spawnEnemySwarmFromWormhole()`);
      await new Promise(r => setTimeout(r, 500));
    }

    const enemiesBeforeDeath = await evaluate(`window.active3DEnemies().length`);
    console.log(`[Combat] Active enemies before player death: ${enemiesBeforeDeath}`);

    // Trigger Game Over: Player takes fatal damage
    console.log('[Combat] Inflicting fatal damage to trigger Game Over...');
    await evaluate(`window.applyDamageToPlayer(200)`);
    await new Promise(r => setTimeout(r, 600));

    // Inspect Game Over state
    const gameOverState = await evaluate(`({
      isGameOver: window.state?.isGameOver,
      hasStarted: window.state?.hasStarted,
      isCountdownActive: window.state?.isCountdownActive,
      health: window.state?.playerHealth,
      shield: window.state?.playerShield,
      activeEnemiesCount: window.active3DEnemies().length,
      enemyBoltsCount: window.enemyBolts().length,
      laserBoltsCount: (typeof laserBolts !== 'undefined' ? laserBolts.length : 0),
      modalDisplay: window.getComputedStyle(document.getElementById('game-over-modal')).display
    })`);
    console.log('[Game State - Game Over Verification]:', gameOverState);

    // Check Garbage Collection metrics
    const preGCMetrics = await sendCommand('Performance.getMetrics');
    const preGCHeap = preGCMetrics.metrics.find(m => m.name === 'JSHeapUsedSize')?.value;
    console.log(`[Performance Tools] JSHeapUsedSize at Game Over: ${(preGCHeap / 1024 / 1024).toFixed(2)} MB`);

    // Run explicit GC test via window.runGarbageCollection() and HeapProfiler
    console.log('[Memory] Running Garbage Collection...');
    await evaluate(`window.runGarbageCollection()`);
    await sendCommand('HeapProfiler.collectGarbage');
    await new Promise(r => setTimeout(r, 500));

    const postGCMetrics = await sendCommand('Performance.getMetrics');
    const postGCHeap = postGCMetrics.metrics.find(m => m.name === 'JSHeapUsedSize')?.value;
    console.log(`[Performance Tools] JSHeapUsedSize after GC: ${(postGCHeap / 1024 / 1024).toFixed(2)} MB (Freed: ${((preGCHeap - postGCHeap) / 1024).toFixed(2)} KB)`);

    // Click RESTART MISSION button
    console.log('[Restart Lifecycle] Clicking RESTART MISSION button (#btn-restart-game)...');
    await evaluate(`document.getElementById('btn-restart-game')?.click()`);
    await new Promise(r => setTimeout(r, 500));

    // Verify Restart countdown is active, throttle is 0, knobs are centered, and flight holds
    const duringCountdown = await evaluate(`({
      isGameOver: window.state?.isGameOver,
      hasStarted: window.state?.hasStarted,
      isCountdownActive: window.state?.isCountdownActive,
      health: window.state?.playerHealth,
      shield: window.state?.playerShield,
      modalDisplay: window.getComputedStyle(document.getElementById('game-over-modal')).display,
      countdownDisplay: window.getComputedStyle(document.getElementById('game-countdown-overlay')).display,
      countdownHeader: document.getElementById('countdown-header-label')?.textContent,
      throttleValue: window.state?.throttleValue,
      customThrottleSliderValue: document.getElementById('custom-throttle-slider')?.value,
      flightKnobTransform: document.getElementById('touch-stick-knob')?.style?.transform,
      aimKnobTransform: document.getElementById('aim-stick-knob')?.style?.transform,
      posZ: window.state?.position?.z
    })`);
    console.log('[Restart Lifecycle - During Countdown]:', duringCountdown);

    const posZ1 = duringCountdown.posZ;
    // Wait 1.5 seconds during countdown and verify ship position did NOT drift forward
    await new Promise(r => setTimeout(r, 1500));
    const posZ2 = await evaluate(`window.state?.position?.z`);
    console.log(`[Flight Hold Verification] Pos Z during countdown: ${posZ1} -> ${posZ2} (Delta: ${posZ2 - posZ1})`);

    // Click countdown overlay to skip countdown
    console.log('[Restart Lifecycle] Skipping remaining countdown via overlay click...');
    await evaluate(`document.getElementById('game-countdown-overlay')?.click()`);
    await new Promise(r => setTimeout(r, 800));

    // Verify Game State post-restart and verify player DOES NOT automatically fly forward
    const postRestartState = await evaluate(`({
      hasStarted: window.state?.hasStarted,
      isGameOver: window.state?.isGameOver,
      isCountdownActive: window.state?.isCountdownActive,
      health: window.state?.playerHealth,
      shield: window.state?.playerShield,
      score: window.state?.score,
      stageKills: window.state?.stageKills,
      totalKills: window.state?.totalKills,
      stage: window.currentActiveStage ? window.currentActiveStage() : -1,
      activeEnemiesCount: window.active3DEnemies ? window.active3DEnemies().length : -1,
      activeBoltsCount: window.enemyBolts ? window.enemyBolts().length : -1,
      activeWeapon: window.weaponsSystem ? window.weaponsSystem.getActiveWeapon().id : 'none',
      weaponEnergy: window.weaponsSystem ? window.weaponsSystem.getActiveWeapon().energy : -1,
      weaponOverheated: window.weaponsSystem ? window.weaponsSystem.getActiveWeapon().isOverheated : null,
      throttleValue: window.state?.throttleValue,
      customThrottleSliderValue: document.getElementById('custom-throttle-slider')?.value,
      flightKnobTransform: document.getElementById('touch-stick-knob')?.style?.transform,
      aimKnobTransform: document.getElementById('aim-stick-knob')?.style?.transform,
      posZ: window.state?.position?.z,
      gameOverModalDisplay: window.getComputedStyle(document.getElementById('game-over-modal')).display,
      countdownOverlayDisplay: window.getComputedStyle(document.getElementById('game-countdown-overlay')).display
    })`);
    console.log('[Restart Lifecycle - Post-Restart Engagement State]:', postRestartState);

    // Verify that player remains at complete stop when no keys/controls are engaged
    console.log('[Stationary Verification] Checking whether player remains stationary after engagement...');
    const zStationary1 = postRestartState.posZ;
    await new Promise(r => setTimeout(r, 1200));
    const zStationary2 = await evaluate(`window.state.position.z`);
    const driftDelta = Math.abs(zStationary2 - zStationary1);
    console.log(`[Stationary Verification] Position Z stationary check: ${zStationary1.toFixed(3)} -> ${zStationary2.toFixed(3)} (Delta: ${driftDelta.toFixed(3)})`);

    // Test player controls responsiveness after restart
    console.log('[Controls] Simulating KeyW forward acceleration...');
    const zBeforeMove = await evaluate(`window.state.position.z`);
    await sendCommand('Input.dispatchKeyEvent', { type: 'keyDown', code: 'KeyW', key: 'w' });
    await new Promise(r => setTimeout(r, 1000));
    await sendCommand('Input.dispatchKeyEvent', { type: 'keyUp', code: 'KeyW', key: 'w' });
    const zAfterMove = await evaluate(`window.state.position.z`);
    console.log(`[Controls] Forward Flight Delta Z: ${zBeforeMove.toFixed(2)} -> ${zAfterMove.toFixed(2)} (Travelled: ${(zBeforeMove - zAfterMove).toFixed(2)})`);

    // Stop Profiler and collect final Performance Metrics
    console.log('[Performance Tools] Stopping CPU Profiler and collecting final metrics...');
    const cpuProfile = await sendCommand('Profiler.stop');
    const finalMetrics = await sendCommand('Performance.getMetrics');

    const metricsMap = {};
    for (const m of finalMetrics.metrics) {
      metricsMap[m.name] = m.value;
    }

    const testSummary = {
      testTimestamp: new Date().toISOString(),
      gameOverVerification: {
        allEnemiesDestroyedOnGameOver: gameOverState.activeEnemiesCount === 0,
        enemyBoltsCleanedUp: gameOverState.enemyBoltsCount === 0,
        gameOverModalVisible: gameOverState.modalDisplay === 'flex',
        playerHealthZero: gameOverState.health === 0
      },
      garbageCollectionVerification: {
        preGCHeapMB: (preGCHeap / 1024 / 1024).toFixed(2),
        postGCHeapMB: (postGCHeap / 1024 / 1024).toFixed(2),
        memoryFreedKB: ((preGCHeap - postGCHeap) / 1024).toFixed(2)
      },
      restartMissionVerification: {
        cleanRestartSucceeded: postRestartState.hasStarted === true && postRestartState.isGameOver === false,
        countdownHeldFlight: Math.abs(posZ2 - posZ1) < 0.001,
        noAutomaticFlightForward: driftDelta < 0.05,
        throttleResetToZero: postRestartState.throttleValue === 0 && Number(postRestartState.customThrottleSliderValue) === 0,
        leftAndRightControlsCentered: (postRestartState.flightKnobTransform === 'translate(0px, 0px)' || !postRestartState.flightKnobTransform) && (postRestartState.aimKnobTransform === 'translate(0px, 0px)' || !postRestartState.aimKnobTransform),
        playerHealthAndShieldRestored: postRestartState.health === 100 && postRestartState.shield === 100,
        scoreAndKillsReset: postRestartState.score === 0 && postRestartState.stageKills === 0 && postRestartState.totalKills === 0,
        stageResetToStage1: postRestartState.stage === 1,
        weaponsSystemReset: postRestartState.activeWeapon === 'red_laser' && postRestartState.weaponEnergy === 100 && !postRestartState.weaponOverheated,
        freshEnemySwarmSpawned: postRestartState.activeEnemiesCount > 0,
        flightControlsResponsive: (zBeforeMove - zAfterMove) > 1.0,
        overlaysCleanlyDismissed: postRestartState.gameOverModalDisplay === 'none' && postRestartState.countdownOverlayDisplay === 'none'
      },
      chromePerformanceReport: {
        timestamp: metricsMap.Timestamp,
        documents: metricsMap.Documents,
        frames: metricsMap.Frames,
        jsEventListeners: metricsMap.JSEventListeners,
        nodes: metricsMap.Nodes,
        layoutCount: metricsMap.LayoutCount,
        recalcStyleCount: metricsMap.RecalcStyleCount,
        layoutDurationSeconds: metricsMap.LayoutDuration,
        recalcStyleDurationSeconds: metricsMap.RecalcStyleDuration,
        scriptDurationSeconds: metricsMap.ScriptDuration,
        taskDurationSeconds: metricsMap.TaskDuration,
        jsHeapUsedMB: (metricsMap.JSHeapUsedSize / 1024 / 1024).toFixed(2),
        jsHeapTotalMB: (metricsMap.JSHeapTotalSize / 1024 / 1024).toFixed(2),
        cpuProfileSampleCount: cpuProfile.profile.samples ? cpuProfile.profile.samples.length : 0,
        cpuProfileNodeCount: cpuProfile.profile.nodes ? cpuProfile.profile.nodes.length : 0
      }
    };

    console.log('\n======================================================');
    console.log('CHROME PERFORMANCE TOOLS & RESTART MISSION TEST REPORT');
    console.log('======================================================');
    console.log(JSON.stringify(testSummary, null, 2));

    fs.writeFileSync('chrome_performance_report.json', JSON.stringify(testSummary, null, 2));
    console.log('\nReport successfully saved to chrome_performance_report.json');

  } catch (err) {
    console.error('Test execution failed:', err);
  } finally {
    cleanup();
    process.exit(0);
  }
});
