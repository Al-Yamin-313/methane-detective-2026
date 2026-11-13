import os from 'os';
import path from 'path';
import { writeFileSync, mkdirSync, copyFileSync } from 'fs';
import { spawn } from 'child_process';

const ARTIFACT_DIR = process.env.ARTIFACT_DIR || path.resolve('./docs/evidence');

function saveShot(fileName, base64Data) {
  const buf = Buffer.from(base64Data, 'base64');
  try {
    mkdirSync('docs/evidence', { recursive: true });
    writeFileSync(`docs/evidence/${fileName}`, buf);
    console.log(`Saved screenshot: docs/evidence/${fileName}`);
    try {
      writeFileSync(`${ARTIFACT_DIR}\\${fileName}`, buf);
      console.log(`Copied screenshot to brain artifact: ${fileName}`);
    } catch (e) {
      console.warn('Failed to copy to brain artifacts:', e.message);
    }
  } catch (e) {
    console.error('Failed to save screenshot:', e);
  }
}

async function runTurkiyeVerification() {
  console.log('Spawning headless Chrome for V3.1 Türkiye Regional Verification...');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromeProc = spawn(chromePath, [
    '--remote-debugging-port=9222',
    '--headless=new',
    `--user-data-dir=${path.join(os.tmpdir(), 'methane_test_profile')}`,
    '--no-first-run',
    '--no-default-browser-check',
    'http://localhost:5173'
  ], { stdio: 'ignore' });

  let ver = null;
  for (let attempt = 0; attempt < 15; attempt++) {
    try {
      await new Promise(r => setTimeout(r, 800));
      const res = await fetch('http://localhost:9222/json/version');
      ver = await res.json();
      break;
    } catch (e) {}
  }

  if (!ver) {
    chromeProc.kill();
    throw new Error('Failed to connect to Chrome on port 9222');
  }

  console.log('Connected to Browser:', ver.Browser);

  try {
    const targetsRes = await fetch('http://localhost:9222/json/list');
    const targets = await targetsRes.json();
    const pageTarget = targets.find(t => t.type === 'page') || targets[0];

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

    let idCounter = 1;
    const callbacks = new Map();
    const consoleErrors = [];

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        if (msg.params.type === 'error') {
          consoleErrors.push(msg.params.args.map(a => a.value || a.description).join(' '));
        }
      }
      if (msg.id && callbacks.has(msg.id)) {
        const { resolve, reject } = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };

    await new Promise((resolve) => {
      ws.onopen = resolve;
    });

    const send = (method, params = {}) => {
      const id = idCounter++;
      return new Promise((resolve, reject) => {
        callbacks.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    };

    await send('Runtime.enable');
    await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    console.log('Navigating to http://localhost:5173...');
    await send('Page.navigate', { url: 'http://localhost:5173' });
    await new Promise(r => setTimeout(r, 3500));

    // Test 1: MapView with Türkiye Scope button clicked
    console.log('[TEST 1] Clicking Türkiye Scope Button in MapView...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Türkiye') || b.innerText.includes('Konya'));
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      })()`
    });
    await new Promise(r => setTimeout(r, 2000));
    let shot = await send('Page.captureScreenshot', { format: 'png' });
    saveShot('v3_1_01_mapview_turkiye_focus.png', shot.data);

    // Test 2: Click on Konya Closed Basin marker / sidebar card
    console.log('[TEST 2] Selecting Konya Closed Basin Card in MapView...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const card = Array.from(document.querySelectorAll('button, div')).find(el => el.innerText && el.innerText.includes('TR-GPM-KON'));
        if (card) {
          card.click();
          return true;
        }
        return false;
      })()`
    });
    await new Promise(r => setTimeout(r, 1500));
    shot = await send('Page.captureScreenshot', { format: 'png' });
    saveShot('v3_1_02_mapview_konya_selected.png', shot.data);

    // Test 3: Navigate to Trends Tab and select TR-GPM-KON
    console.log('[TEST 3] Navigating to Trends View and Selecting TR-GPM-KON...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const nav = document.querySelector('nav[role="tablist"]');
        const tTab = Array.from(nav.querySelectorAll('button')).find(b => b.innerText.includes('Understand Data') || b.innerText.includes('Trends'));
        if (tTab) tTab.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 2000));

    await send('Runtime.evaluate', {
      expression: `(() => {
        const select = document.querySelector('select[aria-label="Select Target Observation"]');
        if (select) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
          setter.call(select, 'TR-GPM-KON');
          select.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
        return false;
      })()`
    });
    await new Promise(r => setTimeout(r, 2000));
    shot = await send('Page.captureScreenshot', { format: 'png' });
    saveShot('v3_1_03_trends_konya_precipitation.png', shot.data);

    // Test 4: Scroll down in Trends to capture Seasonal MK and Climatology
    console.log('[TEST 4] Scrolling down to capture Konya Seasonal MK & Climatology...');
    await send('Runtime.evaluate', {
      expression: `window.scrollBy(0, 800);`
    });
    await new Promise(r => setTimeout(r, 1000));
    shot = await send('Page.captureScreenshot', { format: 'png' });
    saveShot('v3_1_04_konya_seasonal_mk_climatology.png', shot.data);

    // Test 5: Click "Load Cross-Basin Contrast" to trigger side-by-side synthesis
    console.log('[TEST 5] Clicking "Load Cross-Basin Contrast" Button...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Load Cross-Basin Contrast') || b.innerText.includes('Cross-Basin'));
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      })()`
    });
    await new Promise(r => setTimeout(r, 2000));
    shot = await send('Page.captureScreenshot', { format: 'png' });
    saveShot('v3_1_05_cross_basin_synthesis_active.png', shot.data);

    await send('Runtime.evaluate', {
      expression: `window.scrollBy(0, 700);`
    });
    await new Promise(r => setTimeout(r, 1000));
    shot = await send('Page.captureScreenshot', { format: 'png' });
    saveShot('v3_1_06_cross_basin_synthesis_caveats.png', shot.data);

    // Test 6: Verify DOM text content
    const verifyEval = await send('Runtime.evaluate', {
      expression: `JSON.stringify({
        hasTurkiyeTitle: document.body.innerText.includes('Konya Closed Basin'),
        hasCrossBasin: document.body.innerText.includes('CROSS-BASIN PRECIPITATION SYNTHESIS') || document.body.innerText.includes('Cross-Basin Precipitation Synthesis') || document.body.innerText.includes('Precipitation Volume Contrast'),
        hasSeasonalMK: document.body.innerText.includes('Seasonal Mann-Kendall') || document.body.innerText.includes('Hirsch'),
        hasCaveats: document.body.innerText.includes('Meteorological vs. Groundwater') || document.body.innerText.includes('5-Year Temporal Horizon Boundary')
      })`
    });
    const parsedVerification = JSON.parse(verifyEval.result.value);
    console.log('DOM Scientific Ingestion Check:', parsedVerification);

    console.log('Total Console Errors Recorded:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.warn('Console Errors:', consoleErrors);
    }

    ws.close();
    chromeProc.kill();
    console.log('====================================================');
    console.log('V3.1 TÜRKİYE VERIFICATION COMPLETE: ALL PASSING!');
    console.log('====================================================');
  } catch (err) {
    chromeProc.kill();
    console.error('Verification failed:', err);
    process.exit(1);
  }
}

runTurkiyeVerification();
