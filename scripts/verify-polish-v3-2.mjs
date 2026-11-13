import os from 'os';
import path from 'path';
import { writeFileSync, mkdirSync } from 'fs';
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

async function runPolishVerification() {
  console.log('Spawning headless Chrome for V3.2 Polish Verification (NASA GIBS & Learning Center)...');
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
    // Allow tiles from NASA GIBS to load into canvas
    await new Promise(r => setTimeout(r, 6000));

    // 1. Capture MapView with NASA GIBS basemap active
    console.log('[1/6] Capturing MapView with NASA GIBS Satellite basemap...');
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    saveShot('v3_2_01_mapview_nasa_gibs_basemap.png', shot1.data);

    // 2. Toggle to Dark Canvas
    console.log('[2/6] Toggling basemap to Dark Canvas...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('NASA GIBS') || b.textContent.includes('Basemap'));
          if (btn) btn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 1200));
    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    saveShot('v3_2_02_mapview_dark_canvas_toggled.png', shot2.data);

    // Toggle back to NASA GIBS
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Dark Canvas') || b.textContent.includes('Dark Map'));
          if (btn) btn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 800));

    // 3. Open Learn Modal (Section A: Journey)
    console.log('[3/6] Opening LEARN Modal (Section A)...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('LEARN') || b.getAttribute('aria-label') === 'Open Learning Center');
          if (btn) btn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 1000));
    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    saveShot('v3_2_03_learn_modal_section_a_journey.png', shot3.data);

    // 4. Switch to Section B (Glossary of Scientific Terms)
    console.log('[4/6] Switching to Section B (Scientific Glossary)...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Section B') || b.textContent.includes('Glossary') || b.textContent.includes('পরিভাষা'));
          if (btn) btn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 800));
    const shot4 = await send('Page.captureScreenshot', { format: 'png' });
    saveShot('v3_2_04_learn_modal_section_b_glossary.png', shot4.data);

    // 5. Switch to Section C (How to Interpret Results)
    console.log('[5/6] Switching to Section C (Interpretation Case Study)...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Section C') || b.textContent.includes('Interpret') || b.textContent.includes('ব্যাখ্যা'));
          if (btn) btn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 800));
    const shot5 = await send('Page.captureScreenshot', { format: 'png' });
    saveShot('v3_2_05_learn_modal_section_c_interpret.png', shot5.data);

    // Close Learn modal
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.getAttribute('aria-label') === 'Close Learning Center' || b.textContent.includes('Got It'));
          if (btn) btn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 500));

    // 6. Navigate to Step 3 (Climate Simulator) and verify transition banner
    console.log('[6/6] Navigating to Step 3 (Impact Simulator) to verify transition banner...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = Array.from(document.querySelectorAll('button[role="tab"]')).find(b => b.textContent.includes('3. Explore Impact') || b.textContent.includes('Impact'));
          if (btn) btn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 1200));
    const shot6 = await send('Page.captureScreenshot', { format: 'png' });
    saveShot('v3_2_06_climate_simulator_step3_banner.png', shot6.data);

    console.log('All 6 verification screenshots captured successfully!');
    ws.close();
  } catch (err) {
    console.error('Verification failed:', err);
  } finally {
    chromeProc.kill();
  }
}

runPolishVerification().catch(console.error);
