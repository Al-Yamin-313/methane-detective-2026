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

async function verifyTurkiye() {
  console.log('Spawning headless Chrome for Türkiye alignment verification...');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromeProc = spawn(chromePath, [
    '--remote-debugging-port=9228',
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
      const res = await fetch('http://localhost:9228/json/version');
      ver = await res.json();
      break;
    } catch (e) {}
  }

  if (!ver) {
    chromeProc.kill();
    throw new Error('Failed to connect to Chrome on port 9228');
  }

  const listRes = await fetch('http://localhost:9228/json/list');
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
  await new Promise(r => setTimeout(r, 3000));

  // 1. In 2D Map: Click Türkiye Focus button
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const trBtn = btns.find(b => b.textContent && b.textContent.includes('Türkiye Focus'));
        if (trBtn) trBtn.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 2000));

  const shot1 = await send('Page.captureScreenshot', { format: 'png' });
  saveShot('turkiye_verified_01_real_map_focus.png', shot1.data);

  // 2. Click 3D Globe button
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const globeBtn = btns.find(b => b.textContent && b.textContent.includes('3D Globe'));
        if (globeBtn) globeBtn.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 2000));

  // 3. On 3D Globe: Click Explore Türkiye button
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const trGlobeBtn = btns.find(b => b.textContent && b.textContent.includes('Explore Türkiye'));
        if (trGlobeBtn) trGlobeBtn.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 2500));

  const shot2 = await send('Page.captureScreenshot', { format: 'png' });
  saveShot('turkiye_verified_02_3d_globe_turkiye_focus.png', shot2.data);

  ws.close();
  chromeProc.kill();
  console.log('Verification finished successfully!');
}

verifyTurkiye().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
