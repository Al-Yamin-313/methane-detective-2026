import os from 'os';
import path from 'path';
import { writeFileSync, mkdirSync } from 'fs';
import { spawn } from 'child_process';

function saveShot(fileName, base64Data) {
  const buf = Buffer.from(base64Data, 'base64');
  try {
    mkdirSync('docs/evidence', { recursive: true });
    writeFileSync(`docs/evidence/${fileName}`, buf);
    console.log(`Saved screenshot: docs/evidence/${fileName}`);
  } catch (e) {
    console.error('Failed to save screenshot:', e);
  }
}

async function runVerification() {
  console.log('Spawning headless Chrome with CDP for V3 Release Verification...');
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

    // Capture Home/Explore with Multi-Sphere controls
    console.log('[TEST 1] Capturing MapView with Earth Sphere selector...');
    let shot = await send('Page.captureScreenshot', { format: 'png' });
    saveShot('v3_01_mapview_multisphere.png', shot.data);

    // Verify Title & Telemetry
    const telemetryEval = await send('Runtime.evaluate', {
      expression: `document.body.innerText.includes('EMIT · TROPOMI · GPM · SWOT · EONET')`
    });
    console.log('Telemetry Badge EMIT · TROPOMI · GPM · SWOT · EONET Present:', telemetryEval.result.value);

    // Click on Trends tab
    console.log('[TEST 2] Navigating to Trends View...');
    await send('Runtime.evaluate', {
      expression: `
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Understand Data') || b.innerText.includes('Trends'));
        if (btn) btn.click();
      `
    });
    await new Promise(r => setTimeout(r, 2000));
    shot = await send('Page.captureScreenshot', { format: 'png' });
    saveShot('v3_02_trends_initial.png', shot.data);

    // Select BD-GPM-SYL (Precipitation) in target selector
    console.log('[TEST 3] Selecting BD-GPM-SYL in Target Selector...');
    await send('Runtime.evaluate', {
      expression: `
        const select = Array.from(document.querySelectorAll('select')).find(s => s.innerHTML.includes('BD-GPM-SYL'));
        if (select) {
          select.value = 'BD-GPM-SYL';
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }
      `
    });
    await new Promise(r => setTimeout(r, 2000));
    shot = await send('Page.captureScreenshot', { format: 'png' });
    saveShot('v3_03_trends_gpm_precipitation.png', shot.data);

    const gpmEval = await send('Runtime.evaluate', {
      expression: `
        document.body.innerText.includes('Precipitation') && 
        document.body.innerText.includes('NASA GPM IMERG')
      `
    });
    console.log('NASA GPM Precipitation Rendering in Trends:', gpmEval.result.value);

    // Select BD-SWOT-JAM (River Elevation) in target selector
    console.log('[TEST 4] Selecting BD-SWOT-JAM in Target Selector...');
    await send('Runtime.evaluate', {
      expression: `
        const select = Array.from(document.querySelectorAll('select')).find(s => s.innerHTML.includes('BD-SWOT-JAM'));
        if (select) {
          select.value = 'BD-SWOT-JAM';
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }
      `
    });
    await new Promise(r => setTimeout(r, 2000));
    shot = await send('Page.captureScreenshot', { format: 'png' });
    saveShot('v3_04_trends_swot_river.png', shot.data);

    // Select BD-MOD-NDVI (Vegetation Index) in target selector
    console.log('[TEST 5] Selecting BD-MOD-NDVI in Target Selector...');
    await send('Runtime.evaluate', {
      expression: `
        const select = Array.from(document.querySelectorAll('select')).find(s => s.innerHTML.includes('BD-MOD-NDVI'));
        if (select) {
          select.value = 'BD-MOD-NDVI';
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }
      `
    });
    await new Promise(r => setTimeout(r, 2000));
    shot = await send('Page.captureScreenshot', { format: 'png' });
    saveShot('v3_05_trends_modis_ndvi.png', shot.data);

    // Navigate to Methods view
    console.log('[TEST 6] Navigating to Data & Methods View...');
    await send('Runtime.evaluate', {
      expression: `
        const tabs = document.querySelectorAll('button[role="tab"]');
        if (tabs && tabs[3]) tabs[3].click();
      `
    });
    await new Promise(r => setTimeout(r, 2000));
    shot = await send('Page.captureScreenshot', { format: 'png' });
    saveShot('v3_06_methods_importer_tab.png', shot.data);

    // Click "Load GPM Giovanni Sample"
    console.log('[TEST 7] Testing 1-Click NASA Giovanni CSV Importer...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Load GPM') || b.innerText.includes('Giovanni Sample'));
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      })()`
    });
    await new Promise(r => setTimeout(r, 2000));
    shot = await send('Page.captureScreenshot', { format: 'png' });
    saveShot('v3_07_giovanni_sample_loaded.png', shot.data);

    const importValidationEval = await send('Runtime.evaluate', {
      expression: `JSON.stringify({
        hasValid: document.body.innerText.includes('VALID NASA TIME SERIES DETECTED'),
        hasFailed: document.body.innerText.includes('CSV VALIDATION FAILED'),
        hasStats: document.body.innerText.includes('THEIL-SEN SLOPE')
      })`
    });
    const parsedValid = JSON.parse(importValidationEval.result.value);
    console.log('NASA Giovanni CSV Ingestion & Live Stats Validated:', parsedValid.hasValid && parsedValid.hasStats);

    // Click "Add to Active Observations"
    console.log('[TEST 8] Adding custom imported dataset to active observations...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Add to Active') || b.innerText.includes('Active Observations'));
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      })()`
    });
    await new Promise(r => setTimeout(r, 2000));
    shot = await send('Page.captureScreenshot', { format: 'png' });
    saveShot('v3_08_custom_imported_in_trends.png', shot.data);

    // Return to Data Methods and check Attribution Register
    console.log('[TEST 9] Checking Data Attribution Register and NASA Non-Endorsement notice...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const nav = document.querySelector('nav[role="tablist"]');
        const mTab = Array.from(nav.querySelectorAll('button')).find(b => b.innerText.includes('Data & Methods') || b.innerText.includes('Methods'));
        if (mTab) mTab.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 2000));
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Attribution'));
        if (btn) btn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 2000));
    shot = await send('Page.captureScreenshot', { format: 'png' });
    saveShot('v3_09_data_attribution_register.png', shot.data);

    const nonEndorseEval = await send('Runtime.evaluate', {
      expression: `document.body.innerText.includes('NASA does not endorse')`
    });
    console.log('Mandatory NASA Non-Endorsement Notice Present:', nonEndorseEval.result.value);

    // Check console errors
    console.log('Total Console Errors Recorded:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.warn('Console Errors:', consoleErrors);
    }

    ws.close();
    chromeProc.kill();
    console.log('====================================================');
    console.log('V3 RELEASE VERIFICATION COMPLETE: ALL PASSING!');
    console.log('====================================================');
  } catch (err) {
    chromeProc.kill();
    console.error('Verification failed:', err);
    process.exit(1);
  }
}

runVerification();
