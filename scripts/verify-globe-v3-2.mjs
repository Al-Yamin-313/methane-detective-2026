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

async function runGlobeVerification() {
  console.log('Spawning headless Chrome for 3D Full-Earth Globe verification...');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromeProc = spawn(chromePath, [
    '--remote-debugging-port=9226',
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
      const res = await fetch('http://localhost:9226/json/version');
      ver = await res.json();
      break;
    } catch (e) {}
  }

  if (!ver) {
    chromeProc.kill();
    throw new Error('Failed to connect to Chrome on port 9226');
  }

  console.log('Connected to Browser:', ver.Browser);

  try {
    const targetsRes = await fetch('http://localhost:9226/json/list');
    const targets = await targetsRes.json();
    const pageTarget = targets.find(t => t.type === 'page') || targets[0];

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

    let idCounter = 1;
    const callbacks = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
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
    // Wait for canvas texture to load and render
    await new Promise(r => setTimeout(r, 4000));

    // 1. Initial 3D Full-Earth Globe View
    console.log('[1/6] Capturing initial 3D Full-Earth Globe view...');
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    saveShot('v3_2_01_full_earth_globe_initial.png', shot1.data);

    // 2. Click "Explore Bangladesh" shortcut
    console.log('[2/6] Clicking "Explore Bangladesh" shortcut...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Bangladesh'));
          if (btn) btn.click();
        })()
      `
    });
    // Wait for smooth camera animation to complete
    await new Promise(r => setTimeout(r, 2000));
    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    saveShot('v3_2_02_globe_bangladesh_focus.png', shot2.data);

    // 3. Click "Explore Türkiye" shortcut
    console.log('[3/6] Clicking "Explore Türkiye" shortcut...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Türkiye') || b.textContent.includes('তুরস্ক'));
          if (btn) btn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 2000));
    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    saveShot('v3_2_03_globe_turkiye_focus.png', shot3.data);

    // 4. Click "Reset Full Earth"
    console.log('[4/6] Resetting back to Full Earth Globe...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Full Earth') || b.textContent.includes('সম্পূর্ণ পৃথিবী') || b.getAttribute('aria-label') === 'Reset View');
          if (btn) btn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 1800));
    const shot4 = await send('Page.captureScreenshot', { format: 'png' });
    saveShot('v3_2_04_globe_reset_full_earth.png', shot4.data);

    // 5. Switch to Regional GIS Map
    console.log('[5/6] Switching to Regional GIS Map...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Regional Map') || b.textContent.includes('মানচিত্রে'));
          if (btn) btn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 2500));
    const shot5 = await send('Page.captureScreenshot', { format: 'png' });
    saveShot('v3_2_05_regional_map_view.png', shot5.data);

    // 6. Return back to 3D Globe from Regional Map
    console.log('[6/6] Returning back to 3D Globe from Map...');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('3D Globe') || b.textContent.includes('গ্লোব'));
          if (btn) btn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 1500));
    const shot6 = await send('Page.captureScreenshot', { format: 'png' });
    saveShot('v3_2_06_returned_to_3d_globe.png', shot6.data);

    console.log('All 6 3D Globe verification screenshots captured successfully!');
    ws.close();
  } catch (err) {
    console.error('Globe verification failed:', err);
  } finally {
    chromeProc.kill();
  }
}

runGlobeVerification().catch(console.error);
