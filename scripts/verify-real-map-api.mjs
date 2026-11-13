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

async function runRealMapVerification() {
  console.log('Spawning headless Chrome for Real Map API verification...');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromeProc = spawn(chromePath, [
    '--remote-debugging-port=9227',
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
      const res = await fetch('http://localhost:9227/json/version');
      ver = await res.json();
      break;
    } catch (e) {}
  }

  if (!ver) {
    chromeProc.kill();
    throw new Error('Failed to connect to Chrome on port 9227');
  }

  const listRes = await fetch('http://localhost:9227/json/list');
  const pages = await listRes.json();
  const page = pages.find(p => p.type === 'page' && p.url.includes('localhost:5173')) || pages[0];

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
  };

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const msgId = id++;
    pending.set(msgId, { resolve, reject });
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });

  await new Promise(r => ws.onopen = r);

  await send('Page.enable');
  await send('DOM.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  console.log('Navigating to http://localhost:5173...');
  await send('Page.navigate', { url: 'http://localhost:5173' });
  await new Promise(r => setTimeout(r, 3500));

  // Shot 1: Initial real map API view (Esri World Satellite)
  const shot1 = await send('Page.captureScreenshot', { format: 'png' });
  saveShot('real_map_api_01_esri_satellite.png', shot1.data);

  // Click Global Earth
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const globalBtn = btns.find(b => b.textContent && (b.textContent.includes('All Sites') || b.textContent.includes('Global Earth')));
        if (globalBtn) globalBtn.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 2500));

  // Shot 2: Global Earth with Real Satellite API
  const shot2 = await send('Page.captureScreenshot', { format: 'png' });
  saveShot('real_map_api_02_global_earth.png', shot2.data);

  // Click NASA MODIS
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const nasaBtn = btns.find(b => b.textContent && b.textContent.includes('NASA MODIS'));
        if (nasaBtn) nasaBtn.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 2500));

  // Shot 3: NASA MODIS API
  const shot3 = await send('Page.captureScreenshot', { format: 'png' });
  saveShot('real_map_api_03_nasa_modis.png', shot3.data);

  ws.close();
  chromeProc.kill();
  console.log('Verification complete!');
}

runRealMapVerification().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
